CREATE TABLE IF NOT EXISTS issued_certificate (
  id varchar(64) PRIMARY KEY NOT NULL,
  userId varchar(50) NOT NULL,
  activityId integer NOT NULL,
  publicToken varchar(96) NOT NULL UNIQUE,
  imageUrl varchar(500) NOT NULL,
  issuedAt datetime NOT NULL,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now')),
  UNIQUE (userId, activityId)
);
CREATE INDEX IF NOT EXISTS idx_issued_certificate_public_token ON issued_certificate (publicToken);
