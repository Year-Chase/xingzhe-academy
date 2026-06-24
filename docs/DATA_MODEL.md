DATA_MODEL

行者学社 DATA_MODEL
1. 当前版本

当前版本：V2.3 本地运营框架版。

当前数据库：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前数据库类型：

better-sqlite3 / SQLite

当前仍不是腾讯云数据库。

2. 数据事实源原则
Activity：活动事实源
ActivityRegistration：报名事实源
ActivityOrder：支付记录
ActivityRefund：退款事实源
ActivityInvoice：发票事实源
ActivityQR：核销二维码事实源
UserTag：CRM 标签
UserNote：CRM 备注
UserProfile：V2.3 过渡用户资料
UserInviteRecord：注册邀请结构
ActivityInviteRecord：活动邀请结构

禁止：

用 Order 统计报名人数
退款修改 Registration
CRM 修改核心业务状态
恢复 register/pay 旧链路
3. 当前已存在 Entity
Activity

当前字段以代码为准，核心含义：

id
title
description
location
city
startTime
endTime
capacity
status
coverImage
price
memberPrice，可选
lifetimeMemberPrice，可选
paymentMode，可选
createdAt
updatedAt

当前状态：

DRAFT
PUBLISHED
CLOSED
ENDED

后续待补：

slogan
province
activityTemplateId
registerStartTime
registerEndTime
normalPrice/memberPrice/lifetimeMemberPrice 完整化
prepayAmount
remainingAmount
remainingPayDate
memoryImages
memoryText
ActivityRegistration

核心字段：

id
userId
activityId
status
createdAt
updatedAt

当前状态：

PAID
CHECKED_IN

原则：

Registration 是报名事实源。

后续待补：

inviterUserId
checkedInAt
certificateId
user identity 快照
ActivityOrder

核心字段：

id
userId
activityId
amount
status
payType
paidAt
refundedAt
refundedAmount
refundCount
createdAt
updatedAt

状态：

PENDING
PAID
FAILED
PARTIAL_REFUND
REFUNDED

原则：

Order 是支付记录，不是报名事实源。

PENDING 默认不在 Admin 订单列表展示。

ActivityQR

核心字段：

id
userId
activityId
registrationId
code
status
createdAt
updatedAt

状态：

ACTIVE
USED
EXPIRED
ActivityRefund

核心字段：

id
orderId
userId
activityId
amount
reason，可选
status
createdAt

原则：

每次退款必须有记录。

ActivityInvoice

核心字段：

id
orderId
userId
activityId
title
taxNumber
amount
status
createdAt
issuedAt

状态：

REQUESTED
ISSUED
UserTag

核心字段：

id
userId
tag
createdAt

只影响 CRM 运营。

UserNote

核心字段：

id
userId
note
createdAt

只影响 CRM 运营。

UserProfile

V2.3 过渡用户资料表。

字段：

id
userId
birthYearMonth
registeredAt
lastLoginAt
createdAt

说明：

V2.4 引入真实 User 后，User 将成为用户资料主事实源。UserProfile 保留为过渡 fallback，不删除。

UserInviteRecord

注册邀请记录。

字段：

id
inviterUserId
inviteeUserId
createdAt

当前只是结构准备，尚无真实写入链路。

ActivityInviteRecord

活动邀请记录。

字段：

id
activityId
inviterUserId
inviteeUserId
registrationId
createdAt

当前只是结构准备，尚无真实写入链路。

4. 当前尚未存在的关键模型
User

尚未完成。

V2.4 将引入真实 User。

建议字段：

id
openid
unionid
phone
nickname
avatarUrl
gender
birthday
birthYearMonth
identityType
isMember
isLifetimeMember
registeredAt
lastLoginAt
status
createdAt
updatedAt

User 将成为 nickname/avatar/gender/phone/birthYearMonth/registeredAt/lastLoginAt 主事实源。

PaymentRecord

尚未完成。

用于后续支持：

全款支付
预付
后付
微信交易号
支付回调
对账
ActivityCertificate

尚未完成。

用于：

核销后自动生成证书
证书图片
小程序证书列表
证书分享
CRM 报名记录展示证书
CertificateTemplate

尚未完成。

用于证书模板。

ActivityTemplate

尚未完成。

用于 PC 后台快速创建活动。

ActivityMemory

尚未完成。

用于活动回忆照片和回忆录。

UserCityFootprint

尚未完成。

可先通过核销记录计算，后续性能需要再建表。

CompanionStat

尚未完成。

同行者可先实时计算，后续再缓存。

5. 当前与完整目标的差距

当前已完成活动、报名、订单、退款、发票、CRM 框架。

仍缺：

真实 User
真实微信登录
真实 PaymentRecord
真实证书
真实邀请写入
真实行者地图
腾讯云数据库
COS 文件存储
6. V2.4 数据模型方向

V2.4 增加 User。

原则：

User.id 使用 string。
openid 唯一。
同一 openid 多次登录返回同一 User。
registeredAt 首次创建后不变。
lastLoginAt 每次登录更新。
UserProfile 不删除。
CRM 查询优先 User，fallback UserProfile。
旧 mock userId 数据不能崩。