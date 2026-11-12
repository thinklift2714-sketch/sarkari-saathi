from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ApplicationStep(BaseModel):
    step: int
    title: str
    desc: str


class SchemeItem(BaseModel):
    id: str
    scheme_name: str
    scheme_name_hindi: str
    description: Optional[str] = None
    description_hindi: str
    department: str
    department_hindi: str
    central_or_state: str = "central"
    applicable_states: List[str] = Field(default_factory=list)
    benefits: Dict[str, Any]
    eligibility_conditions: Dict[str, Any]
    required_documents: List[str]
    optional_documents: List[str] = Field(default_factory=list)
    application_steps: List[ApplicationStep] = Field(default_factory=list)
    official_website: str
    official_source: Optional[str] = None
    last_verified_at: Optional[str] = None
    is_active: bool = True


class SchemeEligibilityResult(BaseModel):
    scheme_id: str
    scheme_name: str
    scheme_name_hindi: str
    department_hindi: str
    benefits: Dict[str, Any]
    status: str  # 'eligible' | 'potentially_eligible' | 'not_eligible'
    matched_conditions: List[str]
    unmatched_conditions: List[str]
    missing_information: List[str]
    explanation: str
    official_source: Optional[str] = None
    official_website: Optional[str] = None
    required_documents: List[str] = Field(default_factory=list)

