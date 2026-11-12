"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2, Download, FileText, Upload, Check, Loader2, Info } from "lucide-react";
import { fetchDocumentChecklist, updateDocumentStatus } from "@/lib/api";
import { translations, Language } from "@/lib/translations";

interface ScreenDocumentsProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenDocuments({ schemeId = "scheme_up_widow_pension", onNavigate, language = "hi" }: ScreenDocumentsProps) {
  const t = translations[language] || translations.hi;
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedDocInfo, setSelectedDocInfo] = useState<any>(null);

  const loadData = () => {
    setLoading(true);
    fetchDocumentChecklist(schemeId)
      .then((data) => setChecklist(data))
      .catch((err) => console.error("Error loading checklist:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [schemeId]);

  const toggleStatus = async (item: any) => {
    const newStatus = item.status === "available" ? "missing" : "available";
    try {
      await updateDocumentStatus(item.document_name_hindi, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Sarkari Saathi - Document Checklist", 20, 20);
      doc.setFontSize(12);
      doc.text(`Scheme: ${checklist?.scheme_name_hindi || "Widow Pension Scheme"}`, 20, 30);
      doc.text(`Beneficiary: Seeta Devi (Varanasi, UP)`, 20, 38);
      doc.text(`Progress: ${checklist?.completed_count || 4}/${checklist?.total_count || 6} Completed`, 20, 46);
      doc.text("--------------------------------------------------", 20, 52);

      let y = 60;
      checklist?.items?.forEach((item: any, i: number) => {
        const mark = item.status === "available" ? "[AVAILABLE]" : "[REQUIRED / MISSING]";
        doc.text(`${i + 1}. ${item.document_name_hindi} - ${mark}`, 20, y);
        y += 10;
      });

      doc.text("Official Portal: https://sspy-up.gov.in", 20, y + 10);
      doc.save("Sarkari-Saathi-Checklist.pdf");
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const items = checklist?.items || [
    { id: "1", document_name_hindi: "आधार कार्ड", status: "available", is_required: true },
    { id: "2", document_name_hindi: "बैंक पासबुक", status: "available", is_required: true },
    { id: "3", document_name_hindi: "आय प्रमाण पत्र", status: "missing", is_required: true },
    { id: "4", document_name_hindi: "निवास प्रमाण पत्र", status: "missing", is_required: true },
    { id: "5", document_name_hindi: "विधवा प्रमाण पत्र", status: "missing", is_required: true },
    { id: "6", document_name_hindi: "पासपोर्ट आकार का फोटो", status: "available", is_required: true },
  ];

  const total = items.length;
  const completed = items.filter((it: any) => it.status === "available" || it.status === "uploaded").length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Header: < दस्तावेज़ चेकलिस्ट */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.checklistHeader}</span>
        </button>
      </div>

      {/* Progress Circle Section */}
      <div className="bg-white dark:bg-[#172438] py-5 px-4 flex flex-col items-center justify-center border-b border-slate-200 dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#2B3A50"
              strokeWidth="9"
              className="dark:stroke-[#2B3A50] stroke-[#E2E8F0]"
            />
            {/* Filled green ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#16A34A"
              strokeWidth="9"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * (completed / total))}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out dark:stroke-[#34D399]"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-black text-[#172033] dark:text-[#F8FAFC]">
              {completed}/{total}
            </span>
            <span className="text-xs font-bold text-[#16A34A] dark:text-[#34D399]">{t.completedText}</span>
          </div>
        </div>
      </div>

      {/* Document Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5 pb-20 overscroll-contain">
        {items.map((item: any) => {
          const isAvailable = item.status === "available" || item.status === "uploaded";

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#172438] rounded-2xl p-3.5 border border-slate-200/80 dark:border-[#2B3A50] shadow-card flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
            >
              {/* Left Side: Checkmark/Doc Icon + Title */}
              <div
                onClick={() => toggleStatus(item)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                {isAvailable ? (
                  <CheckCircle2 className="w-6 h-6 text-[#16A34A] dark:text-[#34D399] fill-emerald-100 dark:fill-emerald-950 flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-[#2B3A50] flex items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-[#111C2E]">
                    <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </div>
                )}

                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isAvailable ? "text-slate-800 dark:text-[#F8FAFC]" : "text-slate-700 dark:text-[#CBD5E1]"}`}>
                    {item.document_name_hindi}
                  </span>
                  {!isAvailable && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{t.badgeRequired}</span>
                  )}
                </div>
              </div>

              {/* Right Side: Status Badge / Upload Button */}
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <span className="text-xs font-bold text-[#16A34A] dark:text-[#34D399] bg-[#DFF5E5] dark:bg-emerald-950/60 border dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                    {t.badgeAvailable}
                  </span>
                ) : (
                  <button
                    onClick={() => toggleStatus(item)}
                    className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] border border-[#0645A8] dark:border-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#1D2D43] px-2.5 py-1 rounded-full transition-colors active:scale-95 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{t.badgeUpload}</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedDocInfo(item)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
                  aria-label="जानकारी"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Modal for How to Get Missing Document */}
      {selectedDocInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 border border-slate-200 dark:border-[#2B3A50]">
            <h3 className="text-base font-extrabold text-[#0645A8] dark:text-[#60A5FA]">
              {selectedDocInfo.document_name_hindi}
            </h3>
            <div className="text-xs space-y-2 text-slate-700 dark:text-[#AAB8CC]">
              <p>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{t.modalInstructions}: </span>
                {selectedDocInfo.instructions || "मान्य सरकारी प्रारूप में होना आवश्यक है।"}
              </p>
              <p>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{t.modalHowToGet}: </span>
                {selectedDocInfo.how_to_get || "नजदीकी जन सेवा केंद्र (CSC) अथवा तहसील कार्यालय से संपर्क करें।"}
              </p>
            </div>
            <button
              onClick={() => setSelectedDocInfo(null)}
              className="w-full py-2 bg-[#0645A8] dark:bg-[#1671E8] text-white rounded-xl text-xs font-bold"
            >
              {t.modalCloseBtn}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Download Checklist Button */}
      <div className="p-4 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0645A8] dark:bg-[#1671E8] hover:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.downloadingText}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{t.downloadChecklistBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
