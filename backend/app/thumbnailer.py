import subprocess
import os
from dotenv import load_dotenv

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
THUMBNAILS_DIR = os.path.join(STORAGE_PATH, "thumbnails")


def generate_thumbnail(
    clip_path: str,
    clip_id: str,
    duration: float,
    progress_callback=None,
) -> str:
    """
    Extract a single frame from the middle of a clip as a JPEG thumbnail.

    Args:
        clip_path:         Path to the generated clip file
        clip_id:           Used to name the output file uniquely
        duration:          Duration of the clip in seconds
        progress_callback: Optional fn(percent: int, message: str)

    Returns:
        Path to the generated thumbnail file
    """
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)

    output_path = os.path.join(THUMBNAILS_DIR, f"{clip_id}.jpg")

    # Grab a frame from the middle of the clip
    seek_to = duration / 2

    if progress_callback:
        progress_callback(88, "Generating thumbnail")

    cmd = [
        "ffmpeg",
        "-y",                        # overwrite if exists
        "-ss", str(seek_to),         # seek to middle of clip
        "-i", clip_path,             # input clip
        "-vframes", "1",             # extract exactly one frame
        "-q:v", "2",                 # JPEG quality (2–5 is good, 2 = best)
        "-vf", "scale=640:-1",       # resize to 640px wide, keep aspect ratio
        output_path,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"FFmpeg thumbnail failed:\n{result.stderr}"
        )

    if not os.path.exists(output_path):
        raise FileNotFoundError(
            f"FFmpeg did not produce thumbnail at {output_path}"
        )

    if progress_callback:
        progress_callback(95, "Thumbnail generated successfully")

    return output_path
