import * as mongoose from 'mongoose';
import { Config } from '../config'; // Import the Config class

const dbConnection = async () => {
    // Retrieve the URI using the Config getter, which ensures the environment is loaded
    const uri = Config.MONGO_URI; 

    try {
        // Now Mongoose receives a valid, non-undefined string
        await mongoose.connect(uri);
        console.log('Database connected successfully!');
    } catch (error) {
        console.error('Database connection failed:', error);
        // Important: Exit the process if the database connection fails
        process.exit(1);
    }
};

export default dbConnection;