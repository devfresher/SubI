import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        card: {
          DEFAULT: "var(--card)",
          hover: "var(--card-hover)",
        },
        border: "var(--border)",
        gold: {
          DEFAULT: "var(--gold)",
          bright: "var(--gold-bright)",
          dim: "var(--gold-dim)",
          glow: "var(--gold-glow)",
        },
        danger: "var(--danger)",
        ring: "var(--ring)",
      },
      boxShadow: {
        premium: "0 4px 24px -4px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--border)",
        "premium-lg": "0 24px 48px -12px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
