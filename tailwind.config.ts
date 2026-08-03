import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A1712",
        surface: "#101F18",
        surface2: "#152A20",
        border: "#1E3A2C",
        lime: "#C6F17A",
        amber: "#F2B705",
        blue: "#5B7FFF",
        ink: "#F3F6F1",
        muted: "#82988A",
        dim: "#5D7266",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
