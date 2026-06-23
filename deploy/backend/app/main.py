import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db, init_db
from app.models import Clip
from app.schemas import ClipCreate, ClipResponse, ClipListResponse
from app.processor import process_clip
from app.config import settings

app = FastAPI(title="Clipper MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "clipper-mvp"}


# ── POST /clips ───────────────────────────────────────────────────────────────

@app.post("/clips", response_model=ClipResponse, status_code=201)
def create_clip(payload: ClipCreate, db: Session = Depends(get_db)):
    """
    Synchronously download, clip, and thumbnail a video.
    Request blocks until processing is complete (10-30 seconds).
    """
    clip = Clip(
        id=str(uuid.uuid4()),
        url=payload.url,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration=payload.end_time - payload.start_time,
        status="processing",
    )
    db.add(clip)
    db.commit()

    try:
        result = process_clip(
            clip_id=clip.id,
            url=clip.url,
            start_time=clip.start_time,
            end_time=clip.end_time,
        )
        clip.title          = result["title"]
        clip.clip_path      = result["clip_path"]
        clip.thumbnail_path = result["thumbnail_path"]
        clip.status         = "done"

    except Exception as e:
        clip.status = "failed"
        clip.error  = str(e)

    db.commit()
    db.refresh(clip)
    return clip


# ── GET /clips ────────────────────────────────────────────────────────────────

@app.get("/clips", response_model=ClipListResponse)
def list_clips(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    total = db.query(Clip).count()
    clips = (
        db.query(Clip)
        .order_by(Clip.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"total": total, "clips": clips}


# ── GET /clips/{clip_id} ──────────────────────────────────────────────────────

@app.get("/clips/{clip_id}", response_model=ClipResponse)
def get_clip(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip


# ── DELETE /clips/{clip_id} ───────────────────────────────────────────────────

@app.delete("/clips/{clip_id}", status_code=204)
def delete_clip(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    db.delete(clip)
    db.commit()


# ── GET /files/clips/{clip_id} ────────────────────────────────────────────────

@app.get("/files/clips/{clip_id}")
def download_clip(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip or not clip.clip_path:
        raise HTTPException(status_code=404, detail="Clip file not found")
    return FileResponse(
        path=clip.clip_path,
        media_type="video/mp4",
        filename=f"clip-{clip_id}.mp4",
    )


# ── GET /files/thumbnails/{clip_id} ──────────────────────────────────────────

@app.get("/files/thumbnails/{clip_id}")
def get_thumbnail(clip_id: str, db: Session = Depends(get_db)):
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip or not clip.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(
        path=clip.thumbnail_path,
        media_type="image/jpeg",
        filename=f"thumbnail-{clip_id}.jpg",
    )
