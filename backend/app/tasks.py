import dramatiq
from app.worker_setup import broker
from app.database import SessionLocal
from app.models import Clip, Job
from app.downloader import download_video
from app.clipper import clip_video
from app.thumbnailer import generate_thumbnail


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
    Main processing actor.
    Full pipeline: download → clip → thumbnail → done
    """
    db = SessionLocal()
    try:
        # ── Fetch records ─────────────────────────────────────────────────
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            print(f"[worker] ❌ Job {job_id} not found")
            return

        clip = db.query(Clip).filter(Clip.id == job.clip_id).first()
        if not clip:
            update_job(db, job, "failed", 0, "Clip record not found")
            return

        print(f"[worker] ▶ Starting job {job_id} for clip {clip.id}")
        update_job(db, job, "processing", 10, "Starting download")

        # ── Step 1: Download ──────────────────────────────────────────────
        def on_progress(percent: int, message: str):
            update_job(db, job, "processing", percent, message)

        result = download_video(
            url=clip.url,
            clip_id=clip.id,
            progress_callback=on_progress,
        )

        clip.video_path = result["file_path"]
        clip.title = result["title"]
        db.commit()
        db.refresh(clip)

        print(f"[worker] ✅ Download complete: {result['file_path']}")
        update_job(db, job, "processing", 40, "Download complete, starting clip")

        # ── Step 2: Clip ──────────────────────────────────────────────────
        clip_path = clip_video(
            input_path=clip.video_path,
            clip_id=clip.id,
            start_time=clip.start_time,
            end_time=clip.end_time,
            progress_callback=on_progress,
        )

        clip.clip_path = clip_path
        db.commit()
        db.refresh(clip)

        print(f"[worker] ✅ Clip complete: {clip_path}")
        update_job(db, job, "processing", 80, "Clip complete, generating thumbnail")

        # ── Step 3: Thumbnail ─────────────────────────────────────────────
        clip_duration = clip.end_time - clip.start_time

        thumbnail_path = generate_thumbnail(
            clip_path=clip_path,
            clip_id=clip.id,
            duration=clip_duration,
            progress_callback=on_progress,
        )

        clip.thumbnail_path = thumbnail_path
        db.commit()
        db.refresh(clip)

        print(f"[worker] ✅ Thumbnail complete: {thumbnail_path}")

        # ── Done ──────────────────────────────────────────────────────────
        update_job(db, job, "done", 100, "Clip ready for download")
        print(f"[worker] 🎉 Job {job_id} complete!")

    except Exception as e:
        print(f"[worker] ❌ Job {job_id} failed: {e}")
        db.rollback()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                update_job(db, job, "failed", 0, "Processing failed", str(e))
        except Exception:
            pass
    finally:
        db.close()
