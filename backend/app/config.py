import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "Sarkari Saathi"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    # Government Source API Keys (Optional - for live API Setu / OGD feeds)
    APISETU_CLIENT_ID: str = os.getenv("APISETU_CLIENT_ID", "")
    APISETU_API_KEY: str = os.getenv("APISETU_API_KEY", "")
    DATA_GOV_API_KEY: str = os.getenv("DATA_GOV_API_KEY", "")
    MYSCHEME_API_KEY: str = os.getenv("MYSCHEME_API_KEY", "")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")


settings = Settings()

