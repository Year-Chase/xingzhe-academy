ENVIRONMENT

行者学社 ENVIRONMENT
1. 当前环境

当前项目：行者学社 V2.3 本地运营框架版。

本地路径：

/Users/chen/projects/xingzhe-v3

已知环境：

macOS
Node.js 18.x
npm 9.x
NestJS
TypeORM
better-sqlite3
SQLite
Taro WeApp
Vue 3 / Vite Admin
QA Agent + 火山方舟 / 豆包
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

当前数据库：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前是本地 SQLite，不是腾讯云数据库。

不要随意删除数据库。

不要提交数据库文件。

如果需要查看数据：

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
apps/weapp/project.private.config.json
API key
AppSecret
Token
11. 当前限制
无真实 User 表
无真实微信登录
无腾讯云数据库
无 COS
无生产支付回调
无证书图片生成
无正式部署
12. V2.4 环境重点

V2.4 将引入真实 User 和微信登录。

本地开发必须支持 mock 微信登录，不得强依赖真实微信 AppSecret。

Mock code 应支持多用户测试。