import yt_dlp
import subprocess
import os
from app.config import settings

VIDEOS_DIR     = os.path.join(settings.storage_path, "videos")
CLIPS_DIR      = os.path.join(settings.storage_path, "clips")
THUMBNAILS_DIR = os.path.join(settings.storage_path, "thumbnails")


def process_clip(clip_id: str, url: str, start_time: float, end_time: float) -> dict:
    """
    Full synchronous pipeline:
    download → clip → thumbnail
    Returns dict with title, clip_path, thumbnail_path
    """
    os.makedirs(VIDEOS_DIR,     exist_ok=True)
    os.makedirs(CLIPS_DIR,      exist_ok=True)
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    # ── Step 1: Download ──────────────────────────────────────────────────────
    video_path   = os.path.join(VIDEOS_DIR, f"{clip_id}.%(ext)s")
    ydl_opts = {
        "format":              "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl":             video_path,
        "quiet":               True,
        "no_warnings":         True,
        "merge_output_format": "mp4",
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except yt_dlp.utils.DownloadError as e:
        msg = str(e).lower()
        if any(k in msg for k in ["private", "not available", "removed", "suspended"]):
            raise RuntimeError("This video is private or unavailable.")
        raise RuntimeError("Could not download video. The post may have been deleted.")

    # Locate downloaded file
    actual_path = os.path.join(VIDEOS_DIR, f"{clip_id}.mp4")
    if not os.path.exists(actual_path):
        for f in os.listdir(VIDEOS_DIR):
            if f.startswith(clip_id):
                actual_path = os.path.join(VIDEOS_DIR, f)
                break

    if not os.path.exists(actual_path):
        raise RuntimeError("Download succeeded but output file was not found.")

    title    = info.get("title", "Untitled")
    duration = end_time - start_time

    # ── Step 2: Clip ──────────────────────────────────────────────────────────
    clip_path = os.path.join(CLIPS_DIR, f"{clip_id}.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-i", actual_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-crf", "23",
        "-movflags", "+faststart",
        clip_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg clip failed: {result.stderr[-200:]}")

    # ── Step 3: Thumbnail ─────────────────────────────────────────────────────
    thumbnail_path = os.path.join(THUMBNAILS_DIR, f"{clip_id}.jpg")
    thumb_cmd = [
        "ffmpeg", "-y",
        "-ss", str(duration / 2),
        "-i", clip_path,
        "-vframes", "1",
        "-q:v", "2",
        "-vf", "scale=640:-1",
        thumbnail_path,
    ]
    subprocess.run(thumb_cmd, capture_output=True, text=True)

    # Clean up source video to save disk space on free tier
    try:
        os.remove(actual_path)
    except Exception:
        pass

    return {
        "title":          title,
        "clip_path":      clip_path,
        "thumbnail_path": thumbnail_path if os.path.exists(thumbnail_path) else None,
    }
