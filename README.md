# PKE ERP

PKE ERP is now structured as a single deployable Node.js app for Hostinger:

- the root app is Express
- the React UI lives in `client/`
- `npm install` at the repo root installs everything
- `postinstall` builds the React client automatically
- `npm start` runs one Node server and serves both the API and frontend

## Project Structure

- [server.js](/d:/Projects/pke_erp/pke_erp/server.js): root startup file
- [server/app.js](/d:/Projects/pke_erp/pke_erp/server/app.js): Express app
- [client/package.json](/d:/Projects/pke_erp/pke_erp/client/package.json): React client workspace
- [client/src](/d:/Projects/pke_erp/pke_erp/client/src): frontend source
- [routes](/d:/Projects/pke_erp/pke_erp/routes): API routes
- [controllers](/d:/Projects/pke_erp/pke_erp/controllers): backend logic

## Scripts

- `npm install`
  Installs the root Express app and the React client workspace.
- `npm run build`
  Builds the React client from `client/`.
- `npm start`
  Starts the Express server and serves the built frontend.
- `npm run client:start`
  Runs the React client in development mode.
- `npm run server`
  Runs the backend with `nodemon`.

## Hostinger Deployment

This repo is ready to deploy as one Node.js application.

1. Push this repo to Git.
2. In Hostinger, create a Node.js app from the repository.
3. Make sure the startup command is `npm start`.
4. Set environment variables:
   `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
5. Trigger install/deploy.

What happens on deploy:

- Hostinger runs `npm install`
- the root `postinstall` script builds the React client
- `npm start` launches Express from [server.js](/d:/Projects/pke_erp/pke_erp/server.js)
- Express serves the built client from `client/build`

## Local Development

1. Run `npm install`
2. Run `npm run server`
3. In another terminal, run `npm run client:start`

The frontend uses the proxy in [client/package.json](/d:/Projects/pke_erp/pke_erp/client/package.json), so local API calls still go to `http://localhost:8000`.

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
