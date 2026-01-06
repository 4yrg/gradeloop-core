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
    private final com.gradeloop.institute.client.UserServiceClient userServiceClient;

    @Transactional
    public Institute createInstitute(CreateInstituteRequest request, Long createdBy) {
        if (instituteRepository.existsByCode(request.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Institute with code " + request.getCode() + " already exists");
        }

        Institute institute = Institute.builder()
                .name(request.getName())
                .code(request.getCode())
                .domain(request.getDomain())
                .contactEmail(request.getContactEmail())
                .createdBy(createdBy)
                .build();

        Institute savedInstitute = instituteRepository.save(institute);

        if (request.getAdmins() != null) {
            List<InstituteAdmin> admins = request.getAdmins().stream().map(adminReq -> {
                // Call Auth Service to create user
                CreateAuthUserResponse authUser = authServiceClient.createInstituteAdmin(adminReq.getEmail(),
                        adminReq.getName());

                // Create institute admin entry in user-service
                try {
                    userServiceClient.createInstituteAdmin(
                            adminReq.getEmail(),
                            adminReq.getName(),
                            savedInstitute.getId().toString(),
                            authUser.getAuthUserId(),
                            adminReq.getRole() != null ? adminReq.getRole().toString() : "OWNER");
                } catch (Exception e) {
                    System.err.println("Failed to create institute admin in user-service: " + e.getMessage());
                }

                return InstituteAdmin.builder()
                        .institute(savedInstitute)
                        .userId(authUser.getAuthUserId())
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
    public Institute deactivateInstitute(UUID id) {
        Institute institute = getInstitute(id);
        institute.setIsActive(false);
        return instituteRepository.save(institute);
    }

    @Transactional
    public Institute activateInstitute(UUID id) {
        Institute institute = getInstitute(id);
        institute.setIsActive(true);
        return instituteRepository.save(institute);
    }

    @Transactional
    public void deleteInstitute(UUID id) {
        Institute institute = getInstitute(id);

        // Get all admins for this institute
        List<InstituteAdmin> admins = instituteAdminRepository.findByInstituteId(id);

        // Delete all users from auth service
        for (InstituteAdmin admin : admins) {
            try {
                authServiceClient.deleteUser(admin.getUserId());
            } catch (Exception e) {
                // Log error but continue with deletion
                System.err.println("Failed to delete user " + admin.getUserId() + ": " + e.getMessage());
            }
        }

        // Delete the institute (cascade will handle institute_admins)
        instituteRepository.deleteById(id);
    }

    public Institute getInstituteByUserId(Long userId) {
        InstituteAdmin admin = instituteAdminRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No institute found for user ID: " + userId));
        return admin.getInstitute();
    }
}
