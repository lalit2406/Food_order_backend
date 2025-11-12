import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';

// Import all routes from your routes directory
import { AdminRoute, VandorRoute, ShoppingRoute, CustomerRoute, DeliveryRoute } from '../routes/';

export default async (app: Application) => {

    app.use(cors());

    // Standard Middleware for request body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const publicPath = path.join(__dirname, '../../public'); 
    app.use(express.static(publicPath));

    const imagePath = path.join(__dirname,'../images');
    
    app.use('/images', express.static(imagePath));

    // // Serve uploaded images (Path: src/services -> .. (to src) -> .. (to root) -> images)
    // // We use '..' twice to go from src/services/ to the project root
    // app.use('/images', express.static(path.join(__dirname, '..', '..', 'images')));


    
    // --- API Route Definitions ---
    // These must come *after* the root '/' handler above to prevent conflicts.
    app.use('/admin', AdminRoute);
    app.use('/vandor', VandorRoute);
    app.use('/customer', CustomerRoute);
    app.use('/delivery', DeliveryRoute)
    app.use(ShoppingRoute); 


    return app;
};