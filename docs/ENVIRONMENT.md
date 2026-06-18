# 行者学社 V1 — 环境配置

> **文档状态**：目标基线。当前代码未完全实现，开发以本文档为准。

## 1. 开发环境要求

| 组件 | 版本 | 安装方式 |
|---|---|---|
| Node.js | >= 18.0 | nvm 推荐 |
| npm | >= 9.0 | 随 Node.js |
| TypeScript | 5.3.3 | 各 package.json devDependencies |
| Git | 2.x+ | 系统包管理 |

可选（仅 WeApp 开发需要）：

| 组件 | 说明 |
|---|---|
| 微信开发者工具 | macOS / Windows 客户端 |

## 2. 项目初始化

```bash
# 克隆或进入项目
cd xingzhe-v3

# 安装全部依赖
chmod +x setup.sh && ./setup.sh
# 或分别执行：
# cd backend && npm install
# cd apps/h5 && npm install
# cd apps/weapp && npm install
```

## 3. 端口占用

| 服务 | 端口 | 用途 |
|---|---|---|
| NestJS 后端 | 3000 | REST API |
| Taro H5 dev server | 10086 | H5 开发页面 |
| SQLite 文件 | 无 | backend/data/xingzhe.db |

启动前确保 3000 和 10086 端口未被占用：

```bash
lsof -ti tcp:3000 | xargs kill -9  # 释放 3000
lsof -ti tcp:10086 | xargs kill -9 # 释放 10086
```

## 4. 数据库

### V1 配置

```
type: 'better-sqlite3'
database: 'data/xingzhe.db'
synchronize: true       # 开发环境自动建表
logging: true           # 打印 SQL 语句
```

### 重置数据库

```bash
rm -f backend/data/xingzhe.db
# 重启后端，种子数据自动重新插入
```

### 直接查看数据

```bash
sqlite3 backend/data/xingzhe.db
.tables
SELECT * FROM activity;
SELECT * FROM activity_registration;
SELECT * FROM activity_order;
SELECT * FROM activity_qr;
.quit
```

## 5. 前端 API 地址配置

H5 和 WeApp 页面中的 API 基地址硬编码为：

```typescript
const API = 'http://localhost:3000'
```

文件位置：
- `apps/h5/src/pages/index/index.tsx`
- `apps/h5/src/pages/activity/detail/index.tsx`
- `apps/h5/src/pages/activity/qr/index.tsx`
- `apps/weapp/src/pages/index/index.tsx`
- `apps/weapp/src/pages/activity/detail/index.tsx`
- `apps/weapp/src/pages/activity/qr/index.tsx`

生产部署时需要统一替换为实际域名。

## 6. CORS

后端 `main.ts` 已配置 `app.enableCors()`，允许所有来源的跨域请求。开发阶段无需额外配置。

## 7. Node.js 版本管理（推荐）

```bash
# 使用 nvm
nvm install 18
nvm use 18
node --version  # v18.x.x

# 或在项目根目录放置 .nvmrc
echo "18" > .nvmrc
```

## 8. 已知限制

| 限制 | 原因 | 影响 |
|---|---|---|
| npm registry 需可访问 | 无离线缓存 | 无法在受限网络安装依赖 |
| 仅 localhost 通信 | 前端硬编码 API 地址 | 远程开发需改 API 地址 |
| SQLite 单文件 | 无服务器数据库 | 多进程部署需换 MySQL |
| 无 Docker Compose | 未编写 | 每次需手动启 3 个终端 |

V1

SQLite

作为 MySQL 的开发 Mock

P2

迁移 MySQL

main.ts 自动创建 data 目录

本地依赖权限问题。

npm run start:dev 报 node_modules/.bin/nest: Permission denied 时，执行：
cd /Users/chen/projects/xingzhe-v3
chmod +x node_modules/.bin/nest
chmod +x node_modules/@nestjs/cli/bin/nest.js

如果仍失败，删除 node_modules 后重新 npm install。

不要改 backend、apps、package.json。