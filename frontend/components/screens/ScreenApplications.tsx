"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, FileCheck, Clock, ExternalLink, Plus, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
import { fetchApplications } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface ScreenApplicationsProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
}

export function ScreenApplications({ schemeId, onNavigate }: ScreenApplicationsProps) {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchApplications()
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      })
      .catch((err) => {
        console.log("Apps fetch error:", err);
        setApps([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Blue Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">आवेदन इतिहास व स्थिति</span>
        </button>

        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-[#1D2D43] text-[#0645A8] dark:text-[#60A5FA] text-xs font-bold border border-transparent dark:border-[#2B3A50] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>नया आवेदन</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5 pb-20 overscroll-contain">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            आवेदन लोड हो रहे हैं...
          </div>
        ) : apps.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-6 text-center border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-3 my-8">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] rounded-2xl flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                कोई सक्रिय आवेदन नहीं मिला
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#AAB8CC] leading-relaxed max-w-xs mx-auto">
                आपने अभी तक किसी सरकारी योजना के लिए आवेदन दर्ज नहीं किया है। अपनी पात्रता जांचें और आवेदन प्रारंभ करें।
              </p>
            </div>
            <button
              onClick={() => onNavigate("schemes")}
              className="py-2.5 px-4 bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>योजनाएं खोजें और आवेदन करें</span>
            </button>
          </div>
        ) : (
          apps.map((app) => (
            <div
              key={app.id || app.application_reference}
              className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200/90 dark:border-[#2B3A50] shadow-card space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC]">
                    {app.scheme_name_hindi || "सरकारी योजना"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] font-medium">
                    {app.department_hindi}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-[#F59E0B] border border-amber-200 dark:border-amber-800/60">
                  CSC पर जमा
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#111C2E] p-3 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-[#2B3A50]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-[#AAB8CC]">संदर्भ संख्या (Ref No.):</span>
                  <span className="font-mono font-bold text-[#172033] dark:text-[#F8FAFC]">
                    {app.application_reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-[#AAB8CC]">आवेदन तिथि:</span>
                  <span className="font-semibold text-[#172033] dark:text-[#F8FAFC]">{app.applied_date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#34D399] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>दस्तावेज़ सत्यापन प्रक्रियाधीन</span>
                </div>

                {app.official_website && (
                  <a
                    href={app.official_website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:underline"
                  >
                    <span>पोर्टल ट्रैक</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
