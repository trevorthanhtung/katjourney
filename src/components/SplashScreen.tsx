import React from "react";

interface SplashScreenProps {
  isFading: boolean;
}

export function SplashScreen({ isFading }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-kat-bg transition-all duration-500 select-none ${
        isFading ? "opacity-0 scale-[1.08] pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        transitionTimingFunction: "var(--motion-ease-soft-out)"
      }}
    >
      {/* Noise overlay for spatial texture (matching the WelcomeScreen aesthetic) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.18] mix-blend-overlay pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Dynamic Ambient Glow Behind Logo */}
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-tr from-kat-primary/20 via-[#E6F9F8]/10 to-transparent rounded-full animate-splash-glow pointer-events-none" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center gap-6 z-10 animate-splash-logo">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white border border-slate-100/50 shadow-soft ring-8 ring-white/30">
          <img
            src="/asset/logo.png"
            alt="KAT Journey Logo"
            className="h-13 w-13 object-contain drop-shadow-sm"
            loading="eager"
          />
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-[26px] font-black tracking-tight text-kat-text">
            KAT Journey
          </h1>
          <p className="text-[12px] font-bold text-slate-500/80 mt-1.5 uppercase tracking-[0.2em]">
            Khám phá &amp; Kỷ niệm
          </p>
        </div>
      </div>

      {/* Elegant Loading Bar at the bottom */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-slate-200/60 rounded-full overflow-hidden z-10">
        <div className="absolute top-0 bottom-0 bg-kat-primary rounded-full animate-splash-progress" />
      </div>
    </div>
  );
}
