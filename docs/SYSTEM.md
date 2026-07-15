SYSTEM

行者学社 SYSTEM
1. 当前系统形态

当前版本：V2.7.2 Online Test Release。

系统组成：

WeApp 小程序（体验版已上传）
Admin PC 管理后台（https://admin.tenselog.cn）
NestJS Backend（https://api.tenselog.cn）
MySQL 数据库（腾讯云，本地开发用 SQLite）
本地 /data/xingzhe/uploads 上传目录
QA Regression Agent
Nginx + HTTPS + PM2 + Certbot

backend 是唯一业务中枢。

Admin 和 WeApp 均通过 backend API 访问业务数据。Admin 所有 /admin/* 路由受 JwtAuthGuard 保护。

2. 当前目录

项目根目录：

/Users/chen/projects/xingzhe-v3

后端：

/Users/chen/projects/xingzhe-v3/backend

小程序：

/Users/chen/projects/xingzhe-v3/apps/weapp

Admin：

/Users/chen/projects/xingzhe-v3/apps/admin

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

3. 当前核心系统

已完成基础能力：

活动系统 ✅
报名系统 ✅
订单系统 ✅
二维码系统 ✅
签到/核销系统 ✅
退款系统 ✅
财务系统 ✅
发票系统 ✅
CRM 用户运营系统 ✅
QA 回归系统 ✅
真实用户系统 ✅（V2.4）
mock 微信登录 ✅（V2.4，WECHAT_LOGIN_MODE=mock）
证书模板系统 ✅（V2.6，基础版）
活动地点导航 ✅（V2.6）
Admin 认证系统 ✅（V2.7.1，HMAC-SHA256 token + JwtAuthGuard）
线上部署 ✅（V2.7，腾讯云 MySQL + Nginx + HTTPS）

未完成完整能力：

真实微信支付系统
PaymentRecord 支付流水
完整证书图片生成
核销后自动生成证书
足迹系统
行者地图
同行者统计
邀请增长闭环
COS 对象存储

关键系统规则：
- ActivityFlowService 是状态流转核心，controller 不允许直接改 status
- 0 元活动也必须走 enroll-pay，0 元订单也是真订单
- 退款不修改 Registration、不修改 QR、不修改 CHECKED_IN
- Admin 所有 /admin/* 路由受 JwtAuthGuard 保护，无 token 返回 401
4. 当前业务流程

活动创建
→ 活动发布
→ 小程序展示
→ 用户报名支付
→ 创建 Registration
→ 创建 Order
→ 生成 QR
→ 现场核销
→ 可退款
→ 可开票
→ 财务统计
→ CRM 用户运营查看

未来完整流程：

活动创建
→ 活动发布
→ 用户报名
→ 用户支付
→ 生成二维码
→ 现场签到
→ 自动生成证书
→ 更新足迹
→ 更新同行者统计
→ 分享证书/活动
→ 绑定活动邀请关系
→ CRM 克制运营

5. 当前事实源
Activity：活动
Registration：报名
Order：支付记录
QR：核销
Refund：退款
Invoice：发票
CRM：运营视图

关键原则：

Registration = 报名事实源
Order = 支付记录
Refund = 退款事实源
Invoice = 发票事实源
CRM 不改核心业务状态
6. 当前后端模块

核心位置：

backend/src/activity/

当前包含：

Activity + ActivityService（活动管理）
ActivityRegistration（报名事实源）
ActivityOrder（支付记录）
ActivityQR（核销二维码）
ActivityRefund（退款事实源）
ActivityInvoice（发票事实源）
ActivityRegistrationInfo（报名信息快照）
UserRegistrationProfile（用户常用报名资料）
ActivityFlowService（状态流转核心，enrollPay / refund / checkin / checkinForActivity / getOrders / financeSummary）
AdminActivityController（/admin/activity/* + /admin/activity/:id/checkin）
activity.controller.ts（小程序公开路由 /activity/*）

backend/src/users/

User Entity（主表，id 为 user_xxx，openid 唯一）
UsersService（微信登录 / profile 查询 / 常用报名资料 / mock openid 解析）
UsersController（/users/* 公开路由）

V2.8.3 报名补充信息：
- Activity.requiredUserInfoFields 是活动报名字段配置唯一来源
- 非空 requiredUserInfoFields 表示报名前必须补充对应字段
- UserRegistrationProfile 只做下次报名自动带出
- ActivityRegistrationInfo 保存本次报名实际提交快照
- 报名快照不因后续常用资料修改而自动覆盖

backend/src/certificate/

CertificateTemplate Entity
CertificateService（模板 CRUD）
CertificateController（/admin/certificate-templates/*）

backend/src/auth/

AdminAuthController（POST /admin/auth/login）
AdminTokenService（HMAC-SHA256 自签名 token）
JwtAuthGuard（守卫 /admin/* 路由）
MiniappJwtService（小程序用户态 JWT 签发与验签）
MiniappAuthGuard（守卫小程序私有路由，从 Bearer JWT 确定当前用户）
AuthModule

backend/src/config/

env.ts（.env 加载，不覆盖已存在的环境变量）
upload-path.ts（UPLOAD_DIR / PUBLIC_UPLOAD_BASE_URL）

7. 当前 Admin 模块

apps/admin 当前承担：

活动管理
订单管理
财务管理
发票管理
用户运营 CRM

Admin 不承担 C 端体验。

8. 当前小程序模块

apps/weapp 当前承担：

首页活动列表
活动详情
报名支付
二维码
核销状态
已报名/已参加展示

完整规划底部 tab：

首页
行者地图
我的

行者地图包括：

我的足迹
同行者
行者地图
9. 当前数据库

当前数据库：

SQLite / better-sqlite3

路径：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前不是云数据库。

10. QA 系统

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

运行：

cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js

QA blocking = 0 才允许进入下一阶段。

11. 后续系统演进

V2.4：

真实 User + 微信登录。

V2.5：

活动产品模型增强。

V2.6：

真实支付与订单增强。

V2.7：

证书传播。

V2.8：

行者地图。

V2.9：

邀请增长。

V3.0：

云部署上线。

================================

徽章体系

================================

自动发放

管理员发放

不公开规则

---

## V2.7.3 重点风险与排查事项

### V2.7.3 重点风险

- Admin 卡顿排查（线上 MySQL 连接池 / N+1 查询 / 大表全表扫描）
- 证书链路完整回归（Admin 模板管理 + 小程序证书列表 / 详情）
- 已报名行者头像修复（getParticipants 硬编码 → 查询真实 User）
- 用户详情订单记录 0 元订单展示（当前按 userId 全量查询，应正常展示）
- 0 元订单退款按钮过滤（amount=0 或 全额退款后仍显示退款按钮）
- PM2 / MySQL / uploads 备份固化

### 禁止事项（V2.7.3 及全局）

- 真实微信支付 / 真实退款调用
- 恢复 mock_token
- 恢复模拟签到
- 绕过 ActivityFlowService 直接改 status
- controller 直接操作 repo 修改 Registration / Order 状态
- 提交 .env / pem / key / secret
- 对 0 元订单产生真实退款调用

新增：

订单聚合：

GET /users/me/orders

报名聚合：

GET /users/me/registrations

登录：

returnUrl

10分钟有效

一次消费

## V2.8-Final 系统事实

- V2.9A-1B 后，小程序私有接口只使用 `Authorization: Bearer <miniapp JWT>`；后端验证签名、过期时间、`typ=miniapp` 和用户状态后写入 `request.user.userId`。
- 旧 `xztok_` token 和不匹配的 `X-User-Id` / query.userId / body.userId 在受保护接口上必须被拒绝。
- Admin 认证仍使用 Admin HMAC token + `JwtAuthGuard`，不得与小程序 JWT 混用。
- `identityType = 工作人员` 是小程序工作人员工具和扫码核销权限来源；普通用户资料接口禁止修改该字段。
- 公开 `POST /activity/:id/checkin` 已禁用；Admin 手机核销保留；工作人员核销走 `/staff/checkin/scan`。
- 核销对象是 `ActivityRegistration`，最终状态仍是一条报名最多一次最终签到。
- QR 生成、替换、撤销和核销逻辑收口在 `ActivityFlowService`。
- V2.8 未接入真实微信支付、真实退款、微信订阅消息或完整操作审计日志。
