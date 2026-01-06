package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findByCourse_Id(UUID courseId);
}
