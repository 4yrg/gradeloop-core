package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaConfiguration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateConfigurationRequest {
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
}
