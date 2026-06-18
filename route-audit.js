const fs = require('fs');
const path = require('path');

const activityControllerTS =
  path.join(__dirname, 'backend/src/activity/activity.controller.ts');

const activityControllerJS =
  path.join(__dirname, 'backend/dist/activity/activity.controller.js');

console.log('\n🧠 NestJS Runtime Route Audit\n');

// 1. 检查 TS 是否存在 API
function checkTS() {
  const content = fs.readFileSync(activityControllerTS, 'utf-8');

  const apis = [
    'register',
    'pay',
    'qr',
    'checkin',
  ];

  console.log('📦 TS Source Check:');

  apis.forEach(api => {
    console.log(
      ` - ${api}:`,
      content.includes(api) ? '✔ EXISTS' : '❌ MISSING',
    );
  });
}

// 2. 检查 JS 是否同步
function checkJS() {
  if (!fs.existsSync(activityControllerJS)) {
    console.log('\n❌ DIST FILE NOT FOUND');
    return;
  }

  const content = fs.readFileSync(activityControllerJS, 'utf-8');

  console.log('\n📦 JS Runtime Check:');

  const routes = [
    '/activity',
    'register',
    'pay',
    'checkin',
  ];

  routes.forEach(r => {
    console.log(
      ` - ${r}:`,
      content.includes(r) ? '✔ EXISTS' : '❌ MISSING',
    );
  });
}

// 3. 检查 dist 是否最新
function checkFreshness() {
  const tsStat = fs.statSync(activityControllerTS);
  const jsStat = fs.existsSync(activityControllerJS)
    ? fs.statSync(activityControllerJS)
    : null;

  console.log('\n⏱ Build Freshness:');

  if (!jsStat) {
    console.log('❌ No compiled JS');
    return;
  }

  console.log('TS modified:', tsStat.mtime);
  console.log('JS modified:', jsStat.mtime);

  const diff = tsStat.mtime - jsStat.mtime;

  if (diff > 0) {
    console.log('🚨 OUTDATED BUILD (TS newer than JS)');
  } else {
    console.log('✔ BUILD SYNCED');
  }
}

// run
checkTS();
checkJS();
checkFreshness();