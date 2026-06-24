CHANGELOG

行者学社 CHANGELOG
当前版本

当前版本：V2.3 本地运营框架版。

当前状态：

本地 SQLite 可运行
Admin + WeApp + Backend 可联动
QA Agent blocking = 0
尚未云部署
尚未真实微信支付完整版
尚未真实 User 表
尚未证书传播闭环
尚未行者地图
V1 / P0：工程底座

已完成：

xingzhe-v3 monorepo
NestJS backend
Taro WeApp
Taro H5
TypeORM + better-sqlite3
SQLite 本地数据库
Activity / Registration / Order / QR 初始实体
/health 健康检查

历史限制：

前端 demo 化
无完整活动列表
无真实闭环
P1：小程序活动报名支付闭环

已完成：

小程序首页活动列表
活动详情页
报名支付合并
支付成功生成二维码
二维码页面
线下核销 / 签到
已签到状态
全部活动列表
已结束活动置灰
已参加盖章
已报名同行者展示

关键提交：

aedb819 feat: complete weapp activity enrollment flow p1
tag: p1-weapp-enrollment-flow
P2：Admin 管理后台启动

完成方向：

不使用 apps/h5 作为后台
新建 apps/admin
Admin 独立工程
活动管理基础能力
Admin 与 WeApp 联动验证
V2.1：订单系统

已完成：

ActivityOrder 增强
订单列表
paidAt / refundedAt
payType
Order 状态管理
enrollPay 作为主报名支付入口
getRegisteredCount 基于 Registration
Admin 默认不展示 PENDING
PENDING 中文为“交易处理中”

关键规则：

Registration 是报名事实源
Order 是支付记录
不允许 Order 取代 Registration

废弃：

POST /activity//register
POST /activity//pay
V2.2：退款 / 财务 / 发票

已完成：

ActivityRefund
ActivityInvoice
Order.refundedAmount
Order.refundCount
部分退款
全额退款
财务概览
活动财务明细
发票申请
发票列表
发票开具

修复记录：

ActivityRefund / ActivityInvoice 未注册 app.module.ts 导致 500，已修复。
Refund 不再修改 Registration。
Finance 基于 Order + Refund。

限制：

未接真实微信退款回调
未接真实支付对账
未接电子发票平台
V2.2.5：QA Regression Agent v1

已完成：

tools/qa-agent/qa-runner.js
qa-business-rules.md
qa-scope.json
qa-api-checks.json
qa.env.example
README.md
.local/qa-agent 私有配置
latest.md / latest.json 报告

修复记录：

qa-runner 顶层 await 语法错误已修复
orders-exclude-pending 误报已修复
支持豆包 / 火山方舟 LLM 审查
QA blocking = 0 后允许进入下一阶段
V2.3：CRM 用户运营系统

已完成：

后端：

UserTag
UserNote
UserProfile
UserInviteRecord
ActivityInviteRecord
AdminCrmController
CRM 用户列表
CRM 用户详情
标签管理
备注管理

Admin：

/crm/users
/crm/users/
用户运营菜单
用户列表
用户详情
标签/备注
报名、订单、退款、发票聚合展示

字段：

出生年月
注册时间
最近登录时间
邀请注册人数
邀请活动人数
报名记录城市
证书展示预留
邀请人展示预留
邀请记录预留

修复记录：

/admin/crm/users 500：TypeORM select + eager relation 冲突，已移除 select。
CRM API 本地 QA PASS。

限制：

当前没有真实 User 表
UserProfile 初始为空
InviteRecord 初始为空
没有真实证书 Entity
没有真实登录时间写入
没有真实邀请关系写入
没有真实 User nickname/avatar/gender/phone
P2.3.5：Documentation Sync

目标：

同步 docs 到 V2.3 当前事实
避免 V2.4 开发读取旧文档被误导
下一阶段 V2.4

名称：

真实用户与微信登录版。

建议拆分：

V2.4A：后端真实 User + 微信登录 API + QA smoke
V2.4B：小程序登录 + 我的页面
V2.4C：Admin CRM 接真实 User
后续版本
V2.5：活动产品模型增强
V2.6：真实支付与订单增强
V2.7：扫码核销与证书传播
V2.8：行者地图
V2.9：邀请增长
V3.0：云部署上线