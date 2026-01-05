package com.gradeloop.institute.dto;

import lombok.Data;

@Data
public class CreateCourseRequest {
    private String name;
    private String code;
    private Integer credits;
    private String department;
    private String description;
}
