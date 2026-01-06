package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaConfiguration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigurationResponse {
    private UUID id;
    private UUID assignmentId;
    private UUID courseId;
    private UUID instituteId;
    private Boolean enabled;
    
    // Grading Settings
    private Integer weight;
    private Integer passingThreshold;
    private Integer maxAttempts;
    private Integer timeLimit;
    
    // Trigger Settings
    private VivaConfiguration.TriggerType triggerType;
    private Boolean cipasEnabled;
    private Integer cipasThreshold;
    
    // Question Settings
    private Integer questionCount;
    private VivaConfiguration.AdaptationStrategy adaptationStrategy;
    private VivaConfiguration.QuestionGeneration questionGeneration;
    
    // Voice Settings
    private String ttsVoice;
    private Double speechSpeed;
    private Double asrSensitivity;
    
    // Student Experience Settings
    private Boolean practiceModeEnabled;
    private Boolean showTranscription;
    private Boolean allowPausing;
    
    // Review Settings
    private Boolean autoReleaseResults;
    private Boolean requireInstructorReview;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static ConfigurationResponse fromEntity(VivaConfiguration config) {
        return ConfigurationResponse.builder()
                .id(config.getId())
                .assignmentId(config.getAssignmentId())
                .courseId(config.getCourseId())
                .instituteId(config.getInstituteId())
                .enabled(config.getEnabled())
                .weight(config.getWeight())
                .passingThreshold(config.getPassingThreshold())
                .maxAttempts(config.getMaxAttempts())
                .timeLimit(config.getTimeLimit())
                .triggerType(config.getTriggerType())
                .cipasEnabled(config.getCipasEnabled())
                .cipasThreshold(config.getCipasThreshold())
                .questionCount(config.getQuestionCount())
                .adaptationStrategy(config.getAdaptationStrategy())
                .questionGeneration(config.getQuestionGeneration())
                .ttsVoice(config.getTtsVoice())
                .speechSpeed(config.getSpeechSpeed())
                .asrSensitivity(config.getAsrSensitivity())
                .practiceModeEnabled(config.getPracticeModeEnabled())
                .showTranscription(config.getShowTranscription())
                .allowPausing(config.getAllowPausing())
                .autoReleaseResults(config.getAutoReleaseResults())
                .requireInstructorReview(config.getRequireInstructorReview())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
