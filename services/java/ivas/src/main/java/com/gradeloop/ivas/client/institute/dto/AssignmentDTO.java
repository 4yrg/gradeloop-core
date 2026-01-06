package com.gradeloop.ivas.client.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {
    private UUID id;
    private String title;
    private String description;
    private UUID courseId;
    private String courseName;
    private LocalDateTime dueDate;
    private Integer totalMarks;
    private String difficulty;
    private Boolean isPublished;
    private LocalDateTime createdAt;
}
