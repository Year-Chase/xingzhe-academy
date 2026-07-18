-- V2.9B-1 payment core migration for MySQL.
-- This migration creates transaction ledgers only. It does not create real WeChat payments
-- and does not backfill historical mock orders into payment_transaction.
--
-- Preflight:
--   SHOW COLUMNS FROM activity_order;
--   SHOW TABLES LIKE 'payment_transaction';
--   SHOW TABLES LIKE 'refund_transaction';

ALTER TABLE activity_order
  MODIFY COLUMN orderPrepayAmount decimal(10,2) NULL,
  MODIFY COLUMN orderPostpayAmount decimal(10,2) NULL;

CREATE TABLE payment_transaction (
  id bigint NOT NULL AUTO_INCREMENT,
  orderId bigint NOT NULL,
  registrationId bigint NOT NULL,
  userId varchar(100) NOT NULL,
  activityId bigint NOT NULL,
  tradeType varchar(20) NOT NULL,
  paymentProvider varchar(30) NOT NULL DEFAULT 'WECHAT',
  merchantOrderNo varchar(64) NOT NULL,
  providerTransactionNo varchar(128) NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0.00,
  amountCents int NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'INIT',
  prepayId varchar(128) NULL,
  paidAt datetime NULL,
  notifyAt datetime NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transaction_merchant_order_no (merchantOrderNo),
  UNIQUE KEY uq_payment_transaction_provider_transaction_no (providerTransactionNo),
  KEY idx_payment_transaction_order (orderId),
  KEY idx_payment_transaction_user (userId),
  KEY idx_payment_transaction_activity (activityId),
  KEY idx_payment_transaction_status (status),
  KEY idx_payment_transaction_trade_type (tradeType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refund_transaction (
  id bigint NOT NULL AUTO_INCREMENT,
  orderId bigint NOT NULL,
  paymentTransactionId bigint NOT NULL,
  activityRefundId bigint NULL,
  refundProvider varchar(30) NOT NULL DEFAULT 'WECHAT',
  merchantRefundNo varchar(64) NOT NULL,
  providerRefundNo varchar(128) NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0.00,
  amountCents int NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'INIT',
  reason varchar(500) NULL,
  failureReason text NULL,
  requestedAt datetime NULL,
  successAt datetime NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_refund_transaction_merchant_refund_no (merchantRefundNo),
  UNIQUE KEY uq_refund_transaction_provider_refund_no (providerRefundNo),
  KEY idx_refund_transaction_order (orderId),
  KEY idx_refund_transaction_payment (paymentTransactionId),
  KEY idx_refund_transaction_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
