package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CreateInstituteRequest;
import com.gradeloop.institute.dto.InstituteResponse;
import com.gradeloop.institute.dto.UpdateInstituteRequest;
import com.gradeloop.institute.service.InstituteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/institutes")
@RequiredArgsConstructor
public class InstituteController {

    private final InstituteService instituteService;

    @PostMapping
    public ResponseEntity<InstituteResponse> createInstitute(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            @RequestBody CreateInstituteRequest request) {
        Long userId = null;
        if (userIdStr != null) {
            try {
                userId = Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                // Ignore invalid user ID format, proceed with null or handle error
            }
        }
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.createInstitute(request, userId)));
    }

    @GetMapping
    public ResponseEntity<List<InstituteResponse>> getAllInstitutes() {
        return ResponseEntity.ok(
                instituteService.getAllInstitutes().stream()
                        .map(InstituteResponse::fromEntity)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstituteResponse> getInstitute(@PathVariable UUID id) {
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.getInstitute(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<InstituteResponse> updateInstitute(@PathVariable UUID id,
            @RequestBody UpdateInstituteRequest request) {
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.updateInstitute(id, request)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<InstituteResponse> deactivateInstitute(@PathVariable UUID id) {
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.deactivateInstitute(id)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<InstituteResponse> activateInstitute(@PathVariable UUID id) {
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.activateInstitute(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInstitute(@PathVariable UUID id) {
        instituteService.deleteInstitute(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<InstituteResponse> getInstituteByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(InstituteResponse.fromEntity(instituteService.getInstituteByUserId(userId)));
    }
}
