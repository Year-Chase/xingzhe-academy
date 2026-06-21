# ADMIN-API-CONTRACT.md

# 行者学社 Admin API Contract

## 1. API 设计原则

Admin API 服务于 PC 管理后台。

P2 阶段 API 目标是支撑活动管理、报名查看、订单只读、用户只读，不做复杂财务、退款、发票和证书。

所有 Admin API 均由 backend 提供。

Admin 不直接访问数据库。

## 2. API 前缀

建议 P2 使用：

```text
/admin
```

例如：

```text
GET /admin/activity
POST /admin/activity
PATCH /admin/activity/:id
POST /admin/activity/:id/publish
POST /admin/activity/:id/close
GET /admin/activity/:id/registrations
GET /admin/orders
GET /admin/users
```

## 3. 活动管理 API

### 3.1 获取活动列表

```http
GET /admin/activity?page=1&limit=20&status=PUBLISHED
```

Query：

* page
* limit
* status，可选
* keyword，可选

Response：

```json
{
  "items": [
    {
      "id": 1,
      "title": "城市徒步",
      "description": "活动描述",
      "location": "北京",
      "city": "北京",
      "startTime": "2026-06-21T08:00:00.000Z",
      "endTime": "2026-06-21T12:00:00.000Z",
      "capacity": 30,
      "registeredCount": 12,
      "status": "PUBLISHED",
      "coverImage": "",
      "price": 199,
      "createdAt": "2026-06-21T00:00:00.000Z",
      "updatedAt": "2026-06-21T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 3.2 获取活动详情

```http
GET /admin/activity/:id
```

Response：

```json
{
  "id": 1,
  "title": "城市徒步",
  "description": "活动描述",
  "location": "北京",
  "city": "北京",
  "startTime": "2026-06-21T08:00:00.000Z",
  "endTime": "2026-06-21T12:00:00.000Z",
  "capacity": 30,
  "registeredCount": 12,
  "status": "PUBLISHED",
  "coverImage": "",
  "price": 199,
  "memberPrice": 169,
  "lifetimeMemberPrice": 99,
  "paymentMode": "FULL",
  "createdAt": "2026-06-21T00:00:00.000Z",
  "updatedAt": "2026-06-21T00:00:00.000Z"
}
```

### 3.3 创建活动

```http
POST /admin/activity
```

Body：

```json
{
  "title": "城市徒步",
  "description": "活动描述",
  "location": "北京奥森",
  "city": "北京",
  "startTime": "2026-06-21T08:00:00.000Z",
  "endTime": "2026-06-21T12:00:00.000Z",
  "capacity": 30,
  "coverImage": "",
  "price": 199,
  "memberPrice": 169,
  "lifetimeMemberPrice": 99,
  "paymentMode": "FULL"
}
```

Response：

```json
{
  "id": 1,
  "status": "DRAFT"
}
```

### 3.4 编辑活动

```http
PATCH /admin/activity/:id
```

Body：

```json
{
  "title": "城市徒步更新",
  "description": "活动描述更新",
  "location": "北京奥森南门",
  "city": "北京",
  "startTime": "2026-06-21T08:00:00.000Z",
  "endTime": "2026-06-21T12:00:00.000Z",
  "capacity": 30,
  "coverImage": "",
  "price": 199
}
```

Response：

```json
{
  "id": 1,
  "updated": true
}
```

### 3.5 发布活动

```http
POST /admin/activity/:id/publish
```

Response：

```json
{
  "id": 1,
  "status": "PUBLISHED"
}
```

### 3.6 下架活动

```http
POST /admin/activity/:id/close
```

Response：

```json
{
  "id": 1,
  "status": "CLOSED"
}
```

## 4. 报名管理 API

### 4.1 查看活动报名人员

```http
GET /admin/activity/:id/registrations?page=1&limit=50
```

Response：

```json
{
  "items": [
    {
      "registrationId": 1,
      "activityId": 1,
      "userId": "1",
      "nickname": "行者 1",
      "avatarUrl": "",
      "gender": "未知",
      "registrationStatus": "PAID",
      "paymentStatus": "PAID",
      "qrStatus": "ACTIVE",
      "checkedIn": false,
      "paidAt": "2026-06-21T00:00:00.000Z",
      "checkedInAt": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

## 5. 订单只读 API

### 5.1 获取订单列表

```http
GET /admin/orders?page=1&limit=20&activityId=1
```

Response：

```json
{
  "items": [
    {
      "orderId": 1,
      "activityId": 1,
      "activityTitle": "城市徒步",
      "userId": "1",
      "nickname": "行者 1",
      "amount": 199,
      "paymentType": "FULL",
      "paymentStatus": "PAID",
      "paidAt": "2026-06-21T00:00:00.000Z",
      "refundStatus": "NONE",
      "refundAmount": 0
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

P2 不做：

* 发起退款
* 完成退款
* 开票
* 财务对账

## 6. 用户只读 API

### 6.1 获取用户列表

```http
GET /admin/users?page=1&limit=20&keyword=
```

Response：

```json
{
  "items": [
    {
      "userId": "1",
      "nickname": "行者 1",
      "avatarUrl": "",
      "gender": "未知",
      "phone": "",
      "joinedActivityCount": 3,
      "checkedInActivityCount": 2,
      "totalPaidAmount": 398,
      "totalRefundAmount": 0,
      "createdAt": "2026-06-21T00:00:00.000Z",
      "lastLoginAt": "2026-06-21T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

## 7. 状态定义

### 活动状态

```text
DRAFT       草稿
PUBLISHED   已发布
CLOSED      已下架
ENDED       已结束
```

### 报名状态

```text
NOT_REGISTERED  未报名
PAID            已报名 / 已支付
CHECKED_IN      已签到
REFUNDED        已退款
```

### 二维码状态

```text
NONE      未生成
ACTIVE    可核销
USED      已核销
EXPIRED   已过期
```

### 支付状态

```text
UNPAID
PAID
REFUNDED
PARTIAL_REFUNDED
```

## 8. P2 验收要求

Admin API 必须支持：

* 活动列表
* 活动详情
* 创建活动
* 编辑活动
* 发布活动
* 下架活动
* 查看报名人员
* 查看订单列表
* 查看用户列表

Admin API 不得破坏 P1 小程序接口：

* GET /activity
* GET /activity/all
* GET /activity/:id
* GET /activity/:id/status
* POST /activity/:id/enroll-pay
* GET /activity/:id/qr
* POST /activity/:id/checkin
* GET /activity/:id/participants
