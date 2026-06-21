import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base:     "#0E0F11",
        surface:  "#16181C",
        elevated: "#1E2128",
        border:   "#2A2D35",
        accent:   "#7C6FF7",
        success:  "#4ADE80",
        error:    "#F87171",
      },
    },
  },
  plugins: [],
};

export default config;
