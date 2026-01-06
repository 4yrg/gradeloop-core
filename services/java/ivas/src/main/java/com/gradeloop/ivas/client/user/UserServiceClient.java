package com.gradeloop.ivas.client.user;

import com.gradeloop.ivas.client.user.dto.InstructorDTO;
import com.gradeloop.ivas.client.user.dto.StudentDTO;
import com.gradeloop.ivas.config.RestClientConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;
    private final RestClientConfig restClientConfig;

    /**
     * Get student details from User Service
     *
     * @param studentId Student ID
     * @return StudentDTO with student information
     */
    public StudentDTO getStudent(Long studentId) {
        try {
            String url = restClientConfig.getUserServiceUrl() + "/users/students/" + studentId;
            log.info("Fetching student details from: {}", url);

            StudentDTO student = restTemplate.getForObject(url, StudentDTO.class);

            if (student == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student not found with id: " + studentId
                );
            }

            log.info("Successfully fetched student: {} {}", student.getFirstName(), student.getLastName());
            return student;

        } catch (Exception e) {
            log.error("Error fetching student with id {}: {}", studentId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "User service unavailable: " + e.getMessage()
            );
        }
    }

    /**
     * Get instructor details from User Service
     *
     * @param instructorId Instructor ID
     * @return InstructorDTO with instructor information
     */
    public InstructorDTO getInstructor(Long instructorId) {
        try {
            String url = restClientConfig.getUserServiceUrl() + "/users/instructors/" + instructorId;
            log.info("Fetching instructor details from: {}", url);

            InstructorDTO instructor = restTemplate.getForObject(url, InstructorDTO.class);

            if (instructor == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Instructor not found with id: " + instructorId
                );
            }

            log.info("Successfully fetched instructor: {} {}", instructor.getFirstName(), instructor.getLastName());
            return instructor;

        } catch (Exception e) {
            log.error("Error fetching instructor with id {}: {}", instructorId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "User service unavailable: " + e.getMessage()
            );
        }
    }
}
