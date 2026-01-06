package com.gradeloop.institute.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "institutes")
public class Institute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String domain;

    @Column(nullable = false)
    private String contactEmail;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @com.fasterxml.jackson.annotation.JsonManagedReference
    @OneToMany(mappedBy = "institute", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InstituteAdmin> admins;

    @Column(updatable = false)
    private Long createdBy;

    @Column(updatable = false, nullable = false)
    private java.time.LocalDateTime createdAt;

    private Long updatedBy;

    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
