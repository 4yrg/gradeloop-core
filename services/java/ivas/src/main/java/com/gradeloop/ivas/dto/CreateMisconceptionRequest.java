package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaMisconception;
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
public class CreateMisconceptionRequest {
    private String misconceptionText;
    
    @Builder.Default
    private List<String> detectionKeywords = new ArrayList<>();
    
    private String correction;
    private String resourceUrl;
    private VivaMisconception.Severity severity;
}
