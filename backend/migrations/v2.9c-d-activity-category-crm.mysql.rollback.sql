-- V2.9C+D rollback for MySQL.
-- This removes category/tag structures. It does not modify legacy user_tag.
-- Warning: activity.categoryId values and normalized user tag relations are discarded.

DROP TABLE IF EXISTS user_tag_relation;
DROP TABLE IF EXISTS tag_definition;

ALTER TABLE activity DROP FOREIGN KEY fk_activity_category;
ALTER TABLE activity DROP KEY idx_activity_category_id;
ALTER TABLE activity DROP COLUMN categoryId;

DROP TABLE IF EXISTS activity_category;
