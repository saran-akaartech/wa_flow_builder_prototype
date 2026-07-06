import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editor chrome — cool slate ink, not pure black
        ink: {
          900: "#0f1720",
          800: "#151f2b",
          700: "#1d2a38",
          600: "#27384a",
          500: "#3a4d61",
        },
        // WhatsApp heritage accents, used with restraint
        wa: {
          green: "#25d366",
          teal: "#128c7e",
          deep: "#075e54",
          ink: "#0b141a",
          bubble: "#005c4b",
          panel: "#111b21",
        },
        line: "#26323f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
