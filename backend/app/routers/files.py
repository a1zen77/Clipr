import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")

router = APIRouter(prefix="/files", tags=["files"])


# ─── GET /files/clips/{clip_id} ───────────────────────────────────────────────

@router.get("/clips/{clip_id}")
def download_clip(clip_id: str):
    """Download the generated MP4 clip."""
    path = os.path.join(STORAGE_PATH, "clips", f"{clip_id}.mp4")

    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail="Clip file not found. It may still be processing."
        )

    return FileResponse(
        path=path,
        media_type="video/mp4",
        filename=f"clip-{clip_id}.mp4",
    )


# ─── GET /files/thumbnails/{clip_id} ─────────────────────────────────────────

@router.get("/thumbnails/{clip_id}")
def get_thumbnail(clip_id: str):
    """Serve the thumbnail image for a clip."""
    path = os.path.join(STORAGE_PATH, "thumbnails", f"{clip_id}.jpg")

    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail="Thumbnail not found. It may still be processing."
        )

    return FileResponse(
        path=path,
        media_type="image/jpeg",
        filename=f"thumbnail-{clip_id}.jpg",
    )


# ─── GET /files/videos/{clip_id} ─────────────────────────────────────────────

@router.get("/videos/{clip_id}")
def get_original_video(clip_id: str):
    """Serve the original downloaded video (for debugging)."""
    path = os.path.join(STORAGE_PATH, "videos", f"{clip_id}.mp4")

    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail="Original video not found."
        )

    return FileResponse(
        path=path,
        media_type="video/mp4",
        filename=f"original-{clip_id}.mp4",
    )
