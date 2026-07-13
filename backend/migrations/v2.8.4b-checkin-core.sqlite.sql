-- V2.8.4B checkin core migration for local SQLite.
-- Run against a backup or disposable copy first.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE activity_registration ADD COLUMN checkedInAt datetime NULL;
ALTER TABLE activity_registration ADD COLUMN checkedInByUserId varchar(50) NULL;
ALTER TABLE activity_registration ADD COLUMN checkinSource varchar(30) NULL;

CREATE TABLE activity_qr_v284b (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  code varchar(64) NOT NULL,
  status varchar(50) NOT NULL DEFAULT ('ACTIVE'),
  stage varchar(20) NOT NULL DEFAULT ('LEGACY'),
  version integer NOT NULL DEFAULT 1,
  expiresAt datetime,
  supersededAt datetime,
  revokedAt datetime,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  registrationId integer NOT NULL,
  CONSTRAINT UQ_activity_qr_code UNIQUE (code),
  CONSTRAINT FK_activity_qr_registration FOREIGN KEY (registrationId)
    REFERENCES activity_registration (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

INSERT INTO activity_qr_v284b (
  id,
  code,
  status,
  stage,
  version,
  expiresAt,
  supersededAt,
  revokedAt,
  createdAt,
  registrationId
)
SELECT
  id,
  code,
  status,
  'LEGACY',
  1,
  expiresAt,
  NULL,
  NULL,
  createdAt,
  registrationId
FROM activity_qr;

DROP TABLE activity_qr;
ALTER TABLE activity_qr_v284b RENAME TO activity_qr;

CREATE UNIQUE INDEX uniq_activity_qr_registration_version
  ON activity_qr (registrationId, version);

CREATE INDEX idx_activity_qr_registration_id
  ON activity_qr (registrationId);

CREATE INDEX idx_activity_qr_registration_status
  ON activity_qr (registrationId, status);

COMMIT;
PRAGMA foreign_keys = ON;
