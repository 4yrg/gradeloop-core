package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/session/internal/core"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type SessionCache struct {
	client *redis.Client
}

func NewSessionCache(client *redis.Client) *SessionCache {
	return &SessionCache{client: client}
}

func (c *SessionCache) sessionKey(id uuid.UUID) string {
	return fmt.Sprintf("session:%s", id.String())
}

func (c *SessionCache) userSessionsKey(userID string) string {
	return fmt.Sprintf("user_sessions:%s", userID)
}

func (c *SessionCache) Set(ctx context.Context, session *core.Session) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	ttl := time.Until(session.ExpiresAt)
	if ttl <= 0 {
		return nil // Expired, don't cache
	}

	pipeline := c.client.Pipeline()
	pipeline.Set(ctx, c.sessionKey(session.ID), data, ttl)
	pipeline.SAdd(ctx, c.userSessionsKey(session.UserID), session.ID.String())
	pipeline.Expire(ctx, c.userSessionsKey(session.UserID), ttl) // Extend user set TTL
	_, err = pipeline.Exec(ctx)
	return err
}

func (c *SessionCache) Get(ctx context.Context, id uuid.UUID) (*core.Session, error) {
	data, err := c.client.Get(ctx, c.sessionKey(id)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Cache miss
		}
		return nil, err
	}

	var session core.Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

func (c *SessionCache) Delete(ctx context.Context, id uuid.UUID) error {
	session, err := c.Get(ctx, id)
	if err != nil || session == nil {
		return c.client.Del(ctx, c.sessionKey(id)).Err() // Just delete key if can't finding it
	}

	pipeline := c.client.Pipeline()
	pipeline.Del(ctx, c.sessionKey(id))
	pipeline.SRem(ctx, c.userSessionsKey(session.UserID), id.String())
	_, err = pipeline.Exec(ctx)
	return err
}

func (c *SessionCache) DeleteAllForUser(ctx context.Context, userID string) error {
	// Get all session IDs for the user
	sessionIDs, err := c.client.SMembers(ctx, c.userSessionsKey(userID)).Result()
	if err != nil {
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	pipeline := c.client.Pipeline()
	for _, idStr := range sessionIDs {
		pipeline.Del(ctx, fmt.Sprintf("session:%s", idStr))
	}
	pipeline.Del(ctx, c.userSessionsKey(userID))
	_, err = pipeline.Exec(ctx)
	return err
}
