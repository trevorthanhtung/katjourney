import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { classNames } from "../ui";
import { Sun01Icon, Moon01Icon, ComputerIcon } from "@hugeicons/core-free-icons";

interface ThemeSettingsProps {
  theme: any;
  setTheme: (theme: any) => void;
  setView: (view: any) => void;
}

export function ThemeSettings({ theme, setTheme, setView }: ThemeSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-5 animate-fadeIn text-left">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-5 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-5 leading-relaxed text-center">
              {t("settings.themeView.desc")}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={classNames(
                  "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-hidden w-full",
                  theme === "light"
                    ? "border-amber-400 bg-amber-50 shadow-[0_4px_24px_rgba(251,191,36,0.25)] ring-2 ring-amber-400/20 scale-[1.02] dark:border-amber-500/50 dark:bg-amber-500/10 dark:shadow-[0_4px_24px_rgba(245,158,11,0.15)]"
                    : "bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/4 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98] hover:shadow-md"
                )}
              >
                {/* Mini Screen Preview */}
                <div className="w-[76px] h-[52px] rounded-xl bg-white border border-slate-200/80 relative overflow-hidden flex flex-col items-center justify-center shadow-xs shrink-0 mt-0.5 group-hover:shadow-md transition-shadow">
                  <div className="absolute top-0 inset-x-0 h-2 bg-slate-50 border-b border-slate-100" />
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <HugeiconsIcon
                      icon={Sun01Icon}
                      className={`w-5 h-5 text-amber-500 ${theme === "light" ? "animate-[spin_4s_linear_infinite]" : "transition-transform duration-500 group-hover:rotate-90"}`}
                    />
                  </div>
                </div>

                <div className="mt-2.5 mb-0.5">
                  <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                    {t("settings.themeView.light")}
                  </span>
                  <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                    {t("settings.themeView.lightDesc")}
                  </span>
                </div>

                {theme === "light" && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                    <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
                  </span>
                )}
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={classNames(
                  "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-hidden w-full",
                  theme === "dark"
                    ? "border-violet-400 bg-violet-50 shadow-[0_4px_24px_rgba(167,139,250,0.25)] ring-2 ring-violet-400/20 scale-[1.02] dark:border-violet-500/50 dark:bg-violet-500/10 dark:shadow-[0_4px_24px_rgba(139,92,246,0.15)]"
                    : "bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/4 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98] hover:shadow-md"
                )}
              >
                {/* Mini Screen Preview */}
                <div className="w-[76px] h-[52px] rounded-xl bg-slate-950 border border-slate-900 relative overflow-hidden flex flex-col items-center justify-center shadow-xs shrink-0 mt-0.5 group-hover:shadow-md transition-shadow">
                  <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 border-b border-slate-800" />
                  <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <HugeiconsIcon
                      icon={Moon01Icon}
                      className={`w-5 h-5 text-violet-400 ${theme === "dark" ? "animate-pulse" : "transition-transform duration-500 group-hover:-rotate-12"}`}
                    />
                  </div>
                </div>

                <div className="mt-2.5 mb-0.5">
                  <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                    {t("settings.themeView.dark")}
                  </span>
                  <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                    {t("settings.themeView.darkDesc")}
                  </span>
                </div>

                {theme === "dark" && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                    <span className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-75" />
                  </span>
                )}
              </button>

              {/* Automatic Mode Card */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={classNames(
                  "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-hidden w-full",
                  theme === "system"
                    ? "border-teal-400 bg-teal-50 shadow-[0_4px_24px_rgba(45,212,191,0.25)] ring-2 ring-teal-400/20 scale-[1.02] dark:border-teal-500/50 dark:bg-teal-500/10 dark:shadow-[0_4px_24px_rgba(20,184,166,0.15)]"
                    : "bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/4 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98] hover:shadow-md"
                )}
              >
                {/* Mini Screen Preview (Split) */}
                <div className="w-[76px] h-[52px] rounded-xl bg-white border border-slate-200/80 relative overflow-hidden shadow-xs shrink-0 mt-0.5 group-hover:shadow-md transition-shadow">
                  {/* Light Underlay */}
                  <div className="absolute inset-0 flex items-center justify-start pl-2 bg-white">
                    <div className="absolute top-0 inset-x-0 h-2 bg-slate-50 border-b border-slate-100" />
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <HugeiconsIcon
                        icon={Sun01Icon}
                        className={`w-3.5 h-3.5 text-amber-500 ${theme === "system" ? "animate-[spin_4s_linear_infinite]" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Dark Overlay (Clipped) */}
                  <div
                    className="absolute inset-0 bg-slate-950 flex items-center justify-end pr-2 border-l border-slate-900 transition-all duration-500"
                    style={{ clipPath: "polygon(100% 0, 0% 100%, 100% 100%)" }}
                  >
                    <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 border-b border-slate-800" />
                    <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <HugeiconsIcon
                        icon={Moon01Icon}
                        className={`w-3.5 h-3.5 text-violet-400 ${theme === "system" ? "animate-pulse" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 mb-0.5">
                  <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                    {t("settings.themeView.system")}
                  </span>
                  <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                    {t("settings.themeView.systemDesc")}
                  </span>
                </div>

                {theme === "system" && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]">
                    <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-75" />
                  </span>
                )}
              </button>
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
