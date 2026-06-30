import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon, UserSettingsIcon } from "@hugeicons/core-free-icons";

interface SharedTripStickyHeaderProps {
  areBarsVisible: boolean;
  currentUser: { name: string } | null;
  onSwitchUser: () => void;
  onExit: () => void;
  t: (key: string) => string;
}

export function SharedTripStickyHeader({
  areBarsVisible,
  currentUser,
  onSwitchUser,
  onExit,
  t,
}: SharedTripStickyHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 bg-white/55 supports-[backdrop-filter]:bg-white/45 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 dark:bg-[#0A1124]/60 dark:supports-[backdrop-filter]:bg-[#0A1124]/45 dark:border-slate-800/80 px-2.5 min-[390px]:px-4 pb-3 pt-3 shadow-[0_4px_24px_rgba(3,13,46,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out ${
        areBarsVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ paddingTop: "calc(0.75rem + var(--safe-top))" }}
    >
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between h-9 md:h-11 gap-1.5 min-[390px]:gap-2">
        <div className="flex items-center gap-1.5 min-[390px]:gap-2 select-none shrink-0">
          <img
            src="/asset/logo.png"
            alt="KAT Journey Logo"
            className="hidden md:block h-[26px] w-[26px] min-[390px]:h-[28px] min-[390px]:w-[28px] shrink-0 object-contain drop-shadow-sm"
          />
          <h1 className="text-[17px] min-[390px]:text-[20px] font-extrabold tracking-tight text-kat-dark dark:text-white whitespace-nowrap shrink-0">
            KAT Journey
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 px-1.5 min-[390px]:px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-350 whitespace-nowrap shrink-0">
            <HugeiconsIcon icon={Share01Icon} className="h-3 w-3 shrink-0" />{" "}
            {t("sharedScreen.headerShare")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-[390px]:gap-2 shrink-0">
          {currentUser && (
            <button
              onClick={onSwitchUser}
              title={t("sharedScreen.switchUser")}
              className="flex items-center justify-center gap-1.5 min-h-[34px] min-[390px]:min-h-[36px] px-2 min-[390px]:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[12px] font-bold text-slate-655 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-[0.97] shrink-0"
            >
              <HugeiconsIcon icon={UserSettingsIcon} className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{currentUser.name}</span>
            </button>
          )}
          <button
            onClick={onExit}
            className="flex items-center justify-center min-h-[34px] min-[390px]:min-h-[38px] text-[12px] min-[390px]:text-[13px] font-black text-white dark:text-slate-950 bg-[#030D2E] dark:bg-white hover:bg-[#0a1a5c] dark:hover:bg-slate-100 px-4 rounded-xl shadow-sm transition-all active:scale-[0.97] whitespace-nowrap shrink-0"
          >
            {t("sharedScreen.exit")}
          </button>
        </div>
      </div>
    </header>
  );
}
