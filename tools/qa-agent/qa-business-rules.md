# 行者学社 P2.3 QA Business Rules

## Blocking 级别红线（违反必须停止提交）

### Activity
1. 只允许 DRAFT / PUBLISHED / CLOSED / ENDED 四个活动状态
2. `active` 不允许作为活动状态出现在业务逻辑中（status: 'active' / status = 'active'）
3. 小程序首页 GET /activity 只展示 PUBLISHED 且在报名窗口内的活动
4. DRAFT / CLOSED 不允许进入小程序列表
5. ENDED 活动不允许报名

### Registration
1. Registration 是报名事实源 — BLOCKING
2. 报名人数 getRegisteredCount 必须基于 Registration（PAID + CHECKED_IN），不能用 Order 统计 — BLOCKING
3. 退款不能修改 Registration 状态 — BLOCKING

### Order
1. enrollPay 是唯一用户报名支付入口 — BLOCKING
2. 不允许恢复 POST /activity/:id/register HTTP 路由 — BLOCKING
3. 不允许恢复 POST /activity/:id/pay HTTP 路由 — BLOCKING
4. 主流程报名即支付，订单直接 PAID
5. PENDING 只能是系统过程态 / 遗留态
6. Admin 默认订单列表不展示 PENDING — BLOCKING
7. PENDING 中文显示为"交易处理中" — BLOCKING（不允许"待支付"/"未支付"等）
8. 订单状态 enum 不允许改成中文
9. 订单金额必须来自 activity.price，前端不可传

### Refund
1. Refund 是退款事实源
2. 每次退款必须生成 Refund 记录
3. 累计退款 >= order.amount → REFUNDED
4. 累计退款 < order.amount → PARTIAL_REFUND
5. 退款不允许修改 Registration — BLOCKING
6. 退款不允许删除 QR
7. 退款不允许修改 CHECKED_IN

### Entity Registration
1. ActivityRefund 必须注册在 app.module.ts entities 数组中 — BLOCKING
2. ActivityInvoice 必须注册在 app.module.ts entities 数组中 — BLOCKING
3. ActivityRefund 必须注册在 activity.module.ts forFeature 中 — BLOCKING
4. ActivityInvoice 必须注册在 activity.module.ts forFeature 中 — BLOCKING
5. UserTag 必须注册在 app.module.ts entities 数组中 — BLOCKING
6. UserNote 必须注册在 app.module.ts entities 数组中 — BLOCKING
7. UserTag 必须注册在 activity.module.ts forFeature 中 — BLOCKING
8. UserNote 必须注册在 activity.module.ts forFeature 中 — BLOCKING
9. UserProfile 必须注册在 app.module.ts entities 数组中 — BLOCKING
10. UserInviteRecord 必须注册在 app.module.ts entities 数组中 — BLOCKING
11. ActivityInviteRecord 必须注册在 app.module.ts entities 数组中 — BLOCKING
12. UserProfile 必须注册在 activity.module.ts forFeature 中 — BLOCKING
13. UserInviteRecord 必须注册在 activity.module.ts forFeature 中 — BLOCKING
14. ActivityInviteRecord 必须注册在 activity.module.ts forFeature 中 — BLOCKING

### CRM
1. CRM 只能读取和汇总用户运营数据 — BLOCKING
2. CRM 不允许修改 Registration / Order / Refund / Invoice 状态 — BLOCKING
3. UserTag 只影响运营标签，不影响报名、支付、退款、发票 — BLOCKING
4. UserNote 只影响运营备注，不影响报名、支付、退款、发票 — BLOCKING
5. CRM 页面不允许因为 nickname 缺失崩溃 — BLOCKING
6. CRM 统计中报名次数基于 Registration — BLOCKING
7. CRM 统计中支付金额基于 Order — BLOCKING
8. CRM 统计中退款金额基于 Refund — BLOCKING
9. CRM 不能恢复 register/pay 旧入口 — BLOCKING
10. CRM 用户列表必须展示注册时间、最近登录时间、出生年月、邀请注册人数、邀请活动人数 — BLOCKING
11. CRM 用户详情必须展示用户年龄 — BLOCKING
12. CRM 报名记录必须包含城市、证书、邀请人 — BLOCKING
13. 证书展示不允许影响证书生成逻辑 — BLOCKING
14. 邀请人链接必须打开 CRM 用户详情 — BLOCKING
15. CRM 邀请记录不允许修改邀请关系 — BLOCKING
16. CRM 筛选条件不允许导致 500 — BLOCKING
17. CRM 仍然不允许修改核心业务状态 — BLOCKING

## Warning 级别（建议修复，不阻塞提交）

### Finance
1. 财务统计只允许基于 Order + Refund
2. 不允许基于 Registration 做收入统计

### Invoice
1. Invoice 不影响 Order / Registration
2. 发票金额 = order.amount - order.refundedAmount
3. REQUESTED → ISSUED，不可逆

### Admin
1. /activity, /orders, /finance, /invoices, /crm/users 路由必须存在
2. 退款按钮逻辑必须基于英文 enum，不基于中文文案

### Git Hygiene
1. backend/uploads 不应包含大量未跟踪文件
2. .local/ 目录不可提交
3. backend/data 不可提交
