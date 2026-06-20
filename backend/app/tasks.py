import dramatiq
from app.worker_setup import broker  # ensures broker is configured
from app.database import SessionLocal
from app.models import Job


def update_job(db, job: Job, status: str, progress: int, message: str, error: str = None):
    """Helper to update job status in the database."""
    job.status = status
    job.progress = progress
    job.message = message
    job.error = error
    db.commit()
    db.refresh(job)


@dramatiq.actor(queue_name="clips", max_retries=2)
def process_clip_job(job_id: str):
    """
    Main processing actor. Picks up a job from the queue and runs the
    full pipeline: download → clip → thumbnail.
    Placeholder for now — full logic added in Steps 3–6.
    """
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            print(f"[worker] ❌ Job {job_id} not found in database")
            return

        print(f"[worker] ✅ Picked up job {job_id} for clip {job.clip_id}")
        update_job(db, job, "processing", 10, "Job received by worker")

        # Placeholder — Steps 3–6 will fill this in
        print(f"[worker] Job {job_id} acknowledged. Processing pipeline coming in next steps.")

    except Exception as e:
        print(f"[worker] ❌ Error processing job {job_id}: {e}")
        if db:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                update_job(db, job, "failed", 0, "Unexpected error", str(e))
    finally:
        db.close()
