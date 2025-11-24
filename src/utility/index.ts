// utility/index.ts

import nodemailer from 'nodemailer'; // <-- Add this import
// ... (other existing imports)

export * from './PasswordUtility';
export * from './NotificationUtility';
export * from './CloudinaryUtility';

import bcrypt from 'bcrypt';

// Generates a bcrypt salt with 10 rounds
export const GenerateSalt = async (): Promise<string> => {
    return await bcrypt.genSalt(10);
};

// Hashes the password using the provided salt
export const GeneratePassword = async (password: string, salt: string): Promise<string> => {
    return await bcrypt.hash(password, salt);
};

// To compare a plain password with a hash (for login)
export const ValidatePassword = async (enteredPassword: string, savedHash: string, salt: string): Promise<boolean> => {
    const hash = await GeneratePassword(enteredPassword, salt);
    return hash === savedHash;
};


// --- Nodemailer Email Utility ---
// --- FIXED NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // Explicitly tell it to use Gmail
    port: 465,               // Port 465 is usually open on Render (SSL)
    secure: true,            // Must be true for port 465
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        // This helps prevents "Self Signed Certificate" errors in some cloud environments
        rejectUnauthorized: false 
    },
    // Increase timeout to prevent premature cutoffs
    connectionTimeout: 10000, 
});

// Function to send the email (Keep your existing function logic)
export const SendVerificationEmail = async (email: string, otp: number) => {
    try {
        const mailOptions = {
            from: '"FoodieDelight" <admin@foodiedelight.com>', // Adds a nice sender name
            to: email, 
            subject: 'Your Verification Code', 
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #ff4d4d;">FoodieDelight Verification</h2>
                    <p>Your One-Time Password (OTP) is:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #333; background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 2px;">${otp}</p>
                    <p>This code expires in 30 minutes.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Email Error:`, error);
        return false;
    }
}