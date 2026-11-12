"use client";

import React, { useState } from "react";
import { Mic, Keyboard, Star, FileText, Info, Users, Menu, X, Globe, ShieldCheck, Sparkles, ArrowRight, UserCheck, LogIn, LogOut } from "lucide-react";
import { AshokaEmblem } from "../common/Avatars";
import { translations, Language } from "@/lib/translations";
import { ThemeToggle } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

interface ScreenHomeProps {
  onNavigate: (screen: string, extra?: any) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function ScreenHome({ onNavigate, language, setLanguage }: ScreenHomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHoveredMic, setIsHoveredMic] = useState(false);
  const t = translations[language] || translations.hi;
  const { user, profile, signOut, setShowAuthModal } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  const displayName = profile?.name || (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Top Header with 1-Click Language Switcher, Theme Toggle & Hamburger */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100 dark:border-[#2B3A50] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-[#0645A8] dark:text-[#60A5FA]">
            <AshokaEmblem className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-[#0645A8] dark:text-[#60A5FA] leading-none">
              Sarkari
            </span>
            <span className="text-lg font-black tracking-tight text-[#1671E8] dark:text-[#93C5FD] leading-none">
              Saathi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {user ? (
            <button
              onClick={() => onNavigate("profile")}
              title={displayName || "Profile"}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-[#172438] border border-blue-200 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA] text-xs font-bold transition-all active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="max-w-[70px] truncate">{displayName || "प्रोफ़ाइल"}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0645A8] dark:bg-[#1671E8] text-white text-xs font-bold transition-all active:scale-95 shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Login" : "लॉगिन"}</span>
            </button>
          )}

          {/* Direct Theme Switcher Toggle */}
          <ThemeToggle language={language} />

          {/* Direct 1-Click Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === "hi" ? "Switch to English" : "हिंदी में बदलें"}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-[#1D2D43] text-xs font-bold transition-all active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === "hi" ? "EN" : "HI"}</span>
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172438] rounded-lg transition-colors"
            aria-label="मेनू"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Hamburger Menu Drawer */}
      {menuOpen && (
        <div className="bg-[#F8FAFC] dark:bg-[#111C2E] border-b border-slate-200 dark:border-[#2B3A50] px-5 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2B3A50]">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#AAB8CC] uppercase tracking-wider">{t.menuTitle}</span>
            <div className="flex items-center gap-2">
              <ThemeToggle language={language} />
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#172438] border border-slate-300 dark:border-[#2B3A50] rounded-full text-xs font-medium text-[#0645A8] dark:text-[#60A5FA]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.langSwitchLabel}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => { setMenuOpen(false); onNavigate("dashboard"); }}
              className="p-2.5 text-left bg-white dark:bg-[#172438] rounded-lg border border-slate-200 dark:border-[#2B3A50] font-medium text-slate-800 dark:text-[#F8FAFC] hover:border-[#1671E8] dark:hover:border-[#60A5FA]"
            >
              {t.menuDashboard}
            </button>
            <button
              onClick={() => { setMenuOpen(false); onNavigate("profile"); }}
              className="p-2.5 text-left bg-white dark:bg-[#172438] rounded-lg border border-slate-200 dark:border-[#2B3A50] font-medium text-slate-800 dark:text-[#F8FAFC] hover:border-[#1671E8] dark:hover:border-[#60A5FA]"
            >
              {t.menuProfile}
            </button>
            <button
              onClick={() => { setMenuOpen(false); onNavigate("applications"); }}
              className="p-2.5 text-left bg-white dark:bg-[#172438] rounded-lg border border-slate-200 dark:border-[#2B3A50] font-medium text-slate-800 dark:text-[#F8FAFC] hover:border-[#1671E8] dark:hover:border-[#60A5FA]"
            >
              {t.menuApplications}
            </button>
            <button
              onClick={() => { setMenuOpen(false); onNavigate("family"); }}
              className="p-2.5 text-left bg-white dark:bg-[#172438] rounded-lg border border-slate-200 dark:border-[#2B3A50] font-medium text-slate-800 dark:text-[#F8FAFC] hover:border-[#1671E8] dark:hover:border-[#60A5FA]"
            >
              {t.menuFamily}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{t.securityTrustBadge}</span>
          </div>
        </div>
      )}

      {/* Scrollable Home Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col justify-between">
        {/* Main Greeting Section */}
        <div className="px-6 pt-5 pb-2 text-center flex-shrink-0">
          <h1 className="text-2xl font-extrabold text-[#172033] dark:text-[#F8FAFC] tracking-tight">
            {t.greetingTitle}
          </h1>
          <p className="text-base text-slate-600 dark:text-[#AAB8CC] mt-1 font-medium">
            {t.greetingSubtitle}
          </p>
        </div>

        {/* Center Interactive Microphone Section */}
        <div className="flex flex-col items-center justify-center py-4 px-4 flex-shrink-0">
          {/* Concentric Pulsing Sound Rings */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute w-44 h-44 rounded-full bg-blue-100/60 dark:bg-blue-900/30 animate-ping opacity-25" />
            <div className="absolute w-36 h-36 rounded-full bg-blue-100/80 dark:bg-blue-900/40 animate-pulseRing" />
            <div className="absolute w-28 h-28 rounded-full bg-blue-200/50 dark:bg-blue-800/30" />

            {/* Big Circular Blue Mic Button */}
            <button
              onClick={() => onNavigate("assistant")}
              onMouseEnter={() => setIsHoveredMic(true)}
              onMouseLeave={() => setIsHoveredMic(false)}
              aria-label={t.micStartText}
              className="relative z-10 w-24 h-24 rounded-full bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white flex items-center justify-center shadow-mic active:scale-95 transition-all duration-200 border-4 border-white dark:border-[#172438]"
            >
              <Mic className={`w-11 h-11 ${isHoveredMic ? "scale-110" : "scale-100"} transition-transform`} />
            </button>
          </div>

          {/* Text Prompt */}
          <span className="text-base font-bold text-[#172033] dark:text-[#F8FAFC] mt-2">
            {t.micStartText}
          </span>

          {/* Secondary Button: लिखकर बताएं */}
          <button
            onClick={() => onNavigate("assistant", { autoOpenKeyboard: true })}
            className="mt-3 flex items-center gap-2 px-5 py-2 rounded-full border border-slate-300 dark:border-[#2B3A50] bg-white dark:bg-[#172438] hover:bg-slate-50 dark:hover:bg-[#1D2D43] text-slate-700 dark:text-[#F8FAFC] text-sm font-medium shadow-sm transition-colors active:scale-95"
          >
            <Keyboard className="w-4 h-4 text-slate-500 dark:text-[#AAB8CC]" />
            <span>{t.typeStartText}</span>
          </button>
        </div>

        {/* Quick Options Section: त्वरित विकल्प */}
        <div className="px-5 pb-6 flex-shrink-0">
          {/* AI Scheme Research Quick Action Banner */}
          <button
            onClick={() => onNavigate("analysis")}
            className="w-full mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-[#13233D] via-indigo-50/60 dark:via-[#1A2644] to-emerald-50 dark:to-[#122B24] border border-blue-200 dark:border-[#2B3A50] hover:border-[#1671E8] dark:hover:border-[#60A5FA] shadow-sm flex items-center justify-between transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-[#0645A8] dark:text-[#60A5FA] block">
                  {language === "en" ? "AI Scheme Research" : "✨ AI योजना अनुसंधान"}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#AAB8CC] font-medium">
                  {language === "en" ? "6-Stage Live Eligibility Analysis" : "६-स्टेज लाइव सरकारी पात्रता जाँच"}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#0645A8] dark:text-[#60A5FA] group-hover:translate-x-1 transition-transform" />
          </button>

          <h2 className="text-sm font-bold text-slate-700 dark:text-[#AAB8CC] mb-3 px-1">
            {t.quickOptionsTitle}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: मेरी योजनाएँ */}
            <button
              onClick={() => onNavigate("schemes")}
              className="flex flex-col items-start p-3.5 rounded-2xl bg-[#F0FDF4] dark:bg-[#0D241C] border border-[#BBF7D0] dark:border-[#1E4E3C] hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-cardHover transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-[#34D399] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5 fill-emerald-500 text-emerald-600 dark:text-[#34D399]" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
                {t.quickMySchemes}
              </span>
              <span className="text-xs text-emerald-700 dark:text-[#34D399] font-semibold mt-0.5">
                {t.quickMySchemesCount}
              </span>
            </button>

            {/* Option 2: दस्तावेज़ चेकलिस्ट */}
            <button
              onClick={() => onNavigate("documents")}
              className="flex flex-col items-start p-3.5 rounded-2xl bg-[#FFF7ED] dark:bg-[#2A1B10] border border-[#FED7AA] dark:border-[#52331C] hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-cardHover transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-[#F59E0B] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
                {t.quickChecklist}
              </span>
              <span className="text-xs text-amber-700 dark:text-[#F59E0B] font-semibold mt-0.5">
                {t.quickChecklistCount}
              </span>
            </button>

            {/* Option 3: आवेदन की जानकारी */}
            <button
              onClick={() => onNavigate("applications")}
              className="flex flex-col items-start p-3.5 rounded-2xl bg-[#EFF6FF] dark:bg-[#12213A] border border-[#BFDBFE] dark:border-[#1C3E6B] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-cardHover transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
                {t.quickAppInfo}
              </span>
              <span className="text-xs text-[#0645A8] dark:text-[#60A5FA] font-semibold mt-0.5">
                {t.quickAppInfoDesc}
              </span>
            </button>

            {/* Option 4: परिवार की जानकारी */}
            <button
              onClick={() => onNavigate("family")}
              className="flex flex-col items-start p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#251538] border border-[#E9D5FF] dark:border-[#4B2874] hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-cardHover transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] leading-tight">
                {t.quickFamilyInfo}
              </span>
              <span className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-0.5">
                {t.quickFamilyInfoCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
