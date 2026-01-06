package com.gradeloop.ivas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateConceptRequest {
    private UUID id; // null for new concepts, set for existing ones
    private String name;
    private String description;
    private Integer weight;
    private Integer displayOrder;
    
    @Builder.Default
    private List<String> subConcepts = new ArrayList<>();
    
    private String relatedCode;
    
    @Builder.Default
    private List<String> keywords = new ArrayList<>();
    
    @Builder.Default
    private List<UpdateQuestionTemplateRequest> questionTemplates = new ArrayList<>();
    
    @Builder.Default
    private List<UpdateMisconceptionRequest> misconceptions = new ArrayList<>();
}
