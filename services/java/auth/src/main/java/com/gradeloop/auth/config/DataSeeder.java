package com.gradeloop.auth.config;

import com.gradeloop.auth.model.Role;
import com.gradeloop.auth.model.User;
import com.gradeloop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            User admin = User.builder()
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.SYSTEM_ADMIN)
                    .isTemporaryPassword(false)
                    .build();
            userRepository.save(admin);
            System.out.println("Seeded default admin user.");
        }
    }
}
