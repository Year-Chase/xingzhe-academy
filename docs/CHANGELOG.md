# CHANGELOG

## 行者学社 CHANGELOG

### 当前版本

当前版本：V2.5 活动产品模型增强版。

当前状态：

- 本地 SQLite 可运行
- Admin + WeApp + Backend 可联动
- QA Agent blocking = 0（本地后端运行时）
- 尚未云部署
- 尚未真实微信支付完整版
- 尚未证书传播闭环
- 尚未行者地图

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

### 后续版本

- V2.6：证书 / 活动回忆在小程序展示 / 传播增强
- V2.7：真实支付与 PaymentRecord
- V2.8：部署 / HTTPS / 对象存储 / 生产安全
- V2.x：企业微信 API / 自动入群 / 权限收紧
