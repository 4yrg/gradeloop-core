package com.gradeloop.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    // In a real implementation, you would inject JavaMailSender here
    // private final JavaMailSender emailSender;

    public void sendResetLink(String email, String token) {
        // Construct the reset link
        // Assuming the frontend is running on localhost:3000 for now
        String resetLink = "http://localhost:3000/reset-password?token=" + token;

        // Log the email content (since we are mocking the actual sending for now)
        logger.info("==================================================");
        logger.info("Sending Password Reset Email to: {}", email);
        logger.info("Reset Link: {}", resetLink);
        logger.info("==================================================");

        // TODO: Implement actual email sending using JavaMailSender or an external provider (SendGrid, AWS SES)
    }
}
