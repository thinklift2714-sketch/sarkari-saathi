"use client";

import React, { useState } from "react";
import { ChevronLeft, MapPin, ExternalLink, ArrowRight, Phone, Building, X, CheckCircle2 } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface ScreenApplicationProcessProps {
  schemeId?: string;
  onNavigate: (screen: string, extra?: any) => void;
  language?: Language;
}

export function ScreenApplicationProcess({ schemeId = "scheme_up_widow_pension", onNavigate, language = "hi" }: ScreenApplicationProcessProps) {
  const t = translations[language] || translations.hi;
  const [showCscModal, setShowCscModal] = useState(false);

  const steps = language === "en" ? [
    {
      num: 1,
      title: "Gather Required Documents",
      desc: "Keep original and copies of Aadhaar, Bank Passbook, Income Certificate, Domicile Certificate, and Husband's Death Certificate ready.",
    },
    {
      num: 2,
      title: "Visit Nearest CSC Center or Govt Office",
      desc: "Visit your local authorized Jan Seva Kendra (CSC) or Block/Tehsil Social Welfare Department.",
    },
    {
      num: 3,
      title: "Submit Online Application Form",
      desc: "Fill the e-form through the CSC operator and scan & upload all required verified documents.",
    },
    {
      num: 4,
      title: "Collect Application Acknowledgment Receipt",
      desc: "Make sure to collect and keep the official receipt containing your Application Reference Number.",
    },
    {
      num: 5,
      title: "Track Application Status",
      desc: "Check verification and sanction progress online via the official portal or your CSC operator.",
    },
  ] : [
    {
      num: 1,
      title: "आवश्यक दस्तावेज़ इकट्ठा करें",
      desc: "आधार कार्ड, बैंक पासबुक, आय प्रमाण पत्र, निवास प्रमाण पत्र एवं पति का मृत्यु प्रमाण पत्र मूल प्रति में रखें।",
    },
    {
      num: 2,
      title: "नजदीकी CSC केंद्र या सरकारी कार्यालय जाएं",
      desc: "अपने क्षेत्र के मान्यता प्राप्त जन सेवा केंद्र (CSC VLE) अथवा ब्लॉक/तहसील समाज कल्याण कार्यालय जाएं।",
    },
    {
      num: 3,
      title: "आवेदन फॉर्म जमा करें",
      desc: "CSC संचालक से ऑनलाइन पोर्टल पर ई-फॉर्म भरवाएं और आवश्यक सभी दस्तावेज़ स्कैन करवाकर अपलोड कराएं।",
    },
    {
      num: 4,
      title: "आवेदन की रसीद प्राप्त करें",
      desc: "आवेदन क्रमांक (Application Reference Number) वाली पावती रसीद अवश्य प्राप्त करें।",
    },
    {
      num: 5,
      title: "आवेदन की स्थिति ट्रैक करें",
      desc: "पावती क्रमांक से आधिकारिक पोर्टल पर अथवा CSC केंद्र से अपनी पेंशन स्थिति की नियमित जांच करें।",
    },
  ];

  const nearbyCscCenters = [
    {
      name: "पिंडरा डिजिटल सेवा केंद्र (CSC)",
      operator: "राजेश कुमार वर्मा",
      phone: "+91 94501 23456",
      address: "मुख्य चौराहा, ब्लॉक रोड, पिंडरा, वाराणसी",
      distance: "1.2 किमी",
    },
    {
      name: "काशी जन सुविधा केंद्र",
      operator: "अमित कुमार मौर्य",
      phone: "+91 98390 65432",
      address: "नियर प्राथमिक विद्यालय, बाबतपुर, वाराणसी",
      distance: "2.8 किमी",
    },
    {
      name: "शिवपुर ई-मित्र CSC सेंटर",
      operator: "सुनील कुमार चौबे",
      phone: "+91 91250 98765",
      address: "थाना रोड, शिवपुर, वाराणसी",
      distance: "4.5 किमी",
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Header: < आवेदन प्रक्रिया */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("schemes")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 dark:hover:text-[#60A5FA] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.processHeader}</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4 pb-20 overscroll-contain">
        <div className="space-y-4 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-blue-200 dark:bg-[#2B3A50] z-0" />

          {steps.map((st) => (
            <div key={st.num} className="relative z-10 flex items-start gap-3.5">
              {/* Blue Circle Number */}
              <div className="w-9 h-9 rounded-full bg-[#1671E8] dark:bg-[#1D2D43] border-2 border-white dark:border-[#60A5FA] text-white dark:text-[#60A5FA] font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                {st.num}
              </div>

              {/* Step Content */}
              <div className="flex-1 bg-white dark:bg-[#172438] p-3.5 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-card transition-colors">
                <h3 className="text-sm font-extrabold text-[#172033] dark:text-[#F8FAFC] leading-snug">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#AAB8CC] font-medium mt-1 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Card: नजदीकी CSC केंद्र खोजें */}
        <div className="mt-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl p-4 border border-amber-200/90 dark:border-amber-800/60 shadow-card flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-[#EA580C] dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-[#F8FAFC]">
                नजदीकी CSC केंद्र खोजें
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">वाराणसी व नजदीकी जन सेवा केंद्र</p>
            </div>
          </div>

          <button
            onClick={() => setShowCscModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:text-[#1671E8] bg-white dark:bg-[#1D2D43] px-3 py-1.5 rounded-xl border border-blue-200 dark:border-[#2B3A50] shadow-sm active:scale-95 transition-colors"
          >
            <span>यहाँ क्लिक करें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Card: आधिकारिक वेबसाइट */}
        <div className="bg-white dark:bg-[#172438] rounded-2xl p-4 border border-slate-200 dark:border-[#2B3A50] shadow-card flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] flex items-center justify-center flex-shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-[#F8FAFC]">
                आधिकारिक वेबसाइट
              </h4>
              <p className="text-[11px] text-[#0645A8] dark:text-[#60A5FA] font-semibold">https://www.up.gov.in</p>
            </div>
          </div>

          <a
            href="https://sspy-up.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-blue-50 dark:bg-[#1D2D43] text-[#0645A8] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-[#253955] transition-colors border border-transparent dark:border-[#2B3A50]"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* CSC Locator Modal Popup */}
      {showCscModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#172438] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-[#2B3A50]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2B3A50] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-extrabold text-[#172033] dark:text-[#F8FAFC]">
                  नजदीकी CSC जन सेवा केंद्र
                </h3>
              </div>
              <button
                onClick={() => setShowCscModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#AAB8CC]">
              आपके पंजीकृत पते (<span className="font-bold text-[#0645A8] dark:text-[#60A5FA]">पिंडरा, वाराणसी</span>) के निकटतम 3 सक्रिय केंद्र:
            </p>

            <div className="space-y-3">
              {nearbyCscCenters.map((csc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-[#111C2E] p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#2B3A50] space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{csc.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                      {csc.distance}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#AAB8CC]">संचालक: {csc.operator}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{csc.address}</p>
                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={`tel:${csc.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0645A8] dark:text-[#60A5FA]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{csc.phone}</span>
                    </a>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      सत्यापित केंद्र
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCscModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] text-white text-xs font-bold"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
