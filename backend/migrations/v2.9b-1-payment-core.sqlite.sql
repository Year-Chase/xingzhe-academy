-- V2.9B-1 payment core migration for local SQLite.
-- Run against a backup or disposable copy first.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE activity_order_v29b1 (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  userId varchar(100),
  activityId integer,
  registrationId integer NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  refundedAmount decimal(10,2) NOT NULL DEFAULT 0,
  refundCount integer NOT NULL DEFAULT 0,
  status varchar(30) NOT NULL DEFAULT ('PENDING'),
  payType varchar(20) NOT NULL DEFAULT ('FULL'),
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  paidAt datetime,
  refundedAt datetime,
  userTypeAtOrder varchar(50),
  priceSource varchar(50),
  fullAmount decimal(10,2),
  orderPrepayAmount decimal(10,2),
  orderPostpayAmount decimal(10,2),
  pricingSnapshot text,
  postpayStatus varchar(30) NOT NULL DEFAULT ('NONE'),
  postpayPaidAt datetime,
  postpayReminderCount integer NOT NULL DEFAULT 0,
  lastPostpayReminderAt datetime,
  postpayWaivedAt datetime,
  postpayWaiveReason text,
  CONSTRAINT UQ_activity_order_registration UNIQUE (registrationId),
  CONSTRAINT FK_activity_order_registration FOREIGN KEY (registrationId)
    REFERENCES activity_registration (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

INSERT INTO activity_order_v29b1 (
  id,
  userId,
  activityId,
  registrationId,
  amount,
  refundedAmount,
  refundCount,
  status,
  payType,
  createdAt,
  paidAt,
  refundedAt,
  userTypeAtOrder,
  priceSource,
  fullAmount,
  orderPrepayAmount,
  orderPostpayAmount,
  pricingSnapshot,
  postpayStatus,
  postpayPaidAt,
  postpayReminderCount,
  lastPostpayReminderAt,
  postpayWaivedAt,
  postpayWaiveReason
)
SELECT
  id,
  userId,
  activityId,
  registrationId,
  amount,
  refundedAmount,
  refundCount,
  status,
  payType,
  createdAt,
  paidAt,
  refundedAt,
  userTypeAtOrder,
  priceSource,
  fullAmount,
  orderPrepayAmount,
  orderPostpayAmount,
  pricingSnapshot,
  COALESCE(postpayStatus, 'NONE'),
  postpayPaidAt,
  COALESCE(postpayReminderCount, 0),
  lastPostpayReminderAt,
  postpayWaivedAt,
  postpayWaiveReason
FROM activity_order;

DROP TABLE activity_order;
ALTER TABLE activity_order_v29b1 RENAME TO activity_order;

CREATE TABLE payment_transaction (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  orderId integer NOT NULL,
  registrationId integer NOT NULL,
  userId varchar(100) NOT NULL,
  activityId integer NOT NULL,
  tradeType varchar(20) NOT NULL,
  paymentProvider varchar(30) NOT NULL DEFAULT ('WECHAT'),
  merchantOrderNo varchar(64) NOT NULL,
  providerTransactionNo varchar(128),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  amountCents integer NOT NULL,
  status varchar(30) NOT NULL DEFAULT ('INIT'),
  prepayId varchar(128),
  paidAt datetime,
  notifyAt datetime,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT uq_payment_transaction_merchant_order_no UNIQUE (merchantOrderNo),
  CONSTRAINT uq_payment_transaction_provider_transaction_no UNIQUE (providerTransactionNo)
);

CREATE INDEX idx_payment_transaction_order ON payment_transaction (orderId);
CREATE INDEX idx_payment_transaction_user ON payment_transaction (userId);
CREATE INDEX idx_payment_transaction_activity ON payment_transaction (activityId);
CREATE INDEX idx_payment_transaction_status ON payment_transaction (status);
CREATE INDEX idx_payment_transaction_trade_type ON payment_transaction (tradeType);

CREATE TABLE refund_transaction (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  orderId integer NOT NULL,
  paymentTransactionId integer NOT NULL,
  activityRefundId integer,
  refundProvider varchar(30) NOT NULL DEFAULT ('WECHAT'),
  merchantRefundNo varchar(64) NOT NULL,
  providerRefundNo varchar(128),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  amountCents integer NOT NULL,
  status varchar(30) NOT NULL DEFAULT ('INIT'),
  reason varchar(500),
  failureReason text,
  requestedAt datetime,
  successAt datetime,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT uq_refund_transaction_merchant_refund_no UNIQUE (merchantRefundNo),
  CONSTRAINT uq_refund_transaction_provider_refund_no UNIQUE (providerRefundNo)
);

CREATE INDEX idx_refund_transaction_order ON refund_transaction (orderId);
CREATE INDEX idx_refund_transaction_payment ON refund_transaction (paymentTransactionId);
CREATE INDEX idx_refund_transaction_status ON refund_transaction (status);

COMMIT;
PRAGMA foreign_keys = ON;
