# 行者学社 V1 — 变更日志

> **文档状态**：目标基线。当前代码未完全实现，开发以本文档为准。

## v1.0.0-p1 (进行中)

目标：活动闭环产品化，用户可通过页面完成完整报名流程。

### 待实现

- `GET /activity` 从真实 DB 查询并附带报名人数
- `GET /activity/:id` 返回完整活动详情
- `GET /activity/:id/status` 返回用户报名状态（含 NOT_REGISTERED）
- ActivityService.onModuleInit 自动种子 5 个活动
- ActivityFlowService.getUserStatus 含 QR 过期自动检测
- ActivityFlowService.getRegisteredCount 报名人数统计
- 前端 3 页面（列表/详情/QR）状态驱动渲染
- 页面按钮根据用户状态动态显示
- 微信开发者工具可打开 WeApp dist 并走完闭环

---

## v1.0.0-p0 (2026-06-16)

工程底座搭建完成。

### 已完成

- 创建 xingzhe-v3 monorepo 目录结构
- Taro 3.6.33 H5 项目，dev:h5 可启动
- Taro 3.6.33 WeApp 项目，build:weapp 可生成 dist
- NestJS 10.3 后端，start:dev 可启动
- TypeORM + better-sqlite3，synchronize 自动建表
- 4 张表：activity / activity_registration / activity_order / activity_qr
- 4 个核心 endpoint：
  - POST /activity/:id/register
  - POST /activity/:id/pay
  - GET /activity/:id/qr
  - POST /activity/:id/checkin
- ActivityFlowService 状态机（register/pay/generateQR/checkin/expireQR）
- QR 幂等性保护
- 状态非法跳转拦截（400 Bad Request）
- webpack ProgressPlugin schema fix（锁定 5.76.0 + webpackChain.delete）
- /health 健康检查端点

### 已知问题

- 前端页面仅 P0 demo（手动输入 userId + activityId），未接入真实列表页
- 无活动种子数据，需通过 API 隐式创建
- 前端 H5 和 WeApp 页面结构不一致（WeApp 缺 activity/detail 和 activity/qr 页面）
- 未验证状态机在重复操作下的幂等行为
