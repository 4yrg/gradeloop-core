package com.gradeloop.user.service;

import com.gradeloop.user.client.AuthServiceClient;
import com.gradeloop.user.client.auth.CreateAuthUserRequest;
import com.gradeloop.user.client.auth.CreateAuthUserResponse;
import com.gradeloop.user.dto.CreateInstructorRequest;
import com.gradeloop.user.dto.CreateUserResponse;
import com.gradeloop.user.model.Instructor;
import com.gradeloop.user.repository.InstructorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final AuthServiceClient authServiceClient;

    @Transactional
    public CreateUserResponse createInstructor(CreateInstructorRequest request) {
        // 1. Check if instructor already exists
        if (instructorRepository.findByEmail(request.getEmail()).isPresent()) {
            Instructor existingInstructor = instructorRepository.findByEmail(request.getEmail()).get();
            return CreateUserResponse.builder()
                    .id(existingInstructor.getId())
                    .userId(existingInstructor.getId())
                    .email(existingInstructor.getEmail())
                    .fullName(existingInstructor.getFullName())
                    .role("instructor")
                    .instituteId(existingInstructor.getInstituteId())
                    .department(existingInstructor.getDepartment())
                    .build();
        }

        // 2. Create Instructor Profile FIRST
        Instructor instructor = Instructor.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .instituteId(request.getInstituteId())
                .department(request.getDepartment())
                .build();
        instructor = instructorRepository.save(instructor);

        // 3. Create Auth User with reference to instructor ID
        CreateAuthUserResponse authUser = null;
        try {
            authUser = authServiceClient.createUser(request.getEmail(), "INSTRUCTOR", instructor.getId());
            instructor.setAuthUserId(authUser.getAuthUserId());
            instructor = instructorRepository.save(instructor);
        } catch (Exception e) {
            // Rollback: Delete instructor if auth creation fails
            instructorRepository.deleteById(instructor.getId());
            throw new RuntimeException("Failed to create auth user: " + e.getMessage(), e);
        }

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(instructor.getId())
                .email(instructor.getEmail())
                .fullName(instructor.getFullName())
                .role("instructor")
                .instituteId(instructor.getInstituteId())
                .department(instructor.getDepartment())
                .build();
    }

    @Transactional
    public List<CreateUserResponse> createInstructorsBulk(List<CreateInstructorRequest> requests) {
        List<CreateUserResponse> responses = new ArrayList<>();

        // Process each request individually with proper rollback
        for (CreateInstructorRequest req : requests) {
            try {
                // Check if instructor already exists
                if (instructorRepository.findByEmail(req.getEmail()).isPresent()) {
                    Instructor existingInstructor = instructorRepository.findByEmail(req.getEmail()).get();
                    responses.add(CreateUserResponse.builder()
                            .id(existingInstructor.getId())
                            .userId(existingInstructor.getId())
                            .email(existingInstructor.getEmail())
                            .fullName(existingInstructor.getFullName())
                            .role("instructor")
                            .instituteId(existingInstructor.getInstituteId())
                            .department(existingInstructor.getDepartment())
                            .build());
                    continue;
                }

                // Create Instructor Profile FIRST
                Instructor instructor = Instructor.builder()
                        .email(req.getEmail())
                        .fullName(req.getFullName())
                        .instituteId(req.getInstituteId())
                        .department(req.getDepartment())
                        .build();
                instructor = instructorRepository.save(instructor);

                // Create Auth User with reference to instructor ID
                try {
                    CreateAuthUserResponse authUser = authServiceClient.createUser(
                            req.getEmail(), "INSTRUCTOR", instructor.getId());
                    instructor.setAuthUserId(authUser.getAuthUserId());
                    instructor = instructorRepository.save(instructor);

                    responses.add(CreateUserResponse.builder()
                            .id(instructor.getId())
                            .userId(instructor.getId())
                            .email(instructor.getEmail())
                            .fullName(instructor.getFullName())
                            .role("instructor")
                            .instituteId(instructor.getInstituteId())
                            .department(instructor.getDepartment())
                            .build());
                } catch (Exception e) {
                    // Rollback: Delete instructor if auth creation fails
                    instructorRepository.deleteById(instructor.getId());
                    throw e;
                }

            } catch (Exception e) {
                responses.add(CreateUserResponse.builder()
                        .email(req.getEmail())
                        .error("Error creating instructor: " + e.getMessage())
                        .build());
            }
        }

        return responses;
    }

    public List<CreateUserResponse> getAllInstructors() {
        return instructorRepository.findAll().stream()
                .map(instructor -> CreateUserResponse.builder()
                        .id(instructor.getId())
                        .userId(instructor.getAuthUserId())
                        .email(instructor.getEmail())
                        .fullName(instructor.getFullName())
                        .role("instructor")
                        .instituteId(instructor.getInstituteId())
                        .department(instructor.getDepartment())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CreateUserResponse updateInstructor(Long id,
            com.gradeloop.user.dto.UpdateInstructorRequest request) {
        Instructor instructor = instructorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        if (request.getFullName() != null)
            instructor.setFullName(request.getFullName());

        if (request.getDepartment() != null)
            instructor.setDepartment(request.getDepartment());

        instructor = instructorRepository.save(instructor);

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(instructor.getAuthUserId())
                .email(instructor.getEmail())
                .fullName(instructor.getFullName())
                .instituteId(instructor.getInstituteId())
                .department(instructor.getDepartment())
                .build();
    }

    @Transactional
    public void deleteInstructor(Long id) {
        instructorRepository.deleteById(id);
    }

    public CreateUserResponse getInstructorById(Long id) {
        Instructor instructor = instructorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(instructor.getAuthUserId())
                .email(instructor.getEmail())
                .fullName(instructor.getFullName())
                .role("instructor")
                .instituteId(instructor.getInstituteId())
                .department(instructor.getDepartment())
                .build();
    }
}
