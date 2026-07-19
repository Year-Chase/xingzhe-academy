-- V2.9F operation banner rollback for local SQLite.
-- This removes Banner management data. Run only after backing up and confirming rollback scope.

DROP TABLE IF EXISTS operation_banner;
