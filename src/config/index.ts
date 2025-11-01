// // export const MONGO_URI = "mongodb+srv://lalitkumar931536_db_user:Glad2406@umjxm.mongodb.net/fooddelivery?retryWrites=true&w=majority&appName=fooddelivery";

// export const MONGO_URI ='mongodb+srv://foodowner:c32Y6jospNUpaze6@cluster0.boa5kzi.mongodb.net/?appName=Cluster0';


// // foodowner:c32Y6jospNUpaze6
// //  "mongodb+srv://lalitkumar931536_db_user:Glad2406@fooddelivery.unx1cw1.mongodb.net/?retryWrites=true&w=majority&appName=FoodDelivery";


// export const APP_SECRET= "Our_App_Secret";

// export const PORT = process.env.PORT || 8000;

// Example: config.ts

// The application will now ONLY look for these variables 
// in the environment provided by Render (or your local shell/tool).

// Securely read the MongoDB connection string
export const MONGO_URI = process.env.MONGO_URI; 

// Securely read the application secret
export const APP_SECRET = process.env.APP_SECRET;

// This is fine, it falls back to 8000 if PORT isn't set
export const PORT = process.env.PORT || 8000;