from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    storage_path: str = "./storage"
    max_clip_duration: int = 60
    max_source_duration: int = 600
    allowed_origins: str = "http://localhost:3000"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
