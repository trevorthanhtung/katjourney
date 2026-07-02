import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityWarningIcon } from "@hugeicons/core-free-icons";
import { classNames } from "../../../utils/helpers";

interface SharedTripPinGateProps {
  pinInput: string;
  pinError: boolean;
  handlePinInput: (val: string, index: number) => void;
  handlePinBackspace: (key: string, index: number) => void;
  confirmPin: () => void;
  t: (key: string) => string;
}

export function SharedTripPinGate({
  pinInput,
  pinError,
  handlePinInput,
  handlePinBackspace,
  confirmPin,
  t,
}: SharedTripPinGateProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-[#060b19]/90 p-4 animate-fadeIn overflow-hidden z-50">
      {/* Animated background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/8 dark:bg-indigo-500/5 blur-[80px] animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/8 dark:bg-purple-500/5 blur-[80px] animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-md max-h-[90dvh] rounded-[32px] bg-white/85 dark:bg-slate-900/65 backdrop-blur-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/50 dark:border-white/5 animate-scaleIn flex flex-col relative">
        <div className="flex flex-col items-center text-center shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner mb-4">
            <HugeiconsIcon icon={SecurityWarningIcon} className="h-8 w-8" />
          </div>
          <h2 className="text-[22px] font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            <span>{t("share.checkpoint")}</span>
          </h2>
          <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            {t("share.pinProtected")}
          </p>
        </div>

        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <div className="space-y-5">
            <div className="flex gap-3.5 justify-center py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <input
                  key={i}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  id={`share-pin-digit-${i}`}
                  autoComplete="one-time-code"
                  spellCheck={false}
                  value={pinInput[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    handlePinInput(val, i);
                  }}
                  onKeyDown={(e) => {
                    handlePinBackspace(e.key, i);
                  }}
                  className={classNames(
                    "w-12 h-12 rounded-2xl border-2 text-center text-[20px] font-black focus:ring-4 focus:outline-hidden transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-xs",
                    pinError
                      ? "border-rose-300 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-455 focus:border-rose-450 focus:ring-rose-500/15"
                      : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15"
                  )}
                />
              ))}
            </div>
            {pinError && (
              <p className="text-center text-xs font-bold text-rose-500 animate-bounce">
                {t("share.pinIncorrect")}
              </p>
            )}
            <button
              disabled={pinInput.length < 4}
              onClick={confirmPin}
              className="w-full rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-[14px] font-black py-3.5 transition-all active:scale-[0.98] hover:scale-[1.01] shadow-soft hover:shadow-md disabled:opacity-40 dark:disabled:bg-slate-850 dark:disabled:text-slate-600 disabled:pointer-events-none cursor-pointer"
            >
              {t("share.confirmPin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
