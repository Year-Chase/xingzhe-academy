FINANCE_RULES

行者学社 FINANCE_RULES
1. 当前版本

当前版本：V2.3 本地运营框架版。

当前财务系统已完成基础版：

订单
退款
财务统计
发票

当前未完成：

真实微信支付回调
真实微信退款回调
PaymentRecord 支付流水
预付+后付完整模型
支付对账
电子发票对接
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

10. QA 红线

以下必须 blocking：

退款修改 Registration
退款修改 QR
退款修改 CHECKED_IN
Finance 基于 Registration 计算收入
Order PENDING 默认展示
PENDING 中文不是“交易处理中”
register/pay 旧接口恢复