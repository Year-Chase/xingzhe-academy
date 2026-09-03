-- V2.9I: enforce one business registration per user per activity.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_registration_user_activity
  ON activity_registration (userId, activityId);
