#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# 行者学社 本地发版前检查脚本（只读）
# 用法：bash scripts/ops/xz-preflight-local.sh
# 目标：确认当前本地环境是否适合发版
# ═══════════════════════════════════════════════════════════════

PROJECT_ROOT="${XZ_PROJECT_ROOT:-/Users/chen/projects/xingzhe-v3}"
SERVER_USER="${SERVER_USER:-ubuntu}"
SERVER_HOST="${SERVER_HOST:-82.156.129.114}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/xingzhev3.pem}"

WARNINGS=0
FAILURES=0

echo ""
echo "══════════════════════════════════════"
echo "  行者学社 Preflight 检查"
echo "══════════════════════════════════════"
echo ""

# ─── 1. 确认在 Mac 本机 ──
echo "── 1. 运行环境 ──"
WHOAMI="$(whoami)"
if [[ "$WHOAMI" == "chen" ]]; then
  echo "  PASS: 当前在 Mac 本机（whoami=chen）"
else
  HOSTNAME="$(hostname 2>/dev/null || true)"
  echo "  FAIL: 当前用户是 '$WHOAMI'，期望 'chen' — 你似乎不在 Mac 本机"
  echo "    若在服务器上请先执行 'exit' 回到 Mac"
  FAILURES=$((FAILURES + 1))
fi

# ─── 2. 项目路径 ──
echo "── 2. 项目路径 ──"
if [ -d "$PROJECT_ROOT" ]; then
  echo "  PASS: $PROJECT_ROOT 存在"
else
  echo "  FAIL: $PROJECT_ROOT 不存在"
  FAILURES=$((FAILURES + 1))
fi

# ─── 3. SSH key ──
echo "── 3. SSH key ──"
if [ -f "$SSH_KEY" ]; then
  echo "  PASS: $SSH_KEY 存在"
else
  echo "  FAIL: SSH key 不存在: $SSH_KEY"
  FAILURES=$((FAILURES + 1))
fi

# ─── 4. Git status ──
echo "── 4. Git 状态 ──"
cd "$PROJECT_ROOT"
if output="$(git status --short 2>&1)"; then
  if [ -z "$output" ]; then
    echo "  PASS: 工作区干净"
  else
    echo "  WARNING: 工作区不干净 — 以下文件未提交："
    echo "$output" | sed 's/^/    /'
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  FAIL: git status 失败 — $output"
  FAILURES=$((FAILURES + 1))
fi

# ─── 5. Git lock 检查 ──
echo "── 5. Git lock ──"
LOCK_FILES=(
  "$PROJECT_ROOT/.git/index.lock"
  "$PROJECT_ROOT/.git/HEAD.lock"
)
LOCKS_FOUND=0
for lf in "${LOCK_FILES[@]}"; do
  if [ -f "$lf" ]; then
    echo "  WARNING: $lf 存在 — 可能有残留 git 进程"
    LOCKS_FOUND=$((LOCKS_FOUND + 1))
  fi
done
if [ $LOCKS_FOUND -eq 0 ]; then
  echo "  PASS: 无 Git lock"
else
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 6. 最近 5 个 commit ──
echo "── 6. 最近 commit ──"
git log -5 --oneline 2>/dev/null | sed 's/^/  /' || echo "  FAIL: git log 失败"

# ─── 7. 当前 tag ──
echo "── 7. 当前 tag ──"
tag="$(git describe --tags --abbrev=0 2>/dev/null || echo '(无 tag)')"
echo "  tag: $tag"

# ─── 8. Build 产物 ──
echo "── 8. Build 产物 ──"
for dist in "$PROJECT_ROOT/backend/dist/main.js" "$PROJECT_ROOT/apps/admin/dist/index.html"; do
  if [ -f "$dist" ]; then
    echo "  PASS: $dist"
  else
    echo "  WARNING: $dist 不存在 — 部署前需要先 build"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# ─── 9. 远程 PM2 ──
echo "── 9. 远程 PM2 ──"
if pm2_output="$(ssh -o ConnectTimeout=10 -i "$SSH_KEY" "${SERVER_USER}@${SERVER_HOST}" \
  'pm2 jlist 2>/dev/null' 2>/dev/null || true)"; then
  pm2_count="$(echo "$pm2_output" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo '?')"
  xingzhe_online="$(echo "$pm2_output" | python3 -c "import sys,json; d=json.load(sys.stdin); print(sum(1 for p in d if p.get('name','')=='xingzhe-api' and p.get('pm2_env',{}).get('status')=='online'))" 2>/dev/null || echo '?')"
  echo "  PM2 进程数: $pm2_count"
  echo "  xingzhe-api online: $xingzhe_online"
  if [ "$xingzhe_online" = "0" ] || [ "$xingzhe_online" = "?" ]; then
    echo "  WARNING: xingzhe-api 可能不在线"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "  PASS: xingzhe-api 在线"
  fi
else
  echo "  WARNING: 无法连接服务器或获取 PM2 状态"
  WARNINGS=$((WARNINGS + 1))
fi

# ─── 10. 远程关键目录 ──
echo "── 10. 远程关键目录 ──"
ssh -o ConnectTimeout=10 -i "$SSH_KEY" "${SERVER_USER}@${SERVER_HOST}" '
  for d in /srv/xingzhe/backend /var/www/xingzhe-admin /data/xingzhe/uploads; do
    if [ -d "$d" ]; then echo "  PASS: $d"; else echo "  FAIL: $d 不存在"; fi
  done
' 2>/dev/null || echo "  WARNING: 服务器连接失败"

# ─── Conclusion ──
echo ""
echo "══════════════════════════════════════"
echo "  结果: FAILURES=$FAILURES  WARNINGS=$WARNINGS"
echo "══════════════════════════════════════"

if [ "$FAILURES" -gt 0 ]; then
  echo ""
  echo "PREFLIGHT FAILED — 请先解决失败项再发版"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo ""
  echo "PREFLIGHT PASS WITH WARNINGS — 建议处理警告后发版"
  exit 0
else
  echo ""
  echo "PREFLIGHT PASS"
  exit 0
fi
