# ROADMAP

## 行者学社 ROADMAP

### 1. 当前版本

当前版本：V2.5 活动产品模型增强版。

当前状态：
- P1 小程序活动报名支付闭环完成
- V2.1 订单系统完成
- V2.2 退款 / 财务 / 发票完成
- V2.2.5 QA Regression Agent v1 完成
- V2.3 CRM 用户运营框架完成
- V2.4 真实用户与微信登录版完成
- V2.5 活动产品模型增强版完成（开发与本机验收，待 V2.5D 后 Git checkpoint）

当前不是：
- 生产上线版
- 真实微信支付完整版
- 证书传播版
- 行者地图版
- 邀请增长版
- 云数据库版

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

### 4. 下一版本：V2.6 证书 / 活动回忆在小程序展示 / 传播增强

目标：核销后自动生成证书，小程序展示证书和活动回忆。

内容：
- 核销后自动生成证书
- 证书模板
- 证书图片生成
- 小程序证书列表
- 证书详情
- 活动回忆在小程序展示
- 证书分享微信好友/朋友圈

---

### 5. V2.7 真实支付与订单增强版

目标：生产可用支付订单系统。

内容：
- 微信支付下单
- 支付回调
- 全款支付
- 预付支付
- 后付支付
- 后付提醒
- PaymentRecord
- 微信退款回调
- 对账
- 发票抬头从小程序提交

---

### 6. V2.8 部署 / HTTPS / 对象存储 / 生产安全

目标：从本地系统变成线上可运营系统。

内容：
- 腾讯云数据库
- 数据库迁移
- COS 图片/证书存储
- HTTPS
- 后端部署
- Admin 部署
- 小程序正式环境
- 小程序提审

---

### 7. V2.x 企业微信 API / 自动入群 / 权限收紧

目标：企业微信对接与运营效率提升。

内容：
- 企业微信群活码自动替换
- 自动拉人
- 自动退群
- 群成员同步
- 权限体系

---

### 8. 执行原则

- 每阶段先文档后开发
- 每阶段 QA blocking = 0 才进入下一阶段
- Claude 不自动 git
- 不使用 git add .
- 不提交数据、上传文件、env、私有配置
