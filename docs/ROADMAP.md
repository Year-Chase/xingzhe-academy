# 行者学社 V1 — 路线图

> **文档状态**：目标基线。当前代码未完全实现，开发以本文档为准。

## 版本定义

| 阶段 | 目标 | 验收标准 |
|---|---|---|
| **P0** | 工程可运行 | H5 可启动、WeApp 可编译、Backend 可运行、基础 API 可调用 |
| **P1** | 活动闭环可产品化 | 用户通过页面完成 报名→支付→QR→核销 完整闭环，不依赖 Postman/curl |
| **P2** | 扩展能力 | 证书、足迹、积分、会员、微信支付、管理后台 |

当前代码在 P0→P1 过渡阶段。本文档描述 P1 完成态。

---

## P0 — 工程底座 ✅（基础完成）

### 已完成

- [x] Taro H5 项目可启动（apps/h5）
- [x] Taro WeApp 项目可编译生成 dist（apps/weapp）
- [x] NestJS 后端可启动（backend, port 3000）
- [x] TypeORM 连接 SQLite（backend/data/xingzhe.db）
- [x] /health 健康检查端点
- [x] Activity 实体定义（activity.entity.ts）
- [x] Registration、Order、QR 实体定义
- [x] webpack ProgressPlugin schema fix（webpack 5.76.0 + webpackChain delete）

### 待补全

- [ ] P1 的 activity/detail 和 activity/qr 前端页面
- [ ] P1 的 ActivityFlowService（getUserStatus、getRegisteredCount）
- [ ] P1 的种子数据自动插入
- [ ] P1 的状态机非法跳转校验

---

## P1 — 活动闭环产品化（当前阶段）

### 后端

- [ ] `GET /activity` 返回真实 DB 数据 + 报名人数
- [ ] `GET /activity/:id` 返回完整活动详情
- [ ] `GET /activity/:id/status?userId=` 返回用户状态（NOT_REGISTERED~EXPIRED）
- [ ] `POST /activity/:id/register` 幂等注册
- [ ] `POST /activity/:id/pay` 状态保护（仅 REGISTERED→PAID）
- [ ] `GET /activity/:id/qr` 幂等生成 QR（仅 PAID→ACTIVE）
- [ ] `POST /activity/:id/checkin` QR 核销（ACTIVE→CHECKED_IN）
- [ ] ActivityService.onModuleInit 自动种子 5 个活动
- [ ] ActivityFlowService.getUserStatus 含 QR 自动过期检测

### 前端 H5（3 页）

- [ ] 活动列表页：真实 API 数据、卡片展示（标题/时间/地点/报名数）、点击导航
- [ ] 活动详情页：完整活动信息、状态驱动按钮（报名/支付/QR/签到/过期）、个人状态标签
- [ ] 签到二维码页：二维码视觉展示、24h 倒计时、ACTIVE/CHECKED_IN/EXPIRED 三态

### 前端 WeApp（3 页）

- [ ] 同 H5 三页内容

### 验收

- [ ] `./p1-verify.sh` 全部 PASS
- [ ] H5 浏览器手动走完整闭环
- [ ] WeApp 微信开发者工具手动走完整闭环

---

## P2 — 产品化扩展（未来）

### 计划但不承诺时间

- 微信真实支付对接
- 用户注册/登录（微信授权）
- 活动发布管理后台
- 证书/勋章系统
- 运动足迹记录
- 积分体系
- 会员等级
- 推送通知
- 数据统计面板

### P2 前置条件

- P1 全部验收通过
- 至少 3 个真实用户完成完整闭环
- 微信支付商户号已申请

---

## 里程碑时间线（建议）

| 里程碑 | 预计日期 | 判断标准 |
|---|---|---|
| P0 完成 | 2026-06-16 | 三端可启动 |
| P1 完成 | 2026-06-20 | 闭环用户验证通过 |
| P2 启动 | 2026-07 后 | P1 验收报告签字 |

P1 — WeApp 活动报名支付闭环：DONE

状态：已完成
Git Tag：p1-weapp-enrollment-flow
Commit：aedb819 feat: complete weapp activity enrollment flow p1

P1 已完成内容：

小程序首页活动列表
活动详情页
报名支付合并
支付成功后生成签到二维码
查看签到码
线下核销 / 签到
签到后显示「✓ 已签到」
全部活动列表
已结束活动置灰
已参加活动盖章
已报名同行者展示
本人同行者特殊展示
UI-STANDARD.md 建立
P2 — Admin 管理后台 MVP：NEXT

P2 目标：

运营者可以在 PC 管理后台完成活动创建、发布、编辑、下架、报名查看和订单基础查看，并让小程序读取后台创建的真实活动。

P2 不继续使用 Taro H5。
P2 新建独立 Admin 工程：apps/admin。

P2 阶段拆分：

P2.0 文档冻结
冻结 Admin PRD
冻结 Admin API Contract
冻结 P2 QA Checklist
明确 P2 不做复杂财务、退款、发票、证书、会员、邀请统计
P2.1 Admin 基础工程
新建 apps/admin
选型 Vue 3 + Vite + TypeScript
建立基础布局
建立路由
建立 API client
建立环境变量
登录先 mock 或简化
P2.2 活动管理闭环
活动列表
创建活动
编辑活动
发布活动
下架活动
查看活动状态
查看报名人数
后端补齐 admin activity API
P2.3 报名与订单只读中心
查看某活动报名成功用户
查看报名状态
查看签到状态
查看支付记录
查看订单基础信息
暂不做退款、发票实际操作
P2.4 用户管理只读版
用户列表
用户详情
参加活动次数
支付金额
退款金额
去过城市 / 省份字段预留
P2.5 Admin 与 WeApp 联动验证
后台创建活动
后台发布活动
小程序首页可见
小程序可报名支付
小程序可生成二维码
小程序可核销
后台可看到报名 / 签到状态
P2.6 P2 完整验收
Admin 核心流程通过
WeApp P1 回归通过
QA Agent 参与验收
Git 提交 P2 baseline
打 P2 tag