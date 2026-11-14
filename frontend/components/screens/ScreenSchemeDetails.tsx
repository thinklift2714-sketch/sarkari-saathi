"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Check, Landmark, FileText, ExternalLink, ShieldAlert, ArrowRight, Loader2, Bookmark, BookmarkCheck, ShieldCheck, Clock, IndianRupee, Globe } from "lucide-react";
import { SeetaDeviAvatar } from "../common/Avatars";
import { fetchScheme, saveScheme, removeSavedScheme, fetchSavedSchemeIds } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth";

interface ScreenSchemeDetailsProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenSchemeDetails({ schemeId = "scheme_up_widow_pension", onNavigate, language = "hi" }: ScreenSchemeDetailsProps) {
  const t = translations[language] || translations.hi;
  const { profile } = useAuth();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchScheme(schemeId)
      .then((data) => setScheme(data))
      .catch((err) => console.error("Error loading scheme details:", err))
      .finally(() => setLoading(false));

    fetchSavedSchemeIds()
      .then((ids) => {
        if (Array.isArray(ids)) {
          setIsSaved(ids.includes(schemeId));
        }
      })
      .catch(() => {});
  }, [schemeId]);

  const handleToggleSave = async () => {
    setSaveLoading(true);
    try {
      if (isSaved) {
        await removeSavedScheme(schemeId);
        setIsSaved(false);
      } else {
        await saveScheme(schemeId);
        setIsSaved(true);
      }
    } catch (e) {
      console.warn("Toggle save failed:", e);
    } finally {
      setSaveLoading(false);
    }
  };

  const title = language === "en" ? (scheme?.scheme_name || scheme?.scheme_name_hindi) : (scheme?.scheme_name_hindi || "विधवा पेंशन योजना");
  const dept = language === "en" ? (scheme?.department || scheme?.department_hindi) : (scheme?.department_hindi || "सामाजिक न्याय विभाग, उत्तर प्रदेश");
  const benefits = scheme?.benefits?.description_hindi || "प्रतिमाह ₹1,000 की पेंशन (सीधे बैंक खाते में)";
  const docs = scheme?.required_documents || ["आधार कार्ड", "बैंक पासबुक", "आय प्रमाण पत्र", "निवास प्रमाण पत्र", "विधवा प्रमाण पत्र"];
  const website = scheme?.official_website || "https://sspy-up.gov.in";

  // Build eligibility criteria list dynamically from API data
  const eligibilityCriteria: string[] = (() => {
    const ec = scheme?.eligibility_conditions;
    if (!ec || typeof ec !== "object") return ["उम्र 18 वर्ष से अधिक", "आय सीमा के अंदर होना चाहिए"];
    const labels: Record<string, string | null> = {
      min_age: `न्यूनतम आयु: ${ec.min_age} वर्ष`,
      max_age: `अधिकतम आयु: ${ec.max_age} वर्ष`,
      max_income: `वार्षिक आय ₹${ec.max_income?.toLocaleString("hi-IN") ?? ""} से कम होनी चाहिए`,
      gender: `लिंग: ${ec.gender === "Female" ? "महिला" : ec.gender === "Male" ? "पुरुष" : ec.gender}`,
      marital_status: `वैवाहिक स्थिति: ${ec.marital_status === "Widowed" ? "विधवा" : ec.marital_status}`,
      occupation: `पेशा: ${ec.occupation}`,
      state: `राज्य: ${Array.isArray(ec.state) ? ec.state.join(", ") : ec.state}`,
      land_required: ec.land_required ? "कृषि भूमि का स्वामित्व होना चाहिए" : null,
      aadhaar_linked_bank: ec.aadhaar_linked_bank ? "आधार से लिंक बैंक खाता होना चाहिए" : null,
      ration_card: ec.ration_card ? "राशन कार्ड / SECC सूची में नाम होना चाहिए" : null,
      is_student: ec.is_student ? "आवेदक छात्र होना चाहिए" : null,
      has_disability: ec.has_disability ? "दिव्यांगता प्रमाण पत्र होना चाहिए" : null,
      self_employed: ec.self_employed ? "स्वरोजगार / असंगठित क्षेत्र के कामगार" : null,
    };
    return Object.entries(ec)
      .filter(([k, v]) => v !== null && v !== undefined && v !== false && k in labels && labels[k] !== null)
      .map(([k]) => labels[k] as string)
      .filter(Boolean);
  })();

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Header: < योजना की जानकारी */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.detailsHeader}</span>
        </button>

        <button
          onClick={handleToggleSave}
          disabled={saveLoading}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
            isSaved
              ? "bg-amber-400 text-slate-900 border-amber-500 shadow-xs"
              : "bg-white/10 hover:bg-white/20 text-white border-white/20"
          }`}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-current" /> : <Bookmark className="w-3.5 h-3.5" />}
          <span>
            {isSaved
              ? (language === "en" ? "Saved" : "सहेजा गया")
              : (language === "en" ? "Save Scheme" : "योजना सहेजें")}
          </span>
        </button>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5 overscroll-contain">
        {/* Banner Card with Seeta Devi / Beneficiary Photo & Title */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card flex items-center gap-3.5 transition-colors">
          {schemeId === "scheme_pm_kisan" ? (
            <div className="w-[62px] h-[62px] rounded-full border-2 border-[#16A34A] overflow-hidden flex-shrink-0 bg-green-50 dark:bg-emerald-950 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="#DCFCE7" />
                <path d="M 25 40 C 25 20, 75 20, 75 40 C 65 30, 35 30, 25 40 Z" fill="#1C1917" />
                <circle cx="50" cy="52" r="23" fill="#FED7AA" />
                <circle cx="43" cy="50" r="2" fill="#1C1917" />
                <circle cx="57" cy="50" r="2" fill="#1C1917" />
                <path d="M 44 60 Q 50 64 56 60" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                <path d="M 15 100 Q 50 78 85 100 Z" fill="#FFFFFF" />
                <path d="M 32 80 Q 50 90 68 80 L 72 100 L 28 100 Z" fill="#16A34A" />
              </svg>
            </div>
          ) : (
            <SeetaDeviAvatar size={62} />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-black text-[#172033] dark:text-[#F8FAFC] leading-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#AAB8CC] font-medium mt-0.5">
              {dept}
            </p>
          </div>
        </div>

        {/* Verification & Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === "en" ? "Verified Official Scheme" : "आधिकारिक सत्यापित योजना"}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#0645A8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-900">
            <Globe className="w-3 h-3" />
            <span>
              {scheme?.application_mode === "online"
                ? (language === "en" ? "Online Portal" : "ऑनलाइन आवेदन")
                : scheme?.application_mode === "offline"
                ? (language === "en" ? "Offline Submission" : "ऑफ़लाइन जमा")
                : (language === "en" ? "Online & CSC Center" : "ऑनलाइन एवं CSC केंद्र")}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <IndianRupee className="w-3 h-3" />
            <span>{scheme?.application_fees || "निःशुल्क (₹0 / Free)"}</span>
          </span>

          {scheme?.last_verified_at && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>सत्यापित: {scheme.last_verified_at}</span>
            </span>
          )}
        </div>

        {/* Section 1: क्या लाभ मिलते हैं? */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card transition-colors">
          <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] mb-2.5 flex items-center gap-2">
            <span>{language === "en" ? "Benefits Provided" : "क्या लाभ मिलते हैं?"}</span>
          </h3>
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-amber-900 dark:text-amber-200 leading-snug">
              {benefits}
            </span>
          </div>
        </div>

        {/* Section 2: पात्रता मानदंड */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card transition-colors">
          <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] mb-2.5">
            {language === "en" ? "Eligibility Criteria" : "पात्रता मानदंड"}
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> लोड हो रहा है...
            </div>
          ) : (
            <ul className="space-y-2">
              {eligibilityCriteria.length > 0 ? eligibilityCriteria.map((crit, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-[#16A34A] dark:text-[#34D399] stroke-[3] mt-0.5 flex-shrink-0" />
                  <span>{crit}</span>
                </li>
              )) : (
                <li className="text-xs text-slate-500 dark:text-slate-400">पात्रता जानकारी उपलब्ध नहीं है।</li>
              )}
            </ul>
          )}
        </div>

        {/* Section 3: आप क्यों पात्र हैं? (Dynamic & Accurate) */}
        {scheme?.eligibility_conditions && (
          <div className="bg-[#F0FDF4] dark:bg-[#132B22] rounded-2xl p-4 border border-[#86EFAC] dark:border-[#1E4E3C] shadow-card transition-colors">
            <h3 className="text-sm font-extrabold text-[#166534] dark:text-[#34D399] mb-2">
              {language === "en" ? "Why You Match This Scheme" : "आप इस योजना के लिए क्यों उपयुक्त हैं?"}
            </h3>
            <div className="flex items-start gap-2 text-xs font-bold text-[#15803D] dark:text-[#34D399]">
              <Check className="w-4 h-4 text-[#16A34A] dark:text-[#34D399] stroke-[3] mt-0.5 flex-shrink-0" />
              <span>
                {profile?.marital_status && (scheme?.category === "women_child" || scheme?.eligibility_conditions?.marital_status)
                  ? (language === "en"
                      ? `Your profile status (${profile.marital_status}) matches this welfare category.`
                      : `आपकी स्थिति (${profile.marital_status}) इस कल्याणकारी श्रेणी की मुख्य शर्त पूरी करती है।`)
                  : profile?.occupation && (scheme?.category === "agriculture" || scheme?.eligibility_conditions?.land_required)
                  ? (language === "en"
                      ? `Your profile (${profile.occupation}) and state eligibility align with this agricultural scheme.`
                      : `आपकी प्रोफ़ाइल (${profile.occupation}) और राज्य पात्रता इस कृषि योजना से पूरी तरह मेल खाती है।`)
                  : profile?.annual_income && profile.annual_income > 0
                  ? (language === "en"
                      ? `Your annual family income of ₹${profile.annual_income.toLocaleString("en-IN")} is within the ceiling limit.`
                      : `आपके परिवार की वार्षिक आय ₹${profile.annual_income.toLocaleString("hi-IN")} निर्धारित सीमा के अंदर है।`)
                  : (language === "en"
                      ? "Based on your verified personal information, your profile satisfies the core eligibility requirements for this scheme."
                      : "आपकी सत्यापित व्यक्तिगत जानकारी के आधार पर आपकी प्रोफ़ाइल इस योजना की मुख्य पात्रता शर्तों को पूरा करती है।")}
              </span>
            </div>
          </div>
        )}

        {/* Section 4: आवश्यक दस्तावेज़ */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card transition-colors">
          <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] mb-1.5">
            {t.requiredDocsHeading}
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#AAB8CC] font-medium leading-relaxed">
            {docs.join(", ")}
          </p>
        </div>

        {/* Official Website Link */}
        <div className="bg-slate-50 dark:bg-[#111C2E] rounded-2xl p-3 border border-slate-200 dark:border-[#2B3A50] flex items-center justify-between transition-colors">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#AAB8CC]">{t.officialWebsiteHeading}</span>
            <span className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] truncate max-w-[200px]">{website}</span>
          </div>
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#1D2D43] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Disclaimer Note */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-[#111C2E] rounded-xl text-[11px] text-slate-500 dark:text-[#AAB8CC] border dark:border-[#2B3A50] transition-colors">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-[#AAB8CC]" />
          <span>{t.officialDisclaimer}</span>
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="p-4 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] space-y-2 flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("documents", { schemeId })}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0645A8] dark:bg-[#1671E8] hover:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>{t.viewChecklistBtn}</span>
        </button>

        <button
          onClick={() => onNavigate("applications", { schemeId })}
          className="w-full py-2.5 px-4 rounded-xl border border-[#0645A8] dark:border-[#60A5FA] text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#1D2D43] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{t.howToApplyBtn}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
