package com.gradeloop.institute.service;

import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.repository.InstituteRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstituteService {

    private final InstituteRepository instituteRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateInstituteRequest {
        private String name;
        private String contactEmail;
        private String ownerEmail;
        private List<String> adminEmails;
    }

    public Institute createInstitute(CreateInstituteRequest request) {
        if (instituteRepository.existsByName(request.getName())) {
            throw new RuntimeException("Institute with name " + request.getName() + " already exists.");
        }

        Institute institute = Institute.builder()
                .name(request.getName())
                .contactEmail(request.getContactEmail())
                .ownerEmail(request.getOwnerEmail())
                .adminEmails(request.getAdminEmails())
                .build();

        return instituteRepository.save(institute);
    }
}
