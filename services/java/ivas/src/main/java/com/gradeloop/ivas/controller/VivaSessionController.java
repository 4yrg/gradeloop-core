package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.QuestionResponse;
import com.gradeloop.ivas.dto.SessionResponse;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.service.QuestionManagementService;
import com.gradeloop.ivas.service.VivaSessionService;
import lombok.Data;
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
    private final QuestionManagementService questionService;

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

    // ============== Question Management Endpoints ==============

    /**
     * Get next question for the session
     * Returns null when all questions have been asked
     */
    @GetMapping("/sessions/{sessionId}/questions/next")
    public ResponseEntity<QuestionResponse> getNextQuestion(@PathVariable UUID sessionId) {
        QuestionResponse question = questionService.getNextQuestion(sessionId);
        if (question == null) {
            return ResponseEntity.noContent().build(); // Signal end of questions
        }
        return ResponseEntity.ok(question);
    }

    /**
     * Submit answer to a question
     */
    @PostMapping("/sessions/{sessionId}/questions/{questionId}/answer")
    public ResponseEntity<Void> submitAnswer(
            @PathVariable UUID sessionId,
            @PathVariable UUID questionId,
            @RequestBody AnswerRequest request) {
        // For now, assign a simple score based on response length (demo scoring)
        double score = calculateDemoScore(request.getResponseText());
        questionService.recordResponse(sessionId, questionId, request.getResponseText(), score);
        return ResponseEntity.ok().build();
    }

    /**
     * Get all questions from a session (for review)
     */
    @GetMapping("/sessions/{sessionId}/questions")
    public ResponseEntity<List<QuestionResponse>> getSessionQuestions(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(questionService.getSessionQuestions(sessionId));
    }

    /**
     * Demo scoring logic - in production this would use AI/NLP
     * Scores based on response length and keyword presence
     */
    private double calculateDemoScore(String response) {
        if (response == null || response.trim().isEmpty()) {
            return 0.0;
        }
        
        // Base score on length (up to 50%)
        int words = response.split("\\s+").length;
        double lengthScore = Math.min(words / 20.0, 0.5);
        
        // Additional points for technical keywords
        String[] keywords = {"function", "algorithm", "complexity", "data structure", 
                           "recursion", "base case", "time", "space", "optimal"};
        long keywordCount = java.util.Arrays.stream(keywords)
                .filter(k -> response.toLowerCase().contains(k))
                .count();
        double keywordScore = Math.min(keywordCount / 10.0, 0.5);
        
        return Math.round((lengthScore + keywordScore) * 100.0) / 100.0; // Max 1.0
    }

    @Data
    private static class AnswerRequest {
        private String responseText;
    }
}
