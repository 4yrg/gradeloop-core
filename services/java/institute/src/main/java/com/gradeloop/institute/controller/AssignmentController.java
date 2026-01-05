package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.*;
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

    // Questions Management
    @PostMapping("/{assignmentId}/questions")
    public ResponseEntity<QuestionResponse> addQuestion(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.ok(assignmentService.addQuestion(assignmentId, request));
    }

    @PutMapping("/{assignmentId}/questions/{questionId}")
    public ResponseEntity<QuestionResponse> updateQuestion(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @PathVariable UUID questionId,
            @RequestBody UpdateQuestionRequest request) {
        return ResponseEntity.ok(assignmentService.updateQuestion(assignmentId, questionId, request));
    }

    @DeleteMapping("/{assignmentId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @PathVariable UUID questionId) {
        assignmentService.deleteQuestion(assignmentId, questionId);
        return ResponseEntity.noContent().build();
    }

    // Test Cases Management
    @PostMapping("/{assignmentId}/questions/{questionId}/test-cases")
    public ResponseEntity<TestCaseResponse> addTestCase(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @PathVariable UUID questionId,
            @RequestBody CreateTestCaseRequest request) {
        return ResponseEntity.ok(assignmentService.addTestCase(assignmentId, questionId, request));
    }

    @PutMapping("/{assignmentId}/questions/{questionId}/test-cases/{testCaseId}")
    public ResponseEntity<TestCaseResponse> updateTestCase(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @PathVariable UUID questionId, @PathVariable UUID testCaseId,
            @RequestBody UpdateTestCaseRequest request) {
        return ResponseEntity.ok(assignmentService.updateTestCase(assignmentId, questionId, testCaseId, request));
    }

    @DeleteMapping("/{assignmentId}/questions/{questionId}/test-cases/{testCaseId}")
    public ResponseEntity<Void> deleteTestCase(@PathVariable UUID instituteId, @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @PathVariable UUID questionId, @PathVariable UUID testCaseId) {
        assignmentService.deleteTestCase(assignmentId, questionId, testCaseId);
        return ResponseEntity.noContent().build();
    }

    // Assignment Configuration
    @PatchMapping("/{assignmentId}/config")
    public ResponseEntity<Assignment> updateAssignmentConfig(@PathVariable UUID instituteId,
            @PathVariable UUID courseId,
            @PathVariable UUID assignmentId, @RequestBody UpdateAssignmentConfigRequest request) {
        return ResponseEntity.ok(assignmentService.updateAssignmentConfig(assignmentId, request));
    }
}
