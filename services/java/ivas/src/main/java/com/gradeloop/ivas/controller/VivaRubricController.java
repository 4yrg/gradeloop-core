package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.CreateRubricRequest;
import com.gradeloop.ivas.dto.RubricResponse;
import com.gradeloop.ivas.dto.UpdateRubricRequest;
import com.gradeloop.ivas.service.VivaRubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/viva")
@RequiredArgsConstructor
public class VivaRubricController {

    private final VivaRubricService rubricService;

    @PostMapping("/assignments/{assignmentId}/rubric")
    public ResponseEntity<RubricResponse> createRubric(
            @PathVariable UUID assignmentId,
            @RequestBody CreateRubricRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        request.setAssignmentId(assignmentId);
        return ResponseEntity.ok(
                RubricResponse.fromEntity(rubricService.createRubric(request, userId)));
    }

    @GetMapping("/assignments/{assignmentId}/rubrics")
    public ResponseEntity<List<RubricResponse>> getRubrics(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(
                rubricService.getRubricsByAssignmentId(assignmentId).stream()
                        .map(RubricResponse::fromEntity)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/assignments/{assignmentId}/rubric")
    public ResponseEntity<RubricResponse> getActiveRubric(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(
                RubricResponse.fromEntity(rubricService.getActiveRubricByAssignmentId(assignmentId)));
    }

    @GetMapping("/rubrics/{rubricId}")
    public ResponseEntity<RubricResponse> getRubric(@PathVariable UUID rubricId) {
        return ResponseEntity.ok(
                RubricResponse.fromEntity(rubricService.getRubric(rubricId)));
    }

    @PutMapping("/rubrics/{rubricId}")
    public ResponseEntity<RubricResponse> updateRubric(
            @PathVariable UUID rubricId,
            @RequestBody UpdateRubricRequest request) {
        return ResponseEntity.ok(
                RubricResponse.fromEntity(rubricService.updateRubric(rubricId, request)));
    }

    @DeleteMapping("/rubrics/{rubricId}")
    public ResponseEntity<Void> deleteRubric(@PathVariable UUID rubricId) {
        rubricService.deleteRubric(rubricId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rubrics/{rubricId}/activate")
    public ResponseEntity<RubricResponse> activateRubric(@PathVariable UUID rubricId) {
        return ResponseEntity.ok(
                RubricResponse.fromEntity(rubricService.activateRubric(rubricId)));
    }
}
