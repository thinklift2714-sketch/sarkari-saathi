"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, Users, Sparkles, Trash2, X, Check, Loader2, UserPlus } from "lucide-react";
import { fetchProfile, addFamilyMember, removeFamilyMember } from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth";

interface ScreenFamilyProps {
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenFamily({ onNavigate, language = "hi" }: ScreenFamilyProps) {
  const t = translations[language] || translations.hi;
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMember, setNewMember] = useState({
    name: "",
    relationship: "पुत्र",
    age: 20,
    occupation: "छात्र",
  });

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        if (data?.members) {
          setMembers(data.members);
        } else {
          setMembers([]);
        }
      })
      .catch((err) => {
        console.log("Profile members fetch error:", err);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await addFamilyMember(newMember);
      setMembers((prev) => [...prev, res.member]);
      setShowAddModal(false);
      setNewMember({ name: "", relationship: "पुत्र", age: 20, occupation: "छात्र" });
    } catch (err) {
      console.error(err);
      // Fallback local update
      setMembers((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          name: newMember.name,
          relationship: newMember.relationship,
          age: newMember.age,
          occupation: newMember.occupation,
        },
      ]);
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await removeFamilyMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setMembers((prev) => prev.filter((m) => m.id !== id));
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
              {t.familyHeader}
            </h1>
            <p className="text-[11px] text-blue-100 dark:text-[#AAB8CC] font-medium">
              {members.length} {language === "en" ? "Members Registered" : "सदस्य पंजीकृत"}
            </p>
          </div>
        </div>

        {/* + सदस्य जोड़ें button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#1D2D43] text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#253955] text-xs font-bold shadow-sm transition-all active:scale-95 border border-transparent dark:border-[#2B3A50]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addMemberBtn}</span>
        </button>
      </div>

      {/* Member Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 pb-20 overscroll-contain">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#0645A8]" />
            <p className="text-xs">परिवार विवरण लोड हो रहा है...</p>
          </div>
        ) : members.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-6 text-center border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-3 my-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {language === "en" ? "No Family Members Added" : "कोई परिवार सदस्य नहीं जोड़ा गया है"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#AAB8CC] leading-relaxed max-w-xs mx-auto">
                {language === "en"
                  ? "Add family members like spouse, children, or elderly parents to unlock family-specific schemes."
                  : "पति/पत्नी, बच्चों या वृद्ध माता-पिता को जोड़ें ताकि पूरे परिवार के लिए उपयुक्त योजनाएं मिल सकें।"}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addMemberBtn}</span>
            </button>
          </div>
        ) : (
          members.map((m) => {
            const isMain = m.relationship === "मुख्य सदस्य" || m.relationship === "Head of Household";

            return (
              <div
                key={m.id || m.name}
                className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200/90 dark:border-[#2B3A50] shadow-card flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center font-black text-base border-2 border-blue-200 dark:border-blue-800/60 flex-shrink-0">
                    {m.name ? m.name.charAt(0) : "स"}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-snug">
                      {m.name} ({m.relationship})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#AAB8CC] font-medium mt-0.5">
                      {language === "en" ? "Age:" : "उम्र:"} {m.age} {language === "en" ? "years" : "वर्ष"} | {m.occupation}
                    </p>
                  </div>
                </div>

                {!isMain && (
                  <button
                    onClick={() => handleDeleteMember(m.id)}
                    className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title={language === "en" ? "Delete member" : "सदस्य हटाएं"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* AI Recommendations Banner */}
        <div className="bg-[#EEF5FF] dark:bg-blue-950/30 border border-[#BED7F7] dark:border-blue-800/60 rounded-2xl p-4 flex items-start gap-3 transition-colors">
          <div className="w-7 h-7 rounded-xl bg-[#0645A8] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA]">
              {language === "en" ? "Welfare Tip" : "परिवार कल्याण सलाह"}
            </h4>
            <p className="text-[11px] text-[#24548A] dark:text-[#AAB8CC] leading-relaxed mt-1">
              {language === "en"
                ? "Adding daughter opens Sukanya Samriddhi Yojana. Adding elderly parents opens Old Age Pension (₹1,000/month)."
                : "बेटी को जोड़ने से 'सुकन्या समृद्धि योजना' और वृद्ध माता-पिता को जोड़ने से 'वृद्धावस्था पेंशन' (₹1,000/माह) के अवसर खुलते हैं।"}
            </p>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 dark:border-[#2B3A50] text-[#172033] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B3A50] pb-3">
              <h3 className="text-sm font-extrabold">
                {language === "en" ? "Add Family Member" : "नया परिवार सदस्य जोड़ें"}
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] block mb-1">
                  {language === "en" ? "Full Name *" : "पूरा नाम *"}
                </label>
                <input
                  type="text"
                  placeholder={language === "en" ? "e.g. Priya Kumari" : "जैसे: प्रिया कुमारी"}
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] block mb-1">
                    {language === "en" ? "Relationship" : "संबंध"}
                  </label>
                  <select
                    value={newMember.relationship}
                    onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                    className="w-full px-2 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] focus:outline-hidden cursor-pointer"
                  >
                    <option value="पुत्र">पुत्र (Son)</option>
                    <option value="पुत्री">पुत्री (Daughter)</option>
                    <option value="पति">पति (Husband)</option>
                    <option value="पत्नी">पत्नी (Wife)</option>
                    <option value="माता">माता (Mother)</option>
                    <option value="पिता">पिता (Father)</option>
                    <option value="अन्य">अन्य (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] block mb-1">
                    {language === "en" ? "Age (Years)" : "उम्र (वर्ष)"}
                  </label>
                  <input
                    type="number"
                    value={newMember.age}
                    onChange={(e) => setNewMember({ ...newMember, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-[#AAB8CC] block mb-1">
                  {language === "en" ? "Occupation" : "पेशा / व्यवसाय"}
                </label>
                <input
                  type="text"
                  placeholder={language === "en" ? "e.g. Student, Laborer" : "जैसे: छात्र, मजदूर, गृहिणी"}
                  value={newMember.occupation}
                  onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={handleAddMember}
              disabled={submitting || !newMember.name.trim()}
              className="w-full py-2.5 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === "en" ? "Save Member" : "सदस्य सहेजें"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
