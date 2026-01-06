package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.VivaSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VivaSessionRepository extends JpaRepository<VivaSession, UUID> {
    
    List<VivaSession> findByAssignmentId(UUID assignmentId);
    
    Page<VivaSession> findByAssignmentId(UUID assignmentId, Pageable pageable);
    
    List<VivaSession> findByStudentIdAndAssignmentId(Long studentId, UUID assignmentId);
    
    Optional<VivaSession> findByStudentIdAndAssignmentIdAndStatus(
            Long studentId, UUID assignmentId, VivaSession.SessionStatus status);
    
    int countByAssignmentId(UUID assignmentId);
    
    int countByAssignmentIdAndStatus(UUID assignmentId, VivaSession.SessionStatus status);
    
    int countByAssignmentIdAndPassFail(UUID assignmentId, VivaSession.PassFail passFail);
    
    @Query("SELECT COUNT(s) FROM VivaSession s WHERE s.assignmentId = :assignmentId AND s.flagged = true")
    int countFlaggedByAssignmentId(@Param("assignmentId") UUID assignmentId);
    
    @Query("SELECT AVG(s.overallScore) FROM VivaSession s WHERE s.assignmentId = :assignmentId AND s.status = 'COMPLETED'")
    Double getAverageScoreByAssignmentId(@Param("assignmentId") UUID assignmentId);
    
    @Query("SELECT AVG(s.timeSpent) FROM VivaSession s WHERE s.assignmentId = :assignmentId AND s.status = 'COMPLETED'")
    Double getAverageDurationByAssignmentId(@Param("assignmentId") UUID assignmentId);
    
    List<VivaSession> findByAssignmentIdAndFlaggedTrue(UUID assignmentId);
    
    @Query("SELECT s FROM VivaSession s WHERE s.assignmentId = :assignmentId ORDER BY s.completedAt DESC")
    List<VivaSession> findRecentByAssignmentId(@Param("assignmentId") UUID assignmentId, Pageable pageable);
}
