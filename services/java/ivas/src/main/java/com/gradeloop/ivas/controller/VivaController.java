package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.request.EndVivaRequest;
import com.gradeloop.ivas.dto.request.StartVivaRequest;
import com.gradeloop.ivas.dto.response.DashboardResponse;
import com.gradeloop.ivas.dto.response.SessionListResponse;
import com.gradeloop.ivas.dto.response.VivaConfigResponse;
import com.gradeloop.ivas.dto.response.VivaSessionResponse;
import com.gradeloop.ivas.model.SessionStatus;
import com.gradeloop.ivas.service.VivaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/viva")
public class VivaController {

    private final VivaService vivaService;

    public VivaController(VivaService vivaService) {
        this.vivaService = vivaService;
    }

    /**
     * Start a new viva session.
     * POST /api/v1/viva/sessions
     */
    @PostMapping("/sessions")
    public ResponseEntity<VivaSessionResponse> startSession(@Valid @RequestBody StartVivaRequest request) {
        VivaSessionResponse response = vivaService.startSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get session details by ID.
     * GET /api/v1/viva/sessions/{sessionId}
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<VivaSessionResponse> getSession(@PathVariable UUID sessionId) {
        VivaSessionResponse response = vivaService.getSession(sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * List sessions for an assignment.
     * GET /api/v1/viva/assignments/{assignmentId}/sessions
     */
    @GetMapping("/assignments/{assignmentId}/sessions")
    public ResponseEntity<SessionListResponse> listSessions(
            @PathVariable String assignmentId,
            @RequestParam(required = false) SessionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("asc") 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        SessionListResponse response = vivaService.listSessions(assignmentId, status, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Get viva configuration for an assignment.
     * GET /api/v1/viva/assignments/{assignmentId}/config
     */
    @GetMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<VivaConfigResponse> getConfig(@PathVariable String assignmentId) {
        VivaConfigResponse response = vivaService.getConfig(assignmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get instructor dashboard data for an assignment.
     * GET /api/v1/viva/assignments/{assignmentId}/dashboard
     */
    @GetMapping("/assignments/{assignmentId}/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable String assignmentId,
            @RequestParam(defaultValue = "0") int totalStudents) {
        DashboardResponse response = vivaService.getDashboard(assignmentId, totalStudents);
        return ResponseEntity.ok(response);
    }

    /**
     * End a viva session.
     * PUT /api/v1/viva/sessions/{sessionId}/end
     */
    @PutMapping("/sessions/{sessionId}/end")
    public ResponseEntity<VivaSessionResponse> endSession(
            @PathVariable UUID sessionId,
            @RequestBody(required = false) EndVivaRequest request) {
        VivaSessionResponse response = vivaService.endSession(sessionId, request);
        return ResponseEntity.ok(response);
    }
}
