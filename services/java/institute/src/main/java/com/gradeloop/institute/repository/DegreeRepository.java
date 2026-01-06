package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Degree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DegreeRepository extends JpaRepository<Degree, UUID> {
    boolean existsByCodeAndInstituteId(String code, UUID instituteId);

    List<Degree> findAllByInstituteId(UUID instituteId);
}
