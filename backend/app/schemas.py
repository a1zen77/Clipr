from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime
import re


# ─── Job Schemas ─────────────────────────────────────────────────────────────

class JobResponse(BaseModel):
    id: str
    clip_id: str
    status: str
    progress: int
    message: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Clip Schemas ─────────────────────────────────────────────────────────────

class ClipCreate(BaseModel):
    url: str
    start_time: float
    end_time: float

    @field_validator("url")
    @classmethod
    def validate_and_clean_url(cls, v: str) -> str:
        v = v.strip()

        # Strip tracking params (e.g. ?s=20&t=abc)
        v = re.sub(r"\?.*$", "", v)

        # Must be x.com or twitter.com
        if not re.search(r"(x\.com|twitter\.com)/\S+/status/\d+", v):
            raise ValueError(
                "Must be a valid X/Twitter post URL "
                "(e.g. https://x.com/user/status/123456789)"
            )
        return v

    @field_validator("start_time")
    @classmethod
    def validate_start_time(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Start time cannot be negative")
        if v > 86400:
            raise ValueError("Start time is unrealistically large")
        return round(v, 2)

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: float) -> float:
        if v < 0:
            raise ValueError("End time cannot be negative")
        if v > 86400:
            raise ValueError("End time is unrealistically large")
        return round(v, 2)

    @model_validator(mode="after")
    def validate_time_range(self) -> "ClipCreate":
        start = self.start_time
        end   = self.end_time

        if end <= start:
            raise ValueError("End time must be greater than start time")

        duration = end - start
        if duration < 1:
            raise ValueError("Clip must be at least 1 second long")
        if duration > 300:
            raise ValueError(
                f"Clip duration is {int(duration)}s — maximum is 300s (5 minutes)"
            )
        return self


class ClipResponse(BaseModel):
    id: str
    url: str
    start_time: float
    end_time: float
    title: Optional[str] = None
    duration: Optional[float] = None
    thumbnail_path: Optional[str] = None
    clip_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None

    model_config = {"from_attributes": True}


class ClipListResponse(BaseModel):
    total: int
    clips: list[ClipResponse]
