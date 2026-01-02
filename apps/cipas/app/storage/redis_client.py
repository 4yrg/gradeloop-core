import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL")

class RedisClient:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = redis.from_url(REDIS_URL, decode_responses=True)
        return cls._instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None

async def get_redis():
    return RedisClient.get_instance()
