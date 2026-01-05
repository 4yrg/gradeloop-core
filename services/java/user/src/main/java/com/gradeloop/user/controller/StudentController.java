package com.gradeloop.user.controller;

import com.gradeloop.user.dto.CreateStudentRequest;
import com.gradeloop.user.dto.CreateUserResponse;
import com.gradeloop.user.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public ResponseEntity<CreateUserResponse> createStudent(@RequestBody CreateStudentRequest request) {
        return ResponseEntity.ok(studentService.createStudent(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<CreateUserResponse>> createStudentsBulk(
            @RequestBody List<CreateStudentRequest> requests) {
        return ResponseEntity.ok(studentService.createStudentsBulk(requests));
    }
}
