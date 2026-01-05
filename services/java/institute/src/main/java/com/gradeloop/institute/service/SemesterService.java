package com.gradeloop.institute.service;

import com.gradeloop.institute.dto.CreateSemesterRequest;
import com.gradeloop.institute.dto.SemesterResponse;
import com.gradeloop.institute.dto.UpdateSemesterRequest;
import com.gradeloop.institute.model.Semester;
import com.gradeloop.institute.repository.SemesterRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;

    @Transactional
    public SemesterResponse createSemester(CreateSemesterRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());
        if (semesterRepository.findByCode(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Semester with code " + request.getCode() + " already exists.");
        }

        if (request.isActive()) {
            deactivateAllSemesters();
        }

        Semester semester = Semester.builder()
                .name(request.getName())
                .code(request.getCode())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.isActive())
                .build();

        return mapToResponse(semesterRepository.save(semester));
    }

    public List<SemesterResponse> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SemesterResponse getSemesterById(UUID id) {
        return mapToResponse(findSemesterById(id));
    }

    @Transactional
    public SemesterResponse updateSemester(UUID id, UpdateSemesterRequest request) {
        Semester semester = findSemesterById(id);

        if (request.getCode() != null && !semester.getCode().equals(request.getCode())) {
            if (semesterRepository.findByCode(request.getCode()).isPresent()) {
                throw new IllegalArgumentException("Semester with code " + request.getCode() + " already exists.");
            }
            semester.setCode(request.getCode());
        }

        if (request.getName() != null)
            semester.setName(request.getName());

        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : semester.getStartDate();
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : semester.getEndDate();
        validateDates(startDate, endDate);

        semester.setStartDate(startDate);
        semester.setEndDate(endDate);

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                deactivateAllSemesters();
                semester.setActive(true);
            } else {
                semester.setActive(false);
            }
        }

        return mapToResponse(semesterRepository.save(semester));
    }

    @Transactional
    public void deleteSemester(UUID id) {
        // potentially check for linked courses/offerings before deletion
        semesterRepository.deleteById(id);
    }

    @Transactional
    public SemesterResponse activateSemester(UUID id) {
        deactivateAllSemesters();
        Semester semester = findSemesterById(id);
        semester.setActive(true);
        return mapToResponse(semesterRepository.save(semester));
    }

    @Transactional
    public SemesterResponse deactivateSemester(UUID id) {
        Semester semester = findSemesterById(id);
        semester.setActive(false);
        return mapToResponse(semesterRepository.save(semester));
    }

    private void deactivateAllSemesters() {
        Optional<Semester> activeSemester = semesterRepository.findByIsActiveTrue();
        activeSemester.ifPresent(s -> {
            s.setActive(false);
            semesterRepository.save(s);
        });
    }

    private Semester findSemesterById(UUID id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Semester not found with id: " + id));
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date.");
        }
    }

    private SemesterResponse mapToResponse(Semester semester) {
        return SemesterResponse.builder()
                .id(semester.getId())
                .name(semester.getName())
                .code(semester.getCode())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .isActive(semester.isActive())
                .build();
    }
}
