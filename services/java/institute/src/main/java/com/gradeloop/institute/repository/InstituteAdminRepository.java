package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.InstituteAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InstituteAdminRepository extends JpaRepository<InstituteAdmin, UUID> {
    List<InstituteAdmin> findByInstituteId(UUID instituteId);
}
