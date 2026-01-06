package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VivaConfigurationRepository extends JpaRepository<VivaConfiguration, UUID> {
    
    Optional<VivaConfiguration> findByAssignmentId(UUID assignmentId);
    
    boolean existsByAssignmentId(UUID assignmentId);
}
