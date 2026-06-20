import sys
import os

# Ensure app/ is importable
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv("../.env")

# Import broker setup first, then tasks
from app.worker_setup import broker
from app.tasks import process_clip_job

if __name__ == "__main__":
    print("[worker] Starting Dramatiq worker...")
    print(f"[worker] Listening on queue: clips")
