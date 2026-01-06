package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {
    private String title; // Question title/name
    private String description;
    private Integer points;
    private Integer weight; // Question weight/contribution (required)
    private Integer timeLimit; // Time limit in milliseconds (optional)
    private Integer memoryLimit; // Memory limit in MB (optional)
}
