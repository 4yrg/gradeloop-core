package com.gradeloop.ivas.dto;

import com.gradeloop.ivas.model.VivaMisconception;
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
public class UpdateMisconceptionRequest {
    private UUID id; // null for new, set for existing
    private String misconceptionText;
    
    @Builder.Default
    private List<String> detectionKeywords = new ArrayList<>();
    
    private String correction;
    private String resourceUrl;
    private VivaMisconception.Severity severity;
}
