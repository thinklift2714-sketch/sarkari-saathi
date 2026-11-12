"""
Gemini Conversation & Extraction Service for Sarkari Saathi.
Converses in simple, empathetic Hindi, asking one question at a time,
and extracting structured profile parameters for the deterministic rule engine.
"""
import json
import re
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from app.config import settings
from app.database import get_all_schemes
from app.rule_engine.evaluator import SchemeEvaluator

SYSTEM_INSTRUCTION = """
आप 'Sarkari Saathi' (सरकारी साथी) के अत्यंत विनम्र, सरल और संवेदनशील AI सहायक हैं।
आपका उद्देश्य भारतीय नागरिकों (विशेष रूप से ग्रामीण, किसान, महिलाएं, वृद्ध) को उनकी व्यक्तिगत स्थिति के आधार पर सही सरकारी योजनाएं ढूंढने में मदद करना है।

नियम:
1. हमेशा अत्यंत सरल, सहज और बोलचाल की हिंदी में ही बात करें।
2. एक बार में केवल एक ही प्रासंगिक प्रश्न पूछें ताकि उपयोगकर्ता भ्रमित न हो।
3. कभी भी आधार नंबर, बैंक पासवर्ड, ओटीपी या संवेदनशील जानकारी न मांगें।
4. कभी भी मनगढ़ंत या फर्जी सरकारी योजना का नाम न बताएं।
5. उपयोगकर्ता द्वारा कही गई बातों से निम्नलिखित जानकारी निकालने का प्रयास करें:
   - name (नाम)
   - age (उम्र संख्या में)
   - gender (महिला/पुरुष/अन्य)
   - marital_status (विधवा/विवाहित/अविवाहित)
   - state (राज्य)
   - district (जिला)
   - occupation (पेशा जैसे किसान, किसान की विधवा, मजदूर, छात्र आदि)
   - annual_income (वार्षिक पारिवारिक आय संख्या में)
   - landholding (जमीन एकड़ में)
   - is_student (सत्य/असत्य)
   - has_disability (सत्य/असत्य)
   - caste_category (सामान्य/ओबीसी/एससी/एसटी)
6. आउटपुट हमेशा इस JSON प्रारूप में दें:
{
  "message": "उपयोगकर्ता को दिया जाने वाला सरल हिंदी उत्तर और अगला प्रश्न",
  "extracted_data": {
    "age": 52,
    "marital_status": "विधवा"
  },
  "missing_fields": ["state", "district", "annual_income"],
  "next_action": "ask_followup"
}
next_action के मान: "ask_followup" (यदि कोई मुख्य जानकारी बाकी है) या "ready_for_results" (यदि पर्याप्त जानकारी मिल गई है)।
"""


class GeminiConversationService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION,
                    generation_config={"response_mime_type": "application/json"}
                )
            except Exception as e:
                print(f"[GeminiService] Warning configuring Gemini: {e}")
                self.model = None
        else:
            self.model = None

    def converse(
        self,
        user_message: str,
        history: List[Dict[str, str]],
        current_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends message to Gemini or uses intelligent Hindi conversational engine.
        """
        if self.model and self.api_key:
            try:
                prompt = (
                    f"वर्तमान प्रोफाइल डेटा: {json.dumps(current_profile or {}, ensure_ascii=False)}\n"
                    f"उपयोगकर्ता का संदेश: {user_message}\n"
                    f"कृपया सहानुभूतिपूर्वक उत्तर दें और एक समय में एक ही अगला सवाल पूछें।"
                )
                response = self.model.generate_content(prompt)
                parsed = json.loads(response.text)
                return parsed
            except Exception as e:
                print(f"[GeminiService] Gemini call failed, using rule-based fallback: {e}")

        # Intelligent Fallback Hindi Conversation Engine
        return self._rule_based_hindi_dialogue(user_message, current_profile or {})

    def extract_entities(self, text: str, profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts structured profile attributes, intent category, and domain needs
        from Hindi text across Agriculture, Education, Pensions, Healthcare, Employment, etc.
        """
        extracted: Dict[str, Any] = {}
        lowered = text.lower()

        # 1. Intent Category & Problem Tags
        categories = []
        if any(w in lowered for w in ["किसान", "खेती", "फसल", "बीज", "खाद", "ट्रैक्टर", "केसीसी", "kcc", "बोरवेल", "सिंचाई", "पटाईदार"]):
            categories.append("agriculture")
        if any(w in lowered for w in ["विधवा", "मृत्यु", "निधन", "स्वर्गवास", "पति नहीं रहे", "पेंशन", "वृद्ध", "बुजुर्ग", "60 वर्ष", "60 साल"]):
            categories.append("social_welfare")
        if any(w in lowered for w in ["छात्र", "छात्रा", "पढ़ाई", "कॉलेज", "स्कूल", "10वीं", "12वीं", "छात्रवृत्ति", "स्कॉलरशिप", "कोचिंग"]):
            categories.append("education")
        if any(w in lowered for w in ["बेरोजगार", "नौकरी", "रोजगार", "कौशल", "ट्रेनिंग", "दुकान", "मुद्रा", "लोन", "कारीगर", "विश्वकर्मा"]):
            categories.append("employment")
        if any(w in lowered for w in ["बीमार", "इलाज", "अस्पताल", "आयुष्मान", "दवा", "ऑपरेशन", "डॉक्टर"]):
            categories.append("health")
        if any(w in lowered for w in ["मकान", "घर", "कच्चा घर", "छत", "आवास"]):
            categories.append("housing")
        if any(w in lowered for w in ["राशन", "कोटेदार", "अनाज", "गेहूं", "चावल", "खाद्यान्न"]):
            categories.append("food_security")
        if any(w in lowered for w in ["गैस", "चूल्हा", "उज्ज्वला", "सिलेंडर"]):
            categories.append("energy")
        if any(w in lowered for w in ["दिव्यांग", "विकलांग", "अक्षम", "नेत्रहीन", "व्हीलचेयर"]):
            categories.append("social_welfare")
            extracted["has_disability"] = True
        if any(w in lowered for w in ["गर्भवती", "शिशु", "प्रसूति", "बेटी", "कन्या", "सुकन्या"]):
            categories.append("women_child")

        extracted["target_categories"] = categories if categories else ["social_welfare"]

        # 2. Occupation & Persona
        if any(w in lowered for w in ["मृत्यु", "निधन", "स्वर्गवास", "पति नहीं रहे", "विधवा"]):
            extracted["marital_status"] = "विधवा"
            extracted["gender"] = "महिला"
            if "पति किसान" in lowered or "खेती" in lowered or "किसान" in lowered:
                extracted["occupation"] = "किसान की विधवा"
            else:
                extracted["occupation"] = "गृहिणी / विधवा"
        elif any(w in lowered for w in ["किसान", "खेती", "कृषि", "खेतिहर"]):
            extracted["occupation"] = "किसान"
        elif any(w in lowered for w in ["छात्र", "विद्यार्थी", "छात्रा"]):
            extracted["occupation"] = "छात्र"
            extracted["is_student"] = True
        elif any(w in lowered for w in ["बेरोजगार"]):
            extracted["occupation"] = "बेरोजगार युवा"
        elif any(w in lowered for w in ["कारीगर", "लोहार", "बढ़ई", "दर्जी", "शिल्पकार"]):
            extracted["occupation"] = "कारीगर / कामगार"
        elif any(w in lowered for w in ["मजदूर", "श्रमिक", "दहाड़ी"]):
            extracted["occupation"] = "मजदूर / श्रमिक"
        elif any(w in lowered for w in ["दुकान", "रेहड़ी", "ठेला", "पटरी"]):
            extracted["occupation"] = "स्ट्रीट वेंडर / दुकानदार"

        # 3. Age detection
        age_match = re.search(r'(\d{1,2})\s*(?:साल|वर्ष|उम्र)', text)
        if age_match:
            extracted["age"] = int(age_match.group(1))
        else:
            num_match = re.search(r'\b([1-9][0-9])\b', text)
            if num_match:
                extracted["age"] = int(num_match.group(1))

        # 4. Landholding detection (acres / bigha / hectare)
        land_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:एकड़|acre|हेक्टेयर|hectare|बीघा|bigha)', lowered)
        if land_match:
            val = float(land_match.group(1))
            if "बीघा" in lowered or "bigha" in lowered:
                val = val * 0.4 # approx 1 bigha = ~0.4 acre in UP
            extracted["landholding"] = round(val, 2)
        elif "भूमिहीन" in lowered or "जमीन नहीं" in lowered:
            extracted["landholding"] = 0.0

        # 5. Income detection
        inc_match = re.search(r'(\d{1,3}(?:,\d{2,3})*|\d+)\s*(?:हजार|लाख|रुपये|रु|rs|inr)', lowered)
        if inc_match:
            raw_val = inc_match.group(1).replace(",", "")
            try:
                base_val = float(raw_val)
                if "लाख" in lowered:
                    extracted["annual_income"] = base_val * 100000.0
                elif "हजार" in lowered:
                    extracted["annual_income"] = base_val * 1000.0
                else:
                    extracted["annual_income"] = base_val
            except ValueError:
                pass

        # 6. Location: State & District
        if "उत्तर प्रदेश" in text or "यूपी" in text or "up" in lowered:
            extracted["state"] = "उत्तर प्रदेश"
        elif "बिहार" in text:
            extracted["state"] = "बिहार"
        elif "मध्य प्रदेश" in text or "mp" in lowered:
            extracted["state"] = "मध्य प्रदेश"
        elif "राजस्थान" in text:
            extracted["state"] = "राजस्थान"

        districts_up = ["वाराणसी", "बनारस", "काशी", "प्रयागराज", "इलाहाबाद", "गोरखपुर", "लखनऊ", "अयोध्या", "बरेली", "आगरा", "कानपुर", "मेरठ", "झांसी"]
        for d in districts_up:
            if d in text:
                extracted["district"] = "वाराणसी" if d in ["बनारस", "काशी"] else ("प्रयागराज" if d == "इलाहाबाद" else d)
                break

        # 7. Caste & Category
        if "ओबीसी" in lowered or "obc" in lowered or "पिछड़ा" in lowered:
            extracted["caste_category"] = "ओबीसी"
        elif "एससी" in lowered or "अनुसूचित जाति" in lowered or "दलित" in lowered:
            extracted["caste_category"] = "अनुसूचित जाति (SC)"
        elif "एसटी" in lowered or "आदिवासी" in lowered:
            extracted["caste_category"] = "अनुसूचित जनजाति (ST)"
        elif "सामान्य" in lowered or "जनरल" in lowered or "general" in lowered:
            extracted["caste_category"] = "सामान्य / अन्य"

        # 8. Rural vs Urban
        if any(w in lowered for w in ["गांव", "ग्रामीण", "देहात", "ग्राम"]):
            extracted["area_type"] = "rural"
        elif any(w in lowered for w in ["शहर", "शहरी", "कस्बा", "नगर"]):
            extracted["area_type"] = "urban"

        return extracted

    def _rule_based_hindi_dialogue(self, text: str, profile: Dict[str, Any]) -> Dict[str, Any]:
        extracted = self.extract_entities(text, profile)
        merged = {**profile, **extracted}
        missing = []

        # Determine domain-specific missing fields
        occ = merged.get("occupation", "")
        is_farmer = "किसान" in occ
        is_student = merged.get("is_student", False) or "छात्र" in occ
        is_widow = merged.get("marital_status") == "विधवा"
        age = merged.get("age")

        if not age:
            missing.append("age")
        if not merged.get("state"):
            missing.append("state")
        if not merged.get("annual_income") and not is_student:
            missing.append("annual_income")
        if is_farmer and merged.get("landholding") is None:
            missing.append("landholding")

        # Context-aware tailored Hindi response
        if is_widow and not age:
            reply = "मुझे यह जानकर अत्यंत दुख हुआ। इस कठिन समय में सरकार की कई योजनाएं आपके साथ हैं। क्या आप अपनी उम्र बता सकती हैं?"
            next_action = "ask_followup"
        elif is_farmer and not merged.get("landholding") and not merged.get("state"):
            reply = "नमस्ते किसान भाई! किसानों के लिए पीएम-किसान, फसल बीमा, केसीसी और कृषि यंत्र अनुदान जैसी योजनाएं हैं। आपके पास लगभग कितनी जमीन (एकड़ या बीघा) है और आपका जिला कौन सा है?"
            next_action = "ask_followup"
        elif is_student and not age:
            reply = "नमस्ते! विद्यार्थियों के लिए पूर्व-दशम, दशमोत्तर छात्रवृत्ति और पीएम यशस्वी जैसी कई योजनाएं हैं। आप वर्तमान में किस कक्षा/कोर्स में पढ़ रहे हैं और आपकी उम्र क्या है?"
            next_action = "ask_followup"
        elif "employment" in extracted.get("target_categories", []) and not age:
            reply = "रोजगार और स्वरोजगार के लिए पीएम विश्वकर्मा, मुद्रा लोन और पीएम स्वनिधि जैसी योजनाएं उपलब्ध हैं। आपकी उम्र क्या है और आपकी क्या योग्यता या कार्य-अनुभव है?"
            next_action = "ask_followup"
        elif not age:
            reply = "नमस्ते! मैं आपकी सरकारी योजनाएं खोजने में पूरी मदद करूँगा। कृपया अपनी उम्र और राज्य बताएं ताकि हम सही पात्रता देख सकें।"
            next_action = "ask_followup"
        elif not merged.get("state"):
            reply = f"धन्यवाद! आपकी उम्र {age} वर्ष दर्ज कर ली गई है। आप किस राज्य और जिले में रहते हैं?"
            next_action = "ask_followup"
        elif not merged.get("annual_income") and not is_student:
            reply = f"बहुत अच्छा। आपके क्षेत्र ({merged.get('state', 'उत्तर प्रदेश')}) के लिए कई सरकारी योजनाएं हैं। क्या आप अपने परिवार की लगभग वार्षिक आय (जैसे ₹50,000 या ₹1 लाख) बता सकते हैं?"
            next_action = "ask_followup"
        else:
            # We have enough key details to proceed to research!
            all_schemes = get_all_schemes()
            eligible_schemes = []
            for s in all_schemes:
                ev = SchemeEvaluator.evaluate(merged, s)
                if ev["status"] == "eligible":
                    eligible_schemes.append(s.get("scheme_name_hindi", ""))

            eligible_count = len(eligible_schemes)
            top_names = ", ".join([f"'{name}'" for name in eligible_schemes[:3]])
            reply = (
                f"धन्यवाद! आपकी जानकारी के आधार पर हमने आपके लिए {eligible_count} उपयुक्त सरकारी योजनाएँ खोजी हैं, "
                f"जिनमें {top_names} शामिल हैं। अब आप नीचे दिए गए बटन से पूरा एआई विश्लेषण देख सकते हैं।"
            )
            next_action = "ready_for_results"

        return {
            "message": reply,
            "extracted_data": extracted,
            "missing_fields": missing,
            "next_action": next_action
        }


gemini_service = GeminiConversationService()
