package com.gradeloop.user.controller;

import com.gradeloop.user.model.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final com.gradeloop.user.repository.UserProfileRepository userProfileRepository;

    @GetMapping
    public ResponseEntity<java.util.List<UserProfile>> getUsers(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String email) {
        if (email != null) {
            return ResponseEntity
                    .ok(userProfileRepository.findByEmail(email).map(java.util.List::of).orElse(java.util.List.of()));
        }
        return ResponseEntity.ok(userProfileRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfile> getUserById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity
                .ok(userProfileRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found")));
    }
}
