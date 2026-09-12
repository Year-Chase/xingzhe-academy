CREATE TABLE IF NOT EXISTS issued_certificate (
  id varchar(64) NOT NULL,
  userId varchar(50) NOT NULL,
  activityId int NOT NULL,
  publicToken varchar(96) NOT NULL,
  imageUrl varchar(500) NOT NULL,
  issuedAt datetime NOT NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_issued_certificate_user_activity (userId, activityId),
  UNIQUE KEY uq_issued_certificate_public_token (publicToken),
  KEY idx_issued_certificate_public_token (publicToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
