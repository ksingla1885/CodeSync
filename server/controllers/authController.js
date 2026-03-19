const User = require('../models/User');
const emailService = require('../services/emailService');

// Request a verification code
exports.requestCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000); // 10 minutes

    let user = await User.findOne({ email });
    if (!user) {
      // Create user if they don't exist
      user = new User({ email, name: email.split('@')[0] });
    }

    user.verificationCode = code;
    user.verificationCodeExpires = expires;
    await user.save();

    // Send the email via Service
    await emailService.sendVerificationEmail(email, code);
    
    // Verification email sent
    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Email Send Error:', error);
    res.status(500).json({ error: 'Failed to send verification email. Please check your SMTP settings.' });
  }
};

// Verify the code and login/register
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Clear the code after successful verification
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Return user info. In a full app, you'd generate a JWT here.
    res.json({ 
      message: 'Login successful', 
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
