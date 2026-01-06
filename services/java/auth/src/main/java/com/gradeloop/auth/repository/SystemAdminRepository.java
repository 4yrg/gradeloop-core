package com.gradeloop.auth.repository;

import com.gradeloop.auth.model.SystemAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SystemAdminRepository extends JpaRepository<SystemAdmin, UUID> {
    Optional<SystemAdmin> findByUserId(Long userId);
}
