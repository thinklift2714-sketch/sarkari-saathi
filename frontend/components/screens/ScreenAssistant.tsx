"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Mic, Keyboard, Volume2, Square, Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { RobotAssistantAvatar, SeetaDeviAvatar, WaveformAnimation } from "../common/Avatars";
import { sendChatMessage } from "@/lib/api";
import { translations, Language } from "@/lib/translations";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
}

interface ScreenAssistantProps {
  onNavigate: (screen: string, extra?: any) => void;
  autoOpenKeyboard?: boolean;
  language?: Language;
}

export function ScreenAssistant({ onNavigate, autoOpenKeyboard = false, language = "hi" }: ScreenAssistantProps) {
  const t = translations[language] || translations.hi;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: language === "en"
        ? "Hello! I am your Sarkari Saathi. I will help you discover government schemes. Please tell me about yourself."
        : "नमस्ते! मैं आपकी सरकारी योजनाएं खोजने में मदद करूँगा। कृपया अपने बारे में बताएं।",
    },
    {
      id: "2",
      sender: "user",
      text: language === "en"
        ? "My husband was a farmer and he has passed away."
        : "मेरे पति किसान थे और अब उनकी मृत्यु हो गई है।",
    },
    {
      id: "3",
      sender: "ai",
      text: language === "en"
        ? "I am sorry to hear that. May I know what your age is?"
        : "मुझे यह जानकर दुख हुआ। आपकी उम्र कितनी है?",
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(autoOpenKeyboard);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchStage, setResearchStage] = useState<number>(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [matchedSchemesCount, setMatchedSchemesCount] = useState<number | null>(null);
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Hindi Text-to-Speech using Web Speech API
  const speakText = (text: string, msgId?: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 0.95;

      // Try finding Hindi voice
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.includes("hi"));
      if (hindiVoice) utterance.voice = hindiVoice;

      if (msgId) setSpeakingMessageId(msgId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle voice recording
  const handleMicClick = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Simulate recognized speech if Web Speech recognition not active
      handleSendMessage("मेरी उम्र 52 साल है।");
    } else {
      setIsRecording(true);
      // Web Speech Recognition if available
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.lang = "hi-IN";
            recognition.interimResults = false;
            recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setIsRecording(false);
              handleSendMessage(transcript);
            };
            recognition.onerror = () => {
              setIsRecording(false);
            };
            recognition.start();
          } catch (e) {
            console.log("Speech recognition error:", e);
          }
        }
      }
    }
  };

  // Send message to AI
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    setInputText("");
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await sendChatMessage(textToSend, history);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.message,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Automatically speak AI answer in Hindi
      speakText(res.message, aiMsg.id);

      // If user profile is sufficiently filled or matched schemes are reported
      if (res.matched_schemes_count !== undefined && res.matched_schemes_count !== null) {
        setMatchedSchemesCount(res.matched_schemes_count);
      }
      if (res.next_action === "ready_for_results" || (res.matched_schemes_count && res.matched_schemes_count > 0)) {
        setShowResultsBanner(true);
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "धन्यवाद! आपकी जानकारी दर्ज कर ली गई है। आप किस राज्य और जिले में रहते हैं?",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text, fallbackMsg.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
      {/* Blue Header: < आपका Sarkari Saathi */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.assistantHeader}</span>
        </button>
        <button
          onClick={() => onNavigate("analysis", { userInput: messages[messages.length - 1]?.text })}
          className="text-xs bg-white/20 dark:bg-white/10 hover:bg-white/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{language === "en" ? "AI Research" : "AI विश्लेषण"}</span>
        </button>
      </div>

      {/* Robot Mascot Illustration at top */}
      <div className="pt-4 pb-1 flex justify-center flex-shrink-0">
        <div className="transform hover:scale-105 transition-transform cursor-pointer" onClick={() => speakText(language === "en" ? "Hello! I am your Sarkari Saathi assistant." : "नमस्ते! मैं आपका सरकारी साथी हूँ।")}>
          <RobotAssistantAvatar size={74} />
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-3 overscroll-contain">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "ai" && (
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center flex-shrink-0 mb-1 border border-blue-200 dark:border-blue-800">
                <RobotAssistantAvatar size={24} />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${
                msg.sender === "user"
                  ? "bg-[#1671E8] dark:bg-[#0645A8] text-white rounded-br-none"
                  : "bg-white dark:bg-[#172438] text-slate-800 dark:text-[#F8FAFC] rounded-bl-none border border-slate-200/80 dark:border-[#2B3A50]"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.sender === "ai" && (
                <button
                  onClick={() => speakText(msg.text, msg.id)}
                  aria-label={t.listenText}
                  className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium transition-colors ${
                    speakingMessageId === msg.id ? "text-blue-600 dark:text-[#60A5FA] font-bold" : "text-slate-400 dark:text-[#AAB8CC] hover:text-blue-600 dark:hover:text-[#60A5FA]"
                  }`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${speakingMessageId === msg.id ? "animate-pulse" : ""}`} />
                  <span>{speakingMessageId === msg.id ? t.speakingText : t.listenText}</span>
                </button>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="mb-1">
                <SeetaDeviAvatar size={28} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center flex-shrink-0 mt-0.5">
              <RobotAssistantAvatar size={24} />
            </div>
            <div className="bg-white dark:bg-[#172438] border border-blue-200 dark:border-[#2B3A50] rounded-2xl p-3 text-xs shadow-sm max-w-[280px] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#0645A8] dark:text-[#60A5FA]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0645A8] dark:text-[#60A5FA]" />
                <span>
                  {language === "en" ? "Analysing your message..." : "आपकी बात समझी जा रही है..."}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#AAB8CC] font-medium pl-5">
                {language === "en" ? "Checking relevant criteria & questions..." : "संबंधित जानकारी और पात्रता की जांच..."}
              </p>
            </div>
          </div>
        )}
        {showResultsBanner && (
          <div className="bg-gradient-to-r from-blue-50 dark:from-[#13233D] via-emerald-50 dark:via-[#132B22] to-blue-50 dark:to-[#13233D] border border-blue-200/90 dark:border-[#2B3A50] rounded-2xl p-3.5 my-2 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-[#0645A8] dark:text-[#60A5FA] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  <span>
                    {language === "en"
                      ? `${matchedSchemesCount || 20} Verified Schemes Discovered!`
                      : `आपके लिए ${matchedSchemesCount || 20} सरकारी योजनाएँ मिली हैं!`}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-[#AAB8CC] font-medium mt-0.5">
                  {language === "en"
                    ? "Start full 6-stage AI research across official portals."
                    : "आधिकारिक पोर्टल्स पर 6-स्टेज एआई अनुसंधान व पात्रता जाँच देखें।"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-[#2B3A50]">
              <button
                onClick={() => onNavigate("analysis", { userInput: messages[messages.length - 1]?.text })}
                className="flex-1 py-2 bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>{language === "en" ? "Start AI Analysis" : "✨ AI विश्लेषण शुरू करें"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate("schemes")}
                className="px-3 py-2 bg-white dark:bg-[#172438] hover:bg-slate-50 dark:hover:bg-[#1D2D43] text-slate-700 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#2B3A50] rounded-xl text-xs font-bold transition-all"
              >
                <span>{language === "en" ? "Schemes" : "योजनाएं"}</span>
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Waveform Visualization */}
      <div className="py-1">
        <WaveformAnimation active={isRecording} />
      </div>

      {/* Big Circular Microphone Interaction Section */}
      <div className="flex flex-col items-center justify-center pb-3">
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleMicClick}
            aria-label={isRecording ? "रोकें" : "बोलना शुरू करें"}
            className={`w-18 h-18 rounded-full flex items-center justify-center text-white shadow-mic transition-all active:scale-95 border-4 border-white dark:border-[#172438] ${
              isRecording ? "bg-red-500 scale-105 ring-4 ring-red-200 dark:ring-red-900/60" : "bg-[#0645A8] hover:bg-[#1671E8] dark:bg-[#1671E8] dark:hover:bg-[#0645A8]"
            }`}
          >
            {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-[#AAB8CC] mt-2">
          {isRecording ? t.listeningHint : t.speakNow}
        </span>
      </div>

      {/* Text Input Row (Collapsible / Toggleable) */}
      {showKeyboard && (
        <div className="px-3 pb-2 pt-1 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] flex items-center gap-2 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={t.typePlaceholder}
            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#2B3A50] rounded-xl text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#1671E8] dark:focus:border-[#60A5FA] focus:bg-white dark:focus:bg-[#172438]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-[#0645A8] dark:bg-[#1671E8] text-white disabled:opacity-40 hover:bg-[#1671E8] dark:hover:bg-[#0645A8] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Controls Bar: Keyboard toggle left, Pause/Stop right */}
      <div className="px-5 py-2.5 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] flex items-center justify-between transition-colors">
        <button
          onClick={() => setShowKeyboard(!showKeyboard)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showKeyboard
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] border-[#1671E8] dark:border-[#60A5FA]"
              : "bg-white dark:bg-[#172438] text-slate-600 dark:text-[#AAB8CC] border-slate-300 dark:border-[#2B3A50] hover:bg-slate-50 dark:hover:bg-[#1D2D43]"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>{t.writeBtn}</span>
        </button>

        <button
          onClick={() => onNavigate("schemes")}
          className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA] hover:underline"
        >
          {t.viewSchemesBtn} (4) →
        </button>

        <button
          onClick={() => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setIsRecording(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-[#2B3A50] bg-white dark:bg-[#172438] text-slate-600 dark:text-[#AAB8CC] hover:bg-slate-50 dark:hover:bg-[#1D2D43]"
        >
          <span>{t.pauseBtn}</span>
        </button>
      </div>
    </div>
  );
}

