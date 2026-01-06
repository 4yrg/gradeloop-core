package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaRubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VivaRubricRepository extends JpaRepository<VivaRubric, UUID> {
    
    List<VivaRubric> findByAssignmentId(UUID assignmentId);
    
    Optional<VivaRubric> findByAssignmentIdAndStatus(UUID assignmentId, VivaRubric.RubricStatus status);
    
    boolean existsByAssignmentId(UUID assignmentId);
}
