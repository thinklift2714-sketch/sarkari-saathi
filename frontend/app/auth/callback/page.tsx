"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session) {
          localStorage.setItem("sarkari_saathi_token", data.session.access_token);
        }
        // Redirect to homepage
        router.replace("/");
      } catch (err: any) {
        setErrorMsg(err.message || "प्रमाणीकरण त्रुटि");
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0B1220] flex items-center justify-center p-4 text-center">
      <div className="bg-white dark:bg-[#172438] p-8 rounded-3xl border border-slate-200 dark:border-[#2B3A50] shadow-xl max-w-sm w-full space-y-4">
        {errorMsg ? (
          <div className="text-red-500 font-bold space-y-2">
            <p className="text-base">लॉगिन विफल रहा</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
            <button
              onClick={() => router.replace("/")}
              className="mt-4 px-4 py-2 bg-[#0645A8] text-white text-xs font-bold rounded-xl"
            >
              मुख्य पृष्ठ पर जाएं
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-[#0645A8] dark:text-[#60A5FA] animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC]">
              प्रमाणीकरण सत्यापित किया जा रहा है...
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#AAB8CC]">
              कृपया प्रतीक्षा करें, आपको सर्कारी साथी पर भेजा जा रहा है।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

