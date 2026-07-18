-- V2.9B-1 payment core rollback for local SQLite.
-- WARNING: do not run after real transaction rows are created unless data export is approved.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

DROP TABLE IF EXISTS refund_transaction;
DROP TABLE IF EXISTS payment_transaction;

CREATE TABLE activity_order_v29b1_rollback (
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
  orderPrepayAmount integer,
  orderPostpayAmount integer,
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

INSERT INTO activity_order_v29b1_rollback (
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
  CAST(orderPrepayAmount AS integer),
  CAST(orderPostpayAmount AS integer),
  pricingSnapshot,
  COALESCE(postpayStatus, 'NONE'),
  postpayPaidAt,
  COALESCE(postpayReminderCount, 0),
  lastPostpayReminderAt,
  postpayWaivedAt,
  postpayWaiveReason
FROM activity_order;

DROP TABLE activity_order;
ALTER TABLE activity_order_v29b1_rollback RENAME TO activity_order;

COMMIT;
PRAGMA foreign_keys = ON;
