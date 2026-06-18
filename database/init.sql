USE docvalidation;

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','capturista') NOT NULL DEFAULT 'capturista',
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  folio             VARCHAR(50)  NOT NULL UNIQUE,
  title             VARCHAR(255) NOT NULL,
  document_type     VARCHAR(100) NOT NULL,
  issuing_area      VARCHAR(100) NOT NULL,
  status            ENUM('vigente','revocado','cancelado') NOT NULL DEFAULT 'vigente',
  original_filename VARCHAR(255) NOT NULL,
  original_path     VARCHAR(500) NOT NULL,
  qr_path           VARCHAR(500),
  qr_pdf_path       VARCHAR(500),
  qr_position       VARCHAR(50)  NOT NULL DEFAULT 'bottom-right',
  user_id           INT          NOT NULL,
  revoked_at        TIMESTAMP    NULL,
  revoked_reason    VARCHAR(500) NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS validations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  folio       VARCHAR(50)  NOT NULL,
  document_id INT          NULL,
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(500),
  result      ENUM('found','not_found') NOT NULL,
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_folio (folio),
  INDEX idx_document_id (document_id)
);
