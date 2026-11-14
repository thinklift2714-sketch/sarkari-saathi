"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Mic,
  CheckCircle2,
  FileText,
  Search,
  BookOpen,
  Upload,
  ClipboardList,
  Globe,
  Smartphone,
  Users,
  IndianRupee,
  Landmark,
  MapPin,
  Star,
  ArrowRight,
  AlertCircle,
  Info,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Language } from "@/lib/translations";

interface ScreenAppGuideProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

// ── Guide Data ──────────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    id: 1,
    icon: Mic,
    color: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800/60",
    title_hi: "AI सहायक से बात करें",
    title_en: "Talk to the AI Assistant",
    desc_hi: "होम स्क्रीन पर 'आवाज़ में पूछें' बटन दबाएं और हिंदी में अपनी स्थिति बताएं — जैसे आपकी उम्र, पेशा, परिवार, आय और राज्य।",
    desc_en: "Tap 'Ask by Voice' on the Home screen and describe your situation in Hindi — your age, occupation, family, income and state.",
    tip_hi: "💡 उदाहरण: 'मैं 45 साल की विधवा महिला हूं, उत्तर प्रदेश से, मेरी आय ₹2000 प्रति माह है।'",
    tip_en: "💡 Example: 'I am a 45-year-old widow from Uttar Pradesh, with ₹2000/month income.'",
    action_hi: "AI सहायक खोलें",
    action_en: "Open AI Assistant",
    screen: "assistant",
  },
  {
    id: 2,
    icon: Search,
    color: "bg-blue-100 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA]",
    border: "border-blue-200 dark:border-blue-800/60",
    title_hi: "AI पात्रता विश्लेषण",
    title_en: "AI Eligibility Analysis",
    desc_hi: "AI आपकी स्थिति का विश्लेषण करके 100+ केंद्र और राज्य सरकार की योजनाओं से आपके लिए पात्र योजनाएं ढूंढता है।",
    desc_en: "AI analyses your situation and finds eligible schemes from 100+ central and state government schemes.",
    tip_hi: "💡 यह प्रक्रिया 10-20 सेकंड में पूरी होती है।",
    tip_en: "💡 This process completes in 10-20 seconds.",
    action_hi: "विश्लेषण शुरू करें",
    action_en: "Start Analysis",
    screen: "analysis",
  },
  {
    id: 3,
    icon: CheckCircle2,
    color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    title_hi: "पात्र योजनाएं देखें",
    title_en: "View Eligible Schemes",
    desc_hi: "'योजनाएं' टैब में जाएं। केवल आपके लिए पात्र योजनाएं दिखती हैं। हर योजना में लाभ राशि, कारण और आधिकारिक पोर्टल की जानकारी होती है।",
    desc_en: "Go to the 'Schemes' tab. Only your eligible schemes appear. Each scheme shows benefit amount, reason for eligibility, and official portal.",
    tip_hi: "💡 'सहेजें' बटन दबाकर पसंदीदा योजनाएं सहेज सकते हैं।",
    tip_en: "💡 Tap 'Save' to bookmark your preferred schemes.",
    action_hi: "योजनाएं देखें",
    action_en: "View Schemes",
    screen: "schemes",
  },
  {
    id: 4,
    icon: FileText,
    color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    title_hi: "दस्तावेज़ चेकलिस्ट तैयार करें",
    title_en: "Prepare Document Checklist",
    desc_hi: "'दस्तावेज़ चेकलिस्ट' पर जाएं। आवेदन के लिए जरूरी दस्तावेजों की सूची मिलती है। हर दस्तावेज़ के सामने 'अपलोड' करके फोटो/PDF जोड़ें।",
    desc_en: "Go to 'Document Checklist'. You get the required documents list. Tap 'Upload' next to each document to add photo/PDF from your device.",
    tip_hi: "💡 आधार, बैंक पासबुक, आय प्रमाण — ये सबसे जरूरी दस्तावेज होते हैं।",
    tip_en: "💡 Aadhaar, Bank Passbook, Income Certificate — these are the most important documents.",
    action_hi: "चेकलिस्ट देखें",
    action_en: "View Checklist",
    screen: "documents",
  },
  {
    id: 5,
    icon: ClipboardList,
    color: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800/60",
    title_hi: "आवेदन प्रक्रिया पढ़ें",
    title_en: "Read Application Process",
    desc_hi: "योजना के विस्तृत विवरण में 'आवेदन प्रक्रिया' देखें। ऑनलाइन और ऑफलाइन दोनों विकल्पों की चरण-दर-चरण जानकारी मिलती है।",
    desc_en: "In scheme details, check 'Application Process'. You get step-by-step guide for both online and offline application options.",
    tip_hi: "💡 ज्यादातर योजनाओं में CSC केंद्र से मदद ली जा सकती है।",
    tip_en: "💡 For most schemes, you can get help from your nearest CSC center.",
    action_hi: "आवेदन प्रक्रिया देखें",
    action_en: "View Process",
    screen: "process",
  },
  {
    id: 6,
    icon: Globe,
    color: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800/60",
    title_hi: "आधिकारिक पोर्टल पर आवेदन करें",
    title_en: "Apply on Official Portal",
    desc_hi: "योजना के आधिकारिक सरकारी पोर्टल पर जाएं और ऑनलाइन फॉर्म भरें। या नजदीकी जन सेवा केंद्र (CSC) पर जाकर ऑफलाइन आवेदन करें।",
    desc_en: "Visit the scheme's official government portal and fill the online form. Or go to your nearest Jan Seva Kendra (CSC) for offline application.",
    tip_hi: "💡 आवेदन के बाद आपको रसीद या संदर्भ संख्या मिलती है — इसे संभाल कर रखें।",
    tip_en: "💡 After applying, you receive a receipt or reference number — keep it safe.",
    action_hi: null,
    action_en: null,
    screen: null,
  },
];

const KEY_DOCUMENTS = [
  { hi: "आधार कार्ड", en: "Aadhaar Card", icon: "🪪" },
  { hi: "बैंक पासबुक / खाता नंबर", en: "Bank Passbook / Account Number", icon: "🏦" },
  { hi: "आय प्रमाण पत्र", en: "Income Certificate", icon: "📄" },
  { hi: "निवास प्रमाण पत्र", en: "Residence Certificate", icon: "🏠" },
  { hi: "जाति प्रमाण पत्र (यदि लागू)", en: "Caste Certificate (if applicable)", icon: "📋" },
  { hi: "पासपोर्ट आकार का फोटो", en: "Passport Size Photo", icon: "📷" },
  { hi: "मोबाइल नंबर (आधार से लिंक)", en: "Mobile No. (linked with Aadhaar)", icon: "📱" },
];

const HELPLINES = [
  { label_hi: "PM Kisan हेल्पलाइन", label_en: "PM Kisan Helpline", number: "155261" },
  { label_hi: "जन सेवा केंद्र (CSC)", label_en: "Jan Seva Kendra (CSC)", number: "14499" },
  { label_hi: "सामाजिक सुरक्षा (UP)", label_en: "Social Security (UP)", number: "1800-180-5131" },
  { label_hi: "PMAY आवास योजना", label_en: "PMAY Housing Scheme", number: "1800-11-6446" },
];

export function ScreenAppGuide({ onNavigate, language = "hi" }: ScreenAppGuideProps) {
  const [openStep, setOpenStep] = useState<number | null>(1);

  const isHi = language === "hi";

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">

      {/* Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">
            {isHi ? "आवेदन गाइड" : "Application Guide"}
          </span>
        </button>
        <span className="text-xs bg-white/20 border border-white/10 px-2.5 py-0.5 rounded-full font-semibold">
          {isHi ? "चरण-दर-चरण" : "Step-by-Step"}
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5 pb-24 overscroll-contain">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0645A8] to-[#1671E8] dark:from-[#1D2D43] dark:to-[#111C2E] text-white rounded-2xl p-4 shadow-lg border border-blue-700/30 dark:border-[#2B3A50]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">
                {isHi ? "सरकारी योजना के लिए आवेदन कैसे करें?" : "How to Apply for a Government Scheme?"}
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                {isHi ? "6 आसान चरणों में सम्पूर्ण मार्गदर्शन" : "Complete guidance in 6 easy steps"}
              </p>
            </div>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            {isHi
              ? "सरकारी साथी आपको AI की मदद से सही योजना खोजने से लेकर आवेदन पूरा करने तक हर कदम पर मदद करता है।"
              : "Sarkari Saathi helps you at every step — from finding the right scheme with AI to completing your application."}
          </p>
        </div>

        {/* Step-by-Step Accordion */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-3">
            {isHi ? "चरणबद्ध प्रक्रिया" : "Step-by-Step Process"}
          </h3>

          {/* Vertical connector line */}
          <div className="relative">
            <div className="absolute left-[22px] top-5 bottom-5 w-0.5 bg-blue-100 dark:bg-[#2B3A50] z-0" />

            <div className="space-y-3 relative z-10">
              {GUIDE_STEPS.map((step) => {
                const Icon = step.icon;
                const isOpen = openStep === step.id;

                return (
                  <div key={step.id} className={`bg-white dark:bg-[#172438] rounded-2xl border shadow-card transition-all ${isOpen ? step.border : "border-slate-200 dark:border-[#2B3A50]"}`}>
                    {/* Step Header — always visible */}
                    <button
                      onClick={() => setOpenStep(isOpen ? null : step.id)}
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm border-2 border-white dark:border-[#0B1220] shadow-sm ${step.color}`}>
                        {step.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-snug truncate">
                          {isHi ? step.title_hi : step.title_en}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isOpen ? "bg-[#0645A8] text-white" : "bg-slate-100 dark:bg-[#1D2D43] text-slate-500"}`}>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-[#2B3A50] pt-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed flex-1">
                            {isHi ? step.desc_hi : step.desc_en}
                          </p>
                        </div>

                        {/* Tip box */}
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                            {isHi ? step.tip_hi : step.tip_en}
                          </p>
                        </div>

                        {/* Action button */}
                        {step.screen && (
                          <button
                            onClick={() => onNavigate(step.screen!)}
                            className="w-full py-2.5 bg-[#0645A8] dark:bg-[#1671E8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                          >
                            <span>{isHi ? step.action_hi : step.action_en}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key Documents Section */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-3">
            {isHi ? "आमतौर पर जरूरी दस्तावेज़" : "Commonly Required Documents"}
          </h3>
          <div className="bg-white dark:bg-[#172438] rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-card divide-y divide-slate-100 dark:divide-[#2B3A50]">
            {KEY_DOCUMENTS.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl flex-shrink-0">{doc.icon}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  {isHi ? doc.hi : doc.en}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            {isHi
              ? "योजना के अनुसार दस्तावेज़ बदल सकते हैं। सटीक सूची के लिए योजना की चेकलिस्ट देखें।"
              : "Documents may vary by scheme. Check the scheme's checklist for the exact list."}
          </p>
        </div>

        {/* Online vs Offline */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-3">
            {isHi ? "आवेदन के तरीके" : "Ways to Apply"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Online */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/60 rounded-xl flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#0645A8] dark:text-[#60A5FA]" />
                </div>
                <span className="text-xs font-extrabold text-[#0645A8] dark:text-[#60A5FA]">
                  {isHi ? "ऑनलाइन" : "Online"}
                </span>
              </div>
              <ul className="text-[11px] text-slate-700 dark:text-[#AAB8CC] space-y-1 leading-relaxed">
                <li>• {isHi ? "आधिकारिक पोर्टल पर जाएं" : "Visit official portal"}</li>
                <li>• {isHi ? "रजिस्ट्रेशन / लॉगिन करें" : "Register / Login"}</li>
                <li>• {isHi ? "फॉर्म भरें व दस्तावेज़ अपलोड करें" : "Fill form & upload docs"}</li>
                <li>• {isHi ? "रसीद डाउनलोड करें" : "Download receipt"}</li>
              </ul>
            </div>

            {/* Offline / CSC */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/60 rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                  {isHi ? "CSC केंद्र" : "CSC Center"}
                </span>
              </div>
              <ul className="text-[11px] text-slate-700 dark:text-[#AAB8CC] space-y-1 leading-relaxed">
                <li>• {isHi ? "नजदीकी CSC खोजें" : "Find nearest CSC"}</li>
                <li>• {isHi ? "दस्तावेज़ लेकर जाएं" : "Carry your documents"}</li>
                <li>• {isHi ? "VLE से फॉर्म भरवाएं" : "Get form filled by VLE"}</li>
                <li>• {isHi ? "शुल्क: ₹30-50 मात्र" : "Fee: ₹30-50 only"}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Important Tips */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-3">
            {isHi ? "महत्वपूर्ण सुझाव" : "Important Tips"}
          </h3>
          <div className="space-y-2.5">
            {[
              {
                hi: "आवेदन करने से पहले सभी दस्तावेज़ की फोटोकॉपी तैयार रखें।",
                en: "Keep photocopies of all documents ready before applying.",
                icon: "📋",
              },
              {
                hi: "बैंक खाता आधार से लिंक होना अनिवार्य है — लाभ सीधे खाते में आता है।",
                en: "Bank account must be linked with Aadhaar — benefits are transferred directly.",
                icon: "🏦",
              },
              {
                hi: "आवेदन की रसीद और संदर्भ संख्या सुरक्षित रखें।",
                en: "Keep the application receipt and reference number safe.",
                icon: "🗂️",
              },
              {
                hi: "किसी दलाल या बिचौलिये से सावधान रहें — सरकारी योजनाएं मुफ्त होती हैं।",
                en: "Beware of agents or middlemen — government schemes are free.",
                icon: "⚠️",
              },
              {
                hi: "समय सीमा के भीतर आवेदन करें — कुछ योजनाओं की अंतिम तिथि होती है।",
                en: "Apply within the deadline — some schemes have a closing date.",
                icon: "📅",
              },
            ].map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] rounded-xl px-3.5 py-3 shadow-sm"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                <p className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                  {isHi ? tip.hi : tip.en}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Helplines */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-3">
            {isHi ? "सरकारी हेल्पलाइन नंबर" : "Government Helplines"}
          </h3>
          <div className="bg-white dark:bg-[#172438] rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-card divide-y divide-slate-100 dark:divide-[#2B3A50]">
            {HELPLINES.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  {isHi ? h.label_hi : h.label_en}
                </span>
                <a
                  href={`tel:${h.number}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/60"
                >
                  <Phone className="w-3 h-3" />
                  {h.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA: Start Now */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-center space-y-3">
          <Star className="w-8 h-8 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-[#F8FAFC]">
              {isHi ? "अभी शुरू करें!" : "Start Now!"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#AAB8CC] mt-1">
              {isHi
                ? "AI सहायक से बात करें और 2 मिनट में पता करें कि आप किन योजनाओं के पात्र हैं।"
                : "Talk to the AI Assistant and find out in 2 minutes which schemes you are eligible for."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("assistant")}
            className="w-full py-3 bg-[#16A34A] dark:bg-[#34D399] text-white dark:text-[#0B1220] text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <Mic className="w-4 h-4" />
            {isHi ? "AI सहायक से बात करें" : "Talk to AI Assistant"}
          </button>
        </div>

      </div>
    </div>
  );
}
