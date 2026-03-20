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

    const uploadLink = `https://justtapcapital.com/leads/${leadId}/documents`;

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

/**
 * Sends bank email using template with executive details
 */
async function sendBankEmail(templateData) {
    if (!transporter) {
        throw new Error('Email service not initialized.');
    }

    const {
        to,
        studentName,
        bankName,
        executiveName,
        executiveEmail,
        executiveMobile,
        templateType,
        customContent = '',
        companyName = 'Justap Capital'
    } = templateData;

    // Get template content based on type
    const templates = {
        'FIRST_CONTACT_EMAIL': {
            subject: `Greetings from ${bankName}`,
            body: `<p>Dear ${studentName},</p><p>Greetings from ${bankName}.</p><p>Your education loan application has been assigned to our team through ${companyName}. We will be assisting you with the loan process for your higher education.</p><p>Our executive will contact you shortly to discuss your profile and required documents.</p><p>In case you have any queries, feel free to reply to this email.</p><p>Best Regards,<br/>${executiveName}<br/>${bankName}<br/>${executiveMobile}</p>`
        },
        'DOCUMENTS_REQUIRED_EMAIL': {
            subject: 'Documents Required for Education Loan',
            body: `<p>Dear ${studentName},</p><p>Greetings from ${bankName}.</p><p>To proceed with your education loan application, we request you to kindly share the following documents:</p><ul><li>KYC documents</li><li>Academic documents</li><li>Admission letter</li><li>Income documents of co-applicant</li><li>Bank statements</li></ul><p>You may reply to this email with the required documents or share them via WhatsApp on ${executiveMobile}.</p><p>Early submission will help us process your loan faster.</p><p>Best Regards,<br/>${executiveName}<br/>${bankName}</p>`
        },
        'DOCUMENTS_RECEIVED_EMAIL': {
            subject: 'Documents Received',
            body: `<p>Dear ${studentName},</p><p>Greetings from ${bankName}.</p><p>This is to confirm that we have received your documents successfully.</p><p>Your profile is currently under review, and we will update you shortly regarding the next steps in the loan process.</p><p>Thank you for your cooperation.</p><p>Best Regards,<br/>${executiveName}<br/>${bankName}</p>`
        },
        'LOAN_SANCTIONED_EMAIL': {
            subject: 'Loan Sanctioned',
            body: `<p>Dear ${studentName},</p><p>Congratulations!</p><p>We are happy to inform you that your education loan has been approved by ${bankName}.</p><p>${customContent}</p><p>Our team will guide you through the remaining formalities.</p><p>Please feel free to contact us for any assistance.</p><p>Best Regards,<br/>${executiveName}<br/>${bankName}</p>`
        }
    };

    const template = templates[templateType];
    if (!template) {
        throw new Error(`Invalid template type: ${templateType}`);
    }

    const mailOptions = {
        from: `"${executiveName} - ${bankName}" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: template.subject,
        html: template.body,
        replyTo: executiveEmail
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Bank email sent: %s', info.messageId);
    return info;
}

module.exports = { init, sendDocumentUploadEmail, sendGenericEmail, sendBankEmail };