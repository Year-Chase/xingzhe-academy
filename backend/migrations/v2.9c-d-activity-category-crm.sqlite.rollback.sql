-- V2.9C+D rollback for local SQLite.
-- Warning: activity.categoryId values and normalized user tag relations are discarded.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

DROP TABLE IF EXISTS user_tag_relation;
DROP TABLE IF EXISTS tag_definition;

CREATE TABLE activity_v29cd_rollback (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  title varchar(200) NOT NULL,
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
  createdAt datetime NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO activity_v29cd_rollback (
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
ALTER TABLE activity_v29cd_rollback RENAME TO activity;
DROP TABLE IF EXISTS activity_category;

COMMIT;
PRAGMA foreign_keys = ON;
