/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B1220",
          surface: "#111C2E",
          card: "#172438",
          elevated: "#1D2D43",
          text: "#F8FAFC",
          muted: "#AAB8CC",
          blue: "#60A5FA",
          saffron: "#F59E0B",
          green: "#34D399",
          border: "#2B3A50",
        },
        saathi: {
          blue: "#0645A8",
          blueLight: "#1671E8",
          blueHover: "#053a8d",
          blueBg: "#EBF3FF",
          bg: "#F7F9FC",
          card: "#FFFFFF",
          green: "#16A34A",
          greenLight: "#DFF5E5",
          greenBorder: "#86EFAC",
          saffron: "#FF9933",
          saffronLight: "#FFF3E0",
          saffronBorder: "#FDBA74",
          text: "#172033",
          muted: "#64748B",
          border: "#E2E8F0",
          red: "#DC2626",
          redLight: "#FEE2E2",
          yellow: "#EAB308",
          yellowLight: "#FEF9C3",
          purple: "#7C3AED",
          purpleLight: "#F3E8FF",
        },
      },
      fontFamily: {
        hindi: ['"Noto Sans Devanagari"', "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(6, 69, 168, 0.06)",
        cardHover: "0 6px 18px rgba(6, 69, 168, 0.12)",
        mic: "0 8px 25px rgba(6, 69, 168, 0.35)",
        micActive: "0 0 35px rgba(22, 113, 232, 0.65)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.2)", opacity: "0.3" },
          "100%": { transform: "scale(0.95)", opacity: "0.8" },
        },
        wave: {
          "0%, 100%": { height: "8px" },
          "50%": { height: "32px" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2s infinite ease-in-out",
        wave: "wave 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

