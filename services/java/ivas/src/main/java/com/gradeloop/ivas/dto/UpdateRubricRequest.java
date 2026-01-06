package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaRubric;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRubricRequest {
    private String name;
    private String description;
    private String version;
    private VivaRubric.RubricStatus status;
    
    @Builder.Default
    private List<UpdateConceptRequest> concepts = new ArrayList<>();
}
