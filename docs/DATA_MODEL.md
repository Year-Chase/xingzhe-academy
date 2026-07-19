# DATA_MODEL

## 行者学社 DATA_MODEL

### 1. 当前版本

当前版本：V2.7.2 Online Test Release。

数据库：双模式

本地开发：`/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db`（SQLite / better-sqlite3）

线上生产：MySQL（腾讯云），通过 DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE 环境变量配置

---

### 2. 数据事实源原则

- Activity：活动事实源
- ActivityRegistration：报名事实源
- ActivityOrder：支付记录
- ActivityRefund：退款事实源
- ActivityInvoice：发票事实源
- ActivityQR：核销二维码事实源
- User：真实用户主表
- ActivityRegistrationInfo：报名信息快照
- UserRegistrationProfile：用户常用报名资料
- ActivityCategory：活动主题分类
- OperationBanner：小程序首页运营 Banner
- UserTag：CRM 标签
- UserNote：CRM 备注
- UserProfile：V2.3 过渡用户资料（保留为 fallback）
- UserInviteRecord：注册邀请结构
- ActivityInviteRecord：活动邀请结构

禁止：
- 用 Order 统计报名人数
- 退款修改 Registration
- CRM 修改核心业务状态
- 恢复 register/pay 旧链路

---

### 3. Activity

V2.5 完整字段（以代码为准）：

**基础信息**：id, title, slogan, province, description, location, city, coverImage

**活动主题分类（V2.9C/F）**：categoryId，关联 ActivityCategory；历史活动允许为空；小程序展示 `category.name`

**时间**：startTime, endTime, registrationStartTime, registrationEndTime

**名额与价格**：capacity, price, memberPrice, lifetimeMemberPrice, paymentMode

**预付/后付配置（V2.5A）**：prepayAmount, remainingAmount, remainingPayDate

**报名信息收集（V2.5A）**：requiredUserInfoFields（JSON string）

**活动群二维码（V2.5A）**：groupQrType, groupQrImageUrl, groupQrTitle, groupQrDescription

**活动回忆（V2.5A）**：memoryImages（JSON string）, memoryText

**状态**：status（DRAFT/PUBLISHED/CLOSED/ENDED）

**时间戳**：createdAt, updatedAt

**明确禁止重复同义字段**：
- 不使用 registerStartTime / registerEndTime
- 不使用 registrationStartAt / registrationEndAt
- 不使用 activityStartAt / activityEndAt
- 不使用 payMode / normalPrice

---

### 4. requiredUserInfoFields 报名信息收集

固定枚举：
- realName：真实姓名
- phone：手机号
- idCardNo：身份证号
- departureCity：出发城市
- transportPreference：交通工具偏好
- roomPreference：房间偏好

存储规则：
- 后端按 JSON string 存储（如 `["realName","phone"]`）
- 读取时兼容数组、JSON string、空字符串、null、非法 JSON
- 解析失败统一降级为 `[]`

业务规则：
- 空数组：小程序报名不增加报名信息步骤
- 非空数组：小程序报名时必须补充并确认对应字段
- 当前产品语义：未勾选 = 不收集；已勾选 = 收集且必填
- V2.8.3 继续以 requiredUserInfoFields 作为唯一活动报名字段配置来源，不新增三态配置

---

### 5. ActivityRegistrationInfo

活动报名信息快照。

字段：id, activityId, registrationId（支付成功后绑定）, userId, realName, phone, idCardNo, departureCity, transportPreference, roomPreference, confirmedAt, createdAt, updatedAt

规则：
- 不替代 User
- 不替代 Registration
- 不替代 Order
- 不修改报名状态
- 不修改支付状态
- 不参与报名人数统计
- 作为本次报名快照，不因用户后续修改常用报名资料而自动覆盖

---

### 5.1 UserRegistrationProfile

用户常用报名资料。

字段：id, userId（unique）, realName, phone, idCardNo, departureCity, transportPreference, roomPreference, createdAt, updatedAt

规则：
- 不替代 User
- 不替代 ActivityRegistrationInfo
- 仅用于下次报名自动带出
- 报名成功后，只合并更新当前活动 requiredUserInfoFields 中的标准字段
- 本次活动未收集的历史字段不清空
- 自动带出优先级：UserRegistrationProfile > User.phone fallback > 空值
- 身份证号不得进入 URL、Storage 或日志

---

### 6. groupQr 活动群二维码

字段：groupQrType, groupQrImageUrl, groupQrTitle, groupQrDescription

枚举：
- NONE：不展示
- WECHAT_GROUP：微信群二维码
- WECOM_GROUP：企业微信群二维码
- WECOM_LIVE_CODE：企业微信群活码

默认值：
- groupQrType = NONE
- groupQrTitle = 加入活动群
- groupQrDescription = 活动通知、集合安排和现场事项将在群内同步

V2.5C 规则：GET /activity/:id 直接返回 groupQrImageUrl，小程序活动详情页和签到码页展示。当 groupQrType != NONE 且 groupQrImageUrl 不为空时 hasGroupQr = true。后续权限体系完善后，收紧为仅已报名/已支付用户返回。

---

### 7. 其他 Entity

**ActivityRegistration**：id, userId, activityId, status (REGISTERED/PAID/CHECKED_IN/EXPIRED), createdAt

**ActivityOrder**：id, userId, activityId, registrationId, amount, refundedAmount, refundCount, status (PENDING/PAID/FAILED/PARTIAL_REFUND/REFUNDED), payType, paidAt, refundedAt, createdAt

**ActivityRefund**：id, orderId, userId, activityId, amount, reason, status (SUCCESS/FAILED), createdAt

**ActivityInvoice**：id, orderId, userId, activityId, title, taxNo, amount, status (REQUESTED/ISSUED/CANCELED), issuedAt, createdAt

**ActivityQR**：id, userId, activityId, registrationId, code, status (ACTIVE/USED/EXPIRED), expiresAt, createdAt

**User**：id (user_xxx), openid (unique), unionid, phone, nickname, avatarUrl, gender, birthday, birthYearMonth, identityType, isMember, isLifetimeMember, registeredAt, lastLoginAt, status, createdAt, updatedAt

**UserTag**：id, userId, tag, createdAt（仅影响 CRM 运营）

**UserNote**：id, userId, note, createdAt（仅影响 CRM 运营）

**UserProfile**：id, userId (unique), birthYearMonth, registeredAt, lastLoginAt, createdAt（V2.3 过渡表，保留为 fallback）

**UserRegistrationProfile**：id, userId (unique), realName, phone, idCardNo, departureCity, transportPreference, roomPreference, createdAt, updatedAt

**ActivityCategory**：id, name, code(unique), description, sortOrder, status(ACTIVE/INACTIVE), createdAt, updatedAt。当前表示活动主题分类，用于活动筛选、首页展示和运营统计，不表示长期活动品牌/IP。

**OperationBanner**：id, imageUrl, title, description, sortOrder, status(ACTIVE/INACTIVE), startAt, endAt, jumpType(NONE/ACTIVITY/CATEGORY/SERIES), jumpValue, createdAt, updatedAt。`SERIES` 仅为未来预留，当前 Admin 禁止配置。

**UserInviteRecord**：id, inviterUserId, inviteeUserId, createdAt

**ActivityInviteRecord**：id, activityId, inviterUserId, inviteeUserId, registrationId, createdAt

---

### 8. 当前模型状态

已实现的模型（以代码为准）：
- CertificateTemplate ✅（V2.6，证书模板管理）
- Activity 地点字段 ✅（V2.6，locationName/Address/Lat/Lng 等）

尚未存在的模型：
- PaymentRecord：用于后付支付、微信交易号、对账（计划 V2.9）
- ActivityCertificate：核销后证书实例（计划 V2.8）
- ActivityTemplate：活动模板（后续评估）
- UserCityFootprint / CompanionStat（后续版本）

**历史版本说明**：旧版本文档将 CertificateTemplate 和 ActivityCertificate 列为"尚未存在"，当前 CertificateTemplate 已实现。ActivityCertificate 仍待后续版本。

---

### 9. 0 元订单规则

amount=0 的订单（0 元活动报名产生）：
- 是真订单，必须通过 ActivityFlowService.enrollPay() 生成
- 应在 Admin 订单列表展示（金额显示为 ¥0.00）
- 应在 CRM 用户详情订单记录中展示
- 不展示可点击退款按钮（amount=0 或已全额退款时隐藏）
- 后端 refund 方法有 amount > 0 校验作为防线
- 不得调用真实退款接口

### 10. 关键实体关联

Activity ← Registration（N:1，报名事实源）
ActivityCategory ← Activity（1:N，活动主题分类）
Registration ← Order（1:1，支付记录）
Registration ← QR（1:1，核销二维码）
Order ← Refund（1:N，退款记录）
Order ← Invoice（1:N，发票记录）
Activity ← ActivityRegistrationInfo（1:N，报名信息快照）
User ← Registration（1:N）
User ← Order（1:N）
User ← UserRegistrationProfile（1:1，常用报名资料）
CertificateTemplate ← Activity（N:1，活动关联证书模板）
OperationBanner 为首页运营位，不直接成为活动事实源；Banner 可跳转活动或活动主题。

### 10.1 Activity Series 预留

当前不新增 `activity_series`。

未来触发条件：
- 单一活动主题需要多城市、多周期、多年度运营；
- 需要品牌/IP 级封面、描述、排序、状态和独立运营页；
- 需要 Series 维度统计或长期用户沉淀。

未来建议模型：
- activity_series(id, name, code, description, coverImage, status, sortOrder, createdAt, updatedAt)
- series 1:N activity

当前版本继续使用 `activity_category` 承担主题展示职责。

### 11. 身份证号保护规则

格式覆盖：15位数字 / 18位数字 / 17位数字+X / 17位数字+x

正则：`/^(?:\d{15}|\d{17}[\dXx])$/`

规则：
- 可以通过 POST body 提交完整身份证号
- 不得出现在 URL query
- 不得写入小程序 Storage
- 不得 console.log
- 不得进入 QA latest.md / latest.json
- Admin 和小程序展示时必须脱敏

脱敏格式：`110***********1234` / `110***********123X`

核心表
activity

user

registration

activity_order

activity_invoice

user_invoice_profile

说明：

订单：

包含：

价格快照
预付款
后付款
退款状态

发票：

拆：

用户默认信息：

user_invoice_profile

订单申请：

activity_invoice

新增模型原则：

V2.8.3：

不要：

直接 user 增字段

应该：

UserProfile
RegistrationSnapshot
ActivityFieldConfig

## V2.8-Final 数据模型

### 报名补充资料

- 活动字段配置：`activity.requiredUserInfoFields`，勾选即收集且必填。
- 用户常用报名资料：`user_registration_profile`，按 `userId` 一人一条，用于下次报名自动带出。
- 本次报名快照：`activity_registration_info`，按报名/活动独立保存，不随用户常用资料后续变化覆盖历史。

### 订单与后付款

- `activity_order` 保存价格快照、预付款、后付款、后付款状态、提醒次数、免除信息和退款累计。
- 未支付后付款不计入可退款金额。

### 核销与 QR

- `activity_registration` 保存最终签到状态和留痕字段：`checkedInAt`、`checkedInByUserId`、`checkinSource`。
- `activity_qr` 支持多版本：`stage`、`version`、`supersededAt`、`revokedAt`。
- `activity_qr.code` 仍唯一；`registrationId + version` 唯一；`registrationId` 单列不再唯一。
- 历史 QR 默认为 `stage=LEGACY`、`version=1`，不伪造历史 `checkedInAt`。
