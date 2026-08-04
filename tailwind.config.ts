import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080F0C",
        surface: "#101F18",
        surface2: "#152A20",
        surface3: "#1B3527",
        border: "#20402E",
        lime: "#C6F17A",
        limeDim: "#8FCB4A",
        amber: "#F2B705",
        blue: "#5B7FFF",
        rose: "#E0665A",
        ink: "#F3F6F1",
        muted: "#8AA398",
        dim: "#5D7266",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "glow-lime": "radial-gradient(circle at 50% 0%, rgba(198,241,122,0.16), transparent 60%)",
        "card-sheen": "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 40%)",
        "fade-surface": "linear-gradient(180deg, rgba(16,31,24,0) 0%, #080F0C 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(198,241,122,0.15), 0 8px 24px -8px rgba(198,241,122,0.25)",
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
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
