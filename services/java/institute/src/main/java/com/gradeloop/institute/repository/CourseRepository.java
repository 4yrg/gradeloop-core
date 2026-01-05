package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    List<Course> findAllByInstituteId(UUID instituteId);

    boolean existsByCodeAndInstituteId(String code, UUID instituteId);
}
