package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaRubric;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RubricResponse {
    private UUID id;
    private UUID assignmentId;
    private String name;
    private String description;
    private String version;
    private VivaRubric.RubricStatus status;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Builder.Default
    private List<ConceptResponse> concepts = new ArrayList<>();
    
    public static RubricResponse fromEntity(VivaRubric rubric) {
        return RubricResponse.builder()
                .id(rubric.getId())
                .assignmentId(rubric.getAssignmentId())
                .name(rubric.getName())
                .description(rubric.getDescription())
                .version(rubric.getVersion())
                .status(rubric.getStatus())
                .createdBy(rubric.getCreatedBy())
                .createdAt(rubric.getCreatedAt())
                .updatedAt(rubric.getUpdatedAt())
                .concepts(rubric.getConcepts() != null 
                        ? rubric.getConcepts().stream()
                                .map(ConceptResponse::fromEntity)
                                .collect(Collectors.toList())
                        : new ArrayList<>())
                .build();
    }
}
