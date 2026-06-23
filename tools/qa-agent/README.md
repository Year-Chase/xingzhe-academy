# 行者学社 QA Regression Agent v1

## 定位

QA Regression Agent 是 Project Phase 2.2 的提交前自动回归护栏。它不是业务功能，而是确定性检查 + LLM 审查的组合工具。

## 后续固定协同流程

1. 用户提出产品阶段目标
2. ChatGPT 输出 Claude 可执行需求文档
3. Claude 根据需求文档开发
4. Claude 开发完成后，必须自行启动后端服务 (cd backend && npm run start:dev)
5. Claude 必须自行启动 Admin 前端服务 (npm run dev:admin)
6. Claude 必须运行 QA Regression Agent
7. 如果 QA Agent 返回 blocking > 0：
   - Claude 不允许自行修复
   - Claude 必须打印 QA 报告并停止，等待用户下一步指令
8. 用户将 QA 报告交给 ChatGPT
9. ChatGPT 判断 blocking 原因，并输出 Claude 修复补丁
10. Claude 执行修复补丁
11. Claude 重新启动后端 / Admin
12. Claude 重新运行 QA Agent
13. QA PASS 后，Claude 输出验收报告
14. 用户人工执行 git add / commit

## 环境配置

### 1. 创建本地配置文件

```bash
mkdir -p .local/qa-agent/reports
cp tools/qa-agent/qa.env.example .local/qa-agent/qa.env
```

### 2. 编辑 .local/qa-agent/qa.env

```ini
QA_PROVIDER=volcengine
QA_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
QA_MODEL=<你的模型名>
ARK_API_KEY=<你的 API Key>
QA_PROJECT_ROOT=/Users/chen/projects/xingzhe-v3
QA_BACKEND_URL=http://127.0.0.1:3000
```

### 3. 本地配置文件

`.local/qa-agent/` 目录及其所有内容**不可提交到 Git**。

## 运行

```bash
cd /Users/chen/projects/xingzhe-v3
node tools/qa-agent/qa-runner.js
```

## 报告

报告输出到 `.local/qa-agent/reports/latest.json` 和 `.local/qa-agent/reports/latest.md`。

## 职责边界

- Claude 负责启动后端 / Admin
- qa-runner.js 只负责检查当前服务是否可用
- 核心 API 不可用 = blocking
- Admin 路由缺失 = blocking
- QA Agent 不自动修复代码
- QA Agent 不自动 git add / commit

## 确定性检查项

1. register/pay HTTP 路由是否恢复
2. `active` 状态是否在 backend 中出现
3. getRegisteredCount 是否使用 orderRepo
4. refund 是否修改 registration 状态
5. PENDING 中文标签是否正确
6. getOrders 默认是否排除 PENDING
7. app.module.ts 是否注册 ActivityRefund / ActivityInvoice
8. activity.module.ts 是否注册 ActivityRefund / ActivityInvoice
9. 7 个核心 API 是否正常返回
