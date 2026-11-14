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
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_town: Optional[str] = None
    pincode: Optional[str] = None
    occupation: Optional[str] = None
    employment_status: Optional[str] = None
    annual_income: Optional[float] = None
    monthly_income: Optional[float] = None
    family_size: Optional[int] = None
    owns_agricultural_land: Optional[bool] = None
    landholding: Optional[float] = None
    is_bpl: Optional[bool] = None
    caste_category: Optional[str] = None
    has_disability: Optional[bool] = None
    disability_percentage: Optional[float] = None
    education_level: Optional[str] = None
    education_status: Optional[str] = None
    course_or_degree: Optional[str] = None
    institution_type: Optional[str] = None
    academic_marks: Optional[float] = None
    has_aadhaar: Optional[bool] = None
    has_bank_account: Optional[bool] = None
    has_income_certificate: Optional[bool] = None
    has_domicile_certificate: Optional[bool] = None
    has_ration_card: Optional[bool] = None
    is_onboarded: Optional[bool] = None
    current_benefits: Optional[List[str]] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str = ""
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_town: Optional[str] = None
    pincode: Optional[str] = None
    occupation: Optional[str] = None
    employment_status: Optional[str] = None
    annual_income: Optional[float] = None
    monthly_income: Optional[float] = None
    family_size: int = 1
    owns_agricultural_land: Optional[bool] = False
    landholding: Optional[float] = None
    is_bpl: Optional[bool] = False
    caste_category: Optional[str] = None
    has_disability: Optional[bool] = False
    disability_percentage: Optional[float] = None
    education_level: Optional[str] = None
    education_status: Optional[str] = None
    course_or_degree: Optional[str] = None
    institution_type: Optional[str] = None
    academic_marks: Optional[float] = None
    has_aadhaar: Optional[bool] = False
    has_bank_account: bool = True
    has_income_certificate: Optional[bool] = False
    has_domicile_certificate: Optional[bool] = False
    has_ration_card: Optional[bool] = False
    is_onboarded: bool = False
    current_benefits: List[str] = Field(default_factory=list)
    members: List[FamilyMember] = Field(default_factory=list)
