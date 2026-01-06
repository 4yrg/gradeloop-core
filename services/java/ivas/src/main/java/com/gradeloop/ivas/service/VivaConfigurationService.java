package com.gradeloop.ivas.service;

import com.gradeloop.ivas.dto.CreateConfigurationRequest;
import com.gradeloop.ivas.dto.UpdateConfigurationRequest;
import com.gradeloop.ivas.model.VivaConfiguration;
import com.gradeloop.ivas.repository.VivaConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VivaConfigurationService {

    private final VivaConfigurationRepository configurationRepository;

    @Transactional
    public VivaConfiguration createConfiguration(CreateConfigurationRequest request) {
        if (configurationRepository.existsByAssignmentId(request.getAssignmentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Configuration already exists for assignment: " + request.getAssignmentId());
        }

        VivaConfiguration config = VivaConfiguration.builder()
                .assignmentId(request.getAssignmentId())
                .courseId(request.getCourseId())
                .instituteId(request.getInstituteId())
                .enabled(request.getEnabled() != null ? request.getEnabled() : false)
                .weight(request.getWeight() != null ? request.getWeight() : 25)
                .passingThreshold(request.getPassingThreshold() != null ? request.getPassingThreshold() : 70)
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 3)
                .timeLimit(request.getTimeLimit() != null ? request.getTimeLimit() : 15)
                .triggerType(request.getTriggerType() != null ? request.getTriggerType() : VivaConfiguration.TriggerType.MANUAL)
                .cipasEnabled(request.getCipasEnabled() != null ? request.getCipasEnabled() : false)
                .cipasThreshold(request.getCipasThreshold())
                .questionCount(request.getQuestionCount() != null ? request.getQuestionCount() : 7)
                .adaptationStrategy(request.getAdaptationStrategy() != null ? request.getAdaptationStrategy() : VivaConfiguration.AdaptationStrategy.IRT)
                .questionGeneration(request.getQuestionGeneration() != null ? request.getQuestionGeneration() : VivaConfiguration.QuestionGeneration.HYBRID)
                .ttsVoice(request.getTtsVoice() != null ? request.getTtsVoice() : "alloy")
                .speechSpeed(request.getSpeechSpeed() != null ? request.getSpeechSpeed() : 1.0)
                .asrSensitivity(request.getAsrSensitivity() != null ? request.getAsrSensitivity() : 0.5)
                .practiceModeEnabled(request.getPracticeModeEnabled() != null ? request.getPracticeModeEnabled() : true)
                .showTranscription(request.getShowTranscription() != null ? request.getShowTranscription() : true)
                .allowPausing(request.getAllowPausing() != null ? request.getAllowPausing() : false)
                .autoReleaseResults(request.getAutoReleaseResults() != null ? request.getAutoReleaseResults() : true)
                .requireInstructorReview(request.getRequireInstructorReview() != null ? request.getRequireInstructorReview() : false)
                .build();

        VivaConfiguration saved = configurationRepository.save(config);
        log.info("Created viva configuration id={} for assignmentId={}", saved.getId(), request.getAssignmentId());
        return saved;
    }

    public VivaConfiguration getConfiguration(UUID id) {
        return configurationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Configuration not found with id: " + id));
    }

    public VivaConfiguration getConfigurationByAssignmentId(UUID assignmentId) {
        return configurationRepository.findByAssignmentId(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Configuration not found for assignment: " + assignmentId));
    }

    @Transactional
    public VivaConfiguration updateConfiguration(UUID assignmentId, UpdateConfigurationRequest request) {
        VivaConfiguration config = getConfigurationByAssignmentId(assignmentId);

        if (request.getEnabled() != null) config.setEnabled(request.getEnabled());
        if (request.getWeight() != null) config.setWeight(request.getWeight());
        if (request.getPassingThreshold() != null) config.setPassingThreshold(request.getPassingThreshold());
        if (request.getMaxAttempts() != null) config.setMaxAttempts(request.getMaxAttempts());
        if (request.getTimeLimit() != null) config.setTimeLimit(request.getTimeLimit());
        if (request.getTriggerType() != null) config.setTriggerType(request.getTriggerType());
        if (request.getCipasEnabled() != null) config.setCipasEnabled(request.getCipasEnabled());
        if (request.getCipasThreshold() != null) config.setCipasThreshold(request.getCipasThreshold());
        if (request.getQuestionCount() != null) config.setQuestionCount(request.getQuestionCount());
        if (request.getAdaptationStrategy() != null) config.setAdaptationStrategy(request.getAdaptationStrategy());
        if (request.getQuestionGeneration() != null) config.setQuestionGeneration(request.getQuestionGeneration());
        if (request.getTtsVoice() != null) config.setTtsVoice(request.getTtsVoice());
        if (request.getSpeechSpeed() != null) config.setSpeechSpeed(request.getSpeechSpeed());
        if (request.getAsrSensitivity() != null) config.setAsrSensitivity(request.getAsrSensitivity());
        if (request.getPracticeModeEnabled() != null) config.setPracticeModeEnabled(request.getPracticeModeEnabled());
        if (request.getShowTranscription() != null) config.setShowTranscription(request.getShowTranscription());
        if (request.getAllowPausing() != null) config.setAllowPausing(request.getAllowPausing());
        if (request.getAutoReleaseResults() != null) config.setAutoReleaseResults(request.getAutoReleaseResults());
        if (request.getRequireInstructorReview() != null) config.setRequireInstructorReview(request.getRequireInstructorReview());

        log.info("Updated viva configuration for assignmentId={}", assignmentId);
        return configurationRepository.save(config);
    }

    @Transactional
    public void deleteConfiguration(UUID assignmentId) {
        VivaConfiguration config = getConfigurationByAssignmentId(assignmentId);
        configurationRepository.delete(config);
        log.info("Deleted viva configuration for assignmentId={}", assignmentId);
    }

    public boolean existsByAssignmentId(UUID assignmentId) {
        return configurationRepository.existsByAssignmentId(assignmentId);
    }
}
