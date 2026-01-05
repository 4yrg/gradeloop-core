package com.gradeloop.institute.dto;

import lombok.Data;

@Data
public class UpdateInstituteRequest {
    private String name;
    private String domain;
    private String contactEmail;
}
