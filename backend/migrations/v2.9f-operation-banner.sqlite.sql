-- V2.9F operation banner migration for local SQLite.

CREATE TABLE IF NOT EXISTS operation_banner (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  imageUrl varchar(500) NOT NULL,
  title varchar(100) NOT NULL,
  description varchar(240),
  sortOrder integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT ('ACTIVE'),
  startAt datetime,
  endAt datetime,
  jumpType varchar(20) NOT NULL DEFAULT ('NONE'),
  jumpValue varchar(120),
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_operation_banner_active_window ON operation_banner (status, sortOrder, startAt, endAt);
CREATE INDEX IF NOT EXISTS idx_operation_banner_jump ON operation_banner (jumpType, jumpValue);
