package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Institute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InstituteRepository extends JpaRepository<Institute, UUID> {
    boolean existsByCode(String code);
}
