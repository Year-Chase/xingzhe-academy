# ROADMAP

## 行者学社 ROADMAP

### 1. 当前版本

当前版本：V2.7.2 Online Test Release（线上测试稳定版）。

当前状态：
- P1 小程序活动报名支付闭环 ✅
- V2.1 订单系统 ✅
- V2.2 退款 / 财务 / 发票 ✅
- V2.2.5 QA Agent ✅
- V2.3 CRM 用户运营 ✅
- V2.4 真实用户与微信登录 ✅
- V2.5 活动产品模型增强 ✅
- V2.6 活动地点 / 证书模板 / 行者之路 ✅
- V2.7 线上部署（腾讯云 MySQL + Nginx + HTTPS + PM2）✅
- V2.7.1 Admin 安全核销 + 手机核销 ✅
- V2.7.2 Admin 体验优化 + 订单展示增强 ✅

当前已经完成：
- 线上环境已搭建（腾讯云 Ubuntu 24.04）
- 小程序体验版 2.7.2 已上传并设为体验版
- Admin 真实 token 登录通过
- fake-token 拒绝验证通过
- 无 token 返回 401
- 活动报名到核销主链路通过
- Admin 手机核销闭环通过

当前不是：
- 正式商业发布版
- 真实微信支付完整版
- 完整证书传播版
- 邀请增长版
- 会员差异化价格版

**历史版本说明**：ROADMAP 中 V2.5 / V2.6 / V2.7 的描述已由后续版本替代。以下各节标题保留但内容已标注实际完成状态。

---

### 2. 已完成

**P0 工程底座**：Monorepo / Backend / WeApp / H5 / SQLite / TypeORM / 基础实体

**P1 小程序活动闭环**：活动列表 / 活动详情 / 报名支付合并 / 二维码 / 核销 / 已签到 / 已参加盖章 / 全部活动 / 已结束置灰 / 同行者展示

**V2.1 订单系统**：ActivityOrder / 订单列表 / PENDING 默认隐藏 / enrollPay 主入口 / register/pay 旧接口废弃

**V2.2 退款/财务/发票**：ActivityRefund / ActivityInvoice / 部分退款 / 全额退款 / 财务概览 / 活动财务明细 / 发票申请 / 发票开具

**V2.2.5 QA Agent**：QA runner / 静态检查 / API 检查 / LLM 审查 / latest.md / latest.json / blocking 机制

**V2.3 CRM 用户运营**：CRM 用户列表 / 详情 / 标签 / 备注 / 用户统计 / UserProfile 过渡表

**V2.4 真实用户与微信登录版**：真实 User / mock 微信登录 / 小程序我的页面 / Admin CRM 接真实 User

---

### 3. V2.5 活动产品模型增强版 — 已完成

V2.5A：后端活动模型增强 — 完成
- Activity 新增 province、prepayAmount、remainingAmount、remainingPayDate、memoryImages、memoryText、requiredUserInfoFields、groupQr 字段
- 新增 ActivityRegistrationInfo 报名信息快照
- enrollPay 支持 registrationInfo 校验与保存

V2.5B：Admin 创建 / 编辑活动增强 — 完成
- 六组表单（基础信息/时间与名额/价格与支付/报名信息收集/活动群二维码）
- 活动回忆独立"回忆"按钮+弹窗
- Admin 报名记录身份证号脱敏

V2.5C：小程序报名流程增强 — 完成
- 报名信息补充/确认页
- 报名成功后活动群二维码弹窗
- 签到码页活动群入口
- 身份证号 X/x 校验与脱敏

V2.5D：Documentation Update — 进行中

注意：活动模板不是 V2.5 范围，后续再评估。

---

### 4. V2.6 活动地点 / 证书模板 / 行者之路 — 已完成 ✅

目标：活动地点导航、证书模板管理、小程序展示证书和活动回忆。

已完成：
- Activity 地点字段（locationName, locationAddress, locationLat, locationLng, coordinateType, locationProvider）
- Admin 手动坐标录入（GCJ-02）
- 小程序活动详情页地点导航（Taro.openLocation）
- CertificateTemplate Entity + CRUD API
- Admin 证书模板管理页
- 小程序证书列表页、证书详情页
- 小程序行者之路页面
- 小程序活动回忆页面

未完成（后续版本）：
- 核销后自动生成证书（计划 V2.8）
- 证书图片生成（计划 V2.8）
- 证书分享微信好友/朋友圈（计划 V2.8）

---

### 5. V2.7 线上部署版 — 已完成 ✅

目标：从本地系统变成线上可运营系统。

V2.7.0 已完成：
- 腾讯云 MySQL 数据库
- Nginx 反向代理
- HTTPS（Certbot）
- HTTP 自动跳转 HTTPS
- 后端部署（PM2）
- Admin 静态部署
- 小程序体验版上传
- Admin 域名：https://admin.tenselog.cn
- API 域名：https://api.tenselog.cn

V2.7.1 Admin 安全核销：
- Admin token 登录（HMAC-SHA256 自签名）
- JwtAuthGuard 守卫 /admin/* 路由
- fake-token 拒绝 + 无 token 401
- Admin 手机核销页
- POST /admin/activity/:id/checkin

V2.7.2 Admin 体验优化：
- 订单列表用户昵称/活动名称展示
- 用户 ID 缩略展示
- 用户头像 assetUrl 展示
- 表格横向滚动

---

### 6. V2.7.3 Stability & Regression（下一阶段）

目标：线上测试稳定版的问题修复与稳定性强化。

内容：
- Admin 卡顿排查
- 证书链路完整回归
- 已报名行者头像修复（getParticipants 接入真实 User 数据）
- 用户详情订单记录展 0 元订单
- 0 元订单退款按钮过滤
- PM2 / MySQL / uploads 备份固化
- QA Agent 回归

不做：
- 真实微信支付 / PaymentRecord
- 证书图片生成
- 企业微信 API
- RBAC / 多管理员
- 新 Entity / 大表结构

---

### 7. 推荐后续路线

V2.8：活动内容增强 / 会员价格 / 发票增强 / 证书图片生成
V2.9：真实微信支付与财务闭环 / PaymentRecord
V3.0：正式提审 / 增长 / CRM 运营体系强化 / COS 对象存储

---

### 8. V2.x 企业微信 API / 自动入群 / 权限收紧（后续评估）

目标：企业微信对接与运营效率提升。

当前状态：未启动，待 V2.8+ 评估。

---

### 9. 执行原则

- 每阶段先文档后开发
- 每阶段 QA blocking = 0 才进入下一阶段
- Claude 不自动 git
- 不使用 git add .
- 不提交数据、上传文件、env、私有配置
- Claude 完成后输出 QA Agent 检查清单，不允许用"我已验证通过"替代 QA Agent 报告
