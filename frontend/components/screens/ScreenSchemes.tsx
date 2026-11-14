"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Loader2,
  Search,
  Building2,
  Landmark,
  ExternalLink,
  Filter,
  Bookmark,
  BookmarkCheck,
  Heart,
} from "lucide-react";
import { discoverSchemes, saveScheme, removeSavedScheme, fetchSavedSchemeIds } from "@/lib/api";
import { translations, Language } from "@/lib/translations";

// ── localStorage helpers for anonymous saves ─────────────────────────────────
const LS_KEY = "sarkari_saathi_saved_schemes";

function lsGetSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<string>(parsed);
  } catch (_) {}
  return new Set();
}

function lsGetSavedSchemes(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY + "_data");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return [];
}

function lsSaveScheme(scheme: any) {
  const ids = lsGetSavedIds();
  ids.add(scheme.scheme_id);
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids)));
  const schemes = lsGetSavedSchemes().filter((s) => s.scheme_id !== scheme.scheme_id);
  schemes.push(scheme);
  localStorage.setItem(LS_KEY + "_data", JSON.stringify(schemes));
}

function lsRemoveScheme(schemeId: string) {
  const ids = lsGetSavedIds();
  ids.delete(schemeId);
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids)));
  const schemes = lsGetSavedSchemes().filter((s) => s.scheme_id !== schemeId);
  localStorage.setItem(LS_KEY + "_data", JSON.stringify(schemes));
}

function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("sarkari_saathi_token");
}

interface ScreenSchemesProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
  extraData?: any;
}

const CATEGORIES_LIST = [
  { code: "all", hi: "सभी", en: "All" },
  { code: "social_welfare", hi: "सामाजिक सुरक्षा व पेंशन", en: "Social Welfare & Pension" },
  { code: "agriculture", hi: "कृषि व किसान कल्याण", en: "Agriculture & Farmers" },
  { code: "health", hi: "स्वास्थ्य व चिकित्सा", en: "Health & Medical" },
  { code: "housing", hi: "आवास व आश्रय", en: "Housing & Shelter" },
  { code: "energy", hi: "ऊर्जा व बिजली", en: "Energy & Utilities" },
  { code: "employment", hi: "रोजगार व आजीविका", en: "Employment & Livelihood" },
  { code: "education", hi: "शिक्षा व छात्रवृत्ति", en: "Education & Scholarship" },
  { code: "women_child", hi: "महिला व बाल विकास", en: "Women & Child Welfare" },
];

export function ScreenSchemes({ onNavigate, language = "hi", extraData }: ScreenSchemesProps) {
  const t = translations[language] || translations.hi;
  const [activeTab, setActiveTab] = useState<"eligible" | "saved">("eligible");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [governmentLevel, setGovernmentLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(extraData?.analysisReport || null);
  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(new Set());
  const [savedSchemesData, setSavedSchemesData] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false });

  // Show a brief toast notification
  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2000);
  };

  // Load saved IDs from localStorage (works for all users) and sync with backend if logged in
  const loadSavedData = useCallback(() => {
    const lsIds = lsGetSavedIds();
    const lsData = lsGetSavedSchemes();
    setSavedSchemeIds(lsIds);
    setSavedSchemesData(lsData);

    // If logged in, merge with backend saved IDs
    if (isUserLoggedIn()) {
      fetchSavedSchemeIds()
        .then((ids) => {
          if (Array.isArray(ids) && ids.length > 0) {
            setSavedSchemeIds((prev) => {
              const merged = new Set(prev);
              ids.forEach((id) => merged.add(id));
              return merged;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  const handleToggleSave = async (scheme: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const schemeId = scheme.scheme_id;
    const isSaved = savedSchemeIds.has(schemeId);

    // Optimistic UI update
    if (isSaved) {
      setSavedSchemeIds((prev) => { const n = new Set(prev); n.delete(schemeId); return n; });
      setSavedSchemesData((prev) => prev.filter((s) => s.scheme_id !== schemeId));
      lsRemoveScheme(schemeId);
      showToast(language === "en" ? "Scheme removed from saved" : "योजना सहेजी गई सूची से हटाई गई");
      // Backend sync for logged-in users
      if (isUserLoggedIn()) {
        removeSavedScheme(schemeId).catch(() => {});
      }
    } else {
      setSavedSchemeIds((prev) => new Set(prev).add(schemeId));
      setSavedSchemesData((prev) => {
        if (prev.find((s) => s.scheme_id === schemeId)) return prev;
        return [...prev, scheme];
      });
      lsSaveScheme(scheme);
      showToast(language === "en" ? "Scheme saved! ✓" : "योजना सहेजी गई! ✓");
      // Backend sync for logged-in users
      if (isUserLoggedIn()) {
        saveScheme(schemeId).catch(() => {});
      }
    }
  };

  const getActiveProfile = () => {
    if (extraData?.profile && Object.keys(extraData.profile).length > 0) {
      return extraData.profile;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("sarkari_saathi_active_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Object.keys(parsed).length > 0) return parsed;
        }
      } catch (_) {}
    }
    return undefined;
  };

  const loadSchemes = (cat = selectedCategory, query = searchQuery, level = governmentLevel) => {
    setLoading(true);
    const activeProfile = getActiveProfile();
    const activeConvId = extraData?.conversationId || (typeof window !== "undefined" ? sessionStorage.getItem("sarkari_saathi_active_conv_id") : undefined);

    discoverSchemes({
      profile: activeProfile,
      session_id: activeConvId || undefined,
      category: cat === "all" ? undefined : cat,
      search_query: query.trim() || undefined,
      government_level: level === "all" ? undefined : level,
    })
      .then((res) => setData(res))
      .catch((err) => console.error("Error loading discovery schemes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!extraData?.analysisReport || selectedCategory !== "all" || searchQuery || governmentLevel !== "all") {
      loadSchemes(selectedCategory, searchQuery, governmentLevel);
    }
  }, [selectedCategory, governmentLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchemes(selectedCategory, searchQuery, governmentLevel);
  };

  const summary = data?.summary || {
    eligible_count: 0,
    potentially_eligible_count: 0,
    more_info_required_count: 0,
    not_eligible_count: 0,
    total_evaluated: 0,
  };

  const results = data?.results || {};
  // Saved tab uses persistent savedSchemesData (localStorage + backend), not filtered from current results
  const currentList = activeTab === "saved" ? savedSchemesData : results.eligible || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#172033] dark:bg-[#F8FAFC] text-white dark:text-[#172033] text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-fade-in-down pointer-events-none">
          {toast.msg}
        </div>
      )}

      {/* Header: < आपके लिए मिली योजनाएँ */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.resultsHeader}</span>
        </button>
        <span className="text-xs bg-white/20 dark:bg-blue-900/40 border border-white/10 dark:border-blue-700/40 px-2.5 py-0.5 rounded-full font-semibold">
          {activeTab === "saved"
            ? `${savedSchemesData.length} ${language === "en" ? "Saved" : "सहेजी गई"}`
            : `${summary.eligible_count} ${language === "en" ? "Eligible" : "पात्र योजनाएं"}`}
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-[#172438] px-4 pt-3 pb-2 border-b border-slate-100 dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#AAB8CC] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => loadSchemes(selectedCategory, searchQuery)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] rounded-xl text-xs text-[#172033] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0645A8] dark:focus:ring-[#60A5FA] focus:bg-white dark:focus:bg-[#172438] placeholder:text-slate-400 dark:placeholder:text-[#AAB8CC]/60 font-medium transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadSchemes(selectedCategory, "");
              }}
              className="absolute right-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 px-2.5 py-1 bg-[#0645A8] dark:bg-[#1671E8] text-white rounded-lg text-xs font-bold hover:bg-[#1671E8] dark:hover:bg-[#0645A8] transition-colors"
          >
            खोजें
          </button>
        </form>
      </div>

      {/* Government Level Toggle & Source Info Banner */}
      <div className="bg-slate-50 dark:bg-[#111C2E] px-4 py-1.5 border-b border-slate-200 dark:border-[#2B3A50] flex items-center justify-between text-[11px] flex-shrink-0 transition-colors">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-slate-500 dark:text-[#AAB8CC]">स्तर:</span>
          <button
            onClick={() => setGovernmentLevel("all")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              governmentLevel === "all"
                ? "bg-[#0645A8] dark:bg-[#1671E8] text-white"
                : "bg-white dark:bg-[#172438] text-slate-600 dark:text-[#AAB8CC] border border-slate-200 dark:border-[#2B3A50]"
            }`}
          >
            {language === "en" ? "All" : "सभी"}
          </button>
          <button
            onClick={() => setGovernmentLevel("central")}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
              governmentLevel === "central"
                ? "bg-[#0645A8] dark:bg-[#1671E8] text-white"
                : "bg-white dark:bg-[#172438] text-slate-600 dark:text-[#AAB8CC] border border-slate-200 dark:border-[#2B3A50]"
            }`}
          >
            <Landmark className="w-2.5 h-2.5" />
            {language === "en" ? "Central" : "केंद्र"}
          </button>
          <button
            onClick={() => setGovernmentLevel("state")}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
              governmentLevel === "state"
                ? "bg-[#0645A8] dark:bg-[#1671E8] text-white"
                : "bg-white dark:bg-[#172438] text-slate-600 dark:text-[#AAB8CC] border border-slate-200 dark:border-[#2B3A50]"
            }`}
          >
            <Building2 className="w-2.5 h-2.5" />
            {language === "en" ? "State (UP)" : "राज्य (UP)"}
          </button>
        </div>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 font-semibold truncate max-w-[150px]">
          myScheme / SSPY UP
        </span>
      </div>

      {/* Primary Status Tabs */}
      <div className="bg-white dark:bg-[#172438] px-3 py-2 border-b border-slate-200 dark:border-[#2B3A50] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 transition-colors">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "eligible"
              ? "bg-[#16A34A] dark:bg-[#34D399] text-white dark:text-[#0B1220] shadow-sm"
              : "bg-slate-100 dark:bg-[#111C2E] text-slate-600 dark:text-[#AAB8CC] hover:bg-slate-200 dark:hover:bg-[#1D2D43]"
          }`}
        >
          <span>{t.tabEligible}</span>
          <span>({summary.eligible_count})</span>
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "saved"
              ? "bg-[#0645A8] dark:bg-[#3B82F6] text-white shadow-sm"
              : "bg-slate-100 dark:bg-[#111C2E] text-slate-600 dark:text-[#AAB8CC] hover:bg-slate-200 dark:hover:bg-[#1D2D43]"
          }`}
        >
          <Bookmark className="w-3 h-3 fill-current" />
          <span>{language === "en" ? "Saved" : "सहेजी गई"}</span>
          <span>({savedSchemesData.length})</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-[#F1F5F9] dark:bg-[#111C2E] px-3 py-2 border-b border-slate-200 dark:border-[#2B3A50] overflow-x-auto no-scrollbar flex items-center gap-1.5 flex-shrink-0 transition-colors">
        <span className="text-[11px] font-bold text-slate-500 dark:text-[#AAB8CC] whitespace-nowrap flex items-center gap-1 pl-1 pr-0.5">
          <Filter className="w-3 h-3 text-[#0645A8] dark:text-[#60A5FA]" />
          श्रेणी:
        </span>
        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.code;
          return (
            <button
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-[#0645A8] dark:bg-[#1671E8] text-white shadow-sm"
                  : "bg-white dark:bg-[#172438] text-slate-700 dark:text-[#AAB8CC] border border-slate-200 dark:border-[#2B3A50] hover:bg-slate-100 dark:hover:bg-[#1D2D43]"
              }`}
            >
              {language === "en" ? cat.en : cat.hi}
            </button>
          );
        })}
      </div>

      {/* Scheme Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3.5 pb-24 overscroll-contain">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-[#AAB8CC]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0645A8] dark:text-[#60A5FA] mb-2" />
            <span className="text-xs font-semibold">{t.ruleEngineEvaluating}</span>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-[#AAB8CC] bg-white dark:bg-[#172438] rounded-2xl p-6 border border-slate-200 dark:border-[#2B3A50] space-y-1.5">
            <Bookmark className="w-10 h-10 mx-auto mb-3 text-amber-400 dark:text-amber-500 opacity-60" />
            <p className="text-sm font-semibold">
              {activeTab === "saved"
                ? (language === "en" ? "No saved schemes yet" : "आपने अभी तक कोई योजना सहेजी नहीं है")
                : t.noSchemesCategory}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {activeTab === "saved"
                ? (language === "en"
                  ? "Tap the 'Save' button on any scheme card to bookmark it here."
                  : "किसी भी योजना कार्ड पर 'सहेजें' बटन दबाएं और वह यहाँ दिखेगी।")
                : "कृपया अन्य श्रेणी चुनें या खोज शब्द बदलें।"}
            </p>
            {activeTab === "saved" && (
              <button
                onClick={() => setActiveTab("eligible")}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/40 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {language === "en" ? "Browse Eligible Schemes" : "पात्र योजनाएं देखें"}
              </button>
            )}
          </div>
        ) : (
          currentList.map((scheme: any) => {
            const isEligible = scheme.status === "eligible";
            const isPotential = scheme.status === "potentially_eligible";
            const isCentral = scheme.central_or_state === "central";

            return (
              <div
                key={scheme.scheme_id}
                className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card hover:shadow-cardHover transition-all flex flex-col relative"
              >
                {/* Header with Title & Checkmark */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {isEligible ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-[#34D399] fill-emerald-100 dark:fill-emerald-950" />
                    ) : isPotential ? (
                      <AlertCircle className="w-5 h-5 text-[#FF9933] dark:text-[#F59E0B] fill-amber-100 dark:fill-amber-950" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 fill-red-100 dark:fill-red-950" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-snug">
                      {language === "en" ? scheme.scheme_name : scheme.scheme_name_hindi}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] font-medium">
                      {language === "en" ? (scheme.department || scheme.department_hindi) : scheme.department_hindi}
                    </p>
                  </div>

                  {/* Save Button — prominent with label */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(scheme, e)}
                    title={savedSchemeIds.has(scheme.scheme_id) ? "सहेजी गई सूची से हटाएं" : "योजना सहेजें"}
                    className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl border transition-all min-w-[48px] ${
                      savedSchemeIds.has(scheme.scheme_id)
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-sm"
                        : "bg-slate-50 dark:bg-[#111C2E] text-slate-400 dark:text-[#AAB8CC] border-slate-200 dark:border-[#2B3A50] hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700"
                    }`}
                  >
                    {savedSchemeIds.has(scheme.scheme_id) ? (
                      <BookmarkCheck className="w-4 h-4 fill-current" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    <span className="text-[9px] font-bold leading-none">
                      {savedSchemeIds.has(scheme.scheme_id)
                        ? (language === "en" ? "Saved" : "सहेजी")
                        : (language === "en" ? "Save" : "सहेजें")}
                    </span>
                  </button>
                </div>

                {/* Badges Row */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {isEligible ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DFF5E5] dark:bg-emerald-950/60 text-[#166534] dark:text-[#34D399] border dark:border-emerald-800/60">
                      {t.badgeEligible}
                    </span>
                  ) : isPotential ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border dark:border-amber-800/60">
                      {t.badgePotential}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border dark:border-red-800/60">
                      {t.badgeNotEligible}
                    </span>
                  )}

                  {/* Central or State Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCentral
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800/60"
                        : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                    }`}
                  >
                    {isCentral ? (
                      <Landmark className="w-2.5 h-2.5" />
                    ) : (
                      <Building2 className="w-2.5 h-2.5" />
                    )}
                    {isCentral ? t.centralGovBadge : t.stateGovBadge}
                  </span>

                  {/* Category Pill */}
                  {scheme.category_hindi && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-[#1D2D43] text-slate-600 dark:text-[#AAB8CC] border dark:border-[#2B3A50]">
                      {scheme.category_hindi}
                    </span>
                  )}
                </div>

                {/* Description / Benefits */}
                <p className="text-xs text-slate-700 dark:text-[#CBD5E1] mt-2 font-medium leading-relaxed">
                  {scheme.benefits?.description_hindi || scheme.description_hindi}
                </p>

                {/* Deterministic Match Explanation */}
                <div className="mt-2 text-[11px] text-slate-600 dark:text-[#AAB8CC] bg-slate-50 dark:bg-[#111C2E] p-2.5 rounded-xl border border-slate-100 dark:border-[#2B3A50]">
                  <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{t.reasonLabel}: </span>
                  <span>{scheme.explanation}</span>
                </div>

                {/* Official Source Link & Action Link */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2B3A50] flex items-center justify-between">
                  {scheme.official_website ? (
                    <a
                      href={scheme.official_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 dark:text-[#AAB8CC] hover:text-[#0645A8] dark:hover:text-[#60A5FA] font-medium flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>{scheme.official_source || "आधिकारिक पोर्टल"}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => onNavigate("scheme_details", { schemeId: scheme.scheme_id })}
                    className="flex items-center gap-1 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:text-[#1671E8] dark:hover:text-blue-300 transition-colors bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-transparent dark:border-[#2B3A50]"
                  >
                    <span>{t.viewFullDetails}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
