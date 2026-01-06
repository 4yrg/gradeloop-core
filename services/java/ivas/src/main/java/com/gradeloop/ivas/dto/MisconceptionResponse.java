package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaMisconception;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MisconceptionResponse {
    private UUID id;
    private String misconceptionText;
    private List<String> detectionKeywords;
    private String correction;
    private String resourceUrl;
    private VivaMisconception.Severity severity;
    private LocalDateTime createdAt;
    
    public static MisconceptionResponse fromEntity(VivaMisconception misconception) {
        return MisconceptionResponse.builder()
                .id(misconception.getId())
                .misconceptionText(misconception.getMisconceptionText())
                .detectionKeywords(misconception.getDetectionKeywords())
                .correction(misconception.getCorrection())
                .resourceUrl(misconception.getResourceUrl())
                .severity(misconception.getSeverity())
                .createdAt(misconception.getCreatedAt())
                .build();
    }
}
