package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.SubmissionResponse;
import com.gradeloop.institute.model.Submission;
import com.gradeloop.institute.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/submission-api")
public class SubmissionController {
    
    private final SubmissionService submissionService;

    /**
     * Submit an assignment
     * POST /api/submissions?studentId={studentId}&assignmentId={assignmentId}
     */
    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmissionResponse> submitAssignment(
            @RequestParam String studentId,
            @RequestParam UUID assignmentId,
            @RequestPart("file") MultipartFile file) {
        
        log.info("Received submission request for student: {} and assignment: {}", studentId, assignmentId);
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Submission submission = submissionService.submitAssignment(studentId, assignmentId, file);
        return ResponseEntity.ok(SubmissionResponse.fromEntity(submission));
    }

    /**
     * Get all submissions for a student
     * GET /api/students/{studentId}/submissions
     */
    @GetMapping("/students/{studentId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> getStudentSubmissions(@PathVariable String studentId) {
        List<Submission> submissions = submissionService.getStudentSubmissions(studentId);
        return ResponseEntity.ok(
                submissions.stream()
                        .map(SubmissionResponse::fromEntity)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Get all submissions for an assignment
     * GET /api/assignments/{assignmentId}/submissions
     */
    @GetMapping("/assignments/{assignmentId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> getAssignmentSubmissions(@PathVariable UUID assignmentId) {
        List<Submission> submissions = submissionService.getAssignmentSubmissions(assignmentId);
        return ResponseEntity.ok(
                submissions.stream()
                        .map(SubmissionResponse::fromEntity)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Get a specific submission by id
     * GET /api/submissions/{id}
     */
    @GetMapping("/submissions/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(@PathVariable UUID id) {
        Submission submission = submissionService.getSubmission(id);
        return ResponseEntity.ok(SubmissionResponse.fromEntity(submission));
    }

    /**
     * Download submission file
     * GET /api/submissions/{id}/download
     */
    @GetMapping("/submissions/{id}/download")
    public ResponseEntity<InputStreamResource> downloadSubmission(@PathVariable UUID id) {
        Submission submission = submissionService.getSubmission(id);
        InputStream fileStream = submissionService.downloadSubmissionFile(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + submission.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(submission.getContentType()))
                .body(new InputStreamResource(fileStream));
    }

    /**
     * Delete a submission
     * DELETE /api/submissions/{id}
     */
    @DeleteMapping("/submissions/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable UUID id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }
}

