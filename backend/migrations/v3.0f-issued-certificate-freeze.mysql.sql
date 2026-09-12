ALTER TABLE issued_certificate
  ADD COLUMN templateId int NULL AFTER imageUrl,
  ADD COLUMN renderSnapshot text NULL AFTER templateId;
