package com.gradeloop.keystrokeanalytics.controller;

import com.gradeloop.keystrokeanalytics.dto.KeystrokeEventResponse;
import com.gradeloop.keystrokeanalytics.dto.PagedResponse;
import com.gradeloop.keystrokeanalytics.dto.StudentKeystrokeSummary;
import com.gradeloop.keystrokeanalytics.service.KeystrokeEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class KeystrokeAnalyticsController {

    private final KeystrokeEventService keystrokeEventService;

    /**
     * Get all keystroke events for a student on a specific assignment
     */
    @GetMapping("/student/{studentId}/assignment/{assignmentId}/events")
    public ResponseEntity<List<KeystrokeEventResponse>> getStudentAssignmentEvents(
            @PathVariable String studentId,
            @PathVariable String assignmentId) {
        log.info("Fetching keystroke events for student: {}, assignment: {}", studentId, assignmentId);
        List<KeystrokeEventResponse> events = keystrokeEventService.getStudentAssignmentEvents(studentId, assignmentId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get paginated keystroke events for a student on a specific assignment
     */
    @GetMapping("/student/{studentId}/assignment/{assignmentId}/events/paged")
    public ResponseEntity<PagedResponse<KeystrokeEventResponse>> getStudentAssignmentEventsPaged(
            @PathVariable String studentId,
            @PathVariable String assignmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching paginated keystroke events for student: {}, assignment: {}, page: {}, size: {}",
                studentId, assignmentId, page, size);
        PagedResponse<KeystrokeEventResponse> events = keystrokeEventService.getStudentAssignmentEventsPaged(
                studentId, assignmentId, page, size);
        return ResponseEntity.ok(events);
    }

    /**
     * Get summary statistics for a student on an assignment
     */
    @GetMapping("/student/{studentId}/assignment/{assignmentId}/summary")
    public ResponseEntity<StudentKeystrokeSummary> getStudentAssignmentSummary(
            @PathVariable String studentId,
            @PathVariable String assignmentId) {
        log.info("Fetching keystroke summary for student: {}, assignment: {}", studentId, assignmentId);
        StudentKeystrokeSummary summary = keystrokeEventService.getStudentAssignmentSummary(studentId, assignmentId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get all suspicious events for an assignment
     */
    @GetMapping("/assignment/{assignmentId}/suspicious")
    public ResponseEntity<List<KeystrokeEventResponse>> getSuspiciousEvents(
            @PathVariable String assignmentId) {
        log.info("Fetching suspicious events for assignment: {}", assignmentId);
        List<KeystrokeEventResponse> events = keystrokeEventService.getSuspiciousEvents(assignmentId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all keystroke events for a course
     */
    @GetMapping("/course/{courseId}/events")
    public ResponseEntity<List<KeystrokeEventResponse>> getCourseEvents(
            @PathVariable String courseId) {
        log.info("Fetching keystroke events for course: {}", courseId);
        List<KeystrokeEventResponse> events = keystrokeEventService.getCourseEvents(courseId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all keystroke events for an assignment
     */
    @GetMapping("/assignment/{assignmentId}/events")
    public ResponseEntity<List<KeystrokeEventResponse>> getAssignmentEvents(
            @PathVariable String assignmentId) {
        log.info("Fetching all keystroke events for assignment: {}", assignmentId);
        List<KeystrokeEventResponse> events = keystrokeEventService.getAssignmentEvents(assignmentId);
        return ResponseEntity.ok(events);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Analytics Service is running");
    }
}
