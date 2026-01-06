package com.gradeloop.auth.config;

import com.gradeloop.auth.service.AuthService;
import com.gradeloop.auth.service.EmailService;

import com.gradeloop.auth.model.AdminLevel;
import com.gradeloop.auth.model.Role;
import com.gradeloop.auth.model.User;
import com.gradeloop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RootUserSeeder implements ApplicationListener<ApplicationReadyEvent> {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthService authService;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String email = "dasun.wickr@gmail.com";
        String name = "Dasun GradeLoop ROOT"; // Where to store name? Auth Service User doesn't have name (removed in
                                              // prompt requirements? "User Service: ... firstName, lastName ...").
        // "Root Admin Seed: Email: ..., Name: ...". Name should be in User Service.
        // But Seeder is in Auth Service.
        // Auth Service cannot easily seed User Service unless it calls it.
        // I will focus on Auth User seeding first.

        if (!userRepository.existsByEmail(email)) {
            String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
            User rootUser = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(tempPassword))
                    .tempPassword(tempPassword) // Store plain temp password as requested/implied
                    .role(Role.SYSTEM_ADMIN)
                    .adminLevel(AdminLevel.ROOT)
                    .isTemporaryPassword(true) // Force reset
                    .build();

            userRepository.save(rootUser);
            System.out.println("Seeded Root User: " + email);
            System.out.println("Temp Password: " + tempPassword);
            System.out.println("Please login and reset your password.");

            try {
                authService.sendWelcomeReset(email);
                System.out.println("Sent Welcome Reset Link to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send seed email: " + e.getMessage());
            }
        }
    }
}
