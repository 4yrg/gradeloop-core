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
        // 1. Check if student already exists
        if (studentRepository.findByEmail(request.getEmail()).isPresent()) {
            Student existingStudent = studentRepository.findByEmail(request.getEmail()).get();
            return CreateUserResponse.builder()
                    .id(existingStudent.getId())
                    .userId(existingStudent.getId())
                    .email(existingStudent.getEmail())
                    .fullName(existingStudent.getFullName())
                    .role("student")
                    .instituteId(existingStudent.getInstituteId())
                    .build();
        }

        // 2. Create Student Profile FIRST
        Student student = Student.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .instituteId(request.getInstituteId())
                .build();
        student = studentRepository.save(student);

        // 3. Create Auth User with reference to student ID
        CreateAuthUserResponse authUser = null;
        try {
            authUser = authServiceClient.createUser(request.getEmail(), "STUDENT", student.getId());
            student.setAuthUserId(authUser.getAuthUserId());
            student = studentRepository.save(student);
        } catch (Exception e) {
            // Rollback: Delete student if auth creation fails
            studentRepository.deleteById(student.getId());
            throw new RuntimeException("Failed to create auth user: " + e.getMessage(), e);
        }

        return CreateUserResponse.builder()
                .id(student.getId())
                .userId(student.getId())
                .email(student.getEmail())
                .fullName(student.getFullName())
                .role("student")
                .instituteId(student.getInstituteId())
                .build();
    }

    @Transactional
    public List<CreateUserResponse> createStudentsBulk(List<CreateStudentRequest> requests) {
        List<CreateUserResponse> responses = new ArrayList<>();

        // Process each request individually with proper rollback
        for (CreateStudentRequest req : requests) {
            try {
                // Check if student already exists
                if (studentRepository.findByEmail(req.getEmail()).isPresent()) {
                    Student existingStudent = studentRepository.findByEmail(req.getEmail()).get();
                    responses.add(CreateUserResponse.builder()
                            .id(existingStudent.getId())
                            .userId(existingStudent.getId())
                            .email(existingStudent.getEmail())
                            .fullName(existingStudent.getFullName())
                            .role("student")
                            .instituteId(existingStudent.getInstituteId())
                            .build());
                    continue;
                }

                // Create Student Profile FIRST
                Student student = Student.builder()
                        .email(req.getEmail())
                        .fullName(req.getFullName())
                        .instituteId(req.getInstituteId())
                        .build();
                student = studentRepository.save(student);

                // Create Auth User with reference to student ID
                try {
                    CreateAuthUserResponse authUser = authServiceClient.createUser(
                            req.getEmail(), "STUDENT", student.getId());
                    student.setAuthUserId(authUser.getAuthUserId());
                    student = studentRepository.save(student);

                    responses.add(CreateUserResponse.builder()
                            .id(student.getId())
                            .userId(student.getId())
                            .email(student.getEmail())
                            .fullName(student.getFullName())
                            .role("student")
                            .instituteId(student.getInstituteId())
                            .build());
                } catch (Exception e) {
                    // Rollback: Delete student if auth creation fails
                    studentRepository.deleteById(student.getId());
                    throw e;
                }

            } catch (Exception e) {
                responses.add(CreateUserResponse.builder()
                        .email(req.getEmail())
                        .error("Error creating student: " + e.getMessage())
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

    public List<CreateUserResponse> getStudentsByIds(List<Long> ids) {
        return studentRepository.findAllById(ids).stream()
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
}
