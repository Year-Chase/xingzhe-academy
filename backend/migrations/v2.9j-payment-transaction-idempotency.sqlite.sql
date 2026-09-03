-- V2.9J-Fix: enforce one payment transaction per order and payment stage.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_transaction_order_trade_type
  ON payment_transaction (orderId, tradeType);
