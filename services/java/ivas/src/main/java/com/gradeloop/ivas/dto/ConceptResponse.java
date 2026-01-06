package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaConcept;
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
public class ConceptResponse {
    private UUID id;
    private String name;
    private String description;
    private Integer weight;
    private Integer displayOrder;
    private List<String> subConcepts;
    private String relatedCode;
    private List<String> keywords;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Builder.Default
    private List<QuestionTemplateResponse> questionTemplates = new ArrayList<>();
    
    @Builder.Default
    private List<MisconceptionResponse> misconceptions = new ArrayList<>();
    
    public static ConceptResponse fromEntity(VivaConcept concept) {
        return ConceptResponse.builder()
                .id(concept.getId())
                .name(concept.getName())
                .description(concept.getDescription())
                .weight(concept.getWeight())
                .displayOrder(concept.getDisplayOrder())
                .subConcepts(concept.getSubConcepts())
                .relatedCode(concept.getRelatedCode())
                .keywords(concept.getKeywords())
                .createdAt(concept.getCreatedAt())
                .updatedAt(concept.getUpdatedAt())
                .questionTemplates(concept.getQuestionTemplates() != null
                        ? concept.getQuestionTemplates().stream()
                                .map(QuestionTemplateResponse::fromEntity)
                                .collect(Collectors.toList())
                        : new ArrayList<>())
                .misconceptions(concept.getMisconceptions() != null
                        ? concept.getMisconceptions().stream()
                                .map(MisconceptionResponse::fromEntity)
                                .collect(Collectors.toList())
                        : new ArrayList<>())
                .build();
    }
}
