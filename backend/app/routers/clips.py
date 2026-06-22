import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Clip, Job
from app.schemas import ClipCreate, ClipResponse, ClipListResponse
from app.tasks import process_clip_job

router = APIRouter(prefix="/clips", tags=["clips"])


# ─── POST /clips ──────────────────────────────────────────────────────────────

@router.post("", response_model=ClipResponse, status_code=201)
def create_clip(payload: ClipCreate, db: Session = Depends(get_db)):
    """
    Submit a new clip request and dispatch it to the worker queue.
    If an identical request (same URL + timestamps) already exists,
    return the existing clip instead of re-processing.
    """

    # ── Duplicate guard ───────────────────────────────────────────────────
    existing = (
        db.query(Clip)
        .filter(
            Clip.url        == payload.url,
            Clip.start_time == payload.start_time,
            Clip.end_time   == payload.end_time,
        )
        .order_by(Clip.created_at.desc())
        .first()
    )

    if existing:
        job = existing.job
        # Only reuse if the job succeeded or is still in progress
        if job and job.status in ("done", "pending", "processing"):
            print(f"[api] ♻ Returning existing clip {existing.id} (status: {job.status})")
            return existing

    # ── Create new clip record ────────────────────────────────────────────
    clip = Clip(
        id=str(uuid.uuid4()),
        url=payload.url,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration=payload.end_time - payload.start_time,
    )
    db.add(clip)
    db.flush()

    # ── Create associated job record ──────────────────────────────────────
    job = Job(
        id=str(uuid.uuid4()),
        clip_id=clip.id,
        status="pending",
        progress=0,
        message="Job queued, waiting to start",
    )
    db.add(job)
    db.commit()
    db.refresh(clip)

    # ── Dispatch to worker queue ──────────────────────────────────────────
    process_clip_job.send(job.id)
    print(f"[api] ✅ Dispatched job {job.id} for clip {clip.id}")

    return clip


# ─── GET /clips ───────────────────────────────────────────────────────────────

@router.get("", response_model=ClipListResponse)
def list_clips(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List all clip requests, newest first."""
    total = db.query(Clip).count()
    clips = (
        db.query(Clip)
        .order_by(Clip.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"total": total, "clips": clips}


# ─── GET /clips/{clip_id} ─────────────────────────────────────────────────────

@router.get("/{clip_id}", response_model=ClipResponse)
def get_clip(clip_id: str, db: Session = Depends(get_db)):
    """Get a single clip and its current job status."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip


# ─── DELETE /clips/{clip_id} ──────────────────────────────────────────────────

@router.delete("/{clip_id}", status_code=204)
def delete_clip(clip_id: str, db: Session = Depends(get_db)):
    """Delete a clip and its associated job."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    db.delete(clip)
    db.commit()
