package com.gradeloop.user.service;

import com.gradeloop.user.dto.UserProfileResponse;
import com.gradeloop.user.repository.InstituteAdminRepository;
import com.gradeloop.user.repository.InstructorRepository;
import com.gradeloop.user.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final StudentRepository studentRepository;
    private final InstructorRepository instructorRepository;
    private final InstituteAdminRepository instituteAdminRepository;

    public UserProfileResponse getUserProfileById(Long userDbId) {
        // Try to find in students
        var student = studentRepository.findById(userDbId);
        if (student.isPresent()) {
            var s = student.get();
            return UserProfileResponse.builder()
                    .id(s.getId())
                    .email(s.getEmail())
                    .fullName(s.getFullName())
                    .role("STUDENT")
                    .instituteId(s.getInstituteId())
                    .build();
        }

        // Try to find in instructors
        var instructor = instructorRepository.findById(userDbId);
        if (instructor.isPresent()) {
            var i = instructor.get();
            return UserProfileResponse.builder()
                    .id(i.getId())
                    .email(i.getEmail())
                    .fullName(i.getFullName())
                    .role("INSTRUCTOR")
                    .instituteId(i.getInstituteId())
                    .build();
        }

        // Try to find in institute admins
        var admin = instituteAdminRepository.findById(userDbId);
        if (admin.isPresent()) {
            var a = admin.get();
            return UserProfileResponse.builder()
                    .id(a.getId())
                    .email(a.getEmail())
                    .fullName(a.getFullName())
                    .role("INSTITUTE_ADMIN")
                    .instituteId(a.getInstituteId())
                    .build();
        }

        throw new RuntimeException("User profile not found for ID: " + userDbId);
    }
}
