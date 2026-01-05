package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSemesterRequest {
    private String name;
    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive; // Use wrapper for partial updates (null means no change)
}
