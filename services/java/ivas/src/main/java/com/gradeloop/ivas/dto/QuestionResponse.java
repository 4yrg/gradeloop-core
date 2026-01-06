package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaQuestion;
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
public class QuestionResponse {
    private UUID id;
    private String questionText;
    private String codeSnippet;
    private String difficulty;
    private Integer sequence;
    private LocalDateTime askedAt;
    private String studentResponse;
    private Double responseScore;
    private Integer timeSpent;
    private List<String> expectedConcepts;

    public static QuestionResponse fromEntity(VivaQuestion question, List<String> concepts) {
        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .codeSnippet(question.getCodeSnippet())
                .difficulty(question.getDifficulty())
                .sequence(question.getSequence())
                .askedAt(question.getAskedAt())
                .studentResponse(question.getStudentResponse())
                .responseScore(question.getResponseScore())
                .timeSpent(question.getTimeSpent())
                .expectedConcepts(concepts)
                .build();
    }
}
