package com.gradeloop.ivas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRubricRequest {
    private UUID assignmentId;
    private String name;
    private String description;
    
    @Builder.Default
    private List<CreateConceptRequest> concepts = new ArrayList<>();
}
