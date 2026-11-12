"use client";

import React, { useState } from "react";
import { saveProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  IndianRupee,
  Users,
  HeartHandshake,
  Check,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight
} from "lucide-react";

export function ScreenOnboarding({
  onComplete,
  language = "hi",
}: {
  onComplete: () => void;
  language?: "hi" | "en";
}) {
  const { user, refreshProfile, updateLocalProfile } = useAuth();

  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("महिला");
  const [maritalStatus, setMaritalStatus] = useState<string>("विवाहित");
  const [state, setState] = useState<string>("उत्तर प्रदेश");
  const [district, setDistrict] = useState<string>("वाराणसी");
  const [occupation, setOccupation] = useState<string>("किसान");
  const [annualIncome, setAnnualIncome] = useState<string>("60000");
  const [familySize, setFamilySize] = useState<string>("3");
  const [landholding, setLandholding] = useState<string>("1.0");

  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Simple Speech Recognition in Hindi/English
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice("आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है। कृपया टाइप करें।");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "en" ? "en-IN" : "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice("सुन रहे हैं... बोलिए जैसे 'मेरा नाम रमेश कुमार है, उम्र 42 वर्ष'");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNotice(`सुना गया: "${transcript}"`);
        // Simple heuristic extraction
        const nameMatch = transcript.match(/नाम ([a-zA-Z\u0900-\u097F]+)/);
        if (nameMatch) setName(nameMatch[1]);
        const ageMatch = transcript.match(/(\d{1,2})\s*(वर्ष|साल|years?)/i);
        if (ageMatch) setAge(ageMatch[1]);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice("आवाज़ नहीं पहचानी जा सकी। कृपया लिखकर दर्ज करें।");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const profilePayload = {
      name: name.trim(),
      age: age ? parseInt(age) : 35,
      gender,
      marital_status: maritalStatus,
      state,
      district,
      occupation,
      annual_income: annualIncome ? parseFloat(annualIncome) : 50000,
      family_size: familySize ? parseInt(familySize) : 2,
      landholding: landholding ? parseFloat(landholding) : 0,
      is_onboarded: true,
    };

    try {
      const saved = await saveProfile(profilePayload);
      updateLocalProfile(saved);
      await refreshProfile();
      onComplete();
    } catch (e) {
      console.error("Failed to save profile:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-[#F7F9FC] dark:bg-[#0B1220] p-4 sm:p-6 transition-colors">
      <div className="max-w-md mx-auto w-full space-y-5 my-auto">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === "en" ? "Complete Your Profile" : "अपनी लाभार्थी प्रोफाइल बनाएं"}
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#AAB8CC] leading-relaxed">
            {language === "en"
              ? "We verify conditions and suggest only the schemes you qualify for."
              : "हम आपकी जानकारी के आधार पर केवल वही योजनाएं खोजेंगे जिनके लिए आप वास्तव में पात्र हैं।"}
          </p>
        </div>

        {/* Voice Input Assistant Trigger */}
        <div className="bg-white dark:bg-[#172438] p-3 rounded-2xl border border-slate-200 dark:border-[#2B3A50] shadow-sm flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-800 dark:text-white block">
              {language === "en" ? "Speak in Hindi or English" : "बोलकर विवरण भरें"}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC]">
              {voiceNotice || (language === "en" ? "Tap mic to speak your details" : "माइक दबाकर अपनी स्थिति बताएं")}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 rounded-full transition-all active:scale-95 shadow-md ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-[#0645A8] dark:bg-[#1671E8] text-white hover:bg-blue-700"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Profile Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 bg-white dark:bg-[#172438] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-[#2B3A50] shadow-sm">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
              <span>{language === "en" ? "Full Name *" : "पूरा नाम *"}</span>
            </label>
            <input
              type="text"
              required
              placeholder={language === "en" ? "e.g. Ramesh Kumar" : "जैसे: सीता देवी / रमेश कुमार"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-sm text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0645A8]"
            />
          </div>

          {/* Age & Gender Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
                <span>{language === "en" ? "Age (Years) *" : "उम्र (वर्ष) *"}</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={120}
                placeholder="45"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-sm text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0645A8]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
                <span>{language === "en" ? "Gender" : "लिंग"}</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="महिला">महिला (Female)</option>
                <option value="पुरुष">पुरुष (Male)</option>
                <option value="अन्य">अन्य (Other)</option>
              </select>
            </div>
          </div>

          {/* State & District Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
                <span>{language === "en" ? "State" : "राज्य"}</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="उत्तर प्रदेश">उत्तर प्रदेश (UP)</option>
                <option value="बिहार">बिहार (Bihar)</option>
                <option value="मध्य प्रदेश">मध्य प्रदेश (MP)</option>
                <option value="राजस्थान">राजस्थान (Rajasthan)</option>
                <option value="अन्य">अन्य (Other)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC]">
                {language === "en" ? "District" : "जिला"}
              </label>
              <input
                type="text"
                placeholder="वाराणसी, गोरखपुर..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-sm text-slate-900 dark:text-white font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* Occupation & Marital Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
                <span>{language === "en" ? "Occupation" : "व्यवसाय"}</span>
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="किसान">किसान (Farmer)</option>
                <option value="किसान की विधवा">किसान की विधवा</option>
                <option value="मजदूर">दैनिक मजदूर (Laborer)</option>
                <option value="गृहिणी">गृहिणी (Homemaker)</option>
                <option value="छात्र">छात्र (Student)</option>
                <option value="दुकानदार / छोटा व्यापारी">छोटा व्यापारी</option>
                <option value="अन्य">अन्य (Other)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC]">
                {language === "en" ? "Marital Status" : "वैवाहिक स्थिति"}
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="विवाहित">विवाहित (Married)</option>
                <option value="विधवा">विधवा (Widow)</option>
                <option value="अविवाहित">अविवाहित (Single)</option>
                <option value="तलाकशुदा">तलाकशुदा (Divorced)</option>
              </select>
            </div>
          </div>

          {/* Annual Income & Landholding */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#0645A8] dark:text-[#60A5FA]" />
                <span>{language === "en" ? "Annual Income" : "वार्षिक आय (₹)"}</span>
              </label>
              <input
                type="number"
                placeholder="60000"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-sm text-slate-900 dark:text-white font-medium focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#AAB8CC]">
                {language === "en" ? "Land (Acres)" : "भूमि (एकड़)"}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={landholding}
                onChange={(e) => setLandholding(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111C2E] border border-slate-200 dark:border-[#2B3A50] text-sm text-slate-900 dark:text-white font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3.5 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>सहेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <span>
                    {language === "en"
                      ? "Save Profile & View Schemes"
                      : "प्रोफ़ाइल सहेजें और योजनाएं देखें"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

