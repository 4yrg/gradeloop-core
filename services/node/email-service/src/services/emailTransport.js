const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"GradeLoop System" <system@gradeloop.com>',
            to,
            subject,
            text,
            html, // optional HTML body
        });

        logger.info(`Message sent: ${info.messageId}`);

        // Preview only available when sending through an Ethereal account
        if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('ethereal')) {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return info;
    } catch (error) {
        logger.error('Error sending email', { error: error.message });
        throw error;
    }
};

module.exports = {
    sendEmail,
};
