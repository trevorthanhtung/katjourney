import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        kat: {
          bg: "var(--kat-bg)",
          surface: "var(--kat-surface)",
          border: "rgb(var(--kat-border-rgb) / <alpha-value>)",
          primary: "var(--kat-primary)",
          "primary-light": "var(--kat-primary-light, #80EAD6)",
          "primary-usable": "var(--kat-primary-usable)",
          "primary-soft": "var(--kat-primary-soft)",
          "hero-start": "var(--kat-hero-start)",
          "hero-end": "var(--kat-hero-end)",
          text: "var(--kat-text)",
          muted: "var(--kat-muted)",
          "accent-yellow": "var(--kat-yellow)",
          "accent-pink": "var(--kat-pink)",
          "accent-blue": "var(--kat-blue)",
          yellow: "#FCA311",
          pink: "#FF6B6B",
          blue: "#00B4D8",
          // Brand dark — dùng thay cho hardcode #030D2E
          dark: "var(--kat-text)",
          // Teal accent — dùng thay cho hardcode #00BFB7
          teal: "var(--kat-primary)",
        },
        sand: "#F8F9FA",
        emerald: {
          ...colors.emerald,
          DEFAULT: colors.emerald[700],
        },
        forest: {
          ...colors.green,
          DEFAULT: colors.green[900],
        },
        sunset: {
          ...colors.orange,
          DEFAULT: colors.orange[600],
        },
        slate: {
          ...colors.slate,
          350: "#94A3B8",
          450: "#78879C",
          455: "#78879C",
          550: "#536277",
          650: "#3D4B5E",
          655: "#3D4B5E",
        },
        rose: {
          ...colors.rose,
          650: "#D41C44",
        },
        amber: {
          ...colors.amber,
          250: "#FDD96C",
          650: "#C66508",
        },
        red: {
          ...colors.red,
          655: "#C62020",
        },
      },
      spacing: {
        4.5: "1.125rem", // 18px
        5.5: "1.375rem", // 22px
        6.5: "1.625rem", // 26px
        8.5: "2.125rem", // 34px
        11.5: "2.875rem", // 46px
        12.5: "3.125rem", // 50px
        13: "3.25rem", // 52px
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans Variable'",
          "'Plus Jakarta Sans'",
          ...defaultTheme.fontFamily.sans,
        ],
        display: ["'Bricolage Grotesque Variable'", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: "0 8px 32px rgba(3, 13, 46, 0.04)",
        floating: "0 16px 36px rgba(3, 13, 46, 0.08)",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        slideUp: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
