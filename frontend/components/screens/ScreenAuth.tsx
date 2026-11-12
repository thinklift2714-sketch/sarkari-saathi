"use client";

import React, { useState, useEffect } from "react";
import { AshokaEmblem } from "@/components/common/Avatars";
import { ThemeToggle } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  LogIn,
  KeyRound,
  FileCheck
} from "lucide-react";

export function ScreenAuth({
  onSuccess,
  language = "hi",
  setLanguage,
  canClose = false,
  onClose,
}: {
  onSuccess?: () => void;
  language?: "hi" | "en";
  setLanguage?: (lang: "hi" | "en") => void;
  canClose?: boolean;
  onClose?: () => void;
}) {
  const {
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOtp,
    devSignIn,
    isConfigured,
    user,
  } = useAuth();

  const [authStep, setAuthStep] = useState<"choose" | "phone" | "otp">("choose");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [devUserType, setDevUserType] = useState<"new" | "ramesh">("new");

  // Timer countdown for OTP
  useEffect(() => {
    let interval: any = null;
    if (authStep === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, resendTimer]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await signInWithGoogle();
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      setErrorMsg(
        language === "en"
          ? "Please enter a valid 10-digit mobile number."
          : "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।"
      );
      return;
    }

    setLoading(true);
    const res = await signInWithPhone(phoneNumber);
    setLoading(false);

    if (res.success) {
      setAuthStep("otp");
      setResendTimer(60);
    } else {
      setErrorMsg(res.error || "OTP भेजने में असमर्थ");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otp || otp.length < 6) {
      setErrorMsg(
        language === "en"
          ? "Please enter the 6-digit OTP."
          : "कृपया 6 अंकों का OTP दर्ज करें।"
      );
      return;
    }

    setLoading(true);
    const res = await verifyPhoneOtp(phoneNumber, otp);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setErrorMsg(res.error || "OTP सत्यापन विफल रहा");
    }
  };

  const handleDevLogin = async (type: "new" | "ramesh") => {
    setLoading(true);
    setErrorMsg(null);
    let name = "नया नागरिक";
    let phone = "+919876543299";
    if (type === "ramesh") {
      name = "रमेश कुमार";
      phone = "+919876543211";
    }

    const res = await devSignIn(name, phone);
    setLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } else {
      setErrorMsg(res.error || "लॉगिन विफल रहा");
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-[#F7F9FC] dark:bg-[#0B1220] text-slate-800 dark:text-[#F8FAFC] transition-colors p-4 sm:p-6">
      {/* Top Header: Branding, Language & Theme Switch */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3A50]">
        <div className="flex items-center gap-2.5">
          <AshokaEmblem className="w-8 h-8 flex-shrink-0" />
          <div>
            <h1 className="text-sm font-black text-[#0645A8] dark:text-[#60A5FA] tracking-tight">
              Sarkari Saathi
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-[#AAB8CC] font-bold">
              सरकारी साथी • भारत सरकार
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setLanguage && (
            <button
              onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] text-slate-700 dark:text-[#F8FAFC] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1D2D43] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
              <span>{language === "hi" ? "English" : "हिंदी"}</span>
            </button>
          )}
          <ThemeToggle language={language} />
        </div>
      </div>

      {/* Main Container Card */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {/* Tricolor Saffron/White/Green Accent */}
        <div className="h-1.5 w-20 bg-gradient-to-r from-[#FF9933] via-white to-[#16A34A] rounded-full mx-auto mb-5 shadow-xs" />

        {/* Heading & Subtitle */}
        <div className="text-center space-y-1.5 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === "en" ? "Welcome to Sarkari Saathi" : "सर्कारी साथी में आपका स्वागत है"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#AAB8CC] leading-relaxed">
            {language === "en"
              ? "Access verified government welfare schemes tailored to your family."
              : "सरकारी योजनाओं का लाभ, अब हर किसी के साथ।"}
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1: CHOOSE AUTH METHOD */}
        {authStep === "choose" && (
          <div className="space-y-3.5">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white dark:bg-[#172438] hover:bg-slate-50 dark:hover:bg-[#1D2D43] text-slate-800 dark:text-[#F8FAFC] font-bold text-sm rounded-2xl border border-slate-300 dark:border-[#2B3A50] shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#0645A8]" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{language === "en" ? "Continue with Google" : "Google से आगे बढ़ें"}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-[#2B3A50] w-full" />
              <span className="bg-[#F7F9FC] dark:bg-[#0B1220] px-3 text-xs text-slate-400 dark:text-[#AAB8CC] font-bold uppercase">
                {language === "en" ? "or" : "अथवा"}
              </span>
              <div className="border-t border-slate-200 dark:border-[#2B3A50] w-full" />
            </div>

            {/* Mobile Number Button */}
            <button
              onClick={() => {
                setErrorMsg(null);
                setAuthStep("phone");
              }}
              className="w-full py-3.5 px-4 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-white" />
              <span>
                {language === "en" ? "Continue with Mobile Number" : "मोबाइल नंबर से आगे बढ़ें"}
              </span>
            </button>

            {/* Development / Offline Evaluation Mode Banner */}
            {!isConfigured && (
              <div className="mt-5 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-[#F59E0B]">
                  <KeyRound className="w-4 h-4 flex-shrink-0" />
                  <span>लोकल टेस्ट मोड (Local Development Mode)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#AAB8CC] leading-relaxed">
                  Supabase क्रेडेंशियल्स दर्ज करने से पहले दो अलग-अलग उपयोगकर्ताओं के व्यक्तिगत डेटा को अलग-अलग जांचें:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDevLogin("new")}
                    className="py-2 px-2.5 bg-white dark:bg-[#172438] hover:bg-amber-100 dark:hover:bg-[#1D2D43] text-slate-800 dark:text-[#F8FAFC] border border-amber-300 dark:border-[#2B3A50] rounded-xl text-[11px] font-bold text-center transition-colors"
                  >
                    1. नया खाता (Blank)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin("ramesh")}
                    className="py-2 px-2.5 bg-white dark:bg-[#172438] hover:bg-amber-100 dark:hover:bg-[#1D2D43] text-slate-800 dark:text-[#F8FAFC] border border-amber-300 dark:border-[#2B3A50] rounded-xl text-[11px] font-bold text-center transition-colors"
                  >
                    2. रमेश कुमार (Test User)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PHONE INPUT */}
        {authStep === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] block">
                {language === "en" ? "Mobile Number" : "मोबाइल नंबर (10 अंक)"}
              </label>
              <div className="flex items-center rounded-2xl bg-white dark:bg-[#172438] border border-slate-300 dark:border-[#2B3A50] overflow-hidden focus-within:ring-2 focus-within:ring-[#0645A8] dark:focus-within:ring-[#60A5FA]">
                <span className="px-3 py-3 bg-slate-100 dark:bg-[#111C2E] border-r border-slate-200 dark:border-[#2B3A50] text-xs font-bold text-slate-600 dark:text-[#AAB8CC]">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  className="flex-1 px-3 py-3 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">
                {language === "en"
                  ? "We will send a 6-digit OTP to verify your phone."
                  : "सत्यापन के लिए आपके इस नंबर पर 6 अंकों का OTP भेजा जाएगा।"}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>OTP भेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <span>{language === "en" ? "Get OTP" : "OTP प्राप्त करें"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthStep("choose");
              }}
              className="w-full text-center text-xs font-bold text-slate-500 dark:text-[#AAB8CC] hover:underline"
            >
              ← {language === "en" ? "Back to options" : "अन्य विकल्प चुनें"}
            </button>
          </form>
        )}

        {/* STEP 3: OTP VERIFICATION */}
        {authStep === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2 text-center">
              <span className="text-xs text-slate-600 dark:text-[#AAB8CC]">
                {language === "en" ? "OTP sent to" : "OTP इस नंबर पर भेजा गया:"}{" "}
                <strong className="text-slate-900 dark:text-white">+91 {phoneNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => setAuthStep("phone")}
                className="text-[11px] text-[#0645A8] dark:text-[#60A5FA] font-bold block mx-auto underline"
              >
                {language === "en" ? "Change phone number" : "नंबर बदलें"}
              </button>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  className="w-full text-center tracking-[1em] text-2xl font-black px-4 py-3 bg-white dark:bg-[#172438] border border-slate-300 dark:border-[#2B3A50] rounded-2xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-[#0645A8] dark:focus:ring-[#60A5FA]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#16A34A] hover:bg-emerald-600 dark:bg-[#34D399] dark:text-slate-950 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>सत्यापित किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === "en" ? "Verify & Log In" : "सत्यापित करें और लॉगिन करें"}</span>
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center pt-1">
              {resendTimer > 0 ? (
                <span className="text-xs text-slate-400 dark:text-[#AAB8CC]">
                  {language === "en" ? "Resend OTP in" : "पुनः OTP भेजें:"} {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "Resend OTP" : "OTP पुनः भेजें"}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Footer: Privacy Notice & Trust Indicators */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#2B3A50] space-y-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-[#34D399]">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>डेटा गोपनीयता और सुरक्षा की गारंटी (Strict Row-Level Security)</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] leading-relaxed max-w-sm mx-auto">
          सर्कारी साथी कभी भी आपका आधार OTP या बैंक पासवर्ड नहीं मांगता। आपका व्यक्तिगत डेटा पूरी तरह सुरक्षित और केवल आपके खाते तक सीमित रहता है।
        </p>
      </div>
    </div>
  );
}

