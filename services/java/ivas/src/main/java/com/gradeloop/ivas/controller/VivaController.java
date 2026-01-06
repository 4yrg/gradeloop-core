package com.gradeloop.ivas.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/viva")
public class VivaController {

    // Placeholder endpoints - will be implemented in Step 3

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> startSession(@RequestBody Map<String, String> request) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "sessionId", UUID.randomUUID().toString(),
                "status", "NOT_IMPLEMENTED"
        ));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSession(@PathVariable String sessionId) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "status", "NOT_IMPLEMENTED"
        ));
    }

    @GetMapping("/assignments/{assignmentId}/sessions")
    public ResponseEntity<Map<String, Object>> listSessions(@PathVariable String assignmentId) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "assignmentId", assignmentId,
                "sessions", java.util.Collections.emptyList(),
                "status", "NOT_IMPLEMENTED"
        ));
    }

    @GetMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<Map<String, Object>> getConfig(@PathVariable String assignmentId) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "assignmentId", assignmentId,
                "enabled", true,
                "status", "NOT_IMPLEMENTED"
        ));
    }

    @GetMapping("/assignments/{assignmentId}/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @PathVariable String assignmentId,
            @RequestParam(defaultValue = "0") int totalStudents) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "assignmentId", assignmentId,
                "totalStudents", totalStudents,
                "status", "NOT_IMPLEMENTED"
        ));
    }

    @PutMapping("/sessions/{sessionId}/end")
    public ResponseEntity<Map<String, Object>> endSession(@PathVariable String sessionId) {
        // TODO: Implement in Step 3
        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "ended", true,
                "status", "NOT_IMPLEMENTED"
        ));
    }
}
