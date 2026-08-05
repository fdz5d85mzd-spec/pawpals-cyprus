import type { Config } from "tailwindcss";

// Palette: bold yellow/black sports-site look (per user reference), swapped
// in under the same token names so components didn't need touching —
// `lime` is now the yellow accent, not green.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B0D",
        surface: "#161618",
        surface2: "#1E1E21",
        surface3: "#28282C",
        border: "#2E2E33",
        lime: "#FFC800",
        limeDim: "#D9A600",
        amber: "#F2A900",
        blue: "#E8E8EA",
        rose: "#E23D3D",
        ink: "#FAFAFA",
        muted: "#A8A8AC",
        dim: "#6B6B70",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "glow-lime": "radial-gradient(circle at 50% 0%, rgba(255,200,0,0.18), transparent 60%)",
        "card-sheen": "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 40%)",
        "fade-surface": "linear-gradient(180deg, rgba(11,11,13,0) 0%, #0B0B0D 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,200,0,0.2), 0 8px 24px -8px rgba(255,200,0,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
        lift: "0 20px 40px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "mascot-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "hair-sway": {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        "ball-bounce": {
          "0%, 100%": { transform: "translateY(0) scale(1, 1)" },
          "45%": { transform: "translateY(-46px) scale(1, 1)" },
          "55%": { transform: "translateY(-46px) scale(1, 1)" },
          "80%": { transform: "translateY(0) scale(1.15, 0.85)" },
          "90%": { transform: "translateY(0) scale(0.9, 1.1)" },
        },
        "ball-shadow": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.35" },
          "50%": { transform: "scale(0.55)", opacity: "0.15" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 25s linear infinite",
        "mascot-bob": "mascot-bob 3.2s ease-in-out infinite",
        "hair-sway": "hair-sway 2.4s ease-in-out infinite",
        "ball-bounce": "ball-bounce 1.6s cubic-bezier(0.5,0,1,0.5) infinite",
        "ball-shadow": "ball-shadow 1.6s cubic-bezier(0.5,0,1,0.5) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
