package com.gradeloop.auth.service;

import com.gradeloop.auth.dto.AuthResponse;
import com.gradeloop.auth.dto.LoginRequest;
import com.gradeloop.auth.model.Role;
import com.gradeloop.auth.model.User;
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
    // private final EmailService emailService; // To be implemented

    public AuthResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = servletRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        return AuthResponse.builder()
                .message("Login successful")
                .role(user.getRole().name())
                .token(session.getId())
                .build();
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

        // TODO: Send email with tempPassword
        System.out.println("Created Admin: " + email + ", Temp Password: " + tempPassword);
    }
}
