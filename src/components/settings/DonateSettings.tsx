import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { classNames } from "../ui";
import { Coffee01Icon, Download01Icon, GlobeIcon } from "@hugeicons/core-free-icons";

interface DonateSettingsProps {
  setView: (view: any) => void;
}

export function DonateSettings({ setView }: DonateSettingsProps) {
  const { t } = useTranslation();
  const [donateTab, setDonateTab] = useState<"vn" | "intl">("vn");

  return (
    <>
      <div className="space-y-6 animate-fadeIn flex flex-col items-center text-center">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-6 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden w-full flex flex-col items-center">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-kat-primary/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Glowing Premium Icon */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-[20px] bg-amber-500/10 text-amber-500 mb-5 shadow-[0_0_24px_rgba(245,158,11,0.2)] group">
              <div className="absolute inset-0 rounded-[20px] bg-amber-500 animate-ping opacity-20" />
              <HugeiconsIcon
                icon={Coffee01Icon}
                className="h-7 w-7 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="space-y-2 max-w-md mb-6">
              <h4 className="text-[20px] font-black text-slate-800 dark:text-white tracking-tight">
                {t("settings.donateView.title")}
              </h4>
              <p className="text-[14px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                {t("settings.donateView.desc1")}
              </p>
              <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 italic">
                {t("settings.donateView.desc2")}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-2xl w-[90%] max-w-[300px] mb-6 border border-slate-200/50 dark:border-white/3">
              <button
                onClick={() => setDonateTab("vn")}
                className={classNames(
                  "flex-1 py-2 text-[13.5px] font-bold rounded-[14px] transition-all duration-300",
                  donateTab === "vn"
                    ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/5"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {t("settings.donateView.tabVietQR", "VietQR")}
              </button>
              <button
                onClick={() => setDonateTab("intl")}
                className={classNames(
                  "flex-1 py-2 text-[13.5px] font-bold rounded-[14px] transition-all duration-300",
                  donateTab === "intl"
                    ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/5"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {t("settings.donateView.tabInternational", "International")}
              </button>
            </div>

            {/* Content */}
            <div className="w-full flex flex-col items-center min-h-[220px]">
              {donateTab === "vn" ? (
                <div className="flex flex-col items-center animate-slideUpFade">
                  <div className="relative group w-[85%] max-w-[280px] p-4 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[28px] shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-amber-500/30">
                    <div className="absolute inset-0 bg-linear-to-b from-white/40 to-transparent dark:from-white/5 rounded-[28px] pointer-events-none" />
                    <img
                      src="/asset/donates.png"
                      alt="Donate QR Code"
                      className="relative z-10 w-full h-auto rounded-[18px] object-contain aspect-square shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="mt-4 flex justify-center relative z-10">
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-200/50 dark:border-amber-500/20">
                        {t("settings.donateView.scanQR")}
                      </span>
                    </div>
                  </div>

                  <a
                    href="/asset/donates.png"
                    download="kat-journey-donate-qr.png"
                    className="mt-5 text-[13px] font-bold text-slate-500 hover:text-kat-primary dark:text-slate-400 dark:hover:text-cyan-400 flex items-center gap-1.5 active:scale-95 transition-all group"
                  >
                    <HugeiconsIcon
                      icon={Download01Icon}
                      className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:text-kat-primary dark:group-hover:text-cyan-400"
                    />
                    {t("settings.donateView.saveQR")}
                  </a>
                </div>
              ) : (
                <div className="w-full max-w-[280px] space-y-4 mt-2 animate-slideUpFade flex flex-col items-center">
                  <div className="w-20 h-20 bg-[#00457C]/10 dark:bg-[#00457C]/20 rounded-full flex items-center justify-center mb-2">
                    <HugeiconsIcon icon={GlobeIcon} className="w-10 h-10 text-[#0079C1]" />
                  </div>

                  <a
                    href="https://paypal.me/trevorthanhtung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden flex items-center justify-center w-full gap-2.5 py-4 px-6 rounded-[20px] bg-linear-to-r from-[#00457C] to-[#0079C1] text-white font-black text-[15px] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,121,193,0.3)] hover:-translate-y-0.5 active:scale-[0.98] group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10">
                      {t("settings.donateView.supportPayPal", "Support via PayPal")}
                    </span>
                  </a>
                  <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 italic">
                    {t("settings.donateView.thankYou", "(Thank you for your support!)")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setView("menu")}
          className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/4 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80 mt-2"
        >
          {t("settings.actions.backToMenu")}
        </button>
      </div>
    </>
  );
}
