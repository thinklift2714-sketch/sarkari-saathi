"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  Loader2,
  Info,
  Building2,
  X,
  Eye,
  Trash2,
  FileImage,
  FileBadge,
} from "lucide-react";
import { fetchDocumentChecklist, updateDocumentStatus } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth";

interface ScreenDocumentsProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

// ── localStorage helpers for uploaded files ───────────────────────────────────
const LS_DOCS_KEY = "sarkari_saathi_uploaded_docs";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64
  uploadedAt: string;
}

function lsGetDocs(): Record<string, UploadedFile[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_DOCS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (_) {
    return {};
  }
}

function lsSaveDocs(docs: Record<string, UploadedFile[]>) {
  localStorage.setItem(LS_DOCS_KEY, JSON.stringify(docs));
}

function lsAddFile(docKey: string, file: UploadedFile) {
  const docs = lsGetDocs();
  if (!docs[docKey]) docs[docKey] = [];
  docs[docKey].push(file);
  lsSaveDocs(docs);
}

function lsRemoveFile(docKey: string, fileName: string) {
  const docs = lsGetDocs();
  if (docs[docKey]) {
    docs[docKey] = docs[docKey].filter((f) => f.name !== fileName);
    if (docs[docKey].length === 0) delete docs[docKey];
  }
  lsSaveDocs(docs);
}

function lsGetFilesFor(docKey: string): UploadedFile[] {
  return lsGetDocs()[docKey] || [];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScreenDocuments({ schemeId = "scheme_up_widow_pension", onNavigate, language = "hi" }: ScreenDocumentsProps) {
  const t = translations[language] || translations.hi;
  const { profile } = useAuth();
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedDocInfo, setSelectedDocInfo] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile[]>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUploadKey = useRef<string>("");

  // Load uploaded docs from localStorage on mount
  useEffect(() => {
    setUploadedDocs(lsGetDocs());
  }, []);

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

  // Trigger the hidden file input for a specific document
  const handleUploadClick = (docKey: string) => {
    currentUploadKey.current = docKey;
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset so same file can be re-selected
      fileInputRef.current.click();
    }
  };

  // Handle file selection from device
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const docKey = currentUploadKey.current;

    // Validate: max 5MB, allowed types
    const MAX_SIZE = 5 * 1024 * 1024;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (file.size > MAX_SIZE) {
      setUploadError(language === "en" ? "File too large (max 5 MB)" : "फ़ाइल बहुत बड़ी है (अधिकतम 5 MB)");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setUploadError(language === "en" ? "Only JPG, PNG, WEBP, or PDF allowed" : "केवल JPG, PNG, WEBP या PDF अनुमत है");
      return;
    }

    setUploadingKey(docKey);
    try {
      const dataUrl = await fileToBase64(file);
      const uploaded: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      lsAddFile(docKey, uploaded);
      const refreshed = lsGetDocs();
      setUploadedDocs(refreshed);

      // Also mark document as "available" in backend/state
      const item = items.find((it: any) => getDocKey(it) === docKey);
      if (item && item.status !== "available" && item.status !== "uploaded") {
        await updateDocumentStatus(item.document_name_hindi, "uploaded").catch(() => {});
        loadData();
      }
    } catch (err) {
      setUploadError(language === "en" ? "Upload failed, please try again." : "अपलोड विफल, पुनः प्रयास करें।");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveFile = (docKey: string, fileName: string) => {
    lsRemoveFile(docKey, fileName);
    setUploadedDocs(lsGetDocs());
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const citizenName = profile?.name || "नागरिक (Citizen)";
      const location = profile?.district ? `${profile.district}, ${profile.state || "भारत"}` : (profile?.state || "भारत");

      doc.setFontSize(18);
      doc.text("Sarkari Saathi - Document Checklist", 20, 20);
      doc.setFontSize(12);
      doc.text(`Scheme: ${checklist?.scheme_name || checklist?.scheme_name_hindi || "Government Scheme"}`, 20, 30);
      doc.text(`Beneficiary: ${citizenName} (${location})`, 20, 38);
      doc.text(`Progress: ${completed}/${total} Collected`, 20, 46);
      doc.text("--------------------------------------------------", 20, 52);

      let y = 60;
      items?.forEach((item: any, i: number) => {
        const docKey = getDocKey(item);
        const files = lsGetFilesFor(docKey);
        const hasUploaded = files.length > 0;
        const isAvail = item.status === "available" || item.status === "uploaded" || hasUploaded;
        const mark = isAvail ? "[COLLECTED]" : "[REQUIRED / MISSING]";
        const name = item.document_name || item.document_name_hindi;
        doc.text(`${i + 1}. ${name} - ${mark}`, 20, y);
        if (hasUploaded) {
          doc.setFontSize(9);
          doc.text(`   Files: ${files.map((f) => f.name).join(", ")}`, 20, y + 5);
          doc.setFontSize(12);
          y += 12;
        } else if (item.why_needed) {
          doc.setFontSize(9);
          doc.text(`   Why: ${item.why_needed}`, 20, y + 5);
          doc.setFontSize(12);
          y += 12;
        } else {
          y += 8;
        }
      });

      const portal = checklist?.official_website || "https://india.gov.in";
      doc.text(`Official Portal: ${portal}`, 20, y + 8);
      doc.save("Sarkari-Saathi-Checklist.pdf");
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const getDocKey = (item: any) => `${schemeId}__${item.document_name_hindi || item.id}`;

  const items = checklist?.items || [
    { id: "1", document_name_hindi: "आधार कार्ड", status: "available", is_required: true },
    { id: "2", document_name_hindi: "बैंक पासबुक", status: "available", is_required: true },
    { id: "3", document_name_hindi: "आय प्रमाण पत्र", status: "missing", is_required: true },
    { id: "4", document_name_hindi: "निवास प्रमाण पत्र", status: "missing", is_required: true },
    { id: "5", document_name_hindi: "विधवा प्रमाण पत्र", status: "missing", is_required: true },
    { id: "6", document_name_hindi: "पासपोर्ट आकार का फोटो", status: "available", is_required: true },
  ];

  const total = items.length;
  const completed = items.filter((it: any) => {
    const docKey = getDocKey(it);
    return it.status === "available" || it.status === "uploaded" || (uploadedDocs[docKey]?.length > 0);
  }).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">

      {/* Hidden file input — shared across all document rows */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Upload error toast */}
      {uploadError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-fade-in-down pointer-events-none">
          {uploadError}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white dark:bg-[#172438] rounded-2xl p-4 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC] truncate pr-2">{previewFile.name}</p>
              <button onClick={() => setPreviewFile(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#1D2D43]">
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewFile.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewFile.dataUrl} alt={previewFile.name} className="w-full max-h-72 object-contain rounded-xl border border-slate-200 dark:border-[#2B3A50]" />
            ) : (
              <div className="flex flex-col items-center py-8 gap-3 text-slate-500">
                <FileBadge className="w-14 h-14 text-[#0645A8] dark:text-[#60A5FA]" />
                <p className="text-xs font-semibold">PDF Document</p>
                <a
                  href={previewFile.dataUrl}
                  download={previewFile.name}
                  className="text-xs font-bold text-white bg-[#0645A8] dark:bg-[#1671E8] px-4 py-2 rounded-full"
                >
                  Download PDF
                </a>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              {formatFileSize(previewFile.size)} • {new Date(previewFile.uploadedAt).toLocaleDateString("hi-IN")}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.checklistHeader}</span>
        </button>
      </div>

      {/* Progress Circle */}
      <div className="bg-white dark:bg-[#172438] py-5 px-4 flex flex-col items-center justify-center border-b border-slate-200 dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2B3A50" strokeWidth="9" className="dark:stroke-[#2B3A50] stroke-[#E2E8F0]" />
            <circle
              cx="50" cy="50" r="40" fill="transparent" stroke="#16A34A" strokeWidth="9"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * (completed / (total || 1)))}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out dark:stroke-[#34D399]"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-black text-[#172033] dark:text-[#F8FAFC]">{completed}/{total}</span>
            <span className="text-xs font-bold text-[#16A34A] dark:text-[#34D399]">{t.completedText}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] mt-2 text-center font-medium">
          {language === "en"
            ? "Tap 'Upload' to attach a file from your device"
            : "अपने फोन से दस्तावेज़ अपलोड करने के लिए 'अपलोड' बटन दबाएं"}
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0645A8] dark:text-[#60A5FA]" />
        </div>
      ) : (

        /* Document Items List */
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 pb-20 overscroll-contain">
          {items.map((item: any) => {
            const docKey = getDocKey(item);
            const uploadedFiles = uploadedDocs[docKey] || [];
            const hasUploaded = uploadedFiles.length > 0;
            const isAvailable = item.status === "available" || item.status === "uploaded" || hasUploaded;
            const isUploading = uploadingKey === docKey;

            return (
              <div
                key={item.id || docKey}
                className={`bg-white dark:bg-[#172438] rounded-2xl border shadow-card transition-all ${
                  isAvailable
                    ? "border-emerald-200 dark:border-emerald-800/50"
                    : "border-slate-200/80 dark:border-[#2B3A50]"
                }`}
              >
                {/* Main Row */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  {/* Left: Icon + Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isAvailable ? (
                      <CheckCircle2 className="w-6 h-6 text-[#16A34A] dark:text-[#34D399] fill-emerald-100 dark:fill-emerald-950 flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-[#2B3A50] flex items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-[#111C2E]">
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-bold ${isAvailable ? "text-slate-800 dark:text-[#F8FAFC]" : "text-slate-700 dark:text-[#CBD5E1]"}`}>
                          {language === "en" ? (item.document_name || item.document_name_hindi) : item.document_name_hindi}
                        </span>
                        {!isAvailable && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            {language === "en" ? "Required" : "अनिवार्य"}
                          </span>
                        )}
                        {hasUploaded && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                            {language === "en" ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""}` : `${uploadedFiles.length} फ़ाइल`}
                          </span>
                        )}
                      </div>

                      {(item.why_needed_hindi || item.why_needed) && (
                        <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] mt-0.5 line-clamp-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {language === "en" ? "Why needed: " : "क्यों चाहिए: "}
                          </span>
                          {language === "en" ? (item.why_needed || item.why_needed_hindi) : (item.why_needed_hindi || item.why_needed)}
                        </p>
                      )}

                      {(item.issuing_authority_hindi || item.issuing_authority) && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                          {language === "en" ? (item.issuing_authority || item.issuing_authority_hindi) : (item.issuing_authority_hindi || item.issuing_authority)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Upload / Status + Info */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUploading ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] px-2.5 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === "en" ? "Uploading..." : "अपलोड हो रहा है..."}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadClick(docKey)}
                        className={`text-xs font-bold border px-2.5 py-1 rounded-full transition-colors active:scale-95 flex items-center gap-1 ${
                          hasUploaded
                            ? "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                            : "text-[#0645A8] dark:text-[#60A5FA] border-[#0645A8] dark:border-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#1D2D43]"
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>{hasUploaded ? (language === "en" ? "Add More" : "और जोड़ें") : (language === "en" ? "Upload" : "अपलोड")}</span>
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

                {/* Uploaded Files Row */}
                {uploadedFiles.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-[#2B3A50] px-3.5 py-2.5 flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] rounded-xl px-2.5 py-1.5 max-w-full"
                      >
                        {file.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-[#2B3A50]"
                          />
                        ) : (
                          <FileImage className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-[#F8FAFC] truncate max-w-[100px]">{file.name}</span>
                          <span className="text-[9px] text-slate-400">{formatFileSize(file.size)}</span>
                        </div>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1 text-slate-400 hover:text-[#0645A8] dark:hover:text-[#60A5FA] transition-colors"
                          title={language === "en" ? "Preview" : "देखें"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFile(docKey, file.name)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title={language === "en" ? "Remove" : "हटाएं"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Modal */}
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
              onClick={() => {
                setSelectedDocInfo(null);
                handleUploadClick(getDocKey(selectedDocInfo));
              }}
              className="w-full py-2 bg-[#0645A8] dark:bg-[#1671E8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              {language === "en" ? "Upload This Document" : "यह दस्तावेज़ अपलोड करें"}
            </button>
            <button
              onClick={() => setSelectedDocInfo(null)}
              className="w-full py-2 bg-slate-100 dark:bg-[#111C2E] text-slate-700 dark:text-[#AAB8CC] rounded-xl text-xs font-bold"
            >
              {t.modalCloseBtn}
            </button>
          </div>
        </div>
      )}

      {/* Bottom: Download Checklist PDF */}
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
