ALTER TABLE user_registration_profile ADD COLUMN residentialAddress varchar(200) NULL;
ALTER TABLE user_registration_profile ADD COLUMN organization varchar(100) NULL;
ALTER TABLE user_registration_profile ADD COLUMN jobTitle varchar(100) NULL;
ALTER TABLE user_registration_profile ADD COLUMN inviterName varchar(100) NULL;

ALTER TABLE activity_registration_info ADD COLUMN residentialAddress varchar(200) NULL;
ALTER TABLE activity_registration_info ADD COLUMN organization varchar(100) NULL;
ALTER TABLE activity_registration_info ADD COLUMN jobTitle varchar(100) NULL;
ALTER TABLE activity_registration_info ADD COLUMN inviterName varchar(100) NULL;
