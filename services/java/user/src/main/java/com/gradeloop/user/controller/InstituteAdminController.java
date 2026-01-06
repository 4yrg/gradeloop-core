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
}
