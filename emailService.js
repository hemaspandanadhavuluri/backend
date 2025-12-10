const nodemailer = require('nodemailer');

/**
 * Creates a transporter object using SMTP for a real email service (e.g., Gmail).
 * It reads credentials from environment variables for security.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your preferred email service
    auth: {
        user: process.env.EMAIL_USER, // Your email address from .env file
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env file
    },
});

async function sendDocumentUploadEmail(studentEmail, studentName, leadId) {
    const uploadLink = `http://localhost:3000/leads/${leadId}/documents`;

    const mailOptions = {
        from: '"Justap Educational Loans" <support@justap.com>',
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
        from: '"Justap Educational Loans" <support@justap.com>',
        to: to,
        subject: subject,
        html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Generic email sent to ${to}: ${info.messageId}`);
}

module.exports = { sendDocumentUploadEmail, sendGenericEmail };