import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { classNames } from "../ui";
import { SUPPORTED_LANGUAGES } from "../../constants/languages";
import { CheckIcon } from "@hugeicons/core-free-icons";

interface LanguageSettingsProps {
  i18n: any;
  setView: (view: any) => void;
}

export function LanguageSettings({ i18n, setView }: LanguageSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-5 animate-fadeIn text-left">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-5 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-5 leading-relaxed text-center">
              {t("settings.languageView.desc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  code: "vi",
                  label: "Tiếng Việt",
                  char: "Vi",
                  bg: "bg-orange-50 dark:bg-orange-500/10",
                  border: "border-orange-200/50 dark:border-orange-500/20",
                  text: "text-orange-600 dark:text-orange-400",
                },
                {
                  code: "en",
                  label: "English",
                  char: "En",
                  bg: "bg-blue-50 dark:bg-blue-500/10",
                  border: "border-blue-200/50 dark:border-blue-500/20",
                  text: "text-blue-600 dark:text-blue-400",
                },
                {
                  code: "ko",
                  label: "한국어",
                  char: "한",
                  bg: "bg-rose-50 dark:bg-rose-500/10",
                  border: "border-rose-200/50 dark:border-rose-500/20",
                  text: "text-rose-600 dark:text-rose-400",
                },
                {
                  code: "zh",
                  label: "中文",
                  char: "文",
                  bg: "bg-red-50 dark:bg-red-500/10",
                  border: "border-red-200/50 dark:border-red-500/20",
                  text: "text-red-600 dark:text-red-400",
                },
                {
                  code: "ja",
                  label: "日本語",
                  char: "あ",
                  bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
                  border: "border-fuchsia-200/50 dark:border-fuchsia-500/20",
                  text: "text-fuchsia-600 dark:text-fuchsia-400",
                },
                {
                  code: "th",
                  label: "ไทย",
                  char: "ก",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                  border: "border-emerald-200/50 dark:border-emerald-500/20",
                  text: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  code: "es",
                  label: "Español",
                  char: "Es",
                  bg: "bg-yellow-50 dark:bg-yellow-500/10",
                  border: "border-yellow-200/50 dark:border-yellow-500/20",
                  text: "text-yellow-600 dark:text-yellow-400",
                },
                {
                  code: "fr",
                  label: "Français",
                  char: "Fr",
                  bg: "bg-sky-50 dark:bg-sky-500/10",
                  border: "border-sky-200/50 dark:border-sky-500/20",
                  text: "text-sky-600 dark:text-sky-400",
                },
                {
                  code: "de",
                  label: "Deutsch",
                  char: "De",
                  bg: "bg-slate-50 dark:bg-slate-500/10",
                  border: "border-slate-200/50 dark:border-slate-500/20",
                  text: "text-slate-600 dark:text-slate-400",
                },
                {
                  code: "it",
                  label: "Italiano",
                  char: "It",
                  bg: "bg-teal-50 dark:bg-teal-500/10",
                  border: "border-teal-200/50 dark:border-teal-500/20",
                  text: "text-teal-600 dark:text-teal-400",
                },
                {
                  code: "pt",
                  label: "Português",
                  char: "Pt",
                  bg: "bg-indigo-50 dark:bg-indigo-500/10",
                  border: "border-indigo-200/50 dark:border-indigo-500/20",
                  text: "text-indigo-600 dark:text-indigo-400",
                },
                {
                  code: "id",
                  label: "Indonesia",
                  char: "Id",
                  bg: "bg-cyan-50 dark:bg-cyan-500/10",
                  border: "border-cyan-200/50 dark:border-cyan-500/20",
                  text: "text-cyan-600 dark:text-cyan-400",
                },
              ].map((lang, idx) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={classNames(
                    "relative flex items-center gap-3.5 p-3 rounded-[20px] border-2 transition-all duration-300 group focus:outline-none text-left overflow-hidden w-full animate-slideUpFade",
                    i18n.language === lang.code
                      ? "border-kat-primary bg-kat-primary/5 ring-2 ring-kat-primary/20 shadow-lg shadow-kat-primary/20 scale-[1.02] dark:border-kat-primary/50 dark:bg-kat-primary/10"
                      : "border-slate-100 dark:border-white/[0.04] bg-white/80 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:scale-[1.01] active:scale-[0.98] hover:shadow-md"
                  )}
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
                >
                  {/* Background hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />

                  {/* Icon */}
                  <div
                    className={classNames(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] shadow-sm transition-transform duration-300 group-hover:scale-105 relative z-10",
                      lang.bg,
                      "border",
                      lang.border
                    )}
                  >
                    <span className={classNames("font-black text-[18px]", lang.text)}>
                      {lang.char}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <span
                      className={classNames(
                        "block text-[14.5px] font-black truncate transition-colors duration-200 tracking-tight",
                        i18n.language === lang.code
                          ? "text-kat-primary drop-shadow-[0_0_4px_rgba(var(--kat-primary),0.3)]"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {lang.label}
                    </span>
                  </div>

                  {/* Active Indicator */}
                  <div
                    className={classNames(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mr-1 relative z-10",
                      i18n.language === lang.code
                        ? "border-kat-primary bg-kat-primary shadow-[0_0_8px_rgba(var(--kat-primary),0.5)]"
                        : "border-slate-200 dark:border-slate-700 bg-transparent opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {i18n.language === lang.code && (
                      <HugeiconsIcon icon={CheckIcon} className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setView("menu")}
          className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
        >
          {t("settings.actions.backToMenu")}
        </button>
      </div>
    </>
  );
}
