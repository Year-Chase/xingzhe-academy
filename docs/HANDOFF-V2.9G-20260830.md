# 行者学社 V2.9G 交接文档

更新时间：2026-08-30

本文用于新的 Codex 对话窗口接手当前工作。不要把本文视为用户授权执行线上操作；线上数据库、部署、DNS、小程序主体、支付、退款、权限相关动作仍需先说明风险、备份和回滚方式。

## 1. 协作方式

- 默认使用中文沟通。
- 先读代码和文档，再行动。
- 用户偏好稳妥、小步、可回滚的工程节奏。
- 执行前说明要做什么，执行后给出清晰结果。
- 不要擅自扩大范围，不要假装完成未验证事项。
- 涉及数据库、部署、DNS、小程序主体、支付、退款、权限时，必须先说明风险和回滚方式。
- 不输出任何密码、Token、AppSecret、私钥、数据库密码、证书内容。
- 用户喜欢明确清单：现状、改动范围、执行结果、阻塞、下一步。
- 执行线上操作前先备份；执行后必须 smoke test。
- 线上服务器不是 Git 仓库，禁止在线上 `git pull`。
- Git 操作必须精确；除非用户明确要求，不要 `commit / push / tag`。
- 禁止 `git add .`，除非用户本轮明确要求且确认 `.release/`、`dist`、`env`、数据库、uploads 等都不会进入暂存。
- `.release/` 不处理。

## 2. 项目与仓库

项目根目录：

`/Users/chen/projects/xingzhe-v3`

GitHub：

`https://github.com/Year-Chase/xingzhe-academy.git`

当前分支：

`main`

当前 HEAD：

`5420225 feat(V2.9F): add miniapp operation banner and themed activity discovery`

当前状态：

- V2.9G 已本地实现并已部署线上 Backend/Admin。
- 当前工作区仍有未提交改动。
- 未执行 `commit / push / tag`。

## 3. 重要文档

主要约束与产品文档：

- `docs/ADMIN-API-CONTRACT.md`
- `docs/ADMIN-PRD.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/CHANGELOG.md`
- `docs/DATA_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/ENVIRONMENT.md`
- `docs/FINANCE_RULES.md`
- `docs/PRODUCT.md`
- `docs/PROJECT-CONSTITUTION.md`
- `docs/ROADMAP.md`
- `docs/SYSTEM.md`
- `docs/UI-STANDARD.md`
- `docs/HANDOFF-V2.9G-20260830.md`

早期或命名变体文档可能存在，以实际 `docs/` 目录为准。

## 4. 稳定基线与版本进度

V2.8 稳定基线：

- `v2.8.5-release` tag 已创建并推送。
- V2.8.5 是 V2.8 系列稳定基线。

V2.9 已完成：

- V2.9A：小程序用户鉴权安全修复。
- V2.9B：支付基础设施完成，不接真实微信支付。
- V2.9C：活动分类与字典管理。
- V2.9D：CRM 标签系统。
- V2.9E：活动签到统计。
- V2.9F：首页 Banner、活动主题展示、全部活动分类筛选。
- V2.9G：Activity Series / Category / Activity 模型升级，本地实现完成，线上 Backend/Admin 已部署，待产品负责人人工验收。

## 5. V2.9G 产品模型

最终定义：

- Series：长期活动品牌/IP，例如 X50、暖聚。
- Category：活动内容类型，用于全部活动筛选和运营统计。
- Activity：用户实际报名和参加的一场具体活动。
- Banner：首页营销/运营入口。
- Recent Activities：系统根据已发布且尚未结束的 Activity 动态得到的近期活动集合，不是数据库实体。
- `seriesId = null`：独立活动。
- “普通活动”不是 Category。

首页结构：

Banner → 近期活动 → 行者系列 → 查看全部活动

全部活动页：

- 继续保留 Category 筛选。
- 不把 Category 当品牌使用。

## 6. 当前工作区改动摘要

当前未提交文件包含：

Admin：

- `apps/admin/src/layouts/AdminLayout.vue`
- `apps/admin/src/pages/activity/ActivityList.vue`
- `apps/admin/src/pages/dictionary/ActivityCategoryList.vue`
- `apps/admin/src/pages/operation/BannerList.vue`
- `apps/admin/src/pages/operation/ActivitySeriesList.vue`
- `apps/admin/src/router/index.ts`

WeApp：

- `apps/weapp/project.config.json`
- `apps/weapp/src/app.config.ts`
- `apps/weapp/src/pages/index/index.config.ts`
- `apps/weapp/src/pages/index/index.tsx`
- `apps/weapp/src/pages/activity/list/index.tsx`
- `apps/weapp/src/pages/activity/detail/index.tsx`
- `apps/weapp/src/pages/activity/series/detail/index.tsx`
- `apps/weapp/src/pages/activity/series/detail/index.config.ts`
- `apps/weapp/src/pages/mine/index.tsx`

Backend：

- `backend/src/activity/activity.controller.ts`
- `backend/src/activity/activity.module.ts`
- `backend/src/activity/activity.service.ts`
- `backend/src/activity/admin-activity.controller.ts`
- `backend/src/activity/admin-operation.controller.ts`
- `backend/src/activity/admin-activity-series.controller.ts`
- `backend/src/activity/entities/activity.entity.ts`
- `backend/src/activity/entities/activity-series.entity.ts`
- `backend/src/activity/entities/index.ts`
- `backend/src/app.module.ts`

Migrations：

- `backend/migrations/v2.9g-activity-series.mysql.sql`
- `backend/migrations/v2.9g-activity-series.mysql.rollback.sql`
- `backend/migrations/v2.9g-activity-series.sqlite.sql`
- `backend/migrations/v2.9g-activity-series.sqlite.rollback.sql`

Docs：

- `docs/ADMIN-API-CONTRACT.md`
- `docs/CHANGELOG.md`
- `docs/DATA_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/SYSTEM.md`
- `docs/UI-STANDARD.md`

既有未提交但非 V2.9G 主体：

- `apps/weapp/project.config.json`：新小程序 AppID 配置。
- `apps/weapp/src/pages/index/index.config.ts`：标题“行者活动”。
- `apps/weapp/src/pages/mine/index.tsx`：我的页个人资料和退出按钮样式。

不要 reset/restore/checkout 覆盖这些改动。

## 7. V2.9G 后端实现

新增实体：

- `backend/src/activity/entities/activity-series.entity.ts`

Activity 新增：

- `seriesId: number | null`
- `series: ActivitySeries | null`

新增 Admin Controller：

- `backend/src/activity/admin-activity-series.controller.ts`

公开接口：

- `GET /activity/recent`
- `GET /activity/series`
- `GET /activity/series/:id`

Admin 接口：

- `GET /admin/activity-series`
- `GET /admin/activity-series/active`
- `POST /admin/activity-series`
- `PATCH /admin/activity-series/:id`

Banner：

- `jumpType` 支持 `NONE / ACTIVITY / CATEGORY / SERIES`
- `SERIES` 的 `jumpValue` 保存 `seriesId`
- 无效或停用 Series 会被拒绝

## 8. V2.9G Admin 实现

新增入口：

运营管理 → 活动系列

能力：

- 新建 Series
- 编辑 Series
- 启用/停用 Series
- `code` 唯一
- 展示关联 Activity 数量

活动管理：

- 创建/编辑增加“活动归属”区域
- 活动系列：选填
- 活动分类：独立字段，新建活动前端要求选择
- 停用 Series 不能用于新建活动

字典管理：

- 活动分类说明已调整为内容类型/统计维度
- 明确长期品牌/IP 去“运营管理 → 活动系列”维护

## 9. V2.9G 小程序实现

首页：

- 移除首页 Category 筛选模块
- 展示 Banner
- 展示近期活动
- 展示行者系列
- 末尾展示“查看全部活动”

全部活动：

- 保留 Category 筛选
- 活动卡片 badge 优先展示 Series，独立活动回退展示 Category

Activity 详情：

- 有 Series 时展示“属于系列”入口
- 点击进入 Series 详情
- 独立活动不展示该入口

Series 详情：

- 页面路径：`apps/weapp/src/pages/activity/series/detail/index.tsx`
- 小程序页面路径：`/pages/activity/series/detail/index?id=<seriesId>`

## 10. Migration

MySQL forward：

`backend/migrations/v2.9g-activity-series.mysql.sql`

只做：

- `CREATE TABLE activity_series`
- `ALTER TABLE activity ADD COLUMN seriesId int NULL`
- 添加必要索引和外键

MySQL rollback：

`backend/migrations/v2.9g-activity-series.mysql.rollback.sql`

会移除：

- `activity.seriesId`
- `activity_series`

SQLite forward：

`backend/migrations/v2.9g-activity-series.sqlite.sql`

SQLite rollback：

`backend/migrations/v2.9g-activity-series.sqlite.rollback.sql`

注意：

- 不修改 `categoryId`
- 不迁移历史 Category
- 历史 Activity 的 `seriesId` 保持 `null`

## 11. 本地验证结果

已执行：

- `npm -w backend run build`：PASS
- `npm -w apps/admin run build`：PASS，有既有 Vite 大 chunk warning
- `npm -w apps/weapp run build:weapp`：PASS
- `npm run build:weapp`：PASS
- SQLite migration `up → down → up`：PASS
- 本地临时功能测试：PASS

本地功能测试覆盖：

- Series 创建/编辑/停用
- `code` 唯一
- Activity 关联 Series
- 独立 Activity `seriesId=null`
- Category 正常
- 停用 Series 不能用于新 Activity
- Series 详情聚合 Activity
- Banner `ACTIVITY / CATEGORY / SERIES`
- 近期活动过滤

已知本地技术债：

- SQLite + TypeORM `synchronize=true` 仍可能触发既有 `AUTOINCREMENT is only allowed on an INTEGER PRIMARY KEY` 问题，定位到既有 `activity_category.id` bigint 同步差异。
- 本轮未改 Category，也未改 payment。

## 12. 线上环境

旧线上服务器：

- IP：`82.156.129.114`
- 用户：`ubuntu`
- SSH key：`/Users/chen/.ssh/xingzhev3.pem`
- 后端目录：`/srv/xingzhe/backend`
- Admin 目录：`/var/www/xingzhe-admin`
- PM2 服务名：`xingzhe-api`
- API：`https://api.tenselog.cn`
- Admin：`https://admin.tenselog.cn`

旧服务器配置：

- 腾讯云 CVM
- Instance ID：`ins-azevat6r`
- 地域/可用区：`ap-beijing-6`
- 公网 IP：`82.156.129.114`
- 内网 IP：`10.2.0.15`
- Ubuntu 24.04.4 LTS
- 2核 4GB
- 系统盘 60GB
- MySQL 8.0.46，本机自建
- 数据库名：`xingzhe_v27`
- 数据库用户：`xingzhe_app`
- `DB_SYNCHRONIZE=false`

新服务器迁移背景：

- 新 IP：`49.232.71.128`
- 用户：`ubuntu`
- SSH key：`/Users/chen/.ssh/xingzhe-new-server.pem`
- 新服务器已验证可 SSH 登录
- 新服务器 2核 2GB / 50GB，建议启用 swap 并控制 MySQL/Node 内存
- 当前域名仍使用旧服务器，未切 DNS

DNS 当前情况：

- `api.tenselog.cn → 82.156.129.114`
- `admin.tenselog.cn → 82.156.129.114`
- NS 在 DNSPod / 腾讯云 DNSPod

## 13. 线上部署结果

数据库备份：

`/home/ubuntu/xingzhe-backups/xingzhe_v29g_pre_migration_20260830-224222.sql.gz`

- 大小：`20K`
- `gzip -t`：PASS

MySQL migration：

- 已执行成功
- 线上已存在 `activity_series`
- `activity.seriesId` 已新增，`int NULL`
- `activity.seriesId → activity_series.id` 外键，`ON DELETE SET NULL`
- 历史 Activity：27 条，`seriesId` 非空数量 0
- `categoryId` 未变化

Backend 部署：

- 后端 dist 备份：`/home/ubuntu/xingzhe-backups/backend-dist-v29g-predeploy-20260830-224411.tar.gz`
- 大小：`224K`
- 已上传本地 `backend/dist`
- `pm2 restart xingzhe-api --update-env`：PASS
- PM2：`xingzhe-api online`
- `https://api.tenselog.cn/health`：200

Admin 部署：

- Admin 备份：`/home/ubuntu/xingzhe-backups/xingzhe-admin-v29g-predeploy-20260830-224536.tar.gz`
- 大小：`476K`
- 已上传本地 `apps/admin/dist`
- `https://admin.tenselog.cn`：200

## 14. 线上 Smoke 结果

API Smoke：PASS

- `GET /activity/series`
- 创建测试 Series
- `GET /admin/activity-series`
- `GET /admin/activity-series/active`
- `GET /activity/categories`
- Activity 创建 `seriesId=null`
- Activity 编辑关联有效 `seriesId`
- 停用 Series 后，新建 Activity 被拒绝
- `GET /activity/series/:id`
- Admin 创建 `SERIES` Banner
- 无效 `seriesId` Banner 被拒绝
- `GET /activity/recent`
- `GET /activity/all?...categoryId=`

回归 Smoke：PASS

- `/health`
- Admin 登录接口
- Admin 活动列表
- CRM 接口
- Staff 工作人员接口

未执行真实支付、退款。

## 15. 线上测试数据

保留供人工验收：

Series：

- ID：`1`
- 名称：`暖聚测试`
- Code：`WARM_TEST_1788101439754`
- 状态：`ACTIVE`

Activity：

- ID：`39`
- 标题：`V2.9G Smoke 1788101439754`
- 状态：`DRAFT`
- `seriesId`：`1`

Banner：

- ID：`3`
- 标题：`V2.9G Series Smoke`
- 状态：`INACTIVE`
- `jumpType`：`SERIES`
- `jumpValue`：`1`

测试 Banner 为 `INACTIVE`，不会影响线上首页展示。测试 Activity 为 `DRAFT`，不会进入小程序公开列表。

## 16. 小程序

小程序当前 AppID：

`wx5925c567a9e55388`

小程序构建：

- 已执行 `npm run build:weapp`
- PASS
- 产物 API 已确认是 `https://api.tenselog.cn`

微信开发者工具打开路径：

`/Users/chen/projects/xingzhe-v3/apps/weapp/dist`

由用户人工上传体验版。

注意：

- `apps/weapp/src/config/api.ts` 默认线上 API 是 `https://api.tenselog.cn`
- `apps/weapp/config/index.ts` 生产构建注入 `https://api.tenselog.cn`
- 本地开发模式才使用 `http://127.0.0.1:3000`

## 17. 新小程序与域名备案背景

新小程序认证已通过。

尚未完成：

- 新域名审核
- 新域名备案
- 小程序备案

当前建议：

- 短期可使用新小程序体验版，但仍保留 `https://api.tenselog.cn`
- 不建议同时切服务器、域名、小程序主体，避免问题难定位
- 等备案和域名可操作后，再单独切换域名和小程序合法域名配置

微信后台配置位置：

小程序管理后台 → 开发管理 → 开发设置 → 服务器域名 → request 合法域名，添加 `https://api.tenselog.cn`

## 18. gikoo.cn 备案背景

用户遇到 `gikoo.cn` 备案时，网安提示关联网站打不开。

已知处理结果：

- 旧的 `139.198.122.50` 暂停后，阿里云静态网页解析成功。
- `https://www.gikoo.cn` 已能打开。
- 初步判断网安提到的“关联网址打不开”问题大概率已解决。
- 下一步可以继续走新域名备案，但最终以网安/备案审核反馈为准。

## 19. 禁止事项

接手后不要做：

- 不要 `commit / push / tag`，除非用户明确要求。
- 不要 `git add .`。
- 不要在线上 `git pull`。
- 不要输出 `.env` 内容。
- 不要输出 DB 密码、Admin 密码、JWT secret、AppSecret、私钥。
- 不要执行 `DB_SYNCHRONIZE=true`。
- 不要修改真实微信支付/退款逻辑。
- 不要把真实微信支付/退款说成已完成。
- 不要自动删除线上测试 Series/Activity/Banner，除非用户要求。
- 不要修改 payment/order/refund/CRM/checkin/certificate/auth 业务逻辑。

## 20. 下一步建议

建议下一步由产品负责人做人工验收：

1. 打开 `https://admin.tenselog.cn`
2. 查看“运营管理 → 活动系列”
3. 查看测试 Series：`暖聚测试`
4. 查看 Activity 编辑页里的“活动归属”
5. 查看 Banner 管理里的 `SERIES` 跳转能力
6. 使用微信开发者工具打开 `/Users/chen/projects/xingzhe-v3/apps/weapp/dist`
7. 上传体验版
8. 在体验版检查首页、近期活动、行者系列、Series 详情、全部活动 Category 筛选、Activity 详情 Series 入口

如果验收通过，再由用户决定是否：

- 清理测试数据
- commit 本轮 V2.9G
- push 到 GitHub
- 规划新服务器迁移或新域名切换

## 21. 推荐 Git checkpoint

如果用户确认验收通过，建议 commit message：

`feat(V2.9G): add activity series model and discovery`

提交前必须精确暂存本轮文件，不使用 `git add .`。
