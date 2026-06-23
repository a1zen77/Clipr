import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Clip(Base):
    __tablename__ = "clips"

    id              = Column(String, primary_key=True, default=generate_uuid)
    url             = Column(String, nullable=False)
    start_time      = Column(Float, nullable=False)
    end_time        = Column(Float, nullable=False)
    duration        = Column(Float, nullable=True)
    title           = Column(String, nullable=True)
    clip_path       = Column(String, nullable=True)
    thumbnail_path  = Column(String, nullable=True)
    status          = Column(String, default="pending")
    error           = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
