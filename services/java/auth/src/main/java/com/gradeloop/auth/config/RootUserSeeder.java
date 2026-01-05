package com.gradeloop.auth.config;

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

    @Value("${ROOT_ADMIN_EMAIL:root@gradeloop.com}")
    private String rootEmail;

    @Value("${ROOT_ADMIN_PASSWORD:password}")
    private String rootPassword;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (!userRepository.existsByEmail(rootEmail)) {
            User rootUser = User.builder()
                    .email(rootEmail)
                    .password(passwordEncoder.encode(rootPassword))
                    .role(Role.SYSTEM_ADMIN)
                    .adminLevel(AdminLevel.ROOT)
                    .isTemporaryPassword(false)
                    .build();

            userRepository.save(rootUser);
            System.out.println("Seeded Root User: " + rootEmail);
        }
    }
}
