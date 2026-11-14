"""
Input Validation and Classification Service for Sarkari Saathi.
Strictly validates citizen input before triggering any scheme discovery or recommendation engine.
Categorizes inputs into 6 standardized categories:
1. VALID_BENEFICIARY_REQUEST
2. INCOMPLETE_BENEFICIARY_REQUEST
3. UNRELATED_MESSAGE
4. RANDOM_OR_GIBBERISH_TEXT
5. GREETING
6. UNSAFE_OR_UNSUPPORTED_REQUEST
"""
import re
import math
from typing import Dict, Any, List, Optional
from enum import Enum


class InputCategory(str, Enum):
    VALID_BENEFICIARY_REQUEST = "VALID_BENEFICIARY_REQUEST"
    INCOMPLETE_BENEFICIARY_REQUEST = "INCOMPLETE_BENEFICIARY_REQUEST"
    UNRELATED_MESSAGE = "UNRELATED_MESSAGE"
    RANDOM_OR_GIBBERISH_TEXT = "RANDOM_OR_GIBBERISH_TEXT"
    GREETING = "GREETING"
    UNSAFE_OR_UNSUPPORTED_REQUEST = "UNSAFE_OR_UNSUPPORTED_REQUEST"


class InputValidator:
    """
    Validates and classifies citizen messages to protect the recommendation engine
    from hallucinating schemes on irrelevant, random, or greeting inputs.
    """

    # Common greetings in Hindi and English
    GREETING_WORDS = {
        "hello", "hi", "hey", "namaste", "namaskar", "pranam", "ram ram", "radhe radhe",
        "good morning", "good afternoon", "good evening", "good night", "kya haal hai",
        "kaise ho", "how are you", "suno", "sunie", "help", "madad", "bhai", "sir"
    }

    # Unrelated topics (sports, movies, entertainment, casual chitchat, gaming, food)
    UNRELATED_KEYWORDS = [
        "cricket", "football", "badminton", "tennis", "hockey", "game", "match", "score",
        "movie", "film", "cinema", "song", "music", "dance", "actor", "actress",
        "pizza", "burger", "biryani", "ice cream", "chole bhature", "restaurant",
        "joke", "comedy", "weather", "rain", "barish", "dhoop", "garmi", "sardi",
        "car", "bike", "iphone", "mobile game", "pubg", "free fire", "instagram", "reels",
        "like playing", "like watching", "hobby", "shauk", "khelna pasand", "filmen dekhna"
    ]

    # Beneficiary intent indicators (words related to welfare, citizen status, needs, or government programs)
    WELFARE_KEYWORDS = [
        "farmer", "kisan", "kheti", "crop", "fasal", "beej", "khad", "tractor", "zamin", "land", "bigha", "acre",
        "pension", "vridha", "widow", "vidhwa", "divyang", "viklang", "disability", "disabled", "needy", "garib",
        "student", "chhatra", "vidyarthi", "scholarship", "chhatravritti", "padhai", "college", "school", "education",
        "unemployed", "berojgar", "job", "naukri", "rozgar", "skill", "training", "mudra", "loan", "rin", "artisan", "karigar",
        "business", "startup", "small business", "job training", "entrepreneur", "self-employed",
        "ration", "khadyann", "gehu", "chawal", "rashan", "bpl", "ayushman", "ilaj", "hospital", "dawa", "bimari", "doctor",
        "awas", "makan", "ghar", "housing", "pradhan mantri", "mukhyamantri", "yojana", "scheme", "subsidy", "anudan",
        "sahayata", "assistance", "sarkari", "labh", "benefit", "patrata", "eligibility", "shramik", "mazdoor", "worker",
        "daughter", "beti", "kanya", "sukanya", "pregnant", "garbhwati", "prasuti", "women", "mahila",
        # Application, portal, process, official website keywords
        "website", "web", "portal", "apply", "application", "form", "link", "details", "schemes", "list",
        "status", "process", "procedure", "documents", "checklist", "how to apply", "fees", "deadline", "registration",
        # Devanagari Hindi keywords
        "किसान", "खेती", "कृषि", "फसल", "बीज", "खाद", "ट्रैक्टर", "जमीन", "एकड़", "बीघा",
        "विधवा", "पेंशन", "वृद्धा", "दिव्यांग", "विकलांग", "गरीब", "जरूरतमंद",
        "छात्र", "छात्रा", "विद्यार्थी", "छात्रवृत्ति", "स्कॉलरशिप", "पढ़ाई", "कॉलेज", "स्कूल", "शिक्षा",
        "बेरोजगार", "नौकरी", "रोजगार", "कौशल", "ट्रेनिंग", "लोन", "ऋण", "कारीगर", "शिल्पकार",
        "राशन", "खाद्यान्न", "गेहूं", "चावल", "आयुष्मान", "इलाज", "अस्पताल", "दवा", "बीमारी",
        "आवास", "मकान", "घर", "प्रधानमंत्री", "मुख्यमंत्री", "योजना", "सब्सिडी", "अनुदान",
        "सहायता", "सरकारी", "लाभ", "पात्रता", "श्रमिक", "मजदूर", "कामगार",
        "बेटी", "कन्या", "सुकन्या", "गर्भवती", "महिला", "मृत्यु", "निधन", "स्वर्गवास", "पति", "पत्नी", "गुजर गए",
        # Devanagari application and portal keywords
        "वेबसाइट", "वेबसाईट", "पोर्टल", "आवेदन", "फॉर्म", "लिंक", "प्रक्रिया", "योजनाएं", "योजनाओं", "स्कीम",
        "सूची", "लिस्ट", "बताओ", "बताएं", "दिखाओ", "दिखाएं", "जानकारी", "विवरण", "दस्तावेज", "कागजात",
        "पात्रता", "शर्तें", "रजिस्ट्रेशन", "पंजीकरण", "आधिकारिक", "शुल्क", "फीस", "अंतिम तिथि"
    ]

    # Specific profile attribute markers (age, income, location, family)
    PROFILE_MARKERS = [
        r'\b\d{1,2}[-\s]*(?:years?|yrs?|saal|varsh|साल|वर्ष|old|उम्र)\b',
        r'^\s*(\d{1,2})\s*(?:साल|वर्ष|years?|yrs?|old|hai|h|का|की)?\s*$',
        r'\b(?:income|aay|kamai|aamdani|वार्षिक आय|आय|कमाता|कमाती)\b',
        r'\b(?:acre|एकड़|bigha|बीघा|hectare|हेक्टेयर)\b',
        r'^\s*(\d+(?:\.\d+)?)\s*(?:acres?|एकड़|bighas?|बीघा|hectares?|हेक्टेयर)?\s*$',
        r'\b(?:uttar pradesh|up|bihar|mp|madhya pradesh|delhi|rajasthan|haryana|maharashtra|उत्तर प्रदेश|बिहार|मध्य प्रदेश|राजस्थान)\b',
        r'\b(?:meerut|varanasi|lucknow|gorakhpur|prayagraj|kanpur|agra|bareilly|patna|gaya|मेरठ|वाराणसी|लखनऊ|आगरा|पटना)\b',
        r'\b(?:graduate|graduation|10th|12th|10वीं|12वीं|pass|degree|btech|ba|bsc|bcom|mcom|diploma|स्नातक|परास्नातक)\b',
        r'\b(?:unemployed|employed|farmer|student|labour|worker|daily-wage|businessman|artisan|tailor|बेरोजगार|किसान|छात्र|मजदूर|कारीगर|सिलाई)\b',
        r'\b(?:man|woman|male|female|unmarried|married|widow|widowed|divorced|पुरुष|महिला|विवाहित|अविवाहित|विधवा)\b'
    ]

    @classmethod
    def _is_gibberish(cls, text: str) -> bool:
        """
        Detects random keyboard walks, consonant clusters without vowels,
        repetitive characters, and meaningless strings.
        """
        cleaned = text.strip()
        if len(cleaned) < 3:
            return False

        lowered = cleaned.lower()

        # If user explicitly mentions welfare keywords or profile attributes,
        # never classify as gibberish
        if any(k in lowered for k in cls.WELFARE_KEYWORDS) or cls._has_profile_attributes(cleaned) > 0:
            return False

        # Common keyboard walks
        walks = ["asdf", "qwer", "zxcv", "jkl;", "1234", "abcd", "qwerty", "asdfgh"]
        if any(w in lowered for w in walks):
            # Check if majority of the text is just the walk
            for w in walks:
                if w in lowered and len(lowered) <= len(w) + 8:
                    return True

        # Check ratio of alphabetic characters that are vowels in English words (include 'y' as vowel)
        words = re.findall(r'[a-zA-Z]+', cleaned)
        if words:
            gibberish_words = 0
            checked_words = 0
            for word in words:
                if len(word) >= 5:
                    checked_words += 1
                    vowels = len(re.findall(r'[aeiouyAEIOUY]', word))
                    # Words with zero vowels or very low vowel ratio (e.g. "asdfghjkl", "xyzqwe")
                    if vowels == 0:
                        gibberish_words += 1
                    elif len(word) >= 7 and (vowels / len(word)) < 0.15:
                        gibberish_words += 1

            if checked_words > 0:
                # Flag if at least 50% of substantial words are gibberish, or short single-token gibberish
                if len(words) <= 2 and gibberish_words > 0:
                    return True
                if (gibberish_words / checked_words) >= 0.5:
                    return True

        # Check repeated characters (e.g. "aaaaaaa", "zzzzzz")
        if re.search(r'(.)\1{4,}', cleaned):
            return True

        # Check entropy/randomness of tokens
        tokens = cleaned.split()
        if len(tokens) == 1 and len(tokens[0]) > 10 and not any(k in lowered for k in cls.WELFARE_KEYWORDS):
            return True

        return False

    @classmethod
    def _is_greeting(cls, text: str) -> bool:
        """Checks if the message is purely a greeting."""
        lowered = text.strip().lower()
        # Remove punctuation
        no_punct = re.sub(r'[^\w\s]', '', lowered).strip()

        # Exact match greeting
        if no_punct in cls.GREETING_WORDS:
            return True

        # Matches phrases like "hello how are you", "namaste sir"
        tokens = no_punct.split()
        if len(tokens) <= 4:
            if all(t in cls.GREETING_WORDS for t in tokens):
                return True
            if tokens[0] in ["hello", "hi", "namaste", "pranam", "namaskar"] and ("how" in tokens or "kaise" in tokens or len(tokens) <= 2):
                return True

        return False

    @classmethod
    def _is_unrelated(cls, text: str) -> bool:
        """Checks if the user is discussing topics unrelated to government assistance."""
        lowered = text.lower()
        has_unrelated_topic = any(kw in lowered for kw in cls.UNRELATED_KEYWORDS)
        has_welfare_topic = any(kw in lowered for kw in cls.WELFARE_KEYWORDS)

        # If user explicitly talks about playing cricket/movies and mentions NO government/welfare words
        if has_unrelated_topic and not has_welfare_topic:
            return True

        # Casual queries like "who are you", "what can you do"
        casual_patterns = [
            r'^(?:who are you|tum kaun ho|aap kaun hain)\??$',
            r'^(?:what can you do|kya kar sakte ho|tum kya ho)\??$',
            r'^(?:tell me a joke|chutkula sunao)\??$'
        ]
        for cp in casual_patterns:
            if re.search(cp, lowered.strip()):
                return True

        return False

    @classmethod
    def _has_profile_attributes(cls, text: str) -> int:
        """Counts how many structured profile markers are present in the text."""
        count = 0
        lowered = text.lower()
        for pattern in cls.PROFILE_MARKERS:
            if re.search(pattern, lowered):
                count += 1
        return count

    @classmethod
    def classify(cls, user_input: str, existing_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Classifies user input and decides whether the recommendation pipeline
        is allowed to proceed.
        """
        raw_text = (user_input or "").strip()

        # 1. Empty or whitespace
        if not raw_text:
            return {
                "category": InputCategory.RANDOM_OR_GIBBERISH_TEXT,
                "is_valid": False,
                "can_search_schemes": False,
                "feedback_message_hi": "कृपया अपनी स्थिति या सरकारी सहायता की आवश्यकता के बारे में बताएं।",
                "feedback_message_en": "Please describe your situation or the government assistance you need.",
                "reason": "Empty input"
            }

        # 2. Check for Gibberish / Random Text
        if cls._is_gibberish(raw_text):
            return {
                "category": InputCategory.RANDOM_OR_GIBBERISH_TEXT,
                "is_valid": False,
                "can_search_schemes": False,
                "feedback_message_hi": "क्षमा करें, आपका संदेश समझ नहीं आया। कृपया अपनी स्थिति, आयु, पेशा या जिस सरकारी सहायता की आपको आवश्यकता है, उसे स्पष्ट शब्दों में बताएं।",
                "feedback_message_en": "Sorry, your message could not be understood. Please clearly describe your age, occupation, or the government assistance you need.",
                "reason": "Input matches random characters or gibberish patterns"
            }

        # 3. Check for Greeting (Only if no existing profile or single opening greeting)
        if cls._is_greeting(raw_text) and not (existing_profile and (existing_profile.get("state") or existing_profile.get("age"))):
            return {
                "category": InputCategory.GREETING,
                "is_valid": False,
                "can_search_schemes": False,
                "feedback_message_hi": "नमस्ते! मैं सरकारी साथी (Sarkari Saathi) हूँ। मैं केंद्र व राज्य सरकार की कल्याणकारी योजनाओं की सही पात्रता जाँचने में आपकी मदद करता हूँ। कृपया बताएं कि आप किस प्रकार की योजना या सहायता की तलाश में हैं? (जैसे- किसान योजना, छात्रवृत्ति, पेंशन, स्वरोजगार या राशन कार्ड)",
                "feedback_message_en": "Hello! I am Sarkari Saathi. I help citizens discover and verify eligibility for official government welfare schemes. Please let me know what assistance you need (e.g. farming, education, pension, self-employment, housing, healthcare).",
                "reason": "Message is a greeting"
            }

        # 4. Check for Unrelated Message (Explicit sports, entertainment, casual jokes)
        if cls._is_unrelated(raw_text):
            return {
                "category": InputCategory.UNRELATED_MESSAGE,
                "is_valid": False,
                "can_search_schemes": False,
                "feedback_message_hi": "सरकारी साथी केवल भारत सरकार और राज्य सरकारों की कल्याणकारी योजनाओं, छात्रवृत्ति, पेंशन और सब्सिडी की जानकारी के लिए है। कृपया अपनी सरकारी योजना से संबंधित आवश्यकता बताएं।",
                "feedback_message_en": "Sarkari Saathi is dedicated to assisting with government welfare schemes, scholarships, pensions, and subsidies. Please share details regarding your government assistance requirement.",
                "reason": "Message is unrelated to government assistance"
            }

        # 5. Check for Welfare Intent & Profile Density
        lowered = raw_text.lower()
        has_welfare_intent = any(kw in lowered for kw in cls.WELFARE_KEYWORDS)
        profile_attr_count = cls._has_profile_attributes(raw_text)

        # Contextual check: If existing profile has state/age/occupation, the user is answering follow-ups
        has_active_context = bool(
            existing_profile and (
                existing_profile.get("state") or
                existing_profile.get("age") or
                existing_profile.get("occupation") or
                existing_profile.get("district")
            )
        )

        # High-density beneficiary request: has welfare keywords AND at least 2 profile attributes
        # (e.g. "I am a 45-year-old farmer from Meerut, Uttar Pradesh with 75000 income and 1.5 acre land")
        if (has_welfare_intent and profile_attr_count >= 2) or profile_attr_count >= 3:
            return {
                "category": InputCategory.VALID_BENEFICIARY_REQUEST,
                "is_valid": True,
                "can_search_schemes": True,
                "feedback_message_hi": "आपकी स्थिति की विस्तृत जानकारी प्राप्त हुई है। हम आपकी पात्रता का आधिकारिक सत्यापन कर रहे हैं।",
                "feedback_message_en": "Beneficiary profile information received. Proceeding with official scheme eligibility analysis.",
                "reason": f"Sufficient beneficiary profile detected ({profile_attr_count} attributes matched)"
            }

        # If user has an active context and provides an attribute answer (e.g. age '45', '2 acre', city, or yes/no)
        # or asks about schemes/portals/apply:
        if has_active_context and (
            profile_attr_count >= 1 or
            has_welfare_intent or
            re.match(r'^\s*(\d{1,3})\s*(?:साल|वर्ष|years?|old|hai)?\s*$', raw_text, re.IGNORECASE) or
            re.match(r'^\s*(?:yes|no|haan|nahi|हाँ|नहीं|जी हाँ|जी नहीं)\b', raw_text, re.IGNORECASE)
        ):
            return {
                "category": InputCategory.VALID_BENEFICIARY_REQUEST if (existing_profile.get("state") and (existing_profile.get("age") or profile_attr_count >= 1)) else InputCategory.INCOMPLETE_BENEFICIARY_REQUEST,
                "is_valid": True,
                "can_search_schemes": True if (existing_profile.get("state") and (existing_profile.get("age") or re.match(r'^\s*\d{1,2}\s*$', raw_text))) else False,
                "feedback_message_hi": "आपकी जानकारी प्राप्त हुई है।",
                "feedback_message_en": "Your profile information was updated.",
                "reason": "Contextual answer provided for active welfare consultation"
            }

        # Incomplete beneficiary request: mentions intent or 1 attribute, but lacks critical fields
        # (e.g. "I am looking for government assistance for my education" or "I am a farmer")
        if has_welfare_intent or profile_attr_count >= 1 or any(w in lowered for w in ["help", "madad", "chahiye", "yojana", "scheme"]):
            return {
                "category": InputCategory.INCOMPLETE_BENEFICIARY_REQUEST,
                "is_valid": True,
                "can_search_schemes": False,  # MUST ask follow-up questions before searching!
                "feedback_message_hi": "आपकी आवश्यकता समझ आ गई है, लेकिन सही योजना ढूँढने के लिए कुछ महत्वपूर्ण जानकारियाँ आवश्यक हैं।",
                "feedback_message_en": "Your assistance need was recognized, but critical profile details are needed before evaluating schemes.",
                "reason": "Beneficiary intent detected but insufficient parameters to evaluate eligibility"
            }

        # Fallback: if message is long enough but contains no welfare words
        return {
            "category": InputCategory.UNRELATED_MESSAGE,
            "is_valid": False,
            "can_search_schemes": False,
            "feedback_message_hi": "कृपया अपनी सरकारी सहायता से जुड़ी आवश्यकता बताएं (जैसे- आपकी आयु, पेशा, राज्य और किस प्रकार की योजना चाहिए)।",
            "feedback_message_en": "Please provide details relevant to government welfare assistance (such as age, occupation, state, and specific need).",
            "reason": "No welfare intent or citizen profile attributes found"
        }


input_validator = InputValidator()
