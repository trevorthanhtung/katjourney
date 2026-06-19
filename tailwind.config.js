import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        kat: {
          bg: "#F8F9FA",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          primary: "#00B4D8",
          "primary-light": "#48CAE4",
          "primary-usable": "#0096C7",
          "primary-soft": "rgba(0, 180, 216, 0.10)",
          "hero-start": "#0096C7",
          "hero-end": "#48CAE4",
          text: "#0F172A",
          muted: "#64748B",
          "accent-yellow": "#FCA311",
          "accent-pink": "#FF6B6B",
          "accent-blue": "#00B4D8",
          yellow: "#FCA311",
          pink: "#FF6B6B",
          blue: "#00B4D8",
          // Brand dark — dùng thay cho hardcode #030D2E
          dark: "#030D2E",
          // Teal accent — dùng thay cho hardcode #00BFB7
          teal: "#00BFB7",
        },
        sand: "#F8F9FA",
        emerald: {
          DEFAULT: "#0F766E",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        forest: {
          DEFAULT: "#14532D",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        sunset: {
          DEFAULT: "#EA580C",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        slate: {
          450: "#78879C",
          455: "#78879C",
          550: "#536277",
          650: "#3D4B5E",
        },
        rose: {
          650: "#D41C44",
        },
        amber: {
          250: "#FDD96C",
          650: "#C66508",
        },
        red: {
          655: "#C62020",
        }
      },
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
        '6.5': '1.625rem', // 26px
        '8.5': '2.125rem', // 34px
        '11.5': '2.875rem', // 46px
        '12.5': '3.125rem', // 50px
        '13': '3.25rem', // 52px
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", ...defaultTheme.fontFamily.sans],
        display: ["'Bricolage Grotesque'", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: "0 8px 32px rgba(3, 13, 46, 0.04)",
        floating: "0 16px 36px rgba(3, 13, 46, 0.08)"
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        slideUp: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 0.2s ease-out"
      }
    }
  },
  plugins: []
};
