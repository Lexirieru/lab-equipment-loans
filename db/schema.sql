-- Reference schema. admin-service creates this automatically on first start,
-- so running this file by hand is optional.
CREATE DATABASE IF NOT EXISTS equipment_loans;
USE equipment_loans;

CREATE TABLE IF NOT EXISTS equipment (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  asset_code    VARCHAR(32)  NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  category      VARCHAR(60)  NOT NULL DEFAULT 'General',
  location      VARCHAR(80)  NOT NULL DEFAULT 'Lab',
  status        ENUM('available','borrowed','maintenance') NOT NULL DEFAULT 'available',
  borrower_name VARCHAR(120) NULL,
  due_date      DATE NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
