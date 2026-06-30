import React from "react";
import { useTranslation } from "react-i18next";

interface SplashScreenProps {
  isFading: boolean;
}

export function SplashScreen({ isFading }: SplashScreenProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#060b19] transition-all duration-500 select-none ${
        isFading ? "opacity-0 scale-[1.08] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        transitionTimingFunction: "var(--motion-ease-soft-out)",
      }}
    >
      {/* Noise overlay for spatial texture (matching the WelcomeScreen aesthetic) */}
      <div
        className="absolute inset-0 z-0 opacity-[0.12] dark:opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Dynamic Ambient Glow Behind Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-500/5 via-teal-500/5 to-transparent dark:from-indigo-500/10 dark:via-teal-500/10 dark:to-transparent rounded-full blur-[80px] animate-splash-glow pointer-events-none" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center gap-6 z-10 animate-splash-logo">
        <div className="relative flex items-center justify-center rounded-[32px] p-1 overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_0_50px_rgba(0,191,183,0.15)]">
          {/* Subtle premium shimmer overlay over the logo container */}
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep pointer-events-none z-20"></div>

          <img
            src="/asset/logo.png"
            alt="KAT Journey Logo"
            className="h-28 w-28 rounded-[28px] object-contain animate-splash-neon relative z-10"
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-[28px] font-black tracking-tight text-slate-800 dark:text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            KAT Journey
          </h1>
          <p className="text-[11px] font-extrabold text-kat-primary dark:text-[#00BFB7] mt-2 uppercase tracking-[0.3em] opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.01)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            {t("splash.subtitle")}
          </p>
        </div>

        {/* Elegant Loading Bar directly integrated under the tagline */}
        <div className="w-24 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-2 relative">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-400 to-[#00BFB7] rounded-full animate-splash-progress w-full" />
        </div>
      </div>
    </div>
  );
}
