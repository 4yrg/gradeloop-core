const Joi = require('joi');
const emailTransport = require('../services/emailTransport');
const logger = require('../config/logger');

const sendEmailSchema = Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    text: Joi.string().required(),
    html: Joi.string().optional(),
});

const sendEmail = async (req, res) => {
    // Validate request body
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error) {
        logger.warn('Validation error', { details: error.details });
        return res.status(400).json({ error: 'Validation Error', details: error.details[0].message });
    }

    const { to, subject, text, html } = value;

    try {
        const info = await emailTransport.sendEmail(to, subject, text, html);
        res.status(200).json({
            message: 'Email sent successfully',
            messageId: info.messageId,
            preview: process.env.SMTP_HOST && process.env.SMTP_HOST.includes('ethereal') ? require('nodemailer').getTestMessageUrl(info) : undefined
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
};

module.exports = {
    sendEmail,
};
