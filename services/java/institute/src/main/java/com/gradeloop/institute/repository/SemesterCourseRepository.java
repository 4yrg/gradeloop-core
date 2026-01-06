package com.gradeloop.institute.repository;

import com.gradeloop.institute.model.SemesterCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SemesterCourseRepository extends JpaRepository<SemesterCourse, UUID> {
    List<SemesterCourse> findBySemesterId(UUID semesterId);

    List<SemesterCourse> findByCourseId(UUID courseId);

    boolean existsBySemesterIdAndCourseId(UUID semesterId, UUID courseId);

    void deleteBySemesterIdAndCourseId(UUID semesterId, UUID courseId);
}
