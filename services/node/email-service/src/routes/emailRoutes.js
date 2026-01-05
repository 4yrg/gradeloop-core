const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

router.post('/send-email', emailController.sendEmail);

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'email-service' });
});

module.exports = router;
