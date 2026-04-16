from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "changethisinproduction"
    app_env: str = "development"
    threshold_layak: float = 0.5
    admin_username: str = "admin"
    admin_password_hash_b64: str = ""
    token_expire_hours: int = 8

    @property
    def admin_password_hash(self) -> str:
        import base64
        return base64.b64decode(self.admin_password_hash_b64).decode()

    class Config:
        env_file = ".env"

settings = Settings()
