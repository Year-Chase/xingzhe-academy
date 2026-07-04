#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# 行者学社 部署前 Release 备份脚本
# 用法：bash scripts/ops/xz-backup-release.sh
# 目标：
#   备份线上当前 release 产物到 /data/xingzhe/backups/releases/
#   不备份 .env / node_modules / 数据库 / uploads
# ═══════════════════════════════════════════════════════════════

# ─── Config ───
SERVER_USER="${SERVER_USER:-ubuntu}"
SERVER_HOST="${SERVER_HOST:-82.156.129.114}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/xingzhev3.pem}"
REMOTE_BACKUP_DIR="/data/xingzhe/backups"
TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
BACKUP_PATH="${REMOTE_BACKUP_DIR}/releases/${TIMESTAMP}"

SSH_CMD="ssh -o ConnectTimeout=10 -i ${SSH_KEY} ${SERVER_USER}@${SERVER_HOST}"

echo ""
echo "══════════════════════════════════════"
echo "  行者学社 Release 备份"
echo "  TIMESTAMP: $TIMESTAMP"
echo "══════════════════════════════════════"
echo ""

# ─── Preflight: confirm running on Mac, not server ───
WHOAMI="$(whoami)"
if [[ "$WHOAMI" != "chen" ]]; then
  HOSTNAME="$(hostname 2>/dev/null || true)"
  PWD="$(pwd)"
  echo "WARNING: 当前用户是 '$WHOAMI'，期望 'chen'"
  echo "  hostname: ${HOSTNAME:-unknown}"
  echo "  pwd:      $PWD"
  echo "  如果你在服务器上，请先执行 'exit' 回到 Mac 终端"
  read -r -p "是否继续？(y/N) " yn
  if [[ ! "$yn" =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
  fi
fi

# ─── Preflight: SSH key ───
if [ ! -f "$SSH_KEY" ]; then
  echo "ERROR: SSH key 不存在: $SSH_KEY"
  exit 1
fi
echo "  PASS: SSH key 存在"

# ─── Preflight: server connectivity ───
if ! $SSH_CMD 'echo ok' >/dev/null 2>&1; then
  echo "ERROR: 无法连接到服务器 $SERVER_USER@$SERVER_HOST"
  exit 1
fi
echo "  PASS: 服务器可连接"

# ─── Preflight: server directories ───
echo ""
echo "── 检查服务器关键目录 ──"

for dir in /srv/xingzhe/backend/dist /var/www/xingzhe-admin; do
  if $SSH_CMD "test -d $dir" 2>/dev/null; then
    echo "  PASS: $dir 存在"
  else
    echo "  ERROR: $dir 不存在"
    exit 1
  fi
done

# ─── Backup ───
echo ""
echo "── 开始备份 ──"

$SSH_CMD "set -e
  mkdir -p '${BACKUP_PATH}/backend-dist' '${BACKUP_PATH}/xingzhe-admin'
  rsync -a /srv/xingzhe/backend/dist/ '${BACKUP_PATH}/backend-dist/' --delete
  rsync -a /var/www/xingzhe-admin/   '${BACKUP_PATH}/xingzhe-admin/'   --delete
"

echo "  PASS: 备份完成"

# ─── Verify backup ───
echo ""
echo "── 验证备份 ──"

$SSH_CMD "set -e
  test -f '${BACKUP_PATH}/backend-dist/main.js' && echo '  PASS: backend-dist/main.js' || echo '  FAIL: backend-dist 不完整'
  test -f '${BACKUP_PATH}/xingzhe-admin/index.html' && echo '  PASS: xingzhe-admin/index.html' || echo '  FAIL: xingzhe-admin 不完整'
"

echo ""
echo "══════════════════════════════════════"
echo "  BACKUP_TS=$TIMESTAMP"
echo "  BACKUP_PATH=$BACKUP_PATH"
echo "══════════════════════════════════════"
echo ""
echo "备份完成。现在可以安全执行部署。"
exit 0
