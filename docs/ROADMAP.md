ROADMAP

行者学社 ROADMAP
1. 当前版本

当前版本：V2.3 本地运营框架版。

当前状态：

P1 小程序活动报名支付闭环完成
V2.1 订单系统完成
V2.2 退款 / 财务 / 发票完成
V2.2.5 QA Regression Agent v1 完成
V2.3 CRM 用户运营框架完成
V2.3 CRM 增强字段框架完成
本地 QA Agent blocking = 0

当前不是：

生产上线版
真实微信支付完整版
真实 User 系统版
真实证书传播版
行者地图版
邀请增长版
云数据库版
2. 已完成
P0 工程底座
Monorepo
Backend
WeApp
H5
SQLite
TypeORM
基础实体
P1 小程序活动闭环
活动列表
活动详情
报名支付合并
二维码
核销
已签到
已参加盖章
全部活动
已结束置灰
同行者展示基础能力
V2.1 订单系统
ActivityOrder
订单列表
PENDING 默认隐藏
PENDING 中文“交易处理中”
enrollPay 主入口
register/pay 旧接口废弃
V2.2 退款 / 财务 / 发票
ActivityRefund
ActivityInvoice
部分退款
全额退款
财务概览
活动财务明细
发票申请
发票开具
V2.2.5 QA Agent
QA runner
静态检查
API 检查
LLM 审查
latest.md / latest.json
blocking 机制
V2.3 CRM 用户运营
CRM 用户列表
CRM 用户详情
标签
备注
用户统计
邀请结构预留
证书展示预留
UserProfile 过渡表
3. 当前文档同步阶段
P2.3.5 Documentation Sync

目标：

更新 docs 到 V2.3 当前事实
避免 V2.4 读取旧文档误判
不改代码
不改数据库
4. 下一版本：V2.4 真实用户与微信登录版

目标：

从 userId 聚合升级为真实微信用户系统。

建议拆分：

V2.4A 后端真实 User + 登录 API
User Entity
UsersModule
POST /users/wechat-login
GET /users//profile
PATCH /users//profile
mock 微信登录
registeredAt
lastLoginAt
QA user smoke test
V2.4B 小程序登录 + 我的页面
小程序登录
userId 缓存
我的页面
头像、昵称、性别、手机号、出生年月、身份维护
报名前补齐 userId
V2.4C Admin CRM 接真实 User
CRM 列表读取真实 User
CRM 详情读取真实 User
兼容旧 mock userId
保留 V2.3 标签、备注、统计能力
5. V2.5 活动产品模型增强版

目标：

让 Admin 可完整创建、运营、结束、复盘活动。

内容：

活动模板
slogan
会员价
终身会员价
全款 / 预付+后付配置
报名开始/结束
活动自动结束
下架/关闭
活动回忆照片
活动回忆录
实际参加人数
退款人数
活动实际收入
6. V2.6 真实支付与订单增强版

目标：

生产可用支付订单系统。

内容：

微信支付下单
支付回调
全款支付
预付支付
后付支付
后付提醒
PaymentRecord
微信退款回调
对账
发票抬头从小程序提交
7. V2.7 扫码核销与证书传播版

目标：

完成现场体验和证书分享传播。

内容：

二维码重置
小程序二维码同步
现场扫码核销
核销后自动生成证书
证书模板
证书图片生成
证书列表
证书详情
分享微信好友
分享朋友圈
8. V2.8 行者地图版

目标：

完成小程序底部“行者地图”。

内容：

我的足迹
证书滑动展示
同行者排行
共同参加活动次数
点亮省份
去过城市
证书数量
活动次数
9. V2.9 邀请增长版

目标：

让分享带来可统计新用户和新报名。

内容：

活动分享链接
证书分享链接
活动级邀请关系
注册邀请关系
邀请注册人数
邀请活动人数
报名记录展示邀请人
活动邀请转化统计
10. V3.0 云部署上线版

目标：

从本地系统变成线上可运营系统。

内容：

腾讯云数据库
数据库迁移
COS 图片/证书存储
HTTPS
后端部署
Admin 部署
小程序正式环境
日志
监控
备份
权限
安全审计
小程序提审
11. 执行原则
每阶段先文档后开发
每阶段 QA blocking = 0 才进入下一阶段
Claude 不自动 git
不使用 git add .
不提交数据、上传文件、env、私有配置