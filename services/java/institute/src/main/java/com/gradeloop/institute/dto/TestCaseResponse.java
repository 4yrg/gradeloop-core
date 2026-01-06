package com.gradeloop.institute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResponse {
    private UUID id;
    private String input;
    private String expectedOutput;
    private boolean isHidden;
    private String visibility; // Test case visibility
    private Integer marks; // Absolute marks/points for this test case
}
