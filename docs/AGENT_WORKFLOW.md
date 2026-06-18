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