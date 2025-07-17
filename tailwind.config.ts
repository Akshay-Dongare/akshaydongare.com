import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "marquee-horizontal": "marquee-x var(--duration) infinite linear",
        "marquee-vertical": "marquee-y var(--duration) linear infinite",
        "subtle-pulse": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "rotate-full": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-y": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
        pulse: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "0.3" },
        },
      },
      fontFamily: {
        Quicksand: ["Quicksand", "sans-serif"],
        Mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        lightblue: "#00B2FE",
        darkblue: "#005CFE",
        matteblack: "#212121",
        smokeblack: "#1A1A1A",
        lightgray: "#E0E0E0",
        offwhite: "#F5F5F5",
        "matteblack-t": "rgba(33, 33, 33, 0.8)",
        "smokeblack-t": "rgba(26, 26, 26, 0.9)",
      },
      screens: {
        xs: "128px",
        "2xs": "430px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: []
};

export default config;
