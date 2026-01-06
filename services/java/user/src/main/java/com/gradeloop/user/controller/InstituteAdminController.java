package com.gradeloop.user.controller;

import com.gradeloop.user.model.InstituteAdmin;
import com.gradeloop.user.repository.InstituteAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/institute-admins")
@RequiredArgsConstructor
public class InstituteAdminController {

    private final InstituteAdminRepository instituteAdminRepository;

    @GetMapping("/by-email/{email}")
    public ResponseEntity<InstituteAdmin> getByEmail(@PathVariable String email) {
        return instituteAdminRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-auth-user-id/{authUserId}")
    public ResponseEntity<InstituteAdmin> getByAuthUserId(@PathVariable Long authUserId) {
        return instituteAdminRepository.findByAuthUserId(authUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InstituteAdmin> createInstituteAdmin(@RequestBody InstituteAdmin instituteAdmin) {
        // Check if already exists
        if (instituteAdminRepository.findByAuthUserId(instituteAdmin.getAuthUserId()).isPresent()) {
            return ResponseEntity.ok(instituteAdminRepository.findByAuthUserId(instituteAdmin.getAuthUserId()).get());
        }
        InstituteAdmin saved = instituteAdminRepository.save(instituteAdmin);
        return ResponseEntity.ok(saved);
    }
}
