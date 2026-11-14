"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  User,
  Calendar,
  MapPin,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Check,
  Loader2,
  LogOut,
  Trash2,
  ShieldAlert,
  X,
  Mail,
  Phone,
  IndianRupee
} from "lucide-react";
import { fetchProfile, saveProfile } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import { ThemeSelectorPill } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

interface ScreenProfileProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenProfile({ onNavigate, language = "hi" }: ScreenProfileProps) {
  const t = translations[language] || translations.hi;
  const { user, signOut, deleteAccount, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: 35,
    state: "उत्तर प्रदेश",
    district: "वाराणसी",
    occupation: "किसान",
    annual_income: 60000,
    marital_status: "विवाहित",
    gender: "महिला",
  });

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        if (data && data.name) {
          setFormData({
            name: data.name || "",
            age: data.age || 35,
            state: data.state || "उत्तर प्रदेश",
            district: data.district || "वाराणसी",
            occupation: data.occupation || "किसान",
            annual_income: data.annual_income || 60000,
            marital_status: data.marital_status || "विवाहित",
            gender: data.gender || "महिला",
          });
        }
      })
      .catch((err) => console.log("Profile load fallback:", err));
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("sarkari_saathi_active_profile", JSON.stringify(formData));
        } catch (_) {}
      }
      await saveProfile(formData);
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onNavigate("schemes", { profile: formData });
      }, 1000);
    } catch (err) {
      console.error(err);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await deleteAccount();
    setIsDeleting(false);
    setShowDeleteModal(false);
    if (res.success) {
      onNavigate("home");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] dark:bg-[#0B1220] transition-colors duration-200">
      {/* Top Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">
              {t.profileHeader}
            </h1>
            <p className="text-[11px] text-blue-100 dark:text-[#AAB8CC] font-medium">
              {t.profileProgress}
            </p>
          </div>
        </div>

        {user && (
          <button
            onClick={signOut}
            title={language === "en" ? "Sign Out" : "लॉगआउट"}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Sign Out" : "लॉगआउट"}</span>
          </button>
        )}
      </div>

      {/* Form Fields Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 pb-24 overscroll-contain">
        {/* User Account Identity Card */}
        {user && (
          <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#AAB8CC]">
              {language === "en" ? "Verified Account" : "सत्यापित खाता पहचान"}
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
              {user.email && (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] uppercase tracking-wider px-1">
          {t.personalInfoTitle}
        </h2>

        {/* Field 1: नाम */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {t.labelName}
            </label>
            <input
              type="text"
              placeholder={language === "en" ? "Enter your name" : "अपना नाम दर्ज करें"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Field 2: उम्र */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {t.labelAge}
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-slate-400 dark:text-[#AAB8CC] font-bold">
            {t.ageYears}
          </span>
        </div>

        {/* Field 3: राज्य */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {t.labelState}
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden cursor-pointer dark:bg-[#172438]"
            >
              <option value="उत्तर प्रदेश" className="dark:bg-[#172438]">उत्तर प्रदेश (Uttar Pradesh)</option>
              <option value="बिहार" className="dark:bg-[#172438]">बिहार (Bihar)</option>
              <option value="मध्य प्रदेश" className="dark:bg-[#172438]">मध्य प्रदेश (Madhya Pradesh)</option>
              <option value="राजस्थान" className="dark:bg-[#172438]">राजस्थान (Rajasthan)</option>
              <option value="अन्य" className="dark:bg-[#172438]">अन्य (Other)</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#AAB8CC] pointer-events-none" />
        </div>

        {/* Field 4: जिला */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {t.labelDistrict}
            </label>
            <input
              type="text"
              placeholder="वाराणसी, गोरखपुर, प्रयागराज..."
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Field 5: पेशा */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {t.labelOccupation}
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden cursor-pointer dark:bg-[#172438]"
            >
              <option value="किसान" className="dark:bg-[#172438]">{language === "en" ? "Farmer" : "किसान"}</option>
              <option value="किसान की विधवा" className="dark:bg-[#172438]">{language === "en" ? "Farmer's Widow" : "किसान की विधवा"}</option>
              <option value="मजदूर" className="dark:bg-[#172438]">{language === "en" ? "Labourer" : "मजदूर"}</option>
              <option value="गृहिणी" className="dark:bg-[#172438]">{language === "en" ? "Homemaker" : "गृहिणी"}</option>
              <option value="छात्र" className="dark:bg-[#172438]">{language === "en" ? "Student" : "छात्र"}</option>
              <option value="दुकानदार / छोटा व्यापारी" className="dark:bg-[#172438]">{language === "en" ? "Shopkeeper / Small Trader" : "दुकानदार / छोटा व्यापारी"}</option>
              <option value="अन्य" className="dark:bg-[#172438]">{language === "en" ? "Other" : "अन्य"}</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#AAB8CC] pointer-events-none" />
        </div>

        {/* Field 6: वार्षिक आय */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center gap-3 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-[#AAB8CC] block">
              {language === "en" ? "Annual Household Income" : "वार्षिक पारिवारिक आय (₹)"}
            </label>
            <input
              type="number"
              value={formData.annual_income}
              onChange={(e) => setFormData({ ...formData, annual_income: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm font-bold text-[#172033] dark:text-[#F8FAFC] bg-transparent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Theme Settings Section (Light / Dark / System) */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200/80 dark:border-[#2B3A50] shadow-card space-y-2.5 transition-colors">
          <div>
            <span className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC] block">
              {language === "en" ? "Appearance & Theme" : "थीम और दिखावट"}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">
              {language === "en" ? "Switch between Light, Dark, or System mode" : "लाइट, डार्क या सिस्टम मोड चुनें"}
            </span>
          </div>
          <div className="pt-1">
            <ThemeSelectorPill language={language} />
          </div>
        </div>

        {/* Security / Consent Banner */}
        <div className="bg-[#DFF5E5] dark:bg-emerald-950/40 border border-[#86EFAC] dark:border-emerald-800/60 rounded-2xl p-3 flex items-center gap-2.5 transition-colors">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-[#34D399] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#166534] dark:text-[#34D399]">
            {t.profileConsent}
          </span>
        </div>

        {/* Account Deletion Section (Part 10) */}
        {user && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 px-3 rounded-2xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === "en" ? "Delete My Account & Data" : "खाता और व्यक्तिगत डेटा हटाएं"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Save Action Button */}
      <div className="p-4 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0645A8] dark:bg-[#1671E8] hover:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-base shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t.savingText}</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check className="w-5 h-5" />
              <span>{t.savedSuccessText}</span>
            </>
          ) : (
            <span>{t.saveProfileBtn}</span>
          )}
        </button>
      </div>

      {/* Confirmation Modal for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-red-200 dark:border-red-900/60 text-slate-900 dark:text-white">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-black">
                {language === "en" ? "Delete Account Confirmation" : "खाता हटाने की पुष्टि"}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#AAB8CC] leading-relaxed">
              {language === "en"
                ? "Are you sure you want to permanently delete your account, family records, documents and scheme history? This action cannot be undone."
                : "क्या आप वाकई अपना खाता, परिवार विवरण, दस्तावेज़ और योजनाओं का इतिहास स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।"}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-[#2B3A50] text-slate-700 dark:text-[#F8FAFC] text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#1D2D43]"
              >
                {language === "en" ? "Cancel" : "रद्द करें"}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{language === "en" ? "Confirm Delete" : "हटाएं"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
