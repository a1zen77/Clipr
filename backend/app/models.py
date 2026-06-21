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
    url = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    title = Column(String, nullable=True)
    duration = Column(Float, nullable=True)

    video_path = Column(String, nullable=True)
    clip_path = Column(String, nullable=True)
    thumbnail_path = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # cascade="all, delete-orphan" ensures Job is deleted when Clip is deleted
    job = relationship(
        "Job",
        back_populates="clip",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    clip_id = Column(String, ForeignKey("clips.id"), nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    message = Column(Text, nullable=True)
    error = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clip = relationship("Clip", back_populates="job")
