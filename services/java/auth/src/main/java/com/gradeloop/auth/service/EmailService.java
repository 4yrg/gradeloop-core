package com.gradeloop.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final AmqpTemplate rabbitTemplate;

    // Inject RabbitTemplate
    public EmailService(AmqpTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendResetLink(String email, String token) {
        String resetLink = "http://localhost:8000/reset-password?token=" + token;
        String subject = "Password Reset Request";
        String message = "Click the link to reset your password: " + resetLink;

        sendEmail(email, subject, message);
    }

    public void sendTempPassword(String email, String tempPassword) {
        String subject = "Welcome to GradeLoop - Your Temporary Password";
        String message = "Your account has been created. Your temporary password is: " + tempPassword
                + "\nPlease log in and change it immediately.";

        sendEmail(email, subject, message);
    }

    public void sendWelcomeLink(String email, String token) {
        String resetLink = "http://localhost:3000/reset-password?token=" + token; // Frontend URL
        String subject = "Welcome to GradeLoop - Setup Your Account";
        String message = "Welcome to GradeLoop!\n\n"
                + "Your account has been created. Please click the link below to set your password and access your account:\n"
                + resetLink + "\n\n"
                + "This link will expire in 24 hours.";

        sendEmail(email, subject, message);
    }

    private void sendEmail(String to, String subject, String text) {
        try {
            java.util.Map<String, String> payload = new java.util.HashMap<>();
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("text", text);

            // Convert to JSON
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String jsonPayload = mapper.writeValueAsString(payload);

            logger.info("Publishing email event for: {}", to);
            rabbitTemplate.convertAndSend("gradeloop.exchange", "email.send", jsonPayload);
        } catch (Exception e) {
            logger.error("Failed to publish email event for {}: {}", to, e.getMessage());
        }
    }
}
