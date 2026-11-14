"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Mic,
  Keyboard,
  Volume2,
  Square,
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
  History,
  Plus,
  Trash2,
  X,
  MessageSquare,
  User as UserIcon,
  CheckCircle2
} from "lucide-react";
import { RobotAssistantAvatar, WaveformAnimation } from "../common/Avatars";
import {
  sendChatMessage,
  fetchConversations,
  createConversation,
  fetchConversation,
  deleteConversation,
  renameConversation
} from "@/lib/api";
import { translations, Language } from "@/lib/translations";
import { useAuth } from "@/lib/auth";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  createdAt?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

interface ScreenAssistantProps {
  onNavigate: (screen: string, extra?: any) => void;
  autoOpenKeyboard?: boolean;
  language?: Language;
}

const ACTIVE_CONV_STORAGE_KEY = "sarkari_active_conv_id";

export function ScreenAssistant({
  onNavigate,
  autoOpenKeyboard = false,
  language = "hi",
}: ScreenAssistantProps) {
  const t = translations[language] || translations.hi;
  const { user, profile } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(autoOpenKeyboard);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [matchedSchemesCount, setMatchedSchemesCount] = useState<number | null>(null);
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [extractedCitizenProfile, setExtractedCitizenProfile] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("sarkari_saathi_active_profile");
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return {};
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultGreeting: Message = {
    id: "init_greeting",
    sender: "ai",
    text: language === "en"
      ? "Hello! I am your Sarkari Saathi. I will help you discover and verify eligibility for official government welfare schemes. Please tell me about your family, occupation, or the assistance you need."
      : "नमस्ते! मैं सरकारी साथी (Sarkari Saathi) हूँ। मैं केंद्र व राज्य सरकार की कल्याणकारी योजनाओं की सही पात्रता जाँचने में आपकी मदद करता हूँ। कृपया बताएं कि आप किस प्रकार की योजना या सहायता की तलाश में हैं?",
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load conversations list and restore active or most recent conversation
  const loadConversationsList = async () => {
    try {
      setLoadingHistory(true);
      const list = await fetchConversations();
      if (Array.isArray(list)) {
        setConversations(list);
        return list;
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch conversations:", e);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      setIsLoading(true);
      const detail = await fetchConversation(convId);
      if (detail && Array.isArray(detail.messages)) {
        const mapped: Message[] = detail.messages.map((m: any) => ({
          id: m.id || String(Math.random()),
          sender: m.role === "assistant" ? "ai" : "user",
          text: m.content,
          createdAt: m.created_at,
        }));
        setMessages(mapped.length > 0 ? mapped : [defaultGreeting]);
        setActiveConvId(convId);
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, convId);
      }
    } catch (err) {
      console.warn("Error loading conversation:", err);
      setMessages([defaultGreeting]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function initChats() {
      const list = await loadConversationsList();
      if (!mounted) return;

      const savedConvId = localStorage.getItem(ACTIVE_CONV_STORAGE_KEY);
      if (savedConvId && list.some((c: any) => c.id === savedConvId)) {
        await loadConversationMessages(savedConvId);
      } else if (list.length > 0) {
        await loadConversationMessages(list[0].id);
      } else {
        // Fresh start
        setMessages([defaultGreeting]);
      }
    }

    initChats();

    return () => {
      mounted = false;
    };
  }, []);

  // Text-to-Speech using Web Speech API
  const speakText = (text: string, msgId?: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "en" ? "en-IN" : "hi-IN";
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find((v) =>
        language === "en" ? v.lang.includes("en") : v.lang.includes("hi")
      );
      if (matchVoice) utterance.voice = matchVoice;

      if (msgId) setSpeakingMessageId(msgId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Start a new conversation
  const handleStartNewChat = async () => {
    try {
      const newConv = await createConversation(
        language === "en" ? "New Conversation" : "नया संवाद"
      );
      if (newConv && newConv.id) {
        setActiveConvId(newConv.id);
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, newConv.id);
        setMessages([defaultGreeting]);
        setShowHistoryDrawer(false);
        setShowResultsBanner(false);
        setMatchedSchemesCount(null);
        setExtractedCitizenProfile({});
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("sarkari_saathi_active_profile");
            sessionStorage.removeItem("sarkari_saathi_active_conv_id");
          } catch (_) {}
        }
        await loadConversationsList();
      }
    } catch (err) {
      console.warn("Error starting new conversation:", err);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      const updated = await loadConversationsList();
      if (activeConvId === convId) {
        if (updated.length > 0) {
          await loadConversationMessages(updated[0].id);
        } else {
          setActiveConvId(null);
          localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
          setMessages([defaultGreeting]);
        }
      }
    } catch (err) {
      console.warn("Delete conversation error:", err);
    }
  };

  // Toggle voice recording
  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.lang = language === "en" ? "en-IN" : "hi-IN";
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
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
        }
      }
    }
  };

  // Send message to AI & save permanently
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
      const history = messages
        .filter((m) => m.id !== "init_greeting")
        .map((m) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.text,
        }));

      // Pass active conversation ID so backend saves directly to conversation
      const res = await sendChatMessage(textToSend, history, profile, activeConvId || undefined);

      if (res.conversation_id && res.conversation_id !== activeConvId) {
        setActiveConvId(res.conversation_id);
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, res.conversation_id);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.message,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Speak AI answer
      speakText(res.message, aiMsg.id);

      // Results update
      if (res.extracted_data && Object.keys(res.extracted_data).length > 0) {
        setExtractedCitizenProfile((prev: any) => {
          // If the message introduces a fresh persona (res.is_fresh_profile), replace completely to prevent stale contamination
          const updated = res.is_fresh_profile ? { ...res.extracted_data } : { ...prev, ...res.extracted_data };
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("sarkari_saathi_active_profile", JSON.stringify(updated));
              if (res.conversation_id) {
                sessionStorage.setItem("sarkari_saathi_active_conv_id", res.conversation_id);
              }
            } catch (_) {}
          }
          return updated;
        });
      }

      if (res.matched_schemes_count !== undefined && res.matched_schemes_count !== null) {
        setMatchedSchemesCount(res.matched_schemes_count);
      }
      if (
        res.next_action === "ready_for_results" ||
        (res.matched_schemes_count && res.matched_schemes_count > 0)
      ) {
        setShowResultsBanner(true);
      }

      // Refresh conversations list in background
      loadConversationsList();
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text:
          language === "en"
            ? "Thank you! To help find the right schemes, please tell me which state and district you live in."
            : "धन्यवाद! सही सरकारी योजना खोजने के लिए कृपया बताएं कि आप किस राज्य और जिले में रहते हैं?",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text, fallbackMsg.id);
    } finally {
      setIsLoading(false);
    }
  };

  const userAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = profile?.name && profile.name !== "नागरिक" ? profile.name : (user?.user_metadata?.full_name || "नागरिक");

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#172033] dark:text-[#F8FAFC] overflow-hidden relative transition-colors duration-200">

      {/* Top Header: < Back | History Drawer | New Chat */}
      <div className="bg-[#0645A8] dark:bg-[#111C2E] text-white px-4 py-3 flex items-center justify-between shadow-md dark:border-b dark:border-[#2B3A50] flex-shrink-0 transition-colors">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-1.5 text-white hover:text-blue-100 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-base font-bold">{t.assistantHeader}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            title={language === "en" ? "Chat History" : "संवाद इतिहास"}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === "en" ? "History" : "इतिहास"}</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            title={language === "en" ? "New Chat" : "नया संवाद"}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === "en" ? "New" : "नया"}</span>
          </button>
        </div>
      </div>

      {/* Slide-in Conversation History Drawer */}
      {showHistoryDrawer && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end transition-all">
          <div className="w-72 sm:w-80 h-full bg-white dark:bg-[#111C2E] border-l border-slate-200 dark:border-[#2B3A50] shadow-2xl flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B3A50]">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <History className="w-4 h-4 text-[#0645A8] dark:text-[#60A5FA]" />
                <span>{language === "en" ? "Previous Chats" : "पूर्व संवाद इतिहास"}</span>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button in Drawer */}
            <button
              onClick={handleStartNewChat}
              className="mt-3 w-full py-2.5 px-3 bg-[#0645A8] hover:bg-[#1671E8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === "en" ? "+ Start New Chat" : "+ नया संवाद शुरू करें"}</span>
            </button>

            {/* List of Conversations */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-2">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#0645A8]" />
                  <span>लोड हो रहा है...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                  <p>{language === "en" ? "No previous chats saved" : "कोई पुराना संवाद नहीं है"}</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConvId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        loadConversationMessages(c.id);
                        setShowHistoryDrawer(false);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 group ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 font-bold"
                          : "bg-slate-50 dark:bg-[#172438] border-slate-200 dark:border-[#2B3A50] hover:bg-slate-100 dark:hover:bg-[#1D2D43]"
                      }`}
                    >
                      <div className="flex-1 truncate">
                        <p className="truncate text-slate-900 dark:text-white">{c.title || "संवाद"}</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {c.message_count} {language === "en" ? "messages" : "संदेश"}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        title={language === "en" ? "Delete chat" : "संवाद हटाएं"}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mascot at top */}
      <div className="pt-3 pb-1 flex justify-center flex-shrink-0">
        <div
          className="transform hover:scale-105 transition-transform cursor-pointer"
          onClick={() =>
            speakText(
              language === "en"
                ? "Hello! I am your Sarkari Saathi assistant."
                : "नमस्ते! मैं आपका सरकारी साथी हूँ।"
            )
          }
        >
          <RobotAssistantAvatar size={64} />
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
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs relative group ${
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
                    speakingMessageId === msg.id
                      ? "text-blue-600 dark:text-[#60A5FA] font-bold"
                      : "text-slate-400 dark:text-[#AAB8CC] hover:text-blue-600 dark:hover:text-[#60A5FA]"
                  }`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${speakingMessageId === msg.id ? "animate-pulse" : ""}`} />
                  <span>{speakingMessageId === msg.id ? t.speakingText : t.listenText}</span>
                </button>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="mb-1">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName}
                    className="w-7 h-7 rounded-full object-cover border border-blue-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {userName ? userName.charAt(0) : "U"}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center flex-shrink-0 mt-0.5">
              <RobotAssistantAvatar size={24} />
            </div>
            <div className="bg-white dark:bg-[#172438] border border-blue-200 dark:border-[#2B3A50] rounded-2xl p-3 text-xs shadow-xs max-w-[280px] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#0645A8] dark:text-[#60A5FA]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{language === "en" ? "Analyzing your request..." : "पात्रता एवं योजनाओं का विश्लेषण..."}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Results Banner when schemes are found */}
      {showResultsBanner && matchedSchemesCount !== null && matchedSchemesCount > 0 && (
        <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/40 dark:to-blue-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {language === "en"
                  ? `${matchedSchemesCount} Verified Schemes Found`
                  : `${matchedSchemesCount} प्रमाणित योजनाएं उपलब्ध हैं`}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {language === "en" ? "Ready for viewing" : "पात्रता एवं लाभ देखने के लिए तैयार"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("schemes", {
              profile: Object.keys(extractedCitizenProfile).length > 0 ? extractedCitizenProfile : undefined,
              conversationId: activeConvId || undefined
            })}
            className="px-3 py-1.5 bg-[#0645A8] hover:bg-[#1671E8] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>{language === "en" ? "View Schemes" : "योजनाएं देखें"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice / Waveform Area when recording */}
      {isRecording && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WaveformAnimation />
            <span className="text-xs font-bold text-[#0645A8] dark:text-[#60A5FA]">
              {language === "en" ? "Listening... Speak clearly" : "सुन रहे हैं... बोलिए"}
            </span>
          </div>
          <button
            onClick={() => setIsRecording(false)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>{language === "en" ? "Stop" : "रोकें"}</span>
          </button>
        </div>
      )}

      {/* Bottom Sticky Input Control Bar */}
      <div className="p-3 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-3 rounded-2xl transition-all ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-blue-50 dark:bg-blue-950/60 text-[#0645A8] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800"
            }`}
            title={language === "en" ? "Speak in Hindi / English" : "बोलकर पूछें"}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === "en"
                ? "Ask anything in English, Hindi, or Hinglish..."
                : "अपनी समस्या या आवश्यकता लिखें (हिंदी या English)..."
            }
            className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-[#2B3A50] bg-slate-50 dark:bg-[#172438] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0645A8]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-[#0645A8] hover:bg-[#1671E8] text-white disabled:opacity-40 transition-all flex items-center justify-center shadow-xs"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
