#!/bin/bash
# ============================================================
# P1 全量验收脚本
# 用法: ./p1-full-verify.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3000
BASE="http://localhost:$PORT"
PASS=0; FAIL=0

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'
ok()  { echo -e "  ${G}✓ PASS${N}  $1"; PASS=$((PASS+1)); }
bad() { echo -e "  ${R}✗ FAIL${N}  $1 — $2"; FAIL=$((FAIL+1)); }
step(){ echo -e "\n${C}▶ $1${N}"; }

echo "============================================"
echo "  P1 Activity 全量验收"
echo "============================================"

# ──── 1. Install & Start Backend ────
step "1. 后端安装依赖并启动"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules/@nestjs" ]; then
  echo "  安装后端依赖..."
  npm install
fi
lsof -ti tcp:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
npx nest start 2>&1 &
PID=$!
echo "  后端 PID: $PID，等待启动..."
for i in $(seq 1 30); do
  if curl -s "$BASE/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
HEALTH=$(curl -s "$BASE/health")
echo "$HEALTH" | grep -q '"ok"' && ok "后端启动成功" || bad "后端启动失败" "$HEALTH"

# ──── 2. API 验证 ────
step "2. API 验证"

step "2a. GET /activity (列表)"
R=$(curl -s "$BASE/activity")
LEN=$(echo "$R" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
echo "  活动数量: $LEN"
[ "$LEN" -gt 0 ] 2>/dev/null && ok "活动列表 ($LEN 条)" || bad "活动列表为空" "$R"

step "2b. GET /activity/1 (详情)"
R=$(curl -s "$BASE/activity/1")
echo "$R" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert d.get('title'), 'title missing'
assert d.get('location'), 'location missing'
assert d.get('capacity',0)>0, 'capacity missing'
print(f\"  title: {d['title']}\")
print(f\"  location: {d['location']}\")
print(f\"  capacity: {d['capacity']}\")
" 2>&1 && ok "活动详情完整" || bad "活动详情缺失" "$R"

step "2c. GET /activity/1/status?userId=tester (NOT_REGISTERED)"
R=$(curl -s "$BASE/activity/1/status?userId=tester")
echo "$R" | grep -q '"NOT_REGISTERED"' && ok "未报名状态正确" || bad "状态错误" "$R"

step "2d. POST /activity/1/register?userId=tester (REGISTERED)"
R=$(curl -s -X POST "$BASE/activity/1/register?userId=tester")
echo "$R" | grep -q '"REGISTERED"' && ok "报名成功" || bad "报名失败" "$R"

step "2e. GET /activity/1/status?userId=tester (应为 REGISTERED)"
R=$(curl -s "$BASE/activity/1/status?userId=tester")
echo "$R" | grep -q '"REGISTERED"' && ok "状态 REGISTERED" || bad "状态错误" "$R"

step "2f. POST /activity/1/pay?userId=tester (PAID)"
R=$(curl -s -X POST "$BASE/activity/1/pay?userId=tester")
echo "$R" | grep -q '"PAID"' && ok "支付成功" || bad "支付失败" "$R"

step "2g. GET /activity/1/qr?userId=tester (ACTIVE + code)"
R=$(curl -s "$BASE/activity/1/qr?userId=tester")
CODE=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
STATUS=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
[ "$STATUS" = "ACTIVE" ] && [ -n "$CODE" ] && ok "QR 生成 (code: ${CODE:0:12}...)" || bad "QR 失败" "$R"

step "2h. POST /activity/1/checkin {code} (CHECKED_IN)"
R=$(curl -s -X POST "$BASE/activity/1/checkin" -H "Content-Type: application/json" -d "{\"code\":\"$CODE\"}")
echo "$R" | grep -q '"CHECKED_IN"' && ok "核销成功" || bad "核销失败" "$R"

step "2i. GET /activity/1/status?userId=tester (应为 CHECKED_IN)"
R=$(curl -s "$BASE/activity/1/status?userId=tester")
echo "$R" | grep -q '"CHECKED_IN"' && ok "状态 CHECKED_IN" || bad "状态错误" "$R"

# ──── 3. 状态机验证 ────
step "3. 状态机完整性"

step "3a. 非法跳转: PAY 后再次 PAY"
R=$(curl -s -X POST "$BASE/activity/1/pay?userId=tester")
echo "$R" | grep -q "Bad Request\|Cannot pay" && ok "重复 PAY 被拒绝" || bad "重复 PAY 未拒绝" "$R"

step "3b. 非法跳转: CHECKED_IN 后再次 QR"
R=$(curl -s "$BASE/activity/1/qr?userId=tester")
echo "$R" | grep -q "Bad Request\|Cannot generate" && ok "CHECKED_IN 后 QR 被拒绝" || bad "状态保护失效" "$R"

step "3c. 新用户完整链路 (userId=verify)"
R1=$(curl -s -X POST "$BASE/activity/1/register?userId=verify" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
R2=$(curl -s -X POST "$BASE/activity/1/pay?userId=verify" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
R3=$(curl -s "$BASE/activity/1/qr?userId=verify" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
if [ "$R1" = "REGISTERED" ] && [ "$R2" = "PAID" ] && [ "$R3" = "ACTIVE" ]; then
  ok "状态机闭环: REGISTERED → PAID → ACTIVE"
else
  bad "状态机断裂" "$R1 → $R2 → $R3"
fi

# ──── 4. 前端安装 ────
step "4. 前端依赖"
cd "$SCRIPT_DIR/apps/h5"
[ -d "node_modules/@tarojs" ] || { echo "  安装 H5 依赖..."; npm install; }
ok "H5 依赖就绪"

cd "$SCRIPT_DIR/apps/weapp"
[ -d "node_modules/@tarojs" ] || { echo "  安装 WeApp 依赖..."; npm install; }
ok "WeApp 依赖就绪"

# ──── 5. Report ────
kill $PID 2>/dev/null || true

echo ""
echo "============================================"
echo "  P1 RESULT"
echo "============================================"
echo -e "  ${G}PASS: $PASS${N}  ${R}FAIL: $FAIL${N}"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${G}┌──────────────────────────────────────┐"
  echo -e "  │  ✓ P1 全部通过 — 进入 P2 产品化     │"
  echo -e "  └──────────────────────────────────────┘${N}"
else
  echo -e "  ${R}┌──────────────────────────────────────┐"
  echo -e "  │  ✗ P1 未通过 — $FAIL 项失败           │"
  echo -e "  └──────────────────────────────────────┘${N}"
fi

echo ""
echo "── 手动启动前端 ──"
echo "  终端1: cd $SCRIPT_DIR/apps/h5 && npm run dev:h5"
echo "  终端2: cd $SCRIPT_DIR/apps/weapp && npm run dev:weapp"
echo "  浏览器: http://localhost:10086"
echo "  微信开发者工具: 打开 apps/weapp/dist"
echo ""
echo "── 手动验证流程 ──"
echo "  活动列表 → 点击卡片 → 活动详情 → 立即报名 → 模拟支付 → 查看QR → 签到"
echo "  状态: NOT_REGISTERED → REGISTERED → PAID → ACTIVE → CHECKED_IN"
echo ""
