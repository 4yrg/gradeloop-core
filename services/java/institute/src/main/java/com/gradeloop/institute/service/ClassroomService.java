package com.gradeloop.institute.service;

import com.gradeloop.institute.client.UserServiceClient;
import com.gradeloop.institute.client.user.UserResponse;
import com.gradeloop.institute.dto.CreateClassroomRequest;
import com.gradeloop.institute.dto.UpdateClassroomRequest;
import com.gradeloop.institute.model.Classroom;
import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.repository.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final InstituteService instituteService;
    private final UserServiceClient userServiceClient;

    @Transactional
    public Classroom createClassroom(UUID instituteId, CreateClassroomRequest request) {
        Institute institute = instituteService.getInstitute(instituteId);

        Classroom classroom = Classroom.builder()
                .name(request.getName())
                .institute(institute)
                .studentIds(new ArrayList<>())
                .build();

        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            List<Long> validStudents = validateStudents(request.getStudentIds(), instituteId.toString());
            classroom.setStudentIds(validStudents);
        }

        log.info("Created classroom id={} for instituteId={}", classroom.getId(), instituteId);
        return classroomRepository.save(classroom);
    }

    public List<Classroom> getAllClassrooms(UUID instituteId) {
        return classroomRepository.findAllByInstituteId(instituteId);
    }

    public Classroom getClassroom(UUID id) {
        return classroomRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found with id: " + id));
    }

    @Transactional
    public Classroom updateClassroom(UUID id, UpdateClassroomRequest request) {
        Classroom classroom = getClassroom(id);
        if (request.getName() != null)
            classroom.setName(request.getName());
        return classroomRepository.save(classroom);
    }

    @Transactional
    public Classroom addStudents(UUID id, List<Long> studentIds) {
        Classroom classroom = getClassroom(id);
        List<Long> validStudents = validateStudents(studentIds, classroom.getInstitute().getId().toString());

        List<Long> currentStudents = classroom.getStudentIds();
        for (Long studentId : validStudents) {
            if (!currentStudents.contains(studentId)) {
                currentStudents.add(studentId);
            }
        }
        classroom.setStudentIds(currentStudents);
        log.info("Added students to classroom id={}", id);
        return classroomRepository.save(classroom);
    }

    @Transactional
    public void deleteClassroom(UUID id) {
        Classroom classroom = getClassroom(id);
        classroomRepository.delete(classroom);
        log.info("Deleted classroom id={}", id);
    }

    private List<Long> validateStudents(List<Long> studentIds, String instituteId) {
        List<Long> validIds = new ArrayList<>();
        for (Long studentId : studentIds) {
            try {
                UserResponse student = userServiceClient.getStudent(studentId);
                // Check if student belongs to institute.
                // Note: User Service might handle institute checking, but we double check.
                // student.getInstituteId() is String.
                if (student.getInstituteId() == null || !student.getInstituteId().equals(instituteId)) {
                    log.warn("Skipping student id={} because they do not belong to instituteId={}", studentId,
                            instituteId);
                    continue;
                }
                validIds.add(studentId);
            } catch (Exception e) {
                log.warn("Skipping student id={} due to error: {}", studentId, e.getMessage());
            }
        }
        return validIds;
    }
}
