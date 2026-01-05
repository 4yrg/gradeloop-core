package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CreateAssignmentRequest;
import com.gradeloop.institute.model.Assignment;
import com.gradeloop.institute.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/institutes/{instituteId}/courses/{courseId}/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<Assignment> createAssignment(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @RequestBody CreateAssignmentRequest request) {
        // instituteId could be verified here or in service if needed to ensure course
        // belongs to institute
        return ResponseEntity.ok(assignmentService.createAssignmentDraft(courseId, request));
    }
}
