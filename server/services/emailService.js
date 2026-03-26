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
 * @param {string} type - 'login' or 'collaboration'
 * @param {Object} options - Extra details like { projectName, ownerName }
 */
exports.sendVerificationEmail = async (to, code, type = 'login', options = {}) => {
  const isCollab = type === 'collaboration';
  const { projectName = 'a project', ownerName = 'a user' } = options;
  const primaryColor = isCollab ? '#3b82f6' : '#8a2be2'; // Blue for collab, Purple for login
  const accentColor = isCollab ? '#60a5fa' : '#c084fc';
  const title = isCollab ? 'Collaboration Access' : 'Verification Code';
  const description = isCollab 
    ? `<b>${ownerName}</b> has invited you to collaborate on <b>${projectName}</b>. Enter this code to securely verify your access.`
    : 'Enter this code in your browser to securely sign in to your CodeSync workspace.';

  const mailOptions = {
    from: `"CodeSync" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: isCollab ? `Invite: ${code} is your collaboration code` : `${code} is your CodeSync verification code`,
    html: `
      <div style="background-color: #0d0d0d; padding: 60px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #141414; border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 48px; text-align: center;">
          <div style="width: 48px; height: 48px; background-color: ${primaryColor}; border-radius: 12px; margin: 0 auto 32px auto; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
             ${isCollab ? 'C' : 'S'}
          </div>
          <h1 style="color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px;">${title}</h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 16px; line-height: 1.6; margin-bottom: 40px;">${description}</p>
          
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; margin-bottom: 40px;">
            <span style="font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace; font-size: 48px; font-weight: 800; letter-spacing: 0.1em; color: ${primaryColor};">${code}</span>
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
