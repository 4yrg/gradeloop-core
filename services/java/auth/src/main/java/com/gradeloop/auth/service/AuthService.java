package com.gradeloop.auth.service;

import com.gradeloop.auth.dto.AuthResponse;
import com.gradeloop.auth.dto.LoginRequest;
import com.gradeloop.auth.model.PasswordResetToken;
import com.gradeloop.auth.model.Role;
import com.gradeloop.auth.model.User;
import com.gradeloop.auth.repository.PasswordResetTokenRepository;
import com.gradeloop.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        System.out.println("Login info - Attempting login for: " + request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            HttpSession session = servletRequest.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            System.out.println("Login info - User found with role: " + user.getRole());

            return AuthResponse.builder()
                    .message("Login successful")
                    .role(user.getRole().name())
                    .token(session.getId())
                    .email(user.getEmail())
                    .build();
        } catch (Exception e) {
            System.out.println("Login info - Authentication failed: " + e.getMessage());
            // Check manually for debugging
            userRepository.findByEmail(request.getEmail()).ifPresentOrElse(
                    u -> System.out.println("Login info - Debug: Password match result: "
                            + passwordEncoder.matches(request.getPassword(), u.getPassword())),
                    () -> System.out.println("Login info - Debug: User not found"));
            throw e;
        }
    }

    public void createSystemAdmin(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists");
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(tempPassword))
                .role(Role.SYSTEM_ADMIN)
                .isTemporaryPassword(true)
                .build();

        userRepository.save(user);
        System.out.println("Created Admin: " + email + ", Temp Password: " + tempPassword);
    }

    public String debugVerify(String email, String rawPassword) {
        StringBuilder sb = new StringBuilder();
        sb.append("Debug info for: ").append(email).append("\n");

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return sb.append("User NOT FOUND in database.").toString();
        }

        User user = userOpt.get();
        sb.append("User FOUND. Role: ").append(user.getRole()).append("\n");
        sb.append("Stored Password Hash: ").append(user.getPassword()).append("\n");

        boolean match = passwordEncoder.matches(rawPassword, user.getPassword());
        sb.append("Password Match (").append(rawPassword).append(" vs Hash): ").append(match).append("\n");

        return sb.toString();
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }

        // Generate token
        String token = UUID.randomUUID().toString();
        // Hash token
        String tokenHash = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiryDate(java.time.LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        emailService.sendResetLink(email, token);
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        String tokenHash = org.apache.commons.codec.digest.DigestUtils.sha256Hex(token);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTemporaryPassword(false); // Reset temp password flag if it was set
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
