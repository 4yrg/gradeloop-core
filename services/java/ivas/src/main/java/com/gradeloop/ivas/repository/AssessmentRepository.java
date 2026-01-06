package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.Assessment;
import com.gradeloop.ivas.model.CompetencyLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Assessment entity operations.
 */
@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    /**
     * Find assessment by session ID.
     */
    Optional<Assessment> findBySessionId(UUID sessionId);

    /**
     * Check if an assessment exists for a session.
     */
    boolean existsBySessionId(UUID sessionId);

    /**
     * Find assessments by competency level.
     */
    List<Assessment> findByCompetencyLevel(CompetencyLevel competencyLevel);

    /**
     * Find assessments with score above threshold.
     */
    List<Assessment> findByOverallScoreGreaterThanEqual(Integer score);

    /**
     * Find assessments with score below threshold.
     */
    List<Assessment> findByOverallScoreLessThan(Integer score);

    /**
     * Calculate average score for sessions in an assignment.
     */
    @Query("SELECT AVG(a.overallScore) FROM Assessment a " +
           "JOIN a.session s WHERE s.assignmentId = :assignmentId AND a.overallScore IS NOT NULL")
    Double findAverageScoreByAssignmentId(@Param("assignmentId") String assignmentId);

    /**
     * Count assessments by competency level for an assignment.
     */
    @Query("SELECT a.competencyLevel, COUNT(a) FROM Assessment a " +
           "JOIN a.session s WHERE s.assignmentId = :assignmentId " +
           "GROUP BY a.competencyLevel")
    List<Object[]> countByCompetencyLevelForAssignment(@Param("assignmentId") String assignmentId);

    /**
     * Find assessment with session eagerly loaded.
     */
    @Query("SELECT a FROM Assessment a JOIN FETCH a.session WHERE a.id = :id")
    Optional<Assessment> findByIdWithSession(@Param("id") UUID id);

    /**
     * Delete assessment by session ID.
     */
    void deleteBySessionId(UUID sessionId);
}
