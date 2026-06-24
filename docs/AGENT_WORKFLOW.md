AGENT_WORKFLOW

行者学社 Agent Workflow
1. 当前组织结构

用户
↓
ChatGPT / CEO Agent
↓
Claude / Dev Agent
↓
QA Regression Agent
↓
用户人工验收与提交

2. Agent 分工
2.1 用户
提出产品目标
决定是否进入下一阶段
执行最终 git add / commit
处理本地端口、账号、环境等需要人工判断的问题
2.2 ChatGPT / CEO Agent

职责：

产品规划
需求冻结
系统设计
任务拆解
优先级管理
验收标准制定
QA 报告判断
修复补丁制定
决定 blocking 是否真实有效
2.3 Claude / Dev Agent

职责：

按 ChatGPT 文档开发
修改代码
启动服务
运行 QA Agent
输出完成报告

禁止：

自行扩大范围
自行新增需求
自行改状态机
自动 git add
自动 git commit
自动 git push
读取或打印 API key
盲目 kill 进程
2.4 QA Regression Agent

当前位置：

/Users/chen/projects/xingzhe-v3/tools/qa-agent

当前运行命令：

cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js

职责：

静态业务规则检查
API 回归检查
Entity 注册检查
豆包 / 火山方舟 LLM 审查
输出 latest.md / latest.json

报告路径：

/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.md
/Users/chen/projects/xingzhe-v3/.local/qa-agent/reports/latest.json

3. 固定开发流程
用户提出阶段目标
ChatGPT 输出 Claude 可执行需求文档
Claude 开发
Claude 检查后端服务
Claude 检查 Admin 服务
Claude 运行 QA Agent
QA blocking > 0：Claude 打印报告并停止
用户把 QA 报告交给 ChatGPT
ChatGPT 判断是真问题还是误报
ChatGPT 输出修复文档
Claude 修复后重跑 QA
QA blocking = 0 后，用户人工决定 git 提交
4. 文档优先级

真相源优先级：

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
ROADMAP
↓
ADMIN-PRD / ADMIN-API-CONTRACT
↓
代码

重大需求变更应先更新文档，再开发。

5. 服务检查规则
5.1 后端

先检查：

curl -s -o /tmp/xingzhe_backend_check.txt -w "%{http_code}" "http://127.0.0.1:3000/activity"

如果返回 200：

复用已有后端
不重复启动

如果不可用：

lsof -i :3000

如果端口被占用但接口不可用：

停止
打印占用信息
等待用户处理
不 kill

如果端口未占用，才可启动：

cd /Users/chen/projects/xingzhe-v3/backend
npm run start

5.2 Admin

先检查 Admin 端口，通常是 5173。

如果已运行，复用。

如果不可用，可启动：

cd /Users/chen/projects/xingzhe-v3
npm run dev

禁止 kill 未知进程。

6. Git 规则

Claude 禁止执行：

git add
git commit
git push

用户提交前必须：

cd /Users/chen/projects/xingzhe-v3
git status --short

禁止提交：

backend/data/
backend/uploads/
.local/
apps/weapp/project.private.config.json
.env
*.env
API key
AppSecret
数据库密码
Token

禁止使用：

git add .

7. QA 判定规则
blocking = 0：允许进入下一步
blocking > 0：停止开发
warning 可由 ChatGPT 判断是否阻断
LLM parse / llm-error 可先作为 warning，不默认阻断
API 500 必须 blocking
核心业务状态机被破坏必须 blocking
register/pay 旧接口恢复必须 blocking
CRM 修改核心实体状态必须 blocking
8. 当前状态

当前版本：V2.3 本地运营框架版。

已完成：

活动报名支付基础闭环
订单系统
退款 / 财务 / 发票
CRM 用户运营框架
QA Agent v1

下一阶段：

P2.3.5 Documentation Sync
V2.4 真实用户与微信登录