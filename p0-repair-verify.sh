#!/bin/bash
# P0-REPAIR verification script — run after npm install
set -e
BASE="http://localhost:3000"

cd "$(dirname "$0")/backend"
[ ! -d node_modules/@nestjs ] && npm install

# start
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null || true
sleep 1
npm run start:dev &
sleep 6

echo "=== 1. /health ===";     curl -s "$BASE/health"
echo -e "\n=== 2. /activity ===";   curl -s "$BASE/activity" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} activities')"
echo -e "\n=== 3. /activity/1 ==="; curl -s "$BASE/activity/1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'title={d[\"title\"]} loc={d[\"location\"]} cap={d[\"capacity\"]}')"
echo -e "\n=== 4. status ===";       curl -s "$BASE/activity/1/status?userId=1"
echo -e "\n=== 5. register ===";     curl -s -X POST "$BASE/activity/1/register?userId=1"
echo -e "\n=== 6. pay ===";          curl -s -X POST "$BASE/activity/1/pay?userId=1"
echo -e "\n=== 7. qr ===";           R=$(curl -s "$BASE/activity/1/qr?userId=1"); echo "$R"; CODE=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])")
echo -e "\n=== 8. checkin ===";       curl -s -X POST "$BASE/activity/1/checkin" -H 'Content-Type: application/json' -d "{\"code\":\"$CODE\"}"
echo -e "\n=== DONE ==="

kill %1 2>/dev/null || true
