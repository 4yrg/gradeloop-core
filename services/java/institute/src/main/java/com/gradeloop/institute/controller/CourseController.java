package com.gradeloop.institute.controller;

import com.gradeloop.institute.dto.CourseResponse;
import com.gradeloop.institute.dto.CreateCourseRequest;
import com.gradeloop.institute.dto.UpdateCourseRequest;
import com.gradeloop.institute.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping("/institutes/{instituteId}/courses")
    public ResponseEntity<CourseResponse> createCourse(@PathVariable UUID instituteId,
            @RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.createCourse(instituteId, request)));
    }

    @GetMapping("/institutes/{instituteId}/courses")
    public ResponseEntity<List<CourseResponse>> getAllCourses(@PathVariable UUID instituteId) {
        return ResponseEntity.ok(courseService.getAllCourses(instituteId).stream()
                .map(CourseResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.getCourse(id)));
    }

    @PatchMapping("/courses/{id}")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable UUID id,
            @RequestBody UpdateCourseRequest request) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.updateCourse(id, request)));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/courses/{id}/classes/{classId}")
    public ResponseEntity<CourseResponse> enrollClass(@PathVariable UUID id, @PathVariable UUID classId) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.enrollClass(id, classId)));
    }

    @DeleteMapping("/courses/{id}/classes/{classId}")
    public ResponseEntity<CourseResponse> removeClass(@PathVariable UUID id, @PathVariable UUID classId) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.removeClass(id, classId)));
    }

    @PostMapping("/courses/{id}/instructors")
    public ResponseEntity<CourseResponse> addInstructors(@PathVariable UUID id,
            @RequestBody List<Long> instructorIds) {
        return ResponseEntity.ok(CourseResponse.fromEntity(courseService.addInstructors(id, instructorIds)));
    }
}
