package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTestCaseRequest {
    private String input;
    private String expectedOutput;
    private Boolean isHidden;
    private String visibility; // Test case visibility
    private Integer marks; // Absolute marks/points for this test case (optional)
}
