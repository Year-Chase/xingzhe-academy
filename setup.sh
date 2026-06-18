#!/bin/bash
set -e

echo "========================================="
echo "  行者 V3 基础工程 - 依赖安装脚本"
echo "========================================="
echo ""

cd "$(dirname "$0")"

echo "[1/3] 安装后端依赖..."
cd backend
npm install
cd ..

echo ""
echo "[2/3] 安装 H5 前端依赖..."
cd apps/h5
npm install
cd ../..

echo ""
echo "[3/3] 安装微信小程序依赖..."
cd apps/weapp
npm install
cd ../..

echo ""
echo "========================================="
echo "  安装完成！运行验证："
echo "========================================="
echo ""
echo "  H5 开发:         cd apps/h5 && npm run dev:h5"
echo "  小程序编译:      cd apps/weapp && npm run dev:weapp"
echo "  后端启动:        cd backend && npm run start:dev"
echo ""
echo "  访问后端:        http://localhost:3000/health"
echo "                   http://localhost:3000/activity"
echo ""
