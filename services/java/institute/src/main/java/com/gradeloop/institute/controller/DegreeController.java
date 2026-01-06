package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CreateDegreeRequest;
import com.gradeloop.institute.dto.CourseResponse;
import com.gradeloop.institute.dto.DegreeResponse;
import com.gradeloop.institute.dto.UpdateDegreeRequest;
import com.gradeloop.institute.service.DegreeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class DegreeController {

    private final DegreeService degreeService;

    @PostMapping("/institutes/{instituteId}/degrees")
    public ResponseEntity<DegreeResponse> createDegree(@PathVariable UUID instituteId,
            @RequestBody CreateDegreeRequest request) {
        return ResponseEntity.ok(DegreeResponse.fromEntity(degreeService.createDegree(instituteId, request)));
    }

    @GetMapping("/institutes/{instituteId}/degrees")
    public ResponseEntity<List<DegreeResponse>> getAllDegrees(@PathVariable UUID instituteId) {
        return ResponseEntity.ok(degreeService.getAllDegrees(instituteId).stream()
                .map(DegreeResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @GetMapping("/degrees/{id}")
    public ResponseEntity<DegreeResponse> getDegree(@PathVariable UUID id) {
        return ResponseEntity.ok(DegreeResponse.fromEntity(degreeService.getDegree(id)));
    }

    @PatchMapping("/degrees/{id}")
    public ResponseEntity<DegreeResponse> updateDegree(@PathVariable UUID id,
            @RequestBody UpdateDegreeRequest request) {
        return ResponseEntity.ok(DegreeResponse.fromEntity(degreeService.updateDegree(id, request)));
    }

    @DeleteMapping("/degrees/{id}")
    public ResponseEntity<Void> deleteDegree(@PathVariable UUID id) {
        degreeService.deleteDegree(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/degrees/{id}/courses/{courseId}")
    public ResponseEntity<Void> addCourseToDegree(@PathVariable UUID id, @PathVariable UUID courseId) {
        degreeService.addCourseToDegree(id, courseId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/degrees/{id}/courses/{courseId}")
    public ResponseEntity<Void> removeCourseFromDegree(@PathVariable UUID id, @PathVariable UUID courseId) {
        degreeService.removeCourseFromDegree(id, courseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/degrees/{id}/courses")
    public ResponseEntity<List<CourseResponse>> getCoursesForDegree(@PathVariable UUID id) {
        return ResponseEntity.ok(degreeService.getCoursesForDegree(id).stream()
                .map(CourseResponse::fromEntity)
                .collect(Collectors.toList()));
    }
}
