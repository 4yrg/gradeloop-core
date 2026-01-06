package com.gradeloop.user.controller;

import com.gradeloop.user.dto.CreateStudentRequest;
import com.gradeloop.user.dto.CreateUserResponse;
import com.gradeloop.user.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
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

    @GetMapping("/template")
    public ResponseEntity<String> getTemplate() {
        String template = "fullName,email\nJohn Doe,john.student@example.com";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students_template.csv")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(template);
    }

    @GetMapping
    public ResponseEntity<List<CreateUserResponse>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CreateUserResponse> updateStudent(@PathVariable Long id,
            @RequestBody com.gradeloop.user.dto.UpdateStudentRequest request) {
        return ResponseEntity.ok(studentService.updateStudent(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreateUserResponse> getStudent(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }
}
