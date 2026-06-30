import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useTranslation, Trans } from "react-i18next";

interface PWAInstallInstructionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: "ios" | "android" | "other";
}

export function PWAInstallInstructionsSheet({
  isOpen,
  onClose,
  platform = "ios",
}: PWAInstallInstructionsSheetProps) {
  if (!isOpen) return null;

  const isAndroid = platform === "android";
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <div className="bg-white dark:bg-kat-surface w-full max-w-[420px] rounded-[30px] border border-slate-100 dark:border-kat-border/40 p-6 sm:p-7 shadow-floating relative z-10 animate-slideUp flex flex-col mb-safe sm:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4.5 border-b border-slate-100/80 dark:border-kat-border/40 shrink-0">
          <div className="flex flex-col text-left">
            <h4 className="text-[17px] font-black text-kat-dark leading-snug">
              {isAndroid ? t("pwaInstallSheet.titleAndroid") : t("pwaInstallSheet.titleIOS")}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              {isAndroid ? t("pwaInstallSheet.subtitleAndroid") : t("pwaInstallSheet.subtitleIOS")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="py-5 space-y-5 flex-1 select-text">
          {/* Step 1 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 font-black shrink-0 text-[13.5px] shadow-sm">
              1
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">
                {isAndroid ? t("pwaInstallSheet.step1Android") : t("pwaInstallSheet.step1IOS")}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <Trans
                    i18nKey="pwaInstallSheet.step1AndroidDesc"
                    components={{ b: <strong className="font-extrabold text-kat-dark" /> }}
                  />
                ) : (
                  <Trans
                    i18nKey="pwaInstallSheet.step1IOSDesc"
                    components={{
                      icon: (
                        <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md p-1 px-1.5 align-middle mx-0.5 border border-slate-200/50 dark:border-kat-border/40">
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-blue-600 dark:text-blue-400"
                            aria-hidden="true"
                          >
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M12 2v14M12 2L8 6m4-4l4 4" />
                          </svg>
                        </span>
                      ),
                    }}
                  />
                )}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-teal-600 dark:text-teal-400 font-black shrink-0 text-[13.5px] shadow-sm">
              2
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">
                {isAndroid ? t("pwaInstallSheet.step2Android") : t("pwaInstallSheet.step2IOS")}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <Trans
                    i18nKey="pwaInstallSheet.step2AndroidDesc"
                    components={{ b: <strong className="font-extrabold text-kat-dark" /> }}
                  />
                ) : (
                  <Trans
                    i18nKey="pwaInstallSheet.step2IOSDesc"
                    components={{
                      icon: (
                        <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md p-1 px-1.5 align-middle mx-0.5 border border-slate-200/50 dark:border-kat-border/40">
                          <svg
                            viewBox="0 0 24 24"
                            width="13"
                            height="13"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-slate-800 dark:text-slate-200"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      ),
                    }}
                  />
                )}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black shrink-0 text-[13.5px] shadow-sm">
              3
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">
                {t("pwaInstallSheet.step3Title")}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <Trans
                    i18nKey="pwaInstallSheet.step3AndroidDesc"
                    components={{ b: <strong className="font-extrabold text-kat-dark" /> }}
                  />
                ) : (
                  <Trans
                    i18nKey="pwaInstallSheet.step3IOSDesc"
                    components={{ b: <strong className="font-extrabold text-kat-dark" /> }}
                  />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 mt-4">
          <button
            onClick={onClose}
            className="w-full min-h-[52px] flex items-center justify-center rounded-[18px] font-bold bg-slate-900 dark:bg-kat-primary text-white dark:text-kat-dark hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md text-[15.5px]"
          >
            {t("pwaInstallSheet.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
