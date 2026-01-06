package com.gradeloop.user.repository;

import com.gradeloop.user.model.InstituteAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstituteAdminRepository extends JpaRepository<InstituteAdmin, Long> {
    Optional<InstituteAdmin> findByEmail(String email);

    Optional<InstituteAdmin> findByAuthUserId(Long authUserId);
}
