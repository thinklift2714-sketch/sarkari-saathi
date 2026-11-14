"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  MapPin,
  ExternalLink,
  ArrowRight,
  Phone,
  Building,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Globe,
  IndianRupee,
  Clock,
  AlertCircle
} from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { fetchApplicationGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface ScreenApplicationProcessProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenApplicationProcess({
  schemeId = "scheme_up_widow_pension",
  onNavigate,
  language = "hi",
}: ScreenApplicationProcessProps) {
  const t = translations[language] || translations.hi;
  const { profile } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCscModal, setShowCscModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchApplicationGuide(schemeId)
      .then((data) => {
        if (mounted) setGuide(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load application guide");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [schemeId]);

  const schemeTitle = language === "en"
    ? (guide?.scheme_name || guide?.scheme_name_hindi || "Government Scheme")
    : (guide?.scheme_name_hindi || "सरकारी योजना");

  const dept = language === "en"
    ? (guide?.department || guide?.department_hindi || "Concerned Department")
    : (guide?.department_hindi || "संबंधित सरकारी विभाग");

  const steps = guide?.steps || [];
  const applyUrl = guide?.official_application_url || guide?.official_website || "https://india.gov.in";
  const userDistrict = profile?.district || "वाराणसी";
  const userState = profile?.state || "उत्तर प्रदेश";

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Header: < आवेदन प्रक्रिया */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.processHeader}</span>
        </button>

        <span className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-full text-blue-100">
          {guide?.application_mode === "online"
            ? (language === "en" ? "Online Mode" : "ऑनलाइन मोड")
            : guide?.application_mode === "offline"
            ? (language === "en" ? "Offline Mode" : "ऑफ़लाइन मोड")
            : (language === "en" ? "Online / CSC Mode" : "ऑनलाइन व CSC मोड")}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
          <Loader2 className="w-8 h-8 text-[#0645A8] dark:text-[#60A5FA] animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === "en" ? "Loading verified application guide..." : "सत्यापित आवेदन प्रक्रिया लोड हो रही है..."}
          </p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{error}</p>
          <p className="text-xs text-slate-500">
            {language === "en" ? "Information not verified yet." : "जानकारी अभी सत्यापित नहीं है।"}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 pb-20 overscroll-contain">
          {/* Scheme Banner */}
          <div className="bg-white dark:bg-[#172438] p-4 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {schemeTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#AAB8CC] font-medium">{dept}</p>

            {/* Verification Status & Metadata Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>
                  {guide?.data_verification_status === "verified"
                    ? (language === "en" ? "Official Verified Portal" : "आधिकारिक सत्यापित प्रक्रिया")
                    : (language === "en" ? "Information not verified yet" : "जानकारी अभी सत्यापित नहीं है")}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <IndianRupee className="w-2.5 h-2.5" />
                <span>{guide?.application_fees || "निःशुल्क (₹0 / Free)"}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#0645A8] dark:text-[#60A5FA]">
                <Clock className="w-2.5 h-2.5" />
                <span>{guide?.application_deadline || "वर्ष भर खुला (Ongoing)"}</span>
              </span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              {language === "en" ? "Step-by-Step Application Procedure" : "चरणबद्ध आवेदन प्रक्रिया"}
            </h3>

            {steps.length === 0 ? (
              <div className="p-4 bg-slate-100 dark:bg-[#111C2E] rounded-2xl text-xs text-slate-500 text-center">
                {language === "en" ? "Information not verified yet." : "जानकारी अभी सत्यापित नहीं है।"}
              </div>
            ) : (
              <div className="space-y-3 relative">
                <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-blue-200 dark:bg-[#2B3A50] z-0" />

                {steps.map((st: any, idx: number) => {
                  const stepNum = st.step || idx + 1;
                  const title = language === "en" ? (st.title || st.title_hindi) : (st.title_hindi || st.title);
                  const desc = language === "en" ? (st.desc || st.desc_hindi) : (st.desc_hindi || st.desc);

                  return (
                    <div key={idx} className="relative z-10 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-[#1671E8] dark:bg-[#1D2D43] border-2 border-white dark:border-[#60A5FA] text-white dark:text-[#60A5FA] font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        {stepNum}
                      </div>

                      <div className="flex-1 bg-white dark:bg-[#172438] p-3.5 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-card transition-colors space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-snug">
                            {title}
                          </h4>
                          {st.mode && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {st.mode === "online" ? "Online" : "Offline"}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-[#AAB8CC] leading-relaxed">
                          {desc}
                        </p>

                        {st.portal_url && (
                          <div className="pt-1">
                            <a
                              href={st.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0645A8] dark:text-[#60A5FA] hover:underline"
                            >
                              <span>{language === "en" ? "Open Step Portal" : "इस चरण का पोर्टल खोलें"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Card: Direct Official Apply Portal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl p-4 border border-blue-200/90 dark:border-blue-900/60 shadow-card flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                  {language === "en" ? "Official Application Portal" : "आधिकारिक आवेदन पोर्टल"}
                </h4>
                <p className="text-[11px] text-[#0645A8] dark:text-[#60A5FA] font-mono truncate">{applyUrl}</p>
              </div>
            </div>

            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] hover:bg-[#1671E8] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 active:scale-95"
            >
              <span>{language === "en" ? "Apply Online" : "सीधे आवेदन करें"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action Card: नजदीकी CSC केंद्र खोजें */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-200/90 dark:border-amber-800/60 shadow-card flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-[#EA580C] dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-[#F8FAFC]">
                  {language === "en" ? "Find Nearest CSC Center" : "नजदीकी CSC केंद्र खोजें"}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">
                  {userDistrict}, {userState}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCscModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:text-[#1671E8] bg-white dark:bg-[#1D2D43] px-3 py-1.5 rounded-xl border border-blue-200 dark:border-[#2B3A50] shadow-sm active:scale-95 transition-colors"
            >
              <span>{language === "en" ? "View Centers" : "यहाँ देखें"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CSC Locator Modal Popup */}
      {showCscModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-[#2B3A50]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2B3A50] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-extrabold text-[#172033] dark:text-[#F8FAFC]">
                  {language === "en" ? "Authorized CSC Centers" : "मान्यता प्राप्त CSC केंद्र"}
                </h3>
              </div>
              <button
                onClick={() => setShowCscModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#AAB8CC]">
              {language === "en"
                ? `Authorized CSC centers near ${userDistrict}, ${userState}:`
                : `आपके क्षेत्र (${userDistrict}, ${userState}) के निकटतम अधिकृत जन सेवा केंद्र:`}
            </p>

            <div className="space-y-3">
              {(guide?.nearby_centers || []).map((csc: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-[#111C2E] p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#2B3A50] space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{csc.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                      {csc.distance}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#AAB8CC]">
                    {language === "en" ? "VLE: " : "संचालक: "} {csc.operator}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{csc.address}</p>
                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={`tel:${csc.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0645A8] dark:text-[#60A5FA]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{csc.phone}</span>
                    </a>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {language === "en" ? "Verified" : "सत्यापित केंद्र"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCscModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] text-white text-xs font-bold"
            >
              {language === "en" ? "Close" : "बंद करें"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
