# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Hostinger Deployment

This project is set up to deploy as a single Node.js app on Hostinger:

1. Run `npm install`
2. Run `npm run build`
3. Set your environment variables in Hostinger:
   `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
4. Start the app with `npm start`

Deployment notes:

- `npm start` runs the Express server from [server.js](/server.js)
- The backend serves the built React app from the `build/` folder
- Frontend API calls use same-origin routes like `/auth/*` and `/data/*`
- For local development, CRA uses the `proxy` setting in `package.json` to reach the backend on port `8000`

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)



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
