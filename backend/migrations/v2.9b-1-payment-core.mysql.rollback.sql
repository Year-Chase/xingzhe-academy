-- V2.9B-1 payment core rollback for MySQL.
-- WARNING: do not run after real payment or refund transactions have been created unless
-- the transaction data has been exported and the business rollback plan is approved.

DROP TABLE IF EXISTS refund_transaction;
DROP TABLE IF EXISTS payment_transaction;

-- Restore the previous production shape observed before V2.9B-1.
-- This truncates cents if any decimal values were written after migration.
ALTER TABLE activity_order
  MODIFY COLUMN orderPrepayAmount int NULL,
  MODIFY COLUMN orderPostpayAmount int NULL;
