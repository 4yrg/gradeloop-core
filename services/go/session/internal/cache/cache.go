package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gradeloop/session-service/internal/config"
	"github.com/gradeloop/session-service/internal/models"
	"github.com/redis/go-redis/v9"
)

type Cache struct {
	Client *redis.Client
}

func New(cfg *config.Config) (*Cache, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	return &Cache{Client: rdb}, nil
}

const (
	SessionKeyPrefix = "session:"
	UserSessionsKey  = "user:sessions:"
)

type CachedSession struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	UserRole  string    `json:"user_role"`
	UserAgent string    `json:"user_agent"`
	ClientIP  string    `json:"client_ip"`
	ExpiresAt time.Time `json:"expires_at"`
}

func sessionKey(id string) string {
	return SessionKeyPrefix + id
}

func userSessionsKey(userID string) string {
	return UserSessionsKey + userID
}

// SetSession caches the session and adds it to the user's set of sessions
func (c *Cache) SetSession(ctx context.Context, session *models.Session, ttl time.Duration) error {
	cached := CachedSession{
		ID:        session.ID,
		UserID:    session.UserID,
		UserRole:  session.UserRole,
		UserAgent: session.UserAgent,
		ClientIP:  session.ClientIP,
		ExpiresAt: session.ExpiresAt,
	}

	data, err := json.Marshal(cached)
	if err != nil {
		return err
	}

	pipe := c.Client.Pipeline()
	pipe.Set(ctx, sessionKey(session.ID), data, ttl)
	// Add session ID to user's set. Since Redis doesn't automatically expire set members when the key expires,
	// we might accumulate stale IDs.
	// Optimization: We could set TTL on the set, but refreshing one session would need to account for that.
	// For now, we just add. A background job could clean this up, or we remove partially when finding they are gone.
	pipe.SAdd(ctx, userSessionsKey(session.UserID), session.ID)
	// Set expiration for the user set as well (e.g., max session life) to avoid permagarbage if user disappears
	pipe.Expire(ctx, userSessionsKey(session.UserID), ttl+24*time.Hour)

	_, err = pipe.Exec(ctx)
	return err
}

// GetSession retrieves the session from cache
func (c *Cache) GetSession(ctx context.Context, id string) (*CachedSession, error) {
	val, err := c.Client.Get(ctx, sessionKey(id)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Not found
		}
		return nil, err
	}

	var session CachedSession
	if err := json.Unmarshal([]byte(val), &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// DeleteSession removes session from cache and from user's list
func (c *Cache) DeleteSession(ctx context.Context, id, userID string) error {
	pipe := c.Client.Pipeline()
	pipe.Del(ctx, sessionKey(id))
	pipe.SRem(ctx, userSessionsKey(userID), id)
	_, err := pipe.Exec(ctx)
	return err
}

// DeleteUserSessions removes all sessions for a user
func (c *Cache) DeleteUserSessions(ctx context.Context, userID string) error {
	// 1. Get all session IDs
	sessionIDs, err := c.Client.SMembers(ctx, userSessionsKey(userID)).Result()
	if err != nil {
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	keysToDelete := make([]string, len(sessionIDs)+1)
	for i, id := range sessionIDs {
		keysToDelete[i] = sessionKey(id)
	}
	keysToDelete[len(sessionIDs)] = userSessionsKey(userID)

	return c.Client.Del(ctx, keysToDelete...).Err()
}
