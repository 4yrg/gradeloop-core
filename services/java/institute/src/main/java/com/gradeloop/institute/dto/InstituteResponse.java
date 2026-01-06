package com.gradeloop.institute.dto;

import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.model.InstituteAdminRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstituteResponse {

    private UUID id;
    private String name;
    private String code;
    private String domain;
    private String contactEmail;
    private Boolean isActive;
    private List<AdminInfo> admins;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminInfo {
        private UUID id;
        private Long userId;
        private InstituteAdminRole role;
    }

    public static InstituteResponse fromEntity(Institute institute) {
        List<AdminInfo> adminInfos = institute.getAdmins() != null
                ? institute.getAdmins().stream()
                        .map(admin -> AdminInfo.builder()
                                .id(admin.getId())
                                .userId(admin.getUserId())
                                .role(admin.getRole())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        return InstituteResponse.builder()
                .id(institute.getId())
                .name(institute.getName())
                .code(institute.getCode())
                .domain(institute.getDomain())
                .contactEmail(institute.getContactEmail())
                .isActive(institute.getIsActive())
                .admins(adminInfos)
                .build();
    }
}
