-- V2.8.4B checkin core migration for MySQL.
-- Run only after:
--   SHOW CREATE TABLE activity_qr;
--   SHOW INDEX FROM activity_qr;
--   SHOW COLUMNS FROM activity_registration;
-- Confirm the real UNIQUE index name(s) on activity_qr.registrationId before running this file.

ALTER TABLE activity_registration
  ADD COLUMN checkedInAt datetime NULL,
  ADD COLUMN checkedInByUserId varchar(50) NULL,
  ADD COLUMN checkinSource varchar(30) NULL;

ALTER TABLE activity_qr
  ADD COLUMN stage varchar(20) NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN version int NOT NULL DEFAULT 1,
  ADD COLUMN supersededAt datetime NULL,
  ADD COLUMN revokedAt datetime NULL;

UPDATE activity_qr
SET stage = 'LEGACY'
WHERE stage IS NULL OR stage = '';

UPDATE activity_qr
SET version = 1
WHERE version IS NULL OR version < 1;

-- MySQL foreign keys require an index on registrationId. Create the replacement non-unique
-- index before dropping old UNIQUE indexes that may currently back the foreign key.
CREATE INDEX idx_activity_qr_registration_id
  ON activity_qr (registrationId);

-- Dynamically drop UNIQUE indexes whose only column is registrationId.
-- Keep the code UNIQUE index intact.
DELIMITER $$
CREATE PROCEDURE drop_activity_qr_registration_unique_indexes()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE idx_name VARCHAR(128);
  DECLARE cur CURSOR FOR
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'activity_qr'
      AND NON_UNIQUE = 0
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1
       AND GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) = 'registrationId';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO idx_name;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @sql = CONCAT('ALTER TABLE activity_qr DROP INDEX `', REPLACE(idx_name, '`', '``'), '`');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL drop_activity_qr_registration_unique_indexes();
DROP PROCEDURE drop_activity_qr_registration_unique_indexes;

CREATE UNIQUE INDEX uniq_activity_qr_registration_version
  ON activity_qr (registrationId, version);

CREATE INDEX idx_activity_qr_registration_status
  ON activity_qr (registrationId, status);
