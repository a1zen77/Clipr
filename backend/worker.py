import dramatiq
from dramatiq.brokers.redis import RedisBroker
import os
from dotenv import load_dotenv

load_dotenv("../.env")

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
broker = RedisBroker(url=redis_url)
dramatiq.set_broker(broker)

@dramatiq.actor
def process_clip(job_id: str):
    # Placeholder — real logic comes in Phase 3
    print(f"[worker] Received job: {job_id}")

if __name__ == "__main__":
    print("[worker] Worker started, waiting for jobs...")
