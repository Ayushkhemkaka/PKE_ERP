CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_account (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL DEFAULT '',
    contact_name VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    gstin VARCHAR(32) NOT NULL DEFAULT '',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_account_name (account_name)
);

CREATE TABLE IF NOT EXISTS measurement_unit (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    unit_name VARCHAR(64) NOT NULL UNIQUE,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(255) NOT NULL DEFAULT 'System',
    updated_by VARCHAR(255) NOT NULL DEFAULT 'System',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(128) NOT NULL UNIQUE,
    default_measurement_unit_id INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(255) NOT NULL DEFAULT 'System',
    updated_by VARCHAR(255) NOT NULL DEFAULT 'System',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_item_default_measurement_unit (default_measurement_unit_id),
    CONSTRAINT fk_item_default_measurement_unit FOREIGN KEY (default_measurement_unit_id) REFERENCES measurement_unit(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS item_rate (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    measurement_unit_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    measurement_unit VARCHAR(50) NOT NULL,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_rate_item_measurement (item_id, measurement_unit_id),
    KEY idx_item_rate_item_name (item_name),
    KEY idx_item_rate_measurement_unit (measurement_unit),
    CONSTRAINT fk_item_rate_item FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_rate_measurement_unit FOREIGN KEY (measurement_unit_id) REFERENCES measurement_unit(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS items_history (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_rate_id BIGINT NOT NULL,
    item_id INT NOT NULL,
    measurement_unit_id INT NOT NULL,
    old_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    new_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    changed_by VARCHAR(255) NOT NULL DEFAULT 'System',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_items_history_item_created (item_id, created_at),
    KEY idx_items_history_rate_created (item_rate_id, created_at),
    CONSTRAINT fk_items_history_item_rate FOREIGN KEY (item_rate_id) REFERENCES item_rate(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_items_history_item FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_items_history_measurement_unit FOREIGN KEY (measurement_unit_id) REFERENCES measurement_unit(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS order_entry (
    id VARCHAR(25) NOT NULL PRIMARY KEY,
    bookNumber INT NOT NULL,
    orderType VARCHAR(25) NOT NULL DEFAULT 'Standard',
    customerAccountId BIGINT NULL,
    customerAccountName VARCHAR(255) NULL,
    itemId INT NULL,
    measurementUnitId INT NULL,
    itemRateId BIGINT NULL,
    customerGstin VARCHAR(32) NULL,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    site VARCHAR(244) NOT NULL,
    lorryNumber VARCHAR(14) NOT NULL,
    item VARCHAR(255) NOT NULL,
    measurementUnit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    gross DECIMAL(10,3) NOT NULL DEFAULT 0,
    tare DECIMAL(10,3) NOT NULL DEFAULT 0,
    net DECIMAL(10,3) NOT NULL DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    freight DECIMAL(10,2) DEFAULT 0,
    taxPercent DECIMAL(5,2) DEFAULT 0,
    taxAmount DECIMAL(10,2) DEFAULT 0,
    totalAmount DECIMAL(10,2) DEFAULT 0,
    paymentStatus VARCHAR(25) NOT NULL,
    orderStatus VARCHAR(25) NOT NULL DEFAULT 'Active',
    is_printed TINYINT(1) NOT NULL DEFAULT 0,
    printed_by VARCHAR(255) NULL,
    cancelledAt DATETIME NULL,
    cancelledBy VARCHAR(255) NULL,
    dueAmount DECIMAL(10,2) DEFAULT 0,
    due_on_create DECIMAL(10,2) DEFAULT 0,
    due_paid DECIMAL(10,2) DEFAULT 0,
    cashCredit DECIMAL(10,2) DEFAULT 0,
    bankCredit DECIMAL(10,2) DEFAULT 0,
    source VARCHAR(25) NOT NULL,
    remarks VARCHAR(255) NOT NULL DEFAULT '',
    slipNumber INT NOT NULL,
    lastUpdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(255) NOT NULL,
    createdBy VARCHAR(255) NOT NULL,
    KEY idx_order_entry_date (date),
    KEY idx_order_entry_book_slip (bookNumber, slipNumber),
    KEY idx_order_entry_customer_account (customerAccountId),
    KEY idx_order_entry_item (item),
    CONSTRAINT fk_order_entry_customer_account FOREIGN KEY (customerAccountId) REFERENCES customer_account(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_entry_item FOREIGN KEY (itemId) REFERENCES item(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_entry_measurement_unit FOREIGN KEY (measurementUnitId) REFERENCES measurement_unit(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_entry_item_rate FOREIGN KEY (itemRateId) REFERENCES item_rate(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS history (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entryId VARCHAR(25) NOT NULL,
    field VARCHAR(50) NOT NULL,
    oldValue VARCHAR(255),
    newValue VARCHAR(255),
    createdDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdBy VARCHAR(255) NOT NULL,
    KEY idx_history_entry_created (entryId, createdDate),
    CONSTRAINT fk_history_entry FOREIGN KEY (entryId) REFERENCES order_entry(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS user_work_log (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NULL,
    details JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_user_work_log_entity (entity_type, entity_id),
    KEY idx_user_work_log_created (created_at),
    CONSTRAINT fk_user_work_log_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT IGNORE INTO app_user(full_name, email, password_hash)
VALUES (
    'Receipt Desk',
    'receiptdesk@pke.local',
    '5f094546c46534c592f8e3acca1bb2d6:cd2080f2923bc0e9f81937f58d463f2c02ca89bbcc53e0976d0bb6c65a4a64dae03bdb373c9c64954fb35fb766b610f09eab7456fe88264edf0a46f43530e628'
);

INSERT IGNORE INTO customer_account(account_name, address, contact_name, phone, gstin, created_by, updated_by)
VALUES ('General B2B Customer', '', '', '', '', 'System', 'System');

INSERT IGNORE INTO measurement_unit(unit_name, created_by, updated_by)
VALUES
    ('Cft', 'System', 'System'),
    ('Tons', 'System', 'System');

INSERT IGNORE INTO item(item_name, default_measurement_unit_id, created_by, updated_by)
VALUES
    ('10mm (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('20mm (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('Dust (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('Sand (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('Local Sand (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('Metal (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('GSB (Cft)', (SELECT id FROM measurement_unit WHERE unit_name = 'Cft'), 'System', 'System'),
    ('10mm (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('20mm (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('Dust (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('Sand (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('Local Sand (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('Metal (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System'),
    ('GSB (Tons)', (SELECT id FROM measurement_unit WHERE unit_name = 'Tons'), 'System', 'System');

INSERT IGNORE INTO item_rate(
    item_id,
    measurement_unit_id,
    item_name,
    measurement_unit,
    rate,
    is_active,
    created_by,
    updated_by
)
SELECT
    i.id,
    i.default_measurement_unit_id,
    i.item_name,
    mu.unit_name,
    0,
    1,
    'System',
    'System'
FROM item i
INNER JOIN measurement_unit mu ON mu.id = i.default_measurement_unit_id;
