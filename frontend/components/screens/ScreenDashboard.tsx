"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  History,
  Languages,
  Headphones,
  ShieldCheck,
  ArrowRight,
  Globe,
  X,
  User,
  LogOut,
  UserPlus,
  Sparkles,
  AlertCircle,
  FolderOpen,
  Database
} from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { ThemeToggle, ThemeSelectorPill } from "@/lib/theme";
import { fetchApplications, fetchProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function ScreenDashboard({
  onNavigate,
  language = "hi",
  setLanguage,
}: {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
}) {
  const t = translations[language] || translations.hi;
  const { user, profile, signOut, setShowAuthModal, setShowOnboardingModal } = useAuth();

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [appCount, setAppCount] = useState<number>(0);
  const [liveProfile, setLiveProfile] = useState<any>(profile);

  useEffect(() => {
    async function loadUserData() {
      try {
        const apps = await fetchApplications();
        if (Array.isArray(apps)) setAppCount(apps.length);
        const p = await fetchProfile();
        if (p) setLiveProfile(p);
      } catch (_) {}
    }
    loadUserData();
  }, [user, profile]);

  const toggleLanguage = () => {
    if (setLanguage) {
      setLanguage(language === "hi" ? "en" : "hi");
    }
  };

  const isProfileReady = Boolean(
    liveProfile && liveProfile.is_onboarded && liveProfile.name && liveProfile.name.trim() !== ""
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] dark:bg-[#0B1220] transition-colors duration-200">
      {/* Dashboard Top Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3.5 flex items-center justify-between shadow-xs transition-colors">
        <div>
          <h1 className="text-base font-extrabold tracking-tight">
            {t.dashboardHeader}
          </h1>
          <p className="text-[11px] text-blue-100 dark:text-[#AAB8CC] font-medium">
            {isProfileReady
              ? `नमस्ते, ${liveProfile.name}`
              : user
              ? (language === "en" ? "Profile Incomplete" : "प्रोफ़ाइल अधूरी है")
              : (language === "en" ? "Welcome, Citizen" : "स्वागत है, नागरिक")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle language={language} className="border-white/20 bg-white/10 text-white" />
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 dark:bg-blue-900/40 hover:bg-white/30 text-white text-xs font-bold transition-all active:scale-95 border border-white/10 dark:border-blue-700/40"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === "hi" ? "English" : "हिंदी"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 pb-20 overscroll-contain">
        {/* CASE 1: USER NOT LOGGED IN */}
        {!user && (
          <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-amber-200 dark:border-amber-800/60 shadow-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-[#F59E0B] flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "Login to view your schemes" : "अपने खाते में लॉगिन करें"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#AAB8CC]">
                  {language === "en"
                    ? "Each citizen receives independent scheme recommendations and private document storage."
                    : "हर नागरिक का डेटा और योजना सिफारिशें पूरी तरह अलग व सुरक्षित रहती हैं।"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2.5 bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === "en" ? "Login or Sign Up" : "लॉगिन या साइन अप करें"}</span>
            </button>
          </div>
        )}

        {/* CASE 2: LOGGED IN BUT PROFILE NOT YET READY (EMPTY STATE REQUIRED BY PART 8) */}
        {user && !isProfileReady && (
          <div className="bg-white dark:bg-[#172438] rounded-2xl p-5 border border-blue-200 dark:border-blue-900/60 shadow-card space-y-3.5 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === "en" ? "Your profile is not ready yet." : "अभी आपकी प्रोफाइल तैयार नहीं है।"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#AAB8CC] max-w-xs mx-auto leading-relaxed">
                {language === "en"
                  ? "Tell us about your age, location and occupation to receive personalized welfare recommendations."
                  : "सटीक सरकारी योजनाओं की खोज के लिए कृपया अपनी बुनियादी जानकारी भरें।"}
              </p>
            </div>

            <button
              onClick={() => onNavigate("profile")}
              className="w-full py-3 bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === "en" ? "Create Your Profile" : "अपनी प्रोफाइल बनाएं"}</span>
            </button>
          </div>
        )}

        {/* CASE 3: USER LOGGED IN & PROFILE READY */}
        {isProfileReady && (
          <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200/90 dark:border-[#2B3A50] shadow-card flex items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3">
              {liveProfile.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <img
                  src={liveProfile.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                  alt={liveProfile.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-blue-200 dark:border-blue-800/60 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center font-black text-lg border border-blue-200 dark:border-blue-800/60">
                  {liveProfile.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-base font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-tight">
                  {liveProfile.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#AAB8CC] font-medium mt-0.5">
                  {liveProfile.district ? `${liveProfile.district}, ` : ""}
                  {liveProfile.state || "उत्तर प्रदेश"}
                  {liveProfile.age ? ` • ${liveProfile.age} वर्ष` : ""}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-[#1D2D43] text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-[#253955] text-xs font-bold transition-colors active:scale-95 border border-transparent dark:border-[#2B3A50]"
            >
              <span>{t.viewProfilePill}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section: मेरी योजनाएँ */}
        <div
          onClick={() => onNavigate("schemes")}
          className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC]">
              {t.mySchemesSection}
            </h3>
            <span className="text-xs font-bold text-[#16A34A] dark:text-[#34D399] mt-0.5 block">
              {isProfileReady
                ? (language === "en" ? "Personalized recommendations ready" : "आपके लिए अनुकूलित योजनाएं तैयार")
                : (language === "en" ? "Browse 35+ verified schemes" : "35+ प्रमाणित सरकारी योजनाएं देखें")}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA]">
            <span>{t.viewAllLink}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Theme Settings Pill Card */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">
              {language === "en" ? "Theme Preferences" : "थीम प्राथमिकता (लाइट / डार्क)"}
            </span>
          </div>
          <ThemeSelectorPill language={language} />
        </div>

        {/* 2x2 Grid of Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: दस्तावेज़ चेकलिस्ट */}
          <button
            onClick={() => onNavigate("documents")}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] shadow-card hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-cardHover transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-[#F59E0B] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border border-amber-200 dark:border-amber-800/60">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
              {t.actionChecklist}
            </span>
          </button>

          {/* Action 2: आवेदन इतिहास */}
          <button
            onClick={() => onNavigate("applications")}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] shadow-card hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-cardHover transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border border-blue-200 dark:border-blue-800/60 relative">
              <History className="w-6 h-6" />
              {appCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {appCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
              {t.actionAppHistory}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#AAB8CC] mt-0.5">
              ({appCount} {language === "en" ? "Active" : "आवेदन"})
            </span>
          </button>

          {/* Action 3: परिवार सदस्य */}
          <button
            onClick={() => onNavigate("family")}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] shadow-card hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-cardHover transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border border-purple-200 dark:border-purple-800/60">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
              {language === "en" ? "My Family" : "मेरा परिवार"}
            </span>
          </button>

          {/* Action 4: सहायता केंद्र */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] shadow-card hover:border-yellow-300 dark:hover:border-yellow-600 hover:shadow-cardHover transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-2xl bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border border-yellow-200 dark:border-yellow-800/60">
              <Headphones className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
              {t.actionHelpCenter}
            </span>
          </button>
        </div>

        {/* Action 5: सरकारी डेटा सिंक एवं एडमिन पोर्टल */}
        <button
          onClick={() => onNavigate("admin")}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/90 dark:border-blue-900/60 shadow-xs hover:border-blue-300 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {language === "en" ? "Government Data Sync & Admin" : "सरकारी डेटा सिंक एवं योजना प्रशासन"}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                myScheme, API Setu, OGD Data.gov.in एवं नई योजनाएं जोड़ें
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#0645A8] dark:text-[#60A5FA]" />
        </button>

        {/* Security & Helpline Badge */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3.5 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 transition-colors">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-[#34D399] flex-shrink-0" />
          <div className="text-[11px] text-emerald-800 dark:text-[#34D399]">
            <span>{t.helplineText}</span>
          </div>
        </div>

        {/* Logout action if user is logged in */}
        {user && (
          <div className="pt-2">
            <button
              onClick={signOut}
              className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Sign Out" : "लॉगआउट करें"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-3.5 border border-slate-200 dark:border-[#2B3A50] text-[#172033] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B3A50] pb-2">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-[#0645A8] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-extrabold">{t.helpModalTitle}</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-[#111C2E] rounded-xl border border-slate-200 dark:border-[#2B3A50]">
                <p className="font-bold text-slate-800 dark:text-[#F8FAFC]">{t.tollFreeTitle}</p>
                <p className="text-slate-600 dark:text-[#AAB8CC] mt-1">
                  📞 {language === "en" ? "Social Welfare (Pension): 1800-419-0001" : "समाज कल्याण (पेंशन): 1800-419-0001"}
                </p>
                <p className="text-slate-600 dark:text-[#AAB8CC]">
                  📞 {language === "en" ? "PM-Kisan Helpline: 155261 / 011-24300606" : "पीएम-किसान हेल्पलाइन: 155261 / 011-24300606"}
                </p>
                <p className="text-slate-600 dark:text-[#AAB8CC]">
                  📞 {language === "en" ? "Ayushman Bharat: 14555" : "आयुष्मान भारत: 14555"}
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800/60 text-[#0645A8] dark:text-[#93C5FD]">
                <p className="font-bold">{language === "en" ? "Nearest Government Office:" : "नजदीकी सरकारी कार्यालय:"}</p>
                <p className="text-[11px] mt-1">
                  {language === "en" ? "Vikas Bhawan / District Social Welfare Officer" : "विकास भवन / जिला समाज कल्याण अधिकारी"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
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
