#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# 行者学社 线上验证脚本（只读）
# 用法：bash scripts/ops/xz-verify-online.sh
# 目标：
#   1. 验证 Admin 域名可访问
#   2. 验证 API 域名可访问
#   3. 验证 Admin API 无 token 返回 401
#   4. 验证 Admin API fake-token 返回 401
# ═══════════════════════════════════════════════════════════════

API_BASE="https://api.tenselog.cn"
ADMIN_URL="https://admin.tenselog.cn"
TMPFILE="$(mktemp /tmp/xz_verify.XXXXXX)"
trap 'rm -f "$TMPFILE"' EXIT

PASS=0
FAIL=0
BLOCKERS=()

echo ""
echo "══════════════════════════════════════"
echo "  行者学社 线上验证"
echo "══════════════════════════════════════"
echo ""

# ─── 1. Domain reachability ───
echo "── 1. 域名可访问性 ──"

for url in "$ADMIN_URL" "$API_BASE"; do
  code="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>&1 || true)"
  if [[ "$code" =~ ^[23][0-9]{2}$ ]]; then
    echo "  PASS: $url → $code"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $url → ${code:-unreachable}"
    FAIL=$((FAIL + 1))
  fi
done

echo ""

# ─── 2. Admin API no-token → 401 ──
echo "── 2. Admin API 无 token 鉴权 ──"

ADMIN_PATHS=(
  "/admin/orders"
  "/admin/crm/users"
  "/admin/finance/summary"
  "/admin/certificate-templates"
)

for path in "${ADMIN_PATHS[@]}"; do
  code="$(curl -sS -o "$TMPFILE" -w "%{http_code}" --connect-timeout 10 "${API_BASE}${path}" 2>&1 || true)"
  if [ "$code" = "401" ]; then
    echo "  PASS: ${path} no-token → $code"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: ${path} no-token → $code (expected 401)"
    FAIL=$((FAIL + 1))
    BLOCKERS+=("${path} no-token returned ${code}, expected 401")
  fi
done

echo ""

# ─── 3. Admin API fake-token → 401 ──
echo "── 3. Admin API fake-token 鉴权 ──"

FAKE_PATHS=(
  "/admin/orders"
  "/admin/certificate-templates"
)

for path in "${FAKE_PATHS[@]}"; do
  code="$(curl -sS -o "$TMPFILE" -w "%{http_code}" --connect-timeout 10 \
    -H "Authorization: Bearer fake-token" \
    "${API_BASE}${path}" 2>&1 || true)"
  if [ "$code" = "401" ]; then
    echo "  PASS: ${path} fake-token → $code"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: ${path} fake-token → $code (expected 401)"
    FAIL=$((FAIL + 1))
    BLOCKERS+=("${path} fake-token returned ${code}, expected 401")
  fi
done

echo ""

# ─── Conclusion ──
echo "══════════════════════════════════════"
echo "  结果: PASS=$PASS  FAIL=$FAIL"
echo "══════════════════════════════════════"

if [ ${#BLOCKERS[@]} -gt 0 ]; then
  echo ""
  echo "══════════════════════════════════════"
  echo "  P0 BLOCKER: Admin API is not protected."
  echo "══════════════════════════════════════"
  for b in "${BLOCKERS[@]}"; do
    echo "  ❌ $b"
  done
  echo ""
  echo "ONLINE VERIFY FAILED"
  exit 1
fi

echo ""
echo "ONLINE VERIFY PASS"
exit 0
