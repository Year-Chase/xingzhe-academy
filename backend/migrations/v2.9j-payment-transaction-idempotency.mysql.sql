-- V2.9J-Fix: enforce one payment transaction per order and payment stage.
-- Preflight:
--   SELECT orderId, tradeType, COUNT(*) FROM payment_transaction
--   GROUP BY orderId, tradeType HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX uniq_payment_transaction_order_trade_type
  ON payment_transaction (orderId, tradeType);
