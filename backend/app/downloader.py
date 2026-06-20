import yt_dlp
import os
from dotenv import load_dotenv

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
VIDEOS_DIR = os.path.join(STORAGE_PATH, "videos")


def download_video(url: str, clip_id: str, progress_callback=None) -> dict:
    """
    Download a video from an X/Twitter URL using yt-dlp.

    Args:
        url:               The X/Twitter post URL
        clip_id:           Used to name the output file uniquely
        progress_callback: Optional fn(percent: int, message: str) called during download

    Returns:
        dict with keys: file_path, title, duration
    """
    os.makedirs(VIDEOS_DIR, exist_ok=True)

    output_path = os.path.join(VIDEOS_DIR, f"{clip_id}.%(ext)s")

    def ydl_progress_hook(d):
        if progress_callback is None:
            return
        if d["status"] == "downloading":
            raw = d.get("_percent_str", "0%").strip()
            try:
                # yt-dlp percent string looks like " 45.3%" — clean it
                percent = float(raw.replace("%", "").strip())
                # Map 0–100% download → 10–40% overall job progress
                mapped = int(10 + (percent * 0.30))
                progress_callback(mapped, f"Downloading video: {raw}")
            except ValueError:
                pass
        elif d["status"] == "finished":
            progress_callback(40, "Download complete, preparing to clip")

    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": output_path,
        "progress_hooks": [ydl_progress_hook],
        "quiet": True,
        "no_warnings": True,
        "merge_output_format": "mp4",
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    # yt-dlp replaces %(ext)s in the template — find the actual file
    actual_path = os.path.join(VIDEOS_DIR, f"{clip_id}.mp4")

    # Fallback: search for any file starting with clip_id
    if not os.path.exists(actual_path):
        for f in os.listdir(VIDEOS_DIR):
            if f.startswith(clip_id):
                actual_path = os.path.join(VIDEOS_DIR, f)
                break

    if not os.path.exists(actual_path):
        raise FileNotFoundError(
            f"Downloaded file not found for clip {clip_id} in {VIDEOS_DIR}"
        )

    return {
        "file_path": actual_path,
        "title": info.get("title", "Untitled"),
        "duration": info.get("duration", 0),
    }
