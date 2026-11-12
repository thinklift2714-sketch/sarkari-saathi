from typing import List, Optional
from pydantic import BaseModel, Field


class FamilyMember(BaseModel):
    id: Optional[str] = None
    name: str
    relationship: str  # 'मुख्य सदस्य', 'पुत्र', 'पुत्री', 'पति', 'पत्नी'
    age: int
    occupation: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_town: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    family_size: Optional[int] = None
    has_bank_account: Optional[bool] = None
    landholding: Optional[float] = None
    current_benefits: Optional[List[str]] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str = ""
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state: str = "उत्तर प्रदेश"
    district: Optional[str] = None
    village_or_town: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    family_size: int = 1
    has_bank_account: bool = True
    landholding: Optional[float] = None
    is_onboarded: bool = False
    current_benefits: List[str] = Field(default_factory=list)
    members: List[FamilyMember] = Field(default_factory=list)

