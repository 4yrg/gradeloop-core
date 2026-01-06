package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.SessionStatus;
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

/**
 * Repository for VivaSession entity operations.
 */
@Repository
public interface VivaSessionRepository extends JpaRepository<VivaSession, UUID> {

    /**
     * Find all sessions for a specific assignment.
     */
    List<VivaSession> findByAssignmentId(String assignmentId);

    /**
     * Find all sessions for a specific assignment with pagination.
     */
    Page<VivaSession> findByAssignmentId(String assignmentId, Pageable pageable);

    /**
     * Find all sessions for a specific student.
     */
    List<VivaSession> findByStudentId(String studentId);

    /**
     * Find all sessions for a specific student and assignment.
     */
    List<VivaSession> findByStudentIdAndAssignmentId(String studentId, String assignmentId);

    /**
     * Find sessions by status.
     */
    List<VivaSession> findByStatus(SessionStatus status);

    /**
     * Find sessions by assignment and status.
     */
    List<VivaSession> findByAssignmentIdAndStatus(String assignmentId, SessionStatus status);

    /**
     * Find sessions by assignment and status with pagination.
     */
    Page<VivaSession> findByAssignmentIdAndStatus(String assignmentId, SessionStatus status, Pageable pageable);

    /**
     * Find sessions for a course.
     */
    List<VivaSession> findByCourseId(String courseId);

    /**
     * Count sessions by assignment and status.
     */
    long countByAssignmentIdAndStatus(String assignmentId, SessionStatus status);

    /**
     * Count all sessions for an assignment.
     */
    long countByAssignmentId(String assignmentId);

    /**
     * Find session with conversation turns eagerly loaded.
     */
    @Query("SELECT s FROM VivaSession s LEFT JOIN FETCH s.conversationTurns WHERE s.id = :id")
    Optional<VivaSession> findByIdWithConversationTurns(@Param("id") UUID id);

    /**
     * Find session with assessment eagerly loaded.
     */
    @Query("SELECT s FROM VivaSession s LEFT JOIN FETCH s.assessment WHERE s.id = :id")
    Optional<VivaSession> findByIdWithAssessment(@Param("id") UUID id);

    /**
     * Find session with all related data eagerly loaded.
     */
    @Query("SELECT DISTINCT s FROM VivaSession s " +
           "LEFT JOIN FETCH s.conversationTurns " +
           "LEFT JOIN FETCH s.assessment " +
           "WHERE s.id = :id")
    Optional<VivaSession> findByIdWithAllData(@Param("id") UUID id);

    /**
     * Calculate average score for an assignment.
     */
    @Query("SELECT AVG(s.score) FROM VivaSession s WHERE s.assignmentId = :assignmentId AND s.score IS NOT NULL")
    Double findAverageScoreByAssignmentId(@Param("assignmentId") String assignmentId);

    /**
     * Check if a student has an active session for an assignment.
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM VivaSession s " +
           "WHERE s.studentId = :studentId AND s.assignmentId = :assignmentId " +
           "AND s.status IN ('NOT_STARTED', 'IN_PROGRESS')")
    boolean hasActiveSession(@Param("studentId") String studentId, @Param("assignmentId") String assignmentId);
}
