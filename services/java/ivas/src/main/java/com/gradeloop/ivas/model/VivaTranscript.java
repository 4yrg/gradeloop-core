package com.gradeloop.ivas.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "viva_transcripts", indexes = {
    @Index(name = "idx_transcript_session", columnList = "session_id, timestamp")
})
public class VivaTranscript {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private VivaSession session;

    @Column(name = "question_id")
    private UUID questionId; // Which question this transcript belongs to

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Speaker speaker;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "duration_ms")
    private Integer durationMs; // Duration of the speech in milliseconds

    // STT confidence score
    @Column(name = "confidence")
    private Double confidence;

    // Audio segment reference
    @Column(name = "audio_segment_path")
    private String audioSegmentPath;

    @Column(name = "audio_start_time")
    private Integer audioStartTime; // Start time in seconds from session start

    @Column(name = "audio_end_time")
    private Integer audioEndTime;

    public enum Speaker {
        AI, STUDENT
    }
}
