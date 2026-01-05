package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CreateSemesterRequest;
import com.gradeloop.institute.dto.SemesterResponse;
import com.gradeloop.institute.dto.UpdateSemesterRequest;
import com.gradeloop.institute.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    public ResponseEntity<SemesterResponse> createSemester(@RequestBody CreateSemesterRequest request) {
        return new ResponseEntity<>(semesterService.createSemester(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SemesterResponse>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAllSemesters());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponse> getSemesterById(@PathVariable UUID id) {
        return ResponseEntity.ok(semesterService.getSemesterById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponse> updateSemester(@PathVariable UUID id,
            @RequestBody UpdateSemesterRequest request) {
        return ResponseEntity.ok(semesterService.updateSemester(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSemester(@PathVariable UUID id) {
        semesterService.deleteSemester(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<SemesterResponse> activateSemester(@PathVariable UUID id) {
        return ResponseEntity.ok(semesterService.activateSemester(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<SemesterResponse> deactivateSemester(@PathVariable UUID id) {
        return ResponseEntity.ok(semesterService.deactivateSemester(id));
    }
}
