package com.gradeloop.user.repository;

import com.gradeloop.user.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<UserProfile> findByAuthUserId(Long authUserId);
}
