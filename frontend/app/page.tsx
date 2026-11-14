"use client";

import React, { useState } from "react";
import { ScreenHome } from "@/components/screens/ScreenHome";
import { ScreenAssistant } from "@/components/screens/ScreenAssistant";
import { ScreenProfile } from "@/components/screens/ScreenProfile";
import { ScreenSchemes } from "@/components/screens/ScreenSchemes";
import { ScreenSchemeDetails } from "@/components/screens/ScreenSchemeDetails";
import { ScreenDocuments } from "@/components/screens/ScreenDocuments";
import { ScreenApplicationProcess } from "@/components/screens/ScreenApplicationProcess";
import { ScreenAppGuide } from "@/components/screens/ScreenAppGuide";
import { ScreenFamily } from "@/components/screens/ScreenFamily";
import { ScreenDashboard } from "@/components/screens/ScreenDashboard";
import { ScreenApplications } from "@/components/screens/ScreenApplications";
import { ScreenAnalysis } from "@/components/screens/ScreenAnalysis";
import { ScreenAuth } from "@/components/screens/ScreenAuth";
import { ScreenOnboarding } from "@/components/screens/ScreenOnboarding";
import { ScreenAdmin } from "@/components/screens/ScreenAdmin";
import { BottomNav } from "@/components/navigation/BottomNav";
import { AshokaEmblem } from "@/components/common/Avatars";
import {
  Mic,
  CheckCircle2,
  FileText,
  MapPin,
  Sparkles,
  Smartphone,
  ChevronRight,
  Globe,
  LogIn,
  UserCheck,
  ShieldCheck,
  UserPlus,
  Lock,
  Database
} from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { ThemeToggle } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>("home");
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("scheme_up_widow_pension");
  const [autoOpenKeyboard, setAutoOpenKeyboard] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>("hi");
  const [screenExtra, setScreenExtra] = useState<any>(null);

  const {
    user,
    profile,
    showAuthModal,
    setShowAuthModal,
    showOnboardingModal,
    setShowOnboardingModal,
  } = useAuth();

  const t = translations[language] || translations.hi;

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  const navigateTo = (screen: string, extra?: any) => {
    if (extra?.schemeId) {
      setSelectedSchemeId(extra.schemeId);
    }
    if (extra?.autoOpenKeyboard !== undefined) {
      setAutoOpenKeyboard(extra.autoOpenKeyboard);
    } else {
      setAutoOpenKeyboard(false);
    }
    setScreenExtra(extra || null);
    setActiveScreen(screen);
  };

  // Screens defined in prompt & reference image (Bilingual)
  const screenTabs = language === "en" ? [
    { id: "home", label: "1. Home", name: "Home" },
    { id: "assistant", label: "2. Voice AI", name: "Voice AI" },
    { id: "analysis", label: "✨ AI Research", name: "AI Research" },
    { id: "profile", label: "3. Profile", name: "Profile" },
    { id: "schemes", label: "4. Schemes", name: "Schemes" },
    { id: "scheme_details", label: "5. Details", name: "Details" },
    { id: "documents", label: "6. Checklist", name: "Checklist" },
    { id: "process", label: "7. Process", name: "Process" },
    { id: "family", label: "8. Family", name: "Family" },
    { id: "dashboard", label: "9. Dashboard", name: "Dashboard" },
    { id: "admin", label: "⚙️ Data Sync", name: "Admin" },
  ] : [
    { id: "home", label: "१. होम स्क्रीन", name: "Home" },
    { id: "assistant", label: "२. AI सहायक", name: "Voice AI" },
    { id: "analysis", label: "✨ AI विश्लेषण", name: "AI Analysis" },
    { id: "profile", label: "३. प्रोफ़ाइल", name: "Profile" },
    { id: "schemes", label: "४. मिली योजनाएँ", name: "Schemes" },
    { id: "scheme_details", label: "५. योजना जानकारी", name: "Details" },
    { id: "documents", label: "६. दस्तावेज़ चेकलिस्ट", name: "Checklist" },
    { id: "process", label: "७. आवेदन प्रक्रिया", name: "Process" },
    { id: "family", label: "८. मेरा परिवार", name: "Family" },
    { id: "dashboard", label: "९. मेरा डैशबोर्ड", name: "Dashboard" },
    { id: "admin", label: "⚙️ डेटा सिंक/Admin", name: "Admin" },
  ];

  // Redirect un-onboarded authenticated users directly to Profile Setup
  React.useEffect(() => {
    if (user && profile && profile.is_onboarded === false && activeScreen !== "auth" && activeScreen !== "onboarding") {
      setActiveScreen("onboarding");
    }
  }, [user, profile, activeScreen]);

  const renderActiveScreen = () => {
    if (showOnboardingModal || activeScreen === "onboarding") {
      return (
        <ScreenOnboarding
          language={language}
          onComplete={() => {
            setShowOnboardingModal(false);
            navigateTo("dashboard");
          }}
        />
      );
    }

    if (showAuthModal || activeScreen === "auth") {
      return (
        <ScreenAuth
          language={language}
          setLanguage={setLanguage}
          onSuccess={() => {
            setShowAuthModal(false);
            setActiveScreen("home");
          }}
          onClose={() => {
            setShowAuthModal(false);
            if (activeScreen === "auth") setActiveScreen("home");
          }}
        />
      );
    }

    switch (activeScreen) {
      case "home":
        return <ScreenHome onNavigate={navigateTo} language={language} setLanguage={setLanguage} />;
      case "assistant":
        return <ScreenAssistant onNavigate={navigateTo} autoOpenKeyboard={autoOpenKeyboard} language={language} />;
      case "analysis":
        return <ScreenAnalysis onNavigate={navigateTo} language={language} extraData={screenExtra} />;
      case "profile":
        return <ScreenProfile onNavigate={navigateTo} language={language} />;
      case "schemes":
        return <ScreenSchemes onNavigate={navigateTo} language={language} extraData={screenExtra} />;
      case "scheme_details":
        return <ScreenSchemeDetails schemeId={selectedSchemeId} onNavigate={navigateTo} language={language} />;
      case "documents":
        return <ScreenDocuments schemeId={selectedSchemeId} onNavigate={navigateTo} language={language} />;
      case "process":
        return <ScreenApplicationProcess schemeId={selectedSchemeId} onNavigate={navigateTo} language={language} />;
      case "family":
        return <ScreenFamily onNavigate={navigateTo} language={language} />;
      case "dashboard":
        return <ScreenDashboard onNavigate={navigateTo} language={language} setLanguage={setLanguage} />;
      case "applications":
        return <ScreenApplications schemeId={selectedSchemeId} onNavigate={navigateTo} />;
      case "app_guide":
      case "application_guide":
        return <ScreenAppGuide onNavigate={navigateTo} language={language} />;
      case "admin":
        return <ScreenAdmin onNavigate={navigateTo} language={language} />;
      case "auth":
        return (
          <ScreenAuth
            language={language}
            setLanguage={setLanguage}
            onSuccess={() => setActiveScreen("home")}
            onClose={() => setActiveScreen("home")}
          />
        );
      default:
        return <ScreenHome onNavigate={navigateTo} language={language} setLanguage={setLanguage} />;
    }
  };

  const showBottomNav =
    !showAuthModal &&
    ["home", "schemes", "assistant", "documents", "dashboard", "profile"].includes(activeScreen);

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#070D18] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar (Desktop View as per Reference Image) */}
      <header className="bg-white dark:bg-[#111C2E] border-b border-slate-200 dark:border-[#2B3A50] px-4 py-2.5 flex items-center justify-between shadow-2xs z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AshokaEmblem className="w-8 h-8 text-[#0645A8] dark:text-[#60A5FA]" />
            <div className="flex flex-col">
              <span className="text-base font-black text-[#0645A8] dark:text-[#60A5FA] tracking-tight leading-none">
                Sarkari Saathi
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-[#AAB8CC] leading-none mt-0.5">
                (सरकारी साथी)
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block text-xs font-semibold text-slate-500 dark:text-[#AAB8CC] border-l border-slate-200 dark:border-[#2B3A50] pl-3">
            {t.taglinePrimary} • {t.taglineSecondary}
          </span>
        </div>

        {/* 10-Screen Navigation Pills */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 max-w-2xl px-2">
          {screenTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setShowAuthModal(false);
                navigateTo(tab.id);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                activeScreen === tab.id && !showAuthModal
                  ? "bg-[#0645A8] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#AAB8CC] hover:bg-slate-200 dark:hover:bg-[#1D2D43]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* User Account / Auth & Theme Toggle in Desktop Header */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => {
                setShowAuthModal(false);
                navigateTo("profile");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-all hover:bg-emerald-100 shadow-2xs"
            >
              {profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                  alt="Profile"
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="max-w-[120px] truncate">{profile?.name || (user.email ? user.email.split("@")[0] : "सत्यापित नागरिक")}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0645A8] hover:bg-[#1671E8] text-white rounded-full text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Sign In / Register" : "लॉगिन / साइन अप"}</span>
            </button>
          )}

          {/* Admin / Data Governance Button */}
          <button
            onClick={() => navigateTo("admin")}
            title="सरकारी डेटा सिंक एवं योजना प्रशासन"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] hover:bg-slate-200 dark:hover:bg-[#1D2D43] rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
            <span className="hidden sm:inline">{language === "en" ? "Data Sync / Admin" : "डेटा सिंक / Admin"}</span>
          </button>

          {/* Theme Switcher Toggle */}
          <ThemeToggle language={language} />

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-[#172438] border border-blue-200 dark:border-[#2B3A50] hover:bg-blue-100 dark:hover:bg-[#1D2D43] rounded-full text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] transition-all active:scale-95 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === "hi" ? "English" : "हिंदी"}</span>
          </button>
        </div>
      </header>

      {/* Main Container Area with Reference Image Style Graphic Surround */}
      <main className="flex-1 flex items-center justify-center py-4 sm:py-6 lg:py-8 px-2 sm:px-4 relative overflow-hidden">
        {/* Background Tricolour Accents */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 relative z-10">
          {/* Left Hero Graphic Card (Desktop) */}
          <div className="hidden xl:flex flex-col justify-center max-w-xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#0645A8] dark:text-[#60A5FA]">
                <AshokaEmblem className="w-9 h-9" />
                <span className="text-xl font-black">Sarkari Saathi</span>
              </div>
              <h2 className="text-3xl font-black text-[#172033] dark:text-[#F8FAFC] tracking-tight leading-tight">
                सरकारी योजनाओं का लाभ, अब हर किसी के साथ।
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#AAB8CC] leading-relaxed">
                बोलिए, जानिए, पाएं अपना हक! भारत सरकार और राज्य सरकारों की प्रमाणित योजनाओं का AI आधारित हिंदी मंच।
              </p>
            </div>

            {/* Quick Feature Highlights List */}
            <div className="space-y-2.5">
              <button
                onClick={() => navigateTo("assistant")}
                className="w-full flex items-center gap-3 bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                  आवाज़ में पूछें (हिंदी में)
                </span>
              </button>

              <button
                onClick={() => navigateTo("schemes")}
                className="w-full flex items-center gap-3 bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#16A34A] dark:text-[#34D399] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                  पात्रता के अनुसार योजनाएं पाएं
                </span>
              </button>

              <button
                onClick={() => navigateTo("documents")}
                className="w-full flex items-center gap-3 bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-[#F59E0B] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                  दस्तावेज़ चेकलिस्ट पाएं
                </span>
              </button>

              <button
                onClick={() => navigateTo("app_guide")}
                className="w-full flex items-center gap-3 bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                  आवेदन की पूरी जानकारी पाएं
                </span>
              </button>
            </div>
          </div>

          {/* Central Mobile Frame */}
          <div className="w-full max-w-[420px] bg-slate-900 dark:bg-black p-2 sm:p-3 rounded-[44px] shadow-[0_25px_60px_rgba(6,69,168,0.22)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-4 border-slate-800 dark:border-slate-800 transition-colors">
            {/* Phone Screen Viewport */}
            <div className="w-full h-[780px] max-h-[88vh] bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] rounded-[34px] overflow-hidden flex flex-col relative shadow-inner transition-colors duration-200">
              {/* Phone Status Bar */}
              <div className="bg-inherit px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 select-none z-20 flex-shrink-0">
                <span>9:41</span>
                {/* Dynamic Pill Notch */}
                <div className="w-20 h-4 bg-slate-900/10 dark:bg-white/10 rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-800 dark:border-slate-300 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-800 dark:bg-slate-300 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Active Screen View */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                {renderActiveScreen()}
              </div>

              {/* Mobile Bottom Navigation */}
              {showBottomNav && (
                <div className="flex-shrink-0">
                  <BottomNav activeScreen={activeScreen} onNavigate={navigateTo} language={language} />
                </div>
              )}
            </div>
          </div>

          {/* Right Hero Graphic Card (Desktop) */}
          <div className="hidden xl:flex flex-col justify-center max-w-xs space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0645A8] dark:text-[#60A5FA] tracking-tight">
                सशक्त नागरिक, समृद्ध भारत
              </h3>
              {/* Tricolour Ribbon Graphic */}
              <div className="h-1.5 w-32 bg-gradient-to-r from-[#FF9933] via-white to-[#16A34A] rounded-full shadow-sm" />
              <p className="text-xs text-slate-600 dark:text-[#AAB8CC] font-medium leading-relaxed">
                ग्रामीण, किसान, महिलाएं, वृद्ध और डिजिटल रूप से कमजोर नागरिकों के लिए विशेष रूप से तैयार किया गया हिंदी-प्रथम डिजिटल साथी।
              </p>
            </div>

            {/* Authenticated User or Security Privacy Box */}
            <div className="bg-white dark:bg-[#172438] p-4 rounded-3xl border border-slate-200 dark:border-[#2B3A50] shadow-sm space-y-3 transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] uppercase tracking-wider block">
                {user ? "सत्यापित उपयोगकर्ता खाता" : "सुरक्षित नागरिक लॉगिन"}
              </span>

              {user && profile?.is_onboarded ? (
                <div className="text-xs space-y-1.5 text-slate-700 dark:text-[#F8FAFC]">
                  <p><span className="font-bold">नाम:</span> {profile.name}</p>
                  <p><span className="font-bold">स्थिति:</span> {profile.occupation || "नागरिक"}</p>
                  <p><span className="font-bold">स्थान:</span> {profile.district ? `${profile.district}, ` : ""}{profile.state || "उत्तर प्रदेश"}</p>
                  <p><span className="font-bold">परिवार सदस्य:</span> {profile.members?.length || profile.family_size || 1}</p>
                  <p><span className="font-bold">वार्षिक आय:</span> ₹{(profile.annual_income || 0).toLocaleString("en-IN")}</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-600 dark:text-[#AAB8CC]">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-[#34D399] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Row-Level Security सक्रिय</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    हर नागरिक का डेटा और योजना सिफारिशें पूरी तरह अलग व गोपनीय रहती हैं।
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-[#2B3A50]">
                {user ? (
                  <button
                    onClick={() => navigateTo("assistant")}
                    className="w-full py-2 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>AI से हिंदी में बात करें</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-2 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>लॉगिन या नया खाता बनाएं</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Government Information & Verification Disclaimer */}
      <footer className="bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] py-3 px-6 text-center text-xs text-slate-500 dark:text-[#AAB8CC] transition-colors">
        <p className="font-medium">
          Sarkari Saathi (सरकारी साथी) • सभी योजना विवरण भारत सरकार (India.gov.in, SSPY-UP, PM-Kisan) के आधिकारिक स्रोतों पर आधारित हैं।
        </p>
      </footer>
    </div>
  );
}
