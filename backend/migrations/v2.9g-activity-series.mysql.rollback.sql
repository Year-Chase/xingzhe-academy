-- V2.9G rollback for MySQL.
-- Warning: activity.seriesId values and activity_series records are discarded.

ALTER TABLE activity DROP FOREIGN KEY fk_activity_series;
ALTER TABLE activity DROP INDEX idx_activity_series_id;
ALTER TABLE activity DROP COLUMN seriesId;

DROP TABLE IF EXISTS activity_series;
