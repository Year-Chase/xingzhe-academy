# 行者学社数据模型 V1 Frozen

User

id
nickname
avatar
gender
phone
memberType

NORMAL
HONOR

invitedByUserId

Activity

id
title
slogan
city
category
coverImage
galleryImages
description
coverImage

meetingLocation
activityLocation

startTime
endTime

registerStartTime
registerEndTime

capacity

normalPrice
honorPrice

paymentType

FREE
FULL
PREPAY

status

DRAFT
PUBLISHED
REGISTERING
REGISTER_END
ONGOING
FINISHED
CLOSED

Registration

id
userId
activityId

status

REGISTERED
PAID
CHECKED_IN
REFUNDED

Order

id
userId
activityId

totalAmount

prepaidAmount

remainingAmount

status

CREATED
PREPAID
PAID
COMPLETED
REFUNDED_PARTIAL
REFUNDED_FULL

PaymentRecord

id
orderId

amount

paymentType

WECHAT
OFFLINE

RefundRecord

id
orderId

amount

reason

Invoice

id
orderId

title

taxNumber

status

PENDING
COMPLETED

QRCode

id

userId

activityId

code

status
ACTIVE 属于 QRCode 状态

不属于 Registration 状态

ACTIVE
CHECKED_IN
EXPIRED

Certificate

id

userId

activityId

templateId

status

ACTIVE
REVOKED

source

AUTO_CHECKIN
ADMIN_GRANT

Badge

id

name

image

description

source

AUTO
ADMIN

Footprint

id

userId

country

province

city

activityCount

CompanionStat

id

userA

userB

companionCount

ActivityInvite

id

activityId

inviterUserId

inviteeUserId

P2 Admin 数据关注点

P2 不优先重构数据库模型，但需要明确 Admin 页面关注的数据字段。

活动管理字段
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
报名管理字段
registrationId
activityId
userId
userName
nickname
avatarUrl
gender
status
paidAt
checkedInAt
qrStatus
orderId
订单只读字段
orderId
activityId
userId
amount
paymentType
paymentStatus
paidAt
refundStatus
refundAmount
用户只读字段
userId
nickname
avatarUrl
gender
phone
identity
joinedActivityCount
checkedInActivityCount
totalPaidAmount
totalRefundAmount
createdAt
lastLoginAt

P2 可以先使用现有字段与 mock 字段，后续 P3 再补完整财务、发票、证书、邀请统计模型。