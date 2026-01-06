package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {
    private UUID id;
    private String title; // Question title/name
    private String description;
    private Integer points;
    private Integer weight; // Question weight/contribution
    private Integer timeLimit; // Time limit in milliseconds
    private Integer memoryLimit; // Memory limit in MB
    private List<TestCaseResponse> testCases;
}
