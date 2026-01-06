package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.DashboardResponse;
import com.gradeloop.ivas.service.VivaDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/viva")
@RequiredArgsConstructor
public class VivaDashboardController {

    private final VivaDashboardService dashboardService;

    @GetMapping("/assignments/{assignmentId}/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable UUID assignmentId,
            @RequestParam(defaultValue = "0") int totalStudents) {
        return ResponseEntity.ok(dashboardService.getDashboard(assignmentId, totalStudents));
    }
}
