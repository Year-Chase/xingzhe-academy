# scripts/ops — 行者学社运维脚本

## 脚本说明

| 脚本 | 类型 | 说明 |
|------|------|------|
| `xz-verify-online.sh` | 只读 | 线上验证脚本，验证 Admin API 鉴权（无 token / fake-token → 401） |
| `xz-backup-release.sh` | 写（服务器） | 部署前 Release 备份，备份 dist 到 `/data/xingzhe/backups/releases/` |
| `xz-preflight-local.sh` | 只读 | 本地发版前检查，确认环境、Git 状态、SSH 连接等 |

## 不在此目录的能力

这些脚本**不包含**：

- 数据库备份（mysqldump）
- uploads 备份
- 自动部署（rsync 部署仍按 DEPLOYMENT.md 手动执行）
- 自动回滚
- 真实支付相关（V2.9 范围）

## 典型发版流程

```
1. bash scripts/ops/xz-preflight-local.sh     ← 本地检查
2. bash scripts/ops/xz-backup-release.sh      ← 部署前备份
3. 按 DEPLOYMENT.md 执行 rsync 部署            ← 手动部署
4. bash scripts/ops/xz-verify-online.sh        ← 线上验证
5. pm2 save && git tag                         ← 固化
```
