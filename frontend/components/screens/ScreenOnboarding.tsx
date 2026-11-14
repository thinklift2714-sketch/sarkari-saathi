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
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  FileCheck2,
  HeartHandshake,
  ShieldCheck,
  HelpCircle
} from "lucide-react";

const INDIAN_STATES = [
  "उत्तर प्रदेश",
  "बिहार",
  "मध्य प्रदेश",
  "राजस्थान",
  "हरियाणा",
  "दिल्ली",
  "महाराष्ट्र",
  "उत्तराखंड",
  "पंजाब",
  "झारखंड",
  "छत्तीसगढ़",
  "गुजरात",
  "पश्चिम बंगाल",
  "अन्य (Other)"
];

const UP_DISTRICTS = [
  "वाराणसी",
  "गोरखपुर",
  "प्रयागराज",
  "लखनऊ",
  "मेरठ",
  "अयोध्या",
  "कानपुर नगर",
  "आगरा",
  "बरेली",
  "अलीगढ़",
  "मुरादाबाद",
  "सहारनपुर",
  "झांसी",
  "गाजीपुर",
  "जौनपुर",
  "मिर्जापुर",
  "बस्ती",
  "आजमगढ़",
  "बलिया",
  "मथुरा",
  "अन्य (Other)"
];

const OCCUPATIONS = [
  { val: "किसान", label: "किसान (Farmer / Cultivator)" },
  { val: "खेतिहर मजदूर", label: "खेतिहर मजदूर (Agricultural Labourer)" },
  { val: "दैनिक वेतनभोगी श्रमिक", label: "दैनिक वेतनभोगी श्रमिक (Daily Wage Worker)" },
  { val: "विद्यार्थी / छात्र", label: "विद्यार्थी / छात्र (Student)" },
  { val: "बेरोजगार युवा", label: "बेरोजगार युवा (Unemployed Youth)" },
  { val: "छोटा दुकानदार / व्यवसायी", label: "छोटा दुकानदार / व्यवसायी (Small Business / Trader)" },
  { val: "कारीगर / शिल्पकार", label: "कारीगर / शिल्पकार (Artisan / Craftsman)" },
  { val: "गृहिणी", label: "गृहिणी (Homemaker)" },
  { val: "निजी क्षेत्र कर्मी", label: "निजी क्षेत्र कर्मी (Private Sector Employee)" },
  { val: "अन्य", label: "अन्य (Other)" }
];

const CASTE_CATEGORIES = [
  { val: "सामान्य", label: "सामान्य (General)" },
  { val: "अन्य पिछड़ा वर्ग (OBC)", label: "अन्य पिछड़ा वर्ग (OBC)" },
  { val: "अनुसूचित जाति (SC)", label: "अनुसूचित जाति (SC)" },
  { val: "अनुसूचित जनजाति (ST)", label: "अनुसूचित जनजाति (ST)" },
  { val: "आर्थिक रूप से कमजोर वर्ग (EWS)", label: "आर्थिक रूप से कमजोर (EWS)" },
  { val: "अन्य", label: "अन्य (Other)" },
  { val: "कहना नहीं चाहते", label: "कहना नहीं चाहते (Prefer not to say)" }
];

const EDUCATION_LEVELS = [
  { val: "निरक्षर / अनौपचारिक", label: "निरक्षर / अनौपचारिक (No formal schooling)" },
  { val: "प्राथमिक (1-5वीं)", label: "प्राथमिक (1-5th Pass)" },
  { val: "माध्यमिक (8वीं पास)", label: "माध्यमिक (8th Pass)" },
  { val: "हाईस्कूल (10वीं पास)", label: "हाईस्कूल (10th Pass)" },
  { val: "इंटरमीडिएट (12वीं पास)", label: "इंटरमीडिएट (12th Pass)" },
  { val: "आईटीआई / डिप्लोमा", label: "आईटीआई / पॉलिटेक्निक डिप्लोमा (ITI / Diploma)" },
  { val: "स्नातक (Graduation)", label: "स्नातक (Graduation - BA / BSc / BCom / BTech आदि)" },
  { val: "स्नातकोत्तर (Post-Graduation)", label: "स्नातकोत्तर (Post Graduation - MA / MSc / MCom आदि)" }
];

export function ScreenOnboarding({
  onComplete,
  language = "hi",
}: {
  onComplete: () => void;
  language?: "hi" | "en";
}) {
  const { user, profile, updateLocalProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // STEP 1: Personal Details
  const initialName = profile?.name && profile.name !== "नागरिक" && profile.name !== "नया नागरिक"
    ? profile.name
    : (user?.user_metadata?.full_name || user?.user_metadata?.name || "");

  const [name, setName] = useState<string>(initialName);
  const [age, setAge] = useState<string>(profile?.age ? String(profile.age) : "");
  const [gender, setGender] = useState<string>(profile?.gender || "कहना नहीं चाहते");
  const [state, setState] = useState<string>(profile?.state || "उत्तर प्रदेश");
  const [district, setDistrict] = useState<string>(profile?.district || "वाराणसी");
  const [villageOrTown, setVillageOrTown] = useState<string>(profile?.village_or_town || "");
  const [pincode, setPincode] = useState<string>(profile?.pincode || "");

  // STEP 2: Family & Financial
  const [familySize, setFamilySize] = useState<string>(profile?.family_size ? String(profile.family_size) : "1");
  const [annualIncome, setAnnualIncome] = useState<string>(profile?.annual_income ? String(profile.annual_income) : "");
  const [monthlyIncome, setMonthlyIncome] = useState<string>(profile?.monthly_income ? String(profile.monthly_income) : "");
  const [occupation, setOccupation] = useState<string>(profile?.occupation || "किसान");
  const [employmentStatus, setEmploymentStatus] = useState<string>(profile?.employment_status || "असंगठित क्षेत्र");
  const [ownsLand, setOwnsLand] = useState<boolean>(Boolean(profile?.owns_agricultural_land || (profile?.landholding && profile.landholding > 0)));
  const [landholding, setLandholding] = useState<string>(profile?.landholding ? String(profile.landholding) : "0");
  const [isBpl, setIsBpl] = useState<boolean>(Boolean(profile?.is_bpl));

  // STEP 3: Social & Education
  const [casteCategory, setCasteCategory] = useState<string>(profile?.caste_category || "सामान्य");
  const [maritalStatus, setMaritalStatus] = useState<string>(profile?.marital_status || "विवाहित");
  const [hasDisability, setHasDisability] = useState<boolean>(Boolean(profile?.has_disability));
  const [educationLevel, setEducationLevel] = useState<string>(profile?.education_level || "12वीं पास");
  const [educationStatus, setEducationStatus] = useState<string>(profile?.education_status || "पढ़ाई पूरी");
  const [courseOrDegree, setCourseOrDegree] = useState<string>(profile?.course_or_degree || "");
  const [institutionType, setInstitutionType] = useState<string>(profile?.institution_type || "सरकारी");
  const [academicMarks, setAcademicMarks] = useState<string>(profile?.academic_marks ? String(profile.academic_marks) : "");

  // STEP 4: Documents Availability
  const [hasAadhaar, setHasAadhaar] = useState<boolean>(profile?.has_aadhaar ?? true);
  const [hasBankAccount, setHasBankAccount] = useState<boolean>(profile?.has_bank_account ?? true);
  const [hasIncomeCert, setHasIncomeCert] = useState<boolean>(profile?.has_income_certificate ?? false);
  const [hasDomicileCert, setHasDomicileCert] = useState<boolean>(profile?.has_domicile_certificate ?? false);
  const [hasRationCard, setHasRationCard] = useState<boolean>(profile?.has_ration_card ?? false);

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg(language === "en" ? "Please enter your full name." : "कृपया अपना पूरा नाम दर्ज करें।");
        return false;
      }
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setErrorMsg(language === "en" ? "Please enter a valid age (1-120)." : "कृपया एक मान्य आयु (1 से 120 वर्ष) दर्ज करें।");
        return false;
      }
      if (!state.trim()) {
        setErrorMsg(language === "en" ? "Please select your state." : "कृपया अपना राज्य चुनें।");
        return false;
      }
      if (!district.trim()) {
        setErrorMsg(language === "en" ? "Please enter/select your district." : "कृपया अपना जिला दर्ज या चयन करें।");
        return false;
      }
    } else if (currentStep === 2) {
      if (!annualIncome.trim() || isNaN(parseFloat(annualIncome)) || parseFloat(annualIncome) < 0) {
        setErrorMsg(language === "en" ? "Please enter your approximate annual family income." : "कृपया अपने परिवार की लगभग वार्षिक आय दर्ज करें।");
        return false;
      }
      if (!occupation.trim()) {
        setErrorMsg(language === "en" ? "Please select your occupation." : "कृपया अपना व्यवसाय/पेशा चुनें।");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      age: parseInt(age, 10) || 18,
      gender: gender !== "कहना नहीं चाहते" ? gender : null,
      marital_status: maritalStatus,
      state: state.trim(),
      district: district.trim(),
      village_or_town: villageOrTown.trim() || null,
      pincode: pincode.trim() || null,
      family_size: parseInt(familySize, 10) || 1,
      annual_income: parseFloat(annualIncome) || 0,
      monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
      occupation: occupation.trim(),
      employment_status: employmentStatus,
      owns_agricultural_land: ownsLand,
      landholding: ownsLand ? (parseFloat(landholding) || 0) : 0,
      is_bpl: isBpl,
      caste_category: casteCategory,
      has_disability: hasDisability,
      education_level: educationLevel,
      education_status: educationStatus,
      course_or_degree: courseOrDegree.trim() || null,
      institution_type: institutionType,
      academic_marks: academicMarks ? parseFloat(academicMarks) : null,
      has_aadhaar: hasAadhaar,
      has_bank_account: hasBankAccount,
      has_income_certificate: hasIncomeCert,
      has_domicile_certificate: hasDomicileCert,
      has_ration_card: hasRationCard,
      is_onboarded: true,
    };

    try {
      const saved = await saveProfile(payload);
      if (updateLocalProfile) {
        updateLocalProfile(saved);
      }
      onComplete();
    } catch (err: any) {
      setErrorMsg(err.message || "प्रोफ़ाइल सहेजने में विफल। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FC] dark:bg-[#0B1220] overflow-y-auto px-4 py-6 text-slate-800 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-md mx-auto w-full space-y-5">
        {/* Tricolor Indicator Accent */}
        <div className="h-1.5 w-24 bg-gradient-to-r from-[#FF9933] via-white to-[#16A34A] rounded-full mx-auto shadow-xs" />

        {/* Title Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {language === "en" ? "Set Up Your Citizen Profile" : "अपनी लाभार्थी प्रोफ़ाइल बनाएं"}
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#AAB8CC]">
            {language === "en"
              ? "Your details are strictly private and used only to verify official scheme eligibility."
              : "आपकी जानकारी पूरी तरह सुरक्षित है और केवल सरकारी योजनाओं की पात्रता जांचने के लिए उपयोग होगी।"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-[#AAB8CC]">
            <span>
              {language === "en" ? `Step ${step} of 4` : `चरण ${step} / 4`} :{" "}
              {step === 1
                ? (language === "en" ? "Personal Details" : "व्यक्तिगत विवरण")
                : step === 2
                ? (language === "en" ? "Family & Income" : "पारिवारिक व आर्थिक")
                : step === 3
                ? (language === "en" ? "Social & Education" : "सामाजिक व शैक्षणिक")
                : (language === "en" ? "Documents" : "दस्तावेज़ उपलब्धता")}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-[#1D2D43] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0645A8] dark:bg-[#3B82F6] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Multi-Step Form Card */}
        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="bg-white dark:bg-[#172438] rounded-2xl p-5 border border-slate-200 dark:border-[#2B3A50] shadow-card space-y-4">

          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA]">
                <User className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "1. Personal Information" : "1. व्यक्तिगत विवरण"}
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {language === "en" ? "Full Name *" : "पूरा नाम *"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. सीता देवी / रमेश कुमार"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Age (Years) *" : "आयु (वर्ष) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="उदा. 42"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Gender (Optional)" : "लिंग (ऐच्छिक)"}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  >
                    <option value="महिला">महिला (Female)</option>
                    <option value="पुरुष">पुरुष (Male)</option>
                    <option value="अन्य">अन्य (Other)</option>
                    <option value="कहना नहीं चाहते">कहना नहीं चाहते</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "State *" : "राज्य *"}
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "District *" : "जिला *"}
                  </label>
                  {state === "उत्तर प्रदेश" ? (
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                    >
                      {UP_DISTRICTS.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="उदा. पटना / भोपाल"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Village / City (Optional)" : "गाँव / शहर (ऐच्छिक)"}
                  </label>
                  <input
                    type="text"
                    value={villageOrTown}
                    onChange={(e) => setVillageOrTown(e.target.value)}
                    placeholder="उदा. पिंडरा"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "PIN Code (Optional)" : "पिन कोड (ऐच्छिक)"}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="221001"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FAMILY & FINANCIAL */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA]">
                <IndianRupee className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "2. Family & Financial Situation" : "2. पारिवारिक एवं आर्थिक स्थिति"}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Family Members *" : "परिवार के कुल सदस्य *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={familySize}
                    onChange={(e) => setFamilySize(e.target.value)}
                    placeholder="उदा. 4"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Annual Family Income (₹) *" : "सालाना पारिवारिक आय (₹) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    placeholder="उदा. 60000"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {language === "en" ? "Occupation *" : "मुख्य पेशा / व्यवसाय *"}
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                >
                  {OCCUPATIONS.map((occ) => (
                    <option key={occ.val} value={occ.val}>{occ.label}</option>
                  ))}
                </select>
              </div>

              {/* Land Ownership */}
              <div className="p-3 bg-slate-50 dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-[#2B3A50] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                    {language === "en" ? "Does the family own agricultural land?" : "क्या परिवार के पास कृषि भूमि (खेत) है?"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOwnsLand(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ownsLand ? "bg-[#0645A8] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                      }`}
                    >
                      हाँ (Yes)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOwnsLand(false); setLandholding("0"); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        !ownsLand ? "bg-[#0645A8] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                      }`}
                    >
                      नहीं (No)
                    </button>
                  </div>
                </div>

                {ownsLand && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#2B3A50] flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {language === "en" ? "Total land size (in acres):" : "कुल जमीन (एकड़ में):"}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={landholding}
                      onChange={(e) => setLandholding(e.target.value)}
                      placeholder="1.5"
                      className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#2B3A50] bg-white dark:bg-[#172438] text-right"
                    />
                  </div>
                )}
              </div>

              {/* BPL Card Holder */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-[#2B3A50]">
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                  {language === "en" ? "Does the household belong to BPL category?" : "क्या परिवार बीपीएल (BPL) श्रेणी में आता है?"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBpl(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isBpl ? "bg-[#16A34A] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                    }`}
                  >
                    हाँ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBpl(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !isBpl ? "bg-[#0645A8] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                    }`}
                  >
                    नहीं
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SOCIAL & EDUCATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA]">
                <GraduationCap className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "3. Social Category & Education" : "3. सामाजिक वर्ग एवं शिक्षा"}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Social Category" : "सामाजिक वर्ग (जाति)"}
                  </label>
                  <select
                    value={casteCategory}
                    onChange={(e) => setCasteCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  >
                    {CASTE_CATEGORIES.map((cat) => (
                      <option key={cat.val} value={cat.val}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Marital Status (Optional)" : "वैवाहिक स्थिति (ऐच्छिक)"}
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  >
                    <option value="विवाहित">विवाहित (Married)</option>
                    <option value="अविवाहित">अविवाहित (Single)</option>
                    <option value="विधवा">विधवा (Widow)</option>
                    <option value="तलाकशुदा">तलाकशुदा (Divorced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  {language === "en" ? "Highest Educational Qualification" : "उच्चतम शैक्षणिक योग्यता"}
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                >
                  {EDUCATION_LEVELS.map((ed) => (
                    <option key={ed.val} value={ed.val}>{ed.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Current Status" : "वर्तमान स्थिति"}
                  </label>
                  <select
                    value={educationStatus}
                    onChange={(e) => setEducationStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  >
                    <option value="पढ़ाई पूरी">पढ़ाई पूरी (Completed)</option>
                    <option value="पढ़ाई जारी">पढ़ाई जारी (Studying)</option>
                    <option value="पढ़ाई छूट गई">पढ़ाई छूट गई (Dropped)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    {language === "en" ? "Course/Degree (Optional)" : "कोर्स / डिग्री (ऐच्छिक)"}
                  </label>
                  <input
                    type="text"
                    value={courseOrDegree}
                    onChange={(e) => setCourseOrDegree(e.target.value)}
                    placeholder="उदा. BA, B.Sc, ITI"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
                  />
                </div>
              </div>

              {/* Disability Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0B1220] rounded-xl border border-slate-200 dark:border-[#2B3A50]">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] block">
                    {language === "en" ? "Divyang / Disability Status (Optional)" : "दिव्यांगता की स्थिति (ऐच्छिक)"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    दिव्यांग पेंशन एवं उपकरण अनुदान योजनाओं के लिए
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasDisability(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      hasDisability ? "bg-[#0645A8] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                    }`}
                  >
                    हाँ
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasDisability(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !hasDisability ? "bg-[#0645A8] text-white" : "bg-white dark:bg-[#172438] text-slate-600 dark:text-slate-300 border dark:border-[#2B3A50]"
                    }`}
                  >
                    नहीं
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DOCUMENTS AVAILABILITY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3A50] text-[#0645A8] dark:text-[#60A5FA]">
                <FileCheck2 className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "4. Available Documents" : "4. उपलब्ध सरकारी दस्तावेज़"}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Mark which documents you currently have available. We never collect or store your document numbers."
                  : "जो दस्तावेज़ आपके पास उपलब्ध हैं उन पर टिक करें। हम कभी भी आपका आधार नंबर नहीं मांगते।"}
              </p>

              <div className="space-y-2.5">
                {[
                  { id: "aadhaar", label: "आधार कार्ड (Aadhaar Card)", val: hasAadhaar, set: setHasAadhaar },
                  { id: "bank", label: "बैंक खाता पासबुक (Bank Passbook)", val: hasBankAccount, set: setHasBankAccount },
                  { id: "income", label: "आय प्रमाण पत्र (Income Certificate)", val: hasIncomeCert, set: setHasIncomeCert },
                  { id: "domicile", label: "निवास प्रमाण पत्र (Domicile / Niwas Patra)", val: hasDomicileCert, set: setHasDomicileCert },
                  { id: "ration", label: "राशन कार्ड (Ration Card)", val: hasRationCard, set: setHasRationCard },
                ].map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => doc.set(!doc.val)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      doc.val
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60"
                        : "bg-slate-50 dark:bg-[#0B1220] border-slate-200 dark:border-[#2B3A50]"
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                      {doc.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        doc.val
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-[#172438]"
                      }`}
                    >
                      {doc.val && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#2B3A50] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2B3A50] text-slate-700 dark:text-[#CBD5E1] text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1D2D43] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === "en" ? "Back" : "पीछे"}</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#0645A8] hover:bg-[#1671E8] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ml-auto"
              >
                <span>{language === "en" ? "Next Step" : "आगे बढ़ें"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 ml-auto"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{language === "en" ? "Save & View Dashboard" : "प्रोफ़ाइल सहेजें एवं डैशबोर्ड देखें"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
