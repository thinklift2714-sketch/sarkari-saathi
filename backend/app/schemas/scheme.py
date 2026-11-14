from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ApplicationStep(BaseModel):
    step: int
    title: str
    desc: str
    title_hindi: Optional[str] = None
    desc_hindi: Optional[str] = None
    mode: Optional[str] = "online"  # 'online' | 'offline' | 'both'
    portal_url: Optional[str] = None


class SchemeDocumentRequirement(BaseModel):
    document_name: str
    document_name_hindi: str
    why_needed: str
    why_needed_hindi: str
    issuing_authority: str
    issuing_authority_hindi: str
    is_mandatory: bool = True
    how_to_obtain: Optional[str] = None
    how_to_obtain_hindi: Optional[str] = None


class SchemeItem(BaseModel):
    id: str
    scheme_name: str
    scheme_name_hindi: str
    description: Optional[str] = None
    description_hindi: str
    department: str
    department_hindi: str
    ministry: Optional[str] = None
    ministry_hindi: Optional[str] = None
    category: Optional[str] = None
    category_hindi: Optional[str] = None
    central_or_state: str = "central"
    applicable_states: List[str] = Field(default_factory=list)
    beneficiary_tags: List[str] = Field(default_factory=list)
    benefits: Dict[str, Any]
    eligibility_conditions: Dict[str, Any]
    required_documents: List[str]
    optional_documents: List[str] = Field(default_factory=list)
    detailed_documents: Optional[List[SchemeDocumentRequirement]] = Field(default_factory=list)
    application_steps: List[ApplicationStep] = Field(default_factory=list)
    application_mode: str = "online"  # 'online' | 'offline' | 'both'
    official_application_url: Optional[str] = None
    official_website: str
    official_source: Optional[str] = None
    source_url: Optional[str] = None
    application_fees: Optional[str] = "निःशुल्क (₹0 / Free)"
    application_deadline: Optional[str] = "निरंतर चालू (Ongoing / No Deadline)"
    last_verified_at: Optional[str] = None
    data_verification_status: str = "verified"  # 'verified' | 'api_synced' | 'pending_review' | 'unverified'
    is_active: bool = True


class SchemeCreate(BaseModel):
    id: Optional[str] = None
    scheme_name: str
    scheme_name_hindi: str
    description: Optional[str] = None
    description_hindi: str
    department: str
    department_hindi: str
    ministry: Optional[str] = None
    ministry_hindi: Optional[str] = None
    category: str
    category_hindi: str
    central_or_state: str = "central"
    applicable_states: List[str] = Field(default_factory=lambda: ["All"])
    beneficiary_tags: List[str] = Field(default_factory=list)
    benefits: Dict[str, Any]
    eligibility_conditions: Dict[str, Any]
    required_documents: List[str]
    optional_documents: List[str] = Field(default_factory=list)
    detailed_documents: Optional[List[SchemeDocumentRequirement]] = None
    application_steps: List[ApplicationStep] = Field(default_factory=list)
    application_mode: str = "online"
    official_application_url: Optional[str] = None
    official_website: str
    official_source: Optional[str] = None
    source_url: Optional[str] = None
    application_fees: Optional[str] = "निःशुल्क (₹0 / Free)"
    application_deadline: Optional[str] = "निरंतर चालू (Ongoing / No Deadline)"
    data_verification_status: str = "verified"
    is_active: bool = True


class SchemeUpdate(BaseModel):
    scheme_name: Optional[str] = None
    scheme_name_hindi: Optional[str] = None
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    department: Optional[str] = None
    department_hindi: Optional[str] = None
    ministry: Optional[str] = None
    ministry_hindi: Optional[str] = None
    category: Optional[str] = None
    category_hindi: Optional[str] = None
    central_or_state: Optional[str] = None
    applicable_states: Optional[List[str]] = None
    beneficiary_tags: Optional[List[str]] = None
    benefits: Optional[Dict[str, Any]] = None
    eligibility_conditions: Optional[Dict[str, Any]] = None
    required_documents: Optional[List[str]] = None
    optional_documents: Optional[List[str]] = None
    detailed_documents: Optional[List[SchemeDocumentRequirement]] = None
    application_steps: Optional[List[ApplicationStep]] = None
    application_mode: Optional[str] = None
    official_application_url: Optional[str] = None
    official_website: Optional[str] = None
    official_source: Optional[str] = None
    source_url: Optional[str] = None
    application_fees: Optional[str] = None
    application_deadline: Optional[str] = None
    data_verification_status: Optional[str] = None
    is_active: Optional[bool] = None


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
    official_application_url: Optional[str] = None
    application_mode: Optional[str] = "online"
    data_verification_status: Optional[str] = "verified"
    required_documents: List[str] = Field(default_factory=list)


class ApplicationGuideResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    scheme_name_hindi: str
    department: str
    department_hindi: str
    ministry: Optional[str] = None
    ministry_hindi: Optional[str] = None
    application_mode: str  # 'online' | 'offline' | 'both'
    official_application_url: Optional[str] = None
    official_website: str
    source_url: Optional[str] = None
    official_source: Optional[str] = None
    application_fees: str
    application_deadline: str
    data_verification_status: str
    last_verified_at: Optional[str] = None
    steps: List[ApplicationStep]
    required_documents: List[Dict[str, Any]]
    nearby_centers: List[Dict[str, Any]] = Field(default_factory=list)
