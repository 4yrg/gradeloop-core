package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CreateInstituteRequest;
import com.gradeloop.institute.dto.UpdateInstituteRequest;
import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.service.InstituteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/institutes")
@RequiredArgsConstructor
public class InstituteController {

    private final InstituteService instituteService;

    @PostMapping
    public ResponseEntity<Institute> createInstitute(@RequestBody CreateInstituteRequest request) {
        return ResponseEntity.ok(instituteService.createInstitute(request));
    }

    @GetMapping
    public ResponseEntity<List<Institute>> getAllInstitutes() {
        return ResponseEntity.ok(instituteService.getAllInstitutes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Institute> getInstitute(@PathVariable UUID id) {
        return ResponseEntity.ok(instituteService.getInstitute(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Institute> updateInstitute(@PathVariable UUID id,
            @RequestBody UpdateInstituteRequest request) {
        return ResponseEntity.ok(instituteService.updateInstitute(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInstitute(@PathVariable UUID id) {
        instituteService.deleteInstitute(id);
        return ResponseEntity.noContent().build();
    }
}
