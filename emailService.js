const nodemailer = require('nodemailer');

/**
 * Creates a transporter object using SMTP for a real email service (e.g., Gmail).
 * It reads credentials from environment variables for security.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER, // Your email address from .env file
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env file
    },
    debug: false,
    logger: false,
    tls: {
        rejectUnauthorized: false
    }
});

async function sendOTPEmail(email, otp) {
    if (!email) {
        console.error('❌ Error: No recipient email provided to sendOTPEmail');
        throw new Error('Recipient email is required');
    }

    const mailOptions = {
        from: `"Justap Capital" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code - Justap Capital',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 10px;">
                <h2 style="color: #007bff; text-align: center; margin-bottom: 20px;">Verification Code</h2>
                <p style="font-size: 16px; color: #555;">Dear User,</p>
                <p style="font-size: 16px; color: #555;">To complete your login or registration process at Justap Capital, please use the following one-time password (OTP):</p>
                <div style="text-align: center; margin: 35px 0;">
                    <span style="font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #222; background-color: #f9f9f9; padding: 15px 30px; border-radius: 6px; border: 1px dashed #007bff; display: inline-block;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #777;">This code is valid for <strong>10 minutes</strong>. For your security, please do not share this code with anyone.</p>
                <p style="font-size: 14px; color: #777;">If you did not request this code, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 14px; color: #555; text-align: center; margin-bottom: 0;">Best regards,<br/><strong>The Justap Team</strong></p>
            </div>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}: ${info.messageId}`);
    return info;
}

async function sendDocumentUploadEmail(studentEmail, studentName, leadId) {
    const uploadLink = `https://justtapcapital.com/leads/${leadId}/documents`;

    const mailOptions = {
        from: `"Justap Educational Loans" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Action Required: Upload Your Documents for Loan Application`,
        html: `
            <p>Dear ${studentName},</p>
            <p>Thank you for choosing Justap. To proceed with your educational loan application, please upload the required documents using the secure link below:</p>
            <p><a href="${uploadLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Upload Documents</a></p>
            <p>If the button does not work, you can copy and paste this link into your browser: ${uploadLink}</p>
            <p>Thank you,<br/>The Justap Team</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Document upload email sent to ${studentEmail}: ${info.messageId}`);
}

async function sendGenericEmail(to, subject, htmlBody) {
    const mailOptions = {
        from: `"Justap Educational Loans" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Generic email sent to ${to}: ${info.messageId}`);
}

module.exports = { sendOTPEmail, sendDocumentUploadEmail, sendGenericEmail };