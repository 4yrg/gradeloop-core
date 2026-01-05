package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Institute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstituteRepository extends JpaRepository<Institute, Long> {
    boolean existsByName(String name);
}
