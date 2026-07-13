# CHANGELOG

## 行者学社 CHANGELOG

### 当前版本

当前版本：V2.7.2 Online Test Release。

当前状态：

- 腾讯云线上环境（MySQL + Nginx + HTTPS + PM2）
- Admin + API 走 tenselog.cn 域名
- 小程序体验版 2.7.2 已上传并设为体验版
- 线上闭环已通过：活动报名 → 订单 → 二维码 → 核销 → 退款 → 开票
- Admin 真实 token 登录通过，fake-token 拒绝，无 token 返回 401
- QA Agent blocking = 0（线上后端运行时）
- 尚未接真实微信支付
- 尚未完整证书传播闭环
- 尚未行者地图完整版
- 尚未邀请增长
- 预览版线上测试运行中

---

### V1 / P0：工程底座

已完成：
- xingzhe-v3 monorepo
- NestJS backend
- Taro WeApp
- Taro H5
- TypeORM + better-sqlite3
- SQLite 本地数据库
- Activity / Registration / Order / QR 初始实体
- /health 健康检查

历史限制：
- 前端 demo 化
- 无完整活动列表
- 无真实闭环

---

### P1：小程序活动报名支付闭环

已完成：
- 小程序首页活动列表
- 活动详情页
- 报名支付合并
- 支付成功生成二维码
- 二维码页面
- 线下核销 / 签到
- 已签到状态
- 全部活动列表
- 已结束活动置灰
- 已参加盖章
- 已报名同行者展示

---

### V2.1：订单系统

已完成：
- ActivityOrder 增强
- 订单列表
- paidAt / refundedAt
- payType
- Order 状态管理
- enrollPay 作为主报名支付入口
- getRegisteredCount 基于 Registration
- Admin 默认不展示 PENDING
- PENDING 中文为"交易处理中"

关键规则：
- Registration 是报名事实源
- Order 是支付记录
- 不允许 Order 取代 Registration

废弃：
- POST /activity/:id/register
- POST /activity/:id/pay

---

### V2.2：退款 / 财务 / 发票

已完成：
- ActivityRefund
- ActivityInvoice
- Order.refundedAmount
- Order.refundCount
- 部分退款
- 全额退款
- 财务概览
- 活动财务明细
- 发票申请
- 发票列表
- 发票开具

修复记录：
- ActivityRefund / ActivityInvoice 未注册 app.module.ts 导致 500，已修复
- Refund 不再修改 Registration
- Finance 基于 Order + Refund

---

### V2.2.5：QA Regression Agent v1

已完成：
- tools/qa-agent/qa-runner.js
- qa-business-rules.md
- qa-scope.json
- qa-api-checks.json
- qa.env.example
- README.md
- .local/qa-agent 私有配置
- latest.md / latest.json 报告

修复记录：
- qa-runner 顶层 await 语法错误已修复
- orders-exclude-pending 误报已修复
- 支持豆包 / 火山方舟 LLM 审查
- QA blocking = 0 后允许进入下一阶段

---

### V2.3：CRM 用户运营系统

已完成：

后端：
- UserTag
- UserNote
- UserProfile
- UserInviteRecord
- ActivityInviteRecord
- AdminCrmController
- CRM 用户列表
- CRM 用户详情
- 标签管理
- 备注管理

Admin：
- /crm/users
- /crm/users/:userId
- 用户运营菜单
- 用户列表
- 用户详情
- 标签/备注
- 报名、订单、退款、发票聚合展示

修复记录：
- /admin/crm/users 500：TypeORM select + eager relation 冲突，已移除 select

---

### V2.4：真实用户与微信登录版

V2.4A：后端真实 User + 微信登录 API + QA smoke test
- User Entity（id 为 string，openid 唯一）
- UsersModule 接入 TypeORM
- POST /users/wechat-login
- GET /users/:id/profile
- PATCH /users/:id/profile
- mock 微信登录（mock-code / mock-code-v24-smoke 等）
- registeredAt 首次创建后不变
- lastLoginAt 每次登录更新
- QA user smoke test

V2.4B：小程序登录 + 我的页面
- 小程序底部三栏 tabBar（首页 / 行者之路 / 我的）
- App 启动自动登录 + 缓存 userId
- 我的页面（头像、昵称、性别、手机号、出生年月、年龄、类型）
- 编辑资料（头像选择、昵称、性别、手机号、出生年份/月份分离）
- 类型只读（由 Admin 维护）
- 所有页面使用 user_* 真实 userId，不 fallback 到 1

V2.4C：Admin CRM 接真实 User
- CRM 用户列表优先读取 User 主表
- CRM 用户详情优先读取 User 主表
- User 字段为空时 fallback UserProfile
- User 不存在时兼容旧 mock userId
- Admin 可设置用户 identityType（类型）
- PATCH /admin/crm/users/:userId/type
- 保留 V2.3 标签、备注、统计能力

---

### V2.5：活动产品模型增强版

V2.5A：后端活动模型增强
- Activity 新增 province、prepayAmount、remainingAmount、remainingPayDate、memoryImages、memoryText、requiredUserInfoFields、groupQrType/ImageUrl/Title/Description
- 复用 slog、price、memberPrice、lifetimeMemberPrice、paymentMode、registrationStartTime、registrationEndTime
- 新增 ActivityRegistrationInfo（报名信息快照）
- enrollPay 支持 registrationInfo 校验和保存
- GET /admin/activity/:id/registrations（手机号和身份证号脱敏）
- QA Agent 8 项 V2.5A 检查

V2.5B：Admin 创建 / 编辑活动增强
- 活动创建/编辑表单六组：（基础信息/时间与名额/价格与支付/报名信息收集/活动群二维码）
- 报名信息收集：6 项 checkbox，身份证号敏感提示
- 活动群二维码：群类型下拉、URL 输入、预览
- 支付模式：FULL/PREPAY 切换
- 活动回忆：从主表单移出，改为列表独立"回忆"按钮+弹窗
- 活动详情 drawer 展示完整配置+报名信息脱敏
- QA Agent 4 项 V2.5B 检查

V2.5C：小程序报名流程增强
- 新增报名信息页（/pages/activity/registration-info/）
- requiredUserInfoFields 非空时引导用户补充/确认报名信息
- 报名信息页直接调用 enrollPay（不通过 storage 传递敏感信息）
- 手机号脱敏展示、身份证号脱敏展示
- 身份证号 X/x 格式校验
- 活动详情页报名成功/已报名展示"加入活动群"按钮+弹窗
- 签到码页"加入活动群"按钮+弹窗
- QA Agent 7 项 V2.5C 检查

V2.5D：Documentation Update
- 同步 CHANGELOG、ROADMAP、DATA_MODEL、ADMIN-PRD、ADMIN-API-CONTRACT、UI-STANDARD、SYSTEM 到 V2.5 当前事实

---

### V2.6：活动地点 / 证书模板 / 行者之路

已完成：
- Activity 新增 locationName、locationAddress、locationLat、locationLng、coordinateType、locationProvider 等地点字段
- Admin 活动创建/编辑增加手动坐标录入（GCJ-02）
- 小程序活动详情页展示地点名称和导航（Taro.openLocation）
- CertificateTemplate Entity、CertificateService、CertificateController
- Admin 证书模板管理（列表/创建/编辑/上传/设默认/禁用）
- 小程序证书列表页（mine/certificates）
- 小程序证书详情页（journey/certificate）
- 小程序行者之路页面（trail/index.tsx）
- 小程序活动回忆页（trail/memories）
- UsersService 支持真实用户头像、昵称查询
- 小程序 user.ts 缓存用户 profile

---

### V2.7：线上环境部署版

已完成：
- MySQL 生产模式（TypeORM 双模式：MySQL 生产 / SQLite 本地开发）
- DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE 环境变量
- DB_SYNCHRONIZE 建表开关（首次空库可临时开启，建完后关闭）
- UPLOAD_DIR / PUBLIC_UPLOAD_BASE_URL 上传路径分离
- NODE_ENV=production 判断
- CORS_ORIGIN 跨域配置
- 腾讯云服务器部署（Nginx + HTTPS + PM2 + Certbot）
- Admin 域名：https://admin.tenselog.cn
- API 域名：https://api.tenselog.cn
- uploads 公开访问：https://api.tenselog.cn/uploads/...
- 后端 .env.example 完整字段模板
- ENABLE_DEMO_SEED=false 生产环境强制关闭演示数据

---

### V2.7.1：Admin 安全核销与线上加固

已完成：
- AdminAuthController（POST /admin/auth/login）
- AdminTokenService（HMAC-SHA256 自签名 token，非 JWT 标准）
- JwtAuthGuard（守卫 /admin/* 路由）
- ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_TOKEN_SECRET 环境变量
- ADMIN_TOKEN_EXPIRES_SECONDS 默认 86400 秒
- fake-token 验证拒绝（签名不匹配 → 401）
- 无 token 访问 /admin/* → 401
- Bearer token 格式校验
- 时序安全的签名比对（timingSafeEqual）
- AdminActivityController 全局应用 @UseGuards(JwtAuthGuard)
- Admin 手机核销页 MobileCheckin.vue（选择活动 + 输入核销码 + 签到结果）
- POST /admin/activity/:id/checkin 后端校验 activityId 归属
- 小程序体验版 V2.7.1 上传并设为体验版
- Admin Layout 增加登录/退出逻辑
- admin_token 存储在 localStorage

---

### V2.7.2：Admin 体验优化与订单展示增强

已完成：
- Admin 订单列表增加用户昵称列（userNickname），点击可跳转 CRM 用户详情
- Admin 订单列表增加活动名称列（activityTitle）
- Admin 订单列表用户 ID 缩略展示（前 8 位 + ... + 后 6 位）
- Admin 订单列表列标题优化（"创建"→"创建时间"，"支付"→"最近支付时间"）
- ActivityFlowService.getOrders 注入 User repo，post-query 批量补充 nickname 和 title
- CRM 用户详情页头像使用 assetUrl() 包装
- Admin 订单列表表格支持横向滚动
- 小程序体验版 V2.7.2 上传并设为体验版

---

### 后续版本

历史规划（以下版本均已执行完毕，仅保留为历史参考）：

**V2.6**：证书 / 活动回忆在小程序展示 / 传播增强 → ✅ 已完成（见上方）

**V2.7**：真实支付与 PaymentRecord → 拆分为 V2.7 线上部署版（已完成）+ V2.9 真实支付版（后续）

---

### V2.7.3 Stability & Regression（下一阶段 / 进行中）

目标：线上测试稳定版的稳定性修复与回归验证。

计划内容：
- Admin 卡顿排查（线上 MySQL 连接池 / 查询性能）
- 证书链路完整回归（Admin 模板管理 + 小程序证书展示）
- 已报名行者头像修复（getParticipants 改为查询真实 User 数据）
- 用户详情订单记录展示 0 元订单（不因 amount=0 隐藏）
- 0 元订单退款按钮过滤（amount=0 或已全额退款时隐藏退款按钮）
- PM2 / MySQL / uploads 备份固化
- QA Agent 回归校验

不做事项：
- 真实微信支付 / PaymentRecord
- 真实微信退款回调
- 会员价格差异化
- 发票系统增强
- RBAC / 多管理员 / 操作日志
- 新 Entity / 大表结构

推荐路线（V2.7.3 完成后）：
- V2.8：活动内容增强 / 会员价格 / 发票 / 证书证书图片生成
- V2.9：真实微信支付与财务闭环
- V3.0：正式提审 / 增长 / CRM 运营体系强化 / 云部署完整化

记录：

V2.8 Release Fix

V2.8.1

V2.8.2

V2.8.2-Fix

格式：

Added
Fixed
Changed
Migration
Deployment

## V2.8 Final

### Added
- V2.8.3：报名补充资料、用户常用报名资料、报名快照和 Admin 查看。
- V2.8.3.1：Admin 订单详情 Drawer。
- V2.8.4A：公开核销接口封堵、二维码鉴权、真实二维码展示、二维码状态文案修复。
- V2.8.4B：QR 多版本、核销留痕字段、工作人员活动列表、工作人员扫码接口、原子核销与幂等。
- V2.8.4C：小程序工作人员工具、活动/阶段选择、单次扫码、连续扫码。

### Fixed
- 普通用户不能修改 `identityType`。
- `/users/me/registration-profile` 不再携带 `userId` query。
- `postpayDate` 保存兼容 ISO datetime，并按 Asia/Shanghai 归一为 `YYYY-MM-DD`。
- 活动详情费用与后付款卡片合并，后付款入口保留。

### Migration
- 新增 `user_registration_profile`。
- `activity_registration` 新增 `checkedInAt`、`checkedInByUserId`、`checkinSource`。
- `activity_qr` 新增 `stage`、`version`、`supersededAt`、`revokedAt`，移除 `registrationId` 单列唯一，保留 `code` 唯一，新增 `registrationId + version` 唯一。

### Not Included
- 真实微信支付、真实原路退款、微信订阅消息、支付/退款账本、活动级工作人员权限。
