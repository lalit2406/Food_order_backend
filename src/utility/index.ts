
import nodemailer from 'nodemailer'; 

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
 
// --- FIXED NODEMAILER CONFIGURATION (Force IPv4) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,               // Use Port 465 (Direct SSL)
    secure: true,            // Must be true for port 465
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false 
    },
    family: 4,               // <--- CRITICAL: Forces IPv4 to fix Render timeouts
    connectionTimeout: 10000 // Increase timeout to 10 seconds
} as any);

// Function to send the email
export const SendVerificationEmail = async (email: string, otp: number) => {
    try {
        const mailOptions = {
            from: '"FoodieDelight" <no-reply@foodiedelight.com>',
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