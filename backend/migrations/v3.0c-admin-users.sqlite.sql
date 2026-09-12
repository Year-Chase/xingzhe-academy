CREATE TABLE IF NOT EXISTS admin_user (
  id varchar(50) PRIMARY KEY NOT NULL,
  username varchar(80) NOT NULL UNIQUE,
  passwordHash varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'ADMIN',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  mustChangePassword boolean NOT NULL DEFAULT 0,
  isSystemAccount boolean NOT NULL DEFAULT 0,
  lastLoginAt datetime NULL,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_user_visible ON admin_user (isSystemAccount, createdAt);
