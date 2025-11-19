import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { Config } from '../config';

// Configure with your credentials
cloudinary.config({ 
  cloud_name: Config.CLOUDINARY_CLOUD_NAME, 
  api_key: Config.CLOUDINARY_API_KEY, 
  api_secret: Config.CLOUDINARY_API_SECRET 
});

export const UploadImage = async (file: Express.Multer.File) => {
    try {
        // Upload the file from the local path to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'food-delivery-app' // Optional: Keeps your cloud organized
        });

        // Optional: Delete the file from local server after upload to save space
        // fs.unlinkSync(file.path); 

        return result.secure_url; // Return the web URL (https://...)
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
}