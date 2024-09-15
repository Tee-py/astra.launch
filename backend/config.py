from pydantic import Field, MongoDsn, RedisDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = Field(alias='SECRET_KEY')
    redis_url: RedisDsn = Field(alias='REDIS_URL')
    mongodb_uri: MongoDsn = Field(alias='MONGODB_URI')


settings = Settings()
