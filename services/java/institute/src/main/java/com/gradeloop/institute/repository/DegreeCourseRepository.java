package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.DegreeCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DegreeCourseRepository extends JpaRepository<DegreeCourse, UUID> {
    List<DegreeCourse> findByDegreeId(UUID degreeId);

    List<DegreeCourse> findByCourseId(UUID courseId);

    boolean existsByDegreeIdAndCourseId(UUID degreeId, UUID courseId);

    void deleteByDegreeIdAndCourseId(UUID degreeId, UUID courseId);
}
