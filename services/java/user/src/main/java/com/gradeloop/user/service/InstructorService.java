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
        if (instructorRepository.findByEmail(request.getEmail()).isPresent()) {
            instructor = instructorRepository.findByEmail(request.getEmail()).get();
        } else {
            instructor = Instructor.builder()
                    .email(request.getEmail())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .instituteId(request.getInstituteId())
                    .department(request.getDepartment())
                    .authUserId(authUser.getUserId())
                    .build();
            instructor = instructorRepository.save(instructor);
        }

        return CreateUserResponse.builder()
                .id(instructor.getId())
                .userId(authUser.getUserId())
                .email(instructor.getEmail())
                .firstName(instructor.getFirstName())
                .lastName(instructor.getLastName())
                .tempPassword(authUser.getTempPassword())
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
                            .firstName(req.getFirstName())
                            .lastName(req.getLastName())
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
                        .firstName(instructor.getFirstName())
                        .lastName(instructor.getLastName())
                        .tempPassword(authUser.getTempPassword())
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
}
