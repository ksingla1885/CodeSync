const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:                    { type: String },
  email:                   { type: String, required: true, unique: true },
  password:                { type: String },               // bcrypt hash — optional (OTP users won't have it)
  verificationCode:        { type: String },
  verificationCodeExpires: { type: Date },
  createdAt:               { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
