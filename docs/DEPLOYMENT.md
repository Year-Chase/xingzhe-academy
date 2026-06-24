DEPLOYMENT

行者学社 DEPLOYMENT
1. 当前部署状态

当前版本：V2.3 本地运营框架版。

当前部署形态：

本地开发
本地 SQLite
本地 uploads
本地 Admin
本地 WeApp 开发者工具
本地 QA Agent

当前不是生产部署。

当前不是腾讯云数据库。

当前不是 COS 文件存储。

2. 本地开发路径

项目根目录：

/Users/chen/projects/xingzhe-v3

后端：

/Users/chen/projects/xingzhe-v3/backend

Admin：

/Users/chen/projects/xingzhe-v3/apps/admin

小程序：

/Users/chen/projects/xingzhe-v3/apps/weapp

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

3. 本地服务
3.1 后端

端口：

3000

启动：

cd /Users/chen/projects/xingzhe-v3/backend
npm run start

健康检查或可用性检查：

curl "http://127.0.0.1:3000/activity"

3.2 Admin

启动：

cd /Users/chen/projects/xingzhe-v3
npm run dev

常见端口：

5173

3.3 WeApp

启动或构建命令以 package.json 为准。

通常：

cd /Users/chen/projects/xingzhe-v3/apps/weapp
npm run dev

微信开发者工具导入：

/Users/chen/projects/xingzhe-v3/apps/weapp/dist

3.4 QA Agent

运行：

cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js

报告：

/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.md

/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.json

4. 服务启动规则

Claude 或任何 Agent 运行 QA 前，必须先检查服务是否已存在。

后端检查：

curl -s -o /tmp/xingzhe_backend_check.txt -w "%{http_code}" "http://127.0.0.1:3000/activity"

如果返回 200：

复用已有服务
不重复启动

如果不可用：

lsof -i :3000

端口被占用但接口不可用：

停止
打印 lsof 结果
等待用户处理
不 kill

禁止：

kill -9
盲目关闭用户已有进程
重复启动造成 EADDRINUSE
5. 当前数据库

当前使用：

better-sqlite3 / SQLite

数据库路径：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前 synchronize 开发阶段可用。

生产前必须：

关闭或谨慎使用 synchronize
制定迁移策略
迁移至云数据库或正式数据库
6. 当前文件存储

当前 uploads 为本地目录：

/Users/chen/projects/xingzhe-v3/backend/uploads

禁止提交 uploads 中测试图片。

后续生产应迁移到：

腾讯云 COS 或其他对象存储。

7. 禁止提交

禁止提交：

backend/data/
backend/uploads/
.local/
.env
*.env
API key
AppSecret
数据库密码
apps/weapp/project.private.config.json
8. 生产部署目标

V3.0 才进入正式云部署。

目标包括：

腾讯云数据库
COS 图片/证书存储
HTTPS
后端部署
Admin 静态部署
小程序正式 API 域名
日志
监控
备份
数据恢复
权限
安全审计
小程序提审
9. 部署前置条件

在 V3.0 前必须完成：

真实 User
真实微信登录
生产支付方案
证书图片存储方案
数据库迁移方案
Admin 权限与安全审计
QA Agent blocking = 0