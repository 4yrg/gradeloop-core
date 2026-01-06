package com.gradeloop.ivas.client.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private Integer credits;
    private UUID semesterId;
    private String semesterName;
    private Long instituteId;
}
