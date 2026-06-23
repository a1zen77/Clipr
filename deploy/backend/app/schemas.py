from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime
import re


class ClipCreate(BaseModel):
    url: str
    start_time: float
    end_time: float

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = re.sub(r"\?.*$", "", v.strip())
        if not re.search(r"(x\.com|twitter\.com)/\S+/status/\d+", v):
            raise ValueError(
                "Must be a valid X/Twitter post URL "
                "(e.g. https://x.com/user/status/123456789)"
            )
        return v

    @field_validator("start_time")
    @classmethod
    def validate_start(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Start time cannot be negative")
        return round(v, 2)

    @field_validator("end_time")
    @classmethod
    def validate_end(cls, v: float) -> float:
        if v < 0:
            raise ValueError("End time cannot be negative")
        return round(v, 2)

    @model_validator(mode="after")
    def validate_range(self) -> "ClipCreate":
        start    = self.start_time
        end      = self.end_time
        if end <= start:
            raise ValueError("End time must be greater than start time")
        if end - start < 1:
            raise ValueError("Clip must be at least 1 second long")
        if end - start > 60:
            raise ValueError("Clip cannot exceed 60 seconds on the free tier")
        return self


class ClipResponse(BaseModel):
    id:             str
    url:            str
    start_time:     float
    end_time:       float
    duration:       Optional[float]  = None
    title:          Optional[str]    = None
    clip_path:      Optional[str]    = None
    thumbnail_path: Optional[str]    = None
    status:         str
    error:          Optional[str]    = None
    created_at:     datetime

    model_config = {"from_attributes": True}


class ClipListResponse(BaseModel):
    total: int
    clips: list[ClipResponse]
