from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    storage_path: str = "./storage"

    class Config:
        env_file = "../.env"

settings = Settings()
