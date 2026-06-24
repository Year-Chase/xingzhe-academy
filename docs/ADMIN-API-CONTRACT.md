ADMIN-API-CONTRACT

行者学社 Admin API Contract
1. 当前版本

当前系统版本：V2.3 本地运营框架版。

Admin API 已从 P2 活动管理后台扩展为：

活动管理 + 订单管理 + 退款管理 + 财务管理 + 发票管理 + CRM 用户运营 + QA 回归验证。

当前数据库仍为本地 SQLite：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前不是腾讯云数据库版，不是生产支付版。

2. API 原则
Admin 只通过 backend API 访问业务数据。
Admin 不直接访问数据库。
backend 是唯一业务中枢。
Registration 是报名事实源。
Order 是支付记录。
Refund 是退款事实源。
Invoice 是发票事实源。
CRM 只做读取、标签、备注等运营辅助，不修改核心交易状态。
旧接口 POST /activity//register、POST /activity//pay 已废弃，禁止恢复。
小程序报名支付主入口为 POST /activity//enroll-pay。
3. Admin API 前缀

统一使用：

/admin

核心模块：

/admin/activity
/admin/orders
/admin/finance
/admin/invoices
/admin/crm
4. 活动管理 API
4.1 活动列表

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
GET /activity//status?userId=
POST /activity//enroll-pay
GET /activity//qr
POST /activity//checkin
GET /activity//participants
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

PENDING 是内部过程态，中文显示“交易处理中”。

返回字段：

orderId
activityId
activityTitle
userId
nickname，可为空
amount
payType
status
paidAt
refundedAmount
refundCount
refundedAt
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
12. V2.3 验收 API

以下接口必须不返回 500：

GET /activity
GET /activity/all?page=1&limit=50
GET /admin/orders?page=1&limit=20
GET /admin/orders?page=1&limit=20&status=PENDING
GET /admin/finance/summary
GET /admin/finance/activity/1
GET /admin/invoices?page=1&limit=20
GET /admin/crm/users?page=1&limit=20
GET /admin/crm/users/1
13. V2.4 API 预告

V2.4 将新增真实用户与微信登录：

POST /users/wechat-login
GET /users//profile
PATCH /users//profile

V2.4 后 CRM 用户资料优先读取真实 User 表。