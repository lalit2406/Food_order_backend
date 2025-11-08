import * as dotenv from 'dotenv';
// IMPORTANT: Execute dotenv.config() FIRST to ensure process.env is populated.
dotenv.config(); 

import express from 'express';
import App from './services/ExpressApp';
import dbConnection from './services/Database';
import { Config } from './config'; // Import the Config class

const StartServer = async () => {

    const app = express();
    const PORT = Config.PORT; // Read PORT from the Config class

    await dbConnection();

    await App(app);

    app.listen(PORT, () => {
        console.log(`Listening to port ${PORT}`);
    });
}

StartServer();