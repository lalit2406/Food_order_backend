import * as dotenv from 'dotenv';

// Use a class to manage configuration, ensuring variables are accessed after dotenv.config() runs.
// Alternatively, this file should only export accessor functions, not constant values read at load time.

export class Config {
    // Helper function to ensure the environment variables are available before reading
    private static ensureEnvLoaded() {
        if (!process.env.MONGO_URI) {
            // Load environment variables if they haven't been loaded yet
            dotenv.config();
        }
    }

    public static get MONGO_URI(): string {
        Config.ensureEnvLoaded();
        const uri = process.env.MONGO_URI;
        if (!uri) {
            // Add a proper check and exit if the critical variable is missing
            console.error("FATAL ERROR: MONGO_URI environment variable is not set!");
            process.exit(1);
        }
        return uri;
    }

    public static get APP_SECRET(): string {
        Config.ensureEnvLoaded();
        const secret = process.env.APP_SECRET;
        if (!secret) {
            console.warn("WARNING: APP_SECRET environment variable is not set. Using a placeholder.");
            return "DEFAULT_SECRET"; // Fallback for testing, but should be fixed
        }
        return secret;
    }

    public static get PORT(): number {
        Config.ensureEnvLoaded();
        // Fall back to 8000 if PORT is not set
        return parseInt(process.env.PORT || '8000', 10);
    }
    
    public static get GMAIL_USER(): string {
        Config.ensureEnvLoaded();
        return process.env.GMAIL_USER || '';
    }

    public static get GMAIL_PASS(): string {
        Config.ensureEnvLoaded();
        return process.env.GMAIL_PASS || '';
    }

    public static get CLOUDINARY_CLOUD_NAME(): string {
        Config.ensureEnvLoaded();
        return process.env.CLOUDINARY_CLOUD_NAME || '';
    }

    public static get CLOUDINARY_API_KEY(): string {
        Config.ensureEnvLoaded();
        return process.env.CLOUDINARY_API_KEY || '';
    }

    public static get CLOUDINARY_API_SECRET(): string {
        Config.ensureEnvLoaded();
        return process.env.CLOUDINARY_API_SECRET || '';
    }
}