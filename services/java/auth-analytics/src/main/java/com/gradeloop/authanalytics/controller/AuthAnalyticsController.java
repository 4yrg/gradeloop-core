package com.gradeloop.authanalytics.controller;

import com.gradeloop.authanalytics.dto.AuthEventResponse;
import com.gradeloop.authanalytics.dto.StudentAuthSummary;
import com.gradeloop.authanalytics.service.AuthEventService;
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
public class AuthAnalyticsController {

    private final AuthEventService authEventService;

    /**
     * Get all auth events for a student on a specific assignment
     */
    @GetMapping("/student/{studentId}/assignment/{assignmentId}/events")
    public ResponseEntity<List<AuthEventResponse>> getStudentAssignmentEvents(
            @PathVariable String studentId,
            @PathVariable String assignmentId) {
        log.info("Fetching auth events for student: {}, assignment: {}", studentId, assignmentId);
        List<AuthEventResponse> events = authEventService.getStudentAssignmentEvents(studentId, assignmentId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get summary statistics for a student on an assignment
     */
    @GetMapping("/student/{studentId}/assignment/{assignmentId}/summary")
    public ResponseEntity<StudentAuthSummary> getStudentAssignmentSummary(
            @PathVariable String studentId,
            @PathVariable String assignmentId) {
        log.info("Fetching auth summary for student: {}, assignment: {}", studentId, assignmentId);
        StudentAuthSummary summary = authEventService.getStudentAssignmentSummary(studentId, assignmentId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get all suspicious events for an assignment
     */
    @GetMapping("/assignment/{assignmentId}/suspicious")
    public ResponseEntity<List<AuthEventResponse>> getSuspiciousEvents(
            @PathVariable String assignmentId) {
        log.info("Fetching suspicious events for assignment: {}", assignmentId);
        List<AuthEventResponse> events = authEventService.getSuspiciousEvents(assignmentId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all auth events for a course
     */
    @GetMapping("/course/{courseId}/events")
    public ResponseEntity<List<AuthEventResponse>> getCourseEvents(
            @PathVariable String courseId) {
        log.info("Fetching auth events for course: {}", courseId);
        List<AuthEventResponse> events = authEventService.getCourseEvents(courseId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all auth events for an assignment
     */
    @GetMapping("/assignment/{assignmentId}/events")
    public ResponseEntity<List<AuthEventResponse>> getAssignmentEvents(
            @PathVariable String assignmentId) {
        log.info("Fetching all auth events for assignment: {}", assignmentId);
        List<AuthEventResponse> events = authEventService.getAssignmentEvents(assignmentId);
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
