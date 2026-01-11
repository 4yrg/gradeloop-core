package com.gradeloop.keystrokeanalytics.repository;

import com.gradeloop.keystrokeanalytics.entity.KeystrokeEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface KeystrokeEventRepository extends JpaRepository<KeystrokeEvent, Long> {

    /**
     * Find all keystroke events for a specific student and assignment
     */
    List<KeystrokeEvent> findByStudentIdAndAssignmentIdOrderByEventTimestampDesc(
        String studentId,
        String assignmentId
    );

    /**
     * Find keystroke events for a specific student and assignment with pagination
     */
    Page<KeystrokeEvent> findByStudentIdAndAssignmentId(
        String studentId,
        String assignmentId,
        Pageable pageable
    );

    /**
     * Find all keystroke events for a specific student
     */
    List<KeystrokeEvent> findByStudentIdOrderByEventTimestampDesc(String studentId);

    /**
     * Find all keystroke events for a specific assignment
     */
    List<KeystrokeEvent> findByAssignmentIdOrderByEventTimestampDesc(String assignmentId);

    /**
     * Find all keystroke events for a specific course
     */
    List<KeystrokeEvent> findByCourseIdOrderByEventTimestampDesc(String courseId);

    /**
     * Find suspicious events (high risk score)
     */
    List<KeystrokeEvent> findByRiskScoreGreaterThanOrderByEventTimestampDesc(BigDecimal threshold);

    /**
     * Find suspicious events for a specific assignment
     */
    List<KeystrokeEvent> findByAssignmentIdAndRiskScoreGreaterThanOrderByEventTimestampDesc(
        String assignmentId,
        BigDecimal threshold
    );

    /**
     * Find events within a time range
     */
    List<KeystrokeEvent> findByEventTimestampBetweenOrderByEventTimestampDesc(
        LocalDateTime start,
        LocalDateTime end
    );

    /**
     * Get average confidence for a student on an assignment
     */
    @Query("SELECT AVG(e.confidenceLevel) FROM KeystrokeEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    BigDecimal getAverageConfidence(@Param("studentId") String studentId,
                                   @Param("assignmentId") String assignmentId);

    /**
     * Get average risk score for a student on an assignment
     */
    @Query("SELECT AVG(e.riskScore) FROM KeystrokeEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    BigDecimal getAverageRiskScore(@Param("studentId") String studentId,
                                  @Param("assignmentId") String assignmentId);

    /**
     * Count suspicious events for a student on an assignment
     */
    @Query("SELECT COUNT(e) FROM KeystrokeEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId " +
           "AND e.riskScore > :threshold")
    Long countSuspiciousEvents(@Param("studentId") String studentId,
                              @Param("assignmentId") String assignmentId,
                              @Param("threshold") BigDecimal threshold);

    /**
     * Get min and max confidence for a student on an assignment
     */
    @Query("SELECT MIN(e.confidenceLevel), MAX(e.confidenceLevel) FROM KeystrokeEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    List<Object[]> getConfidenceRange(@Param("studentId") String studentId,
                                     @Param("assignmentId") String assignmentId);

    /**
     * Get first and last event timestamps
     */
    @Query("SELECT MIN(e.eventTimestamp), MAX(e.eventTimestamp) FROM KeystrokeEvent e " +
           "WHERE e.studentId = :studentId AND e.assignmentId = :assignmentId")
    List<Object[]> getTimeRange(@Param("studentId") String studentId,
                               @Param("assignmentId") String assignmentId);
}
