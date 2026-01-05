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
        CreateAuthUserResponse authUser = authServiceClient.createUser(request.getEmail(), "INSTRUCTOR");

        Instructor instructor;
        try {
            if (instructorRepository.findByEmail(request.getEmail()).isPresent()) {
                instructor = instructorRepository.findByEmail(request.getEmail()).get();
            } else {
                instructor = Instructor.builder()
                        .email(request.getEmail())
                        .fullName(request.getFullName())
                        .instituteId(request.getInstituteId())
                        .department(request.getDepartment())
                        .authUserId(authUser.getUserId())
                        .build();
                instructor = instructorRepository.save(instructor);
            }
        } catch (Exception e) {
            authServiceClient.deleteUser(authUser.getUserId());
            throw e;
        }

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(authUser.getUserId())
                .email(instructor.getEmail())
                .fullName(instructor.getFullName())
                .tempPassword(authUser.getTempPassword())
                .instituteId(instructor.getInstituteId())
                .build();
    }

    @Transactional
    public List<CreateUserResponse> createInstructorsBulk(List<CreateInstructorRequest> requests) {
        List<CreateAuthUserRequest> authRequests = requests.stream()
                .map(req -> CreateAuthUserRequest.builder()
                        .email(req.getEmail())
                        .role("INSTRUCTOR")
                        .build())
                .collect(Collectors.toList());

        List<CreateAuthUserResponse> authResponses = authServiceClient.createUsersBulk(authRequests);

        Map<String, CreateAuthUserResponse> authResponseMap = authResponses.stream()
                .collect(Collectors.toMap(CreateAuthUserResponse::getEmail, Function.identity(),
                        (existing, replacement) -> existing));

        List<CreateUserResponse> responses = new ArrayList<>();

        for (CreateInstructorRequest req : requests) {
            try {
                CreateAuthUserResponse authUser = authResponseMap.get(req.getEmail());
                if (authUser == null) {
                    responses.add(CreateUserResponse.builder()
                            .email(req.getEmail())
                            .error("Failed to create auth user")
                            .build());
                    continue;
                }

                Instructor instructor;
                if (instructorRepository.findByEmail(req.getEmail()).isPresent()) {
                    instructor = instructorRepository.findByEmail(req.getEmail()).get();
                } else {
                    instructor = Instructor.builder()
                            .email(req.getEmail())
                            .fullName(req.getFullName())
                            .instituteId(req.getInstituteId())
                            .department(req.getDepartment())
                            .authUserId(authUser.getUserId())
                            .build();
                    instructor = instructorRepository.save(instructor);
                }

                responses.add(CreateUserResponse.builder()
                        .id(instructor.getId())
                        .userId(authUser.getUserId())
                        .email(instructor.getEmail())
                        .fullName(instructor.getFullName())
                        .tempPassword(authUser.getTempPassword())
                        .instituteId(instructor.getInstituteId())
                        .build());

            } catch (Exception e) {
                responses.add(CreateUserResponse.builder()
                        .email(req.getEmail())
                        .error("Error creating instructor profile: " + e.getMessage())
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

        instructor = instructorRepository.save(instructor);

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(instructor.getAuthUserId())
                .email(instructor.getEmail())
                .fullName(instructor.getFullName())
                .instituteId(instructor.getInstituteId())
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
                .build();
    }
}
