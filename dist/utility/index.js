"use strict";
// utility/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendVerificationEmail = exports.ValidatePassword = exports.GeneratePassword = exports.GenerateSalt = void 0;
const nodemailer_1 = __importDefault(require("nodemailer")); // <-- Add this import
// ... (other existing imports)
__exportStar(require("./PasswordUtility"), exports);
__exportStar(require("./NotificationUtility"), exports);
const bcrypt_1 = __importDefault(require("bcrypt"));
// Generates a bcrypt salt with 10 rounds
const GenerateSalt = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.genSalt(10);
});
exports.GenerateSalt = GenerateSalt;
// Hashes the password using the provided salt
const GeneratePassword = (password, salt) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.hash(password, salt);
});
exports.GeneratePassword = GeneratePassword;
// To compare a plain password with a hash (for login)
const ValidatePassword = (enteredPassword, savedHash, salt) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = yield (0, exports.GeneratePassword)(enteredPassword, salt);
    return hash === savedHash;
});
exports.ValidatePassword = ValidatePassword;
// --- Nodemailer Email Utility ---
// Create a transporter using your SMTP details
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail', // Use 'gmail' or the service name of your provider
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address from .env
        pass: process.env.GMAIL_PASS, // Your App Password from .env
    }
});
// Function to send the email
const SendVerificationEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
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
        const info = yield transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email}. Message ID: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error);
        console.error("Error sending verification email:", error);
        return false;
    }
});
exports.SendVerificationEmail = SendVerificationEmail;
//# sourceMappingURL=index.js.map