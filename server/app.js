//To run the app concurrently
//"concurrently \"react-scripts start\" \"cd backend && nodemon server\"",

import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { dataRouter } from '../routes/dataRouter.js';
import { authRouter } from '../routes/authRouter.js';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDirectory = path.resolve(__dirname, '../client/build');
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, true);
    },
    optionsSuccessStatus: 200
}

let port = process.env.PORT || 8000;

const app = express();
app.use(compression());
app.use(cors(corsOptions));
app.use(bodyParser.json());
if (fs.existsSync(buildDirectory)) {
    app.use(express.static(buildDirectory));
}

app.get("/", (req, res) => {
    if (fs.existsSync(path.join(buildDirectory, 'index.html'))) {
        res.sendFile(path.join(buildDirectory, 'index.html'));
        return;
    }

    res.send("PKE ERP API is running. Build the frontend to serve the app UI from this server.");
});

app.use("/auth", authRouter)
app.use("/data" , dataRouter)

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/auth') || req.path.startsWith('/data')) {
        next();
        return;
    }

    if (fs.existsSync(path.join(buildDirectory, 'index.html'))) {
        res.sendFile(path.join(buildDirectory, 'index.html'));
        return;
    }

    res.status(404).send('Frontend build not found.');
});

app.listen(port, () => {
    console.log(`PKE ERP app is listening on port ${port}`);
});
