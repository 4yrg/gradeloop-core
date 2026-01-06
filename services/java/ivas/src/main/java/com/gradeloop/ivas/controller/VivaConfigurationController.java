package com.gradeloop.ivas.controller;

import com.gradeloop.ivas.dto.ConfigurationResponse;
import com.gradeloop.ivas.dto.CreateConfigurationRequest;
import com.gradeloop.ivas.dto.UpdateConfigurationRequest;
import com.gradeloop.ivas.service.VivaConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/viva")
@RequiredArgsConstructor
public class VivaConfigurationController {

    private final VivaConfigurationService configurationService;

    @PostMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<ConfigurationResponse> createConfiguration(
            @PathVariable UUID assignmentId,
            @RequestBody CreateConfigurationRequest request) {
        request.setAssignmentId(assignmentId);
        return ResponseEntity.ok(
                ConfigurationResponse.fromEntity(configurationService.createConfiguration(request)));
    }

    @GetMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<ConfigurationResponse> getConfiguration(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(
                ConfigurationResponse.fromEntity(configurationService.getConfigurationByAssignmentId(assignmentId)));
    }

    @PutMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<ConfigurationResponse> updateConfiguration(
            @PathVariable UUID assignmentId,
            @RequestBody UpdateConfigurationRequest request) {
        return ResponseEntity.ok(
                ConfigurationResponse.fromEntity(configurationService.updateConfiguration(assignmentId, request)));
    }

    @DeleteMapping("/assignments/{assignmentId}/config")
    public ResponseEntity<Void> deleteConfiguration(@PathVariable UUID assignmentId) {
        configurationService.deleteConfiguration(assignmentId);
        return ResponseEntity.noContent().build();
    }
}
