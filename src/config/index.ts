
// Securely read the MongoDB connection string
export const MONGO_URI = process.env.MONGO_URI; 

// Securely read the application secret
export const APP_SECRET = process.env.APP_SECRET;

// This is fine, it falls back to 8000 if PORT isn't set
export const PORT = process.env.PORT || 8000;