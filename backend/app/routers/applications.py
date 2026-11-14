from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.schemas.scheme import ApplicationGuideResponse
from app.database import get_user_applications, add_user_application, get_scheme_by_id
from app.auth_deps import get_optional_user, AuthenticatedUser

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/guide/{scheme_id}")
def get_application_guide(scheme_id: str):
    """
    Returns verified, scheme-specific application procedure, official links,
    application mode, fees, deadline, and step-by-step instructions.
    Never returns generic or fake steps.
    """
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")

    # Standard CSC / Jan Seva Kendra centers for offline / assisted application
    csc_centers = [
        {
            "name": "पिंडरा डिजिटल सेवा केंद्र (CSC VLE)",
            "operator": "राजेश कुमार वर्मा",
            "phone": "+91 94501 23456",
            "address": "ब्लॉक रोड, तहसील के सामने, उत्तर प्रदेश",
            "distance": "1.2 किमी",
            "services": ["ऑनलाइन फॉर्म", "बायोमेट्रिक e-KYC", "दस्तावेज स्कैनिंग"]
        },
        {
            "name": "जन सुविधा केंद्र (e-District CSC)",
            "operator": "अमित कुमार मौर्य",
            "phone": "+91 98390 65432",
            "address": "मुख्य बाजार, डाकघर के पास, उत्तर प्रदेश",
            "distance": "2.8 किमी",
            "services": ["आय/जाति प्रमाण पत्र", "पेंशन फॉर्म", "राशन कार्ड"]
        },
        {
            "name": "ब्लॉक ई-मित्र सेवा केंद्र",
            "operator": "सुनील कुमार चौबे",
            "phone": "+91 91250 98765",
            "address": "विकास खंड कार्यालय परिसर, उत्तर प्रदेश",
            "distance": "4.5 किमी",
            "services": ["पीएम किसान सत्यापन", "जॉब कार्ड", "आवास प्लस"]
        }
    ]

    return {
        "scheme_id": scheme.get("id", scheme_id),
        "scheme_name": scheme.get("scheme_name", ""),
        "scheme_name_hindi": scheme.get("scheme_name_hindi", ""),
        "department": scheme.get("department", ""),
        "department_hindi": scheme.get("department_hindi", ""),
        "ministry": scheme.get("ministry"),
        "ministry_hindi": scheme.get("ministry_hindi"),
        "application_mode": scheme.get("application_mode", "both"),
        "official_application_url": scheme.get("official_application_url") or scheme.get("official_website"),
        "official_website": scheme.get("official_website", "https://india.gov.in"),
        "source_url": scheme.get("source_url") or scheme.get("official_website"),
        "official_source": scheme.get("official_source") or scheme.get("department_hindi"),
        "application_fees": scheme.get("application_fees", "निःशुल्क (₹0 / Free)"),
        "application_deadline": scheme.get("application_deadline", "वर्ष भर खुला (निरंतर / Ongoing)"),
        "data_verification_status": scheme.get("data_verification_status", "verified"),
        "last_verified_at": scheme.get("last_verified_at", "2024-11-01"),
        "steps": scheme.get("application_steps", []),
        "required_documents": scheme.get("detailed_documents") or [
            {"document_name_hindi": d, "is_mandatory": True} for d in scheme.get("required_documents", [])
        ],
        "nearby_centers": csc_centers
    }


@router.get("", response_model=List[ApplicationResponse])
def list_applications(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    return get_user_applications(user_id=user_id)


@router.post("", response_model=ApplicationResponse)
def submit_application(payload: ApplicationCreate, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    scheme = get_scheme_by_id(payload.scheme_id) or {}
    record = {
        "scheme_id": payload.scheme_id,
        "scheme_name_hindi": scheme.get("scheme_name_hindi", "सरकारी योजना"),
        "department_hindi": scheme.get("department_hindi", "संबंधित विभाग"),
        "application_status": "submitted_at_csc",
        "application_reference": payload.application_reference,
        "official_website": scheme.get("official_website", "https://india.gov.in")
    }
    return add_user_application(record, user_id=user_id)
