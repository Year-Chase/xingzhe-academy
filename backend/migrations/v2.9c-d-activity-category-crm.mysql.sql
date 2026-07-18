-- V2.9C+D activity category and CRM tag migration for MySQL.
-- Preflight:
--   SHOW TABLES LIKE 'activity_category';
--   SHOW TABLES LIKE 'tag_definition';
--   SHOW TABLES LIKE 'user_tag_relation';
--   SHOW COLUMNS FROM activity;

CREATE TABLE activity_category (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(80) NOT NULL,
  code varchar(50) NOT NULL,
  description text NULL,
  sortOrder int NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_activity_category_code (code),
  KEY idx_activity_category_status_sort (status, sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE activity
  ADD COLUMN categoryId bigint NULL;

ALTER TABLE activity
  ADD KEY idx_activity_category_id (categoryId),
  ADD CONSTRAINT fk_activity_category
    FOREIGN KEY (categoryId)
    REFERENCES activity_category (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION;

CREATE TABLE tag_definition (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(80) NOT NULL,
  type varchar(20) NOT NULL,
  description text NULL,
  ruleCode varchar(80) NULL,
  isEnabled tinyint NOT NULL DEFAULT 1,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_definition_type_name (type, name),
  UNIQUE KEY uq_tag_definition_rule_code (ruleCode),
  KEY idx_tag_definition_type_enabled (type, isEnabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_tag_relation (
  id bigint NOT NULL AUTO_INCREMENT,
  userId varchar(100) NOT NULL,
  tagId bigint NOT NULL,
  source varchar(20) NOT NULL,
  assignedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  assignedBy varchar(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_tag_relation_user_tag (userId, tagId),
  KEY idx_user_tag_relation_user (userId),
  KEY idx_user_tag_relation_tag (tagId),
  CONSTRAINT fk_user_tag_relation_tag
    FOREIGN KEY (tagId)
    REFERENCES tag_definition (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO tag_definition (name, type, description, ruleCode, isEnabled)
VALUES
  ('新用户', 'SYSTEM', '注册时间 <= 30 天', 'NEW_USER', 1),
  ('高频参与', 'SYSTEM', '过去 180 天签到活动次数 >= 3', 'FREQUENT_CHECKIN', 1),
  ('沉睡用户', 'SYSTEM', '过去 180 天没有报名活动', 'DORMANT_USER', 1),
  ('高价值用户', 'SYSTEM', '累计支付金额 >= 50000 元', 'HIGH_VALUE_USER', 1),
  ('邀请之星', 'SYSTEM', '累计邀请成功参与活动用户数 >= 5', 'INVITE_STAR', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  type = VALUES(type),
  isEnabled = VALUES(isEnabled);
