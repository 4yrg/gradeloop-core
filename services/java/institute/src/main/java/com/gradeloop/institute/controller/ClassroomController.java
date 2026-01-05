package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.ClassroomResponse;
import com.gradeloop.institute.dto.CreateClassroomRequest;
import com.gradeloop.institute.dto.UpdateClassroomRequest;
import com.gradeloop.institute.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping("/institutes/{instituteId}/classes")
    public ResponseEntity<ClassroomResponse> createClassroom(@PathVariable UUID instituteId,
            @RequestBody CreateClassroomRequest request) {
        return ResponseEntity.ok(ClassroomResponse.fromEntity(classroomService.createClassroom(instituteId, request)));
    }

    @GetMapping("/institutes/{instituteId}/classes")
    public ResponseEntity<List<ClassroomResponse>> getAllClassrooms(@PathVariable UUID instituteId) {
        return ResponseEntity.ok(classroomService.getAllClassrooms(instituteId).stream()
                .map(ClassroomResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<ClassroomResponse> getClassroom(@PathVariable UUID id) {
        return ResponseEntity.ok(ClassroomResponse.fromEntity(classroomService.getClassroom(id)));
    }

    @PatchMapping("/classes/{id}")
    public ResponseEntity<ClassroomResponse> updateClassroom(@PathVariable UUID id,
            @RequestBody UpdateClassroomRequest request) {
        return ResponseEntity.ok(ClassroomResponse.fromEntity(classroomService.updateClassroom(id, request)));
    }

    @PostMapping("/classes/{id}/students")
    public ResponseEntity<ClassroomResponse> addStudentsToClassroom(@PathVariable UUID id,
            @RequestBody List<Long> studentIds) {
        return ResponseEntity.ok(ClassroomResponse.fromEntity(classroomService.addStudents(id, studentIds)));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable UUID id) {
        classroomService.deleteClassroom(id);
        return ResponseEntity.noContent().build();
    }
}
