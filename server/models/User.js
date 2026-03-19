const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Optional name initially
  email: { type: String, required: true, unique: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
