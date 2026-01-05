package com.gradeloop.institute.service;

import com.gradeloop.institute.client.UserServiceClient;
import com.gradeloop.institute.client.user.UserResponse;
import com.gradeloop.institute.dto.CreateCourseRequest;
import com.gradeloop.institute.dto.UpdateCourseRequest;
import com.gradeloop.institute.model.Classroom;
import com.gradeloop.institute.model.Course;
import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final InstituteService instituteService;
    private final UserServiceClient userServiceClient;
    private final ClassroomService classroomService;

    @Transactional
    public Course createCourse(UUID instituteId, CreateCourseRequest request) {
        Institute institute = instituteService.getInstitute(instituteId);

        if (courseRepository.existsByCodeAndInstituteId(request.getCode(), instituteId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Course with code " + request.getCode() + " already exists in institute");
        }

        Course course = Course.builder()
                .name(request.getName())
                .code(request.getCode())
                .credits(request.getCredits())
                .department(request.getDepartment())
                .description(request.getDescription())
                .institute(institute)
                .instructorIds(new ArrayList<>())
                .classroomIds(new ArrayList<>())
                .build();

        log.info("Created course id={} for instituteId={}", course.getId(), instituteId);
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses(UUID instituteId) {
        return courseRepository.findAllByInstituteId(instituteId);
    }

    public Course getCourse(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found with id: " + id));
    }

    @Transactional
    public Course updateCourse(UUID id, UpdateCourseRequest request) {
        Course course = getCourse(id);

        if (request.getName() != null)
            course.setName(request.getName());
        if (request.getCode() != null) {
            if (!course.getCode().equals(request.getCode()) &&
                    courseRepository.existsByCodeAndInstituteId(request.getCode(), course.getInstitute().getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Course with code " + request.getCode() + " already exists in institute");
            }
            course.setCode(request.getCode());
        }
        if (request.getCredits() != null)
            course.setCredits(request.getCredits());

        log.info("Updated course id={}", id);
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(UUID id) {
        Course course = getCourse(id);
        courseRepository.delete(course);
        log.info("Deleted course id={}", id);
    }

    @Transactional
    public Course enrollClass(UUID courseId, UUID classroomId) {
        Course course = getCourse(courseId);

        // Validate class exists and belongs to same institute
        Classroom classroom = classroomService.getClassroom(classroomId);
        if (!classroom.getInstitute().getId().equals(course.getInstitute().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classroom belongs to a different institute");
        }

        List<UUID> currentClasses = course.getClassroomIds();
        if (!currentClasses.contains(classroomId)) {
            currentClasses.add(classroomId);
            course.setClassroomIds(currentClasses);
            log.info("Enrolled classroom id={} to course id={}", classroomId, courseId);
            return courseRepository.save(course);
        }
        return course;
    }

    @Transactional
    public Course removeClass(UUID courseId, UUID classroomId) {
        Course course = getCourse(courseId);
        List<UUID> currentClasses = course.getClassroomIds();
        if (currentClasses.remove(classroomId)) {
            course.setClassroomIds(currentClasses);
            log.info("Removed classroom id={} from course id={}", classroomId, courseId);
            return courseRepository.save(course);
        }
        return course;
    }

    @Transactional
    public Course addInstructors(UUID courseId, List<Long> instructorIds) {
        Course course = getCourse(courseId);
        String instituteIdStr = course.getInstitute().getId().toString();
        List<Long> currentInstructors = course.getInstructorIds();

        for (Long instId : instructorIds) {
            try {
                UserResponse instructor = userServiceClient.getInstructor(instId);
                if (instructor.getInstituteId() == null || !instructor.getInstituteId().equals(instituteIdStr)) {
                    log.warn("Skipping instructor id={} (wrong institute)", instId);
                    continue;
                }
                if (!currentInstructors.contains(instId)) {
                    currentInstructors.add(instId);
                }
            } catch (Exception e) {
                log.warn("Skipping instructor id={} due to error: {}", instId, e.getMessage());
            }
        }

        course.setInstructorIds(currentInstructors);
        log.info("Updated instructors for course id={}", courseId);
        return courseRepository.save(course);
    }
}
