const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const email   = require('../services/emailService');

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeUser = (u) => ({ _id: u._id, email: u.email, name: u.name });

const checkDB = () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1)
    throw new Error('Database not connected. Check MONGODB_URI.');
};

// ─── OTP: request code ────────────────────────────────────────────────────────
exports.requestCode = async (req, res) => {
  try {
    checkDB();
    const { email: addr, type = 'login', projectName, ownerName } = req.body;
    if (!addr) return res.status(400).json({ error: 'Email is required' });

    const code    = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60_000);

    let user = await User.findOne({ email: addr });
    if (!user) user = new User({ email: addr, name: addr.split('@')[0] });

    user.verificationCode        = code;
    user.verificationCodeExpires = expires;
    await user.save();

    await email.sendVerificationEmail(addr, code, type, { projectName, ownerName });
    res.json({ message: 'Verification code sent' });
  } catch (err) {
    console.error('[AUTH] requestCode error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── OTP: verify code ─────────────────────────────────────────────────────────
exports.verifyCode = async (req, res) => {
  try {
    const { email: addr, code, name } = req.body;
    if (!addr || !code) return res.status(400).json({ error: 'Email and code are required' });

    const user = await User.findOne({ email: addr });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.verificationCode !== code)
      return res.status(400).json({ error: 'Invalid verification code' });
    if (new Date() > user.verificationCodeExpires)
      return res.status(400).json({ error: 'Code expired. Request a new one.' });

    // Persist name if provided and not already set
    if (name && !user.name) user.name = name;
    user.verificationCode        = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Login successful', user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Password: register (OTP-verified) ───────────────────────────────────────
// Flow: client sends OTP first via /request-code, then calls this with the code.
exports.register = async (req, res) => {
  try {
    checkDB();
    const { name, email: addr, password, code } = req.body;
    if (!name || !addr || !password || !code)
      return res.status(400).json({ error: 'Name, email, password and verification code are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Verify OTP
    const user = await User.findOne({ email: addr });
    if (!user)
      return res.status(404).json({ error: 'No verification code found for this email. Request one first.' });
    if (user.verificationCode !== code)
      return res.status(400).json({ error: 'Invalid verification code' });
    if (new Date() > user.verificationCodeExpires)
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    if (user.password)
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

    // OTP valid — hash password and save
    user.name                    = name;
    user.password                = await bcrypt.hash(password, 12);
    user.verificationCode        = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(201).json({ message: 'Account created', user: safeUser(user) });
  } catch (err) {
    console.error('[AUTH] register error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── Password: login ──────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    checkDB();
    const { email: addr, password } = req.body;
    if (!addr || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: addr });
    if (!user || !user.password)
      return res.status(401).json({ error: 'No password account found. Try signing in with a code.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Incorrect password' });

    res.json({ message: 'Login successful', user: safeUser(user) });
  } catch (err) {
    console.error('[AUTH] login error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
