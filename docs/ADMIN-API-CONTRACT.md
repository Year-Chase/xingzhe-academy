ADMIN-API-CONTRACT

行者学社 Admin API Contract
1. 当前版本

当前系统版本：V2.7.2 Online Test Release。

线上 API 域名：https://api.tenselog.cn

Admin API 模块：
- 活动管理 + 报名记录
- 手机核销
- 订单管理 + 退款
- 财务管理
- 发票管理
- CRM 用户运营
- 证书模板管理
- Admin Auth 认证

当前数据库：双模式（本地 SQLite / 线上 MySQL），线上使用 MySQL。
当前不接真实微信支付。

2. API 原则
Admin 只通过 backend API 访问业务数据。
Admin 不直接访问数据库。
backend 是唯一业务中枢。

所有 /admin/* 路由受 JwtAuthGuard 保护：
- 无 Authorization header → 401 "未登录或 token 已过期"
- 非 Bearer 格式 → 401
- 空 token → 401
- 签名不匹配（包括 fake-token）→ 401 "token 签名不正确"
- token 过期（超出 ADMIN_TOKEN_EXPIRES_SECONDS）→ 401 "token 已过期"
- token 有效 → 放行

Registration 是报名事实源。
Order 是支付记录。
Refund 是退款事实源。
Invoice 是发票事实源。
CRM 只做读取、标签、备注等运营辅助，不修改核心交易状态。
旧接口 POST /activity/:id/register、POST /activity/:id/pay 已废弃，禁止恢复。
mock_token 已废弃，禁止恢复。
小程序报名支付主入口为 POST /activity/:id/enroll-pay。
3. Admin API 前缀

统一使用：

/admin

核心模块：

/admin/auth（V2.7.1 新增）
/admin/activity（含 /checkin V2.7.1 新增）
/admin/orders
/admin/finance
/admin/invoices
/admin/crm
/admin/certificate-templates（V2.6 新增）
4. Admin Auth API（V2.7.1）

POST /admin/auth/login

Request:
```json
{ "username": "string", "password": "string" }
```

Response (200):
```json
{ "token": "base64Url(JSON payload).base64Url(HMAC-SHA256 signature)" }
```

Error (401):
- 账号或密码为空 → "请输入账号和密码"
- 未配置凭证 → "服务端未配置管理员凭证"
- 账号或密码错误 → "账号或密码错误"

Token 结构：
- 非 JWT 标准，HMAC-SHA256 自签名
- Payload：{ username, iat(秒), exp(秒) }
- 签名密钥：ADMIN_TOKEN_SECRET（服务器 .env，至少 64 字符）
- 过期时间：ADMIN_TOKEN_EXPIRES_SECONDS（默认 86400 = 24h）

5. Admin MobileCheckin API（V2.7.1）

POST /admin/activity/:id/checkin

Request:
```json
{ "code": "核销码 UUID 字符串" }
```

Response (200):
```json
{ "success": true, "message": "签到成功", "status": "CHECKED_IN", "registrationId": number, "userId": "string", "activityId": number }
```

校验规则：
- code 为空 → "请提供核销码"
- QR 不存在 → "无效二维码，核销码不存在"
- QR.registration.activityId !== :id → "该核销码不属于当前活动"
- QR.status === 'USED' → "该核销码已签到，请勿重复核销"
- QR 其他非 ACTIVE 状态 → "该核销码已失效"
- QR 过期 → "核销码已过期"

6. 活动管理 API
6.1 活动列表

GET /admin/activity?page=1&limit=20&status=&keyword=

返回：

id
title
description
location
city
startTime
endTime
capacity
registeredCount
status
coverImage
price
memberPrice
lifetimeMemberPrice
paymentMode
createdAt
updatedAt
4.2 活动详情

GET /admin/activity/

返回活动完整字段和 registeredCount。

4.3 创建活动

POST /admin/activity

核心字段：

title
description
location
city
startTime
endTime
capacity
coverImage
price
memberPrice
lifetimeMemberPrice
paymentMode

当前完整活动模板、预付后付、活动回忆录仍属后续版本。

4.4 编辑活动

PATCH /admin/activity/

允许编辑活动基础字段。

4.5 发布活动

POST /admin/activity//publish

发布后小程序可见。

4.6 下架活动

POST /admin/activity//close

下架后小程序首页不可见，用户不可继续报名。

5. 小程序活动接口

这些接口不得被 Admin 开发破坏：

GET /activity
GET /activity/all?page=&limit=
GET /activity/
GET /activity//status
POST /activity//enroll-pay
GET /activity//qr
GET /activity//participants

V2.8.3 用户常用报名资料：

GET /users/me/registration-profile

Header:
- Authorization: Bearer <miniapp JWT>

返回：
- userId
- realName
- phone（优先常用报名资料，fallback User.phone）
- idCardNo
- departureCity
- transportPreference
- roomPreference
- updatedAt

规则：
- 用于小程序报名补充信息自动带出
- 不写入小程序 Storage
- 后端从 miniapp JWT 确定当前用户，不接受 `userId` query/header/body 切换用户
- 身份证号不得出现在 URL query 或日志中

POST /activity//enroll-pay

Request body 可带：
```json
{
  "registrationInfo": {
    "realName": "string",
    "phone": "string",
    "idCardNo": "string",
    "departureCity": "string",
    "transportPreference": "高铁|飞机|自驾|其他",
    "roomPreference": "单住|拼房|无所谓|其他"
  }
}
```

规则：
- 后端只接受当前活动 requiredUserInfoFields 中的标准字段
- requiredUserInfoFields 中的字段均为必填
- 报名成功后写 ActivityRegistrationInfo 快照
- 报名成功后合并更新 UserRegistrationProfile
- 未收集字段不清空常用报名资料历史值
6. 报名管理 API

GET /admin/activity//registrations?page=1&limit=50

返回字段：

registrationId
activityId
userId
nickname，可为空
avatarUrl，可为空
gender，可为空
registrationStatus
paymentStatus
qrStatus
checkedIn
paidAt
checkedInAt
city，可为空
certificate，可为空
inviter，可为空

当前证书和邀请人展示为结构预留，真实证书系统和真实邀请写入仍属后续版本。

7. 订单管理 API
7.1 订单列表

GET /admin/orders?page=1&limit=20&activityId=&status=

默认不展示 PENDING。
PENDING 是内部过程态，中文显示”交易处理中”。

V2.7.2 返回字段（以代码为准）：
- id, registrationId, userId
- userNickname（post-query 批量补充，无 User 时显示 userId）
- activityId
- activityTitle（post-query 批量补充）
- amount（含 0 元订单 ¥0.00）
- refundedAmount
- status（PAID/PARTIAL_REFUND/REFUNDED/PENDING/FAILED）
- payType（FULL/PREPAY）
- createdAt, paidAt, refundedAt
7.2 发起退款

POST /admin/orders//refund

规则：

每次退款必须生成 ActivityRefund。
部分退款后订单为 PARTIAL_REFUND。
全额退款后订单为 REFUNDED。
退款不修改 Registration。
退款不修改 QR。
退款不修改 CHECKED_IN。
8. 财务 API
8.1 财务概览

GET /admin/finance/summary

统计口径：

总支付金额：Order
总退款金额：Refund / Order.refundedAmount
净收入：支付金额 - 退款金额
发票数据：Invoice
8.2 活动财务明细

GET /admin/finance/activity/

返回该活动的支付、退款、净收入、订单数、退款数等。

9. 发票 API
9.1 发票列表

GET /admin/invoices?page=1&limit=20

9.2 发票申请

POST /admin/invoices/request

9.3 开票

PATCH /admin/invoices//issue

规则：

发票不修改 Registration。
发票不修改 Order 状态。
可开票金额应参考支付金额 - 已退款金额。

当前不对接电子发票平台。

10. CRM 用户运营 API
10.1 用户列表

GET /admin/crm/users?page=1&limit=20&keyword=&tag=&birthYearMonth=&registeredStart=&registeredEnd=&lastLoginStart=&lastLoginEnd=&inviteRegisterMin=&inviteActivityMin=

返回字段顺序建议：

userId
nickname
birthYearMonth
registrationCount
orderCount
checkedInCount
paidAmount
refundedAmount
netAmount
tags
registeredAt
lastLoginAt
lastActivityTime
inviteRegisterCount
inviteActivityCount

说明：

当前 V2.3 没有真实 User 表。nickname、registeredAt、lastLoginAt、birthYearMonth 优先来自 UserProfile 或过渡结构。V2.4 将引入真实 User。

10.2 用户详情

GET /admin/crm/users/

返回：

userId
nickname
birthYearMonth
age
registeredAt
lastLoginAt
summary
registrations
orders
refunds
invoices
certificates
inviteRecords
activityInviteRecords
tags
notes
10.3 添加标签

POST /admin/crm/users//tags

body：

{
"tag": "高价值用户"
}

10.4 删除标签

DELETE /admin/crm/users//tags/

10.5 添加备注

POST /admin/crm/users//notes

body：

{
"note": "用户偏好徒步类活动"
}

10.6 删除备注

DELETE /admin/crm/users//notes/

11. 当前状态枚举
Activity
DRAFT 草稿
PUBLISHED 已发布
CLOSED 已下架
ENDED 已结束
Registration
PAID 已报名/已支付
CHECKED_IN 已签到

旧 REGISTERED / REGISTERED→PAID 分离链路不作为当前主流程。

Order
PENDING 交易处理中，默认不展示
PAID 已支付
FAILED 支付失败，预留
PARTIAL_REFUND 部分退款
REFUNDED 已全额退款
QR
ACTIVE 可核销
USED 已核销
EXPIRED 已过期
Invoice
REQUESTED 已申请
ISSUED 已开票
12. CertificateTemplate API（V2.6）

GET /admin/certificate-templates
GET /admin/certificate-templates/:id
POST /admin/certificate-templates（body: { name, imageUrl, description?, isDefault?, enabled?, fieldConfig? }）
PATCH /admin/certificate-templates/:id
POST /admin/certificate-templates/:id/default
PATCH /admin/certificate-templates/:id/disable（软删除，设置 enabled=false）
POST /admin/certificate-templates/upload（multipart/form-data, field: file）

规则：
- 上传图片格式：jpg/jpeg/png/webp，最大 5MB
- 设置默认时清除其他模板的默认标记
- 禁用为软删除，不物理删除记录

13. V2.7.2 验收 API

以下接口必须不返回 500：

GET /activity
GET /activity/all?page=1&limit=50
POST /admin/auth/login
GET /admin/activity?page=1&limit=20
GET /admin/orders?page=1&limit=20
GET /admin/orders?page=1&limit=20&status=PENDING
GET /admin/finance/summary
GET /admin/finance/activity/1
GET /admin/invoices?page=1&limit=20
GET /admin/crm/users?page=1&limit=20
GET /admin/crm/users/:userId
GET /admin/certificate-templates

以下行为必须正确：

无 token 访问 /admin/* → 401
fake-token 访问 /admin/* → 401
POST /admin/activity/:id/checkin（错误核销码）→ 400
POST /admin/activity/:id/checkin（正确核销码）→ 200

**历史版本说明**：以下第 14-15 节为 V2.4/V2.5 旧版合约，部分仍适用，以当前代码为准。

14. V2.4 API（历史参考，已完成）

POST /users/wechat-login
GET /users/:id/profile
PATCH /users/:id/profile

V2.4 后 CRM 用户资料优先读取真实 User 表。

## 15. V2.5 活动管理 API（历史参考，已完成）

### 13.1 Admin 活动管理

现有接口（增强，未新增平行路由）：

```
GET    /admin/activity?page=&limit=&status=&keyword=
GET    /admin/activity/:id
POST   /admin/activity
PATCH  /admin/activity/:id
POST   /admin/activity/:id/publish
POST   /admin/activity/:id/close
POST   /admin/activity/upload-cover
GET    /admin/activity/:id/registrations
```

V2.5A 增强字段：province, prepayAmount, remainingAmount, remainingPayDate, memoryImages, memoryText, requiredUserInfoFields, groupQrType, groupQrImageUrl, groupQrTitle, groupQrDescription

Admin 编辑页必须使用 /admin/activity/:id 回读完整配置，不使用 /activity/:id。

**GET /admin/activity/:id/registrations** 返回报名信息快照（手机号脱敏、身份证号脱敏），覆盖 15位/18位/17位+X/x。

### 13.2 小程序活动详情

```
GET /activity/:id
```

V2.5C 返回：requiredUserInfoFields, groupQrType, groupQrImageUrl, groupQrTitle, groupQrDescription, hasGroupQr, createdAt

### 13.3 报名支付

```
POST /activity/:id/enroll-pay
```

请求体支持：

```json
{
  "registrationInfo": {
    "realName": "张三",
    "phone": "13800000000",
    "idCardNo": "11010119900307123X",
    "departureCity": "北京",
    "transportPreference": "高铁",
    "roomPreference": "无特殊要求"
  }
}
```

规则：当前用户由 `Authorization: Bearer <miniapp JWT>` 确定；idCardNo 不得出现在 URL query。禁止恢复 POST /activity/:id/register 和 POST /activity/:id/pay。

### 13.4 CRM 类型管理

```
PATCH /admin/crm/users/:userId/type
```

新增：

users/me/orders

users/me/registrations

接口原则：

敏感字段：

身份证
手机号
openid

禁止无权限返回。

## V2.8-Final API 事实

- 活动配置继续使用 `activity.requiredUserInfoFields` 表示报名补充字段：未勾选不收集，勾选即必填。
- `GET /users/me/registration-profile` 返回当前登录用户常用报名资料，不接受 `userId` query 读取他人资料。
- `GET /activity/:id/qr` 以登录态识别当前用户，不再信任前端传入 `userId`。
- 公开 `POST /activity/:id/checkin` 已禁用，线上返回 404。
- 工作人员小程序接口：
  - `GET /staff/checkin/activities`
  - `POST /staff/checkin/scan`
- 工作人员权限由用户 `identityType = 工作人员` 判断；普通用户接口不能修改 `identityType`，Admin CRM 类型接口仍可修改。
- Admin 订单详情接口 `GET /admin/orders/:id` 返回订单、活动摘要、用户摘要、金额、后付款、退款、发票和真实字段时间线，敏感信息默认脱敏。

## V2.9A-1B 小程序用户态认证

- `POST /users/wechat-login` 返回标准 Bearer JWT，payload 包含 `sub`、`typ=miniapp`、`ver=1`、`iat`、`exp`。
- 小程序私有接口统一使用 `Authorization: Bearer <miniapp JWT>`。
- 小程序端不再发送 `X-User-Id`，不再通过 query/body/path 中的 `userId` 作为身份来源。
- 后端通过 `@nestjs/jwt` 验证签名、过期时间、`typ=miniapp`、用户存在且状态为 ACTIVE，并将 `request.user.userId` 作为唯一身份来源。
- 为短期兼容旧客户端，受保护接口如收到 `X-User-Id`、query.userId 或 body.userId，必须与 JWT `sub` 一致；不一致返回 403。
- 旧 `xztok_` token 在受保护的小程序接口上必须被拒绝。
- Admin `/admin/*` 仍使用既有 `JwtAuthGuard` 与 Admin HMAC token，不与小程序 JWT 混用。
