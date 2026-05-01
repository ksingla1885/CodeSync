const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');

// OTP flow (existing)
router.post('/request-code', auth.requestCode);
router.post('/verify-code',  auth.verifyCode);

// Password flow (new)
router.post('/register', auth.register);
router.post('/login',    auth.login);

module.exports = router;
