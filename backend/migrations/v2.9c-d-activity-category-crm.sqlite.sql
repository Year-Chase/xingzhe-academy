-- V2.9C+D activity category and CRM tag migration for local SQLite.
-- Run against a backup or disposable copy first.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE activity_category (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name varchar(80) NOT NULL,
  code varchar(50) NOT NULL,
  description text,
  sortOrder integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT ('ACTIVE'),
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT uq_activity_category_code UNIQUE (code)
);

CREATE INDEX idx_activity_category_status_sort ON activity_category (status, sortOrder);

CREATE TABLE activity_v29cd (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  title varchar(200) NOT NULL,
  categoryId integer,
  slogan varchar(100),
  province varchar(50),
  description text,
  location varchar(300),
  city varchar(100),
  startTime datetime,
  endTime datetime,
  registrationStartTime datetime,
  registrationEndTime datetime,
  capacity integer NOT NULL DEFAULT 0,
  coverImage varchar(500),
  price integer NOT NULL DEFAULT 0,
  memberPrice integer NOT NULL DEFAULT 0,
  lifetimeMemberPrice integer NOT NULL DEFAULT 0,
  paymentMode varchar(20) NOT NULL DEFAULT ('FULL'),
  prepayAmount integer NOT NULL DEFAULT 0,
  remainingAmount integer NOT NULL DEFAULT 0,
  remainingPayDate datetime,
  status varchar(50) NOT NULL DEFAULT ('DRAFT'),
  requiredUserInfoFields text,
  groupQrType varchar(30) NOT NULL DEFAULT ('NONE'),
  groupQrImageUrl varchar(500),
  groupQrTitle varchar(100) NOT NULL DEFAULT ('加入活动群'),
  groupQrDescription varchar(200) NOT NULL DEFAULT ('活动通知、集合安排和现场事项将在群内同步'),
  memoryImages text,
  memoryText text,
  certificateTemplateId integer,
  imageUrls text,
  contentBlocks text,
  pricingRules text,
  postpayDate varchar(50),
  provinceName varchar(50),
  provinceCode varchar(20),
  cityName varchar(50),
  cityCode varchar(20),
  adcode varchar(20),
  lng float,
  lat float,
  locationName varchar(200),
  locationAddress varchar(500),
  locationLat float,
  locationLng float,
  coordinateType varchar(20) NOT NULL DEFAULT ('gcj02'),
  locationProvider varchar(20) NOT NULL DEFAULT ('manual'),
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT fk_activity_category FOREIGN KEY (categoryId)
    REFERENCES activity_category (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION
);

INSERT INTO activity_v29cd (
  id, title, slogan, province, description, location, city, startTime, endTime,
  registrationStartTime, registrationEndTime, capacity, coverImage, price,
  memberPrice, lifetimeMemberPrice, paymentMode, prepayAmount, remainingAmount,
  remainingPayDate, status, requiredUserInfoFields, groupQrType, groupQrImageUrl,
  groupQrTitle, groupQrDescription, memoryImages, memoryText, certificateTemplateId,
  imageUrls, contentBlocks, pricingRules, postpayDate, provinceName, provinceCode,
  cityName, cityCode, adcode, lng, lat, locationName, locationAddress, locationLat,
  locationLng, coordinateType, locationProvider, createdAt
)
SELECT
  id, title, slogan, province, description, location, city, startTime, endTime,
  registrationStartTime, registrationEndTime, capacity, coverImage, price,
  memberPrice, lifetimeMemberPrice, paymentMode, prepayAmount, remainingAmount,
  remainingPayDate, status, requiredUserInfoFields, groupQrType, groupQrImageUrl,
  groupQrTitle, groupQrDescription, memoryImages, memoryText, certificateTemplateId,
  imageUrls, contentBlocks, pricingRules, postpayDate, provinceName, provinceCode,
  cityName, cityCode, adcode, lng, lat, locationName, locationAddress, locationLat,
  locationLng, coordinateType, locationProvider, createdAt
FROM activity;

DROP TABLE activity;
ALTER TABLE activity_v29cd RENAME TO activity;
CREATE INDEX idx_activity_category_id ON activity (categoryId);

CREATE TABLE tag_definition (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name varchar(80) NOT NULL,
  type varchar(20) NOT NULL,
  description text,
  ruleCode varchar(80),
  isEnabled boolean NOT NULL DEFAULT 1,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now')),
  CONSTRAINT uq_tag_definition_type_name UNIQUE (type, name),
  CONSTRAINT uq_tag_definition_rule_code UNIQUE (ruleCode)
);

CREATE INDEX idx_tag_definition_type_enabled ON tag_definition (type, isEnabled);

CREATE TABLE user_tag_relation (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  userId varchar(100) NOT NULL,
  tagId integer NOT NULL,
  source varchar(20) NOT NULL,
  assignedAt datetime NOT NULL DEFAULT (datetime('now')),
  assignedBy varchar(100),
  CONSTRAINT uq_user_tag_relation_user_tag UNIQUE (userId, tagId),
  CONSTRAINT fk_user_tag_relation_tag FOREIGN KEY (tagId)
    REFERENCES tag_definition (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX idx_user_tag_relation_user ON user_tag_relation (userId);
CREATE INDEX idx_user_tag_relation_tag ON user_tag_relation (tagId);

INSERT OR IGNORE INTO tag_definition (name, type, description, ruleCode, isEnabled)
VALUES
  ('新用户', 'SYSTEM', '注册时间 <= 30 天', 'NEW_USER', 1),
  ('高频参与', 'SYSTEM', '过去 180 天签到活动次数 >= 3', 'FREQUENT_CHECKIN', 1),
  ('沉睡用户', 'SYSTEM', '过去 180 天没有报名活动', 'DORMANT_USER', 1),
  ('高价值用户', 'SYSTEM', '累计支付金额 >= 50000 元', 'HIGH_VALUE_USER', 1),
  ('邀请之星', 'SYSTEM', '累计邀请成功参与活动用户数 >= 5', 'INVITE_STAR', 1);

COMMIT;
PRAGMA foreign_keys = ON;
