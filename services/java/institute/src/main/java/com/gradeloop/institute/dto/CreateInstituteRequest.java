package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.InstituteAdminRole;
import lombok.Data;

import java.util.List;

@Data
public class CreateInstituteRequest {
    private String name;
    private String code;
    private String domain;
    private String contactEmail;

    private List<InstituteAdminRequest> admins;

    @Data
    public static class InstituteAdminRequest {
        private String name;
        private String email;
        private InstituteAdminRole role;
    }
}
