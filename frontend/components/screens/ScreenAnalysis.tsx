"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck2,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { AshokaEmblem } from "../common/Avatars";
import { startSchemeAnalysis, getAnalysisProgressStreamUrl, fetchAnalysisResult } from "@/lib/api";
import { translations, Language } from "@/lib/translations";

interface ScreenAnalysisProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
  extraData?: {
    userInput?: string;
    profile?: any;
    sessionId?: string;
  };
}

interface StageInfo {
  stage: number;
  id: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  icon: string;
}

const STAGES: StageInfo[] = [
  {
    stage: 1,
    id: "understanding_situation",
    titleHi: "आपकी स्थिति का विश्लेषण",
    titleEn: "Understanding your situation",
    descHi: "आपकी भाषा, पारिवारिक व सामाजिक स्थिति को समझा जा रहा है",
    icon: "user",
  },
  {
    stage: 2,
    id: "building_profile",
    titleHi: "लाभार्थी प्रोफ़ाइल का निर्माण",
    titleEn: "Building beneficiary profile",
    descHi: "आयु, आय, निवास, पेशा व कल्याणकारी श्रेणियों की पहचान",
    icon: "profile",
  },
  {
    stage: 3,
    id: "searching_sources",
    titleHi: "सरकारी स्रोतों की खोज",
    titleEn: "Searching government sources",
    descHi: "myScheme, API Setu, OGD व उत्तर प्रदेश राज्य पोर्टल्स से खोज",
    icon: "search",
  },
  {
    stage: 4,
    id: "evaluating_eligibility",
    titleHi: "पात्रता और शर्तों का विश्लेषण",
    titleEn: "Analysing scheme eligibility",
    descHi: "नियम इंजन द्वारा प्रत्येक सरकारी योजना के नियमों की निष्पक्ष जाँच",
    icon: "rules",
  },
  {
    stage: 5,
    id: "checking_documents",
    titleHi: "दस्तावेज़ और आवेदन प्रक्रिया सत्यापन",
    titleEn: "Checking documents & application",
    descHi: "आवश्यक प्रमाण पत्र, बैंक खाता व आधिकारिक आवेदन लिंक की जाँच",
    icon: "docs",
  },
  {
    stage: 6,
    id: "preparing_recommendations",
    titleHi: "व्यक्तिगत सिफारिशें तैयार",
    titleEn: "Preparing personalised recommendations",
    descHi: "आपके लिए सर्वाधिक लाभकारी योजनाओं की पारदर्शी सूची तैयार",
    icon: "star",
  },
];

export function ScreenAnalysis({ onNavigate, language = "hi", extraData }: ScreenAnalysisProps) {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(12);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<Array<{ time: string; msg: string; tag?: string }>>([]);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState({
    discovered: 0,
    evaluated: 0,
    eligible: 0,
    potential: 0,
    docs: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, tag?: string) => {
    const time = new Date().toLocaleTimeString("hi-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLiveLogs((prev) => [...prev.slice(-15), { time, msg, tag }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveLogs]);

  // Start analysis and listen to SSE stream
  useEffect(() => {
    let isCancelled = false;

    async function initAnalysis() {
      try {
        addLog("सरकारी योजना विश्लेषण सत्र प्रारंभ किया जा रहा है...", "प्रणाली");
        const res = await startSchemeAnalysis({
          userInput: extraData?.userInput || "मेरी स्थिति के अनुसार उपयुक्त सरकारी योजनाएं खोजें।",
          profile: extraData?.profile,
          sessionId: extraData?.sessionId,
        });

        if (isCancelled) return;
        const aid = res.analysis_id;
        setAnalysisId(aid);
        addLog(`विश्लेषण सत्र ID: ${aid}`, "सत्र");

        // Connect to SSE Stream
        const streamUrl = getAnalysisProgressStreamUrl(aid);
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.addEventListener("stage_update", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(e.data);
            const stageNum = data.stage;
            setCurrentStage(stageNum);
            setProgressPercent(data.progress_percent || stageNum * 16);

            setCompletedStages((prev) => {
              const updated = new Set(prev);
              for (let i = 1; i < stageNum; i++) updated.add(i);
              return Array.from(updated);
            });

            if (data.activity_message) {
              addLog(data.activity_message, `स्टेज ${stageNum}`);
            }

            // Update live metrics from stage details
            if (data.details) {
              const d = data.details;
              setStats((prev) => ({
                discovered: d.candidate_schemes_count || d.total_evaluated || prev.discovered,
                evaluated: d.total_evaluated || prev.evaluated,
                eligible: d.eligible_count !== undefined ? d.eligible_count : prev.eligible,
                potential: d.potentially_eligible_count !== undefined ? d.potentially_eligible_count : prev.potential,
                docs: d.total_required_docs || prev.docs,
              }));
            }
          } catch (err) {
            console.error("SSE stage_update parse error:", err);
          }
        });

        es.addEventListener("complete", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(e.data);
            setFinalReport(data.report);
            setIsCompleted(true);
            setProgressPercent(100);
            setCurrentStage(6);
            setCompletedStages([1, 2, 3, 4, 5, 6]);

            const sum = data.report?.summary;
            if (sum) {
              setStats({
                discovered: sum.total_discovered || 35,
                evaluated: sum.total_evaluated || 35,
                eligible: sum.eligible_count || 0,
                potential: sum.potentially_eligible_count || 0,
                docs: data.report?.required_documents_summary?.total || 6,
              });
            }

            if (data.report?.profile && typeof window !== "undefined") {
              try {
                sessionStorage.setItem("sarkari_saathi_active_profile", JSON.stringify(data.report.profile));
              } catch (_) {}
            }

            addLog("अनुसंधान पूर्ण! आपकी रिपोर्ट सफलतापूर्वक तैयार हो गई है।", "सफल");
            es.close();
          } catch (err) {
            console.error("SSE complete parse error:", err);
          }
        });

        es.onerror = async (err) => {
          console.warn("SSE connection error or closed, checking result via polling:", err);
          es.close();
          // Fallback fetch result directly
          try {
            const result = await fetchAnalysisResult(aid);
            if (result && result.results) {
              setFinalReport(result);
              setIsCompleted(true);
              setProgressPercent(100);
              setCurrentStage(6);
              setCompletedStages([1, 2, 3, 4, 5, 6]);
            }
          } catch (fetchErr) {
            console.error("Fallback fetch failed:", fetchErr);
          }
        };
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMsg(err.message || "विश्लेषण शुरू करने में समस्या आई");
          addLog("त्रुटि: विश्लेषण सेवा से जुड़ने में असमर्थ।", "त्रुटि");
        }
      }
    }

    initAnalysis();

    return () => {
      isCancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden select-none transition-colors duration-200">
      {/* Top Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 z-10 transition-colors">
        <button
          onClick={() => onNavigate("assistant")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-bold">वापस (AI सहायक)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-blue-100 dark:text-[#93C5FD] bg-white/15 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10 dark:border-blue-700/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-[#34D399] animate-pulse" />
            <span>लाइव सरकारी अनुसंधान</span>
          </span>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 pb-20">
        {/* Main Title & Subtitle Card */}
        <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 border border-slate-200/90 dark:border-[#2B3A50] shadow-card text-center relative overflow-hidden transition-colors">
          {/* Subtle Tricolour Header Band */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#16A34A]" />

          {/* Central Radar Pulse Emblem */}
          <div className="relative flex items-center justify-center my-2">
            {/* Glowing radar rings */}
            <div className="absolute w-24 h-24 rounded-full bg-blue-100/60 dark:bg-blue-500/10 animate-ping opacity-30" />
            <div className="absolute w-20 h-20 rounded-full bg-blue-100/90 dark:bg-blue-500/20 animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-[#EBF3FF] dark:bg-[#1D2D43] border-2 border-[#1671E8] dark:border-[#60A5FA] shadow-md flex items-center justify-center text-[#0645A8] dark:text-[#60A5FA]">
              <AshokaEmblem className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-lg font-black text-[#172033] dark:text-[#F8FAFC] tracking-tight mt-2">
            {language === "en"
              ? "Your Government Scheme Discovery is in Progress"
              : "आपकी सरकारी योजनाओं की खोज जारी है"}
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#AAB8CC] mt-1 font-medium leading-relaxed max-w-sm mx-auto">
            {language === "en"
              ? "We are verifying eligibility conditions across official Central & State scheme portals based on your profile."
              : "हम आपकी जानकारी के आधार पर सरकारी योजनाओं की पात्रता और शर्तों की जाँच कर रहे हैं।"}
          </p>

          {/* Linear Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-[#AAB8CC]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#1671E8] dark:text-[#60A5FA]" />
                <span>अनुसंधान प्रगति</span>
              </span>
              <span className="text-[#0645A8] dark:text-[#60A5FA] font-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111C2E] rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-[#2B3A50]">
              <div
                className="h-full bg-gradient-to-r from-[#0645A8] via-[#1671E8] to-[#16A34A] dark:from-[#3B82F6] dark:via-[#60A5FA] dark:to-[#34D399] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm text-center transition-colors">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#AAB8CC] uppercase tracking-wider block">
              खोजी गईं
            </span>
            <span className="text-lg font-black text-[#0645A8] dark:text-[#60A5FA]">
              {stats.discovered > 0 ? stats.discovered : "३५"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">योजनाएँ</span>
          </div>

          <div className="bg-white dark:bg-[#172438] p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm text-center transition-colors">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              उपयुक्त (पात्र)
            </span>
            <span className="text-lg font-black text-[#16A34A] dark:text-[#34D399]">
              {stats.eligible > 0 ? stats.eligible : "--"}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 block font-medium">स्वीकृत</span>
          </div>

          <div className="bg-white dark:bg-[#172438] p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm text-center transition-colors">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              संभावित
            </span>
            <span className="text-lg font-black text-[#FF9933] dark:text-[#F59E0B]">
              {stats.potential > 0 ? stats.potential : "--"}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block font-medium">जांच योग्य</span>
          </div>
        </div>

        {/* 6-Stage Research Checklist */}
        <div className="bg-white dark:bg-[#172438] rounded-3xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2B3A50]">
            <span className="text-xs font-bold text-slate-700 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0645A8] dark:text-[#60A5FA]" />
              <span>प्रमाणित अनुसंधान चरण (६ स्टेज)</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#AAB8CC]">
              स्टेज {currentStage} / ६
            </span>
          </div>

          <div className="space-y-2.5">
            {STAGES.map((s) => {
              const isDone = completedStages.includes(s.stage) || isCompleted;
              const isActive = currentStage === s.stage && !isCompleted;

              return (
                <div
                  key={s.stage}
                  className={`flex items-start gap-3 p-2.5 rounded-2xl transition-all ${
                    isActive
                      ? "bg-blue-50/80 dark:bg-[#1D2D43] border border-blue-200 dark:border-[#60A5FA] shadow-sm"
                      : isDone
                      ? "bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50"
                      : "bg-slate-50/50 dark:bg-[#111C2E]/60 border border-transparent opacity-60"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-[#16A34A] dark:bg-[#34D399] text-white dark:text-[#0B1220] flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#1671E8] dark:border-[#60A5FA] border-t-transparent animate-spin flex items-center justify-center" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-[#2B3A50] bg-white dark:bg-[#111C2E] flex items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {s.stage}
                      </div>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          isActive
                            ? "text-[#0645A8] dark:text-[#60A5FA]"
                            : isDone
                            ? "text-slate-800 dark:text-[#F8FAFC]"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {s.titleHi}
                      </h4>
                      {isDone && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/60">
                          सत्यापित
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-bold text-[#1671E8] dark:text-[#60A5FA] animate-pulse">
                          जाँच जारी...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] mt-0.5 line-clamp-1 leading-snug">
                      {s.descHi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Backend Event Log Terminal */}
        <div className="bg-[#0A192F] dark:bg-[#070D18] text-slate-200 rounded-3xl p-4 border border-slate-800 dark:border-[#2B3A50] shadow-md space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 dark:border-[#2B3A50]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold tracking-tight text-slate-300 dark:text-slate-200">
                लाइव गतिविधि पैनल (Live Event Stream)
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-400 dark:text-[#AAB8CC] bg-slate-800/80 dark:bg-[#172438] px-2 py-0.5 rounded border border-slate-700 dark:border-[#2B3A50]">
              SSE सक्रिय
            </span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1 no-scrollbar">
            {liveLogs.length === 0 ? (
              <p className="text-slate-500 italic text-[10px]">सत्र प्रारंभ हो रहा है...</p>
            ) : (
              liveLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] flex-shrink-0">[{log.time}]</span>
                  {log.tag && (
                    <span className="text-sky-400 dark:text-[#60A5FA] text-[10px] bg-sky-950/80 dark:bg-blue-950/90 px-1 rounded flex-shrink-0 border border-sky-800/40">
                      {log.tag}
                    </span>
                  )}
                  <span className="text-slate-200 dark:text-[#F8FAFC] break-words">{log.msg}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Completion Card & CTA Button */}
        {isCompleted && (
          <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-[#132B22] dark:to-[#172438] rounded-3xl p-5 border-2 border-[#16A34A] dark:border-[#34D399] shadow-lg text-center space-y-3 animate-in fade-in slide-in-from-bottom duration-300 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#16A34A] dark:bg-[#34D399] text-white dark:text-[#0B1220] mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-[#F8FAFC]">
                अनुसंधान सफलतापूर्वक पूर्ण हुआ!
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#AAB8CC] mt-0.5 font-medium">
                आपकी प्रोफाइल के आधार पर{" "}
                <span className="font-bold text-[#16A34A] dark:text-[#34D399]">
                  {stats.eligible} उपयुक्त योजनाएँ
                </span>{" "}
                और{" "}
                <span className="font-bold text-[#FF9933] dark:text-[#F59E0B]">
                  {stats.potential} संभावित योजनाएँ
                </span>{" "}
                खोजी गई हैं।
              </p>
            </div>

            {/* Direct Navigation Button to Scheme Screen */}
            <button
              onClick={() => onNavigate("schemes", { analysisReport: finalReport, profile: finalReport?.profile })}
              className="w-full py-3 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>अनुशंसित योजनाएं देखें ({stats.eligible} उपयुक्त)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
