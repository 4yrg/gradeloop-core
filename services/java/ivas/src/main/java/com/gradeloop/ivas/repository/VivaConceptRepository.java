package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaConcept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VivaConceptRepository extends JpaRepository<VivaConcept, UUID> {
    
    List<VivaConcept> findByRubricIdOrderByDisplayOrderAsc(UUID rubricId);
}
