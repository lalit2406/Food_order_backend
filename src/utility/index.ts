import nodemailer from 'nodemailer';

// 1. Re-export other utilities
// (Password logic is already in PasswordUtility.ts, so we just export it here)
export * from './PasswordUtility';
export * from './NotificationUtility';
export * from './CloudinaryUtility';

// --- FIXED NODEMAILER CONFIGURATION ---
// Switching to Port 587 (TLS) + IPv4 is the most compatible setup for Render
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,              // Standard TLS port (less likely to be blocked than 465)
    secure: false,          // Must be false for port 587
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Prevents certificate errors
    },
    family: 4,              // <--- CRITICAL: Forces IPv4 to prevent connection timeouts
    connectionTimeout: 10000 // 10 seconds timeout
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