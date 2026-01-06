package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaSession;
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
public class DashboardResponse {
    private StatusOverview statusOverview;
    private QuickStats quickStats;
    private ConfigurationStatus configurationStatus;
    private List<RecentActivity> recentActivity;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusOverview {
        private int totalStudents;
        private int vivasCompleted;
        private int vivasInProgress;
        private int vivasNotStarted;
        private Double averageScore;
        private Double averageDuration;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickStats {
        private Double passRate;
        private CompetencyDistribution competencyDistribution;
        private List<String> commonMisconceptions;
        private int flaggedSessions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompetencyDistribution {
        private int novice;
        private int intermediate;
        private int advanced;
        private int expert;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfigurationStatus {
        private boolean enabled;
        private String rubricStatus;
        private String questionBankStatus;
        private String triggerSettings;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String studentName;
        private Double score;
        private int duration;
        private VivaSession.SessionStatus status;
        private String timeAgo;
    }
}
