package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaQuestionTemplate;
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
public class CreateConceptRequest {
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
    private List<CreateQuestionTemplateRequest> questionTemplates = new ArrayList<>();
    
    @Builder.Default
    private List<CreateMisconceptionRequest> misconceptions = new ArrayList<>();
}
