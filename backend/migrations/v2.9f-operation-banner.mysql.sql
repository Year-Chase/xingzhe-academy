-- V2.9F operation banner migration for MySQL.
-- Preflight:
--   SHOW TABLES LIKE 'operation_banner';

CREATE TABLE operation_banner (
  id int NOT NULL AUTO_INCREMENT,
  imageUrl varchar(500) NOT NULL,
  title varchar(100) NOT NULL,
  description varchar(240) NULL,
  sortOrder int NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  startAt datetime NULL,
  endAt datetime NULL,
  jumpType varchar(20) NOT NULL DEFAULT 'NONE',
  jumpValue varchar(120) NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_operation_banner_active_window (status, sortOrder, startAt, endAt),
  KEY idx_operation_banner_jump (jumpType, jumpValue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
