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