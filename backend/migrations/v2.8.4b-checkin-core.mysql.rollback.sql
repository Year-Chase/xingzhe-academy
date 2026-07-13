-- V2.8.4B checkin core rollback notes for MySQL.
-- WARNING:
-- If any registration already has more than one QR row, do not restore a UNIQUE index on registrationId
-- until the extra QR versions are archived or deleted. Otherwise rollback will fail or discard data.

-- Pre-rollback safety check:
-- SELECT registrationId, COUNT(*) AS qr_count
-- FROM activity_qr
-- GROUP BY registrationId
-- HAVING COUNT(*) > 1;

DROP INDEX idx_activity_qr_registration_status ON activity_qr;
DROP INDEX idx_activity_qr_registration_id ON activity_qr;
DROP INDEX uniq_activity_qr_registration_version ON activity_qr;

ALTER TABLE activity_qr
  DROP COLUMN revokedAt,
  DROP COLUMN supersededAt,
  DROP COLUMN version,
  DROP COLUMN stage;

-- Restore only if the safety check above returns zero rows.
-- Use the original project-compatible index name if needed by TypeORM.
ALTER TABLE activity_qr
  ADD UNIQUE INDEX UQ_0e309516c31e30427b2d9e33e2b (registrationId);

ALTER TABLE activity_registration
  DROP COLUMN checkinSource,
  DROP COLUMN checkedInByUserId,
  DROP COLUMN checkedInAt;
