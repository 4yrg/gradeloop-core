package com.gradeloop.institute.service;

import com.gradeloop.institute.dto.CreateAssignmentRequest;
import com.gradeloop.institute.model.Assignment;
import com.gradeloop.institute.model.Course;
import com.gradeloop.institute.repository.AssignmentRepository;
import com.gradeloop.institute.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseService courseService; // Assuming CourseService exists and handles course retrieval

    @Transactional
    public Assignment createAssignmentDraft(UUID courseId, CreateAssignmentRequest request) {
        // Validate Course exists
        Course course = courseService.getCourse(courseId); // Reusing existing service method

        // Logical Validation
        if (request.getDueDate() != null && request.getReleaseDate() != null
                && request.getDueDate().isBefore(request.getReleaseDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date cannot be before release date");
        }
        if (Boolean.TRUE.equals(request.getAllowLateSubmissions()) && request.getLateDueDate() != null
                && request.getDueDate() != null && request.getLateDueDate().isBefore(request.getDueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Late due date cannot be before regular due date");
        }

        Assignment assignment = Assignment.builder()
                .name(request.getName())
                .course(course)
                .type(request.getType())
                .status(Assignment.AssignmentStatus.DRAFT)
                .autograderPoints(request.getAutograderPoints())
                .allowManualGrading(request.getAllowManualGrading())
                .releaseDate(request.getReleaseDate())
                .dueDate(request.getDueDate())
                .allowLateSubmissions(request.getAllowLateSubmissions())
                .lateDueDate(request.getLateDueDate())
                .enforceTimeLimit(request.getEnforceTimeLimit())
                .timeLimit(request.getTimeLimit())
                .enableGroupSubmissions(request.getEnableGroupSubmissions())
                .groupSizeLimit(request.getGroupSizeLimit())
                .enableLeaderboard(request.getEnableLeaderboard())
                .leaderboardEntries(request.getLeaderboardEntries())
                .build();

        return assignmentRepository.save(assignment);
    }
}
