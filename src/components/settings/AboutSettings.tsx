import React from "react";
import { useTranslation } from "react-i18next";

interface AboutSettingsProps {
  setView: (view: any) => void;
}

export function AboutSettings({ setView }: AboutSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-6 animate-fadeIn text-center">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-6 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col items-center">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Logo with breathing/glow effect */}
            <div className="relative group mb-4">
              <div className="absolute inset-0 bg-kat-primary/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/asset/logo.png"
                alt="KAT Journey Logo"
                className="relative h-20 w-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_4px_16px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-110 animate-float"
              />
            </div>

            <h3 className="text-[24px] font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-kat-dark via-slate-800 to-kat-dark dark:from-white dark:via-cyan-100 dark:to-white drop-shadow-xs mb-1">
              KAT Journey
            </h3>

            <span className="inline-block text-[12px] font-bold text-kat-primary dark:text-cyan-300 bg-kat-primary/10 dark:bg-kat-primary/20 px-3.5 py-1.5 rounded-full border border-kat-primary/20 shadow-[0_0_12px_rgba(var(--kat-primary),0.1)] mb-4">
              {t("settings.aboutView.subtitle")}
            </span>

            <p
              className="text-[14.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300 text-center max-w-[280px] mb-6 animate-slideUpFade"
              style={{ animationDelay: "100ms", animationFillMode: "both" }}
            >
              {t("settings.aboutView.desc")}
            </p>

            <div
              className="w-full rounded-[24px] border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-800/30 p-5 text-left shadow-xs backdrop-blur-md animate-slideUpFade group hover:border-slate-300 dark:hover:border-white/10 transition-colors duration-300"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              <h4 className="text-[14px] font-black text-slate-800 dark:text-white mb-2">
                {t("settings.aboutView.techTitle")}
              </h4>
              <p className="text-[13px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400 mb-2">
                {t("settings.aboutView.techDesc1")}
              </p>
              <p className="text-[12px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
                {t("settings.aboutView.techDesc2")}
              </p>
              <p className="text-[12px] font-medium leading-relaxed text-slate-400 dark:text-slate-500 mt-2">
                {t("settings.aboutView.techDesc3")}
              </p>
            </div>

            <div
              className="pt-6 pb-2 text-center animate-slideUpFade"
              style={{ animationDelay: "300ms", animationFillMode: "both" }}
            >
              <p className="text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">
                {t("settings.aboutView.madeBy")}{" "}
                <a
                  href="https://tranthanhtung-trevor.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-300 font-bold hover:text-kat-primary dark:hover:text-cyan-400 transition-colors duration-200 hover:drop-shadow-[0_0_8px_rgba(var(--kat-primary),0.5)]"
                >
                  thanhtungg.
                </a>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setView("menu")}
          className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/4 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
        >
          {t("settings.actions.backToMenu")}
        </button>
      </div>
    </>
  );
}
