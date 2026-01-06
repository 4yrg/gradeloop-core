package com.gradeloop.institute.service;

import com.gradeloop.institute.dto.CreateDegreeRequest;
import com.gradeloop.institute.dto.UpdateDegreeRequest;
import com.gradeloop.institute.model.Degree;
import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.repository.DegreeRepository;
import com.gradeloop.institute.repository.DegreeCourseRepository;
import com.gradeloop.institute.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DegreeService {

    private final DegreeRepository degreeRepository;
    private final InstituteService instituteService;

    @Transactional
    public Degree createDegree(UUID instituteId, CreateDegreeRequest request) {
        Institute institute = instituteService.getInstitute(instituteId);

        if (degreeRepository.existsByCodeAndInstituteId(request.getCode(), instituteId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Degree with code " + request.getCode() + " already exists in institute " + instituteId);
        }

        Degree degree = Degree.builder()
                .name(request.getName())
                .code(request.getCode())
                .credits(request.getCredits())
                .description(request.getDescription())
                .institute(institute)
                .build();

        log.info("Created degree id={} for instituteId={}", degree.getId(), instituteId);
        return degreeRepository.save(degree);
    }

    public List<Degree> getAllDegrees(UUID instituteId) {
        return degreeRepository.findAllByInstituteId(instituteId);
    }

    public Degree getDegree(UUID id) {
        return degreeRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Degree not found with id: " + id));
    }

    @Transactional
    public Degree updateDegree(UUID id, UpdateDegreeRequest request) {
        Degree degree = getDegree(id);

        if (request.getName() != null)
            degree.setName(request.getName());
        if (request.getCode() != null) {
            // Check uniqueness if changed
            if (!degree.getCode().equals(request.getCode()) &&
                    degreeRepository.existsByCodeAndInstituteId(request.getCode(), degree.getInstitute().getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Degree with code " + request.getCode() + " already exists in institute");
            }
            degree.setCode(request.getCode());
        }
        if (request.getCredits() != null)
            degree.setCredits(request.getCredits());
        if (request.getDescription() != null)
            degree.setDescription(request.getDescription());

        log.info("Updated degree id={} for instituteId={}", id, degree.getInstitute().getId());
        return degreeRepository.save(degree);
    }

    @Transactional
    public void deleteDegree(UUID id) {
        Degree degree = getDegree(id);
        UUID instituteId = degree.getInstitute().getId();
        degreeRepository.delete(degree);
        log.info("Deleted degree id={} for instituteId={}", id, instituteId);
    }

    private final DegreeCourseRepository degreeCourseRepository;
    private final com.gradeloop.institute.repository.CourseRepository courseRepository;

    @Transactional
    public void addCourseToDegree(UUID degreeId, UUID courseId) {
        if (degreeCourseRepository.existsByDegreeIdAndCourseId(degreeId, courseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course already added to degree");
        }
        Degree degree = getDegree(degreeId);
        com.gradeloop.institute.model.Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        com.gradeloop.institute.model.DegreeCourse degreeCourse = com.gradeloop.institute.model.DegreeCourse.builder()
                .degree(degree)
                .course(course)
                .build();
        degreeCourseRepository.save(degreeCourse);
    }

    @Transactional
    public void removeCourseFromDegree(UUID degreeId, UUID courseId) {
        if (!degreeCourseRepository.existsByDegreeIdAndCourseId(degreeId, courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found");
        }
        degreeCourseRepository.deleteByDegreeIdAndCourseId(degreeId, courseId);
    }

    public List<com.gradeloop.institute.model.Course> getCoursesForDegree(UUID degreeId) {
        return degreeCourseRepository.findByDegreeId(degreeId).stream()
                .map(com.gradeloop.institute.model.DegreeCourse::getCourse)
                .collect(java.util.stream.Collectors.toList());
    }
}
