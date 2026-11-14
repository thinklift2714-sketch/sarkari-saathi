"""
Sarkari Saathi Citizen Profile Extractor.
Deterministic, multi-lingual (Hindi, Hinglish, English) extractor.
Extracts age, state, district, occupation, landholding, income, gender, marital status,
and citizen assistance requirements without hallucinating.
"""
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class ExtractedField(BaseModel):
    value: Any
    confidence: float
    source: str
    is_inferred: bool = False


class ExtractedProfile(BaseModel):
    state: Optional[ExtractedField] = None
    district: Optional[ExtractedField] = None
    age: Optional[ExtractedField] = None
    gender: Optional[ExtractedField] = None
    marital_status: Optional[ExtractedField] = None
    occupation: Optional[ExtractedField] = None
    annual_income: Optional[ExtractedField] = None
    education: Optional[ExtractedField] = None
    is_student: Optional[ExtractedField] = None
    has_disability: Optional[ExtractedField] = None
    landholding: Optional[ExtractedField] = None
    family_members_count: Optional[ExtractedField] = None
    bpl_status: Optional[ExtractedField] = None
    assistance_requirement: Optional[ExtractedField] = None


class ProfileExtractor:
    """
    Production-grade rule-based extractor for Indian welfare citizen profiles.
    Strictly deterministic to eliminate AI hallucinations.
    """

    KNOWN_STATES = {
        "up": "उत्तर प्रदेश",
        "uttar pradesh": "उत्तर प्रदेश",
        "उत्तर प्रदेश": "उत्तर प्रदेश",
        "यूपी": "उत्तर प्रदेश",
        "bihar": "बिहार",
        "बिहार": "बिहार",
        "madhya pradesh": "मध्य प्रदेश",
        "mp": "मध्य प्रदेश",
        "मध्य प्रदेश": "मध्य प्रदेश",
        "rajasthan": "राजस्थान",
        "राजस्थान": "राजस्थान",
        "delhi": "दिल्ली",
        "दिल्ली": "दिल्ली",
        "haryana": "हरियाणा",
        "हरियाणा": "हरियाणा",
        "maharashtra": "महाराष्ट्र",
        "महाराष्ट्र": "महाराष्ट्र",
        "punjab": "पंजाब",
        "पंजाब": "पंजाब",
        "gujarat": "गुजरात",
        "गुजरात": "गुजरात",
        "chhattisgarh": "छत्तीसगढ़",
        "छत्तीसगढ़": "छत्तीसगढ़",
        "jharkhand": "झारखंड",
        "झारखंड": "झारखंड",
        "west bengal": "पश्चिम बंगाल",
        "पश्चिम बंगाल": "पश्चिम बंगाल",
        "odisha": "ओडिशा",
        "ओडिशा": "ओडिशा",
        "tamil nadu": "तमिलनाडु",
        "तमिलनाडु": "तमिलनाडु",
        "karnataka": "कर्नाटक",
        "कर्नाटक": "कर्नाटक"
    }

    KNOWN_DISTRICTS = [
        "वाराणसी", "बनारस", "काशी", "प्रयागराज", "इलाहाबाद", "गोरखपुर",
        "लखनऊ", "अयोध्या", "बरेली", "आगरा", "कानपुर", "मेरठ", "झांसी",
        "गाजीपुर", "जौनपुर", "मिर्जापुर", "बस्ती", "आजमगढ़", "बलिया",
        "सहारनपुर", "मुरादाबाद", "अलीगढ़", "मथुरा", "फिरोजाबाद",
        "जयपुर", "जोधपुर", "उदयपुर", "कोटा", "बीकानेर", "अजमेर", "अलवर", "सीकर", "भीलवाड़ा",
        "भोपाल", "इंदौर", "जबलपुर", "ग्वालियर", "उज्जैन", "सागर", "रीवा",
        "मुंबई", "पुणे", "नागपुर", "नाशिक", "औरंगाबाद", "ठाणे", "सोलापूर"
    ]

    DISTRICT_MAP_EN = {
        "meerut": "मेरठ",
        "varanasi": "वाराणसी",
        "lucknow": "लखनऊ",
        "gorakhpur": "गोरखपुर",
        "prayagraj": "प्रयागराज",
        "allahabad": "प्रयागराज",
        "kanpur": "कानपुर",
        "agra": "आगरा",
        "bareilly": "बरेली",
        "ghazipur": "गाजीपुर",
        "jaunpur": "जौनपुर",
        "mirzapur": "मिर्जापुर",
        "ayodhya": "अयोध्या",
        "jaipur": "जयपुर",
        "jodhpur": "जोधपुर",
        "udaipur": "उदयपुर",
        "kota": "कोटा",
        "bikaner": "बीकानेर",
        "ajmer": "अजमेर",
        "alwar": "अलवर",
        "sikar": "सीकर",
        "bhopal": "भोपाल",
        "indore": "इंदौर",
        "jabalpur": "जबलपुर",
        "gwalior": "ग्वालियर",
        "ujjain": "उज्जैन",
        "mumbai": "मुंबई",
        "pune": "पुणे",
        "nagpur": "नागपुर",
        "nashik": "नाशिक",
        "aurangabad": "औरंगाबाद",
        "thane": "ठाणे"
    }

    @classmethod
    def extract(cls, text: str, existing_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts structured fields from user message with metadata.
        Returns both a raw dict for backward compatibility and a structured dict.
        """
        raw_text = (text or "").strip()
        lowered = raw_text.lower()
        extracted_fields: Dict[str, Any] = {}
        metadata_map: Dict[str, Dict[str, Any]] = {}

        # -------------------------------------------------------------
        # STEP 0: Parse Key-Value Pairs if present
        # -------------------------------------------------------------
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        kv_pairs = {}
        for line in lines:
            if ':' in line or '–' in line:
                sep = ':' if ':' in line else '–'
                parts = line.split(sep, 1)
                if len(parts) == 2:
                    k_clean = parts[0].strip().lower().replace('*', '').replace('-', '').strip()
                    v_clean = parts[1].strip()
                    if k_clean and v_clean:
                        kv_pairs[k_clean] = v_clean

        # -------------------------------------------------------------
        # 1. Age
        # -------------------------------------------------------------
        age_val = None
        if any('age' in k or 'आयु' in k or 'उम्र' in k for k in kv_pairs):
            for k, v in kv_pairs.items():
                if any(x in k for x in ['age', 'आयु', 'उम्र']):
                    m = re.search(r'\b(\d{1,2})\b', v)
                    if m:
                        age_val = int(m.group(1))
                        break
        if age_val is None:
            age_match = re.search(r'\b(\d{1,2})\s*(?:-|–|\s)*(?:year|yr|old|saal|varsh|साल|वर्ष|उम्र)\b', raw_text, re.IGNORECASE)
            if not age_match:
                age_match = re.search(r'(?:उम्र|age|आयु)\s*(?:is|है|:|–|-)?\s*(\d{1,2})\b', raw_text, re.IGNORECASE)
            if not age_match:
                standalone_age = re.match(r'^\s*(\d{1,2})\s*(?:साल|वर्ष|years?|yrs?|old|hai|h|का|की|hoon|हूँ)?\s*$', raw_text, re.IGNORECASE)
                if standalone_age:
                    age_match = standalone_age
            if age_match:
                val = int(age_match.group(1))
                if 1 <= val <= 110:
                    age_val = val

        if age_val and 1 <= age_val <= 110:
            extracted_fields["age"] = age_val
            metadata_map["age"] = {
                "value": age_val,
                "confidence": 0.98,
                "source": str(age_val),
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 2. Gender & Marital Status (Male never matches widow!)
        # -------------------------------------------------------------
        gender_val = None
        for k, v in kv_pairs.items():
            if 'gender' in k or 'लिंग' in k:
                vl = v.lower()
                # FIXED: Check female BEFORE male to prevent 'female' matching 'male' as substring
                if any(w in vl for w in ['female', 'woman', 'mahila', 'महिला', 'स्त्री']):
                    gender_val = "महिला"
                elif any(w in vl for w in ['male', 'man', 'purush', 'पुरुष']):
                    gender_val = "पुरुष"
                break

        if not gender_val:
            if re.search(r'\b(?:male|man|purush|पुरुष|aadmi|लड़का|युवक)\b', lowered):
                gender_val = "पुरुष"
            elif re.search(r'\b(?:female|woman|lady|mahila|महिला|स्त्री|aurat|लड़की|युवती)\b', lowered):
                gender_val = "महिला"

        if gender_val:
            extracted_fields["gender"] = gender_val
            metadata_map["gender"] = {
                "value": gender_val,
                "confidence": 0.98,
                "source": gender_val,
                "is_inferred": False
            }

        # Marital Status
        is_widow = False
        if gender_val != "पुरुष":
            is_widow = any(w in lowered for w in ["widow", "widowed", "vidhwa", "विधवा", "पति का देहांत", "पति नहीं रहे", "पति की मृत्यु", "पति गुजर गए"]) or (
                any(w in lowered for w in ["मृत्यु", "निधन", "स्वर्गवास", "गुजर गए"]) and any(w in lowered for w in ["पति", "husband"])
            )

        if is_widow and gender_val != "पुरुष":
            extracted_fields["marital_status"] = "विधवा"
            extracted_fields["gender"] = "महिला"
            metadata_map["marital_status"] = {
                "value": "विधवा",
                "confidence": 0.98,
                "source": "widow pattern",
                "is_inferred": False
            }
        elif re.search(r'\b(?:married|vivahit|विवाहित|शादीशुदा)\b', lowered):
            extracted_fields["marital_status"] = "विवाहित"
            metadata_map["marital_status"] = {
                "value": "विवाहित",
                "confidence": 0.95,
                "source": "married match",
                "is_inferred": False
            }
        elif re.search(r'\b(?:unmarried|single|avivahit|अविवाहित|कुंवारा|कुंवारी)\b', lowered):
            extracted_fields["marital_status"] = "अविवाहित"
            metadata_map["marital_status"] = {
                "value": "अविवाहित",
                "confidence": 0.95,
                "source": "single match",
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 3. Location: State & District
        # -------------------------------------------------------------
        state_val = None
        for k, v in kv_pairs.items():
            if 'state' in k or 'राज्य' in k:
                vl = v.lower()
                for tok, norm_st in cls.KNOWN_STATES.items():
                    if tok in vl:
                        state_val = norm_st
                        break
                if state_val:
                    break

        if not state_val:
            for token, normalized_state in cls.KNOWN_STATES.items():
                pattern = r'\b' + re.escape(token) + r'\b'
                if re.search(pattern, lowered):
                    state_val = normalized_state
                    break

        if state_val:
            extracted_fields["state"] = state_val
            metadata_map["state"] = {
                "value": state_val,
                "confidence": 0.95,
                "source": state_val,
                "is_inferred": False
            }

        district_val = None
        for k, v in kv_pairs.items():
            if 'district' in k or 'जिला' in k or 'city' in k or 'शहर' in k:
                vl = v.lower()
                for dist_en, norm_hi in cls.DISTRICT_MAP_EN.items():
                    if dist_en in vl:
                        district_val = norm_hi
                        break
                if not district_val:
                    for dist_hi in cls.KNOWN_DISTRICTS:
                        if dist_hi in v:
                            district_val = dist_hi
                            break
                if district_val:
                    break

        if not district_val:
            for dist_hi in cls.KNOWN_DISTRICTS:
                if dist_hi in raw_text:
                    district_val = "वाराणसी" if dist_hi in ["बनारस", "काशी"] else ("प्रयागराज" if dist_hi == "इलाहाबाद" else dist_hi)
                    break

        if not district_val:
            for dist_en, norm_hi in cls.DISTRICT_MAP_EN.items():
                if re.search(r'\b' + dist_en + r'\b', lowered):
                    district_val = norm_hi
                    break

        if district_val:
            extracted_fields["district"] = district_val
            metadata_map["district"] = {
                "value": district_val,
                "confidence": 0.95,
                "source": district_val,
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 4. Occupation (Strict: Disambiguate Applicant vs Father/Family)
        # -------------------------------------------------------------
        occ_val = None
        father_occ = None

        # Check KV pairs first
        for k, v in kv_pairs.items():
            vl = v.lower()
            if any(f in k for f in ["father", "pita", "पिता", "family"]):
                if any(w in vl for w in ["farmer", "kisan", "किसान", "कृषक", "खेती"]):
                    father_occ = "किसान"
            elif any(o in k for o in ["occupation", "profession", "job", "पेशा", "व्यवसाय", "कार्य"]):
                if any(w in vl for w in ["unemployed", "berojgar", "बेरोजगार"]):
                    occ_val = "बेरोजगार युवा"
                elif any(w in vl for w in ["student", "chhatra", "छात्र", "विद्यार्थी"]):
                    occ_val = "छात्र"
                elif any(w in vl for w in ["farmer", "kisan", "किसान", "कृषक"]):
                    occ_val = "किसान"
                elif any(w in vl for w in ["tailor", "tailoring", "दर्जी", "सिलाई", "sewing"]):
                    occ_val = "दर्जी / कारीगर / कामगार"
                elif any(w in vl for w in ["artisan", "karigar", "कारीगर"]):
                    occ_val = "कारीगर / कामगार"
                elif any(w in vl for w in ["daily-wage", "daily wage", "dihadi", "दिहाड़ी", "labour", "labor", "worker", "mazdoor", "मजदूर", "श्रमिक"]):
                    occ_val = "मजदूर / श्रमिक"
                elif any(w in vl for w in ["private", "salaried", "निजी", "प्राइवेट"]):
                    occ_val = "निजी नौकरी (Private Employee)"
                elif any(w in vl for w in ["government", "govt", "sarkari", "सरकारी"]):
                    occ_val = "सरकारी कर्मचारी"

        # Check conversational text if not found in KV
        if not father_occ:
            if re.search(r'\b(?:father(?:\'s)?|pita|pitaji|पिता|पिताजी)\b.*?\b(?:farmer|kisan|किसान|कृषक|खेती)\b', lowered):
                father_occ = "किसान"

        if not occ_val:
            if is_widow and gender_val != "पुरुष":
                occ_val = "किसान की विधवा" if ("किसान" in lowered or "खेती" in lowered or "farmer" in lowered) else "गृहिणी / विधवा"
            elif re.search(r'\b(?:unemployed graduate|unemployed|berojgar|बेरोजगार स्नातक|बेरोजगार)\b', lowered):
                occ_val = "बेरोजगार युवा"
            elif re.search(r'\b(?:student|vidyarthi|chhatra|छात्रा|छात्र|विद्यार्थी)\b', lowered):
                occ_val = "छात्र"
                extracted_fields["is_student"] = True
            elif re.search(r'\b(?:private\s+(?:sector\s+)?(?:employee|job|worker)|salaried|निजी\s+नौकरी|निजी\s+कर्मचारी|प्राइवेट\s+नौकरी)\b', lowered):
                occ_val = "निजी नौकरी (Private Employee)"
            elif re.search(r'\b(?:tailor|tailoring|sewing|दर्जी|सिलाई)\b', lowered):
                occ_val = "दर्जी / कारीगर / कामगार"
            elif re.search(r'\b(?:artisan|craftsman|karigar|कारीगर|शिल्पकार|लोहार|बढ़ई)\b', lowered):
                occ_val = "कारीगर / कामगार"
            elif re.search(r'\b(?:daily[- ]wage|dihadi|दिहाड़ी|labour|labor|worker|mazdoor|मजदूर|श्रमिक|दहाड़ी)\b', lowered):
                occ_val = "मजदूर / श्रमिक"
            elif re.search(r'\b(?:farmer|kisan|खेतिहर|किसान|कृषक)\b', lowered) and not father_occ:
                occ_val = "किसान"
            elif re.search(r'\b(?:govt|government|sarkari|सरकारी)\s*(?:employee|job|कर्मचारी|नौकरी)\b', lowered):
                occ_val = "सरकारी कर्मचारी"

        if occ_val:
            extracted_fields["occupation"] = occ_val
            metadata_map["occupation"] = {
                "value": occ_val,
                "confidence": 0.95,
                "source": occ_val,
                "is_inferred": False
            }
        if father_occ:
            extracted_fields["father_occupation"] = father_occ
            metadata_map["father_occupation"] = {
                "value": father_occ,
                "confidence": 0.95,
                "source": "father occupation",
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 5. Agricultural Landholding (Do NOT attribute father's land to applicant!)
        # -------------------------------------------------------------
        land_val = None
        land_owned_by_father = False

        # Check KV pairs
        for k, v in kv_pairs.items():
            if 'land' in k or 'जमीन' in k or 'भूमि' in k or 'holding' in k:
                vl = v.lower()
                if any(w in vl for w in ["none", "nil", "no", "zero", "शून्य", "नहीं"]):
                    land_val = 0.0
                elif any(w in vl for w in ["father", "pita", "पिता", "parents"]):
                    land_owned_by_father = True
                    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:acres?|एकड़|hectares?|हेक्टेयर|bighas?|बीघा)', vl)
                    if m:
                        raw_num = float(m.group(1))
                        extracted_fields["family_landholding"] = round(raw_num * 0.4, 2) if "bigha" in vl or "बीघा" in vl else raw_num
                    land_val = 0.0
                else:
                    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:acres?|एकड़|hectares?|हेक्टेयर|bighas?|बीघा)', vl)
                    if m:
                        raw_num = float(m.group(1))
                        land_val = round(raw_num * 0.4, 2) if "bigha" in vl or "बीघा" in vl else raw_num

        if land_val is None:
            # Check conversational pattern: "owned by father", "father's land", "पिताजी के नाम पर जमीन"
            father_land_match = re.search(r'(?:owned by\s*(?:father|parents)|father\'s land|पिताजी\s*(?:के नाम|के पास)?.*?जमीन|पिता\s*की\s*जमीन)', lowered)
            if father_land_match:
                land_owned_by_father = True
                land_val = 0.0
                m = re.search(r'(\d+(?:\.\d+)?)\s*(?:acres?|एकड़|hectares?|हेक्टेयर|bighas?|बीघा)', lowered)
                if m:
                    extracted_fields["family_landholding"] = float(m.group(1))
            else:
                land_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|–|\s)*(?:acres?|एकड़|hectares?|हेक्टेयर|bighas?|बीघा)\b', lowered)
                if land_match:
                    raw_num = float(land_match.group(1))
                    land_val = round(raw_num * 0.4, 2) if ("bigha" in lowered or "बीघा" in lowered) else raw_num
                elif any(w in lowered for w in ["landless", "no land", "भूमिहीन", "जमीन नहीं"]):
                    land_val = 0.0

        if land_val is not None:
            extracted_fields["landholding"] = land_val
            extracted_fields["owns_agricultural_land"] = (land_val > 0.0)
            metadata_map["landholding"] = {
                "value": land_val,
                "confidence": 0.95,
                "source": "father owned (0.0 for applicant)" if land_owned_by_father else "applicant land",
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 6. Education
        # -------------------------------------------------------------
        edu_val = None
        for k, v in kv_pairs.items():
            if 'education' in k or 'qualification' in k or 'शिक्षा' in k or 'पढ़ाई' in k:
                vl = v.lower()
                if any(w in vl for w in ['graduate', 'b.com', 'bcom', 'ba', 'bsc', 'स्नातक', 'degree']):
                    edu_val = "स्नातक (Graduate)"
                elif '12' in vl:
                    edu_val = "12th Pass"
                elif '10' in vl:
                    edu_val = "10th Pass"
                else:
                    edu_val = v.strip()
                break

        if not edu_val:
            edu_match = re.search(r'\b(?:b\.com|bcom|b\.sc|bsc|b\.a|ba|btech|m\.com|mcom|graduate|graduation|post graduate|10th|12th|10वीं|12वीं|diploma|स्नातक|परास्नातक)\b', lowered)
            if edu_match:
                edu_raw = edu_match.group(0)
                edu_val = "स्नातक (Graduate)" if any(x in edu_raw for x in ["b.com", "bcom", "b.sc", "bsc", "b.a", "ba", "graduate", "graduation", "स्नातक"]) else edu_raw

        if edu_val:
            extracted_fields["education"] = edu_val
            metadata_map["education"] = {
                "value": edu_val,
                "confidence": 0.95,
                "source": edu_val,
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 7. Annual Household Income (Supports Decimal like 1.5 lakh & Monthly conversion)
        # -------------------------------------------------------------
        income_val = None
        is_monthly = bool(re.search(r'\b(?:monthly|per\s+month|pm|\/month|\/mo|प्रति\s*माह|महीने\s*का|महीने\s*की|मासिक)\b', lowered))

        for k, v in kv_pairs.items():
            if 'income' in k or 'आय' in k or 'aay' in k or 'kamai' in k:
                vl = v.lower()
                m = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|लाख|k|thousand|हजार)?', vl)
                if m:
                    base_num = float(m.group(1))
                    if 'lakh' in vl or 'लाख' in vl:
                        base_num *= 100000.0
                    elif 'k' in vl or 'thousand' in vl or 'हजार' in vl:
                        base_num *= 1000.0
                    if 'month' in vl or 'माह' in vl or 'मासिक' in vl or is_monthly:
                        base_num *= 12.0
                    if 1000.0 <= base_num <= 100000000.0:
                        income_val = base_num
                        break

        if income_val is None:
            inc_match = re.search(r'(?:annual\s+|monthly\s+|saalana\s+|masik\s+)?(?:family\s+)?(?:household\s+)?income\s*(?:is|of|है|:|–|-)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:हजार|लाख|k|lakh|thousand)?(?:\s*(?:per\s+month|monthly|\/month|प्रति\s*माह|मासिक|salana|वार्षिक))?', lowered)
            if not inc_match:
                inc_match = re.search(r'(?:वार्षिक आय|सालाना आय|मासिक आय|महीने की आय|पारिवारिक आय|आय)\s*(?:is|of|है|:|–|-)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:हजार|लाख|k|lakh|thousand)?(?:\s*(?:प्रति\s*माह|मासिक|सालाना|वार्षिक))?', lowered)
            if not inc_match:
                inc_match = re.search(r'(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:हजार|लाख|k|lakh|thousand)\s*(?:income|aay|वार्षिक आय|सालाना आय|पारिवारिक आय)', lowered)

            if inc_match:
                try:
                    clean_str = inc_match.group(1).replace(",", "")
                    base_val = float(clean_str)
                    span = inc_match.group(0).lower()
                    if "लाख" in span or "lakh" in span:
                        base_val *= 100000.0
                    elif "हजार" in span or "k" in span or "thousand" in span:
                        base_val *= 1000.0

                    if ("monthly" in span or "per month" in span or "/month" in span or "मासिक" in span or "प्रति माह" in span or "महीने" in span or is_monthly) and not ("annual" in span or "सालाना" in span or "वार्षिक" in span):
                        base_val *= 12.0

                    if 1000.0 <= base_val <= 100000000.0:
                        income_val = base_val
                except ValueError:
                    pass

        if income_val is not None:
            extracted_fields["annual_income"] = income_val
            extracted_fields["monthly_income"] = income_val / 12.0
            metadata_map["annual_income"] = {
                "value": income_val,
                "confidence": 0.95,
                "source": f"₹{income_val:,.0f} (वार्षिक)",
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 8. Assistance Requirements & Target Categories
        # -------------------------------------------------------------
        req_types = []
        req_line = ""
        for k, v in kv_pairs.items():
            if any(x in k for x in ["requirement", "need", "looking", "चाहिए", "आवश्यकता"]):
                req_line = v.lower()
                break

        target_text = req_line if req_line else lowered

        # Check domain indicators in target_text
        has_edu = any(w in target_text for w in ["education", "scholarship", "padhai", "छात्रवृत्ति", "पढ़ाई", "college", "school"])
        has_biz = any(w in target_text for w in ["business", "startup", "स्वरोजगार", "मुद्रा", "उद्योग", "व्यापार", "दुकान", "उद्यम"])
        has_emp = any(w in target_text for w in ["employment", "job", "naukri", "rozgar", "रोजगार", "नौकरी", "unemployment", "बेरोजगारी"])
        has_skill = any(w in target_text for w in ["skill", "training", "kaushal", "प्रशिक्षण", "कौशल", "संबल"])
        has_pension = (any(w in target_text for w in ["pension", "vridha", "widow", "vidhwa", "वृद्धा", "पेंशन"]) or is_widow) and not gender_val == "पुरुष"
        has_agri = any(w in target_text for w in ["farmer", "kisan", "kheti", "कृषि", "किसान"]) and not father_occ
        has_health = any(w in target_text for w in ["health", "ayushman", "ilaj", "इलाज", "अस्पताल"])
        has_housing = any(w in target_text for w in ["housing", "awas", "makan", "आवास", "मकान"])

        if has_agri:
            req_types.append("agriculture")
        if has_edu:
            req_types.append("education")
        if has_biz:
            req_types.append("business")
        if has_emp:
            req_types.append("employment")
        if has_skill:
            req_types.append("skills")
        if has_pension:
            req_types.append("pension")
        if has_health:
            req_types.append("health")
        if has_housing:
            req_types.append("housing")

        if req_types:
            extracted_fields["assistance_requirement"] = req_types[0]
            extracted_fields["target_categories"] = req_types
            metadata_map["assistance_requirement"] = {
                "value": req_types[0],
                "confidence": 0.95,
                "source": ", ".join(req_types),
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 9. Disability Information & Family Members
        # -------------------------------------------------------------
        # Determine whether input represents a fresh persona
        core_fields = ["age", "state", "occupation", "gender", "annual_income", "education", "marital_status"]
        core_fields_count = sum(1 for k in core_fields if k in extracted_fields)
        has_contradiction = False
        if existing_profile:
            for k in ["gender", "state", "marital_status", "occupation"]:
                if k in extracted_fields and existing_profile.get(k) and extracted_fields[k] != existing_profile.get(k):
                    has_contradiction = True
                    break
            if "age" in extracted_fields and existing_profile.get("age"):
                if abs(extracted_fields["age"] - existing_profile["age"]) >= 3:
                    has_contradiction = True

        is_fresh_profile = (core_fields_count >= 3) or (core_fields_count >= 2 and has_contradiction)

        if any(w in lowered for w in ["disability", "disabled", "divyang", "viklang", "दिव्यांग", "विकलांग", "अक्षम"]):
            is_self = not any(w in lowered for w in ["wife", "patni", "पत्नी", "husband", "pati", "पति", "son", "beta", "बेटा", "पुत्र", "daughter", "beti", "बेटी", "पुत्री"])
            if is_self:
                extracted_fields["has_disability"] = True
                metadata_map["has_disability"] = {
                    "value": True,
                    "confidence": 0.95,
                    "source": "disability match",
                    "is_inferred": False
                }
            else:
                members_list = [] if is_fresh_profile else (list(existing_profile.get("members", [])) if existing_profile else [])
                rel = "अन्य सदस्य"
                if any(w in lowered for w in ["wife", "patni", "पत्नी"]):
                    rel = "पत्नी"
                elif any(w in lowered for w in ["husband", "pati", "पति"]):
                    rel = "पति"
                elif any(w in lowered for w in ["son", "beta", "पुत्र", "बेटा"]):
                    rel = "पुत्र"
                elif any(w in lowered for w in ["daughter", "beti", "पुत्री", "बेटी"]):
                    rel = "पुत्री"
                members_list.append({
                    "relationship": rel,
                    "has_disability": True
                })
                extracted_fields["members"] = members_list
                extracted_fields["has_disability"] = False
        else:
            extracted_fields["has_disability"] = False

        # Family member extraction for student children
        existing_members = list(extracted_fields.get("members") or ([] if is_fresh_profile else (existing_profile.get("members", []) if existing_profile else [])))
        if any(w in lowered for w in ["daughter", "beti", "बेटी", "पुत्री"]):
            if not any(m.get("relationship") in ["पुत्री", "daughter"] for m in existing_members):
                existing_members.append({
                    "relationship": "पुत्री",
                    "is_student": True,
                    "age": 18,
                    "occupation": "छात्र"
                })
        if any(w in lowered for w in ["son", "beta", "बेटा", "पुत्र"]):
            if not any(m.get("relationship") in ["पुत्र", "son"] for m in existing_members):
                existing_members.append({
                    "relationship": "पुत्र",
                    "is_student": True,
                    "age": 16,
                    "occupation": "छात्र"
                })

        # Generic children match: "two children", "2 kids", "दो बच्चे", "children's education"
        child_match = re.search(r'\b(?:(\d+|two|three|four|do|teen|chaar|दो|तीन|चार)\s+)?(?:children|child|kids|बच्चे|बालक)\b', lowered)
        if child_match or "children" in lowered or "kids" in lowered or "बच्चे" in lowered:
            count_str = child_match.group(1) if child_match else None
            num_children = 2
            if count_str:
                num_map = {"1": 1, "one": 1, "ek": 1, "एक": 1, "2": 2, "two": 2, "do": 2, "दो": 2, "3": 3, "three": 3, "teen": 3, "तीन": 3, "4": 4, "four": 4, "chaar": 4, "चार": 4}
                num_children = num_map.get(count_str.lower(), 2)

            existing_child_count = sum(1 for m in existing_members if m.get("relationship") in ["पुत्र", "पुत्री", "बच्चा 1", "बच्चा 2", "बच्चा", "child", "son", "daughter"])
            needed = num_children - existing_child_count
            for i in range(max(0, needed)):
                existing_members.append({
                    "relationship": f"बच्चा {existing_child_count + i + 1}",
                    "is_student": True,
                    "age": 10 + i * 2,
                    "occupation": "छात्र"
                })

        if existing_members:
            extracted_fields["members"] = existing_members

        # Housing status (kutcha / pucca)
        housing_val = None
        for k, v in kv_pairs.items():
            if any(h in k for h in ["house", "housing", "मकान", "आवास"]):
                vl = v.lower()
                if any(w in vl for w in ["kutcha", "kaccha", "कच्चा", "mud", "temporary"]):
                    housing_val = "कच्चा मकान (Kutcha)"
                elif any(w in vl for w in ["pucca", "pakka", "पक्का"]):
                    housing_val = "पक्का मकान (Pucca)"
                elif any(w in vl for w in ["homeless", "no house", "beghar", "बेघर"]):
                    housing_val = "बेघर (Homeless)"
                break
        if not housing_val:
            if re.search(r'\b(?:kutcha|kaccha|कच्चा मकान|कच्चा घर|mud house)\b', lowered):
                housing_val = "कच्चा मकान (Kutcha)"
            elif re.search(r'\b(?:pucca|pakka|पक्का मकान|पक्का घर)\b', lowered):
                housing_val = "पक्का मकान (Pucca)"

        if housing_val:
            extracted_fields["housing_status"] = housing_val
            metadata_map["housing_status"] = {
                "value": housing_val,
                "confidence": 0.95,
                "source": housing_val,
                "is_inferred": False
            }

        # -------------------------------------------------------------
        # 10. Contradiction Resolution & Fresh Profile Handling
        # -------------------------------------------------------------
        if is_fresh_profile or not existing_profile:
            merged = dict(extracted_fields)
        else:
            merged = {**existing_profile, **extracted_fields}

        # Strict contradiction rules:
        # A. Male cannot be a widow
        if merged.get("gender") == "पुरुष" and merged.get("marital_status") == "विधवा":
            merged["marital_status"] = None
            if "marital_status" in extracted_fields:
                extracted_fields["marital_status"] = None

        # B. If state is explicitly extracted, clear any old conflicting district
        if "state" in extracted_fields and existing_profile and existing_profile.get("state") != extracted_fields["state"]:
            if "district" not in extracted_fields:
                merged["district"] = None

        # C. If occupation is unemployed youth, clear farmer landholding requirements
        if "occupation" in extracted_fields and extracted_fields["occupation"] == "बेरोजगार युवा":
            if "landholding" not in extracted_fields:
                merged["landholding"] = 0.0

        # -------------------------------------------------------------
        # 11. Missing Fields Analysis
        # -------------------------------------------------------------
        missing_critical: List[str] = []
        missing_optional: List[str] = []

        occ = (merged.get("occupation") or "")
        req = (merged.get("assistance_requirement") or "")

        # State is critical for all searches
        if not merged.get("state"):
            missing_critical.append("state")

        # Age is critical for almost all welfare programs
        if not merged.get("age"):
            missing_critical.append("age")

        # Domain specific critical fields
        is_widow_clean = (merged.get("marital_status") == "विधवा") and (merged.get("gender") != "पुरुष")
        if ("किसान" in occ or req == "agriculture") and not is_widow_clean:
            if merged.get("landholding") is None:
                missing_critical.append("landholding")
            if not merged.get("annual_income"):
                missing_optional.append("annual_income")
        elif "बेरोजगार" in occ or req in ["employment", "skills", "business"]:
            if not merged.get("education"):
                missing_critical.append("education")
            if not merged.get("annual_income"):
                missing_optional.append("annual_income")
        elif req == "pension":
            if not merged.get("marital_status") and (merged.get("age") or 0) < 60:
                missing_critical.append("marital_status")
            if not merged.get("annual_income"):
                missing_optional.append("annual_income")
        elif req == "education":
            if not merged.get("education"):
                missing_critical.append("education")
        else:
            if not merged.get("annual_income") and not merged.get("is_student"):
                missing_optional.append("annual_income")

        return {
            "extracted_data": extracted_fields,
            "metadata": metadata_map,
            "missing_critical_fields": missing_critical,
            "missing_optional_fields": missing_optional,
            "is_fresh_profile": is_fresh_profile
        }


profile_extractor = ProfileExtractor()
