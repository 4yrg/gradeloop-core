package com.gradeloop.user.service;

import com.gradeloop.user.client.AuthServiceClient;
import com.gradeloop.user.client.auth.CreateAuthUserRequest;
import com.gradeloop.user.client.auth.CreateAuthUserResponse;
import com.gradeloop.user.dto.CreateStudentRequest;
import com.gradeloop.user.dto.CreateUserResponse;
import com.gradeloop.user.model.Student;
import com.gradeloop.user.repository.StudentRepository;
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
public class StudentService {

    private final StudentRepository studentRepository;
    private final AuthServiceClient authServiceClient;

    @Transactional
    public CreateUserResponse createStudent(CreateStudentRequest request) {
        // 1. Create User in Auth Service
        CreateAuthUserResponse authUser = authServiceClient.createUser(request.getEmail(), "STUDENT");

        // 2. Save Student Profile
        Student student = null;
        try {
            if (studentRepository.findByEmail(request.getEmail()).isPresent()) {
                student = studentRepository.findByEmail(request.getEmail()).get();
                // Update existing? Or just return?
                // For now, assuming idempotency, we just return existing
            } else {
                student = Student.builder()
                        .email(request.getEmail())
                        .fullName(request.getFullName())
                        .instituteId(request.getInstituteId())
                        .authUserId(authUser.getUserId())
                        .build();
                student = studentRepository.save(student);
            }
        } catch (Exception e) {
            // Rollback Auth User
            authServiceClient.deleteUser(authUser.getUserId());
            throw e;
        }

        return CreateUserResponse.builder()
                .id(student.getId())
                .userId(authUser.getUserId())
                .email(student.getEmail())
                .fullName(student.getFullName())
                .tempPassword(authUser.getTempPassword())
                .instituteId(student.getInstituteId())
                .build();
    }

    @Transactional
    public List<CreateUserResponse> createStudentsBulk(List<CreateStudentRequest> requests) {
        // 1. Prepare Auth Requests
        List<CreateAuthUserRequest> authRequests = requests.stream()
                .map(req -> CreateAuthUserRequest.builder()
                        .email(req.getEmail())
                        .role("STUDENT")
                        .build())
                .collect(Collectors.toList());

        // 2. Call Auth Service Bulk
        List<CreateAuthUserResponse> authResponses = authServiceClient.createUsersBulk(authRequests);

        // Map email to Auth Response
        Map<String, CreateAuthUserResponse> authResponseMap = authResponses.stream()
                .collect(Collectors.toMap(CreateAuthUserResponse::getEmail, Function.identity(),
                        (existing, replacement) -> existing));

        List<CreateUserResponse> responses = new ArrayList<>();

        // 3. Process each request
        for (CreateStudentRequest req : requests) {
            try {
                CreateAuthUserResponse authUser = authResponseMap.get(req.getEmail());
                if (authUser == null) {
                    // Should not happen if Auth Service works correctly
                    responses.add(CreateUserResponse.builder()
                            .email(req.getEmail())
                            .error("Failed to create auth user")
                            .build());
                    continue;
                }

                Student student;
                if (studentRepository.findByEmail(req.getEmail()).isPresent()) {
                    student = studentRepository.findByEmail(req.getEmail()).get();
                } else {
                    student = Student.builder()
                            .email(req.getEmail())
                            .fullName(req.getFullName())
                            .instituteId(req.getInstituteId())
                            .authUserId(authUser.getUserId())
                            .build();
                    student = studentRepository.save(student);
                }

                responses.add(CreateUserResponse.builder()
                        .id(student.getId())
                        .userId(authUser.getUserId())
                        .email(student.getEmail())
                        .fullName(student.getFullName())
                        .tempPassword(authUser.getTempPassword())
                        .instituteId(student.getInstituteId())
                        .build());

            } catch (Exception e) {
                responses.add(CreateUserResponse.builder()
                        .email(req.getEmail())
                        .error("Error creating student profile: " + e.getMessage())
                        .build());
            }
        }

        return responses;
    }

    public List<CreateUserResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(student -> CreateUserResponse.builder()
                        .id(student.getId())
                        .userId(student.getAuthUserId())
                        .email(student.getEmail())
                        .fullName(student.getFullName())
                        .role("student")
                        .instituteId(student.getInstituteId())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CreateUserResponse updateStudent(Long id, com.gradeloop.user.dto.UpdateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (request.getFullName() != null)
            student.setFullName(request.getFullName());

        student = studentRepository.save(student);

        return CreateUserResponse.builder()
                .id(student.getId())
                .userId(student.getAuthUserId())
                .email(student.getEmail())
                .fullName(student.getFullName())
                .instituteId(student.getInstituteId())
                .build();
    }

    @Transactional
    public void deleteStudent(Long id) {
        // ideally delete from auth service too
        studentRepository.deleteById(id);
    }

    public CreateUserResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return CreateUserResponse.builder()
                .id(student.getId())
                .userId(student.getAuthUserId())
                .email(student.getEmail())
                .fullName(student.getFullName())
                .role("student")
                .instituteId(student.getInstituteId())
                .build();
    }
}
