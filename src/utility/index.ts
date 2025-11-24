// utility/index.ts
import nodemailer from 'nodemailer';

// Re-exports
export * from './PasswordUtility';
export * from './NotificationUtility';
export * from './CloudinaryUtility';

// Read envs (make sure Render has these set)
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// Basic environment sanity check
if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn('⚠️ GMAIL_USER or GMAIL_PASS is not set. Email sending will fail until set.');
}

/**
 * Nodemailer transporter configuration tuned for cloud hosts (e.g. Render)
 * - port 587 / TLS (STARTTLS) recommended
 * - family: 4 forces IPv4 (Render sometimes has IPv6 issues)
 * - longer timeouts so transient slowness doesn't immediately ETIMEDOUT
 * - greetingTimeout to ensure SMTP banner is received
 * - requireTLS ensures STARTTLS is used when available
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  requireTLS: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
  tls: {
    // Do NOT set rejectUnauthorized: false in production unless you know what you're doing.
    // If you still see TLS issues on Render, you can temporarily set rejectUnauthorized: false for debugging.
    rejectUnauthorized: true,
  },
  family: 4,
  connectionTimeout: 20000, // 20s
  greetingTimeout: 15000,   // wait for SMTP banner
  socketTimeout: 20000,
  logger: false,
  debug: false,
} as any);

/**
 * Verify transporter at startup (useful to fail fast / log detailed info)
 * Call transporter.verify() and log issues. If verify fails on Render, network or credentials are likely the issue.
 */
export const verifyTransporter = async () => {
  try {
    const ok = await transporter.verify();
    console.log('✅ Mail transporter verified (SMTP connection OK).');
    return ok;
  } catch (err) {
    console.error('❌ Mail transporter verification failed:', err);
    return false;
  }
};

/**
 * small exponential-backoff retry wrapper for sendMail
 */
async function sendWithRetry(mailOptions: nodemailer.SendMailOptions, attempts = 3) {
  let attempt = 0;
  let lastError: any = null;
  while (attempt < attempts) {
    try {
      attempt++;
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      lastError = err;
      console.warn(`Mail send attempt ${attempt} failed: ${err?.code || err?.message || err}.`);
      // If it's a permanent auth error, don't retry
      if (err && (err.code === 'EAUTH' || err.responseCode === 535 || err.responseCode === 534)) {
        throw err;
      }
      // small backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError;
}

/**
 * Send verification email with retries and improved error logging
 */
export const SendVerificationEmail = async (email: string, otp: number) => {
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"FoodieDelight" <${GMAIL_USER || 'no-reply@foodiedelight.com'}>`,
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

  try {
    const info = await sendWithRetry(mailOptions, 3);
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    // Provide richer log so you can diagnose on Render logs
    console.error('❌ Email Error (final):', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack?.split('\n')?.slice(0, 5).join('\n'),
    });
    return false;
  }
};

// Optional: helper to run verification from your app startup
export const testMailer = async () => {
  console.log('Testing mailer connection...');
  await verifyTransporter();
};

export default transporter;
