package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaTranscript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VivaTranscriptRepository extends JpaRepository<VivaTranscript, UUID> {
    
    List<VivaTranscript> findBySessionIdOrderByTimestampAsc(UUID sessionId);
    
    List<VivaTranscript> findByQuestionIdOrderByTimestampAsc(UUID questionId);
}
