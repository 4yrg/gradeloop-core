package com.gradeloop.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;

    @Column(nullable = false, unique = true)
    private Long authUserId;

    private String userId; // Nullable as per requirement, maybe for student ID etc.

    @Column(nullable = false)
    private String role; // Storing role string as requested

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;
    private String createdBy;

    private java.time.LocalDateTime updatedAt;
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        if (updatedAt == null) updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
