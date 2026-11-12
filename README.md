# Sarkari Saathi (सरकारी साथी)
### सरकारी योजनाओं का लाभ, अब हर किसी के साथ • बोलिए, जानिए, पाइए अपना हक!

> **Sarkari Saathi** is an AI-powered, Hindi-first government scheme discovery and assistance platform built specifically for Indian citizens—especially rural citizens, elderly people, farmers, women, and those with limited digital literacy.

---

## 📸 UI/UX Design Reference

The application recreates the 9 mobile screens shown in the reference design:

1. **होम (Home Screen):** Sarkari Saathi crest header, greeting "नमस्ते! आज हम आपकी मदद कैसे कर सकते हैं?", large animated central microphone button ("बोलकर शुरू करें"), "लिखकर बताएं" shortcut, and 4 quick option cards (*मेरी योजनाएँ*, *दस्तावेज़ चेकलिस्ट*, *आवेदन की जानकारी*, *परिवार की जानकारी*).
2. **AI सहायक (AI Voice Assistant):** Empathetic Hindi conversation powered by Google Gemini, friendly 3D robot mascot, chat bubbles, animated audio waveform, large microphone recording control, text input fallback, and browser Web Speech audio synthesis.
3. **प्रोफ़ाइल (Profile Creation):** Structured personal form with 3/5 progress bar, Devanagari typography, personal details (*नाम, उम्र, राज्य, ज़िला, पेशा, वार्षिक आय*), and data protection consent badge.
4. **मिली योजनाएँ (Government Scheme Results):** Category pills (*योग्य*, *संभावित*, *योग्य नहीं*), scheme benefit cards (*विधवा पेंशन योजना*, *पीएम-किसान*, *उज्ज्वला*, *आयुष्मान भारत*), and reason for matching.
5. **योजना जानकारी (Scheme Details):** Beneficiary overview, monthly/annual financial benefits, eligibility criteria, matching reason, required documents list, official portal link, and disclaimer.
6. **दस्तावेज़ चेकलिस्ट (Personalized Document Checklist):** Circular completion gauge (*4/6 पूर्ण*), document availability toggles (*उपलब्ध / आवश्यक*), how-to-get guidance for missing documents, and PDF checklist download (*jsPDF*).
7. **आवेदन प्रक्रिया (Application Process):** 5-step numbered roadmap, interactive Common Service Center (CSC) locator with Varanasi VLE operator contacts & phone numbers, and official portal links.
8. **मेरा परिवार (Family Profile):** Member management cards (*सीता देवी - मुख्य सदस्य*, *राम कुमार - पुत्र*), "+ सदस्य जोड़ें" modal, and family-based scheme discovery.
9. **मेरा डैशबोर्ड (User Dashboard):** Profile card, eligible schemes counter, 2x2 action grid (*दस्तावेज़ चेकलिस्ट*, *आवेदन इतिहास*, *भाषा बदलें*, *सहायता केंद्र*), and toll-free helpline directory.

---

## 🛠️ Mandatory Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Noto Sans Devanagari
- **Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic v2
- **AI & Conversation:** Google Gemini (`gemini-2.5-flash`) via FastAPI backend with Hindi NLU fallback engine
- **Voice Services:**
  - Speech-to-Text: Bhashini ASR / OpenAI Whisper / Web Speech Recognition
  - Text-to-Speech: Bhashini TTS / Native Web Speech API Hindi Voice
- **Deterministic Rule Engine:** Python Rule Engine (`evaluator.py`, `conditions.py`) — evaluates age, gender, marital status, state, district, occupation, income, and landholding without AI hallucination
- **Database:** Supabase PostgreSQL (`schema.sql` and `seed.sql`) with seamless local in-memory fallback
- **Export & Documents:** Client-side PDF generation (`jspdf`) for official printable document checklists
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint
│   │   ├── config.py                   # App configuration & environment variables
│   │   ├── database.py                 # Data store (Supabase + In-Memory fallback)
│   │   ├── rule_engine/
│   │   │   ├── conditions.py           # Atomic rule condition evaluators
│   │   │   └── evaluator.py            # Deterministic rule engine
│   │   ├── routers/
│   │   │   ├── auth.py                 # Authentication & demo session
│   │   │   ├── conversation.py         # AI dialogue endpoint
│   │   │   ├── voice.py                # Audio transcription & TTS
│   │   │   ├── profile.py              # Profile & family member CRUD
│   │   │   ├── schemes.py              # Scheme catalog
│   │   │   ├── eligibility.py          # Rule engine evaluation endpoint
│   │   │   ├── documents.py            # Personalized checklist
│   │   │   └── applications.py         # Application tracking
│   │   ├── services/
│   │   │   ├── gemini_service.py       # Gemini API & Hindi conversational NLU
│   │   │   ├── speech_service.py       # Modular STT (Bhashini/Whisper)
│   │   │   ├── tts_service.py          # Modular TTS
│   │   │   ├── eligibility_service.py  # Scheme evaluation service
│   │   │   └── document_service.py     # Checklist generator & guidance
│   │   └── schemas/                    # Pydantic request/response schemas
│   ├── tests/
│   │   ├── test_rule_engine.py         # Unit tests for rule evaluator
│   │   └── test_api_endpoints.py       # Integration tests for REST endpoints
│   ├── schema.sql                      # Supabase PostgreSQL schema
│   ├── seed.sql                        # Verified seed data (10 real schemes & demo persona)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── globals.css                 # Tailwind & Noto Sans Devanagari typography
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Multi-screen mobile viewport + desktop showcase
│   ├── components/
│   │   ├── common/Avatars.tsx          # Ashoka emblem, Robot mascot, Seeta Devi, Ram Kumar
│   │   ├── navigation/BottomNav.tsx    # 5-item bottom bar with central elevated mic
│   │   └── screens/
│   │       ├── ScreenHome.tsx          # Screen 1: Home
│   │       ├── ScreenAssistant.tsx     # Screen 2: AI Voice Assistant
│   │       ├── ScreenProfile.tsx       # Screen 3: Profile Creation
│   │       ├── ScreenSchemes.tsx       # Screen 4: Scheme Results
│   │       ├── ScreenSchemeDetails.tsx # Screen 5: Scheme Details
│   │       ├── ScreenDocuments.tsx     # Screen 6: Document Checklist
│   │       ├── ScreenApplicationProcess.tsx # Screen 7: Application Process & CSC Locator
│   │       ├── ScreenFamily.tsx        # Screen 8: Family Profile
│   │       ├── ScreenDashboard.tsx     # Screen 9: User Dashboard
│   │       └── ScreenApplications.tsx  # Application Tracker
│   ├── lib/
│   │   └── api.ts                      # Frontend API client
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── render.yaml                         # Render deployment specification
├── vercel.json                         # Vercel deployment specification
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment and activate
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# (Optional) Add your GEMINI_API_KEY from https://aistudio.google.com

# Run automated tests
pytest tests/

# Start FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 👩‍🌾 Demo Persona: Sita Devi (सीता देवी)

- **Name:** सीता देवी
- **Age:** 52 वर्ष
- **Location:** पिंडरा, वाराणसी, उत्तर प्रदेश
- **Marital Status:** विधवा
- **Occupation:** किसान परिवार (खेती की विधवा)
- **Landholding:** 0.8 एकड़
- **Annual Family Income:** ₹45,000
- **Family:** पुत्र राम कुमार (उम्र 28 वर्ष, किसान)

### Matched Government Schemes:
1. **विधवा पेंशन योजना (उत्तर प्रदेश सरकार):** ₹1,000 प्रतिमाह (वार्षिक ₹12,000)
2. **प्रधानमंत्री किसान सम्मान निधि (PM-KISAN):** ₹6,000 वार्षिक (3 किस्तों में)
3. **आयुष्मान भारत (PM-JAY):** ₹5 लाख तक का सालाना कैशलेस स्वास्थ्य सुरक्षा कवर
4. **प्रधानमंत्री उज्ज्वला योजना 2.0:** मुफ्त गैस कनेक्शन और पहला रिफिल

---

## 🌐 Deployment Instructions

### Frontend on Vercel
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), import the repository.
3. Set the **Root Directory** to `frontend`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g. `https://sarkari-saathi-backend.onrender.com/api`).
5. Click **Deploy**.

### Backend on Render
1. In [Render](https://render.com), create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `GEMINI_API_KEY`: Your Gemini API Key
   - `DEMO_MODE`: `true`
5. Click **Create Web Service**.

---

## 🔒 Security & Privacy Notice
- Sarkari Saathi strictly adheres to minimal data collection.
- No Aadhaar numbers, OTPs, bank passwords, or biometric credentials are ever requested or stored.
- All eligibility calculations are processed deterministically on the server via verifiable government eligibility criteria.

