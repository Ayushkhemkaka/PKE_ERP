# PKE ERP

PKE ERP is now structured as a single Next.js app so the frontend and backend can be deployed together.

## Project Structure

- [pages](/d:/Projects/pke_erp/pke_erp/pages): Next pages and API handlers
- [next.config.mjs](/d:/Projects/pke_erp/pke_erp/next.config.mjs): rewrites `/auth/*` and `/data/*` to Next API routes
- [client/src](/d:/Projects/pke_erp/pke_erp/client/src): existing ERP React UI reused inside Next
- [controllers](/d:/Projects/pke_erp/pke_erp/controllers): backend business logic reused by Next API routes
- [configs](/d:/Projects/pke_erp/pke_erp/configs): database connection setup

## Scripts

- `npm install`
  Installs the Next.js app dependencies.
- `npm run build`
  Builds the Next.js production app.
- `npm start`
  Starts the Next.js production server.
- `npm run dev`
  Starts the Next.js development server.

## Hostinger Deployment

This repo is ready to deploy as one Next.js application.

1. Push this repo to Git.
2. In Hostinger, import it as a Next.js app or Node.js app.
3. Make sure the startup command is `npm start`.
4. Set environment variables:
   `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
5. Trigger install/deploy.

What happens on deploy:

- Hostinger runs `npm install`
- Hostinger runs `npm run build`
- `npm start` launches the Next.js server
- Next serves both the ERP UI and API from the same app

## Local Development

1. Run `npm install`
2. Run `npm run dev`

The ERP frontend still calls `/auth/*` and `/data/*`. [next.config.mjs](/d:/Projects/pke_erp/pke_erp/next.config.mjs) rewrites those requests to the Next API routes under `pages/api`.

# DBMS
## Entry

Create Table Self.entry (
    Id varchar(25) Primary key,
    BookNumber Integer Not Null,
    SlipNumber Integer Not Null,
    Source varchar(25) Not Null,
    Date Date not null, 
    Name Varchar(255) Not Null,
    Site Varchar(244) Not Null,
    LorryNumber varchar(14) Not Null,
    Item varchar(255) Not null,
    MeasurementUnit varchar(50) Not Null,
    Quantity Decimal(8,3) Not Null,
    Rate Decimal(10,2) ,
    Amount Decimal(10,2) ,
    Discount Decimal(10,2),
    Freight Decimal(10,2),
    TaxPercent Decimal(5,2),
    TaxAmount Decimal(10,2),
    TotalAmount Decimal(10,2),
    PaymentStatus varchar(25) Not Null,
    CashCredit Decimal(10,2),
    BankCredit Decimal(10,2),
    DueAmount Decimal(10,2),
    LastUpdate timestamp(0) with time zone DEFAULT (Current_Timestamp),
    createdDate timestamp(0) with time zone DEFAULT (Current_Timestamp),
    lastUpdatedBy varchar(255) Not Null,
    createdBy varchar(255) Not Null
)


Create Table Self.history (
    Id Serial varchar(25) Primary key,
    EntryId varchar(25) 
    ADD CONSTRAINT fk_history_entryId
    FOREIGN KEY (entryId)
    REFERENCES self.entry(id);
	Field varchar(50) Not Null,
	OldValue varchar(255) Not Null,
	NewValue varchar(255) Not Null,
    createdDate timestamp(0) with time zone DEFAULT (Current_Timestamp),
    createdBy varchar(255) Not Null
)

TRIGGERS:
------------------------
    CREATE TRIGGER self_lastUpdate BEFORE INSERT OR UPDATE ON self.entry FOR EACH ROW EXECUTE FUNCTION self.entry_lastUpdate_timestamp();

FUNCTIONS:
----------------------
	CREATE OR REPLACE FUNCTION self.entry_lastUpdate_timestamp() RETURNS TRIGGER LANGUAGE PLPGSQL AS
	$$
	BEGIN
		NEW.lastupdate := current_timestamp;
		RETURN NEW;
	END;
	$$
	;
