package com.gradeloop.institute.dto;

import lombok.Data;

@Data
public class UpdateDegreeRequest {
    private String name;
    private String code;
    private Integer credits;
    private String description;
}
