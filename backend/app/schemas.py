from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime


# ─── Job Schemas ────────────────────────────────────────────────────────────

class JobResponse(BaseModel):
    id: str
    clip_id: str
    status: str        # pending, processing, done, failed
    progress: int      # 0-100
    message: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Clip Schemas ────────────────────────────────────────────────────────────

class ClipCreate(BaseModel):
    """Request body for submitting a new clip."""
    url: str
    start_time: float  # seconds
    end_time: float    # seconds

    @field_validator("url")
    @classmethod
    def validate_twitter_url(cls, v):
        if "x.com" not in v and "twitter.com" not in v:
            raise ValueError("URL must be an X/Twitter post URL")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v, info):
        start = info.data.get("start_time")
        if start is not None and v <= start:
            raise ValueError("end_time must be greater than start_time")
        if v - (start or 0) > 300:
            raise ValueError("Clip duration cannot exceed 300 seconds (5 minutes)")
        return v


class ClipResponse(BaseModel):
    """Response body for a clip — returned after creation or lookup."""
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
    """Response body for listing all clips."""
    total: int
    clips: list[ClipResponse]
