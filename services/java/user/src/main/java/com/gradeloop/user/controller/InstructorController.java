package com.gradeloop.user.controller;

import com.gradeloop.user.dto.CreateInstructorRequest;
import com.gradeloop.user.dto.CreateUserResponse;
import com.gradeloop.user.service.InstructorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/instructors")
@RequiredArgsConstructor
public class InstructorController {

    private final InstructorService instructorService;

    @PostMapping
    public ResponseEntity<CreateUserResponse> createInstructor(@RequestBody CreateInstructorRequest request) {
        return ResponseEntity.ok(instructorService.createInstructor(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<CreateUserResponse>> createInstructorsBulk(
            @RequestBody List<CreateInstructorRequest> requests) {
        return ResponseEntity.ok(instructorService.createInstructorsBulk(requests));
    }
}
