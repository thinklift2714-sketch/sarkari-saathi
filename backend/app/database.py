"""
Database abstraction layer for Sarkari Saathi.
Supports Supabase PostgreSQL when credentials exist, with a robust
in-memory fallback containing 35 verified real schemes and the demo persona.
"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.config import settings

# In-memory storage for default persona (Seeta Devi)
DEMO_USER_ID = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
DEMO_PROFILE_ID = "f1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"

DB_PROFILE: Dict[str, Any] = {
    "id": DEMO_PROFILE_ID,
    "user_id": DEMO_USER_ID,
    "name": "सीता देवी",
    "age": 52,
    "gender": "महिला",
    "marital_status": "विधवा",
    "state": "उत्तर प्रदेश",
    "district": "वाराणसी",
    "village_or_town": "पिंडरा",
    "occupation": "किसान की विधवा",
    "annual_income": 45000.0,
    "family_size": 2,
    "has_bank_account": True,
    "landholding": 0.8,
    "caste_category": "सामान्य / अन्य",
    "is_student": False,
    "has_disability": False,
    "current_benefits": ["राशन कार्ड"],
    "members": [
        {
            "id": "m1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            "name": "सीता देवी",
            "relationship": "मुख्य सदस्य",
            "age": 52,
            "occupation": "किसान की विधवा"
        },
        {
            "id": "m2b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            "name": "राम कुमार",
            "relationship": "पुत्र",
            "age": 28,
            "occupation": "किसान"
        }
    ]
}

# User Document Status Store: Document Name -> Status ('available' | 'missing' | 'uploaded')
DB_USER_DOCS: Dict[str, str] = {
    "आधार कार्ड": "available",
    "बैंक पासबुक": "available",
    "आय प्रमाण पत्र": "missing",
    "निवास प्रमाण पत्र": "missing",
    "विधवा प्रमाण पत्र": "missing",
    "पति का मृत्यु प्रमाण पत्र": "missing",
    "पासपोर्ट आकार का फोटो": "available",
    "जमीन की खतौनी (भूलेख नकल)": "available",
    "राशन कार्ड": "available"
}

# Applications Store
DB_APPLICATIONS: List[Dict[str, Any]] = [
    {
        "id": "app_001",
        "scheme_id": "scheme_up_widow_pension",
        "scheme_name_hindi": "विधवा पेंशन योजना",
        "department_hindi": "महिला कल्याण विभाग, उत्तर प्रदेश",
        "application_status": "submitted_at_csc",
        "application_reference": "UP-WIDOW-2024-88492",
        "applied_date": "2024-10-15",
        "official_website": "https://sspy-up.gov.in"
    }
]

# 35 Verified Real Government Schemes (Central & Uttar Pradesh)
DB_SCHEMES: List[Dict[str, Any]] = [
    # 1. UP Widow Pension Scheme
    {
        "id": "scheme_up_widow_pension",
        "scheme_name": "Uttar Pradesh Destitute Widow Pension Scheme",
        "scheme_name_hindi": "विधवा पेंशन योजना",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Financial assistance scheme providing monthly pension to destitute widows in Uttar Pradesh.",
        "description_hindi": "पति की मृत्यु के बाद निराश्रित विधवा महिलाओं को आर्थिक सुरक्षा और सम्मानपूर्वक जीवन के लिए ₹1,000 मासिक पेंशन।",
        "department": "Department of Social Welfare, Government of Uttar Pradesh",
        "department_hindi": "सामाजिक न्याय विभाग, उत्तर प्रदेश",
        "ministry": "Ministry of Women Welfare, UP",
        "ministry_hindi": "महिला कल्याण विभाग, उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["women", "widow", "bpl", "rural"],
        "benefits": {
            "monthly_amount": 1000,
            "annual_total": 12000,
            "description_hindi": "प्रतिमाह ₹1,000 की पेंशन (सीधे बैंक खाते में त्रैमासिक आधार पर)",
            "description_en": "Monthly pension of Rs 1,000 deposited directly into bank account"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "marital_status": ["विधवा", "widowed"],
            "states": ["उत्तर प्रदेश"],
            "max_annual_income": 200000,
            "gender": ["महिला"]
        },
        "required_documents": [
            "आधार कार्ड",
            "पति का मृत्यु प्रमाण पत्र",
            "आय प्रमाण पत्र",
            "निवास प्रमाण पत्र",
            "बैंक पासबुक",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "कागजात तैयार करें", "desc": "पति का मृत्यु प्रमाण पत्र, आय व निवास प्रमाण पत्र तैयार रखें।"},
            {"step": 2, "title": "ऑनलाइन आवेदन (sspy-up.gov.in)", "desc": "नजदीकी सीएससी केंद्र या जनसुविधा केंद्र पर जाकर ऑनलाइन फॉर्म भरें।"},
            {"step": 3, "title": "फॉर्म की हार्डकॉपी जमा करें", "desc": "आवेदन पत्र की प्रति जिला प्रोबेशन अधिकारी कार्यालय में जमा करें।"},
            {"step": 4, "title": "तहसील स्तर पर सत्यापन", "desc": "लेखपाल/एसडीएम स्तर से पात्रता का भौतिक सत्यापन होगा।"},
            {"step": 5, "title": "पेंशन स्वीकृति", "desc": "सत्यापन उपरांत डीबीटी के माध्यम से सीधे खाते में पेंशन प्रारंभ।"}
        ],
        "official_website": "https://sspy-up.gov.in",
        "official_source": "महिला कल्याण विभाग, उत्तर प्रदेश सरकार / SSPY",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 2. PM-KISAN
    {
        "id": "scheme_pm_kisan",
        "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "scheme_name_hindi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Income support scheme of Rs 6,000 per year in three equal installments to all landholding farmer families.",
        "description_hindi": "सभी भूमिधारक किसान परिवारों को खेती की जरूरतों के लिए ₹6,000 की वार्षिक वित्तीय सहायता तीन समान किस्तों में दी जाती है।",
        "department": "Department of Agriculture and Farmers Welfare",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "ministry": "Ministry of Agriculture and Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "rural"],
        "benefits": {
            "monthly_amount": 500,
            "annual_total": 6000,
            "installments": "₹2,000 की 3 किस्तें प्रतिवर्ष",
            "description_hindi": "किसानों को ₹6,000 वार्षिक सहायता (हर 4 माह में ₹2,000 की किस्त)",
            "description_en": "Annual financial benefit of Rs 6,000 paid in 3 four-monthly installments"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True,
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "जमीन की खतौनी (भूलेख नकल)",
            "मोबाइल नंबर"
        ],
        "optional_documents": ["पहचान पत्र"],
        "application_steps": [
            {"step": 1, "title": "खतौनी व बैंक पासबुक तैयार रखें", "desc": "जमीन के कागजात और आधार से लिंक बैंक खाता होना आवश्यक है।"},
            {"step": 2, "title": "CSC केंद्र या pmkisan.gov.in पर पंजीकरण", "desc": "नजदीकी सीएससी केंद्र पर जाकर New Farmer Registration कराएं।"},
            {"step": 3, "title": "e-KYC पूर्ण करें", "desc": "बायोमेट्रिक या आधार ओटीपी के जरिए ई-केवाईसी सत्यापित करें।"},
            {"step": 4, "title": "पटवारी / कृषि विभाग से सत्यापन", "desc": "तहसील स्तर पर भूमि अभिलेखों का सत्यापन किया जाता है।"},
            {"step": 5, "title": "किस्त भुगतान प्राप्त करें", "desc": "स्वीकृति के बाद हर 4 महीने में ₹2,000 सीधे बैंक खाते में आएंगे।"}
        ],
        "official_website": "https://pmkisan.gov.in",
        "official_source": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 3. Ayushman Bharat (PM-JAY)
    {
        "id": "scheme_pm_jay",
        "scheme_name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "scheme_name_hindi": "आयुष्मान भारत (PM-JAY) स्वास्थ्य कार्ड",
        "category": "health",
        "category_hindi": "स्वास्थ्य एवं चिकित्सा",
        "description": "Free health insurance cover of Rs 5 lakh per family per year for secondary and tertiary care hospitalization.",
        "description_hindi": "गरीब और जरूरतमंद परिवारों को ₹5 लाख तक का सालाना मुफ्त इलाज सरकारी व संबद्ध निजी अस्पतालों में मिलता है।",
        "department": "National Health Authority (NHA)",
        "department_hindi": "स्वास्थ्य एवं परिवार कल्याण मंत्रालय",
        "ministry": "Ministry of Health and Family Welfare",
        "ministry_hindi": "स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["bpl", "poor", "rural", "health"],
        "benefits": {
            "annual_total": 500000,
            "description_hindi": "₹5 लाख तक का कैशलेस और मुफ्त इलाज प्रति परिवार प्रति वर्ष",
            "description_en": "Health cover up to Rs 5 lakh per family per year for secondary and tertiary hospitalization"
        },
        "eligibility_conditions": {
            "max_annual_income": 250000
        },
        "required_documents": [
            "आधार कार्ड",
            "राशन कार्ड",
            "परिवार पहचान पत्र"
        ],
        "optional_documents": ["वोटर आईडी"],
        "application_steps": [
            {"step": 1, "title": "पात्रता सूची में नाम जांचें", "desc": "beneficiary.nha.gov.in या नजदीकी CSC केंद्र पर राशन कार्ड से पात्रता देखें।"},
            {"step": 2, "title": "आयुष्मान मित्र / CSC केंद्र से संपर्क", "desc": "सरकारी अस्पताल या CSC पर आधार कार्ड और राशन कार्ड लेकर जाएं।"},
            {"step": 3, "title": "बायोमेट्रिक ई-केवाईसी कराएं", "desc": "अंगूठे का निशान या फेस ऑथेंटिकेशन से पहचान सत्यापित करें।"},
            {"step": 4, "title": "आयुष्मान गोल्डन कार्ड डाउनलोड करें", "desc": "सत्यापन के बाद पीवीसी कार्ड या पीडीएफ कार्ड तुरंत प्राप्त करें।"}
        ],
        "official_website": "https://pmjay.gov.in",
        "official_source": "राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA), भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 4. PM Ujjwala Yojana 2.0
    {
        "id": "scheme_pm_ujjwala",
        "scheme_name": "Pradhan Mantri Ujjwala Yojana (PMUY 2.0)",
        "scheme_name_hindi": "प्रधानमंत्री उज्ज्वला योजना 2.0",
        "category": "energy",
        "category_hindi": "ऊर्जा एवं एलपीजी",
        "description": "Deposit-free LPG connection along with first refill and hotplate free of cost to adult women from poor households.",
        "description_hindi": "गरीब परिवारों की वयस्क महिलाओं को धुआं मुक्त रसोई के लिए मुफ्त गैस कनेक्शन, पहला भरा सिलेंडर और गैस चूल्हा दिया जाता है।",
        "department": "Ministry of Petroleum and Natural Gas",
        "department_hindi": "पेट्रोलियम एवं प्राकृतिक गैस मंत्रालय",
        "ministry": "Ministry of Petroleum and Natural Gas, Government of India",
        "ministry_hindi": "पेट्रोलियम एवं प्राकृतिक गैस मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["women", "bpl", "rural"],
        "benefits": {
            "description_hindi": "मुफ्त गैस कनेक्शन, पहला भरा सिलेंडर और गैस चूल्हा निशुल्क",
            "description_en": "Deposit-free LPG cylinder connection, free first refill, and stove"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "gender": ["महिला"],
            "max_annual_income": 200000
        },
        "required_documents": [
            "आधार कार्ड",
            "राशन कार्ड",
            "बैंक पासबुक",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["निवास प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "दस्तावेज़ एकत्रित करें", "desc": "महिला मुखिया का आधार, राशन कार्ड व बैंक खाता विवरण।"},
            {"step": 2, "title": "गैस वितरक एजेंसी (Indane/HP/Bharat) जाएं", "desc": "गैस वितरक या CSC केंद्र पर 14-सूत्रीय घोषणा पत्र जमा करें।"},
            {"step": 3, "title": "सत्यापन प्रक्रिया", "desc": "एजेंसी द्वारा घर में पहले से कोई गैस कनेक्शन न होने की जांच की जाती है।"},
            {"step": 4, "title": "गैस कनेक्शन प्राप्त करें", "desc": "सत्यापन पश्चात सिलेंडर, रेगुलेटर व चूल्हा प्राप्त करें।"}
        ],
        "official_website": "https://www.pmuy.gov.in",
        "official_source": "पेट्रोलियम एवं प्राकृतिक गैस मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 5. PMAY - Gramin
    {
        "id": "scheme_pmay_g",
        "scheme_name": "Pradhan Mantri Awas Yojana - Gramin",
        "scheme_name_hindi": "प्रधानमंत्री आवास योजना (ग्रामीण)",
        "category": "housing",
        "category_hindi": "आवास एवं आश्रय",
        "description": "Financial assistance to rural houseless families and those living in dilapidated houses for construction of pucca houses.",
        "description_hindi": "बेघर और कच्चे मकानों में रहने वाले ग्रामीण परिवारों को पक्के घर निर्माण हेतु ₹1.20 लाख की सीधी आर्थिक सहायता।",
        "department": "Ministry of Rural Development",
        "department_hindi": "ग्रामीण विकास मंत्रालय",
        "ministry": "Ministry of Rural Development, Government of India",
        "ministry_hindi": "ग्रामीण विकास मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["rural", "bpl", "housing"],
        "benefits": {
            "annual_total": 120000,
            "description_hindi": "पक्के मकान निर्माण हेतु ₹1,20,000 की सीधी सहायता (3 किस्तों में) + मनरेगा मजदूरी (₹20,000+)",
            "description_en": "Rs 1,20,000 financial grant in 3 installments plus 90-95 days of MGNREGA wages"
        },
        "eligibility_conditions": {
            "max_annual_income": 150000
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "राशन कार्ड",
            "जमीन या वर्तमान कच्चे घर की फोटो"
        ],
        "optional_documents": ["मनरेगा जॉब कार्ड"],
        "application_steps": [
            {"step": 1, "title": "आवास प्लस सूची में पंजीकरण", "desc": "ग्राम पंचायत स्तर पर पंचायत सचिव/ग्राम रोजगार सेवक द्वारा सर्वेक्षण।"},
            {"step": 2, "title": "जियो-टैगिंग", "desc": "मौजूदा कच्चे मकान और प्रस्तावित स्थल की जियो-टैग फोटो ली जाती है।"},
            {"step": 3, "title": "प्रथम किस्त अंतरण", "desc": "नींव कार्य के लिए ₹40,000 की पहली किस्त बैंक खाते में।"},
            {"step": 4, "title": "द्वितीय व तृतीय किस्त", "desc": "लिंटल और छत स्तर के सत्यापन पश्चात बाकी राशि जारी होती है।"}
        ],
        "official_website": "https://pmayg.nic.in",
        "official_source": "ग्रामीण विकास मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 6. PM Crop Insurance (PMFBY)
    {
        "id": "scheme_pmfby",
        "scheme_name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "scheme_name_hindi": "प्रधानमंत्री फसल बीमा योजना",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss/damage from unforeseen events.",
        "description_hindi": "प्राकृतिक आपदाओं, सूखा, बाढ़, कीट हमले से फसल नुकसान होने पर किसानों को न्यूनतम प्रीमियम पर व्यापक बीमा मुआवजा।",
        "department": "Ministry of Agriculture & Farmers Welfare",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "rural"],
        "benefits": {
            "description_hindi": "रबी फसल पर मात्र 1.5% और खरीफ पर 2% प्रीमियम पर संपूर्ण फसल बर्बादी पर पूर्ण आर्थिक मुआवजा",
            "description_en": "Crop loss indemnity at heavily subsidized premium rates (1.5% to 2%)"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "जमीन की खतौनी (भूलेख नकल)",
            "बुवाई प्रमाण पत्र / घोषणा"
        ],
        "optional_documents": ["किरायानामा (बटाईदार हेतु)"],
        "application_steps": [
            {"step": 1, "title": "बुवाई के 15 दिनों में पंजीकरण", "desc": "फसल बोने के बाद नजदीकी बैंक शाखा या CSC केंद्र पर पंजीकरण करें।"},
            {"step": 2, "title": "प्रीमियम भुगतान", "desc": "रबी पर केवल 1.5% और खरीफ पर 2% टोकन प्रीमियम जमा करें।"},
            {"step": 3, "title": "फसल क्षति सूचना (72 घंटे में)", "desc": "आपदा आने पर 72 घंटे के भीतर टोल-फ्री 14447 या फसल बीमा ऐप पर दर्ज करें।"},
            {"step": 4, "title": "दावा निपटान", "desc": "सैटेलाइट व फील्ड सर्वे के बाद सीधा मुआवजा बैंक खाते में अंतरित।"}
        ],
        "official_website": "https://pmfby.gov.in",
        "official_source": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 7. MGNREGA
    {
        "id": "scheme_mgnrega",
        "scheme_name": "Mahatma Gandhi National Rural Employment Guarantee Act",
        "scheme_name_hindi": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार (मनरेगा)",
        "category": "employment",
        "category_hindi": "रोजगार एवं कौशल",
        "description": "Legal guarantee for at least 100 days of wage employment in a financial year to rural households whose adult members volunteer to do unskilled manual work.",
        "description_hindi": "प्रत्येक ग्रामीण परिवार को प्रतिवर्ष 100 दिनों का अकुशल शारीरिक रोजगार पाने का कानूनी अधिकार और समय पर मजदूरी भुगतान।",
        "department": "Ministry of Rural Development",
        "department_hindi": "ग्रामीण विकास मंत्रालय",
        "ministry": "Ministry of Rural Development, Government of India",
        "ministry_hindi": "ग्रामीण विकास मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["rural", "worker", "bpl"],
        "benefits": {
            "daily_wage": 240,
            "description_hindi": "प्रतिदिन ₹240+ की मजदूरी और साल में कम से कम 100 दिन का पक्का काम (15 दिन में काम न मिलने पर बेरोजगारी भत्ता)",
            "description_en": "Guaranteed 100 days of wage employment per financial year per rural household"
        },
        "eligibility_conditions": {
            "min_age": 18
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "राशन कार्ड",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "ग्राम पंचायत में जॉब कार्ड आवेदन", "desc": "पंचायत सचिव या ग्राम रोजगार सेवक को फॉर्म भर कर दें।"},
            {"step": 2, "title": "जॉब कार्ड जारी होना", "desc": "15 दिनों के भीतर परिवार का निःशुल्क मनरेगा जॉब कार्ड बन जाता है।"},
            {"step": 3, "title": "काम की मांग", "desc": "लिखित में काम मांगें; 15 दिन में काम न मिलने पर बेरोजगारी भत्ता देय होगा।"},
            {"step": 4, "title": "साप्ताहिक मजदूरी भुगतान", "desc": "काम पूरा होने के 15 दिनों में सीधा बैंक खाते में मजदूरी आएगी।"}
        ],
        "official_website": "https://nrega.nic.in",
        "official_source": "ग्रामीण विकास मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 8. Swachh Bharat Mission (IHHL Toilet Subsidy)
    {
        "id": "scheme_swachh_bharat_ihhl",
        "scheme_name": "Swachh Bharat Mission - Gramin (Individual Household Latrine Subsidy)",
        "scheme_name_hindi": "स्वच्छ भारत मिशन (ग्रामीण शौचालय सहायता)",
        "category": "housing",
        "category_hindi": "आवास एवं स्वच्छता",
        "description": "Financial incentive of Rs 12,000 for construction of individual household latrine to eligible rural households.",
        "description_hindi": "ग्रामीण क्षेत्र के पात्र परिवारों को घर में पक्का शौचालय निर्माण हेतु ₹12,000 की एकमुश्त वित्तीय सहायता।",
        "department": "Department of Drinking Water and Sanitation",
        "department_hindi": "जल शक्ति मंत्रालय, पेयजल एवं स्वच्छता विभाग",
        "ministry": "Ministry of Jal Shakti, Government of India",
        "ministry_hindi": "जल शक्ति मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["rural", "bpl", "sanitation"],
        "benefits": {
            "annual_total": 12000,
            "description_hindi": "पक्का शौचालय बनाने के लिए ₹12,000 की सीधी प्रोत्साहन राशि (2 किस्तों में)",
            "description_en": "One-time incentive of Rs 12,000 for construction of individual household latrine"
        },
        "eligibility_conditions": {
            "max_annual_income": 180000
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "राशन कार्ड",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["निवास प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "sbm.gov.in पर ऑनलाइन आवेदन", "desc": "नागरिक पंजीकरण कर ऑनलाइन शौचालय आवेदन फॉर्म भरें या ग्राम प्रधान से संपर्क करें।"},
            {"step": 2, "title": "भौतिक सत्यापन", "desc": "ग्राम पंचायत स्तर पर अधिकारी शौचालय निर्माण स्थल की जांच करेंगे।"},
            {"step": 3, "title": "शौचालय निर्माण व फोटो अपलोड", "desc": "शौचालय निर्माण के बाद लाभार्थी के साथ जियो-टैग फोटो अपलोड करें।"},
            {"step": 4, "title": "खाते में ₹12,000 प्राप्त करें", "desc": "सत्यापन के 7 दिनों में राशि सीधे बैंक खाते में आएगी।"}
        ],
        "official_website": "https://sbm.gov.in",
        "official_source": "पेयजल एवं स्वच्छता विभाग, जल शक्ति मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 9. National Family Benefit Scheme (NFBS)
    {
        "id": "scheme_nfbs",
        "scheme_name": "National Family Benefit Scheme (NFBS)",
        "scheme_name_hindi": "राष्ट्रीय पारिवारिक लाभ योजना",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Lump sum financial assistance of Rs 30,000 provided to bereaved BPL households on death of primary breadwinner.",
        "description_hindi": "परिवार के मुख्य कमाने वाले (महिला या पुरुष) की आकस्मिक मृत्यु होने पर गरीब परिवार को ₹30,000 की एकमुश्त सहायता।",
        "department": "Department of Social Welfare, Government of Uttar Pradesh / MoRD",
        "department_hindi": "समाज कल्याण विभाग, उत्तर प्रदेश / ग्रामीण विकास",
        "ministry": "Ministry of Rural Development, Government of India / SSPY UP",
        "ministry_hindi": "समाज कल्याण विभाग, उत्तर प्रदेश",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP", "All"],
        "beneficiary_tags": ["widow", "bpl", "poor", "rural"],
        "benefits": {
            "annual_total": 30000,
            "description_hindi": "कमाने वाले सदस्य की मृत्यु पर ₹30,000 की एकमुश्त आर्थिक सहायता सीधे बैंक खाते में",
            "description_en": "Lump sum grant of Rs 30,000 to the bereaved family"
        },
        "eligibility_conditions": {
            "marital_status": ["विधवा", "widowed"],
            "max_annual_income": 56460, # UP rural limit
            "states": ["उत्तर प्रदेश"]
        },
        "required_documents": [
            "आधार कार्ड",
            "मृतक का मृत्यु प्रमाण पत्र",
            "मृतक का आयु प्रमाण पत्र (18-59 वर्ष)",
            "आय प्रमाण पत्र (तहसील द्वारा जारी)",
            "निवास प्रमाण पत्र",
            "बैंक पासबुक"
        ],
        "optional_documents": ["परिवार रजिस्टर की नकल"],
        "application_steps": [
            {"step": 1, "title": "मृत्यु प्रमाण पत्र प्राप्त करें", "desc": "ग्राम पंचायत या नगर निकाय से अधिकृत मृत्यु प्रमाण पत्र लें।"},
            {"step": 2, "title": "ऑनलाइन आवेदन (nfbs.upsdc.gov.in)", "desc": "मृत्यु के एक वर्ष के भीतर नजदीकी जनसुविधा केंद्र पर आवेदन करें।"},
            {"step": 3, "title": "हार्डकॉपी तहसील में जमा करें", "desc": "आवेदन पत्र की प्रतिलिपि संबंधित उपजिलाधिकारी (SDM) कार्यालय में जमा करें।"},
            {"step": 4, "title": "डीबीटी भुगतान", "desc": "तहसीलदार द्वारा जांच के उपरांत ₹30,000 सीधे बैंक खाते में अंतरित किए जाते हैं।"}
        ],
        "official_website": "http://nfbs.upsdc.gov.in",
        "official_source": "समाज कल्याण विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 10. UP Mukhyamantri Krishak Durghatna Kalyan Yojana
    {
        "id": "scheme_up_krishak_durghatna",
        "scheme_name": "UP Mukhyamantri Krishak Durghatna Kalyan Yojana",
        "scheme_name_hindi": "मुख्यमंत्री कृषक दुर्घटना कल्याण योजना (उत्तर प्रदेश)",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Financial compensation of up to Rs 5 lakh to farmer families in UP in the event of accidental death or permanent disability.",
        "description_hindi": "उत्तर प्रदेश के किसान या उनके परिवार के कमाऊ सदस्य की दुर्घटना में मृत्यु या स्थायी दिव्यांगता पर ₹5 लाख तक का मुआवजा।",
        "department": "Board of Revenue / Agriculture Department, UP",
        "department_hindi": "राजस्व परिषद / कृषि विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["farmer", "rural", "compensation"],
        "benefits": {
            "annual_total": 500000,
            "description_hindi": "दुर्घटना में किसान की मृत्यु पर आश्रित को ₹5,00,000 की आर्थिक सहायता",
            "description_en": "Compensation of Rs 5 lakh on accidental death or permanent disability"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "states": ["उत्तर प्रदेश"],
            "min_age": 18,
            "max_age": 70
        },
        "required_documents": [
            "आधार कार्ड (मृतक व आश्रित)",
            "पोस्टमार्टम रिपोर्ट / पुलिस पंचनामा",
            "मृत्यु प्रमाण पत्र",
            "जमीन की खतौनी या बटाईदार प्रमाण",
            "उत्तराधिकार प्रमाण पत्र / वारिसान",
            "बैंक पासबुक"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "दुर्घटना के 45 दिनों में आवेदन", "desc": "तहसीलदार या एसडीएम कार्यालय में निर्धारित प्रपत्र पर आवेदन पत्र जमा करें।"},
            {"step": 2, "title": "राजस्व लेखपाल द्वारा जांच", "desc": "क्षेत्रीय लेखपाल व कानूनगो मौके पर जाकर दुर्घटना और भूमि अभिलेखों की जांच करेंगे।"},
            {"step": 3, "title": "जिलाधिकारी समिति द्वारा अनुमोदन", "desc": "डीएम की अध्यक्षता वाली जिला स्तरीय समिति द्वारा मुआवजा स्वीकृत किया जाता है।"},
            {"step": 4, "title": "डीबीटी भुगतान", "desc": "₹5 लाख की पूरी राशि सीधे आश्रित के खाते में ट्रांसफर की जाती है।"}
        ],
        "official_website": "https://agridarshan.up.gov.in",
        "official_source": "कृषि विभाग एवं राजस्व विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 11. UP Krishi Yantra Subsidy Yojana (UP Agridarshan)
    {
        "id": "scheme_up_krishi_yantra",
        "scheme_name": "UP Agricultural Mechanization & Equipment Subsidy Scheme",
        "scheme_name_hindi": "उत्तर प्रदेश कृषि यंत्र अनुदान योजना (कृषि दर्शन)",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "40% to 50% subsidy on purchase of modern farm machinery, rotavators, solar pumps, and threshers in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश के किसानों को रोटावेटर, कल्टीवेटर, लेजर लैंड लेवलर और सोलर पंप की खरीद पर 40% से 50% तक सरकारी अनुदान।",
        "department": "Department of Agriculture, Uttar Pradesh",
        "department_hindi": "कृषि विभाग, उत्तर प्रदेश",
        "ministry": "Department of Agriculture, Government of Uttar Pradesh",
        "ministry_hindi": "कृषि विभाग, उत्तर प्रदेश",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["farmer", "rural", "equipment"],
        "benefits": {
            "description_hindi": "कृषि उपकरणों और सोलर पंप पर 40% से 50% तक सीधा सरकारी अनुदान (सीधे बैंक खाते में)",
            "description_en": "Direct subsidy of 40% to 50% on purchase of approved farm machinery"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "states": ["उत्तर प्रदेश"],
            "has_landholding": True
        },
        "required_documents": [
            "आधार कार्ड",
            "कृषक पंजीकरण संख्या (agridarshan.up.gov.in)",
            "जमीन की खतौनी (भूलेख)",
            "बैंक पासबुक",
            "यंत्र खरीद बिल"
        ],
        "optional_documents": ["जाति प्रमाण पत्र (SC/ST अतिरिक्त छूट हेतु)"],
        "application_steps": [
            {"step": 1, "title": "कृषि दर्शन पोर्टल पर पंजीकरण", "desc": "agridarshan.up.gov.in पर किसान पंजीकरण संख्या प्राप्त करें।"},
            {"step": 2, "title": "टोकन बुकिंग व जमानत राशि", "desc": "इच्छित यंत्र के लिए ऑनलाइन टोकन बुक करें और चालान जमा करें।"},
            {"step": 3, "title": "अधिकृत डीलर से खरीद", "desc": "अनुमोदित निर्माता/डीलर से यंत्र खरीदें और पक्का जीएसटी बिल लें।"},
            {"step": 4, "title": "भौतिक सत्यापन व सब्सिडी अंतरण", "desc": "कृषि अधिकारी द्वारा यंत्र का सत्यापन होने पर अनुदान राशि सीधे खाते में पहुंचेगी।"}
        ],
        "official_website": "https://agridarshan.up.gov.in",
        "official_source": "कृषि विभाग, उत्तर प्रदेश सरकार (UP Agriculture Portal)",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 12. Deendayal Antyodaya Yojana - NRLM (SHG / स्वयं सहायता समूह)
    {
        "id": "scheme_nrlm_shg",
        "scheme_name": "Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM)",
        "scheme_name_hindi": "राष्ट्रीय ग्रामीण आजीविका मिशन (स्वयं सहायता समूह)",
        "category": "employment",
        "category_hindi": "रोजगार एवं महिला सशक्तीकरण",
        "description": "Mobilization of rural women into Self Help Groups (SHGs) with revolving funds, community investment support, and low-interest bank credit.",
        "description_hindi": "ग्रामीण महिलाओं को स्वयं सहायता समूह (SHG) से जोड़कर सिलाई, डेयरी, आचार-पापड़, अगरबत्ती आदि स्वरोजगार हेतु ब्याज-मुक्त व सस्ते ऋण की सुविधा।",
        "department": "Ministry of Rural Development / UP-SRLM",
        "department_hindi": "ग्रामीण विकास मंत्रालय / उत्तर प्रदेश राज्य ग्रामीण आजीविका मिशन",
        "ministry": "Ministry of Rural Development, Government of India",
        "ministry_hindi": "ग्रामीण विकास मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["women", "rural", "employment", "self_help_group"],
        "benefits": {
            "annual_total": 50000,
            "description_hindi": "रिवॉल्विंग फंड ₹15,000 + सामुदायिक निवेश निधि ₹1,10,000 और 7% ब्याज पर बिना गारंटी बैंक ऋण",
            "description_en": "Revolving fund, community investment fund, and collateral-free bank loans up to Rs 20 lakh for SHGs"
        },
        "eligibility_conditions": {
            "gender": ["महिला"],
            "min_age": 18
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "पासपोर्ट आकार का फोटो",
            "समूह गठन प्रस्ताव"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "गांव में 10-15 महिलाओं का समूह बनाएं", "desc": "ग्राम स्तर पर आजीविका सखी या ब्लॉक मिशन मैनेजर से संपर्क करें।"},
            {"step": 2, "title": "समूह का बैंक बचत खाता खोलें", "desc": "नजदीकी ग्रामीण बैंक या राष्ट्रीयकृत बैंक में समूह खाता खुलवाएं।"},
            {"step": 3, "title": "रिवॉल्विंग फंड (RF) प्राप्त करें", "desc": "नियमित बचत और बैठक के 3 महीने बाद सरकार से ₹15,000 प्रारंभिक फंड मिलता है।"},
            {"step": 4, "title": "आजीविका ऋण व प्रशिक्षण", "desc": "सिलाई, मुर्गी पालन, डेयरी या दुकान के लिए रियायती ऋण प्राप्त करें।"}
        ],
        "official_website": "https://aajeevika.gov.in",
        "official_source": "राष्ट्रीय ग्रामीण आजीविका मिशन (DAY-NRLM) / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 13. UP Banking Correspondent (BC) Sakhi Yojana
    {
        "id": "scheme_up_bc_sakhi",
        "scheme_name": "Uttar Pradesh BC Sakhi Yojana",
        "scheme_name_hindi": "उत्तर प्रदेश बीसी सखी योजना",
        "category": "employment",
        "category_hindi": "रोजगार एवं महिला सशक्तीकरण",
        "description": "Employment opportunity for rural women in UP to act as Banking Correspondents, providing door-to-door banking services with monthly stipend.",
        "description_hindi": "उत्तर प्रदेश के गांवों में महिलाओं को बैंकिंग संवाददाता (BC सखी) बनाकर घर-घर पेंशन, निकासी व जमा सेवाएं देने हेतु ₹4,000 मासिक मानदेय और उपकरण।",
        "department": "Uttar Pradesh State Rural Livelihoods Mission (UPSRLM)",
        "department_hindi": "राज्य ग्रामीण आजीविका मिशन, उत्तर प्रदेश",
        "ministry": "Department of Rural Development, Uttar Pradesh",
        "ministry_hindi": "ग्राम्य विकास विभाग, उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["women", "rural", "employment"],
        "benefits": {
            "monthly_amount": 4000,
            "description_hindi": "प्रथम 6 माह तक ₹4,000 प्रतिमाह मानदेय + ₹50,000 हार्डवेयर उपकरण सहायता + हर बैंकिंग लेनदेन पर कमीशन",
            "description_en": "Rs 4,000 monthly stipend for 6 months, Rs 50,000 for POS device, plus commission on transactions"
        },
        "eligibility_conditions": {
            "gender": ["महिला"],
            "states": ["उत्तर प्रदेश"],
            "min_age": 18,
            "max_age": 50
        },
        "required_documents": [
            "आधार कार्ड",
            "10वीं पास अंकपत्र (मैट्रिक)",
            "बैंक पासबुक",
            "निवास प्रमाण पत्र",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["आईआईबीएफ (IIBF) बीसी प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "UP BC Sakhi मोबाइल ऐप डाउनलोड करें", "desc": "गूगल प्ले स्टोर से आधिकारिक ऐप डाउनलोड कर मोबाइल नंबर से रजिस्टर करें।"},
            {"step": 2, "title": "ऑनलाइन परीक्षा व फॉर्म", "desc": "सामान्य ज्ञान व गणित के प्रश्नों का उत्तर देकर योग्यता परीक्षा दें।"},
            {"step": 3, "title": "सत्यापन व चयन", "desc": "ग्राम पंचायत स्तर पर मेरिट सूची के आधार पर चयन किया जाता है।"},
            {"step": 4, "title": "प्रशिक्षण एवं पीओएस मशीन", "desc": "आरसेटी (RSETI) द्वारा 6 दिवसीय प्रशिक्षण के बाद माइक्रो एटीएम व फिंगरप्रिंट स्कैनर प्रदान किया जाता है।"}
        ],
        "official_website": "https://upsrlm.org",
        "official_source": "उत्तर प्रदेश राज्य ग्रामीण आजीविका मिशन (UPSRLM)",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 14. Kisan Credit Card (KCC)
    {
        "id": "scheme_kcc",
        "scheme_name": "Kisan Credit Card (KCC) Scheme",
        "scheme_name_hindi": "किसान क्रेडिट कार्ड योजना",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Timely access to affordable credit for farmers to meet crop cultivation needs, post-harvest expenses, and animal husbandry at concessional interest rate of 4%.",
        "description_hindi": "किसानों को खाद, बीज व खेती की अन्य जरूरतों के लिए मात्र 4% रियायती ब्याज दर पर ₹3 लाख तक का आसान बैंक लोन।",
        "department": "Department of Agriculture & Farmers Welfare / RBI",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय / नाबार्ड",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "credit"],
        "benefits": {
            "description_hindi": "समय पर भुगतान पर 3% ब्याज छूट के साथ मात्र 4% वार्षिक ब्याज पर ₹3,00,000 तक का लोन (बिना गारंटी ₹1.60 लाख)",
            "description_en": "Crop loan up to Rs 3 lakh at 4% effective interest rate with timely repayment incentive"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True,
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "जमीन की खतौनी (भूलेख नकल)",
            "बैंक पासबुक",
            "फसल बोने का विवरण",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["नो-ड्यूज प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "केसीसी सरल फॉर्म भरें", "desc": "pmkisan.gov.in से एक पन्ने का केसीसी फॉर्म डाउनलोड करें या बैंक से लें।"},
            {"step": 2, "title": "भूमि अभिलेख संलग्न करें", "desc": "तहसील से प्रमाणित खतौनी नकल साथ लगाएं।"},
            {"step": 3, "title": "बैंक शाखा में जमा करें", "desc": "जिस बैंक में पीएम-किसान खाता है, वहीं फॉर्म जमा करें।"},
            {"step": 4, "title": "14 दिनों में कार्ड जारी", "desc": "बैंक द्वारा क्रेडिट सीमा तय कर रूपे किसान क्रेडिट कार्ड जारी किया जाता है।"}
        ],
        "official_website": "https://myscheme.gov.in/schemes/kcc",
        "official_source": "भारतीय रिजर्व बैंक / कृषि मंत्रालय / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 15. PM Surya Ghar: Muft Bijli Yojana
    {
        "id": "scheme_pm_surya_ghar",
        "scheme_name": "PM Surya Ghar: Muft Bijli Yojana",
        "scheme_name_hindi": "पीएम सूर्य घर: मुफ्त बिजली योजना",
        "category": "energy",
        "category_hindi": "ऊर्जा एवं बिजली",
        "description": "Rooftop solar subsidy scheme providing up to Rs 78,000 for installing solar panels and 300 units of free electricity every month.",
        "description_hindi": "घर की छत पर सोलर पैनल लगाने के लिए सरकार द्वारा ₹78,000 तक की सीधी सब्सिडी और प्रतिमाह 300 यूनिट तक मुफ्त बिजली।",
        "department": "Ministry of New and Renewable Energy",
        "department_hindi": "नवीन एवं नवीकरणीय ऊर्जा मंत्रालय",
        "ministry": "Ministry of New and Renewable Energy, Government of India",
        "ministry_hindi": "नवीन एवं नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["housing", "solar", "utilities"],
        "benefits": {
            "annual_total": 78000,
            "description_hindi": "2 किलोवाट सिस्टम पर ₹60,000 तथा 3 किलोवाट पर ₹78,000 की सीधी केंद्र सरकार सब्सिडी + शून्य बिजली बिल",
            "description_en": "Subsidy of Rs 30,000/kW up to 2kW, Rs 18,000 for 3rd kW (Max Rs 78,000)"
        },
        "eligibility_conditions": {
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "हालिया बिजली बिल (Consumer Account)",
            "छत की फोटो / स्वामित्व प्रमाण",
            "बैंक पासबुक"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "pmsuryaghar.gov.in पर पंजीकरण", "desc": "बिजली वितरण कंपनी (DISCOM) व उपभोक्ता संख्या दर्ज कर रजिस्टर करें।"},
            {"step": 2, "title": "वेंडर का चुनाव", "desc": "पोर्टल पर पंजीकृत सोलर वेंडर में से किसी एक को चुनें।"},
            {"step": 3, "title": "रूफटॉप सोलर स्थापना", "desc": "वेंडर द्वारा घर की छत पर सोलर पैनल और नेट-मीटर लगाया जाता है।"},
            {"step": 4, "title": "सब्सिडी डीबीटी अंतरण", "desc": "कमीशनिंग रिपोर्ट के 30 दिनों के भीतर ₹78,000 तक की सब्सिडी सीधे बैंक खाते में पहुंचेगी।"}
        ],
        "official_website": "https://pmsuryaghar.gov.in",
        "official_source": "नवीन एवं नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 16. UP Vridha Pension Scheme (UP SSPY Old Age)
    {
        "id": "scheme_up_vridha_pension",
        "scheme_name": "Uttar Pradesh Old Age Pension Scheme",
        "scheme_name_hindi": "वृद्धावस्था पेंशन योजना (उत्तर प्रदेश)",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Monthly pension of Rs 1,000 for destitute elderly citizens aged 60 years and above living below the poverty line in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश के 60 वर्ष या उससे अधिक आयु के वृद्ध नागरिकों को आर्थिक संबल के लिए ₹1,000 प्रतिमाह पेंशन।",
        "department": "Department of Social Welfare, Government of Uttar Pradesh",
        "department_hindi": "समाज कल्याण विभाग, उत्तर प्रदेश",
        "ministry": "Ministry of Social Welfare, UP",
        "ministry_hindi": "समाज कल्याण विभाग, उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["senior", "bpl", "pension"],
        "benefits": {
            "monthly_amount": 1000,
            "annual_total": 12000,
            "description_hindi": "प्रतिमाह ₹1,000 की पेंशन सीधे बैंक खाते में (त्रैमासिक भुगतान ₹3,000)",
            "description_en": "Monthly pension of Rs 1,000 disbursed quarterly via DBT"
        },
        "eligibility_conditions": {
            "min_age": 60,
            "states": ["उत्तर प्रदेश"],
            "max_annual_income": 56460
        },
        "required_documents": [
            "आधार कार्ड",
            "आयु प्रमाण पत्र (मतदाता पहचान पत्र या परिवार रजिस्टर)",
            "आय प्रमाण पत्र",
            "बैंक पासबुक",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "ऑनलाइन आवेदन (sspy-up.gov.in)", "desc": "नजदीकी सीएससी केंद्र पर जाकर वृद्धावस्था पेंशन विकल्प चुनें।"},
            {"step": 2, "title": "कागजात अपलोड", "desc": "आधार, आयु प्रमाण, आय प्रमाण पत्र और बैंक खाता अपलोड करें।"},
            {"step": 3, "title": "सत्यापन", "desc": "ग्राम पंचायत में बीडीओ और शहरी क्षेत्र में एसडीएम द्वारा सत्यापन किया जाएगा।"},
            {"step": 4, "title": "पेंशन प्रारंभ", "desc": "सत्यापन के बाद प्रतिमाह ₹1,000 सीधे बैंक खाते में भेजे जाएंगे।"}
        ],
        "official_website": "https://sspy-up.gov.in",
        "official_source": "समाज कल्याण विभाग, उत्तर प्रदेश / SSPY",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 17. UP Divyangjan Pension Scheme (UP SSPY Disability)
    {
        "id": "scheme_up_divyang_pension",
        "scheme_name": "Uttar Pradesh Divyang Pension Scheme",
        "scheme_name_hindi": "दिव्यांगजन पेंशन योजना (उत्तर प्रदेश)",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Monthly pension of Rs 1,000 for persons with 40% or more disability living in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश के न्यूनतम 40% दिव्यांगता वाले विशेष योग्यजनों को सम्मानपूर्वक जीवन यापन हेतु ₹1,000 प्रतिमाह वित्तीय सहायता।",
        "department": "Department of Empowerment of Persons with Disabilities, UP",
        "department_hindi": "दिव्यांगजन सशक्तीकरण विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "दिव्यांगजन सशक्तीकरण विभाग, उत्तर प्रदेश",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["disability", "divyang", "pension"],
        "benefits": {
            "monthly_amount": 1000,
            "annual_total": 12000,
            "description_hindi": "प्रतिमाह ₹1,000 की पेंशन सीधे बैंक खाते में (त्रैमासिक भुगतान)",
            "description_en": "Monthly pension of Rs 1,000 for persons with disability"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "states": ["उत्तर प्रदेश"],
            "has_disability": True,
            "min_disability_percent": 40,
            "max_annual_income": 100000
        },
        "required_documents": [
            "आधार कार्ड",
            "दिव्यांगता प्रमाण पत्र (UDID कार्ड या सीएमओ द्वारा 40%+ प्रमाण)",
            "आय प्रमाण पत्र",
            "निवास प्रमाण पत्र",
            "बैंक पासबुक",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "दिव्यांग प्रमाण पत्र / UDID तैयार रखें", "desc": "मुख्य चिकित्सा अधिकारी (CMO) द्वारा जारी न्यूनतम 40% दिव्यांगता प्रमाण पत्र लें।"},
            {"step": 2, "title": "ऑनलाइन आवेदन (sspy-up.gov.in)", "desc": "दिव्यांग पेंशन अनुभाग में ऑनलाइन फॉर्म भरें।"},
            {"step": 3, "title": "जिला दिव्यांगजन अधिकारी कार्यालय में सत्यापन", "desc": "दस्तावेजों की हार्डकॉपी विकास भवन में जमा करें।"},
            {"step": 4, "title": "पेंशन डीबीटी अंतरण", "desc": "स्वीकृति के बाद हर महीने ₹1,000 बैंक खाते में पहुंचेंगे।"}
        ],
        "official_website": "https://sspy-up.gov.in",
        "official_source": "दिव्यांगजन सशक्तीकरण विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 18. Indira Gandhi National Old Age Pension Scheme (IGNOAPS)
    {
        "id": "scheme_nsap_ignoaps",
        "scheme_name": "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
        "scheme_name_hindi": "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Central non-contributory old-age pension for BPL citizens aged 60 and above.",
        "description_hindi": "गरीबी रेखा से नीचे (BPL) जीवन यापन करने वाले 60 वर्ष से अधिक आयु के बुजुर्गों को केंद्र व राज्य की संयुक्त पेंशन।",
        "department": "Ministry of Rural Development",
        "department_hindi": "ग्रामीण विकास मंत्रालय, भारत सरकार",
        "ministry": "Ministry of Rural Development, Government of India",
        "ministry_hindi": "ग्रामीण विकास मंत्रालय, भारत सरकार (NSAP)",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["senior", "bpl", "pension"],
        "benefits": {
            "monthly_amount": 1000,
            "annual_total": 12000,
            "description_hindi": "60-79 वर्ष: ₹1,000 प्रतिमाह; 80 वर्ष से अधिक: ₹1,500 प्रतिमाह सीधे बैंक खाते में",
            "description_en": "Monthly pension for elderly BPL citizens"
        },
        "eligibility_conditions": {
            "min_age": 60,
            "max_annual_income": 50000
        },
        "required_documents": [
            "आधार कार्ड",
            "बीपीएल राशन कार्ड",
            "आयु प्रमाण पत्र",
            "बैंक पासबुक"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "nsap.nic.in या स्थानीय तहसील में आवेदन", "desc": "ग्रामीण क्षेत्र में ग्राम पंचायत/बीडीओ तथा शहरी में नगर पालिका में आवेदन करें।"},
            {"step": 2, "title": "बीपीएल सूची सत्यापन", "desc": "SECC डाटा और स्थानीय सत्यापन अधिकारी द्वारा पुष्टि की जाती है।"},
            {"step": 3, "title": "मंजूरी व डीबीटी भुगतान", "desc": "स्वीकृति के बाद मासिक पेंशन सीधे बैंक खाते में।" }
        ],
        "official_website": "https://nsap.nic.in",
        "official_source": "राष्ट्रीय सामाजिक सहायता कार्यक्रम (NSAP) / भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 19. PMMVY (Matru Vandana)
    {
        "id": "scheme_pmmvy",
        "scheme_name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "scheme_name_hindi": "प्रधानमंत्री मातृ वंदना योजना",
        "category": "women_child",
        "category_hindi": "महिला एवं बाल विकास",
        "description": "Conditional cash transfer of Rs 5000 in two installments for pregnant and lactating mothers for healthy nutrition and safe delivery.",
        "description_hindi": "गर्भवती महिलाओं और स्तनपान कराने वाली माताओं को पोषण और स्वास्थ्य सुरक्षा के लिए ₹5,000 की वित्तीय सहायता।",
        "department": "Ministry of Women and Child Development",
        "department_hindi": "महिला एवं बाल विकास मंत्रालय",
        "ministry": "Ministry of Women and Child Development, Government of India",
        "ministry_hindi": "महिला एवं बाल विकास मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["women", "mother", "maternity"],
        "benefits": {
            "annual_total": 5000,
            "description_hindi": "पहले बच्चे पर ₹5,000 तथा दूसरे बच्चे के रूप में कन्या होने पर ₹6,000 की प्रोत्साहन राशि",
            "description_en": "Direct cash transfer of Rs 5,000 for 1st child, Rs 6,000 for 2nd girl child"
        },
        "eligibility_conditions": {
            "gender": ["महिला"],
            "min_age": 19,
            "max_age": 45,
            "is_pregnant_or_lactating": True
        },
        "required_documents": [
            "आधार कार्ड (माता व पिता)",
            "बैंक पासबुक",
            "MCP कार्ड (मदर एंड चाइल्ड प्रोटेक्शन कार्ड)",
            "बच्चे का जन्म प्रमाण पत्र"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "आंगनवाड़ी केंद्र में पंजीकरण", "desc": "गर्भावस्था का पता चलने पर स्थानीय आंगनवाड़ी केंद्र पर MCP कार्ड बनवाएं।"},
            {"step": 2, "title": "पहली किस्त के लिए आवेदन (₹3,000)", "desc": "कम से कम 1 प्रसव पूर्व जांच (ANC) के बाद फॉर्म भरें।"},
            {"step": 3, "title": "दूसरी किस्त के लिए आवेदन (₹2,000)", "desc": "बच्चे के जन्म पंजीकरण और पहले दौर के टीकों के बाद आवेदन करें।"},
            {"step": 4, "title": "खाते में डीबीटी अंतरण", "desc": "राशि सीधे माता के आधार-सीडेड बैंक खाते में भेजी जाएगी।"}
        ],
        "official_website": "https://pmmvy.wcd.gov.in",
        "official_source": "महिला एवं बाल विकास मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 20. Janani Suraksha Yojana (JSY)
    {
        "id": "scheme_jsy",
        "scheme_name": "Janani Suraksha Yojana (JSY)",
        "scheme_name_hindi": "जननी सुरक्षा योजना",
        "category": "women_child",
        "category_hindi": "महिला एवं बाल विकास",
        "description": "Safe motherhood intervention providing cash assistance to poor pregnant women delivering in government health facilities.",
        "description_hindi": "संस्थागत प्रसव को बढ़ावा देने के लिए सरकारी स्वास्थ्य केंद्रों पर प्रसव कराने वाली ग्रामीण महिलाओं को ₹1,400 तथा आशा कार्यकर्ता को ₹600 की नकद सहायता।",
        "department": "National Health Mission (NHM)",
        "department_hindi": "राष्ट्रीय स्वास्थ्य मिशन, स्वास्थ्य एवं परिवार कल्याण मंत्रालय",
        "ministry": "Ministry of Health and Family Welfare, Government of India",
        "ministry_hindi": "स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["women", "mother", "maternity", "rural"],
        "benefits": {
            "annual_total": 1400,
            "description_hindi": "ग्रामीण क्षेत्र में संस्थागत प्रसव पर ₹1,400 नकद सहायता + मुफ्त दवाएं और निःशुल्क भोजन",
            "description_en": "Cash assistance of Rs 1,400 for rural institutional delivery plus free medical care"
        },
        "eligibility_conditions": {
            "gender": ["महिला"],
            "min_age": 19,
            "max_age": 45,
            "is_pregnant_or_lactating": True
        },
        "required_documents": [
            "आधार कार्ड",
            "MCP कार्ड (मदर एंड चाइल्ड प्रोटेक्शन कार्ड)",
            "बैंक पासबुक",
            "राशन कार्ड या बीपीएल कार्ड"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "आशा कार्यकर्ता से संपर्क", "desc": "गर्भावस्था के दौरान स्थानीय आशा या एएनएम से संस्थागत प्रसव का पंजीकरण कराएं।"},
            {"step": 2, "title": "सरकारी अस्पताल में प्रसव", "desc": "प्राथमिक स्वास्थ्य केंद्र (PHC), सीएचसी (CHC) या जिला अस्पताल में प्रसव कराएं।"},
            {"step": 3, "title": "डिस्चार्ज के समय चेक/डीबीटी", "desc": "डिस्चार्ज के समय ₹1,400 का भुगतान सीधे माता के बैंक खाते में किया जाता है।"}
        ],
        "official_website": "https://nhm.gov.in",
        "official_source": "राष्ट्रीय स्वास्थ्य मिशन (NHM), भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 21. Atal Pension Yojana (APY)
    {
        "id": "scheme_atal_pension",
        "scheme_name": "Atal Pension Yojana (APY)",
        "scheme_name_hindi": "अटल पेंशन योजना (APY)",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Guaranteed pension scheme for all Indian citizens in the unorganized sector aged 18 to 40 years, providing monthly pension of Rs 1,000 to Rs 5,000 after age 60.",
        "description_hindi": "असंगठित क्षेत्र के कामगारों के लिए सरकार द्वारा गारंटीशुदा पेंशन योजना; 60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 तक की निश्चित मासिक पेंशन।",
        "department": "Pension Fund Regulatory and Development Authority (PFRDA)",
        "department_hindi": "पेंशन निधि विनियामक एवं विकास प्राधिकरण (PFRDA)",
        "ministry": "Ministry of Finance, Government of India",
        "ministry_hindi": "वित्त मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["pension", "worker", "unorganized"],
        "benefits": {
            "monthly_amount": 5000,
            "description_hindi": "60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 प्रतिमाह की आजीवन गारंटीशुदा पेंशन (मृत्यु उपरांत पति/पत्नी को)",
            "description_en": "Guaranteed monthly pension of Rs 1,000 to Rs 5,000 after age 60"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "max_age": 40,
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "बचत बैंक खाता पासबुक",
            "मोबाइल नंबर"
        ],
        "optional_documents": ["नॉमिनी का पहचान पत्र"],
        "application_steps": [
            {"step": 1, "title": "बैंक शाखा या पोस्ट ऑफिस जाएं", "desc": "जिस बैंक में आपका खाता है, वहां एपीवाई फॉर्म मांगें।"},
            {"step": 2, "title": "पेंशन राशि का चयन करें", "desc": "अपनी क्षमतानुसार ₹1,000 से ₹5,000 की मासिक पेंशन चुनें।"},
            {"step": 3, "title": "ऑटो-डेबिट सहमति दें", "desc": "हर महीने तय प्रीमियम खाते से स्वतः कटने की सहमति दें।"},
            {"step": 4, "title": "PRAN नंबर प्राप्त करें", "desc": "पेंशन खाता संख्या (PRAN) की रसीद सुरक्षित रखें।"}
        ],
        "official_website": "https://www.npscra.nsdl.co.in",
        "official_source": "PFRDA / वित्त मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 22. PM Shram Yogi Maandhan (PM-SYM)
    {
        "id": "scheme_pm_sym",
        "scheme_name": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
        "scheme_name_hindi": "प्रधानमंत्री श्रम योगी मानधन योजना",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा एवं पेंशन",
        "description": "Voluntary and contributory pension scheme for unorganized workers with monthly income up to Rs 15,000, providing assured monthly pension of Rs 3,000 after age 60.",
        "description_hindi": "रिक्शा चालक, धोबी, मोची, घरेलू कामगार और खेतिहर मजदूरों के लिए ₹3,000 प्रतिमाह की निश्चित वृद्धावस्था पेंशन।",
        "department": "Ministry of Labour and Employment",
        "department_hindi": "श्रम एवं रोजगार मंत्रालय",
        "ministry": "Ministry of Labour and Employment, Government of India",
        "ministry_hindi": "श्रम एवं रोजगार मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["worker", "unorganized", "pension"],
        "benefits": {
            "monthly_amount": 3000,
            "annual_total": 36000,
            "description_hindi": "60 वर्ष पूरे होने पर आजीवन ₹3,000 प्रतिमाह की पक्की पेंशन (50% अंशदान सरकार देती है)",
            "description_en": "Assured monthly pension of Rs 3,000 after attaining age 60 with matching central contribution"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "max_age": 40,
            "max_annual_income": 180000,
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "बचत बैंक पासबुक / जन धन खाता",
            "मोबाइल नंबर"
        ],
        "optional_documents": ["ई-श्रम कार्ड"],
        "application_steps": [
            {"step": 1, "title": "CSC केंद्र जाएं", "desc": "आधार कार्ड और बैंक पासबुक लेकर नजदीकी जनसेवा केंद्र (CSC) जाएं।"},
            {"step": 2, "title": "प्रारंभिक अंशदान जमा करें", "desc": "उम्र के अनुसार ₹55 से ₹200 का पहला मासिक अंशदान नकद दें।"},
            {"step": 3, "title": "श्रम योगी पेंशन कार्ड प्राप्त करें", "desc": "तुरंत हस्ताक्षरित श्रम योगी पेंशन कार्ड (PM-SYM ID) प्राप्त करें।"}
        ],
        "official_website": "https://maandhan.in",
        "official_source": "श्रम एवं रोजगार मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 23. PM Kisan Maandhan Yojana
    {
        "id": "scheme_pm_kisan_maandhan",
        "scheme_name": "Pradhan Mantri Kisan Maandhan Yojana (PM-KMY)",
        "scheme_name_hindi": "प्रधानमंत्री किसान मानधन योजना",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Old age pension scheme for all small and marginal farmers (having cultivable land up to 2 hectares) providing guaranteed pension of Rs 3,000/month after age 60.",
        "description_hindi": "छोटे और सीमांत किसानों (2 हेक्टेयर तक भूमि) के लिए वृद्धावस्था सामाजिक सुरक्षा; 60 वर्ष बाद ₹3,000 प्रतिमाह की सुनिश्चित पेंशन।",
        "department": "Department of Agriculture and Farmers Welfare",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "ministry": "Ministry of Agriculture and Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "pension"],
        "benefits": {
            "monthly_amount": 3000,
            "annual_total": 36000,
            "description_hindi": "60 वर्ष के बाद ₹3,000 प्रतिमाह की मासिक पेंशन (समान 50% अंशदान केंद्र सरकार देती है)",
            "description_en": "Fixed pension of Rs 3,000 per month for small and marginal farmers upon reaching age 60"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "max_age": 40,
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True,
            "has_bank_account": True
        },
        "required_documents": [
            "आधार कार्ड",
            "खतौनी की नकल (2 हेक्टेयर से कम)",
            "बैंक पासबुक",
            "मोबाइल नंबर"
        ],
        "optional_documents": ["पीएम किसान लाभार्थी आईडी"],
        "application_steps": [
            {"step": 1, "title": "CSC केंद्र या कृषि विभाग में पंजीकरण", "desc": "आधार कार्ड और जमीन की खतौनी के साथ आवेदन करें।"},
            {"step": 2, "title": "मासिक अंशदान विकल्प", "desc": "उम्र के अनुसार ₹55 से ₹200 का अंशदान सीधे पीएम-किसान किस्त से कटवाने की सहमति दें।"},
            {"step": 3, "title": "किसान पेंशन कार्ड प्राप्त करें", "desc": "पंजीकरण के बाद किसान पेंशन कार्ड जारी हो जाता है।"}
        ],
        "official_website": "https://maandhan.in",
        "official_source": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 24. Sukanya Samriddhi Yojana (SSY)
    {
        "id": "scheme_sukanya_samriddhi",
        "scheme_name": "Sukanya Samriddhi Yojana (SSY)",
        "scheme_name_hindi": "सुकन्या समृद्धि योजना",
        "category": "women_child",
        "category_hindi": "महिला एवं बाल विकास",
        "description": "Government-backed small deposit savings scheme targeted at parents of female children offering highest sovereign interest rate and tax exemption.",
        "description_hindi": "10 वर्ष तक की बालिकाओं के उज्ज्वल भविष्य और उच्च शिक्षा हेतु उच्चतम ब्याज दर (8.2%) वाली कर-मुक्त सरकारी बचत योजना।",
        "department": "Department of Posts / Ministry of Finance",
        "department_hindi": "डाक विभाग / वित्त मंत्रालय, भारत सरकार",
        "ministry": "Ministry of Finance, Government of India",
        "ministry_hindi": "वित्त मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["women", "child", "girl_child", "savings"],
        "benefits": {
            "description_hindi": "8.2% की उच्चतम ब्याज दर, ₹250 न्यूनतम वार्षिक जमा, 21 वर्ष में परिपक्वता पर कर-मुक्त लाखों का कोष",
            "description_en": "High sovereign interest rate of 8.2% per annum with triple tax exemption (EEE) under Section 80C"
        },
        "eligibility_conditions": {
            "has_daughter": True
        },
        "required_documents": [
            "बालिका का जन्म प्रमाण पत्र",
            "अभिभावक का आधार कार्ड व पैन कार्ड",
            "निवास प्रमाण पत्र",
            "पासपोर्ट आकार का फोटो"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "डाकघर या अधिकृत बैंक शाखा जाएं", "desc": "नजदीकी पोस्ट ऑफिस या एसबीआई/पीएनबी शाखा में फॉर्म भरें।"},
            {"step": 2, "title": "न्यूनतम ₹250 से खाता खोलें", "desc": "बालिका के जन्म प्रमाण पत्र और अभिभावक के आधार के साथ खाता प्रारंभ करें।"},
            {"step": 3, "title": "पासबुक प्राप्त करें", "desc": "सुकन्या समृद्धि पासबुक लें और हर वर्ष सुविधानुसार ₹250 से ₹1.5 लाख तक जमा करें।"}
        ],
        "official_website": "https://www.indiapost.gov.in",
        "official_source": "डाक विभाग, संचार मंत्रालय / वित्त मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 25. UP Mukhyamantri Kanya Sumangala Yojana
    {
        "id": "scheme_up_kanya_sumangala",
        "scheme_name": "UP Mukhyamantri Kanya Sumangala Yojana",
        "scheme_name_hindi": "मुख्यमंत्री कन्या सुमंगला योजना (उत्तर प्रदेश)",
        "category": "women_child",
        "category_hindi": "महिला एवं बाल विकास",
        "description": "Conditional cash transfer of Rs 25,000 in six milestones to support female child education and health in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश में बालिकाओं को जन्म से स्नातक तक शिक्षा और स्वास्थ्य सुरक्षा के लिए 6 चरणों में कुल ₹25,000 का अनुदान।",
        "department": "Department of Women and Child Development, UP",
        "department_hindi": "महिला कल्याण विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "महिला एवं बाल विकास विभाग, उत्तर प्रदेश",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["women", "child", "girl_child", "education"],
        "benefits": {
            "annual_total": 25000,
            "description_hindi": "जन्म पर ₹5,000, टीकाकरण पर ₹2,000, कक्षा 1 में ₹3,000, कक्षा 6 में ₹3,000, कक्षा 9 में ₹5,000, स्नातक में ₹7,000 (कुल ₹25,000)",
            "description_en": "Total incentive of Rs 25,000 disbursed across 6 developmental milestones"
        },
        "eligibility_conditions": {
            "states": ["उत्तर प्रदेश"],
            "has_daughter": True,
            "max_annual_income": 300000
        },
        "required_documents": [
            "बालिका का आधार कार्ड / जन्म प्रमाण पत्र",
            "माता-पिता का आधार कार्ड",
            "आय प्रमाण पत्र (₹3 लाख से कम)",
            "निवास प्रमाण पत्र",
            "बैंक पासबुक (माता या संयुक्त)",
            "स्कूल प्रवेश प्रमाण पत्र"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "mksy.up.gov.in पर नागरिक पंजीकरण", "desc": "पोर्टल पर अभिभावक का विवरण दर्ज कर लॉगिन आईडी बनाएं।"},
            {"step": 2, "title": "चरणवार आवेदन", "desc": "संबंधित श्रेणी (जन्म, टीका, कक्षा 1/6/9/कॉलेज) के लिए दस्तावेज अपलोड करें।"},
            {"step": 3, "title": "खंड विकास अधिकारी (BDO) द्वारा सत्यापन", "desc": "अधिकारियों द्वारा पात्रता व स्कूल उपस्थिति की जांच।"},
            {"step": 4, "title": "सीधा बैंक खाते में अनुदान", "desc": "सत्यापन उपरांत डीबीटी के जरिए राशि बैंक खाते में पहुंचती है।"}
        ],
        "official_website": "https://mksy.up.gov.in",
        "official_source": "महिला कल्याण विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 26. PM Vishwakarma Yojana
    {
        "id": "scheme_pm_vishwakarma",
        "scheme_name": "PM Vishwakarma Scheme",
        "scheme_name_hindi": "पीएम विश्वकर्मा योजना",
        "category": "employment",
        "category_hindi": "रोजगार एवं कारीगर कल्याण",
        "description": "Comprehensive support scheme for traditional artisans and craftspeople offering recognition certificate, modern toolkit incentive of Rs 15,000, and subsidized collateral-free loans up to Rs 3 lakh.",
        "description_hindi": "पारंपरिक 18 व्यवसायों के कारीगरों (बढ़ई, लोहार, कुम्हार, दर्जी, राजमिस्त्री आदि) को ₹15,000 टूलकिट अनुदान और 5% रियायती ऋण।",
        "department": "Ministry of Micro, Small and Medium Enterprises (MSME)",
        "department_hindi": "सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय",
        "ministry": "Ministry of MSME, Government of India",
        "ministry_hindi": "एमएसएमई मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["artisan", "worker", "employment", "credit"],
        "benefits": {
            "annual_total": 15000,
            "description_hindi": "विश्वकर्मा प्रमाण पत्र + ₹15,000 का आधुनिक टूलकिट ई-वाउचर + 5% ब्याज पर ₹1 लाख (प्रथम चरण) व ₹2 लाख (द्वितीय चरण) का बिना गारंटी ऋण",
            "description_en": "PM Vishwakarma Certificate, Rs 15,000 toolkit e-voucher, plus 5% collateral-free credit up to Rs 3 lakh"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "occupation": ["कारीगर", "शिल्पकार", "बढ़ई", "लोहार", "दर्जी", "कुम्हार", "मोची", "राजमिस्त्री", "मजदूर"]
        },
        "required_documents": [
            "आधार कार्ड",
            "बैंक पासबुक",
            "व्यापार/हस्तशिल्प प्रमाण",
            "मोबाइल नंबर"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "CSC केंद्र पर बायोमेट्रिक प्रमाणीकरण", "desc": "pmvishwakarma.gov.in पर सीएससी केंद्र के माध्यम से निःशुल्क पंजीकरण कराएं।"},
            {"step": 2, "title": "ग्राम पंचायत / नगर निकाय स्तर पर सत्यापन", "desc": "पंचायत प्रमुख द्वारा पारंपरिक शिल्पकार होने की पुष्टि की जाती है।"},
            {"step": 3, "title": "5 दिवसीय बुनियादी कौशल प्रशिक्षण", "desc": "प्रशिक्षण के दौरान ₹500 प्रतिदिन का दैनिक भत्ता भी मिलेगा।"},
            {"step": 4, "title": "टूलकिट वाउचर व रियायती ऋण", "desc": "प्रशिक्षण पश्चात ₹15,000 का ई-वाउचर और 5% पर ऋण स्वीकृत होता है।"}
        ],
        "official_website": "https://pmvishwakarma.gov.in",
        "official_source": "सूक्ष्म, लघु और मध्यम उद्यम मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 27. PM SVANidhi (Street Vendors)
    {
        "id": "scheme_pm_svanidhi",
        "scheme_name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
        "scheme_name_hindi": "पीएम स्वनिधि योजना (रेहड़ी-पटरी विक्रेता)",
        "category": "employment",
        "category_hindi": "रोजगार एवं आजीविका",
        "description": "Special micro-credit facility providing affordable working capital loans of Rs 10,000, Rs 20,000, and Rs 50,000 with 7% interest subsidy to street vendors.",
        "description_hindi": "सड़क किनारे ठेला, खोमचा व रेहड़ी लगाने वाले छोटे व्यापारियों को बिना गारंटी ₹10,000 से ₹50,000 तक का कार्यशील पूंजी ऋण 7% ब्याज अनुदान के साथ।",
        "department": "Ministry of Housing and Urban Affairs",
        "department_hindi": "आवासन और शहरी कार्य मंत्रालय",
        "ministry": "Ministry of Housing and Urban Affairs, Government of India",
        "ministry_hindi": "आवासन और शहरी कार्य मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["vendor", "worker", "credit", "urban"],
        "benefits": {
            "description_hindi": "प्रथम चरण में ₹10,000; समय पर चुकाने पर द्वितीय चरण में ₹20,000 और तीसरे चरण में ₹50,000 का ऋण + 7% वार्षिक ब्याज सब्सिडी",
            "description_en": "Collateral-free working capital loan in tranches of Rs 10k, Rs 20k, and Rs 50k with 7% interest subsidy"
        },
        "eligibility_conditions": {
            "min_age": 18,
            "occupation": ["रेहड़ी पटरी", "दुकानदार", "सब्जी विक्रेता", "विक्रेता", "मजदूर"]
        },
        "required_documents": [
            "आधार कार्ड",
            "शहरी स्थानीय निकाय द्वारा वेंडिंग प्रमाण पत्र / LOR",
            "बैंक पासबुक",
            "मोबाइल नंबर"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "नगर निगम / निकाय से LOR प्राप्त करें", "desc": "यदि वेंडिंग आईडी नहीं है, तो नगर पालिका से सिफारिश पत्र (LOR) लें।"},
            {"step": 2, "title": "pmsvanidhi.mohua.gov.in पर आवेदन", "desc": "आधार लिंक मोबाइल नंबर से लॉगिन कर ऋण आवेदन भरें।"},
            {"step": 3, "title": "बैंक द्वारा ऋण स्वीकृति", "desc": "बिना किसी जमानत के ऋण राशि सीधे खाते में हस्तांतरित होती है।"}
        ],
        "official_website": "https://pmsvanidhi.mohua.gov.in",
        "official_source": "आवासन और शहरी कार्य मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 28. UP Pre-Matric Scholarship
    {
        "id": "scheme_up_scholarship_pre",
        "scheme_name": "UP Pre-Matric Scholarship Scheme (Classes 9 & 10)",
        "scheme_name_hindi": "उत्तर प्रदेश पूर्व-दशम छात्रवृत्ति योजना (कक्षा 9-10)",
        "category": "education",
        "category_hindi": "शिक्षा एवं छात्रवृत्ति",
        "description": "Financial assistance to students of Classes 9 and 10 from General, OBC, SC, ST, and Minority communities in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश के कक्षा 9 और 10 के सामान्य, पिछड़ा वर्ग (OBC), अनुसूचित जाति/जनजाति और अल्पसंख्यक वर्ग के विद्यार्थियों को वार्षिक छात्रवृत्ति।",
        "department": "Social Welfare / Backward Class Welfare Department, UP",
        "department_hindi": "समाज कल्याण / पिछड़ा वर्ग कल्याण विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["student", "education", "scholarship"],
        "benefits": {
            "annual_total": 3500,
            "description_hindi": "₹3,500 तक की वार्षिक छात्रवृत्ति और शैक्षणिक शुल्क प्रतिपूर्ति सीधे छात्र के बैंक खाते में",
            "description_en": "Annual scholarship and non-refundable fee reimbursement up to Rs 3,500"
        },
        "eligibility_conditions": {
            "states": ["उत्तर प्रदेश"],
            "is_student": True,
            "max_age": 18,
            "max_annual_income": 250000
        },
        "required_documents": [
            "छात्र का आधार कार्ड",
            "पिछली कक्षा की मार्कशीट",
            "आय प्रमाण पत्र (₹2.5 लाख से कम)",
            "जाति प्रमाण पत्र",
            "निवास प्रमाण पत्र",
            "स्कूल शुल्क रसीद व छात्रवृत्ति फॉर्म"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "scholarship.up.gov.in पर ऑनलाइन छात्र पंजीकरण", "desc": "आधार डेमोग्राफिक प्रमाणीकरण के साथ नया पंजीकरण करें।"},
            {"step": 2, "title": "फॉर्म भरना व दस्तावेज अपलोड", "desc": "विद्यालय विवरण, मार्कशीट, बैंक खाता और आय प्रमाण पत्र अपलोड करें।"},
            {"step": 3, "title": "हार्डकॉपी विद्यालय में जमा करें", "desc": "प्रिंटआउट निकाल कर विद्यालय के छात्रवृत्ति नोडल अधिकारी को दें।"},
            {"step": 4, "title": "जिला छात्रवृत्ति समिति द्वारा स्वीकृति", "desc": "सत्यापन के बाद राशि सीधे आधार-सीडेड बैंक खाते में।"}
        ],
        "official_website": "https://scholarship.up.gov.in",
        "official_source": "उत्तर प्रदेश छात्रवृत्ति पोर्टल (scholarship.up.gov.in)",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 29. UP Post-Matric Scholarship & Fee Reimbursement
    {
        "id": "scheme_up_scholarship_post",
        "scheme_name": "UP Post-Matric Scholarship and Fee Reimbursement Scheme",
        "scheme_name_hindi": "उत्तर प्रदेश दशमोत्तर छात्रवृत्ति एवं शुल्क प्रतिपूर्ति",
        "category": "education",
        "category_hindi": "शिक्षा एवं छात्रवृत्ति",
        "description": "Full fee reimbursement and maintenance allowance for students in Classes 11, 12, undergraduate, postgraduate, and professional courses in Uttar Pradesh.",
        "description_hindi": "उत्तर प्रदेश के कक्षा 11, 12, स्नातक, परास्नातक और तकनीकी/डिप्लोमा पाठ्यक्रमों के विद्यार्थियों को पूरी कॉलेज फीस वापसी और मासिक भत्ता।",
        "department": "Social Welfare / Backward Class / Minority Welfare, UP",
        "department_hindi": "समाज कल्याण विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["student", "education", "scholarship"],
        "benefits": {
            "annual_total": 50000,
            "description_hindi": "कॉलेज/विश्वविद्यालय की संपूर्ण शिक्षण शुल्क प्रतिपूर्ति (₹50,000+ तक) + ₹6,000 से ₹12,000 वार्षिक अनुरक्षण भत्ता",
            "description_en": "Full tuition fee reimbursement and annual maintenance allowance via DBT"
        },
        "eligibility_conditions": {
            "states": ["उत्तर प्रदेश"],
            "is_student": True,
            "min_age": 16,
            "max_annual_income": 200000
        },
        "required_documents": [
            "आधार कार्ड",
            "हाईस्कूल / इंटरमीडिएट / अंतिम उत्तीर्ण मार्कशीट",
            "कॉलेज आवंटन पत्र व फीस रसीद",
            "आय प्रमाण पत्र",
            "जाति प्रमाण पत्र",
            "निवास प्रमाण पत्र",
            "आधार लिंक बैंक पासबुक"
        ],
        "optional_documents": ["हॉस्टल प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "scholarship.up.gov.in पर पंजीकरण", "desc": "दशमोत्तर (Post-Matric) श्रेणी में आधार ई-केवाईसी द्वारा पंजीकरण करें।"},
            {"step": 2, "title": "संस्थान में अग्रसारण", "desc": "फॉर्म की हार्डकॉपी समस्त संलग्नकों सहित अपने कॉलेज/विश्वविद्यालय में जमा करें।"},
            {"step": 3, "title": "जिला समाज कल्याण अधिकारी द्वारा सत्यापन", "desc": "पीएफएमएस (PFMS) प्रणाली द्वारा बैंक खाते का प्रमाणीकरण होगा।"},
            {"step": 4, "title": "शुल्क प्रतिपूर्ति अंतरण", "desc": "दिसंबर-मार्च में राशि सीधे छात्र के खाते में ट्रांसफर की जाती है।"}
        ],
        "official_website": "https://scholarship.up.gov.in",
        "official_source": "उत्तर प्रदेश छात्रवृत्ति पोर्टल (scholarship.up.gov.in)",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 30. PM Yashasvi Scholarship Scheme
    {
        "id": "scheme_pm_yashasvi",
        "scheme_name": "PM Young Achievers Scholarship Award Scheme for Vibrant India (PM-YASASVI)",
        "scheme_name_hindi": "पीएम यशस्वी छात्रवृत्ति योजना",
        "category": "education",
        "category_hindi": "शिक्षा एवं छात्रवृत्ति",
        "description": "Scholarship scheme for OBC, EBC, and DNT meritorious students studying in classes 9 to 12 in top identified schools.",
        "description_hindi": "ओबीसी, ईबीसी और गैर-अधिसूचित जनजाति के कक्षा 9 से 12 तक के मेधावी छात्र-छात्राओं को ₹75,000 से ₹1,25,000 तक की वार्षिक छात्रवृत्ति।",
        "department": "Ministry of Social Justice and Empowerment",
        "department_hindi": "सामाजिक न्याय और अधिकारिता मंत्रालय",
        "ministry": "Ministry of Social Justice and Empowerment, Government of India",
        "ministry_hindi": "सामाजिक न्याय और अधिकारिता मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["student", "education", "scholarship", "obc"],
        "benefits": {
            "annual_total": 75000,
            "description_hindi": "कक्षा 9-10 के विद्यार्थियों को ₹75,000 प्रतिवर्ष तथा कक्षा 11-12 के विद्यार्थियों को ₹1,25,000 प्रतिवर्ष की छात्रवृत्ति",
            "description_en": "Annual scholarship of Rs 75,000 for classes 9-10 and Rs 1,25,000 for classes 11-12"
        },
        "eligibility_conditions": {
            "is_student": True,
            "min_age": 13,
            "max_age": 19,
            "max_annual_income": 250000,
            "caste_categories": ["ओबीसी", "OBC", "EBC", "DNT"]
        },
        "required_documents": [
            "आधार कार्ड",
            "पिछली कक्षा में 60% अंकों की मार्कशीट",
            "ओबीसी/ईबीसी जाति प्रमाण पत्र",
            "माता-पिता का आय प्रमाण पत्र",
            "बैंक पासबुक"
        ],
        "optional_documents": ["पहचान पत्र"],
        "application_steps": [
            {"step": 1, "title": "एनएसपी (scholarships.gov.in) पर पंजीकरण", "desc": "राष्ट्रीय छात्रवृत्ति पोर्टल पर वन टाइम रजिस्ट्रेशन (OTR) करें।"},
            {"step": 2, "title": "पीएम यशस्वी योजना का चयन", "desc": "मेरिट व शैक्षणिक विवरण दर्ज कर आवेदन प्रस्तुत करें।"},
            {"step": 3, "title": "स्कूल व राज्य नोडल अधिकारी सत्यापन", "desc": "संबंधित स्कूल द्वारा मेरिट की पुष्टि की जाती है।"},
            {"step": 4, "title": "डीबीटी भुगतान", "desc": "स्वीकृति के बाद छात्रवृत्ति राशि सीधे खाते में हस्तांतरित।"}
        ],
        "official_website": "https://scholarships.gov.in",
        "official_source": "सामाजिक न्याय और अधिकारिता मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 31. National Means-cum-Merit Scholarship (NMMSS)
    {
        "id": "scheme_nmmss",
        "scheme_name": "National Means-cum-Merit Scholarship Scheme (NMMSS)",
        "scheme_name_hindi": "राष्ट्रीय साधन-सह-योग्यता छात्रवृत्ति योजना",
        "category": "education",
        "category_hindi": "शिक्षा एवं छात्रवृत्ति",
        "description": "Scholarship of Rs 12,000 per annum to meritorious students from economically weaker sections to arrest drop-out at class 8.",
        "description_hindi": "आर्थिक रूप से कमजोर परिवारों के प्रतिभावान विद्यार्थियों को कक्षा 8 के बाद पढ़ाई न छोड़ने के लिए कक्षा 9 से 12 तक ₹12,000 वार्षिक छात्रवृत्ति।",
        "department": "Department of School Education and Literacy",
        "department_hindi": "स्कूल शिक्षा और साक्षरता विभाग, शिक्षा मंत्रालय",
        "ministry": "Ministry of Education, Government of India",
        "ministry_hindi": "शिक्षा मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["student", "education", "scholarship"],
        "benefits": {
            "annual_total": 12000,
            "description_hindi": "कक्षा 9 से 12 तक लगातार ₹12,000 प्रतिवर्ष (₹1,000 प्रतिमाह) सीधे छात्र के बैंक खाते में",
            "description_en": "Scholarship of Rs 12,000 per year (Rs 1,000/month) from Class 9 to 12"
        },
        "eligibility_conditions": {
            "is_student": True,
            "min_age": 12,
            "max_age": 17,
            "max_annual_income": 350000
        },
        "required_documents": [
            "आधार कार्ड",
            "कक्षा 7/8 की मार्कशीट (न्यूनतम 55% अंक)",
            "आय प्रमाण पत्र (₹3.5 लाख से कम)",
            "सरकारी स्कूल अध्ययन प्रमाण पत्र",
            "बैंक पासबुक"
        ],
        "optional_documents": ["जाति प्रमाण पत्र (छूट हेतु)"],
        "application_steps": [
            {"step": 1, "title": "राज्य स्तरीय एनएमएमएसएस परीक्षा उत्तीर्ण करें", "desc": "कक्षा 8 में अध्ययनरत छात्र राज्य स्तरीय योग्यता परीक्षा दें।"},
            {"step": 2, "title": "NSP पोर्टल पर आवेदन दर्ज करें", "desc": "परीक्षा पास करने के बाद scholarships.gov.in पर दावा प्रस्तुत करें।"},
            {"step": 3, "title": "वार्षिक नवीनीकरण", "desc": "कक्षा 9, 10, 11 में न्यूनतम 55% अंक प्राप्त कर हर साल नवीनीकरण करें।"}
        ],
        "official_website": "https://scholarships.gov.in",
        "official_source": "शिक्षा मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 32. Soil Health Card Scheme
    {
        "id": "scheme_soil_health_card",
        "scheme_name": "Soil Health Card Scheme",
        "scheme_name_hindi": "मृदा स्वास्थ्य कार्ड योजना",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Free scientific soil testing and customized fertilizer recommendation card provided to all farmers to improve soil fertility and reduce cultivation costs.",
        "description_hindi": "किसानों के खेत की मिट्टी की 12 पोषक तत्वों की मुफ्त वैज्ञानिक जांच और फसल के अनुसार संतुलित खाद प्रयोग का स्वास्थ्य कार्ड।",
        "department": "Department of Agriculture and Farmers Welfare",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "ministry": "Ministry of Agriculture and Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "agriculture"],
        "benefits": {
            "description_hindi": "खेत की मिट्टी का मुफ्त प्रयोगशाला परीक्षण, 12 पोषक तत्वों की रिपोर्ट और 15-20% खाद खर्च में बचत",
            "description_en": "Free scientific soil testing and custom fertilizer dosage advisory"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True
        },
        "required_documents": [
            "आधार कार्ड",
            "खतौनी की नकल / खसरा संख्या",
            "मोबाइल नंबर"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "कृषि विभाग या किसान सहायक से संपर्क", "desc": "स्थानीय कृषि रक्षा इकाई या किसान सहायक को मिट्टी का नमूना दें।"},
            {"step": 2, "title": "मिट्टी नमूना संग्रहण", "desc": "खेत से वैज्ञानिक तरीके से 15 सेमी गहराई से नमूना एकत्र किया जाता है।"},
            {"step": 3, "title": "प्रयोगशाला जांच", "desc": "जिला मृदा परीक्षण प्रयोगशाला में नाइट्रोजन, फास्फोरस, पोटाश व पीएच मान की जांच।"},
            {"step": 4, "title": "कार्ड प्राप्ति", "desc": "soilhealth.dac.gov.in या कृषि केंद्र से प्रिंटेड मृदा कार्ड प्राप्त करें।"}
        ],
        "official_website": "https://soilhealth.dac.gov.in",
        "official_source": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 33. UP Gopalak Yojana (Dairy Farming)
    {
        "id": "scheme_up_gopalak",
        "scheme_name": "Uttar Pradesh Gopalak Yojana",
        "scheme_name_hindi": "उत्तर प्रदेश गोपालक योजना (डेयरी स्वरोजगार)",
        "category": "agriculture",
        "category_hindi": "पशुपालन एवं कृषि",
        "description": "Subsidized loan assistance of up to Rs 9 lakh for establishing 10-12 milch cow/buffalo dairy units for rural youth and farmers in UP.",
        "description_hindi": "उत्तर प्रदेश के बेरोजगार ग्रामीणों व किसानों को 10-12 दुधारू गाय/भैंस की डेयरी स्थापित करने के लिए ₹9 लाख तक का बैंक ऋण और ₹1.62 लाख तक सरकारी सब्सिडी।",
        "department": "Department of Animal Husbandry, Uttar Pradesh",
        "department_hindi": "पशुपालन विभाग, उत्तर प्रदेश",
        "ministry": "Government of Uttar Pradesh",
        "ministry_hindi": "पशुपालन विभाग, उत्तर प्रदेश सरकार",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश", "UP"],
        "beneficiary_tags": ["farmer", "rural", "dairy", "employment"],
        "benefits": {
            "annual_total": 162000,
            "description_hindi": "₹9,00,000 तक का आसान बैंक ऋण और 5 वर्षों में सरकार द्वारा ₹1,62,000 की ब्याज सब्सिडी",
            "description_en": "Loan up to Rs 9 lakh with Rs 1.62 lakh government subsidy over 5 years"
        },
        "eligibility_conditions": {
            "states": ["उत्तर प्रदेश"],
            "min_age": 18,
            "max_annual_income": 100000
        },
        "required_documents": [
            "आधार कार्ड",
            "निवास प्रमाण पत्र",
            "आय प्रमाण पत्र",
            "पशु शेड हेतु जमीन का प्रमाण (खतौनी)",
            "बैंक पासबुक व प्रोजेक्ट रिपोर्ट"
        ],
        "optional_documents": ["डेयरी प्रशिक्षण प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "मुख्य पशु चिकित्सा अधिकारी (CVO) कार्यालय जाएं", "desc": "विकास भवन स्थित जिला पशुपालन अधिकारी से आवेदन पत्र प्राप्त करें।"},
            {"step": 2, "title": "प्रोजेक्ट रिपोर्ट व कागजात जमा करें", "desc": "10 दुधारू पशुओं के शेड निर्माण व खरीद की विस्तृत योजना जमा करें।"},
            {"step": 3, "title": "बैंक ऋण स्वीकृति", "desc": "जिला स्तरीय समिति के अनुमोदन के बाद अग्रणी बैंक द्वारा ऋण जारी किया जाता है।"},
            {"step": 4, "title": "सब्सिडी अंतरण", "desc": "डेयरी स्थापना के बाद सब्सिडी सीधे बैंक ऋण खाते में जमा होती है।"}
        ],
        "official_website": "https://animalhusb.upsdc.gov.in",
        "official_source": "पशुपालन विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 34. PMAY - Urban (PMAY-U 2.0)
    {
        "id": "scheme_pmay_u",
        "scheme_name": "Pradhan Mantri Awas Yojana - Urban (PMAY-U 2.0)",
        "scheme_name_hindi": "प्रधानमंत्री आवास योजना (शहरी 2.0)",
        "category": "housing",
        "category_hindi": "आवास एवं आश्रय",
        "description": "Interest subsidy and direct financial grant of up to Rs 2.50 lakh to urban poor and middle-class families for constructing or buying a pucca house.",
        "description_hindi": "शहरी गरीब और मध्यम वर्गीय परिवारों को नगर निकाय क्षेत्र में पक्का मकान बनाने या खरीदने हेतु ₹2.50 लाख तक का सरकारी अनुदान।",
        "department": "Ministry of Housing and Urban Affairs",
        "department_hindi": "आवासन और शहरी कार्य मंत्रालय",
        "ministry": "Ministry of Housing and Urban Affairs, Government of India",
        "ministry_hindi": "आवासन और शहरी कार्य मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["urban", "housing", "poor"],
        "benefits": {
            "annual_total": 250000,
            "description_hindi": "गृह निर्माण पर ₹2,50,000 की सीधी आर्थिक सहायता अथवा गृह ऋण पर ₹1.80 लाख तक ब्याज सब्सिडी",
            "description_en": "Grant of Rs 2.5 lakh for house construction or interest subsidy on home loans"
        },
        "eligibility_conditions": {
            "max_annual_income": 300000
        },
        "required_documents": [
            "आधार कार्ड",
            "आय प्रमाण पत्र",
            "शहरी क्षेत्र में स्वयं के भूखंड का बैनामा / रजिस्ट्री",
            "बैंक पासबुक",
            "मकान का स्वीकृत नक्शा"
        ],
        "optional_documents": ["राशन कार्ड"],
        "application_steps": [
            {"step": 1, "title": "pmaymis.gov.in पर ऑनलाइन आवेदन", "desc": "आधार संख्या दर्ज कर Benefit under 3 components विकल्प चुनें।"},
            {"step": 2, "title": "नगर पालिका / सूडा (SUDA) द्वारा सत्यापन", "desc": "शहरी निकाय की टीम द्वारा भूखंड का भौतिक सत्यापन और जियो-टैगिंग।"},
            {"step": 3, "title": "डीबीटी द्वारा 3 किस्तों में भुगतान", "desc": "नींव, छत और फिनिशिंग स्तर पर सहायता राशि सीधे खाते में पहुंचेगी।"}
        ],
        "official_website": "https://pmaymis.gov.in",
        "official_source": "आवासन और शहरी कार्य मंत्रालय, भारत सरकार / myScheme",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    # 35. Paramparagat Krishi Vikas Yojana (PKVY - Organic Farming)
    {
        "id": "scheme_pkvy",
        "scheme_name": "Paramparagat Krishi Vikas Yojana (PKVY)",
        "scheme_name_hindi": "परम्परागत कृषि विकास योजना (जैविक खेती)",
        "category": "agriculture",
        "category_hindi": "कृषि एवं किसान कल्याण",
        "description": "Financial assistance of Rs 50,000 per hectare for 3 years to farmers adopting certified organic farming clusters.",
        "description_hindi": "रासायनिक खादों से मुक्ति और प्राकृतिक/जैविक खेती अपनाने वाले किसानों के समूहों को ₹50,000 प्रति हेक्टेयर की 3-वर्षीय वित्तीय सहायता।",
        "department": "Department of Agriculture and Farmers Welfare",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "ministry": "Ministry of Agriculture and Farmers Welfare, Government of India",
        "ministry_hindi": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "beneficiary_tags": ["farmer", "organic", "agriculture"],
        "benefits": {
            "annual_total": 50000,
            "description_hindi": "3 वर्षों में ₹50,000 प्रति हेक्टेयर सहायता (जिसमें ₹31,000 सीधे किसान को जैविक खाद, बीज व बायो-पेस्टीसाइड हेतु नकद अंतरण)",
            "description_en": "Rs 50,000 per hectare for 3 years, with Rs 31,000 direct benefit transfer for inputs"
        },
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True
        },
        "required_documents": [
            "आधार कार्ड",
            "जमीन की खतौनी",
            "बैंक पासबुक",
            "किसान समूह (क्लस्टर) सदस्यता फॉर्म"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "20-50 किसानों का क्लस्टर बनाएं", "desc": "कृषि प्रसार अधिकारी के सहयोग से 20 या 50 एकड़ का जैविक क्लस्टर बनाएं।"},
            {"step": 2, "title": "pgsindia-ncof.gov.in पर पंजीकरण", "desc": "क्लस्टर का पीजीएस (PGS-India) जैविक प्रमाणीकरण पोर्टल पर पंजीकरण कराएं।"},
            {"step": 3, "title": "डीबीटी इनपुट सहायता प्राप्त करें", "desc": "जैविक खाद, वर्मी-कम्पोस्ट व कीट नियंत्रक सामग्री हेतु राशि सीधे बैंक खाते में पहुंचेगी।"}
        ],
        "official_website": "https://pgsindia-ncof.gov.in",
        "official_source": "कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    {
        "id": "scheme_pmgkay",
        "scheme_name": "Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY)",
        "scheme_name_hindi": "प्रधानमंत्री गरीब कल्याण अन्न योजना (मुफ्त राशन)",
        "department": "Department of Food and Public Distribution",
        "department_hindi": "खाद्य और सार्वजनिक वितरण विभाग, भारत सरकार",
        "ministry": "Ministry of Consumer Affairs, Food and Public Distribution",
        "ministry_hindi": "उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय",
        "central_or_state": "central",
        "applicable_states": ["All"],
        "category": "food_security",
        "category_hindi": "खाद्य सुरक्षा व पोषण",
        "beneficiary_tags": ["all", "poor", "ration_card", "rural", "urban", "bpl", "antyodaya"],
        "description": "Provides 5 kg of free foodgrains per person per month to eligible priority households and 35 kg per family for Antyodaya Anna Yojana (AAY) families.",
        "description_hindi": "राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA) के अंतर्गत पात्र परिवारों को प्रति व्यक्ति 5 किलो और अंत्योदय परिवारों को 35 किलो मुफ्त खाद्यान्न (गेहूं/चावल) प्रतिमाह।",
        "benefits": {
            "type": "in_kind",
            "amount": 0,
            "period": "monthly",
            "description": "5 kg free foodgrain per person per month",
            "description_hindi": "प्रति व्यक्ति 5 किलो मुफ्त राशन (गेहूं/चावल) हर महीने कोटेदार के माध्यम से।"
        },
        "eligibility_criteria": {
            "min_age": 0,
            "max_age": 120,
            "gender": "any",
            "marital_status": "any",
            "states": ["All"],
            "max_income": 200000.0,
            "occupations": ["any"],
            "requires_ration_card": True,
            "has_exclusions": False
        },
        "required_documents": [
            "राशन कार्ड (पात्र गृहस्थी या अंत्योदय)",
            "आधार कार्ड (सभी पारिवारिक सदस्यों का)",
            "ई-पॉस (ePoS) बायोमेट्रिक प्रमाणीकरण"
        ],
        "optional_documents": [],
        "application_steps": [
            {"step": 1, "title": "राशन कार्ड सत्यापन", "desc": "निकटतम उचित दर विक्रेता (राशन कोटेदार) के पास जाएं।"},
            {"step": 2, "title": "ई-पॉस मशीन पर अंगूठा लगाएं", "desc": "बायोमेट्रिक प्रमाणीकरण पूर्ण करें।"},
            {"step": 3, "title": "मुफ्त खाद्यान्न प्राप्त करें", "desc": "निर्धारित मात्रा में बिना किसी शुल्क के गेहूं और चावल प्राप्त करें।"}
        ],
        "official_website": "https://nfsa.gov.in",
        "official_source": "खाद्य और सार्वजनिक वितरण विभाग, भारत सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    },
    {
        "id": "scheme_up_divyang_shadi",
        "scheme_name": "UP Divyang Shadi Protsahan Puraskar Yojana",
        "scheme_name_hindi": "उत्तर प्रदेश दिव्यांग शादी प्रोत्साहन पुरस्कार योजना",
        "department": "Divyangjan Sashaktikaran Vibhag, Uttar Pradesh",
        "department_hindi": "दिव्यांगजन सशक्तिकरण विभाग, उत्तर प्रदेश सरकार",
        "ministry": "Divyangjan Sashaktikaran Vibhag",
        "ministry_hindi": "दिव्यांगजन सशक्तिकरण विभाग",
        "central_or_state": "state",
        "applicable_states": ["उत्तर प्रदेश"],
        "category": "social_welfare",
        "category_hindi": "दिव्यांग कल्याण व सामाजिक सुरक्षा",
        "beneficiary_tags": ["divyang", "disability", "women", "marriage", "grant"],
        "description": "Financial grant of Rs 20,000 to Rs 35,000 to married couples where either or both spouses are persons with disabilities (40%+).",
        "description_hindi": "विवाहित दंपत्ति में पति या पत्नी के दिव्यांग (40% या अधिक) होने पर ₹20,000 और दोनों के दिव्यांग होने पर ₹35,000 की एकमुश्त प्रोत्साहन राशि।",
        "benefits": {
            "type": "one_time_grant",
            "amount": 35000,
            "period": "one_time",
            "description": "Rs 20,000 - 35,000 wedding incentive grant",
            "description_hindi": "शादी के उपरांत ₹20,000 से ₹35,000 की एकमुश्त अनुदान सहायता।"
        },
        "eligibility_criteria": {
            "min_age": 18,
            "max_age": 45,
            "gender": "any",
            "marital_status": "विवाहित",
            "states": ["उत्तर प्रदेश"],
            "max_income": 300000.0,
            "has_disability": True,
            "disability_percentage_min": 40
        },
        "required_documents": [
            "आधार कार्ड (दंपत्ति)",
            "दिव्यांगता प्रमाण पत्र (सीएमओ द्वारा जारी 40%+)",
            "विवाह पंजीकरण प्रमाण पत्र",
            "संयुक्त बैंक खाता पासबुक",
            "निवास प्रमाण पत्र (उत्तर प्रदेश)"
        ],
        "optional_documents": ["आय प्रमाण पत्र"],
        "application_steps": [
            {"step": 1, "title": "divyangjan.upsdc.gov.in पर ऑनलाइन आवेदन", "desc": "शादी की तिथि से 1 वर्ष के भीतर पोर्टल पर फॉर्म भरें।"},
            {"step": 2, "title": "दस्तावेज़ अपलोड करें", "desc": "दिव्यांगता व विवाह पंजीकरण प्रमाण पत्र संलग्न करें।"},
            {"step": 3, "title": "डीबीटी द्वारा अनुदान प्राप्त करें", "desc": "जिला दिव्यांगजन सशक्तिकरण अधिकारी के सत्यापन उपरांत राशि संयुक्त खाते में भेजी जाएगी।"}
        ],
        "official_website": "http://divyangjan.upsdc.gov.in",
        "official_source": "दिव्यांगजन सशक्तिकरण विभाग, उत्तर प्रदेश सरकार",
        "last_verified_at": "2024-11-01",
        "is_active": True
    }
]


import copy

# User-Isolated Data Stores Keyed by Supabase User UUID
USER_PROFILES: Dict[str, Dict[str, Any]] = {}
USER_DOCS: Dict[str, Dict[str, str]] = {}
USER_APPLICATIONS: Dict[str, List[Dict[str, Any]]] = {}
USER_FAMILY_MEMBERS: Dict[str, List[Dict[str, Any]]] = {}
USER_SCHEME_RESULTS: Dict[str, List[Dict[str, Any]]] = {}

ACTIVE_USER_SESSIONS: Dict[str, Dict[str, Any]] = {}


def get_demo_profile() -> Dict[str, Any]:
    """Returns a deep copy of the verified demo citizen persona (सीता देवी). Used only for testing."""
    return copy.deepcopy(DB_PROFILE)


def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves the isolated profile belonging ONLY to user_id.
    Returns None if the user is newly registered and has not completed onboarding.
    """
    if not user_id:
        return None
    if user_id in USER_PROFILES:
        prof = USER_PROFILES[user_id]
        # Attach current family members
        prof["members"] = USER_FAMILY_MEMBERS.get(user_id, [])
        prof["family_size"] = max(1, len(prof["members"]))
        return prof
    return None


def save_user_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves or updates profile for user_id.
    Ensures strict tenant isolation by user UUID.
    """
    if not user_id:
        raise ValueError("user_id is required")

    existing = USER_PROFILES.get(user_id)
    if not existing:
        existing = {
            "id": user_id,
            "user_id": user_id,
            "name": updates.get("name", "नागरिक"),
            "age": updates.get("age"),
            "gender": updates.get("gender"),
            "marital_status": updates.get("marital_status"),
            "state": updates.get("state", "उत्तर प्रदेश"),
            "district": updates.get("district"),
            "village_or_town": updates.get("village_or_town"),
            "occupation": updates.get("occupation"),
            "annual_income": updates.get("annual_income"),
            "family_size": updates.get("family_size", 1),
            "has_bank_account": updates.get("has_bank_account", True),
            "landholding": updates.get("landholding", 0.0),
            "caste_category": updates.get("caste_category"),
            "is_student": updates.get("is_student", False),
            "has_disability": updates.get("has_disability", False),
            "is_onboarded": True,
            "current_benefits": updates.get("current_benefits", []),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    else:
        for k, v in updates.items():
            if v is not None:
                existing[k] = v
        existing["is_onboarded"] = True
        existing["updated_at"] = datetime.now().isoformat()

    USER_PROFILES[user_id] = existing
    existing["members"] = USER_FAMILY_MEMBERS.get(user_id, [])
    existing["family_size"] = max(1, len(existing["members"]))
    return existing


def get_user_family_members(user_id: str) -> List[Dict[str, Any]]:
    """Returns family members belonging ONLY to user_id."""
    return USER_FAMILY_MEMBERS.get(user_id, [])


def add_user_family_member(user_id: str, member: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a family member for user_id."""
    if user_id not in USER_FAMILY_MEMBERS:
        USER_FAMILY_MEMBERS[user_id] = []

    new_member = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": member.get("name", ""),
        "relationship": member.get("relationship", ""),
        "age": member.get("age", 0),
        "occupation": member.get("occupation", ""),
        "education": member.get("education", "")
    }
    USER_FAMILY_MEMBERS[user_id].append(new_member)

    # Sync family size in profile if exists
    if user_id in USER_PROFILES:
        USER_PROFILES[user_id]["family_size"] = len(USER_FAMILY_MEMBERS[user_id])
    return new_member


def remove_user_family_member(user_id: str, member_id: str) -> bool:
    """Removes a family member belonging ONLY to user_id."""
    members = USER_FAMILY_MEMBERS.get(user_id, [])
    original_len = len(members)
    USER_FAMILY_MEMBERS[user_id] = [m for m in members if m.get("id") != member_id]
    removed = len(USER_FAMILY_MEMBERS[user_id]) < original_len

    if removed and user_id in USER_PROFILES:
        USER_PROFILES[user_id]["family_size"] = max(1, len(USER_FAMILY_MEMBERS[user_id]))
    return removed


def get_user_documents(user_id: str) -> Dict[str, str]:
    """Returns documents status map for user_id. Returns empty dict if no documents recorded."""
    return USER_DOCS.get(user_id, {})


def update_user_document_status(doc_name: str, status: str, user_id: Optional[str] = None) -> None:
    """Updates document status for user_id or legacy store."""
    if user_id:
        if user_id not in USER_DOCS:
            USER_DOCS[user_id] = {}
        USER_DOCS[user_id][doc_name] = status
    else:
        DB_USER_DOCS[doc_name] = status


def get_user_document_status(doc_name: str, user_id: Optional[str] = None) -> str:
    """Gets document status for user_id or legacy store."""
    if user_id and user_id in USER_DOCS:
        return USER_DOCS[user_id].get(doc_name, "missing")
    return DB_USER_DOCS.get(doc_name, "missing")


def get_all_user_documents(user_id: Optional[str] = None) -> Dict[str, str]:
    """Gets all documents for user_id or legacy store."""
    if user_id and user_id in USER_DOCS:
        return USER_DOCS[user_id]
    return DB_USER_DOCS


def get_user_applications(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns applications belonging ONLY to user_id. Returns empty list for new users."""
    if user_id:
        return USER_APPLICATIONS.get(user_id, [])
    return DB_APPLICATIONS


def add_user_application(app: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Adds an application linked to user_id."""
    new_app = {
        "id": f"app_{uuid.uuid4().hex[:6]}",
        "user_id": user_id or "anonymous",
        "scheme_id": app["scheme_id"],
        "scheme_name_hindi": app.get("scheme_name_hindi", ""),
        "department_hindi": app.get("department_hindi", ""),
        "application_status": app.get("application_status", "submitted_at_csc"),
        "application_reference": app.get("application_reference") or f"SS-{datetime.now().year}-{uuid.uuid4().hex[:5].upper()}",
        "applied_date": datetime.now().strftime("%Y-%m-%d"),
        "official_website": app.get("official_website", "")
    }
    if user_id:
        if user_id not in USER_APPLICATIONS:
            USER_APPLICATIONS[user_id] = []
        USER_APPLICATIONS[user_id].append(new_app)
    else:
        DB_APPLICATIONS.append(new_app)
    return new_app


def delete_user_account_data(user_id: str) -> bool:
    """
    Deletes all personal records for user_id:
    profile, family members, documents, applications, scheme results.
    Enforces GDPR/Data Privacy right to erasure.
    """
    if not user_id:
        return False
    USER_PROFILES.pop(user_id, None)
    USER_FAMILY_MEMBERS.pop(user_id, None)
    USER_DOCS.pop(user_id, None)
    USER_APPLICATIONS.pop(user_id, None)
    USER_SCHEME_RESULTS.pop(user_id, None)
    return True


def create_empty_profile(session_id: Optional[str] = None) -> Dict[str, Any]:
    """Creates a fresh, unpolluted citizen profile for a new user research query."""
    sid = session_id or str(uuid.uuid4())
    clean_profile = {
        "id": sid,
        "user_id": sid,
        "name": "",
        "age": None,
        "gender": None,
        "marital_status": None,
        "state": "उत्तर प्रदेश",
        "district": None,
        "village_or_town": None,
        "area_type": "rural",
        "occupation": None,
        "annual_income": None,
        "family_size": 1,
        "has_bank_account": True,
        "landholding": None,
        "caste_category": None,
        "is_student": False,
        "has_disability": False,
        "is_onboarded": False,
        "current_benefits": [],
        "members": []
    }
    ACTIVE_USER_SESSIONS[sid] = clean_profile
    return clean_profile


def get_session_profile(session_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves session profile or creates a fresh one."""
    if not session_id:
        return get_current_profile()
    if session_id == "demo":
        return get_demo_profile()
    if session_id not in ACTIVE_USER_SESSIONS:
        return create_empty_profile(session_id)
    return ACTIVE_USER_SESSIONS[session_id]


def update_session_profile(session_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Updates a session-scoped profile without contaminating the global demo profile."""
    prof = get_session_profile(session_id)
    for k, v in updates.items():
        if v is not None:
            prof[k] = v
    ACTIVE_USER_SESSIONS[session_id] = prof
    return prof


def get_current_profile() -> Dict[str, Any]:
    return DB_PROFILE


def update_profile(updates: Dict[str, Any]) -> Dict[str, Any]:
    global DB_PROFILE
    for k, v in updates.items():
        if v is not None:
            DB_PROFILE[k] = v
    return DB_PROFILE


def add_family_member(member: Dict[str, Any]) -> Dict[str, Any]:
    global DB_PROFILE
    new_member = {
        "id": str(uuid.uuid4()),
        "name": member.get("name", ""),
        "relationship": member.get("relationship", ""),
        "age": member.get("age", 0),
        "occupation": member.get("occupation", "")
    }
    DB_PROFILE["members"].append(new_member)
    DB_PROFILE["family_size"] = len(DB_PROFILE["members"])
    return new_member


def remove_family_member(member_id: str) -> bool:
    global DB_PROFILE
    original_len = len(DB_PROFILE["members"])
    DB_PROFILE["members"] = [m for m in DB_PROFILE["members"] if m["id"] != member_id]
    DB_PROFILE["family_size"] = len(DB_PROFILE["members"])
    return len(DB_PROFILE["members"]) < original_len


def get_all_schemes() -> List[Dict[str, Any]]:
    return DB_SCHEMES


def get_scheme_by_id(scheme_id: str) -> Optional[Dict[str, Any]]:
    for s in DB_SCHEMES:
        if s["id"] == scheme_id:
            return s
    return None


# Optional Supabase Integration Helpers
async def sync_profile_to_supabase(profile_data: Dict[str, Any]) -> bool:
    """
    Syncs profile data to Supabase if credentials are provided in .env
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return False
    try:
        import httpx
        url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/family_profiles"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=profile_data, headers=headers, timeout=10.0)
            return resp.status_code in (200, 201, 204)
    except Exception as e:
        print(f"[Supabase] Sync failed: {e}")
        return False
