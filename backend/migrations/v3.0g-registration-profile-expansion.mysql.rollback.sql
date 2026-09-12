ALTER TABLE activity_registration_info
  DROP COLUMN inviterName,
  DROP COLUMN jobTitle,
  DROP COLUMN organization,
  DROP COLUMN residentialAddress;

ALTER TABLE user_registration_profile
  DROP COLUMN inviterName,
  DROP COLUMN jobTitle,
  DROP COLUMN organization,
  DROP COLUMN residentialAddress;
