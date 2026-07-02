import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { fetchExchangeRates, ExchangeRate } from "../../services/currencyService";
import { RefreshIcon, BitcoinEllipseIcon, TickDouble01Icon } from "@hugeicons/core-free-icons";
import { getCurrencyLabel } from "../../constants/currencies";

interface ExchangeRatesSettingsProps {
  setView: (view: any) => void;
}

export function ExchangeRatesSettings({ setView }: ExchangeRatesSettingsProps) {
  const { t, i18n } = useTranslation();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-5 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
              {t("settings.exchangeRatesView.desc")}
            </p>
            <button
              onClick={() => {
                setExchangeRates([]);
                fetchExchangeRates().then(setExchangeRates);
              }}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-kat-primary/10 hover:text-kat-primary transition-colors duration-200 shrink-0"
              title={t("settings.exchangeRatesView.updateNow")}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                className={`w-5 h-5 ${exchangeRates.length === 0 ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {exchangeRates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-[20px] bg-kat-primary/10 text-kat-primary">
                  <div className="absolute inset-0 rounded-[20px] bg-kat-primary animate-ping opacity-20" />
                  <HugeiconsIcon icon={RefreshIcon} className="w-6 h-6 animate-spin" />
                </div>
                <span className="text-[14px] font-bold text-slate-400">
                  {t("settings.exchangeRatesView.loading")}
                </span>
              </div>
            ) : (
              exchangeRates.map((rate, idx) => (
                <div
                  key={rate.currencyCode}
                  className="flex items-center justify-between p-3.5 rounded-[20px] border border-slate-100 dark:border-white/4 bg-white/80 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 animate-slideUpFade"
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
                      <HugeiconsIcon icon={BitcoinEllipseIcon} className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-[15px] font-black text-slate-800 dark:text-slate-200">
                        {getCurrencyLabel(rate.currencyCode, i18n.language)}
                      </span>
                      <span className="block text-[12px] font-bold text-slate-400">
                        {t("settings.exchangeRatesView.unit")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[16px] font-black text-kat-primary">
                      {rate.transfer.toLocaleString("vi-VN", {
                        maximumFractionDigits: 4,
                      })}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-emerald-500">
                      <HugeiconsIcon icon={TickDouble01Icon} className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">
                        {t("settings.exchangeRatesView.transfer")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
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
  );
}
