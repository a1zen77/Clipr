import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.middleware import AgeLimit, TimeLimit, Retries
import os
from dotenv import load_dotenv

load_dotenv("../.env")

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

broker = RedisBroker(
    url=redis_url,
    middleware=[
        AgeLimit(),
        TimeLimit(),
        Retries(max_retries=3),
    ]
)

dramatiq.set_broker(broker)
