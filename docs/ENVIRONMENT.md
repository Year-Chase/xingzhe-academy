ENVIRONMENT

行者学社 ENVIRONMENT
1. 当前环境

当前项目：行者学社 V2.7.2 Online Test Release。

支持双环境：

线上环境（腾讯云）：
- Ubuntu 24.04，IP：82.156.129.114
- MySQL（生产数据库）
- Nginx + HTTPS（Certbot）
- PM2 进程管理
- Admin：https://admin.tenselog.cn
- API：https://api.tenselog.cn
- uploads：https://api.tenselog.cn/uploads/...
- 后端目录：/srv/xingzhe/backend
- 上传目录：/data/xingzhe/uploads

本地开发环境：
- macOS
- Node.js 18.x / npm 9.x
- NestJS + TypeORM + better-sqlite3
- SQLite 本地数据库
- Taro WeApp + Vue 3 / Vite Admin
- QA Agent + 火山方舟 / 豆包

**历史版本说明**：V2.3 版本时系统不存在线上环境。V2.7 系列已全面接入腾讯云线上部署。
2. 目录

后端：

/Users/chen/projects/xingzhe-v3/backend

小程序：

/Users/chen/projects/xingzhe-v3/apps/weapp

Admin：

/Users/chen/projects/xingzhe-v3/apps/admin

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

本地私有配置：

/Users/chen/projects/xingzhe-v3/.local

3. 端口
后端：3000
Admin：通常 5173
H5：当前不作为 Admin 使用
SQLite：无端口
4. 后端启动

cd /Users/chen/projects/xingzhe-v3/backend
npm run start

检查：

curl "http://127.0.0.1:3000/activity"

5. Admin 启动

cd /Users/chen/projects/xingzhe-v3
npm run dev

6. WeApp 启动

cd /Users/chen/projects/xingzhe-v3/apps/weapp
npm run dev

微信开发者工具导入：

/Users/chen/projects/xingzhe-v3/apps/weapp/dist

7. QA Agent

配置文件：

/Users/chen/projects/xingzhe-v3/.local/qa-agent/qa.env

示例：

/Users/chen/projects/xingzhe-v3/tools/qa-agent/qa.env.example

运行：

cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js

报告：

/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.md

/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.json

禁止打印：

ARK_API_KEY
AppSecret
Token
env 内容
8. 数据库

当前支持双数据库模式（TypeORM 双配置）：

本地开发（NODE_ENV≠production 且未设置 DB_HOST）：
- SQLite：/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db
- synchronize: true

线上生产（NODE_ENV=production 或已设置 DB_HOST）：
- MySQL（腾讯云）
- DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE
- DB_SYNCHRONIZE=false（默认，首次空库部署可临时设为 true 建表）
- 字符集：utf8mb4

不要随意删除数据库。
不要提交数据库文件。

本地查看 SQLite：
sqlite3 /Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

9. 端口处理规则

禁止盲目执行：

kill -9

后端检查：

curl -s -o /tmp/xingzhe_backend_check.txt -w "%{http_code}" "http://127.0.0.1:3000/activity"

如果 200，复用。

如果不可用：

lsof -i :3000

端口占用但服务不可用时，等待用户处理。

10. Git 忽略与敏感文件

禁止提交：

backend/data/
backend/uploads/
.local/
.env
*.env
*.pem
*.key
apps/weapp/project.private.config.json
API key
AppSecret
Token
secret
数据库密码

11. 当前功能状态

已完成：
- 真实 User 表 ✅（V2.4）
- mock 微信登录 ✅（WECHAT_LOGIN_MODE=mock）
- 腾讯云 MySQL ✅（V2.7）
- Admin token 登录 ✅（V2.7.1 HMAC-SHA256）
- 线上部署 ✅（Nginx + HTTPS + PM2）
- 证书模板管理 ✅（V2.6）
- 小程序证书展示 ✅（V2.6）

尚未完成：
- COS 对象存储
- 真实微信支付回调
- 证书图片自动生成
- 微信支付真实回调
- 小程序正式提审

12. Admin API 配置

Admin 前端 API baseURL（apps/admin/src/config/api.ts）：
- 线上：https://api.tenselog.cn
- 本地开发：http://127.0.0.1:3000

小程序 API baseURL（apps/weapp/src/config/api.ts）：
- 线上体验版：https://api.tenselog.cn
- 本地真机调试：http://Mac局域网IP:3000

13. .env 环境变量模板

参考 backend/.env.example（仅写字段名和用途，不写真实值）：

NODE_ENV：development / production
PORT：后端端口（默认 3000）
CORS_ORIGIN：跨域来源
DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE：MySQL 配置
DB_SYNCHRONIZE：首次空库建表开关（默认 false）
UPLOAD_DIR：上传文件保存目录（绝对路径）
PUBLIC_UPLOAD_BASE_URL：上传文件公开访问前缀
WECHAT_APPID / WECHAT_SECRET：微信小程序凭证
WECHAT_LOGIN_MODE：mock / real
ENABLE_DEMO_SEED：演示数据开关（生产必须 false）
ADMIN_USERNAME / ADMIN_PASSWORD：Admin 登录凭证
ADMIN_TOKEN_SECRET：HMAC-SHA256 签名密钥（至少 64 字符）
ADMIN_TOKEN_EXPIRES_SECONDS：token 过期秒数（默认 86400）

本地：

API:
http://127.0.0.1:3000

生产：

https://api.tenselog.cn

数据库：

本地：

SQLite

生产：

MySQL

规则：

本地.env禁止DB_HOST