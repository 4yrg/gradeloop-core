package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.SessionResponse;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.service.VivaSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/viva")
@RequiredArgsConstructor
public class VivaSessionController {

    private final VivaSessionService sessionService;

    @PostMapping("/sessions/start")
    public ResponseEntity<SessionResponse> startSession(
            @RequestParam UUID assignmentId,
            @RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(
                SessionResponse.fromEntity(sessionService.startSession(assignmentId, studentId)));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(
                SessionResponse.fromEntity(sessionService.getSession(sessionId)));
    }

    @GetMapping("/assignments/{assignmentId}/sessions")
    public ResponseEntity<Page<SessionResponse>> getSessionsByAssignment(
            @PathVariable UUID assignmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Page<VivaSession> sessions = sessionService.getSessionsByAssignment(
                assignmentId, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(sessions.map(SessionResponse::fromEntity));
    }

    @GetMapping("/assignments/{assignmentId}/students/{studentId}/sessions")
    public ResponseEntity<List<SessionResponse>> getStudentSessions(
            @PathVariable UUID assignmentId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(
                sessionService.getSessionsByStudentAndAssignment(studentId, assignmentId).stream()
                        .map(SessionResponse::fromEntity)
                        .collect(Collectors.toList()));
    }

    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<SessionResponse> endSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(
                SessionResponse.fromEntity(sessionService.endSession(sessionId)));
    }

    @PostMapping("/sessions/{sessionId}/flag")
    public ResponseEntity<SessionResponse> flagSession(
            @PathVariable UUID sessionId,
            @RequestParam String reason) {
        return ResponseEntity.ok(
                SessionResponse.fromEntity(sessionService.flagSession(sessionId, reason)));
    }

    @PostMapping("/sessions/{sessionId}/review")
    public ResponseEntity<SessionResponse> reviewSession(
            @PathVariable UUID sessionId,
            @RequestHeader("X-User-Id") Long reviewerId,
            @RequestParam(required = false) String feedback,
            @RequestParam(required = false) Double scoreOverride,
            @RequestParam(required = false) String overrideReason) {
        return ResponseEntity.ok(
                SessionResponse.fromEntity(
                        sessionService.reviewSession(sessionId, reviewerId, feedback, scoreOverride, overrideReason)));
    }

    @GetMapping("/assignments/{assignmentId}/sessions/flagged")
    public ResponseEntity<List<SessionResponse>> getFlaggedSessions(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(
                sessionService.getFlaggedSessions(assignmentId).stream()
                        .map(SessionResponse::fromEntity)
                        .collect(Collectors.toList()));
    }
}
