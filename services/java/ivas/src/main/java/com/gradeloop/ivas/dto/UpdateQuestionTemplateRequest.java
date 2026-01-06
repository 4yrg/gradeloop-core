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
public class UpdateQuestionTemplateRequest {
    private UUID id; // null for new, set for existing
    private String questionText;
    private String codeSnippet;
    private VivaQuestionTemplate.DifficultyLevel difficulty;
    private Double irtDifficulty;
    private Double irtDiscrimination;
    
    @Builder.Default
    private List<String> expectedKeywords = new ArrayList<>();
    
    private String sampleAnswer;
    private Integer expectedTime;
    private Boolean active;
}
