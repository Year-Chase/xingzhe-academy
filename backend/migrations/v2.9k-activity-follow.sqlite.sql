-- V2.9K: brand external links and durable activity follows.
ALTER TABLE activity_series ADD COLUMN externalUrl varchar(500);

CREATE TABLE IF NOT EXISTS activity_follow (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  userId varchar(100) NOT NULL,
  activityId integer NOT NULL,
  followedAt datetime NOT NULL,
  unfollowedAt datetime,
  convertedAt datetime,
  createdAt datetime NOT NULL DEFAULT (datetime('now')),
  updatedAt datetime NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_follow_user_activity ON activity_follow (userId, activityId);
CREATE INDEX IF NOT EXISTS idx_activity_follow_activity_current ON activity_follow (activityId, unfollowedAt);
