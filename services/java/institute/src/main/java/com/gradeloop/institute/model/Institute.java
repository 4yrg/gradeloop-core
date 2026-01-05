package com.gradeloop.institute.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "institutes")
public class Institute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private String ownerEmail;

    @ElementCollection
    @CollectionTable(name = "institute_admins", joinColumns = @JoinColumn(name = "institute_id"))
    @Column(name = "email")
    private List<String> adminEmails;
}
