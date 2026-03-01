const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();


let transporter;
async function init() {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials (EMAIL_USER and EMAIL_PASS) must be set as environment variables.');
    }

    transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
             user: process.env.EMAIL_USER,
             pass: process.env.EMAIL_PASS
        },
    });
    
    // Verify connection configuration (optional, but good practice)
    await transporter.verify();
    
    console.log('✅ Email service initialized and ready to send real emails.');
}

/**
 * Sends a structured email prompting a student to upload documents.
 */
async function sendDocumentUploadEmail(studentEmail, studentName, leadId) {
    if (!transporter) {
        throw new Error('Email service not initialized.');
    }

    const uploadLink = `http://localhost:3000/leads/${leadId}/documents`;

    const mailOptions = {
        // Use the authenticated user's email as the 'from' address for consistency
        from: `"${"Justap Educational Loans"}" <${process.env.EMAIL_USER}>`, 
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
    console.log('Message sent: %s', info.messageId);
    // REMOVE: nodemailer.getTestMessageUrl(info) as it's not relevant for real emails
    // The email is now sent to the real recipient's inbox.
}

/**
 * Sends a generic email with a customizable subject and HTML body.
 */
async function sendGenericEmail(to, subject, htmlBody) {
    if (!transporter) {
        throw new Error('Email service not initialized.');
    }

    const mailOptions = {
        from: `"${"Justap Educational Loans"}" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // The email is now sent to the real recipient's inbox.
}

module.exports = { init, sendDocumentUploadEmail, sendGenericEmail };