-- V2.9K: brand external links and durable activity follows.
ALTER TABLE activity_series
  ADD COLUMN externalUrl varchar(500) NULL AFTER description;

CREATE TABLE activity_follow (
  id int NOT NULL AUTO_INCREMENT,
  userId varchar(100) NOT NULL,
  activityId int NOT NULL,
  followedAt datetime(6) NOT NULL,
  unfollowedAt datetime(6) NULL,
  convertedAt datetime(6) NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_activity_follow_user_activity (userId, activityId),
  KEY idx_activity_follow_activity_current (activityId, unfollowedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
