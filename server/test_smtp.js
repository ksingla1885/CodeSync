require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Testing SMTP with:');
console.log('Email:', process.env.SMTP_EMAIL);
console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MISSING');

transporter.verify(function (error, success) {
  if (error) {
    console.log('Verification Error:', error);
  } else {
    console.log('Server is ready to take our messages');
    
    // Attempt to send a test email
    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: process.env.SMTP_EMAIL, // Send to self
        subject: 'Test Email from CodeSync',
        text: 'If you see this, your SMTP settings are correct!',
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Send Error:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
        process.exit();
    });
  }
});
