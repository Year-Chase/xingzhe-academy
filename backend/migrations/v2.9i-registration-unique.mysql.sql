-- V2.9I: enforce one business registration per user per activity.
-- Preflight:
--   SELECT userId, activityId, COUNT(*) FROM activity_registration
--   GROUP BY userId, activityId HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX uniq_activity_registration_user_activity
  ON activity_registration (userId, activityId);
