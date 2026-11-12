"use client";

import React from "react";
import { Home, FileText, Mic, FolderCheck, User } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface BottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  language?: Language;
}

export function BottomNav({ activeScreen, onNavigate, language = "hi" }: BottomNavProps) {
  const t = translations[language] || translations.hi;

  const navItems = [
    { id: "home", label: t.navHome, icon: Home },
    { id: "schemes", label: t.navSchemes, icon: FileText },
    { id: "assistant", label: t.navSpeak, icon: Mic, isCenter: true },
    { id: "documents", label: t.navDocs, icon: FolderCheck },
    { id: "profile", label: t.navProfile, icon: User },
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#111C2E] border-t border-slate-200 dark:border-[#2B3A50] px-3 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)] transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className="relative -top-5 flex flex-col items-center">
                <button
                  onClick={() => onNavigate("assistant")}
                  aria-label={t.navSpeak}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0645A8] to-[#1671E8] text-white flex items-center justify-center shadow-mic active:scale-95 transition-transform hover:shadow-micActive border-4 border-white dark:border-[#111C2E]"
                >
                  <Mic className="w-6 h-6 animate-pulse" />
                </button>
                <span className="text-[11px] font-semibold text-[#0645A8] dark:text-[#60A5FA] mt-0.5">{item.label}</span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive ? "text-[#0645A8] dark:text-[#60A5FA] font-bold" : "text-slate-500 dark:text-[#AAB8CC] hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

