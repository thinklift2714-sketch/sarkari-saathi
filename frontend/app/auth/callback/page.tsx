"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw, Home } from "lucide-react";
import { AshokaEmblem } from "@/components/common/Avatars";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface CallbackErrorDetails {
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  resolutionHint: string;
  resolutionHintHi: string;
  code?: string;
}

function parseOAuthError(errorCode: string, errorDesc: string): CallbackErrorDetails {
  const code = (errorCode || "").toLowerCase();
  const desc = (errorDesc || "").toLowerCase();

  if (code.includes("provider_disabled") || desc.includes("provider is not enabled")) {
    return {
      title: "Google Provider Disabled",
      titleHi: "Google प्रदाता सक्षम नहीं है",
      message: "Google login is not enabled in your Supabase project settings.",
      messageHi: "आपके Supabase प्रोजेक्ट सेटिंग्स में Google लॉगिन सक्रिय नहीं किया गया है।",
      resolutionHint: "Go to Supabase Dashboard > Authentication > Providers > Google, toggle 'Enable Google provider', and save.",
      resolutionHintHi: "Supabase डैशबोर्ड > Authentication > Providers > Google में जाएं, 'Enable Google provider' चालू करें और सहेजें।",
      code: "provider_disabled",
    };
  }

  if (code.includes("redirect_uri_mismatch") || desc.includes("redirect_uri_mismatch")) {
    return {
      title: "Redirect URI Mismatch",
      titleHi: "रीडायरेक्ट URI मेल नहीं खाता",
      message: "The redirect URI is not registered in Google Cloud Console.",
      messageHi: "Google Cloud Console में अधिकृत रीडायरेक्ट URI पंजीकृत नहीं है।",
      resolutionHint: "In Google Cloud Console > Credentials > Authorized redirect URIs, add your Supabase callback: https://<project-ref>.supabase.co/auth/v1/callback",
      resolutionHintHi: "Google Cloud Console > Credentials > Authorized redirect URIs में Supabase कॉलबैक जोड़ें: https://<project-ref>.supabase.co/auth/v1/callback",
      code: "redirect_uri_mismatch",
    };
  }

  if (code.includes("redirect_to_not_allowed") || desc.includes("redirect_to") || desc.includes("not allowed")) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return {
      title: "Redirect URL Not Allowed",
      titleHi: "रीडायरेक्ट URL की अनुमति नहीं है",
      message: "Supabase has not whitelisted this site's callback URL.",
      messageHi: "Supabase ने इस साइट के कॉलबैक URL को अनुमति सूची में शामिल नहीं किया है।",
      resolutionHint: `In Supabase Dashboard > Authentication > URL Configuration > Redirect URLs, add: ${origin}/auth/callback`,
      resolutionHintHi: `Supabase डैशबोर्ड > Authentication > URL Configuration > Redirect URLs में जोड़ें: ${origin}/auth/callback`,
      code: "redirect_to_not_allowed",
    };
  }

  if (code.includes("bad_code_verifier") || desc.includes("code verifier") || desc.includes("pkce")) {
    return {
      title: "Authentication Session Expired",
      titleHi: "प्रमाणीकरण सत्र समाप्त हो गया",
      message: "PKCE code verifier expired or was initiated from a different browser context.",
      messageHi: "PKCE सत्यापन कोड समाप्त हो गया या किसी अन्य ब्राउज़र टैब से प्रारंभ हुआ था।",
      resolutionHint: "Please return to the login screen and click 'Continue with Google' again.",
      resolutionHintHi: "कृपया लॉगिन स्क्रीन पर लौटें और 'Google से आगे बढ़ें' पर पुनः क्लिक करें।",
      code: "bad_code_verifier",
    };
  }

  if (code.includes("invalid_client") || desc.includes("client secret") || desc.includes("invalid client")) {
    return {
      title: "Invalid Google Client Credentials",
      titleHi: "अमान्य Google क्लाइंट क्रेडेंशियल्स",
      message: "Google Client ID or Client Secret configured in Supabase is incorrect.",
      messageHi: "Supabase में कॉन्फ़िगर किया गया Google Client ID या Client Secret गलत है।",
      resolutionHint: "Check your OAuth credentials in Google Cloud Console and paste them into Supabase > Authentication > Providers > Google.",
      resolutionHintHi: "Google Cloud Console में OAuth क्रेडेंशियल्स जांचें और उन्हें Supabase > Providers > Google में पुनः दर्ज करें।",
      code: "invalid_client",
    };
  }

  return {
    title: "Authentication Failed",
    titleHi: "प्रमाणीकरण विफल रहा",
    message: errorDesc || "Could not complete authentication with Google.",
    messageHi: errorDesc || "Google के साथ प्रमाणीकरण पूरा नहीं हो सका।",
    resolutionHint: "Please try logging in again or use email sign-in.",
    resolutionHintHi: "कृपया पुनः प्रयास करें या ईमेल द्वारा लॉगिन करें।",
    code: errorCode || "oauth_callback_error",
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorDetails, setErrorDetails] = useState<CallbackErrorDetails | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;

    async function processCallback() {
      try {
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("error") || params.get("error_code");
        const errorDesc = params.get("error_description") || params.get("message");

        // 1. Check for OAuth error returned by provider / Supabase
        if (errorCode || errorDesc) {
          const parsed = parseOAuthError(errorCode || "error", errorDesc || "");
          if (!isCancelled) {
            setErrorDetails(parsed);
            setStatus("error");
          }
          return;
        }

        if (!isSupabaseConfigured()) {
          if (!isCancelled) {
            setErrorDetails({
              title: "Supabase Not Configured",
              titleHi: "Supabase कॉन्फ़िगर नहीं है",
              message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local.",
              messageHi: "frontend/.env.local में NEXT_PUBLIC_SUPABASE_URL या NEXT_PUBLIC_SUPABASE_ANON_KEY अनुपलब्ध है।",
              resolutionHint: "Add your Supabase credentials to frontend/.env.local and restart the server.",
              resolutionHintHi: "frontend/.env.local में Supabase क्रेडेंशियल्स दर्ज करें और सर्वर रीस्टार्ट करें।",
              code: "missing_env_vars",
            });
            setStatus("error");
          }
          return;
        }

        // 2. For implicit flow: Supabase auto-detects the hash fragment (#access_token=...)
        //    getSession() will return the session once the hash has been parsed by the SDK.
        //    We poll briefly to give the SDK time to process the URL hash.
        let session = null;
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session) {
            session = data.session;
            break;
          }
          // Wait 300ms between attempts
          await new Promise((r) => setTimeout(r, 300));
        }

        if (session) {
          const user = session.user;

          const googleName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "नागरिक";
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

          // Persist session locally
          localStorage.setItem("sarkari_saathi_token", session.access_token);
          localStorage.setItem("sarkari_saathi_user", JSON.stringify(user));

          if (!isCancelled) {
            setUserName(googleName);
            setStatus("success");
          }

          // Sync user profile to backend database
          try {
            await fetch(`${API_BASE}/profile`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                name: googleName,
                email: user.email,
                avatar_url: avatarUrl,
              }),
            });
          } catch (err) {
            console.warn("[AuthCallback] Backend profile sync note:", err);
          }

          setTimeout(() => {
            if (!isCancelled) router.replace("/");
          }, 800);
          return;
        }

        // 3. No session found after polling
        if (!isCancelled) {
          setErrorDetails({
            title: "Session Not Found",
            titleHi: "सत्र नहीं मिला",
            message: "Google login completed but no session was received. Please try again.",
            messageHi: "Google लॉगिन पूरा हुआ लेकिन सत्र प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।",
            resolutionHint: "Return to the login screen and click 'Login with Google' again.",
            resolutionHintHi: "लॉगिन स्क्रीन पर लौटें और 'Google से लॉगिन करें' पर पुनः क्लिक करें।",
            code: "no_session",
          });
          setStatus("error");
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorDetails({
            title: "Unexpected Callback Error",
            titleHi: "अनपेक्षित त्रुटि",
            message: err.message || "An unknown error occurred during authentication callback.",
            messageHi: err.message || "प्रमाणीकरण कॉलबैक के दौरान अज्ञात त्रुटि हुई।",
            resolutionHint: "Please try again or log in with your email address.",
            resolutionHintHi: "कृपया पुनः प्रयास करें या अपने ईमेल पते से लॉगिन करें।",
            code: "unexpected_error",
          });
          setStatus("error");
        }
      }
    }

    processCallback();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#070D18] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C2E] p-8 rounded-3xl border border-slate-200 dark:border-[#2B3A50] shadow-xl max-w-md w-full space-y-6 text-center transition-colors">
        {/* Back to Home — top-left, always visible */}
        <div className="flex items-center justify-start -mt-2 -ml-2">
          <button
            onClick={() => router.replace("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1D2D43] border border-slate-200 dark:border-[#2B3A50] text-slate-600 dark:text-[#AAB8CC] transition-colors text-xs font-bold shadow-xs active:scale-95"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>होम पर वापस जाएं</span>
          </button>
        </div>

        {/* Emblem & Branding */}
        <div className="flex items-center justify-center gap-2 text-[#0645A8] dark:text-[#60A5FA]">
          <AshokaEmblem className="w-9 h-9" />
          <span className="text-lg font-black tracking-tight">Sarkari Saathi</span>
        </div>

        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#0645A8] dark:text-[#60A5FA] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
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
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC]">
                Google प्रमाणीकरण सत्यापित किया जा रहा है...
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#AAB8CC]">
                Verifying your Google session with Supabase. Please wait...
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="space-y-4 py-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                लॉगिन सफल रहा! (Login Successful)
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                स्वागत है, {userName}!
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">
                Redirecting to your Sarkari Saathi dashboard...
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && errorDetails && (
          <div className="space-y-4 text-left animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-xs font-black">{errorDetails.titleHi}</p>
                <p className="text-[11px] opacity-80">{errorDetails.title}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#172438] rounded-2xl border border-slate-200 dark:border-[#2B3A50] space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">समस्या (Issue):</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{errorDetails.messageHi}</p>
                <p className="text-slate-500 dark:text-slate-500 text-[10px] italic">{errorDetails.message}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-[#2B3A50]">
                <span className="font-bold text-[#0645A8] dark:text-[#60A5FA]">समाधान (How to fix):</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">{errorDetails.resolutionHintHi}</p>
                <p className="text-slate-500 dark:text-slate-500 text-[10px] mt-0.5">{errorDetails.resolutionHint}</p>
              </div>

              {errorDetails.code && (
                <div className="pt-1 text-[10px] font-mono text-slate-400">
                  Code: {errorDetails.code}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => router.replace("/")}
                className="flex-1 py-2.5 px-4 bg-[#0645A8] hover:bg-[#1671E8] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>मुख्य स्क्रीन पर लौटें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Security Assurance Badge */}
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#2B3A50] text-[11px] text-slate-500 dark:text-[#AAB8CC]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>सुरक्षित Supabase OAuth प्रमाणीकरण</span>
        </div>
      </div>
    </div>
  );
}
