-- V2.9G activity series migration for MySQL.
-- Preflight:
--   SHOW TABLES LIKE 'activity_series';
--   SHOW COLUMNS FROM activity LIKE 'seriesId';

CREATE TABLE activity_series (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(80) NOT NULL,
  code varchar(50) NOT NULL,
  coverImage varchar(500) NULL,
  shortDescription varchar(120) NULL,
  description text NULL,
  sortOrder int NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_activity_series_code (code),
  KEY idx_activity_series_status_sort (status, sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE activity
  ADD COLUMN seriesId int NULL;

ALTER TABLE activity
  ADD KEY idx_activity_series_id (seriesId),
  ADD CONSTRAINT fk_activity_series
    FOREIGN KEY (seriesId)
    REFERENCES activity_series (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
