const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure nodemailer with app password
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    secure: true, // use SSL
    // IMPORTANT: If you're using Gmail, you need to use an "App Password" if you have 2-Step Verification enabled.
    // 1. Go to your Google Account: https://myaccount.google.com/
    // 2. Go to "Security"
    // 3. Under "Signing in to Google", select "App passwords" (you might need to sign in again).
    // 4. Generate a new app password for "Mail" on "Windows Computer".
    // 5. Use the generated 16-digit password as your EMAIL_PASS in the .env file.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = transporter;
