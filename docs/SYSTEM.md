SYSTEM

行者学社 SYSTEM
1. 当前系统形态

当前版本：V2.3 本地运营框架版。

系统组成：

WeApp 小程序
Admin PC 管理后台
NestJS Backend
SQLite 本地数据库
本地 uploads
QA Regression Agent

backend 是唯一业务中枢。

Admin 和 WeApp 均通过 backend API 访问业务数据。

2. 当前目录

项目根目录：

/Users/chen/projects/xingzhe-v3

后端：

/Users/chen/projects/xingzhe-v3/backend

小程序：

/Users/chen/projects/xingzhe-v3/apps/weapp

Admin：

/Users/chen/projects/xingzhe-v3/apps/admin

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

3. 当前核心系统

已完成基础能力：

活动系统
报名系统
订单系统
二维码系统
签到/核销系统
退款系统
财务系统
发票系统
CRM 用户运营系统
QA 回归系统

未完成完整能力：

真实用户系统
真实微信登录
真实支付系统
PaymentRecord
证书系统
足迹系统
行者地图
同行者统计
邀请增长闭环
云部署
4. 当前业务流程

活动创建
→ 活动发布
→ 小程序展示
→ 用户报名支付
→ 创建 Registration
→ 创建 Order
→ 生成 QR
→ 现场核销
→ 可退款
→ 可开票
→ 财务统计
→ CRM 用户运营查看

未来完整流程：

活动创建
→ 活动发布
→ 用户报名
→ 用户支付
→ 生成二维码
→ 现场签到
→ 自动生成证书
→ 更新足迹
→ 更新同行者统计
→ 分享证书/活动
→ 绑定活动邀请关系
→ CRM 克制运营

5. 当前事实源
Activity：活动
Registration：报名
Order：支付记录
QR：核销
Refund：退款
Invoice：发票
CRM：运营视图

关键原则：

Registration = 报名事实源
Order = 支付记录
Refund = 退款事实源
Invoice = 发票事实源
CRM 不改核心业务状态
6. 当前后端模块

核心位置：

backend/src/activity/

当前包含：

Activity
Registration
Order
QR
Refund
Invoice
CRM
UserTag
UserNote
UserProfile
UserInviteRecord
ActivityInviteRecord

当前 users 模块仍不是完整真实用户系统。V2.4 将升级。

7. 当前 Admin 模块

apps/admin 当前承担：

活动管理
订单管理
财务管理
发票管理
用户运营 CRM

Admin 不承担 C 端体验。

8. 当前小程序模块

apps/weapp 当前承担：

首页活动列表
活动详情
报名支付
二维码
核销状态
已报名/已参加展示

完整规划底部 tab：

首页
行者地图
我的

行者地图包括：

我的足迹
同行者
行者地图
9. 当前数据库

当前数据库：

SQLite / better-sqlite3

路径：

/Users/chen/projects/xingzhe-v3/backend/data/xingzhe.db

当前不是云数据库。

10. QA 系统

QA Agent：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

运行：

cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js

QA blocking = 0 才允许进入下一阶段。

11. 后续系统演进

V2.4：

真实 User + 微信登录。

V2.5：

活动产品模型增强。

V2.6：

真实支付与订单增强。

V2.7：

证书传播。

V2.8：

行者地图。

V2.9：

邀请增长。

V3.0：

云部署上线。

================================

徽章体系

================================

自动发放

管理员发放

不公开规则

