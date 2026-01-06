package com.gradeloop.auth.repository;

import com.gradeloop.auth.model.InstituteAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InstituteAdminRepository extends JpaRepository<InstituteAdmin, UUID> {
    Optional<InstituteAdmin> findByUserId(Long userId);
}
