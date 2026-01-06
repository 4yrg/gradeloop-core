package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaConceptMastery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConceptMasteryResponse {
    private UUID id;
    private UUID conceptId;
    private String conceptName;
    private Double score;
    private Double mastery;
    private Integer questionsAnswered;
    private Integer correctAnswers;
    private List<UUID> detectedMisconceptions;
    private List<String> strengths;
    private List<String> weaknesses;
    
    public static ConceptMasteryResponse fromEntity(VivaConceptMastery mastery) {
        return ConceptMasteryResponse.builder()
                .id(mastery.getId())
                .conceptId(mastery.getConceptId())
                .conceptName(mastery.getConceptName())
                .score(mastery.getScore())
                .mastery(mastery.getMastery())
                .questionsAnswered(mastery.getQuestionsAnswered())
                .correctAnswers(mastery.getCorrectAnswers())
                .detectedMisconceptions(mastery.getDetectedMisconceptions())
                .strengths(mastery.getStrengths())
                .weaknesses(mastery.getWeaknesses())
                .build();
    }
}
