import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#b9fd3b",
        background: "#fafafa",
        foreground: "#0f101f",
        primary: {
          DEFAULT: "#0f101f",
          foreground: "#fafafa",
        },
        secondary: {
          DEFAULT: "#ebebf7",
          foreground: "#0f101f",
        },
        muted: {
          DEFAULT: "#ebebf7",
          foreground: "#758696",
        },
        destructive: {
          DEFAULT: "#e11d48",
          foreground: "#fafafa",
        },
        // Penguin-inspired accents (source: penguin.digital webflow CSS)
        penguin: {
          obsidian: "#0f101f",
          "obsidian-soft": "#282748",
          violet: "#7964ce",
          "violet-soft": "#4e4b7c",
          lime: "#b9fd3b",
          cyan: "#1be3cb",
          off: "#fafafa",
          "cool-gray": "#758696",
          "cool-border": "#cacadb",
          "cool-bg": "#ebebf7",
        },
        // Tremor color palette (standard)
        tremor: {
          brand: {
            faint: "#eff6ff",
            muted: "#bfdbfe",
            subtle: "#60a5fa",
            DEFAULT: "#3b82f6",
            emphasis: "#1d4ed8",
            inverted: "#ffffff",
          },
          background: {
            muted: "#f9fafb",
            subtle: "#f3f4f6",
            DEFAULT: "#ffffff",
            emphasis: "#374151",
          },
          border: { DEFAULT: "#e5e7eb" },
          ring: { DEFAULT: "#e5e7eb" },
          content: {
            subtle: "#9ca3af",
            DEFAULT: "#6b7280",
            emphasis: "#374151",
            strong: "#111827",
            inverted: "#ffffff",
          },
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  safelist: [
    { pattern: /^(bg|text|border|ring|fill|stroke)-tremor-/ },
    // Full Tremor color palette — charts need these classes generated so they
    // don't render in grayscale.
    {
      pattern:
        /^(bg|text|border|ring|fill|stroke)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // Gradient stops used by Tremor AreaChart fills.
    {
      pattern:
        /^(from|via|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  plugins: [require("tailwindcss-animate")],
};

export default config;
