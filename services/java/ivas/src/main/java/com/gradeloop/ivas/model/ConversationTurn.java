package com.gradeloop.ivas.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a single turn in the viva conversation.
 */
@Entity
@Table(name = "conversation_turns")
public class ConversationTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private VivaSession session;

    @Column(name = "turn_number", nullable = false)
    private Integer turnNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Speaker speaker;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    // Constructors
    public ConversationTurn() {
    }

    public ConversationTurn(VivaSession session, Integer turnNumber, Speaker speaker, String transcript) {
        this.session = session;
        this.turnNumber = turnNumber;
        this.speaker = speaker;
        this.transcript = transcript;
        this.timestamp = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VivaSession getSession() {
        return session;
    }

    public void setSession(VivaSession session) {
        this.session = session;
    }

    public Integer getTurnNumber() {
        return turnNumber;
    }

    public void setTurnNumber(Integer turnNumber) {
        this.turnNumber = turnNumber;
    }

    public Speaker getSpeaker() {
        return speaker;
    }

    public void setSpeaker(Speaker speaker) {
        this.speaker = speaker;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
