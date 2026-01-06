package com.gradeloop.ivas.service;

import com.gradeloop.ivas.dto.DashboardResponse;
import com.gradeloop.ivas.model.VivaConfiguration;
import com.gradeloop.ivas.model.VivaRubric;
import com.gradeloop.ivas.model.VivaSession;
import com.gradeloop.ivas.repository.VivaQuestionTemplateRepository;
import com.gradeloop.ivas.repository.VivaRubricRepository;
import com.gradeloop.ivas.repository.VivaSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VivaDashboardService {

    private final VivaSessionRepository sessionRepository;
    private final VivaRubricRepository rubricRepository;
    private final VivaQuestionTemplateRepository questionTemplateRepository;
    private final VivaConfigurationService configurationService;

    public DashboardResponse getDashboard(UUID assignmentId, int totalStudents) {
        // Get status overview
        DashboardResponse.StatusOverview statusOverview = getStatusOverview(assignmentId, totalStudents);

        // Get quick stats
        DashboardResponse.QuickStats quickStats = getQuickStats(assignmentId);

        // Get configuration status
        DashboardResponse.ConfigurationStatus configStatus = getConfigurationStatus(assignmentId);

        // Get recent activity
        List<DashboardResponse.RecentActivity> recentActivity = getRecentActivity(assignmentId);

        return DashboardResponse.builder()
                .statusOverview(statusOverview)
                .quickStats(quickStats)
                .configurationStatus(configStatus)
                .recentActivity(recentActivity)
                .build();
    }

    private DashboardResponse.StatusOverview getStatusOverview(UUID assignmentId, int totalStudents) {
        int completed = sessionRepository.countByAssignmentIdAndStatus(assignmentId, VivaSession.SessionStatus.COMPLETED)
                + sessionRepository.countByAssignmentIdAndStatus(assignmentId, VivaSession.SessionStatus.SUBMITTED);
        int inProgress = sessionRepository.countByAssignmentIdAndStatus(assignmentId, VivaSession.SessionStatus.IN_PROGRESS);
        int notStarted = totalStudents - completed - inProgress;

        Double averageScore = sessionRepository.getAverageScoreByAssignmentId(assignmentId);
        Double averageDuration = sessionRepository.getAverageDurationByAssignmentId(assignmentId);

        return DashboardResponse.StatusOverview.builder()
                .totalStudents(totalStudents)
                .vivasCompleted(completed)
                .vivasInProgress(inProgress)
                .vivasNotStarted(Math.max(0, notStarted))
                .averageScore(averageScore != null ? Math.round(averageScore * 10.0) / 10.0 : null)
                .averageDuration(averageDuration != null ? Math.round(averageDuration / 60.0 * 10.0) / 10.0 : null) // Convert to minutes
                .build();
    }

    private DashboardResponse.QuickStats getQuickStats(UUID assignmentId) {
        int totalCompleted = sessionRepository.countByAssignmentIdAndStatus(assignmentId, VivaSession.SessionStatus.COMPLETED)
                + sessionRepository.countByAssignmentIdAndStatus(assignmentId, VivaSession.SessionStatus.SUBMITTED);
        int passed = sessionRepository.countByAssignmentIdAndPassFail(assignmentId, VivaSession.PassFail.PASS);
        int flagged = sessionRepository.countFlaggedByAssignmentId(assignmentId);

        double passRate = totalCompleted > 0 ? (double) passed / totalCompleted * 100 : 0;

        // Get competency distribution (placeholder - would need more complex query in production)
        DashboardResponse.CompetencyDistribution competencyDistribution = DashboardResponse.CompetencyDistribution.builder()
                .novice(0)
                .intermediate(0)
                .advanced(0)
                .expert(0)
                .build();

        // Common misconceptions (placeholder - would need aggregation from session data)
        List<String> commonMisconceptions = new ArrayList<>();

        return DashboardResponse.QuickStats.builder()
                .passRate(Math.round(passRate * 10.0) / 10.0)
                .competencyDistribution(competencyDistribution)
                .commonMisconceptions(commonMisconceptions)
                .flaggedSessions(flagged)
                .build();
    }

    private DashboardResponse.ConfigurationStatus getConfigurationStatus(UUID assignmentId) {
        boolean enabled = false;
        String triggerSettings = "manual";

        try {
            VivaConfiguration config = configurationService.getConfigurationByAssignmentId(assignmentId);
            enabled = config.getEnabled();
            triggerSettings = config.getTriggerType().name().toLowerCase();
        } catch (Exception e) {
            // Config doesn't exist yet
        }

        // Check rubric status
        String rubricStatus = "not_configured";
        Optional<VivaRubric> activeRubric = rubricRepository.findByAssignmentIdAndStatus(assignmentId, VivaRubric.RubricStatus.ACTIVE);
        if (activeRubric.isPresent()) {
            rubricStatus = "configured";
        } else {
            List<VivaRubric> draftRubrics = rubricRepository.findByAssignmentId(assignmentId);
            if (!draftRubrics.isEmpty()) {
                rubricStatus = "draft";
            }
        }

        // Check question bank status
        String questionBankStatus = "empty";
        if (activeRubric.isPresent()) {
            var concepts = activeRubric.get().getConcepts();
            if (concepts != null && !concepts.isEmpty()) {
                long questionCount = concepts.stream()
                        .flatMap(c -> c.getQuestionTemplates().stream())
                        .filter(VivaQuestionTemplate::getActive)
                        .count();
                if (questionCount > 0) {
                    questionBankStatus = "ready";
                }
            }
        }

        return DashboardResponse.ConfigurationStatus.builder()
                .enabled(enabled)
                .rubricStatus(rubricStatus)
                .questionBankStatus(questionBankStatus)
                .triggerSettings(triggerSettings)
                .build();
    }

    private List<DashboardResponse.RecentActivity> getRecentActivity(UUID assignmentId) {
        List<VivaSession> recentSessions = sessionRepository.findRecentByAssignmentId(
                assignmentId, PageRequest.of(0, 5));

        List<DashboardResponse.RecentActivity> activities = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (VivaSession session : recentSessions) {
            String timeAgo = formatTimeAgo(session.getCompletedAt() != null ? session.getCompletedAt() : session.getCreatedAt(), now);
            
            activities.add(DashboardResponse.RecentActivity.builder()
                    .studentName("Student " + session.getStudentId()) // Would need to fetch from user service
                    .score(session.getOverallScore())
                    .duration(session.getTimeSpent() != null ? session.getTimeSpent() / 60 : 0)
                    .status(session.getStatus())
                    .timeAgo(timeAgo)
                    .build());
        }

        return activities;
    }

    private String formatTimeAgo(LocalDateTime dateTime, LocalDateTime now) {
        if (dateTime == null) return "unknown";
        
        Duration duration = Duration.between(dateTime, now);
        long minutes = duration.toMinutes();
        long hours = duration.toHours();
        long days = duration.toDays();

        if (minutes < 60) {
            return minutes + " minutes ago";
        } else if (hours < 24) {
            return hours + " hours ago";
        } else {
            return days + " days ago";
        }
    }
}
