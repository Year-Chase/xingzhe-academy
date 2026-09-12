CREATE TABLE IF NOT EXISTS admin_user (
  id varchar(50) NOT NULL,
  username varchar(80) NOT NULL,
  passwordHash varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'ADMIN',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  mustChangePassword tinyint(1) NOT NULL DEFAULT 0,
  isSystemAccount tinyint(1) NOT NULL DEFAULT 0,
  lastLoginAt datetime NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_user_username (username),
  KEY idx_admin_user_visible (isSystemAccount, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
