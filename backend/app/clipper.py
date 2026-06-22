import subprocess
import os
from dotenv import load_dotenv
from app.exceptions import VideoClipError

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
CLIPS_DIR    = os.path.join(STORAGE_PATH, "clips")


def clip_video(
    input_path: str,
    clip_id: str,
    start_time: float,
    end_time: float,
    progress_callback=None,
) -> str:
    """
    Cut a section from a video file using FFmpeg.

    Raises:
        VideoClipError — FFmpeg failed or produced no output
    """
    os.makedirs(CLIPS_DIR, exist_ok=True)

    output_path = os.path.join(CLIPS_DIR, f"{clip_id}.mp4")
    duration    = end_time - start_time

    if not os.path.exists(input_path):
        raise VideoClipError(f"Source video not found at {input_path}")

    if progress_callback:
        progress_callback(50, "Clipping video")

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-i", input_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-crf", "23",
        "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        stderr = result.stderr or ""
        # Identify specific FFmpeg failure reasons
        if "no such file" in stderr.lower():
            raise VideoClipError("Source video file not found by FFmpeg.")
        if "invalid data" in stderr.lower() or "moov atom not found" in stderr.lower():
            raise VideoClipError("Source video file is corrupted or incomplete.")
        if "encoder" in stderr.lower() or "codec" in stderr.lower():
            raise VideoClipError("Video encoding failed. The format may be unsupported.")
        raise VideoClipError(f"FFmpeg clip failed: {stderr[-300:]}")

    if not os.path.exists(output_path):
        raise VideoClipError("FFmpeg ran successfully but produced no output file.")

    # Sanity check — output should be non-empty
    if os.path.getsize(output_path) < 1024:
        raise VideoClipError("Generated clip is too small — something went wrong during clipping.")

    if progress_callback:
        progress_callback(80, "Clip generated successfully")

    return output_path
