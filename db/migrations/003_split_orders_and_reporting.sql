CREATE TABLE IF NOT EXISTS normal_order_entry (
    id VARCHAR(25) PRIMARY KEY,
    bookNumber INT NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    site VARCHAR(244) NOT NULL,
    lorryNumber VARCHAR(14) NOT NULL,
    item VARCHAR(255) NOT NULL,
    measurementUnit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    freight DECIMAL(10,2) DEFAULT 0,
    taxPercent DECIMAL(5,2) DEFAULT 0,
    taxAmount DECIMAL(10,2) DEFAULT 0,
    totalAmount DECIMAL(10,2) DEFAULT 0,
    paymentStatus VARCHAR(25) NOT NULL,
    cashCredit DECIMAL(10,2) DEFAULT 0,
    bankCredit DECIMAL(10,2) DEFAULT 0,
    dueAmount DECIMAL(10,2) DEFAULT 0,
    due_on_create DECIMAL(10,2) DEFAULT 0,
    due_paid DECIMAL(10,2) DEFAULT 0,
    source VARCHAR(25) NOT NULL,
    slipNumber INT NOT NULL,
    lastUpdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(255) NOT NULL,
    createdBy VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_order_entry (
    id VARCHAR(25) PRIMARY KEY,
    bookNumber INT NOT NULL,
    customerAccountId BIGINT NULL,
    customerAccountName VARCHAR(255) NULL,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    site VARCHAR(244) NOT NULL,
    lorryNumber VARCHAR(14) NOT NULL,
    item VARCHAR(255) NOT NULL,
    measurementUnit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    rate DECIMAL(10,2) DEFAULT 0,
    amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    freight DECIMAL(10,2) DEFAULT 0,
    taxPercent DECIMAL(5,2) DEFAULT 0,
    taxAmount DECIMAL(10,2) DEFAULT 0,
    totalAmount DECIMAL(10,2) DEFAULT 0,
    paymentStatus VARCHAR(25) NOT NULL,
    cashCredit DECIMAL(10,2) DEFAULT 0,
    bankCredit DECIMAL(10,2) DEFAULT 0,
    dueAmount DECIMAL(10,2) DEFAULT 0,
    due_on_create DECIMAL(10,2) DEFAULT 0,
    due_paid DECIMAL(10,2) DEFAULT 0,
    source VARCHAR(25) NOT NULL,
    slipNumber INT NOT NULL,
    lastUpdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastUpdatedBy VARCHAR(255) NOT NULL,
    createdBy VARCHAR(255) NOT NULL
);

ALTER TABLE entry ADD COLUMN IF NOT EXISTS due_on_create DECIMAL(10,2) DEFAULT 0 AFTER dueAmount;
ALTER TABLE entry ADD COLUMN IF NOT EXISTS due_paid DECIMAL(10,2) DEFAULT 0 AFTER due_on_create;

UPDATE entry
SET due_on_create = COALESCE(dueAmount, 0),
    due_paid = COALESCE(due_paid, 0)
WHERE due_on_create = 0 AND COALESCE(dueAmount, 0) > 0;

INSERT INTO normal_order_entry(
    id, bookNumber, date, name, site, lorryNumber, item, measurementUnit,
    quantity, rate, amount, discount, freight, taxPercent, taxAmount, totalAmount,
    paymentStatus, cashCredit, bankCredit, dueAmount, due_on_create, due_paid,
    source, slipNumber, lastUpdatedBy, createdBy
)
SELECT
    e.id, e.bookNumber, e.date, e.name, e.site, e.lorryNumber, e.item, e.measurementUnit,
    e.quantity, e.rate, e.amount, e.discount, e.freight, e.taxPercent, e.taxAmount, e.totalAmount,
    e.paymentStatus, e.cashCredit, e.bankCredit, e.dueAmount, COALESCE(e.due_on_create, e.dueAmount, 0), COALESCE(e.due_paid, 0),
    e.source, e.slipNumber, e.lastUpdatedBy, e.createdBy
FROM entry e
WHERE COALESCE(e.orderType, 'Standard') <> 'B2B'
  AND NOT EXISTS (SELECT 1 FROM normal_order_entry n WHERE n.id = e.id);

INSERT INTO b2b_order_entry(
    id, bookNumber, customerAccountId, customerAccountName, date, name, site, lorryNumber, item, measurementUnit,
    quantity, rate, amount, discount, freight, taxPercent, taxAmount, totalAmount,
    paymentStatus, cashCredit, bankCredit, dueAmount, due_on_create, due_paid,
    source, slipNumber, lastUpdatedBy, createdBy
)
SELECT
    e.id, e.bookNumber, e.customerAccountId, e.customerAccountName, e.date, e.name, e.site, e.lorryNumber, e.item, e.measurementUnit,
    e.quantity, e.rate, e.amount, e.discount, e.freight, e.taxPercent, e.taxAmount, e.totalAmount,
    e.paymentStatus, e.cashCredit, e.bankCredit, e.dueAmount, COALESCE(e.due_on_create, e.dueAmount, 0), COALESCE(e.due_paid, 0),
    e.source, e.slipNumber, e.lastUpdatedBy, e.createdBy
FROM entry e
WHERE COALESCE(e.orderType, 'Standard') = 'B2B'
  AND NOT EXISTS (SELECT 1 FROM b2b_order_entry b WHERE b.id = e.id);
