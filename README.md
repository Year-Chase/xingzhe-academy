# 行者 V3 基础工程

Taro 3.6 + React 18 + NestJS 10 monorepo

## 项目结构

```
xingzhe-v3/
├── apps/
│   ├── h5/          Taro H5 前端
│   └── weapp/       Taro 微信小程序
├── backend/         NestJS 后端
├── package.json     根 monorepo 配置
├── tsconfig.json
└── setup.sh         一键安装脚本
```

## 快速开始

### 安装依赖

```bash
chmod +x setup.sh
./setup.sh
```

### 启动开发

```bash
# H5 开发（http://localhost:10086）
cd apps/h5 && npm run dev:h5

# 小程序编译
cd apps/weapp && npm run dev:weapp

# 后端启动（http://localhost:3000）
cd backend && npm run start:dev
```

### 验证接口

```bash
curl http://localhost:3000/health    # {"status":"ok","timestamp":"..."}
curl http://localhost:3000/activity  # [{"id":1,"title":"晨跑打卡"...}]
curl http://localhost:3000/users     # [{"id":1,"name":"行者"...}]
```

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| H5 前端 | Taro + React + TypeScript | 3.6.x / 18 / 5.x |
| 小程序 | Taro + React + TypeScript | 3.6.x / 18 / 5.x |
| 后端 | NestJS + TypeORM + SQLite | 10.x / 0.3.x |

## 要求

- Node.js >= 18
- npm >= 9
