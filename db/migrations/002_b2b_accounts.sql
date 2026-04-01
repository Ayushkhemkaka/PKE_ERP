CREATE TABLE IF NOT EXISTS customer_account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    site VARCHAR(255) NOT NULL DEFAULT '',
    contact_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_account_name (account_name)
);

ALTER TABLE entry ADD COLUMN IF NOT EXISTS orderType VARCHAR(25) NOT NULL DEFAULT 'Standard' AFTER bookNumber;
ALTER TABLE entry ADD COLUMN IF NOT EXISTS customerAccountId BIGINT NULL AFTER orderType;
ALTER TABLE entry ADD COLUMN IF NOT EXISTS customerAccountName VARCHAR(255) NULL AFTER customerAccountId;

INSERT INTO customer_account(account_name, site, contact_name, phone, created_by, updated_by)
SELECT 'General B2B Customer', 'Main Site', '', '', 'System', 'System'
WHERE NOT EXISTS (
    SELECT 1 FROM customer_account WHERE account_name = 'General B2B Customer'
);
