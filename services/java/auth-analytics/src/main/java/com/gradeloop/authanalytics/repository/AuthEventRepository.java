package com.gradeloop.authanalytics.repository;

import com.gradeloop.authanalytics.entity.AuthEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuthEventRepository extends JpaRepository<AuthEvent, Long> {

    /**
     * Find all auth events for a specific student and assignment
     */
    List<AuthEvent> findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(
        String studentId,
        String assignmentId
    );

    /**
     * Find all auth events for a specific student
     */
    List<AuthEvent> findByStudentIdOrderByEventTimestampDesc(String studentId);

    /**
     * Find all auth events for a specific assignment
     */
    List<AuthEvent> findByAssignmentIdOrderByEventTimestampDesc(String assignmentId);

    /**
     * Find all auth events for a specific course
     */
    List<AuthEvent> findByCourseIdOrderByEventTimestampDesc(String courseId);

    /**
     * Find suspicious events (high risk score)
     */
    List<AuthEvent> findByRiskScoreGreaterThanOrderByEventTimestampDesc(BigDecimal threshold);

    /**
     * Find suspicious events for a specific assignment
     */
    List<AuthEvent> findByAssignmentIdAndRiskScoreGreaterThanOrderByEventTimestampDesc(
        String assignmentId,
        BigDecimal threshold
    );

    /**
     * Find events within a time range
     */
    List<AuthEvent> findByEventTimestampBetweenOrderByEventTimestampDesc(
        LocalDateTime start,
        LocalDateTime end
    );

    /**
     * Get average confidence for a student on an assignment
     */
    @Query("SELECT AVG(e.confidenceLevel) FROM AuthEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    BigDecimal getAverageConfidence(@Param("studentId") String studentId,
                                   @Param("assignmentId") String assignmentId);

    /**
     * Get average risk score for a student on an assignment
     */
    @Query("SELECT AVG(e.riskScore) FROM AuthEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    BigDecimal getAverageRiskScore(@Param("studentId") String studentId,
                                  @Param("assignmentId") String assignmentId);

    /**
     * Count suspicious events for a student on an assignment
     */
    @Query("SELECT COUNT(e) FROM AuthEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId " +
           "AND e.riskScore > :threshold")
    Long countSuspiciousEvents(@Param("studentId") String studentId,
                              @Param("assignmentId") String assignmentId,
                              @Param("threshold") BigDecimal threshold);

    /**
     * Get min and max confidence for a student on an assignment
     */
    @Query("SELECT MIN(e.confidenceLevel), MAX(e.confidenceLevel) FROM AuthEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    List<Object[]> getConfidenceRange(@Param("studentId") String studentId,
                                     @Param("assignmentId") String assignmentId);

    /**
     * Get first and last event timestamps
     */
    @Query("SELECT MIN(e.eventTimestamp), MAX(e.eventTimestamp) FROM AuthEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    List<Object[]> getTimeRange(@Param("studentId") String studentId,
                               @Param("assignmentId") String assignmentId);
}
