package com.gradeloop.ivas.client.institute;

import com.gradeloop.ivas.client.institute.dto.AssignmentDTO;
import com.gradeloop.ivas.client.institute.dto.CourseDTO;
import com.gradeloop.ivas.config.RestClientConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstituteServiceClient {

    private final RestTemplate restTemplate;
    private final RestClientConfig restClientConfig;

    /**
     * Get assignment details from Institute Service
     *
     * @param assignmentId Assignment UUID
     * @return AssignmentDTO with assignment information
     */
    public AssignmentDTO getAssignment(UUID assignmentId) {
        try {
            String url = restClientConfig.getInstituteServiceUrl() + "/api/v1/assignments/" + assignmentId;
            log.info("Fetching assignment details from: {}", url);

            AssignmentDTO assignment = restTemplate.getForObject(url, AssignmentDTO.class);

            if (assignment == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Assignment not found with id: " + assignmentId
                );
            }

            log.info("Successfully fetched assignment: {}", assignment.getTitle());
            return assignment;

        } catch (Exception e) {
            log.error("Error fetching assignment with id {}: {}", assignmentId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Institute service unavailable: " + e.getMessage()
            );
        }
    }

    /**
     * Get course details from Institute Service
     *
     * @param courseId Course UUID
     * @return CourseDTO with course information
     */
    public CourseDTO getCourse(UUID courseId) {
        try {
            String url = restClientConfig.getInstituteServiceUrl() + "/api/v1/courses/" + courseId;
            log.info("Fetching course details from: {}", url);

            CourseDTO course = restTemplate.getForObject(url, CourseDTO.class);

            if (course == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found with id: " + courseId
                );
            }

            log.info("Successfully fetched course: {} - {}", course.getCode(), course.getName());
            return course;

        } catch (Exception e) {
            log.error("Error fetching course with id {}: {}", courseId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Institute service unavailable: " + e.getMessage()
            );
        }
    }
}
