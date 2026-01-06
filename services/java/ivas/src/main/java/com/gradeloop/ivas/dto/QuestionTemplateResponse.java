package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaQuestionTemplate;
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
public class QuestionTemplateResponse {
    private UUID id;
    private String questionText;
    private String codeSnippet;
    private VivaQuestionTemplate.DifficultyLevel difficulty;
    private Double irtDifficulty;
    private Double irtDiscrimination;
    private List<String> expectedKeywords;
    private String sampleAnswer;
    private Integer expectedTime;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static QuestionTemplateResponse fromEntity(VivaQuestionTemplate template) {
        return QuestionTemplateResponse.builder()
                .id(template.getId())
                .questionText(template.getQuestionText())
                .codeSnippet(template.getCodeSnippet())
                .difficulty(template.getDifficulty())
                .irtDifficulty(template.getIrtDifficulty())
                .irtDiscrimination(template.getIrtDiscrimination())
                .expectedKeywords(template.getExpectedKeywords())
                .sampleAnswer(template.getSampleAnswer())
                .expectedTime(template.getExpectedTime())
                .active(template.getActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
