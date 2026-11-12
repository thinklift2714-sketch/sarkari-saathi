"use client";

import React from "react";

export function AshokaEmblem({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: "32px", height: "32px", minWidth: "28px", minHeight: "28px", maxWidth: "36px", maxHeight: "36px", overflow: "hidden" }}
    >
      <svg
        viewBox="0 0 100 100"
        width="32"
        height="32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Outer ring */}
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" />
        {/* Inner hub */}
        <circle cx="50" cy="50" r="8" fill="currentColor" />
        {/* 24 spokes from hub to inner edge of ring */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 50 + 9 * Math.sin(angle);
          const y1 = 50 - 9 * Math.cos(angle);
          const x2 = 50 + 41 * Math.sin(angle);
          const y2 = 50 - 41 * Math.cos(angle);
          return (
            <line
              key={i}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke="currentColor"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function RobotAssistantAvatar({ size = 72 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full bg-gradient-to-b from-[#EBF3FF] to-[#D5E7FF] border-2 border-[#1671E8] shadow-md flex items-center justify-center overflow-hidden flex-shrink-0"
    >
      <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
        {/* Antennas */}
        <line x1="50" y1="20" x2="50" y2="10" stroke="#0645A8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="8" r="4" fill="#FF9933" />
        {/* Head */}
        <rect x="22" y="20" width="56" height="48" rx="18" fill="#FFFFFF" stroke="#0645A8" strokeWidth="3" />
        {/* Headphones */}
        <rect x="16" y="32" width="6" height="24" rx="3" fill="#1671E8" />
        <rect x="78" y="32" width="6" height="24" rx="3" fill="#1671E8" />
        {/* Face screen */}
        <rect x="30" y="30" width="40" height="26" rx="8" fill="#0A2540" />
        {/* Glowing Eyes */}
        <circle cx="41" cy="42" r="4.5" fill="#38BDF8" className="animate-pulse" />
        <circle cx="59" cy="42" r="4.5" fill="#38BDF8" className="animate-pulse" />
        {/* Smile */}
        <path d="M 44 49 Q 50 54 56 49" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Collar / Body */}
        <path d="M 28 72 L 72 72 L 80 95 L 20 95 Z" fill="#1671E8" />
        <circle cx="50" cy="82" r="3" fill="#FF9933" />
      </svg>
    </div>
  );
}

export function SeetaDeviAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full border-2 border-[#FF9933] overflow-hidden shadow-sm bg-gradient-to-tr from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background skin & hair */}
        <circle cx="50" cy="50" r="48" fill="#FED7AA" />
        {/* Dark hair */}
        <circle cx="50" cy="42" r="32" fill="#292524" />
        {/* Face */}
        <circle cx="50" cy="52" r="24" fill="#FDBA74" />
        {/* Saree drape over head (yellow-gold with border) */}
        <path d="M 16 50 C 16 22, 84 22, 84 50 C 80 40, 68 32, 50 32 C 32 32, 20 40, 16 50 Z" fill="#D97706" />
        <path d="M 18 52 C 18 24, 82 24, 82 52 C 78 44, 68 36, 50 36 C 32 36, 22 44, 18 52 Z" fill="#F59E0B" />
        {/* Red Bindi */}
        <circle cx="50" cy="46" r="2.8" fill="#DC2626" />
        {/* Eyes & smile */}
        <ellipse cx="42" cy="52" rx="2.5" ry="1.5" fill="#1C1917" />
        <ellipse cx="58" cy="52" rx="2.5" ry="1.5" fill="#1C1917" />
        <path d="M 45 61 Q 50 65 55 61" fill="none" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
        {/* Nose pin */}
        <circle cx="46" cy="55" r="1.2" fill="#FBBF24" />
        {/* Saree body */}
        <path d="M 12 100 Q 50 78 88 100 Z" fill="#B45309" />
        <path d="M 25 100 L 50 82 L 65 100 Z" fill="#EA580C" />
      </svg>
    </div>
  );
}

export function RamKumarAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full border-2 border-[#16A34A] overflow-hidden shadow-sm bg-gradient-to-tr from-green-100 to-emerald-200 flex items-center justify-center flex-shrink-0"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Skin */}
        <circle cx="50" cy="50" r="48" fill="#FED7AA" />
        {/* Hair */}
        <path d="M 26 40 C 26 22, 74 22, 74 40 C 66 30, 34 30, 26 40 Z" fill="#1C1917" />
        {/* Face */}
        <circle cx="50" cy="52" r="23" fill="#FDBA74" />
        {/* Eyes & smile */}
        <ellipse cx="42" cy="50" rx="2.2" ry="1.4" fill="#1C1917" />
        <ellipse cx="58" cy="50" rx="2.2" ry="1.4" fill="#1C1917" />
        <path d="M 44 61 Q 50 65 56 61" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        {/* Farmer gamcha / kurta */}
        <path d="M 15 100 Q 50 78 85 100 Z" fill="#FFFFFF" />
        <path d="M 32 80 Q 50 90 68 80 L 72 100 L 28 100 Z" fill="#16A34A" />
      </svg>
    </div>
  );
}

export function WaveformAnimation({ active = true }: { active?: boolean }) {
  const bars = [16, 28, 42, 60, 34, 52, 64, 48, 30, 18, 38, 55, 45, 25];
  return (
    <div className="flex items-center justify-center gap-1.5 h-16 px-4">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            height: active ? `${h}px` : "10px",
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${0.8 + (i % 3) * 0.3}s`,
          }}
          className={`w-1 rounded-full bg-[#1671E8] transition-all duration-300 ${
            active ? "animate-pulse" : "opacity-40"
          }`}
        />
      ))}
    </div>
  );
}

