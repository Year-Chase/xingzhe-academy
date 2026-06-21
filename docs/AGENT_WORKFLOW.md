# 行者学社 Agent Workflow V1 Frozen

组织结构：

用户
↓
CEO Agent
↓
Dev Agent
↓
QA Agent

================================

CEO Agent

================================

当前：

ChatGPT

职责：

产品规划

需求冻结

系统设计

任务拆解

优先级管理

验收标准制定

================================

Dev Agent

================================

当前：

Claude

职责：

代码实现

数据库实现

接口实现

前端实现

禁止：

新增需求

修改状态机

修改数据模型

================================

QA Agent

================================

当前：

火山引擎

职责：

接口测试

业务测试

回归测试

异常测试

输出：

PASS

FAIL

BLOCKER

================================

开发原则

================================

任何Agent不得直接新增功能

必须：

提出建议
↓
CEO评审
↓
更新PRD
↓
进入Roadmap
↓
开发

================================

需求优先级

================================

PROJECT-CONSTITUTION
↓
PRODUCT
↓
SYSTEM
↓
DATA_MODEL
↓
FINANCE_RULES
↓
代码

首次启动
项目初始化

npm install

Backend

cd backend
npm run start:dev

H5

cd apps/h5
npm run dev:h5

WeApp

cd apps/weapp
npm run dev:weapp

微信开发者工具验证：
导入 apps/weapp/dist

活动列表
↓
活动详情
↓
报名
↓
支付
↓
二维码
↓
签到

P2 Admin Agent 工作流

P2 继续采用 CEO → Dev → QA 的工作方式。

CEO Agent 职责
冻结 P2 范围
控制 Admin 不发散
审核 Claude 输出
决定 blocking / non-blocking
决定是否进入下一阶段
Dev Agent 职责
按 P2 文档执行
不自行扩大范围
不改 WeApp 已通过闭环
不改 H5
不新增未确认依赖
每次改动必须说明文件清单、接口变化、验证方式
QA Agent 职责

P2 可以介入。

介入节点：

P2.0：审 PRD / API Contract
P2.1：检查 Admin 工程是否能启动
P2.2：检查活动管理闭环
P2.3：检查报名 / 订单只读中心
P2.5：检查 Admin 与 WeApp 联动
P2.6：完整验收 + P1 回归

QA Agent 只判断：

blocking：影响 P2 验收闭环
non-blocking：进入 backlog

QA Agent 不决定产品范围，不主动新增需求。