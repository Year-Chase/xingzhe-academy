-- V2.9G activity series migration for local SQLite.
-- Preflight:
--   SELECT name FROM sqlite_master WHERE type='table' AND name='activity_series';
--   PRAGMA table_info(activity);

CREATE TABLE IF NOT EXISTS activity_series (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name varchar(80) NOT NULL,
  code varchar(50) NOT NULL,
  coverImage varchar(500),
  shortDescription varchar(120),
  description text,
  sortOrder integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT ('ACTIVE'),
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_series_code ON activity_series (code);
CREATE INDEX IF NOT EXISTS idx_activity_series_status_sort ON activity_series (status, sortOrder);

ALTER TABLE activity ADD COLUMN seriesId integer REFERENCES activity_series(id) ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE INDEX IF NOT EXISTS idx_activity_series_id ON activity (seriesId);
