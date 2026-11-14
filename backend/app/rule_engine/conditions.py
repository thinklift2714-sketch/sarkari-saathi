"""
Conditions evaluation definitions for Sarkari Saathi Rule Engine.
Evaluates atomic profile attributes against scheme condition criteria.
"""
from typing import Any, Dict, List, Optional, Tuple


def evaluate_age(age: Optional[int], min_age: Optional[int] = None, max_age: Optional[int] = None) -> Tuple[str, str]:
    """
    Evaluates age criterion.
    Returns (status: 'matched' | 'unmatched' | 'missing', reason_hindi: str)
    """
    if age is None:
        return "missing", "उम्र की जानकारी दर्ज नहीं है।"

    if min_age is not None and age < min_age:
        return "unmatched", f"आपकी उम्र {age} वर्ष है, जबकि न्यूनतम उम्र {min_age} वर्ष आवश्यक है।"

    if max_age is not None and age > max_age:
        return "unmatched", f"आपकी उम्र {age} वर्ष है, जबकि अधिकतम उम्र {max_age} वर्ष होनी चाहिए।"

    if min_age is not None and max_age is not None:
        return "matched", f"आपकी उम्र {age} वर्ष है (आवश्यक: {min_age} से {max_age} वर्ष)।"
    elif min_age is not None:
        return "matched", f"आपकी उम्र {age} वर्ष है (न्यूनतम आवश्यक: {min_age} वर्ष)।"
    elif max_age is not None:
        return "matched", f"आपकी उम्र {age} वर्ष है (अधिकतम: {max_age} वर्ष)।"

    return "matched", f"उम्र {age} वर्ष स्वीकार्य है।"


def evaluate_gender(user_gender: Optional[str], allowed_genders: Any) -> Tuple[str, str]:
    if not allowed_genders:
        return "matched", "सभी लिंगों के लिए उपलब्ध।"
    if isinstance(allowed_genders, str):
        if allowed_genders.lower() in ["any", "all", "सभी", "दोनों"]:
            return "matched", "सभी लिंगों के लिए उपलब्ध।"
        allowed_genders = [allowed_genders]
    elif any(isinstance(g, str) and g.lower() in ["any", "all", "सभी", "दोनों"] for g in allowed_genders):
        return "matched", "सभी लिंगों के लिए उपलब्ध।"

    if not user_gender:
        return "missing", "लिंग (Gender) की जानकारी आवश्यक है।"

    # Normalize Hindi/English terms
    normalized = user_gender.strip().lower()
    allowed_norm = [g.strip().lower() for g in allowed_genders]

    # Common mappings
    female_synonyms = ["महिला", "female", "woman", "स्त्री", "aurat"]
    male_synonyms = ["पुरुष", "male", "man", "purush"]

    is_match = False
    for a in allowed_norm:
        if a in female_synonyms and any(s in normalized for s in female_synonyms):
            is_match = True
            break
        elif a in male_synonyms and any(s in normalized for s in male_synonyms):
            is_match = True
            break
        elif a == normalized:
            is_match = True
            break

    if is_match:
        return "matched", f"यह योजना {', '.join(allowed_genders)} के लिए है और आप इसमें आते हैं।"
    return "unmatched", f"यह योजना केवल {', '.join(allowed_genders)} के लिए लागू है।"


def evaluate_marital_status(user_status: Optional[str], required_status: Any) -> Tuple[str, str]:
    if not required_status:
        return "matched", "वैवाहिक स्थिति का कोई बंधन नहीं है।"
    if isinstance(required_status, str):
        if required_status.lower() in ["any", "all", "सभी", "कोई भी"]:
            return "matched", "वैवाहिक स्थिति का कोई बंधन नहीं है।"
        required_status = [required_status]
    elif any(isinstance(r, str) and r.lower() in ["any", "all", "सभी", "कोई भी"] for r in required_status):
        return "matched", "वैवाहिक स्थिति का कोई बंधन नहीं है।"

    if not user_status:
        return "missing", "वैवाहिक स्थिति की जानकारी आवश्यक है।"

    user_norm = user_status.strip().lower()
    req_norm = [r.strip().lower() for r in required_status]

    widow_synonyms = ["विधवा", "widowed", "widow", "pativrat"]
    for r in req_norm:
        if r in widow_synonyms and any(w in user_norm for w in widow_synonyms):
            return "matched", "आप विधवा हैं, जो इस योजना के लिए प्रमुख शर्त है।"
        if r == user_norm:
            return "matched", f"वैवाहिक स्थिति ({user_status}) शर्त के अनुकूल है।"

    return "unmatched", f"यह योजना केवल {', '.join(required_status)} श्रेणी के लिए है।"


def evaluate_state(user_state: Optional[str], allowed_states: Optional[List[str]]) -> Tuple[str, str]:
    if not allowed_states or "All" in allowed_states or "सभी" in allowed_states:
        return "matched", "यह योजना पूरे भारत में सभी राज्यों के लिए उपलब्ध है।"
    if not user_state:
        return "missing", "राज्य की जानकारी आवश्यक है।"

    user_norm = user_state.strip().lower()
    for s in allowed_states:
        if s.strip().lower() in user_norm or user_norm in s.strip().lower():
            return "matched", f"आप {user_state} के निवासी हैं, जहाँ यह योजना लागू है।"

    return "unmatched", f"यह योजना केवल {', '.join(allowed_states)} के निवासियों के लिए है।"


def evaluate_income(user_income: Optional[float], max_income: Optional[float]) -> Tuple[str, str]:
    if max_income is None:
        return "matched", "कोई आय सीमा निर्धारित नहीं है।"
    if user_income is None:
        return "missing", "पारिवारिक वार्षिक आय की जानकारी आवश्यक है।"

    if user_income <= max_income:
        return "matched", f"आपकी पारिवारिक आय (₹{int(user_income):,}) निर्धारित सीमा (₹{int(max_income):,}) के भीतर है।"
    return "unmatched", f"आपकी आय (₹{int(user_income):,}) अधिकतम सीमा (₹{int(max_income):,}) से अधिक है।"


def evaluate_occupation(user_occupation: Optional[str], allowed_occupations: Any) -> Tuple[str, str]:
    if not allowed_occupations:
        return "matched", "सभी व्यवसायों के लिए उपलब्ध।"
    if isinstance(allowed_occupations, str):
        if allowed_occupations.lower() in ["any", "all", "सभी"]:
            return "matched", "सभी व्यवसायों के लिए उपलब्ध।"
        allowed_occupations = [allowed_occupations]
    if any(str(occ).strip().lower() in ["any", "all", "सभी"] for occ in allowed_occupations):
        return "matched", "सभी व्यवसायों के लिए उपलब्ध।"
    if not user_occupation:
        return "missing", "व्यवसाय/पेशा की जानकारी आवश्यक है।"

    user_norm = user_occupation.strip().lower()
    farmer_synonyms = ["किसान", "farmer", "कृषि", "खेती", "किसान की विधवा", "मजदूर किसान"]
    unemployed_synonyms = ["बेरोजगार", "unemployed", "बेरोजगार युवा", "job seeker", "berojgar"]
    labor_synonyms = ["मजदूर", "श्रमिक", "labour", "labor", "worker", "daily-wage", "दिहाड़ी", "दहाड़ी"]
    artisan_synonyms = ["कारीगर", "artisan", "craftsman", "दर्जी", "tailor", "कामगार", "शिल्पकार"]

    for occ in allowed_occupations:
        occ_norm = occ.strip().lower()
        if occ_norm in farmer_synonyms and any(f in user_norm for f in farmer_synonyms):
            return "matched", f"आपका पेशा ({user_occupation}) योजना की शर्तों के अनुरूप है।"
        if occ_norm in unemployed_synonyms and any(u in user_norm for u in unemployed_synonyms):
            return "matched", f"आपकी रोजगार स्थिति ({user_occupation}) योजना के अनुकूल है।"
        if occ_norm in labor_synonyms and any(l in user_norm for l in labor_synonyms):
            return "matched", f"आपका पेशा ({user_occupation}) योजना की शर्तों के अनुरूप है।"
        if occ_norm in artisan_synonyms and any(a in user_norm for a in artisan_synonyms):
            return "matched", f"आपका पेशा/कला ({user_occupation}) योजना की शर्तों के अनुरूप है।"
        if occ_norm in user_norm or user_norm in occ_norm:
            return "matched", f"आपका पेशा ({user_occupation}) मान्य है।"

    return "unmatched", f"यह योजना {', '.join(allowed_occupations)} के लिए लक्षित है।"


def evaluate_education(user_edu: Optional[str], required_edu: Any) -> Tuple[str, str]:
    if not required_edu:
        return "matched", "शैक्षणिक योग्यता का कोई विशेष बंधन नहीं है।"
    if isinstance(required_edu, str):
        required_edu = [required_edu]
    if not user_edu:
        return "missing", "शैक्षणिक योग्यता की जानकारी आवश्यक है।"

    user_norm = user_edu.strip().lower()
    req_norm = [r.strip().lower() for r in required_edu]

    if "graduate" in user_norm or "स्नातक" in user_norm or "b.com" in user_norm or "bcom" in user_norm:
        if any(r in ["graduate", "स्नातक", "स्नातक (graduate)", "8th", "10th", "12th", "all", "any"] for r in req_norm):
            return "matched", f"आपकी शैक्षणिक योग्यता ({user_edu}) योजना के अनुकूल है।"

    for r in req_norm:
        if r in user_norm or user_norm in r:
            return "matched", f"आपकी शैक्षणिक योग्यता ({user_edu}) मान्य है।"

    return "unmatched", f"यह योजना {', '.join(required_edu)} योग्यता के लिए लक्षित है।"


def evaluate_landholding(has_landholding: Optional[bool], user_land: Optional[float]) -> Tuple[str, str]:
    if has_landholding is None or not has_landholding:
        return "matched", "भूमि स्वामित्व अनिवार्य नहीं है।"
    if user_land is None:
        return "missing", "जमीन के स्वामित्व की जानकारी आवश्यक है।"

    if user_land > 0:
        return "matched", f"आपके पास कृषि भूमि ({user_land} एकड़) दर्ज है।"
    return "unmatched", "इस योजना के लिए कृषि भूमि का स्वामित्व आवश्यक है।"


def evaluate_student(is_student: Optional[bool], required_for_students: Optional[bool] = False) -> Tuple[str, str]:
    if not required_for_students:
        return "matched", "छात्र होना अनिवार्य नहीं है।"
    if is_student is None:
        return "missing", "विद्यार्थी/अध्ययनरत होने की जानकारी आवश्यक है।"
    if is_student:
        return "matched", "आप वर्तमान में अध्ययनरत छात्र/छात्रा हैं।"
    return "unmatched", "यह योजना केवल अध्ययनरत विद्यार्थियों/छात्रों के लिए है।"


def evaluate_disability(has_disability: Optional[bool], required: Optional[bool] = False, min_percentage: int = 40) -> Tuple[str, str]:
    if not required:
        return "matched", "दिव्यांगता का कोई बंधन नहीं है।"
    if has_disability is None:
        return "missing", "दिव्यांगता की जानकारी आवश्यक है।"
    if has_disability:
        return "matched", f"दिव्यांगजन श्रेणी (न्यूनतम {min_percentage}% दिव्यांगता) के लिए मान्य।"
    return "unmatched", f"यह योजना केवल न्यूनतम {min_percentage}% दिव्यांगजन नागरिकों के लिए है।"


def evaluate_caste(user_caste: Optional[str], allowed_castes: Optional[List[str]]) -> Tuple[str, str]:
    if not allowed_castes or "All" in allowed_castes or "सभी" in allowed_castes:
        return "matched", "सभी सामाजिक वर्गों के लिए उपलब्ध।"
    if not user_caste:
        return "missing", "सामाजिक वर्ग (General/OBC/SC/ST) की जानकारी आवश्यक है।"

    user_norm = user_caste.strip().lower()
    for c in allowed_castes:
        if c.strip().lower() in user_norm or user_norm in c.strip().lower():
            return "matched", f"आपकी श्रेणी ({user_caste}) इस योजना के अंतर्गत आती है।"
    return "unmatched", f"यह योजना केवल {', '.join(allowed_castes)} श्रेणी के लिए लागू है।"


def evaluate_area_type(user_area: Optional[str], allowed_areas: Optional[List[str]]) -> Tuple[str, str]:
    """Evaluates rural vs urban residency."""
    if not allowed_areas or "All" in allowed_areas:
        return "matched", "ग्रामीण व शहरी दोनों क्षेत्रों के लिए मान्य।"
    if not user_area:
        return "missing", "ग्रामीण या शहरी क्षेत्र की जानकारी आवश्यक है।"

    user_norm = user_area.strip().lower()
    for a in allowed_areas:
        if a.strip().lower() in user_norm or user_norm in a.strip().lower():
            return "matched", f"आपका क्षेत्र ({user_area}) इस योजना के अनुकूल है।"
    return "unmatched", f"यह योजना केवल {', '.join(allowed_areas)} क्षेत्र के लिए है।"


def evaluate_exclusions(profile: Dict[str, Any], exclusions: Optional[Dict[str, Any]]) -> Tuple[str, str]:
    """Checks scheme exclusions like income tax payee or government job."""
    if not exclusions:
        return "matched", "कोई विशिष्ट अपवर्जन (Exclusion) लागू नहीं।"

    if exclusions.get("tax_payee_excluded") and profile.get("is_tax_payer"):
        return "unmatched", "आयकर दाता (Tax Payer) होने के कारण अपात्र।"
    if exclusions.get("govt_employee_excluded") and profile.get("is_govt_employee"):
        return "unmatched", "सरकारी कर्मचारी / पेंशनधारक होने के कारण अपात्र।"

    return "matched", "कोई अपवर्जन शर्त लागू नहीं होती।"
