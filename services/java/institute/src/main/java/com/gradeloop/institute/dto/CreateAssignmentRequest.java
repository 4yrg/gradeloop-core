package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.Assignment.AssignmentType;
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
public class CreateAssignmentRequest {
    private String name;
    private AssignmentType type;
    private Integer autograderPoints;
    private Boolean allowManualGrading;
    private LocalDateTime releaseDate;
    private LocalDateTime dueDate;
    private Boolean allowLateSubmissions;
    private LocalDateTime lateDueDate;
    private Boolean enforceTimeLimit;
    private Integer timeLimit;
    private Boolean enableGroupSubmissions;
    private Integer groupSizeLimit;
    private Boolean enableLeaderboard;
    private Integer leaderboardEntries;
}
