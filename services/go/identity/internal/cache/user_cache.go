package cache

// Future enhancement: Redis cache layer example

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/redis/go-redis/v9"
)

type UserCache struct {
	client *redis.Client
	ttl    time.Duration
}

func NewUserCache(client *redis.Client) *UserCache {
	return &UserCache{
		client: client,
		ttl:    15 * time.Minute, // Cache user data for 15 minutes
	}
}

func (c *UserCache) GetUser(email string) (*core.User, error) {
	key := fmt.Sprintf("user:email:%s", email)
	val, err := c.client.Get(context.Background(), key).Result()
	if err == redis.Nil {
		return nil, nil // Cache miss
	}
	if err != nil {
		return nil, err
	}
	
	var user core.User
	err = json.Unmarshal([]byte(val), &user)
	return &user, err
}

func (c *UserCache) SetUser(user *core.User) error {
	key := fmt.Sprintf("user:email:%s", user.Email)
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}
	
	return c.client.Set(context.Background(), key, data, c.ttl).Err()
}

func (c *UserCache) DeleteUser(email string) error {
	key := fmt.Sprintf("user:email:%s", email)
	return c.client.Del(context.Background(), key).Err()
}