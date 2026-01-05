package com.gradeloop.institute.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateClassroomRequest {
    private String name;
    private List<Long> studentIds;
}
