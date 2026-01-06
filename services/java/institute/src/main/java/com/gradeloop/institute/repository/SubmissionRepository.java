package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByUserId(UUID userId);
    
    List<Submission> findByAssignment_Id(UUID assignmentId);
    
    Optional<Submission> findByUserIdAndAssignment_Id(UUID userId, UUID assignmentId);
}
