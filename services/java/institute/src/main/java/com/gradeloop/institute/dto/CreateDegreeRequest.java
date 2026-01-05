package com.gradeloop.institute.dto;

import lombok.Data;

@Data
public class CreateDegreeRequest {
    private String name;
    private String code;
    private Integer credits;
    private String description;
}
