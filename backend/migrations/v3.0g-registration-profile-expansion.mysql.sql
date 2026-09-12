ALTER TABLE user_registration_profile
  ADD COLUMN residentialAddress varchar(200) NULL AFTER phone,
  ADD COLUMN organization varchar(100) NULL AFTER roomPreference,
  ADD COLUMN jobTitle varchar(100) NULL AFTER organization,
  ADD COLUMN inviterName varchar(100) NULL AFTER jobTitle;

ALTER TABLE activity_registration_info
  ADD COLUMN residentialAddress varchar(200) NULL AFTER phone,
  ADD COLUMN organization varchar(100) NULL AFTER roomPreference,
  ADD COLUMN jobTitle varchar(100) NULL AFTER organization,
  ADD COLUMN inviterName varchar(100) NULL AFTER jobTitle;
