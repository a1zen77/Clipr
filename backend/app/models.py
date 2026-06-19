import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, Integer, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Clip(Base):
    __tablename__ = "clips"

    id = Column(String, primary_key=True, default=generate_uuid)
    url = Column(String, nullable=False)           # Original X/Twitter URL
    start_time = Column(Float, nullable=False)     # Start timestamp in seconds
    end_time = Column(Float, nullable=False)       # End timestamp in seconds
    title = Column(String, nullable=True)          # Extracted video title
    duration = Column(Float, nullable=True)        # Clip duration in seconds

    # File paths (populated after processing)
    video_path = Column(String, nullable=True)     # Path to original video
    clip_path = Column(String, nullable=True)      # Path to generated clip
    thumbnail_path = Column(String, nullable=True) # Path to thumbnail

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to job
    job = relationship("Job", back_populates="clip", uselist=False)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    clip_id = Column(String, ForeignKey("clips.id"), nullable=False)
    status = Column(String, default="pending")     # pending, processing, done, failed
    progress = Column(Integer, default=0)          # 0–100
    message = Column(Text, nullable=True)          # Current step description
    error = Column(Text, nullable=True)            # Error message if failed

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to clip
    clip = relationship("Clip", back_populates="job")
