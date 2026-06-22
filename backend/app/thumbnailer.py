import subprocess
import os
from dotenv import load_dotenv
from app.exceptions import ThumbnailError

load_dotenv("../.env")

STORAGE_PATH    = os.getenv("STORAGE_PATH", "./storage")
THUMBNAILS_DIR  = os.path.join(STORAGE_PATH, "thumbnails")


def generate_thumbnail(
    clip_path: str,
    clip_id: str,
    duration: float,
    progress_callback=None,
) -> str:
    """
    Extract a single frame from the middle of a clip as a JPEG thumbnail.

    Raises:
        ThumbnailError — FFmpeg failed or produced no output
    """
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    output_path = os.path.join(THUMBNAILS_DIR, f"{clip_id}.jpg")
    seek_to     = max(0, duration / 2)

    if not os.path.exists(clip_path):
        raise ThumbnailError(f"Clip file not found at {clip_path}")

    if progress_callback:
        progress_callback(88, "Generating thumbnail")

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(seek_to),
        "-i", clip_path,
        "-vframes", "1",
        "-q:v", "2",
        "-vf", "scale=640:-1",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        # Thumbnail failure is non-fatal — log but don't crash the job
        print(f"[thumbnailer] ⚠ FFmpeg thumbnail warning: {result.stderr[-200:]}")
        return None

    if not os.path.exists(output_path):
        print(f"[thumbnailer] ⚠ Thumbnail file not produced for clip {clip_id}")
        return None

    if progress_callback:
        progress_callback(95, "Thumbnail generated")

    return output_path
