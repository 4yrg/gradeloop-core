package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.Degree;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class DegreeResponse {
    private UUID id;
    private String name;
    private String code;
    private Integer credits;
    private String description;
    private UUID instituteId;

    public static DegreeResponse fromEntity(Degree degree) {
        return DegreeResponse.builder()
                .id(degree.getId())
                .name(degree.getName())
                .code(degree.getCode())
                .credits(degree.getCredits())
                .description(degree.getDescription())
                .instituteId(degree.getInstitute() != null ? degree.getInstitute().getId() : null)
                .build();
    }
}
