package com.gradeloop.institute.service;

import com.gradeloop.institute.client.AuthServiceClient;
import com.gradeloop.institute.client.auth.CreateAuthUserResponse;
import com.gradeloop.institute.dto.CreateInstituteRequest;
import com.gradeloop.institute.dto.UpdateInstituteRequest;
import com.gradeloop.institute.model.Institute;
import com.gradeloop.institute.model.InstituteAdmin;
import com.gradeloop.institute.model.InstituteAdminRole;
import com.gradeloop.institute.repository.InstituteAdminRepository;
import com.gradeloop.institute.repository.InstituteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstituteService {

    private final InstituteRepository instituteRepository;
    private final InstituteAdminRepository instituteAdminRepository;
    private final AuthServiceClient authServiceClient;

    @Transactional
    public Institute createInstitute(CreateInstituteRequest request) {
        if (instituteRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Institute with code " + request.getCode() + " already exists");
        }

        Institute institute = Institute.builder()
                .name(request.getName())
                .code(request.getCode())
                .domain(request.getDomain())
                .contactEmail(request.getContactEmail())
                .build();

        Institute savedInstitute = instituteRepository.save(institute);

        if (request.getAdmins() != null) {
            List<InstituteAdmin> admins = request.getAdmins().stream().map(adminReq -> {
                // Call Auth Service to create user
                CreateAuthUserResponse authUser = authServiceClient.createInstituteAdmin(adminReq.getEmail(),
                        adminReq.getName());

                return InstituteAdmin.builder()
                        .institute(savedInstitute)
                        .userId(authUser.getUserId())
                        .role(adminReq.getRole() != null ? adminReq.getRole() : InstituteAdminRole.OWNER)
                        .build();
            }).collect(Collectors.toList());

            instituteAdminRepository.saveAll(admins);
            savedInstitute.setAdmins(admins);
        }

        return savedInstitute;
    }

    public List<Institute> getAllInstitutes() {
        return instituteRepository.findAll();
    }

    public Institute getInstitute(UUID id) {
        return instituteRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institute not found with id: " + id));
    }

    @Transactional
    public Institute updateInstitute(UUID id, UpdateInstituteRequest request) {
        Institute institute = getInstitute(id);

        if (request.getName() != null)
            institute.setName(request.getName());
        if (request.getDomain() != null)
            institute.setDomain(request.getDomain());
        if (request.getContactEmail() != null)
            institute.setContactEmail(request.getContactEmail());

        return instituteRepository.save(institute);
    }

    @Transactional
    public void deleteInstitute(UUID id) {
        if (!instituteRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Institute not found with id: " + id);
        }
        instituteRepository.deleteById(id);
    }
}
