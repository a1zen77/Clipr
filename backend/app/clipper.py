import subprocess
import os
from dotenv import load_dotenv

load_dotenv("../.env")

STORAGE_PATH = os.getenv("STORAGE_PATH", "./storage")
CLIPS_DIR = os.path.join(STORAGE_PATH, "clips")


def clip_video(
    input_path: str,
    clip_id: str,
    start_time: float,
    end_time: float,
    progress_callback=None,
) -> str:
    """
    Cut a section from a video file using FFmpeg.

    Args:
        input_path:        Path to the downloaded source video
        clip_id:           Used to name the output file uniquely
        start_time:        Start of the clip in seconds
        end_time:          End of the clip in seconds
        progress_callback: Optional fn(percent: int, message: str)

    Returns:
        Path to the generated clip file
    """
    os.makedirs(CLIPS_DIR, exist_ok=True)

    output_path = os.path.join(CLIPS_DIR, f"{clip_id}.mp4")
    duration = end_time - start_time

    if progress_callback:
        progress_callback(50, "Clipping video with FFmpeg")

    cmd = [
        "ffmpeg",
        "-y",                        # overwrite output if exists
        "-ss", str(start_time),      # seek to start (fast seek)
        "-i", input_path,            # input file
        "-t", str(duration),         # duration to clip
        "-c:v", "libx264",           # re-encode video with H.264
        "-c:a", "aac",               # re-encode audio with AAC
        "-preset", "fast",           # encoding speed vs compression
        "-crf", "23",                # quality (lower = better, 18-28 is good)
        "-movflags", "+faststart",   # optimise for web streaming
        output_path,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"FFmpeg clip failed:\n{result.stderr}"
        )

    if not os.path.exists(output_path):
        raise FileNotFoundError(
            f"FFmpeg did not produce output file at {output_path}"
        )

    if progress_callback:
        progress_callback(80, "Clip generated successfully")

    return output_path
