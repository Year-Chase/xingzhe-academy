#!/usr/bin/env node
/**
 * 行者学社 QA Regression Agent v1
 *
 * 运行: node tools/qa-agent/qa-runner.js
 * 依赖: Node.js 18+ (原生 fetch / fs / child_process)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Config ──────────────────────────────────────────────────
const PROJECT_ROOT = process.env.QA_PROJECT_ROOT || path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(PROJECT_ROOT, '.local', 'qa-agent', 'reports');
const ENV_FILE    = path.join(PROJECT_ROOT, '.local', 'qa-agent', 'qa.env');
const BACKEND_URL = process.env.QA_BACKEND_URL || 'http://127.0.0.1:3000';

let blocking = [];
let warnings = [];
let passed   = [];
let apiResults  = [];
let grepResults = [];
let llmReview   = null;

// ── Helpers ─────────────────────────────────────────────────
function log(msg) { console.log(`[QA] ${msg}`); }
function warn(msg) { console.warn(`[QA] ⚠  ${msg}`); }
function fail(msg) { console.error(`[QA] ❌ ${msg}`); }

function readFileSafe(fp) {
  try { return fs.readFileSync(path.join(PROJECT_ROOT, fp), 'utf-8'); } catch { return null; }
}

function readDirSafe(fp) {
  try { return fs.readdirSync(path.join(PROJECT_ROOT, fp)); } catch { return []; }
}

function parseEnvFile(fpath) {
  const map = {};
  if (!fs.existsSync(fpath)) return map;
  const lines = fs.readFileSync(fpath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return map;
}

// ── Step 1: Load env ────────────────────────────────────────
log('== Step 1: Load Environment ==');
const env = parseEnvFile(ENV_FILE);
if (Object.keys(env).length === 0) {
  warn(`qa.env not found at ${ENV_FILE} — LLM review disabled`);
} else {
  log(`provider=${env.QA_PROVIDER || 'unset'} model=${env.QA_MODEL || 'unset'}`);
}

// ── Step 2: Git status check ─────────────────────────────────
log('\n== Step 2: Git Status Check ==');
let gitOutput = '';
try { gitOutput = execSync('git status --short', { cwd: PROJECT_ROOT, encoding: 'utf-8' }); } catch {}
const staged = gitOutput.split('\n').filter(l => l && !l.startsWith('?? ') && !l.startsWith(' M '));
const sensitivePatterns = ['backend/data', 'project.private.config.json', '.local/qa-agent'];
for (const pattern of sensitivePatterns) {
  const matches = staged.filter(l => l.includes(pattern));
  if (matches.length > 0) {
    blocking.push({ check: 'git-staging', file: pattern, detail: `Staged files matching ${pattern}` });
    fail(`BLOCKING: sensitive file staged — ${pattern}`);
  }
}
const untrackedUploads = gitOutput.split('\n').filter(l => l.includes('backend/uploads') && l.startsWith('??'));
if (untrackedUploads.length > 0) {
  warnings.push({ check: 'git-untracked', file: 'backend/uploads', detail: 'Untracked upload files exist' });
  warn('Untracked upload files in backend/uploads');
}

// ── Step 3: Static grep checks ──────────────────────────────
log('\n== Step 3: Static Grep Checks ==');

function grepCheck(label, patterns, fileGlob, blockOnMatch) {
  for (const pat of patterns) {
    let cmd;
    if (fileGlob) {
      cmd = `grep -rn "${pat.replace(/"/g, '\\"')}" ${fileGlob} 2>/dev/null || true`;
    } else {
      cmd = `grep -rn "${pat.replace(/"/g, '\\"')}" backend/src apps/admin/src apps/weapp/src 2>/dev/null || true`;
    }
    let out = '';
    try { out = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).trim(); } catch { out = ''; }
    out = out.split('\n').filter(l => l && !l.includes('node_modules') && !l.includes('.git')).slice(0, 10).join('\n');
    if (out && blockOnMatch) {
      blocking.push({ check: label, pattern: pat, detail: out.slice(0, 200) });
      fail(`BLOCKING: ${label} — found "${pat}"`);
    } else if (out) {
      warnings.push({ check: label, pattern: pat, detail: out.slice(0, 200) });
      warn(`${label} — found "${pat}"`);
    } else {
      passed.push({ check: label, pattern: pat });
      log(`PASS: ${label} — "${pat}" not found`);
    }
    grepResults.push({ check: label, pattern: pat, found: !!out });
  }
}

// 1. register/pay HTTP routes restored?
grepCheck('register-pay-routes', [
  "@Post\\('activity/:id/register'\\)",
  "@Post\\('activity/:id/pay'\\)"
], 'backend/src/activity/activity.controller.ts', true);

// 2. active status usage in backend — BLOCKING (exclude English prose like "No active QR found")
grepCheck('active-status-backend', [
  "status.*[:=].*'active'",
  'status.*[:=].*"active"'
], 'backend/src', true);

// 3. getRegisteredCount uses orderRepo
grepCheck('registeredCount-source', [
  'orderRepo.count.*PAID'
], 'backend/src/activity/activity-flow.service.ts', true);

// 4. refund modifies registration — BLOCKING (only in refund context, not getUserStatus QR expiry)
(function() {
  const content = readFileSafe('backend/src/activity/activity-flow.service.ts') || '';
  // Extract just the refund method body
  const refundMatch = content.match(/async refund\([\s\S]*?^\s{2}\}/m);
  const refundBody = refundMatch ? refundMatch[0] : '';
  const hasRegMutation = /reg\.status/.test(refundBody) || /regRepo\.(save|update)\(reg\)/.test(refundBody);
  if (hasRegMutation) {
    blocking.push({ check: 'refund-registration', detail: 'refund method modifies registration.status' });
    fail('BLOCKING: refund modifies registration — must not mutate Registration');
  } else {
    passed.push({ check: 'refund-registration' });
    log('PASS: refund-registration — refund does not modify registration');
  }
  grepResults.push({ check: 'refund-registration', found: hasRegMutation });
})();

// 5. PENDING label must be "交易处理中" — BLOCKING if missing or wrong
(function() {
  const content = readFileSafe('apps/admin/src/pages/order/OrderList.vue') || '';
  const hasCorrect = /PENDING:\s*'交易处理中'/.test(content);
  const hasWrong = /PENDING:\s*'[^']*待支付[^']*'/.test(content);
  if (hasWrong) {
    blocking.push({ check: 'pending-label', detail: 'PENDING label contains "待支付" — must be "交易处理中"' });
    fail('BLOCKING: PENDING label is "待支付*", must be "交易处理中"');
  } else if (!hasCorrect) {
    blocking.push({ check: 'pending-label', detail: 'PENDING label not set to "交易处理中"' });
    fail('BLOCKING: PENDING label missing — must be "交易处理中"');
  } else {
    passed.push({ check: 'pending-label' });
    log('PASS: pending-label — "交易处理中"');
  }
  grepResults.push({ check: 'pending-label', found: hasCorrect && !hasWrong });
})();

// 6. getOrders default excludes PENDING — PASS if excluded, BLOCKING if not
(function() {
  const content = readFileSafe('backend/src/activity/activity-flow.service.ts') || '';
  // Extract the getOrders method body
  const methodMatch = content.match(/async getOrders\([\s\S]*?\n  \}/);
  const methodBody = methodMatch ? methodMatch[0] : '';

  // Check if PENDING is excluded by default (when no status filter provided)
  const excludesPendingByDefault =
    /status\s*!=\s*:pend/.test(methodBody) ||
    /status\s*!=\s*'PENDING'/.test(methodBody) ||
    /status\s*!=\s*"PENDING"/.test(methodBody);

  if (excludesPendingByDefault) {
    passed.push({ check: 'orders-exclude-pending' });
    log('PASS: orders-exclude-pending — getOrders default-excludes PENDING');
  } else {
    blocking.push({ check: 'orders-exclude-pending', detail: 'getOrders does not default-exclude PENDING' });
    fail('BLOCKING: getOrders does not default-exclude PENDING');
  }
  grepResults.push({ check: 'orders-exclude-pending', found: !excludesPendingByDefault });
})();

// 7. app.module.ts registers ActivityRefund + ActivityInvoice — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasBoth = content.includes('ActivityRefund') && content.includes('ActivityInvoice');
  if (!hasBoth) {
    blocking.push({ check: 'appmodule-entities', detail: 'ActivityRefund/ActivityInvoice missing from app.module.ts entities' });
    fail('BLOCKING: ActivityRefund and/or ActivityInvoice not registered in app.module.ts');
  } else {
    passed.push({ check: 'appmodule-entities' });
    log('PASS: appmodule-entities — ActivityRefund + ActivityInvoice registered');
  }
  grepResults.push({ check: 'appmodule-entities', found: hasBoth });
})();

// 8. activity.module.ts registers both in forFeature — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity.module.ts') || '';
  const hasBoth = content.includes('ActivityRefund') && content.includes('ActivityInvoice');
  if (!hasBoth) {
    blocking.push({ check: 'activitymodule-entities', detail: 'ActivityRefund/ActivityInvoice missing from activity.module.ts forFeature' });
    fail('BLOCKING: ActivityRefund and/or ActivityInvoice not in activity.module.ts forFeature');
  } else {
    passed.push({ check: 'activitymodule-entities' });
    log('PASS: activitymodule-entities — ActivityRefund + ActivityInvoice in forFeature');
  }
  grepResults.push({ check: 'activitymodule-entities', found: hasBoth });
})();

// 9. app.module.ts registers UserTag + UserNote — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasBoth = content.includes('UserTag') && content.includes('UserNote');
  if (!hasBoth) {
    blocking.push({ check: 'appmodule-crm-entities', detail: 'UserTag/UserNote missing from app.module.ts entities' });
    fail('BLOCKING: UserTag and/or UserNote not registered in app.module.ts');
  } else {
    passed.push({ check: 'appmodule-crm-entities' });
    log('PASS: appmodule-crm-entities — UserTag + UserNote registered');
  }
  grepResults.push({ check: 'appmodule-crm-entities', found: hasBoth });
})();

// 10. activity.module.ts registers UserTag + UserNote in forFeature — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity.module.ts') || '';
  const hasBoth = content.includes('UserTag') && content.includes('UserNote');
  if (!hasBoth) {
    blocking.push({ check: 'activitymodule-crm-entities', detail: 'UserTag/UserNote missing from activity.module.ts forFeature' });
    fail('BLOCKING: UserTag and/or UserNote not in activity.module.ts forFeature');
  } else {
    passed.push({ check: 'activitymodule-crm-entities' });
    log('PASS: activitymodule-crm-entities — UserTag + UserNote in forFeature');
  }
  grepResults.push({ check: 'activitymodule-crm-entities', found: hasBoth });
})();

// 11. CRM controller registered in activity.module.ts — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity.module.ts') || '';
  const hasCrmCtrl = content.includes('AdminCrmController');
  if (!hasCrmCtrl) {
    blocking.push({ check: 'crm-controller-registered', detail: 'AdminCrmController not registered in activity.module.ts' });
    fail('BLOCKING: AdminCrmController not registered');
  } else {
    passed.push({ check: 'crm-controller-registered' });
    log('PASS: crm-controller-registered — AdminCrmController registered');
  }
  grepResults.push({ check: 'crm-controller-registered', found: hasCrmCtrl });
})();

// 12. CRM controller must not mutate Registration/Order/Refund/Invoice — BLOCKING
(function() {
  const content = readFileSafe('backend/src/activity/admin-crm.controller.ts') || '';
  const hasCoreMutation =
    /regRepo\.(save|update|delete|remove|insert)/.test(content) ||
    /orderRepo\.(save|update|delete|remove|insert)/.test(content) ||
    /refundRepo\.(save|update|delete|remove|insert)/.test(content) ||
    /invoiceRepo\.(save|update|delete|remove|insert)/.test(content);
  if (hasCoreMutation) {
    blocking.push({ check: 'crm-no-core-mutation', detail: 'CRM controller modifies Registration/Order/Refund/Invoice' });
    fail('BLOCKING: CRM controller must not mutate core entities (Registration/Order/Refund/Invoice)');
  } else {
    passed.push({ check: 'crm-no-core-mutation' });
    log('PASS: crm-no-core-mutation — CRM does not modify core entity state');
  }
  grepResults.push({ check: 'crm-no-core-mutation', found: hasCoreMutation });
})();

// 13. CRM GET /admin/crm/users route decorator exists — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/admin-crm.controller.ts') || '';
  const hasRoute = /@Get\('users'\)/.test(content);
  if (!hasRoute) {
    blocking.push({ check: 'crm-users-route', detail: 'CRM GET users route decorator missing' });
    fail('BLOCKING: CRM GET /admin/crm/users route not found');
  } else {
    passed.push({ check: 'crm-users-route' });
    log('PASS: crm-users-route — GET /admin/crm/users route exists');
  }
  grepResults.push({ check: 'crm-users-route', found: hasRoute });
})();

// 14. app.module.ts registers UserProfile — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasEntity = content.includes('UserProfile');
  if (!hasEntity) {
    blocking.push({ check: 'appmodule-userprofile', detail: 'UserProfile missing from app.module.ts entities' });
    fail('BLOCKING: UserProfile not registered in app.module.ts');
  } else {
    passed.push({ check: 'appmodule-userprofile' });
    log('PASS: appmodule-userprofile — UserProfile registered');
  }
  grepResults.push({ check: 'appmodule-userprofile', found: hasEntity });
})();

// 15. app.module.ts registers UserInviteRecord — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasEntity = content.includes('UserInviteRecord');
  if (!hasEntity) {
    blocking.push({ check: 'appmodule-invite-record', detail: 'UserInviteRecord missing from app.module.ts entities' });
    fail('BLOCKING: UserInviteRecord not registered in app.module.ts');
  } else {
    passed.push({ check: 'appmodule-invite-record' });
    log('PASS: appmodule-invite-record — UserInviteRecord registered');
  }
  grepResults.push({ check: 'appmodule-invite-record', found: hasEntity });
})();

// 16. app.module.ts registers ActivityInviteRecord — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasEntity = content.includes('ActivityInviteRecord');
  if (!hasEntity) {
    blocking.push({ check: 'appmodule-activity-invite-record', detail: 'ActivityInviteRecord missing from app.module.ts entities' });
    fail('BLOCKING: ActivityInviteRecord not registered in app.module.ts');
  } else {
    passed.push({ check: 'appmodule-activity-invite-record' });
    log('PASS: appmodule-activity-invite-record — ActivityInviteRecord registered');
  }
  grepResults.push({ check: 'appmodule-activity-invite-record', found: hasEntity });
})();

// 17. V2.4C: User entity registered in app.module.ts — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const hasUser = content.includes("import { User } from './users/entities/user.entity'") || content.includes("import { User } from './users/entities/user.entity");
  if (!hasUser) {
    blocking.push({ check: 'appmodule-user', detail: 'User entity not registered in app.module.ts' });
    fail('BLOCKING: User entity not registered in app.module.ts root entities');
  } else {
    passed.push({ check: 'appmodule-user' });
    log('PASS: appmodule-user — User registered in app.module.ts');
  }
  grepResults.push({ check: 'appmodule-user', found: hasUser });
})();

// 18. V2.4C: User entity in activity.module.ts forFeature — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity.module.ts') || '';
  const hasUser = content.includes("import { User } from '../users/entities/user.entity'") || content.includes("import { User } from '../users/entities/user.entity");
  if (!hasUser) {
    blocking.push({ check: 'activitymodule-user', detail: 'User entity not in activity.module.ts forFeature' });
    fail('BLOCKING: User entity not registered in activity.module.ts');
  } else {
    passed.push({ check: 'activitymodule-user' });
    log('PASS: activitymodule-user — User in activity.module.ts forFeature');
  }
  grepResults.push({ check: 'activitymodule-user', found: hasUser });
})();

// 19. V2.4C: PATCH /admin/crm/users/:userId/type route exists — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/admin-crm.controller.ts') || '';
  const hasRoute = /@Patch\('users\/:userId\/type'\)/.test(content);
  if (!hasRoute) {
    blocking.push({ check: 'crm-type-route', detail: 'PATCH /admin/crm/users/:userId/type route missing' });
    fail('BLOCKING: CRM type update route not found');
  } else {
    passed.push({ check: 'crm-type-route' });
    log('PASS: crm-type-route — PATCH /admin/crm/users/:userId/type exists');
  }
  grepResults.push({ check: 'crm-type-route', found: hasRoute });
})();

// 20. V2.4C: CRM controller injects User repository — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/admin-crm.controller.ts') || '';
  const hasUserRepo = content.includes('userRepo') || content.includes('@InjectRepository(User)');
  if (!hasUserRepo) {
    blocking.push({ check: 'crm-user-repo', detail: 'CRM controller does not inject User repository' });
    fail('BLOCKING: CRM controller missing User repository injection');
  } else {
    passed.push({ check: 'crm-user-repo' });
    log('PASS: crm-user-repo — CRM controller injects User repository');
  }
  grepResults.push({ check: 'crm-user-repo', found: hasUserRepo });
})();

// ── V2.5A Checks ──

// 21. Activity entity has requiredUserInfoFields — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/entities/activity.entity.ts') || '';
  const has = content.includes('requiredUserInfoFields');
  if (!has) {
    blocking.push({ check: 'v25a-required-fields', detail: 'Activity entity missing requiredUserInfoFields' });
    fail('BLOCKING: Activity entity missing requiredUserInfoFields');
  } else {
    passed.push({ check: 'v25a-required-fields' });
    log('PASS: v25a-required-fields — Activity has requiredUserInfoFields');
  }
  grepResults.push({ check: 'v25a-required-fields', found: has });
})();

// 22. Activity entity has groupQrType — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/entities/activity.entity.ts') || '';
  const has = content.includes('groupQrType') && content.includes('groupQrImageUrl');
  if (!has) {
    blocking.push({ check: 'v25a-groupqr', detail: 'Activity entity missing groupQrType/groupQrImageUrl' });
    fail('BLOCKING: Activity entity missing groupQr fields');
  } else {
    passed.push({ check: 'v25a-groupqr' });
    log('PASS: v25a-groupqr — Activity has groupQrType + groupQrImageUrl');
  }
  grepResults.push({ check: 'v25a-groupqr', found: has });
})();

// 23. Activity entity has memory fields — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/entities/activity.entity.ts') || '';
  const has = content.includes('memoryImages') && content.includes('memoryText');
  if (!has) {
    blocking.push({ check: 'v25a-memory', detail: 'Activity entity missing memoryImages/memoryText' });
    fail('BLOCKING: Activity entity missing memory fields');
  } else {
    passed.push({ check: 'v25a-memory' });
    log('PASS: v25a-memory — Activity has memoryImages + memoryText');
  }
  grepResults.push({ check: 'v25a-memory', found: has });
})();

// 24. ActivityRegistrationInfo entity exists — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/entities/activity-registration-info.entity.ts') || '';
  const has = content.includes('ActivityRegistrationInfo') && content.includes('realName');
  if (!has) {
    blocking.push({ check: 'v25a-reginfo-entity', detail: 'ActivityRegistrationInfo entity missing' });
    fail('BLOCKING: ActivityRegistrationInfo entity not found');
  } else {
    passed.push({ check: 'v25a-reginfo-entity' });
    log('PASS: v25a-reginfo-entity — ActivityRegistrationInfo exists');
  }
  grepResults.push({ check: 'v25a-reginfo-entity', found: has });
})();

// 25. ActivityRegistrationInfo registered in app.module.ts — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/app.module.ts') || '';
  const has = content.includes('ActivityRegistrationInfo');
  if (!has) {
    blocking.push({ check: 'v25a-reginfo-registered', detail: 'ActivityRegistrationInfo not in app.module.ts' });
    fail('BLOCKING: ActivityRegistrationInfo not registered in app.module.ts');
  } else {
    passed.push({ check: 'v25a-reginfo-registered' });
    log('PASS: v25a-reginfo-registered — ActivityRegistrationInfo in app.module.ts');
  }
  grepResults.push({ check: 'v25a-reginfo-registered', found: has });
})();

// 26. Admin activity registrations endpoint exists — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/admin-activity.controller.ts') || '';
  const has = content.includes('/:id/registrations') || content.includes('getRegistrations');
  if (!has) {
    blocking.push({ check: 'v25a-admin-registrations', detail: 'GET /admin/activity/:id/registrations route missing' });
    fail('BLOCKING: Admin activity registrations endpoint not found');
  } else {
    passed.push({ check: 'v25a-admin-registrations' });
    log('PASS: v25a-admin-registrations — GET /admin/activity/:id/registrations exists');
  }
  grepResults.push({ check: 'v25a-admin-registrations', found: has });
})();

// 27. enrollPay supports registrationInfo validation — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity-flow.service.ts') || '';
  const has = content.includes('requiredUserInfoFields') && content.includes('registrationInfo');
  if (!has) {
    blocking.push({ check: 'v25a-enrollpay-reginfo', detail: 'enrollPay does not validate registrationInfo' });
    fail('BLOCKING: enrollPay missing registrationInfo validation');
  } else {
    passed.push({ check: 'v25a-enrollpay-reginfo' });
    log('PASS: v25a-enrollpay-reginfo — enrollPay validates registrationInfo');
  }
  grepResults.push({ check: 'v25a-enrollpay-reginfo', found: has });
})();

// 28. GET /activity/:id returns requiredUserInfoFields — BLOCKING if missing
(function() {
  const content = readFileSafe('backend/src/activity/activity.controller.ts') || '';
  const has = content.includes('requiredUserInfoFields') && content.includes('getActivityDetail');
  if (!has) {
    warnings.push({ check: 'v25a-wechat-detail-fields', detail: 'GET /activity/:id may not return V2.5A fields' });
    warn('V2.5A: GET /activity/:id should return requiredUserInfoFields');
  } else {
    passed.push({ check: 'v25a-wechat-detail-fields' });
    log('PASS: v25a-wechat-detail-fields — GET /activity/:id returns V2.5A fields');
  }
  grepResults.push({ check: 'v25a-wechat-detail-fields', found: has });
})();

// ── V2.5B Checks ──

// 29. Admin activity page has NO ActivityTemplate — BLOCKING if found
(function() {
  const acFile = readFileSafe('apps/admin/src/pages/activity/ActivityList.vue') || '';
  const hasTemplate = acFile.includes('ActivityTemplate') || acFile.includes('activity-template');
  if (hasTemplate) {
    blocking.push({ check: 'v25b-no-template', detail: 'Admin activity page references ActivityTemplate' });
    fail('BLOCKING: Admin activity page must not use ActivityTemplate');
  } else {
    passed.push({ check: 'v25b-no-template' });
    log('PASS: v25b-no-template — no ActivityTemplate in Admin');
  }
  grepResults.push({ check: 'v25b-no-template', found: hasTemplate });
})();

// 30. Admin activity page uses registrationStartTime NOT registerStartTime
(function() {
  const acFile = readFileSafe('apps/admin/src/pages/activity/ActivityList.vue') || '';
  const usesRegisterStart = /registerStartTime[^R]|'registerStartTime'|"registerStartTime"/.test(acFile);
  if (usesRegisterStart) {
    blocking.push({ check: 'v25b-reg-field-name', detail: 'Admin page uses registerStartTime instead of registrationStartTime' });
    fail('BLOCKING: Admin page must use registrationStartTime, not registerStartTime');
  } else {
    passed.push({ check: 'v25b-reg-field-name' });
    log('PASS: v25b-reg-field-name — uses registrationStartTime/registrationEndTime');
  }
  grepResults.push({ check: 'v25b-reg-field-name', found: usesRegisterStart });
})();

// 31. Admin activity page supports V2.5B fields (requiredUserInfoFields + groupQr in main form)
(function() {
  const acFile = readFileSafe('apps/admin/src/pages/activity/ActivityList.vue') || '';
  const hasRequired = acFile.includes('requiredUserInfoFields');
  const hasGroupQr = acFile.includes('groupQrType') && acFile.includes('groupQrImageUrl');
  if (!hasRequired || !hasGroupQr) {
    blocking.push({ check: 'v25b-admin-fields', detail: `Admin page missing V2.5B fields: required=${hasRequired} groupQr=${hasGroupQr}` });
    fail('BLOCKING: Admin page missing V2.5B fields');
  } else {
    passed.push({ check: 'v25b-admin-fields' });
    log('PASS: v25b-admin-fields — requiredUserInfoFields + groupQr in Admin form');
  }
  grepResults.push({ check: 'v25b-admin-fields', found: hasRequired && hasGroupQr });
})();

// 32. Admin page uses idCardNo mask function
(function() {
  const acFile = readFileSafe('apps/admin/src/pages/activity/ActivityList.vue') || '';
  const hasMask = acFile.includes('maskIdCard');
  if (!hasMask) {
    warnings.push({ check: 'v25b-idcard-mask', detail: 'Admin page may not have idCardNo masking' });
    warn('V2.5B: Admin page should mask idCardNo in registration info');
  } else {
    passed.push({ check: 'v25b-idcard-mask' });
    log('PASS: v25b-idcard-mask — Admin page masks idCardNo');
  }
  grepResults.push({ check: 'v25b-idcard-mask', found: hasMask });
})();

// 33. V2.5B: Memory moved to separate drawer — PASS (has openMemory + memoryDrawer)
(function() {
  const acFile = readFileSafe('apps/admin/src/pages/activity/ActivityList.vue') || '';
  const hasMemoryBtn = acFile.includes('openMemory') && acFile.includes('memoryDrawer');
  if (!hasMemoryBtn) {
    warnings.push({ check: 'v25b-memory-drawer', detail: 'Memory fields not in separate drawer' });
    warn('V2.5B: Memory fields should be in a separate drawer with "回忆" button');
  } else {
    passed.push({ check: 'v25b-memory-drawer' });
    log('PASS: v25b-memory-drawer — Memory fields in separate drawer with 回忆 button');
  }
  grepResults.push({ check: 'v25b-memory-drawer', found: hasMemoryBtn });
})();

// ── V2.5C Checks ──

// 34. Registration-info page exists — BLOCKING if missing
(function() {
  const dir = readDirSafe('apps/weapp/src/pages/activity/registration-info') || [];
  const hasPage = dir.length > 0;
  const pageContent = readFileSafe('apps/weapp/src/pages/activity/registration-info/index.tsx') || '';
  if (!hasPage || !pageContent) {
    blocking.push({ check: 'v25c-reginfo-page', detail: 'Registration-info page not found' });
    fail('BLOCKING: Registration-info page missing');
  } else {
    passed.push({ check: 'v25c-reginfo-page' });
    log('PASS: v25c-reginfo-page — registration-info page exists');
  }
  grepResults.push({ check: 'v25c-reginfo-page', found: hasPage && !!pageContent });
})();

// 35. Detail page reads requiredUserInfoFields — BLOCKING if missing
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || '';
  const has = content.includes('requiredUserInfoFields');
  if (!has) {
    blocking.push({ check: 'v25c-detail-required', detail: 'Detail page does not read requiredUserInfoFields' });
    fail('BLOCKING: Detail page must read requiredUserInfoFields');
  } else {
    passed.push({ check: 'v25c-detail-required' });
    log('PASS: v25c-detail-required — detail page reads requiredUserInfoFields');
  }
  grepResults.push({ check: 'v25c-detail-required', found: has });
})();

// 36. Detail page navigates to registration-info — BLOCKING if missing
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || '';
  const has = content.includes('registration-info');
  if (!has) {
    blocking.push({ check: 'v25c-detail-navigate', detail: 'Detail page does not navigate to registration-info' });
    fail('BLOCKING: Detail page must navigate to registration-info when required fields exist');
  } else {
    passed.push({ check: 'v25c-detail-navigate' });
    log('PASS: v25c-detail-navigate — detail page navigates to registration-info');
  }
  grepResults.push({ check: 'v25c-detail-navigate', found: has });
})();

// 37. Detail page shows group Qr — BLOCKING if missing
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || '';
  const has = content.includes('groupQr') || content.includes('showGroupQr') || content.includes('hasGroupQr');
  if (!has) {
    blocking.push({ check: 'v25c-groupqr', detail: 'Detail page does not show group QR' });
    fail('BLOCKING: Detail page must show group QR for paid users');
  } else {
    passed.push({ check: 'v25c-groupqr' });
    log('PASS: v25c-groupqr — detail page shows group QR');
  }
  grepResults.push({ check: 'v25c-groupqr', found: has });
})();

// 38. Registration-info page has idCardNo X/x validation
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/registration-info/index.tsx') || '';
  const has = /idCardRx|idCard\s*.*regexp|17.*Xx|Xx\]/.test(content);
  if (!has) {
    warnings.push({ check: 'v25c-idcard-regex', detail: 'Registration-info page may not validate idCard X/x' });
    warn('V2.5C: Registration-info page should validate 15/18-digit + X/x idCardNo');
  } else {
    passed.push({ check: 'v25c-idcard-regex' });
    log('PASS: v25c-idcard-regex — registration-info validates idCard X/x');
  }
  grepResults.push({ check: 'v25c-idcard-regex', found: has });
})();

// 39. Detail page does NOT use register/pay old endpoints
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || '';
  const hasOld = content.includes('/activity/') && (content.includes('/register') || content.includes('/pay'));
  // Only flag if it uses the old register/pay routes (not enroll-pay)
  const hasOldRegister = content.includes("activity/:id/register'") || content.includes('/register?userId');
  const hasOldPay = content.includes("activity/:id/pay'") || content.includes('/pay?userId');
  if (hasOldRegister || hasOldPay) {
    blocking.push({ check: 'v25c-old-routes', detail: 'Detail page uses old register/pay routes' });
    fail('BLOCKING: Detail page must not use old register/pay routes');
  } else {
    passed.push({ check: 'v25c-old-routes' });
    log('PASS: v25c-old-routes — detail page does not use old register/pay');
  }
  grepResults.push({ check: 'v25c-old-routes', found: hasOldRegister || hasOldPay });
})();

// 40. Detail page uses enroll-pay (not register/pay)
(function() {
  const content = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || '';
  const has = content.includes('enroll-pay');
  if (!has) {
    blocking.push({ check: 'v25c-enrollpay', detail: 'Detail page does not use enroll-pay' });
    fail('BLOCKING: Detail page must use enroll-pay');
  } else {
    passed.push({ check: 'v25c-enrollpay' });
    log('PASS: v25c-enrollpay — detail page uses enroll-pay');
  }
  grepResults.push({ check: 'v25c-enrollpay', found: has });
})();

// 41. V2.5C: NO xingzhe_reginfo_pending in code — BLOCKING if found
(function() {
  const weappDir = readDirSafe('apps/weapp/src') || [];
  let foundStorage = false
  for (const entry of ['pages/activity/detail/index.tsx', 'pages/activity/registration-info/index.tsx']) {
    const content = readFileSafe('apps/weapp/src/' + entry) || ''
    if (content.includes('xingzhe_reginfo_pending')) foundStorage = true
  }
  // Also grep all weapp src files
  const detailContent = readFileSafe('apps/weapp/src/pages/activity/detail/index.tsx') || ''
  const regInfoContent = readFileSafe('apps/weapp/src/pages/activity/registration-info/index.tsx') || ''
  const allContent = detailContent + regInfoContent
  const hasStorageRegInfo = allContent.includes('xingzhe_reginfo_pending')
  if (hasStorageRegInfo) {
    blocking.push({ check: 'v25c-no-storage-reginfo', detail: 'Code saves registrationInfo/idCardNo to storage' });
    fail('BLOCKING: Must not store registrationInfo/idCardNo in storage');
  } else {
    passed.push({ check: 'v25c-no-storage-reginfo' });
    log('PASS: v25c-no-storage-reginfo — no registrationInfo in storage');
  }
  grepResults.push({ check: 'v25c-no-storage-reginfo', found: hasStorageRegInfo });
})();

async function main() {
// ── Step 4: API checks ──────────────────────────────────────
log('\n== Step 4: API Checks ==');
const apiConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'qa-api-checks.json'), 'utf-8'));

for (const ep of apiConfig.endpoints) {
  const url = `${BACKEND_URL}${ep.path}`;
  log(`  ${ep.method} ${ep.path}`);
  try {
    const resp = await fetch(url, { method: ep.method, signal: AbortSignal.timeout(5000) });
    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    apiResults.push({ method: ep.method, path: ep.path, status: resp.status, ok: resp.ok, preview: text.slice(0, 200) });
    if (resp.status >= 500) {
      blocking.push({ check: 'api', path: ep.path, status: resp.status, detail: text.slice(0, 200) });
      fail(`BLOCKING: ${ep.method} ${ep.path} → ${resp.status}`);
    } else if (!json && ep.required) {
      blocking.push({ check: 'api-json', path: ep.path, detail: 'Response is not valid JSON' });
      fail(`BLOCKING: ${ep.method} ${ep.path} → non-JSON response`);
    } else if (resp.status === 404 && ep.blockOn.includes(404)) {
      blocking.push({ check: 'api-404', path: ep.path, status: 404 });
      fail(`BLOCKING: ${ep.method} ${ep.path} → 404`);
    } else {
      passed.push({ check: 'api', path: ep.path, status: resp.status });
      log(`  PASS: ${resp.status}`);
    }
  } catch (e) {
    const isNetwork = e.cause?.code === 'ECONNREFUSED' || e.message?.includes('fetch');
    apiResults.push({ method: ep.method, path: ep.path, status: 0, ok: false, error: e.message });
    if (ep.blockOn.includes('network') || isNetwork) {
      blocking.push({ check: 'api-network', path: ep.path, detail: e.message });
      fail(`BLOCKING: ${ep.method} ${ep.path} → network error (is backend running?)`);
    }
  }
}

// ── Step 4.5: V2.4 User Smoke Test ──────────────────────────
log('\n== Step 4.5: V2.4 User Smoke Test ==');
let smokeUserId = null;
try {
  // 1. Login
  const loginResp = await fetch(`${BACKEND_URL}/users/wechat-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'mock-code-v24-smoke', nickname: 'QA行者', avatarUrl: '', gender: 'unknown' }),
    signal: AbortSignal.timeout(5000),
  });
  const loginData = await loginResp.json();
  apiResults.push({ method: 'POST', path: '/users/wechat-login', status: loginResp.status, ok: loginResp.ok, preview: JSON.stringify(loginData).slice(0, 200) });

  if (loginResp.status >= 500) {
    blocking.push({ check: 'v24-login', status: loginResp.status, detail: 'POST /users/wechat-login returned 500' });
    fail('BLOCKING: V2.4 login returned 500');
  } else if (!loginData?.user?.id) {
    blocking.push({ check: 'v24-login', detail: 'POST /users/wechat-login missing user.id' });
    fail('BLOCKING: V2.4 login — no user.id in response');
  } else {
    smokeUserId = loginData.user.id;
    passed.push({ check: 'v24-login' });
    log(`PASS: v24-login — user.id=${smokeUserId} openid=${loginData.user.openid}`);
  }

  // 2. Get profile
  if (smokeUserId) {
    const profileResp = await fetch(`${BACKEND_URL}/users/${smokeUserId}/profile`, {
      signal: AbortSignal.timeout(5000),
    });
    const profileData = await profileResp.json();
    apiResults.push({ method: 'GET', path: `/users/${smokeUserId}/profile`, status: profileResp.status, ok: profileResp.ok, preview: JSON.stringify(profileData).slice(0, 200) });

    if (profileResp.status >= 500) {
      blocking.push({ check: 'v24-profile-get', status: profileResp.status, detail: `GET /users/${smokeUserId}/profile returned 500` });
      fail('BLOCKING: V2.4 profile GET returned 500');
    } else if (profileResp.status !== 200) {
      blocking.push({ check: 'v24-profile-get', status: profileResp.status, detail: `GET /users/${smokeUserId}/profile returned ${profileResp.status}` });
      fail(`BLOCKING: V2.4 profile GET returned ${profileResp.status}`);
    } else {
      passed.push({ check: 'v24-profile-get' });
      log('PASS: v24-profile-get — profile returned 200');
    }

    // 3. Update profile
    const patchResp = await fetch(`${BACKEND_URL}/users/${smokeUserId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'QA行者更新', phone: '13800000000', birthYearMonth: '1990-01', identityType: '普通用户' }),
      signal: AbortSignal.timeout(5000),
    });
    const patchData = await patchResp.json();
    apiResults.push({ method: 'PATCH', path: `/users/${smokeUserId}/profile`, status: patchResp.status, ok: patchResp.ok, preview: JSON.stringify(patchData).slice(0, 200) });

    if (patchResp.status >= 500) {
      blocking.push({ check: 'v24-profile-patch', status: patchResp.status, detail: `PATCH /users/${smokeUserId}/profile returned 500` });
      fail('BLOCKING: V2.4 profile PATCH returned 500');
    } else {
      passed.push({ check: 'v24-profile-patch' });
      log('PASS: v24-profile-patch — profile updated');
    }

    // 4. Verify update persisted
    const verifyResp = await fetch(`${BACKEND_URL}/users/${smokeUserId}/profile`, {
      signal: AbortSignal.timeout(5000),
    });
    const verifyData = await verifyResp.json();
    apiResults.push({ method: 'GET', path: `/users/${smokeUserId}/profile (verify)`, status: verifyResp.status, ok: verifyResp.ok, preview: JSON.stringify(verifyData).slice(0, 200) });

    if (verifyResp.status >= 500) {
      blocking.push({ check: 'v24-profile-verify', status: verifyResp.status, detail: 'Profile verify GET returned 500' });
      fail('BLOCKING: V2.4 profile verify returned 500');
    } else if (verifyData.nickname !== 'QA行者更新') {
      warnings.push({ check: 'v24-profile-verify', detail: `Expected nickname=QA行者更新, got ${verifyData.nickname}` });
      warn(`V2.4 profile verify: nickname mismatch (got "${verifyData.nickname}")`);
    } else {
      passed.push({ check: 'v24-profile-verify' });
      log('PASS: v24-profile-verify — nickname updated correctly');
    }
  }
} catch (e) {
  apiResults.push({ method: 'POST', path: '/users/wechat-login (smoke)', status: 0, ok: false, error: e.message });
  blocking.push({ check: 'v24-smoke-network', detail: e.message });
  fail(`BLOCKING: V2.4 smoke test failed — ${e.message}`);
}

// ── Step 4.6: V2.4C CRM User Field Check ──────────────────────
log('\n== Step 4.6: V2.4C CRM Check ==');
try {
  const crmResp = await fetch(`${BACKEND_URL}/admin/crm/users?page=1&limit=5`, {
    signal: AbortSignal.timeout(10000),
  });
  const crmData = await crmResp.json();
  apiResults.push({ method: 'GET', path: '/admin/crm/users (V2.4C)', status: crmResp.status, ok: crmResp.ok, preview: JSON.stringify(crmData).slice(0, 200) });

  if (crmResp.status >= 500) {
    blocking.push({ check: 'v24c-crm-list', status: crmResp.status, detail: 'CRM users list returned 500' });
    fail('BLOCKING: V2.4C CRM users list returned 500');
  } else {
    // Verify at least one item has real User fields
    const items = crmData?.items || [];
    if (items.length > 0) {
      const item = items[0];
      const requiredFields = ['nickname', 'avatarUrl', 'gender', 'birthYearMonth', 'identityType', 'registeredAt', 'lastLoginAt'];
      const missing = requiredFields.filter(f => !(f in item));
      if (missing.length > 0) {
        warnings.push({ check: 'v24c-crm-fields', detail: `CRM user items missing fields: ${missing.join(', ')}` });
        warn(`V2.4C CRM: missing fields in user items — ${missing.join(', ')}`);
      } else {
        passed.push({ check: 'v24c-crm-fields' });
        log('PASS: v24c-crm-fields — all real User fields present in CRM list');
      }
    }
    passed.push({ check: 'v24c-crm-list' });
    log('PASS: v24c-crm-list — CRM users list returned 200');
  }

  // Test PATCH type endpoint if smoke user exists
  if (smokeUserId) {
    const typeResp = await fetch(`${BACKEND_URL}/admin/crm/users/${smokeUserId}/type`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityType: 'QA测试' }),
      signal: AbortSignal.timeout(5000),
    });
    const typeData = await typeResp.json();
    apiResults.push({ method: 'PATCH', path: `/admin/crm/users/${smokeUserId}/type`, status: typeResp.status, ok: typeResp.ok, preview: JSON.stringify(typeData).slice(0, 200) });

    if (typeResp.status >= 500) {
      blocking.push({ check: 'v24c-type-patch', status: typeResp.status, detail: 'CRM type PATCH returned 500' });
      fail('BLOCKING: V2.4C CRM type PATCH returned 500');
    } else {
      passed.push({ check: 'v24c-type-patch' });
      log('PASS: v24c-type-patch — identityType updated');
    }
  }
} catch (e) {
  apiResults.push({ method: 'GET', path: '/admin/crm/users (V2.4C)', status: 0, ok: false, error: e.message });
  warnings.push({ check: 'v24c-crm-network', detail: e.message });
  warn(`V2.4C CRM check failed: ${e.message}`);
}

// ── Step 5: Collect file content for LLM ───────────────────
log('\n== Step 5: Collect Files for LLM Review ==');
const scopeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'qa-scope.json'), 'utf-8'));
let collectedCode = '';
for (const section of scopeConfig.sections) {
  const fp = path.join(PROJECT_ROOT, section.path);
  const stat = fs.existsSync(fp) ? fs.statSync(fp) : null;
  if (!stat) { collectedCode += `\n// FILE NOT FOUND: ${section.path}\n`; continue; }
  if (stat.isDirectory()) {
    const entries = readDirSafe(section.path);
    for (const entry of entries) {
      const full = path.join(fp, entry);
      const innerStat = fs.existsSync(full) ? fs.statSync(full) : null;
      if (innerStat?.isFile() && scopeConfig.extensions.some(ext => entry.endsWith(ext))) {
        let content = readFileSafe(path.relative(PROJECT_ROOT, full));
        if (content) {
          if (content.length > scopeConfig.maxFileChars) content = content.slice(0, scopeConfig.maxFileChars) + '\n// ... [truncated]';
          collectedCode += `\n// --- ${section.label || section.path}/${entry} ---\n${content}\n`;
        }
      }
    }
  } else {
    let content = readFileSafe(section.path);
    if (content) {
      if (content.length > scopeConfig.maxFileChars) content = content.slice(0, scopeConfig.maxFileChars) + '\n// ... [truncated]';
      collectedCode += `\n// --- ${section.label || section.path} ---\n${content}\n`;
    }
  }
}
log(`  Collected ~${collectedCode.length} chars`);

// ── Step 6: LLM Review (Volcengine / OpenAI-compatible) ─────
log('\n== Step 6: LLM Review ==');
const apiKey = env.ARK_API_KEY;
if (!apiKey) {
  warn('No ARK_API_KEY configured — skipping LLM review');
  llmReview = { skipped: true, reason: 'ARK_API_KEY not set' };
} else {
  const rules = readFileSafe('tools/qa-agent/qa-business-rules.md') || '';
  const systemPrompt = `你是行者学社项目的 QA Regression Agent。
只基于提供的代码和业务规则进行审查。只输出 JSON，不要 markdown 代码块，不要任何其他文本。直接输出 JSON 对象。

业务规则：
${rules}`;

  const userPrompt = `请审查以下代码和检查结果，判断是否有业务红线违规。

确定性检查结果：
Blocking: ${JSON.stringify(blocking)}
Warnings: ${JSON.stringify(warnings)}
Passed: ${passed.length} checks

API 结果：
${JSON.stringify(apiResults)}

代码文件：
${collectedCode.slice(0, 30000)}

请返回 JSON：
{
  "blocking": ["描述每个阻塞项"],
  "warnings": ["描述每个警告项"],
  "passed": ["通过的检查"],
  "summary": "1-3句总结",
  "recommendation": "PASS" | "FAIL"
}`;

  try {
    const resp = await fetch(`${env.QA_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.QA_MODEL || 'doubao-pro-32k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await resp.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    // Extract JSON from possible markdown code blocks
    let content = rawContent;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) content = codeBlockMatch[1].trim();
    try { llmReview = JSON.parse(content); } catch { llmReview = { raw: rawContent.slice(0, 500), parseError: true }; warnings.push({ check: 'llm-parse', detail: 'LLM returned non-JSON' }); }
    log(`  LLM recommendation: ${llmReview?.recommendation || 'unknown'}`);
  } catch (e) {
    warn(`LLM call failed: ${e.message}`);
    llmReview = { error: e.message };
    warnings.push({ check: 'llm-error', detail: e.message });
  }
}

// ── Step 7: Report ───────────────────────────────────────────
log('\n== Step 7: Generate Report ==');
fs.mkdirSync(REPORTS_DIR, { recursive: true });
const timestamp = new Date().toISOString();

// ── Sanitize: strip potential full idCardNo from any text ──
function sanitize(o) {
  if (typeof o === 'string') return o.replace(/\b(?:\d{15}|\d{17}[\dXx])\b/g, (m) => m.slice(0, 3) + '***********' + m.slice(-4).toUpperCase());
  if (Array.isArray(o)) return o.map(sanitize);
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = sanitize(o[k]); return r; }
  return o;
}
const safeApiResults = sanitize(apiResults);
const safeBlocking = sanitize(blocking);
const safeWarnings = sanitize(warnings);

const reportJson = {
  timestamp,
  provider: env.QA_PROVIDER || 'none',
  model: env.QA_MODEL || 'none',
  deterministicChecks: { blocking: safeBlocking, warnings: safeWarnings, passed },
  apiResults: safeApiResults,
  grepResults,
  llmReview,
  blockingCount: blocking.length,
  warningCount: warnings.length,
  recommendation: blocking.length > 0 ? 'FAIL' : (llmReview?.recommendation || 'PASS'),
};

const reportMd = [
  '# QA Regression Agent v1 报告',
  `**时间**: ${timestamp}`,
  `**Provider**: ${env.QA_PROVIDER || 'none'}  **Model**: ${env.QA_MODEL || 'none'}`,
  '',
  '## API 检查结果',
  ...safeApiResults.map(r => `- ${r.method} ${r.path} → ${r.status || 'ERR'} ${r.ok ? '✅' : '❌'}`),
  '',
  '## 静态规则检查',
  `- Blocking: ${blocking.length}`,
  ...safeBlocking.map(b => `  - ❌ ${b.check}: ${b.pattern || b.detail || ''}`),
  `- Warnings: ${warnings.length}`,
  ...safeWarnings.map(w => `  - ⚠ ${w.check}: ${w.pattern || w.detail || ''}`),
  `- Passed: ${passed.length}`,
  '',
  '## LLM 审查',
  llmReview ? (llmReview.skipped ? '⏭ 跳过 (无 ARK_API_KEY)' : `- Recommendation: ${llmReview.recommendation || 'unknown'}\n- Summary: ${llmReview.summary || 'none'}`) : '- 未执行',
  '',
  '## 最终判定',
  `**Blocking**: ${blocking.length}  **Warnings**: ${warnings.length}`,
  `**Recommendation**: ${blocking.length > 0 ? 'FAIL' : 'PASS'}`,
  blocking.length > 0 ? '\n### Blocking 详情\n' + blocking.map(b => `- **${b.check}**: ${b.path || b.file || ''} — ${b.detail || ''}`).join('\n') : '',
].join('\n');

fs.writeFileSync(path.join(REPORTS_DIR, 'latest.json'), JSON.stringify(reportJson, null, 2));
fs.writeFileSync(path.join(REPORTS_DIR, 'latest.md'), reportMd);

console.log('\n' + reportMd);
console.log(`\nReports saved to ${REPORTS_DIR}`);

// ── Exit ─────────────────────────────────────────────────────
if (blocking.length > 0) {
  console.log('\n❌ QA BLOCKING — 存在阻塞项，建议停止并等待修复。');
  process.exit(1);
} else {
  console.log('\n✅ QA PASS');
  process.exit(0);
}
}

main().catch((err) => { console.error(err); process.exit(1); });
