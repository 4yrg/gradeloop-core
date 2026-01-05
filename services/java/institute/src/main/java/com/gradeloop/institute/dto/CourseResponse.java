package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.Course;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CourseResponse {
    private UUID id;
    private String name;
    private String code;
    private Integer credits;
    private String department;
    private String description;
    private UUID instituteId;
    private List<Long> instructorIds;
    private List<UUID> classroomIds;

    public static CourseResponse fromEntity(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .code(course.getCode())
                .credits(course.getCredits())
                .department(course.getDepartment())
                .description(course.getDescription())
                .instituteId(course.getInstitute() != null ? course.getInstitute().getId() : null)
                .instructorIds(course.getInstructorIds())
                .classroomIds(course.getClassroomIds())
                .build();
    }
}
