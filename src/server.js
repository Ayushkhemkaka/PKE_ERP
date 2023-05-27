//To run the app concurrently
//"concurrently \"react-scripts start\" \"cd backend && nodemon server\"",

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { dataRouter } from '../routes/dataRouter.js';
import bodyParser from 'body-parser';

var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // For legacy browser support
    }

let port = process.env.PORT || 8000;

const app = express();
app.use(compression());
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Api Working!");
});

app.use("/data" , dataRouter)

app.listen(port, () => {
    console.log(`Artemis app is listening on worker ${port}`);
});