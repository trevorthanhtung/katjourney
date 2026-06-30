import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { classNames } from "../ui";
import { Settings02Icon, Shield01Icon, File01Icon, LockIcon } from "@hugeicons/core-free-icons";

interface PrivacySettingsProps {
  setView: (view: any) => void;
}

export function PrivacySettings({ setView }: PrivacySettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-6 animate-fadeIn text-left">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-6 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Glowing Premium Icon */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-[20px] bg-kat-primary/15 text-kat-primary mb-5 shadow-[0_0_24px_rgba(0,200,255,0.2)] group">
              <div className="absolute inset-0 rounded-[20px] bg-kat-primary animate-ping opacity-20" />
              <HugeiconsIcon
                icon={LockIcon}
                className="h-7 w-7 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <h3 className="text-[20px] font-black text-slate-800 dark:text-white text-balance tracking-tight mb-5">
              {t("settings.privacyView.title")}
            </h3>

            <div className="space-y-4">
              {[
                {
                  title: t("settings.privacyView.offlineTitle"),
                  desc: t("settings.privacyView.offlineDesc"),
                },
                {
                  title: t("settings.privacyView.identityTitle"),
                  desc: t("settings.privacyView.identityDesc"),
                },
                {
                  title: t("settings.privacyView.noDataTitle"),
                  desc: t("settings.privacyView.noDataDesc"),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/40 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-white/[0.03] animate-slideUpFade"
                  style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "both" }}
                >
                  <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-1 text-[14.5px]">
                      {item.title}
                    </strong>
                    {item.desc}
                  </p>
                </div>
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
