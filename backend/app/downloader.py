import yt_dlp
import os
from dotenv import load_dotenv
from app.exceptions import (
    VideoUnavailableError,
    VideoDownloadError,
    NoVideoStreamError,
    VideoTooLongError,
)

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
VIDEOS_DIR   = os.path.join(STORAGE_PATH, "videos")
MAX_SOURCE_DURATION = 1800  # 30 minutes — reject anything longer


def download_video(url: str, clip_id: str, progress_callback=None) -> dict:
    """
    Download a video from an X/Twitter URL using yt-dlp.

    Raises:
        VideoUnavailableError  — video is private, deleted, or geo-blocked
        NoVideoStreamError     — post contains no video
        VideoTooLongError      — source video exceeds MAX_SOURCE_DURATION
        VideoDownloadError     — any other yt-dlp failure
    """
    os.makedirs(VIDEOS_DIR, exist_ok=True)
    output_path = os.path.join(VIDEOS_DIR, f"{clip_id}.%(ext)s")

    def ydl_progress_hook(d):
        if progress_callback is None:
            return
        if d["status"] == "downloading":
            raw = d.get("_percent_str", "0%").strip()
            try:
                percent = float(raw.replace("%", "").strip())
                mapped  = int(10 + (percent * 0.30))
                progress_callback(mapped, f"Downloading video: {raw}")
            except ValueError:
                pass
        elif d["status"] == "finished":
            progress_callback(40, "Download complete, preparing to clip")

    ydl_opts = {
        "format":               "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl":              output_path,
        "progress_hooks":       [ydl_progress_hook],
        "quiet":                True,
        "no_warnings":          True,
        "merge_output_format":  "mp4",
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)

    except yt_dlp.utils.DownloadError as e:
        msg = str(e).lower()
        if any(k in msg for k in ["private", "not available", "removed", "suspended", "geo"]):
            raise VideoUnavailableError(
                "This video is private, deleted, or not available in your region."
            ) from e
        if "no video" in msg or "no media" in msg:
            raise NoVideoStreamError(
                "This post doesn't appear to contain a video."
            ) from e
        raise VideoDownloadError(
            f"Could not download video. The post may have been deleted or is unsupported."
        ) from e

    except Exception as e:
        raise VideoDownloadError(f"Unexpected download error: {str(e)}") from e

    # Validate source duration
    duration = info.get("duration", 0) or 0
    if duration > MAX_SOURCE_DURATION:
        raise VideoTooLongError(
            f"Source video is {int(duration / 60)} minutes long. Maximum is {MAX_SOURCE_DURATION // 60} minutes."
        )

    # Validate video stream exists
    if not info.get("formats") and not info.get("url"):
        raise NoVideoStreamError("No video stream found in this post.")

    # Locate the output file
    actual_path = os.path.join(VIDEOS_DIR, f"{clip_id}.mp4")
    if not os.path.exists(actual_path):
        for f in os.listdir(VIDEOS_DIR):
            if f.startswith(clip_id):
                actual_path = os.path.join(VIDEOS_DIR, f)
                break

    if not os.path.exists(actual_path):
        raise VideoDownloadError("Download appeared to succeed but output file was not found.")

    return {
        "file_path": actual_path,
        "title":     info.get("title", "Untitled"),
        "duration":  duration,
    }
