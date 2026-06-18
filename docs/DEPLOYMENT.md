# 行者学社 V1 — 部署说明

> **文档状态**：目标基线。当前代码未完全实现，开发以本文档为准。

## 1. 本地开发环境

### 前置条件

| 工具 | 最低版本 | 说明 |
|---|---|---|
| Node.js | 18+ | 运行时 |
| npm | 9+ | 包管理 |
| 微信开发者工具 | 最新稳定版 | 仅 WeApp 开发需要 |

### 一键安装

```bash
cd xingzhe-v3
chmod +x setup.sh
./setup.sh
```

这将依次在 `backend`、`apps/h5`、`apps/weapp` 目录执行 `npm install`。

### 启动全部服务

需同时运行 3 个终端：

```bash
# 终端 1: 后端
cd backend && npm run start:dev
# → http://localhost:3000

# 终端 2: H5
cd apps/h5 && npm run dev:h5
# → http://localhost:10086

# 终端 3: WeApp
cd apps/weapp && npm run dev:weapp
# → 微信开发者工具打开 apps/weapp/dist
```

## 2. 后端部署（生产环境）

### 选项 A：Node.js 直跑

```bash
cd backend
npm install --omit=dev
npm run build
NODE_ENV=production node dist/main.js
```

### 选项 B：Docker（推荐）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 数据库

- V1 使用 SQLite 文件，无需额外数据库服务
- DB 文件路径：`backend/data/xingzhe.db`
- 生产部署如需要多实例，需迁移为 MySQL（修改 app.module.ts TypeOrmModule.forRoot 配置）

## 3. H5 部署

H5 为纯静态资源：

```bash
cd apps/h5
npm run build:h5
# 产物在 dist/ 目录
# 部署到任意静态托管：Nginx、CDN、OSS
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name xingzhe.example.com;
    root /var/www/xingzhe-h5;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }
}
```

H5 页面中的 API 地址 `http://localhost:3000` 在生产环境需要替换为实际后端地址或通过 Nginx 反向代理。

## 4. 微信小程序部署

1. 在微信公众平台注册小程序并获取 AppID
2. 修改 `apps/weapp/project.config.json` 中的 `appid` 字段
3. 执行 `npm run build:weapp`
4. 在微信开发者工具中上传代码
5. 提交审核

### 小程序 API 域名配置

在微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名中配置：
- request 合法域名：`https://api.xingzhe.example.com`

开发阶段可勾选"不校验合法域名"跳过。

## 5. 环境变量（P2 阶段引入）

V1 阶段无环境变量需要配置。P2 引入真实支付时：

```bash
# .env 文件（不提交到 Git）
DATABASE_URL=mysql://user:pass@localhost:3306/xingzhe
WECHAT_APP_ID=wx1234567890
WECHAT_MCH_ID=1234567890
WECHAT_API_KEY=xxxxxxxx
```
