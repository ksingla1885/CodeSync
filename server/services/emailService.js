const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Check configuration
if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
  console.warn('WARNING: SMTP credentials are not fully configured. Verification emails will fail.');
}

/**
 * Sends a premium verification email with a 6-digit code.
 * @param {string} to - Recipient email address
 * @param {string} code - The 6-digit verification code
 */
exports.sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `"CodeSync" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `${code} is your CodeSync verification code`,
    html: `
      <div style="background-color: #0d0d0d; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #141414; border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 48px; text-align: center;">
          <div style="width: 48px; height: 48px; background-color: #8a2be2; border-radius: 12px; margin: 0 auto 32px auto; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
             S
          </div>
          <h1 style="color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px;">Verification Code</h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 16px; line-height: 1.6; margin-bottom: 40px;">Enter this code in your browser to securely sign in to your CodeSync workspace.</p>
          
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; margin-bottom: 40px;">
            <span style="font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; font-size: 48px; font-weight: 800; letter-spacing: 0.1em; color: #8a2be2;">${code}</span>
          </div>
          
          <p style="color: rgba(255,255,255,0.2); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Code expires in 10 minutes</p>
          
          <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.05);">
             <p style="color: rgba(255,255,255,0.3); font-size: 13px; margin: 0;">If you didn't request this, you can ignore this email.</p>
             <p style="color: rgba(255,255,255,0.1); font-size: 11px; margin-top: 12px;">© 2026 CodeSync. Built with Antigravity.</p>
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
