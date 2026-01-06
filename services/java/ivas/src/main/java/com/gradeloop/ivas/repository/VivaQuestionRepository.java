package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VivaQuestionRepository extends JpaRepository<VivaQuestion, UUID> {
    
    List<VivaQuestion> findBySessionIdOrderBySequenceAsc(UUID sessionId);
    
    int countBySessionId(UUID sessionId);
}
