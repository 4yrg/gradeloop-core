package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaConceptMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VivaConceptMasteryRepository extends JpaRepository<VivaConceptMastery, UUID> {
    
    List<VivaConceptMastery> findBySessionId(UUID sessionId);
}
