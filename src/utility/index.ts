// utility/index.ts

import nodemailer from 'nodemailer'; // <-- Add this import
// ... (other existing imports)

export * from './PasswordUtility';
export * from './NotificationUtility';

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

// Create a transporter using your SMTP details
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' or the service name of your provider
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address from .env
        pass: process.env.GMAIL_PASS, // Your App Password from .env
    }
});

// Function to send the email
export const SendVerificationEmail = async (email: string, otp: number) => {
    try {
        const mailOptions = {
            from: 'Your App Name <no-reply@yourapp.com>', // Sender address
            to: email, // Recipient
            subject: 'Your One-Time Password (OTP) for Verification', // Subject line
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #333;">OTP for Account Verification</h2>
                    <p>Thank you for signing up! Please use the following code to complete your verification:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; background-color: #f4f4f4; border-radius: 5px; display: inline-block;">${otp}</p>
                    <p>This code is valid for 30 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent successfully to ${email}. Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error);

        console.error("Error sending verification email:", error);
        return false;
    }
}