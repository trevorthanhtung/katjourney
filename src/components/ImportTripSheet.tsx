import React, { useState, useEffect } from "react";
import { BottomSheet } from "./ui";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Airplane01Icon,
  ChevronRightIcon
} from "@hugeicons/core-free-icons";
import { useModalHistory } from "../hooks/useModalHistory";

interface ImportTripSheetProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function ImportTripSheet({ isOpen, onClose, showToast }: ImportTripSheetProps) {
  const { t } = useTranslation();
  const [sharedLinkInput, setSharedLinkInput] = useState("");
  const [recentSharedTrips, setRecentSharedTrips] = useState<{ token: string; title: string; date: string; timestamp: number }[]>([]);

  useModalHistory(isOpen, onClose, "import-modal");

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("kat_recent_shared_trips");
      if (saved) {
        try {
          setRecentSharedTrips(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  const parseToken = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (trimmed.includes("/share/")) {
      const parts = trimmed.split("/share/");
      if (parts.length > 1) {
        return parts[1].split("/")[0].split("?")[0];
      }
    }
    return trimmed;
  };

  const handleImport = () => {
    const token = parseToken(sharedLinkInput);
    if (token) {
      window.location.href = "/share/" + token;
    } else {
      showToast(t('sharedTrip.invalidLink'));
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSharedLinkInput("");
      }}
      title={t('sharedTrip.viewTitle')}
    >
      <div className="space-y-6">
        <div className="relative bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-5 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-slideUpFade">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-kat-primary/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <label htmlFor="shared-link-input" className="text-[13px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              {t('sharedTrip.inputLabel')}
            </label>
            <div className="flex gap-2.5">
              <input
                id="shared-link-input"
                type="text"
                name="shared-link"
                value={sharedLinkInput}
                onChange={(e) => setSharedLinkInput(e.target.value)}
                placeholder={t('sharedTrip.inputPlaceholder')}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-[16px] border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm px-4 h-[50px] text-[15px] font-bold text-kat-dark dark:text-slate-100 outline-none transition-all duration-300 focus:bg-white dark:focus:bg-slate-800/60 focus:ring-2 focus:ring-kat-primary/50 focus:border-kat-primary/30 dark:focus:border-kat-primary/50 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500/70"
              />
              <button
                onClick={handleImport}
                className="group relative inline-flex h-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-r from-kat-dark to-slate-800 dark:from-kat-primary dark:to-kat-teal text-white border border-transparent px-6 font-black active:scale-[0.96] transition-all duration-300 shadow-sm dark:shadow-[0_4px_16px_rgba(0,191,183,0.3)] hover:shadow-lg dark:hover:shadow-[0_4px_24px_rgba(0,191,183,0.5)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{t('sharedTrip.viewButton')}</span>
              </button>
            </div>
          </div>
        </div>

        {recentSharedTrips.length > 0 && (
          <div className="space-y-4 pt-2">
            <h4 className="text-[12.5px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-400 dark:to-slate-600 px-1 animate-fadeIn">
              {t('sharedTrip.recentHistory')}
            </h4>
            <div className="space-y-3">
              {recentSharedTrips.map((trip, idx) => (
                <div
                  key={trip.token}
                  onClick={() => {
                    window.location.href = "/share/" + trip.token;
                  }}
                  className="group flex items-center justify-between p-4 rounded-[20px] border border-slate-100 dark:border-white/[0.04] bg-white/80 dark:bg-slate-800/30 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-kat-primary/30 dark:hover:border-kat-primary/50 cursor-pointer active:scale-[0.98] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 animate-slideUpFade"
                  style={{ animationDelay: `${(idx + 1) * 80}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-kat-primary/10 text-kat-primary transition-transform duration-300 group-hover:scale-105 shadow-[0_0_12px_rgba(var(--kat-primary),0.1)] group-hover:shadow-[0_0_16px_rgba(var(--kat-primary),0.25)] border border-transparent">
                      <HugeiconsIcon icon={Airplane01Icon} className="h-6 w-6 -rotate-45" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[15px] font-black text-slate-800 dark:text-slate-100 truncate transition-colors duration-300 group-hover:text-kat-primary dark:group-hover:text-cyan-400 tracking-tight">
                        {trip.title}
                      </p>
                      <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        {t('sharedTrip.departure')}: {trip.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900/50 group-hover:bg-kat-primary/10 transition-colors duration-300 shrink-0">
                    <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-kat-primary dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
