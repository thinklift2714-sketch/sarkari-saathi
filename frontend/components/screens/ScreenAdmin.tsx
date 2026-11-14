"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Search,
  Plus,
  RefreshCw,
  ShieldCheck,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Building,
  Filter,
  X,
  Loader2,
  Layers
} from "lucide-react";
import {
  fetchAdminSchemes,
  createAdminScheme,
  updateAdminScheme,
  deleteAdminScheme,
  verifyAdminScheme,
  fetchAdminSyncStatus,
  triggerAdminSync,
  fetchAdminSyncLogs
} from "@/lib/api";
import { Language } from "@/lib/translations";

interface ScreenAdminProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenAdmin({ onNavigate, language = "hi" }: ScreenAdminProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "sync" | "add">("catalog");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedScheme, setSelectedScheme] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state for add / edit
  const [formData, setFormData] = useState<any>({
    id: "",
    scheme_name: "",
    scheme_name_hindi: "",
    description: "",
    description_hindi: "",
    department: "",
    department_hindi: "",
    ministry: "",
    ministry_hindi: "",
    category: "social_welfare",
    category_hindi: "सामाजिक सुरक्षा",
    central_or_state: "central",
    applicable_states: ["All"],
    benefits: { description_hindi: "", monthly_amount: 0 },
    eligibility_conditions: { min_age: 18, max_annual_income: 200000 },
    required_documents: ["आधार कार्ड", "बैंक पासबुक", "आय प्रमाण पत्र"],
    application_mode: "online",
    official_website: "https://india.gov.in",
    official_application_url: "https://india.gov.in",
    application_fees: "निःशुल्क (₹0 / Free)",
    application_deadline: "वर्ष भर खुला (Ongoing)",
    data_verification_status: "verified",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [schemeList, sStatus, sLogs] = await Promise.all([
        fetchAdminSchemes({ status: statusFilter, search }),
        fetchAdminSyncStatus().catch(() => null),
        fetchAdminSyncLogs().catch(() => []),
      ]);
      setSchemes(schemeList);
      if (sStatus) setSyncStatus(sStatus);
      if (sLogs) setSyncLogs(sLogs);
    } catch (e: any) {
      console.warn("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await triggerAdminSync();
      notify("success", `सिंक्रोनाइज़ेशन पूर्ण: ${res.records_updated || 0} रिकॉर्ड अपडेट हुए`);
      loadData();
    } catch (e: any) {
      notify("error", e.message || "सिंक विफल रहा");
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyScheme = async (schemeId: string) => {
    try {
      await verifyAdminScheme(schemeId, "Admin", "Verified against official gazette / myScheme portal");
      notify("success", "योजना आधिकारिक रूप से सत्यापित की गई!");
      loadData();
    } catch (e: any) {
      notify("error", e.message || "सत्यापन विफल");
    }
  };

  const handleDeleteScheme = async (schemeId: string) => {
    if (!confirm("क्या आप वाकई इस योजना को सूची से हटाना चाहते हैं?")) return;
    try {
      await deleteAdminScheme(schemeId);
      notify("success", "योजना सफलतापूर्वक हटा दी गई");
      loadData();
    } catch (e: any) {
      notify("error", e.message || "हटाने में विफल");
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedScheme) {
        await updateAdminScheme(selectedScheme.id, formData);
        notify("success", "योजना सफलतापूर्वक अपडेट की गई!");
      } else {
        await createAdminScheme(formData);
        notify("success", "नई योजना सफलतापूर्वक जोड़ी गई!");
      }
      setIsEditing(false);
      setSelectedScheme(null);
      setActiveTab("catalog");
      loadData();
    } catch (err: any) {
      notify("error", err.message || "सेव करने में विफल");
    }
  };

  const openEditModal = (scheme: any) => {
    setSelectedScheme(scheme);
    setIsEditing(true);
    setFormData({
      id: scheme.id,
      scheme_name: scheme.scheme_name || "",
      scheme_name_hindi: scheme.scheme_name_hindi || "",
      description: scheme.description || "",
      description_hindi: scheme.description_hindi || "",
      department: scheme.department || "",
      department_hindi: scheme.department_hindi || "",
      ministry: scheme.ministry || "",
      ministry_hindi: scheme.ministry_hindi || "",
      category: scheme.category || "social_welfare",
      category_hindi: scheme.category_hindi || "सामाजिक सुरक्षा",
      central_or_state: scheme.central_or_state || "central",
      applicable_states: scheme.applicable_states || ["All"],
      benefits: scheme.benefits || { description_hindi: "" },
      eligibility_conditions: scheme.eligibility_conditions || {},
      required_documents: scheme.required_documents || [],
      application_mode: scheme.application_mode || "online",
      official_website: scheme.official_website || "https://india.gov.in",
      official_application_url: scheme.official_application_url || scheme.official_website || "https://india.gov.in",
      application_fees: scheme.application_fees || "निःशुल्क (₹0 / Free)",
      application_deadline: scheme.application_deadline || "वर्ष भर खुला (Ongoing)",
      data_verification_status: scheme.data_verification_status || "verified",
    });
    setActiveTab("add");
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors">
      {/* Admin Top Header */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">
            {language === "en" ? "Admin Governance" : "प्रशासनिक डेटा गवर्नेंस"}
          </span>
        </button>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-slate-900">
          Admin Portal
        </span>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between ${
            notification.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="bg-white dark:bg-[#172438] border-b border-slate-200 dark:border-[#2B3A50] px-4 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => {
            setIsEditing(false);
            setActiveTab("catalog");
          }}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "catalog"
              ? "border-[#0645A8] dark:border-[#60A5FA] text-[#0645A8] dark:text-[#60A5FA]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>योजना सूची ({schemes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sync")}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "sync"
              ? "border-[#0645A8] dark:border-[#60A5FA] text-[#0645A8] dark:text-[#60A5FA]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>डेटा स्रोत और सिंक</span>
        </button>

        <button
          onClick={() => {
            setIsEditing(false);
            setSelectedScheme(null);
            setFormData({
              id: "",
              scheme_name: "",
              scheme_name_hindi: "",
              description: "",
              description_hindi: "",
              department: "",
              department_hindi: "",
              category: "social_welfare",
              category_hindi: "सामाजिक सुरक्षा",
              central_or_state: "central",
              applicable_states: ["All"],
              benefits: { description_hindi: "" },
              eligibility_conditions: { min_age: 18, max_annual_income: 200000 },
              required_documents: ["आधार कार्ड", "बैंक पासबुक"],
              application_mode: "online",
              official_website: "https://india.gov.in",
              application_fees: "निःशुल्क (₹0 / Free)",
              application_deadline: "वर्ष भर खुला (Ongoing)",
              data_verification_status: "verified",
            });
            setActiveTab("add");
          }}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "add"
              ? "border-[#0645A8] dark:border-[#60A5FA] text-[#0645A8] dark:text-[#60A5FA]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isEditing ? "योजना संपादित करें" : "नई योजना जोड़ें"}</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* ==================================================================== */}
        {/* TAB 1: SCHEME CATALOG VIEW */}
        {/* ==================================================================== */}
        {activeTab === "catalog" && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="योजना, विभाग या पोर्टल खोजें..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-white dark:bg-[#172438] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-white dark:bg-[#172438] text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="all">सभी स्थिति (All)</option>
                <option value="verified">आधिकारिक सत्यापित (Verified)</option>
                <option value="api_synced">API सिंक (API Synced)</option>
                <option value="pending_review">समीक्षा प्रतीक्षारत (Pending Review)</option>
              </select>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> लोड हो रहा है...
              </div>
            ) : schemes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white dark:bg-[#172438] rounded-2xl border border-slate-200 dark:border-[#2B3A50]">
                कोई योजना नहीं मिली।
              </div>
            ) : (
              <div className="space-y-2.5">
                {schemes.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-sm space-y-2.5 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {s.scheme_name_hindi || s.scheme_name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.central_or_state === "central"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {s.central_or_state === "central" ? "केंद्रीय (Central)" : "राज्य (State)"}
                          </span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{s.data_verification_status || "verified"}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.department_hindi || s.department}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleVerifyScheme(s.id)}
                          title="सत्यापित मार्क करें"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="संपादित करें"
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScheme(s.id)}
                          title="हटाएं"
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-[#2B3A50]">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="font-mono truncate max-w-[200px]">{s.official_website}</span>
                      </span>

                      {s.last_verified_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>सत्यापित: {s.last_verified_at}</span>
                        </span>
                      )}

                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        दस्तावेज: {s.required_documents?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: DATA SOURCES & SYNC VIEW */}
        {/* ==================================================================== */}
        {activeTab === "sync" && (
          <div className="space-y-4">
            {/* Top Sync Actions Header */}
            <div className="bg-white dark:bg-[#172438] p-4 rounded-2xl border border-slate-200 dark:border-[#2B3A50] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  आधिकारिक सरकारी डेटा सिंक इंजन
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  myScheme, API Setu, OGD Data.gov.in और राज्य पोर्टलों से योजनाओं का वास्तविक समय समन्वय।
                </p>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={syncing}
                className="py-2.5 px-4 rounded-xl bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "सिंक हो रहा है..." : "अभी सिंक करें (Sync Now)"}</span>
              </button>
            </div>

            {/* Configured Sources Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(syncStatus?.sources || []).map((src: any) => (
                <div
                  key={src.source_id}
                  className="bg-white dark:bg-[#172438] p-4 rounded-2xl border border-slate-200 dark:border-[#2B3A50] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{src.source_name}</h4>
                      <p className="text-[11px] text-blue-600 font-mono truncate">{src.source_url}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        src.status === "connected"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {src.status_label || src.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">{src.message}</p>

                  {src.registration_url && (
                    <div className="pt-1">
                      <a
                        href={src.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#0645A8] hover:underline inline-flex items-center gap-1"
                      >
                        <span>पोर्टल पर API कुंजी हेतु आवेदन करें</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sync Audit Trail */}
            <div className="bg-white dark:bg-[#172438] p-4 rounded-2xl border border-slate-200 dark:border-[#2B3A50] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                सिंक्रोनाइज़ेशन ऑडिट लॉग्स (Sync Audit Logs)
              </h3>

              <div className="space-y-2">
                {syncLogs.map((log: any, i: number) => (
                  <div
                    key={log.id || i}
                    className="p-3 bg-slate-50 dark:bg-[#111C2E] rounded-xl border border-slate-200/80 dark:border-[#2B3A50] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {log.source}
                      </span>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.notes || log.message || "Sync completed successfully"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: ADD / EDIT SCHEME FORM */}
        {/* ==================================================================== */}
        {activeTab === "add" && (
          <form
            onSubmit={handleSaveForm}
            className="bg-white dark:bg-[#172438] p-5 rounded-2xl border border-slate-200 dark:border-[#2B3A50] space-y-4 max-w-2xl mx-auto"
          >
            <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 pb-2">
              {isEditing ? "योजना विवरण संपादित करें" : "नई सरकारी योजना जोड़ें"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">योजना का नाम (हिंदी)*</label>
                <input
                  required
                  type="text"
                  value={formData.scheme_name_hindi}
                  onChange={(e) => setFormData({ ...formData, scheme_name_hindi: e.target.value })}
                  placeholder="उदा. प्रधानमंत्री किसान सम्मान निधि"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Scheme Name (English)*</label>
                <input
                  required
                  type="text"
                  value={formData.scheme_name}
                  onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                  placeholder="e.g. PM Kisan Samman Nidhi"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">संबंधित विभाग (हिंदी)*</label>
                <input
                  required
                  type="text"
                  value={formData.department_hindi}
                  onChange={(e) => setFormData({ ...formData, department_hindi: e.target.value })}
                  placeholder="उदा. कृषि एवं किसान कल्याण विभाग"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">स्तर (Level)*</label>
                <select
                  value={formData.central_or_state}
                  onChange={(e) => setFormData({ ...formData, central_or_state: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                >
                  <option value="central">केंद्रीय योजना (Central)</option>
                  <option value="state">राज्य योजना (State)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">आवेदन मोड (Application Mode)</label>
                <select
                  value={formData.application_mode}
                  onChange={(e) => setFormData({ ...formData, application_mode: e.target.value })}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                >
                  <option value="online">ऑनलाइन (Online)</option>
                  <option value="offline">ऑफ़लाइन (Offline)</option>
                  <option value="both">ऑनलाइन व ऑफ़लाइन दोनों (Both)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">आवेदन शुल्क (Application Fees)</label>
                <input
                  type="text"
                  value={formData.application_fees}
                  onChange={(e) => setFormData({ ...formData, application_fees: e.target.value })}
                  placeholder="निःशुल्क (₹0 / Free)"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">आधिकारिक वेबसाइट URL*</label>
                <input
                  required
                  type="url"
                  value={formData.official_website}
                  onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                  placeholder="https://pmkisan.gov.in"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">प्रत्यक्ष आवेदन पोर्टल URL</label>
                <input
                  type="url"
                  value={formData.official_application_url}
                  onChange={(e) => setFormData({ ...formData, official_application_url: e.target.value })}
                  placeholder="https://pmkisan.gov.in/RegistrationFormNew.aspx"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">संक्षिप्त विवरण (हिंदी)*</label>
              <textarea
                required
                rows={2}
                value={formData.description_hindi}
                onChange={(e) => setFormData({ ...formData, description_hindi: e.target.value })}
                placeholder="योजना के मुख्य लाभ और उद्देश्य..."
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
              />
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                आवश्यक दस्तावेज़ (कॉमा से अलग करें)
              </label>
              <input
                type="text"
                value={
                  Array.isArray(formData.required_documents)
                    ? formData.required_documents.join(", ")
                    : formData.required_documents
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    required_documents: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="आधार कार्ड, बैंक पासबुक, खतौनी"
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#111C2E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0645A8] text-white text-xs font-bold hover:bg-[#1671E8]"
              >
                {isEditing ? "अपडेट सुरक्षित करें" : "योजना जोड़ें"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
