package com.gradeloop.institute.dto;

import lombok.Data;

@Data
public class UpdateCourseRequest {
    private String name;
    private String code;
    private Integer credits;
    // description/department not editable per prompt requirements? "Editable
    // fields: name, code, credits".
    // I'll stick to requirement. (Strict)
}
