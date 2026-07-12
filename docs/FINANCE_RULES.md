FINANCE_RULES

行者学社 FINANCE_RULES
1. 当前版本

当前版本：V2.7.2 Online Test Release。

当前财务系统状态：

订单 ✅
退款 ✅
财务统计 ✅
发票（基础版，仅登记不行开）✅

当前已明确不做（V2.7.3 及当前阶段）：
- 真实微信支付
- 真实微信退款回调
- PaymentRecord 支付流水
- 预付+后付完整模型
- 支付对账
- 电子发票对接
- 会员差异化价格
- 复杂财务结算

**历史版本说明**：旧版本标注为 V2.3 本地运营框架版，该阶段已完成但文档描述滞后。
2. 核心事实源
Order：支付记录
Refund：退款事实源
Invoice：发票事实源
Registration：报名事实源，不是财务事实源
3. 订单规则

当前 Order 状态：

PENDING：交易处理中，默认不在 Admin 订单列表展示
PAID：已支付
FAILED：支付失败，预留
PARTIAL_REFUND：部分退款
REFUNDED：已全额退款

规则：

enrollPay 主流程直接生成 PAID 订单。
PENDING 只作为内部过程态或遗留态。
Admin 默认订单列表不展示 PENDING。
PENDING 中文显示“交易处理中”。
4. 退款规则

当前支持：

部分退款
全额退款

规则：

每次退款必须创建 ActivityRefund。
部分退款后 Order.status = PARTIAL_REFUND。
全额退款后 Order.status = REFUNDED。
Order.refundedAmount 累加退款金额。
Order.refundCount 累加退款次数。
退款金额不能超过可退金额。
退款不修改 Registration。
退款不修改 QR。
退款不修改 CHECKED_IN。

当前不做：

微信退款回调
退款审核流
退款原因强制化
退款操作日志完整审计
5. 财务统计规则

财务统计基于：

Order.amount
Order.status
Refund.amount
Invoice.amount

核心指标：

总支付金额
总退款金额
净收入 = 总支付金额 - 总退款金额
订单数
退款数
发票申请数
已开票数

禁止：

用 Registration 计算收入
用报名人数替代订单数
退款后修改报名状态来影响财务
6. 发票规则

当前发票状态：

REQUESTED
ISSUED

规则：

发票申请不修改 Order。
开票不修改 Order。
发票不修改 Registration。
可开票金额应参考已支付金额 - 已退款金额。
当前只登记，不对接电子发票。

后续待补：

发票抬头从小程序提交
税号
邮箱
发票号码
开票时间
发票导出
电子发票平台对接
7. 预付与后付规则

当前未完整实现。

未来建议引入 PaymentRecord：

FULL：全款
PREPAY：预付
REMAINING：后付

预付+后付不建议只靠 Order 单表承载。

PaymentRecord 应记录每笔支付流水，包括：

orderId
registrationId
userId
activityId
payStage
amount
status
wechatTransactionId
paidAt
8. 证书与退款关系

当前真实证书系统未完成。

未来规则建议：

核销后自动生成证书。
已生成证书后发生退款，需要由产品确认是否撤销。
不建议自动删除证书，应保留审计。
证书撤销应有操作记录。
9. 审计原则

未来需要记录：

退款
价格修改
订单修改
发票开具
证书补发/撤销
会员身份修改

记录字段：

操作人
操作时间
修改前
修改后
原因

当前 V2.3 未完成完整审计。

10. 0 元订单规则（V2.7.2 新增）

当前系统支持 0 元活动（activity.price = 0）：

- 0 元活动仍走 enroll-pay 完整闭环
- 0 元订单生成真实 Order 记录（amount=0, status=PAID）
- 0 元订单应在 Admin 订单列表展示（¥0.00）
- 0 元订单应在 CRM 用户详情订单记录中展示
- 0 元订单不展示可点击退款按钮（前端过滤 + 后端 amount > 0 校验）
- 0 元订单不得调用真实退款接口
- 0 元订单的报名/二维码/核销流程与其他订单完全一致
- 0 元订单计入财务统计（总支付金额 = 0，不影响净收入计算）

11. QA 红线

以下必须 blocking：

退款修改 Registration
退款修改 QR
退款修改 CHECKED_IN
Finance 基于 Registration 计算收入
Order PENDING 默认展示
PENDING 中文不是”交易处理中”
register/pay 旧接口恢复
0 元订单触发真实退款调用
恢复 mock_token
绕过 ActivityFlowService 直接改状态
补充：

当前财务状态

明确：

当前：

订单金额管理
退款登记
发票申请

不是：

真实支付流水
真实微信退款
财务对账
发票规则

固定：

已开票退款

用户：

保留退款入口
点击提示：
已开票，请联系管理员处理

Admin：

退款按钮弹窗提示
线下处理
部分退款

公式：

可开发票金额 =
实际支付金额 - 已退款金额

禁止：

超额开票
全额退款

状态：

REFUNDED

隐藏：

标记已开票
后付款

规则：

未支付后付款
不进入退款金额