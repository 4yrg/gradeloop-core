package com.gradeloop.ivas.dto.response;

import com.gradeloop.ivas.model.ConversationTurn;
import com.gradeloop.ivas.model.Speaker;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for a conversation turn.
 */
public record ConversationTurnResponse(
    UUID id,
    Integer turnNumber,
    Speaker speaker,
    String transcript,
    String audioUrl,
    Instant timestamp
) {
    public static ConversationTurnResponse from(ConversationTurn turn) {
        return new ConversationTurnResponse(
            turn.getId(),
            turn.getTurnNumber(),
            turn.getSpeaker(),
            turn.getTranscript(),
            turn.getAudioUrl(),
            turn.getTimestamp()
        );
    }
}
