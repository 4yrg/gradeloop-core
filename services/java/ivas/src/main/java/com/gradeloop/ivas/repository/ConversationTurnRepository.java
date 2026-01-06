package com.gradeloop.ivas.repository;

import com.gradeloop.ivas.model.ConversationTurn;
import com.gradeloop.ivas.model.Speaker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ConversationTurn entity operations.
 */
@Repository
public interface ConversationTurnRepository extends JpaRepository<ConversationTurn, UUID> {

    /**
     * Find all turns for a session ordered by turn number.
     */
    List<ConversationTurn> findBySessionIdOrderByTurnNumberAsc(UUID sessionId);

    /**
     * Find turns by session and speaker.
     */
    List<ConversationTurn> findBySessionIdAndSpeaker(UUID sessionId, Speaker speaker);

    /**
     * Find the latest turn for a session.
     */
    Optional<ConversationTurn> findTopBySessionIdOrderByTurnNumberDesc(UUID sessionId);

    /**
     * Count turns in a session.
     */
    long countBySessionId(UUID sessionId);

    /**
     * Count turns by speaker in a session.
     */
    long countBySessionIdAndSpeaker(UUID sessionId, Speaker speaker);

    /**
     * Find the maximum turn number for a session.
     */
    @Query("SELECT COALESCE(MAX(t.turnNumber), 0) FROM ConversationTurn t WHERE t.session.id = :sessionId")
    Integer findMaxTurnNumberBySessionId(@Param("sessionId") UUID sessionId);

    /**
     * Delete all turns for a session.
     */
    void deleteBySessionId(UUID sessionId);
}
