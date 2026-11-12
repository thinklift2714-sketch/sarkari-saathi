"""
Personalized Document Checklist Service for Sarkari Saathi.
Generates personalized checklist with availability status and issuance guidance.
"""
from typing import Any, Dict, List, Optional
from app.database import get_scheme_by_id, get_user_document_status, update_user_document_status, get_user_documents

# Default instructions for common Indian government documents
DOCUMENT_GUIDANCE: Dict[str, Dict[str, str]] = {
    "आधार कार्ड": {
        "instructions": "नाम, पिता/पति का नाम और जन्मतिथि सही होनी चाहिए।",
        "how_to_get": "नजदीकी आधार सेवा केंद्र, बैंक या डाकघर में जाकर बायोमेट्रिक अपडेट या नया कार्ड बनवाएं।"
    },
    "बैंक पासबुक": {
        "instructions": "खाता सक्रिय होना चाहिए और आधार व डीबीटी (DBT) से जुड़ा (NPCI-linked) होना आवश्यक है।",
        "how_to_get": "अपनी बैंक शाखा में जाकर पासबुक पर अंतिम प्रविष्टि कराएं और डीबीटी सीडिंग फॉर्म जमा करें।"
    },
    "आय प्रमाण पत्र": {
        "instructions": "तहसीलदार द्वारा जारी और 3 वर्ष से अधिक पुराना नहीं होना चाहिए।",
        "how_to_get": "नजदीकी जन सेवा केंद्र (CSC) अथवा edistrict.up.gov.in पर ऑनलाइन आवेदन करें। 7-10 दिनों में तैयार होता है।"
    },
    "निवास प्रमाण पत्र": {
        "instructions": "संबंधित राज्य का स्थायी निवासी होने का प्रमाण।",
        "how_to_get": "जन सेवा केंद्र (CSC) अथवा तहसील कार्यालय से बनवाएं।"
    },
    "पति का मृत्यु प्रमाण पत्र": {
        "instructions": "नगर निगम अथवा ग्राम पंचायत द्वारा जारी मूल मृत्यु प्रमाण पत्र।",
        "how_to_get": "नगर निगम कार्यालय या ग्राम पंचायत सचिव/ब्लॉक कार्यालय से प्राप्त करें।"
    },
    "विधवा प्रमाण पत्र": {
        "instructions": "ग्राम प्रधान अथवा तहसीलदार द्वारा सत्यापित विधवा होने का प्रमाण।",
        "how_to_get": "तहसीलदार कार्यालय या जन सेवा केंद्र से प्राप्त करें।"
    },
    "पासपोर्ट आकार का फोटो": {
        "instructions": "हाल ही में खिंचवाया गया साफ रंगीन फोटो (सफेद बैकग्राउंड)।",
        "how_to_get": "किसी भी फोटो स्टूडियो से तुरंत खिंचवाएं।"
    },
    "जमीन की खतौनी (भूलेख नकल)": {
        "instructions": "नवीनतम कंप्यूटरीकृत भूलेख खतौनी की प्रतिलिपि।",
        "how_to_get": "upbhulekh.gov.in पोर्टल से सीधे डाउनलोड करें अथवा तहसील/CSC से लें।"
    },
    "राशन कार्ड": {
        "instructions": "परिवार के सभी सदस्यों के नाम वाला राशन कार्ड।",
        "how_to_get": "खाद्य एवं रसद विभाग की वेबसाइट fcs.up.gov.in या CSC केंद्र से प्रिंट कराएं।"
    }
}


class DocumentService:
    @staticmethod
    def get_checklist_for_scheme(scheme_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        scheme = get_scheme_by_id(scheme_id)
        if not scheme:
            return None

        req_docs = scheme.get("required_documents", [])
        items: List[Dict[str, Any]] = []

        # If user is authenticated, use isolated user documents. If empty, all are 'missing'.
        user_docs_map = get_user_documents(user_id) if user_id else None

        completed_count = 0
        for doc_name in req_docs:
            if user_docs_map is not None:
                status = user_docs_map.get(doc_name, "missing")
            else:
                status = get_user_document_status(doc_name)

            is_completed = status in ("available", "uploaded")
            if is_completed:
                completed_count += 1

            guidance = DOCUMENT_GUIDANCE.get(doc_name, {})
            items.append({
                "id": f"doc_{abs(hash(doc_name)) % 100000}",
                "document_name": doc_name,
                "document_name_hindi": doc_name,
                "is_required": True,
                "status": status,
                "instructions": guidance.get("instructions", "मान्य सरकारी प्रारूप में होना चाहिए।"),
                "how_to_get": guidance.get("how_to_get", "नजदीकी CSC जन सेवा केंद्र या तहसील से संपर्क करें।")
            })

        total = len(items)
        progress = int((completed_count / total * 100)) if total > 0 else 0

        return {
            "scheme_id": scheme_id,
            "scheme_name_hindi": scheme.get("scheme_name_hindi", ""),
            "total_count": total,
            "completed_count": completed_count,
            "progress_percentage": progress,
            "items": items
        }

    @staticmethod
    def update_document(doc_name: str, status: str, user_id: Optional[str] = None) -> None:
        update_user_document_status(doc_name, status, user_id=user_id)


document_service = DocumentService()

