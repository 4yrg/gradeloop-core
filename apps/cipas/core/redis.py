import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class RedisClient:
    client: redis.Redis | None = None

    @classmethod
    async def connect(cls):
        cls.client = redis.from_url(REDIS_URL, decode_responses=True)
        # Test connection
        await cls.client.ping()

    @classmethod
    async def close(cls):
        if cls.client:
            await cls.client.close()

    @classmethod
    def get_client(cls) -> redis.Redis:
        if not cls.client:
            raise RuntimeError("Redis client is not initialized. Call 'connect' on startup.")
        return cls.client

async def get_redis() -> redis.Redis:
    """Dependency to get redis client"""
    return RedisClient.get_client()
