package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.Classroom;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ClassroomResponse {
    private UUID id;
    private String name;
    private UUID instituteId;
    private List<Long> studentIds;

    public static ClassroomResponse fromEntity(Classroom classroom) {
        return ClassroomResponse.builder()
                .id(classroom.getId())
                .name(classroom.getName())
                .instituteId(classroom.getInstitute() != null ? classroom.getInstitute().getId() : null)
                .studentIds(classroom.getStudentIds())
                .build();
    }
}
