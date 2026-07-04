DEPLOYMENT

行者学社 DEPLOYMENT
1. 当前部署状态

当前版本：V2.7.2 Online Test Release。

当前部署形态：

腾讯云线上测试环境：
- 服务器：腾讯云 Ubuntu 24.04，公网 IP：82.156.129.114
- 后端目录：/srv/xingzhe/backend
- Admin 静态目录：/var/www/xingzhe-admin
- 上传目录：/data/xingzhe/uploads
- 数据库：MySQL（腾讯云）
- 进程管理：PM2
- Web 服务器：Nginx
- HTTPS：Certbot（Let's Encrypt）
- HTTP 自动跳转 HTTPS

线上域名：
- Admin：https://admin.tenselog.cn
- API：https://api.tenselog.cn
- 上传资源：https://api.tenselog.cn/uploads/...

本地开发环境：
- macOS
- SQLite（/backend/data/xingzhe.db）
- Node.js 18.x
- 后端端口 3000，Admin 端口 5173

**历史版本说明**：V2.3 版本时系统为纯本地开发，当前已进入线上测试稳定阶段。以下第 2-7 节保留为历史参考，部分规则仍适用。

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
*.pem
*.key
API key
AppSecret
Token
数据库密码
apps/weapp/project.private.config.json

8. 当前已完成部署

V2.7 系列已完成：
- 腾讯云 MySQL 数据库
- Nginx + HTTPS + Certbot
- PM2 进程管理
- 后端部署（/srv/xingzhe/backend）
- Admin 静态部署（/var/www/xingzhe-admin）
- 小程序体验版上传
- Admin / API 域名配置
- 上传资源公开访问

V3.0 部署目标：
- COS 图片/证书存储（当前使用本地 /data/xingzhe/uploads）
- 日志 / 监控
- 备份 / 数据恢复
- 安全审计
- 小程序正式提审

9. V2.7.3 运维固化

待完成：
- pm2 save（固化 PM2 进程列表）
- MySQL 备份脚本（mysqldump + crontab）
- uploads 备份策略（rsync / tar + crontab）
- 数据库表结构备份
- 恢复说明文档

10. 部署前置条件

已完成：
- 真实 User ✅（V2.4）
- 真实微信登录（mock 模式已支持，real 模式需 AppSecret）✅
- Admin Auth ✅（V2.7.1）
- QA Agent blocking = 0 ✅

待完成：
- 生产支付方案（V2.9）
- 证书图片存储方案（V2.8）
- Admin 权限与安全审计（V2.8+）

11. V2.8A 真实发版方式

关键事实：
- 服务器不是 Git 仓库
- 不走 `git pull`
- 不在服务器执行源码 build
- 后端采用 Mac 本地 build 后 rsync `backend/dist` 到服务器
- Admin 采用 Mac 本地 build 后 rsync `apps/admin/dist` 到服务器
- 小程序通过微信开发者工具上传体验版

12. Mac / 服务器判断

```
whoami    # Mac: chen  |  服务器: ubuntu
pwd       # Mac: /Users/chen/...  |  服务器: /home/ubuntu 或 /srv/xingzhe/...
```

如果当前在服务器里，先执行 `exit` 回到 Mac，再执行 rsync。

13. 运维脚本

| 脚本 | 类型 | 说明 |
|------|------|------|
| `scripts/ops/xz-preflight-local.sh` | 只读 | 本地发版前检查（Git 状态、SSH key、PM2 在线等） |
| `scripts/ops/xz-backup-release.sh` | 写（服务器） | 部署前备份 dist 到 `/data/xingzhe/backups/releases/` |
| `scripts/ops/xz-verify-online.sh` | 只读 | 线上 Admin 鉴权验证（无 token / fake-token → 401） |

14. 后端发布命令

**本地 build：**

```bash
cd /Users/chen/projects/xingzhe-v3/backend
npm run build
```

**本地确认 dist 包含 Auth Guard：**

```bash
cd /Users/chen/projects/xingzhe-v3
grep -RIn "JwtAuthGuard\|UseGuards\|jwt-auth.guard" backend/dist | head -80
```

**上传 dist：**

```bash
rsync -avz --delete \
  -e "ssh -i ~/.ssh/xingzhev3.pem" \
  /Users/chen/projects/xingzhe-v3/backend/dist/ \
  ubuntu@82.156.129.114:/srv/xingzhe/backend/dist/
```

**服务器确认：**

```bash
ssh -i ~/.ssh/xingzhev3.pem ubuntu@82.156.129.114 '
set -e
ls -l /srv/xingzhe/backend/dist/main.js
grep -RIn "JwtAuthGuard\|UseGuards\|jwt-auth.guard" /srv/xingzhe/backend/dist | head -80
'
```

**PM2 重启：**

```bash
ssh -i ~/.ssh/xingzhev3.pem ubuntu@82.156.129.114 '
set -e
cd /srv/xingzhe/backend
pm2 restart xingzhe-api --update-env
pm2 status
'
```

15. Admin 发布命令

**本地 build：**

```bash
cd /Users/chen/projects/xingzhe-v3/apps/admin
npm run build
```

**上传 Admin 静态资源：**

```bash
rsync -avz --delete \
  -e "ssh -i ~/.ssh/xingzhev3.pem" \
  /Users/chen/projects/xingzhe-v3/apps/admin/dist/ \
  ubuntu@82.156.129.114:/var/www/xingzhe-admin/
```

Admin 静态资源上传后通常不需要重启 PM2 或 Nginx。只有 Nginx 配置变更时才需要 `nginx reload`。

16. 线上验证标准

**不要用 `curl -I` 判断 Admin 鉴权。必须用 GET。**

Admin 无 token 验证（预期全部 401）：

```bash
for path in \
  "/admin/orders" \
  "/admin/crm/users" \
  "/admin/finance/summary" \
  "/admin/certificate-templates"
do
  code="$(curl -sS -o /tmp/xz_check.json -w "%{http_code}" "https://api.tenselog.cn${path}")"
  echo "${path} no-token -> ${code}"
done
rm -f /tmp/xz_check.json
```

fake-token 验证（预期全部 401）：

```bash
for path in \
  "/admin/orders" \
  "/admin/certificate-templates"
do
  code="$(curl -sS -o /tmp/xz_check.json -w "%{http_code}" "https://api.tenselog.cn${path}" \
    -H "Authorization: Bearer fake-token")"
  echo "${path} fake-token -> ${code}"
done
rm -f /tmp/xz_check.json
```

或使用统一脚本：

```bash
bash scripts/ops/xz-verify-online.sh
```

17. pm2 save 和 tag 时机

- Admin 鉴权验证通过后，执行 `pm2 save`
- 线上 Admin / 小程序体验版人工验收通过后，才允许打 tag
- 当前没有 remote，不需要 `git push`
- 服务器不是 Git 仓库，不需要 `git pull`

18. 典型发版流程

```
1. bash scripts/ops/xz-preflight-local.sh        ← 本地检查
2. bash scripts/ops/xz-backup-release.sh         ← 部署前备份
3. 按第 14-15 节执行 rsync + pm2 restart         ← 手动部署
4. bash scripts/ops/xz-verify-online.sh           ← 线上鉴权验证
5. pm2 save && git tag vX.Y.Z-online-test         ← 固化
```