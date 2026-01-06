package com.gradeloop.ivas.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a viva assessment session.
 */
@Entity
@Table(name = "viva_sessions")
public class VivaSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "assignment_id", nullable = false)
    private String assignmentId;

    @Column(name = "course_id", nullable = false)
    private String courseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.NOT_STARTED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(name = "competency_level")
    private CompetencyLevel competencyLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("turnNumber ASC")
    private List<ConversationTurn> conversationTurns = new ArrayList<>();

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private Assessment assessment;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Constructors
    public VivaSession() {
    }

    public VivaSession(String studentId, String assignmentId, String courseId) {
        this.studentId = studentId;
        this.assignmentId = assignmentId;
        this.courseId = courseId;
        this.status = SessionStatus.NOT_STARTED;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getCourseId() {
        return courseId;
    }

    public void setCourseId(String courseId) {
        this.courseId = courseId;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public CompetencyLevel getCompetencyLevel() {
        return competencyLevel;
    }

    public void setCompetencyLevel(CompetencyLevel competencyLevel) {
        this.competencyLevel = competencyLevel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<ConversationTurn> getConversationTurns() {
        return conversationTurns;
    }

    public void setConversationTurns(List<ConversationTurn> conversationTurns) {
        this.conversationTurns = conversationTurns;
    }

    public void addConversationTurn(ConversationTurn turn) {
        conversationTurns.add(turn);
        turn.setSession(this);
    }

    public void removeConversationTurn(ConversationTurn turn) {
        conversationTurns.remove(turn);
        turn.setSession(null);
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
        if (assessment != null) {
            assessment.setSession(this);
        }
    }
}
