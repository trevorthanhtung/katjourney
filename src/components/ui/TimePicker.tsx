import { BottomSheet } from "./BottomSheet";
import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlayVariants, sheetContentVariants } from "../../lib/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckIcon,
  Cancel01Icon,
  Delete01Icon,
  ChevronDownIcon,
  Calendar01Icon,
  Clock01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons";
import { classNames } from "../../utils/helpers";
import { useModalHistory } from "../../hooks/useModalHistory";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export { classNames };

export function TimePicker({
  label,
  value,
  onChange,
  placeholder = "--:--",
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempHour, setTempHour] = React.useState("09");
  const [tempMinute, setTempMinute] = React.useState("00");

  const hourRef = React.useRef<HTMLDivElement>(null);
  const minRef = React.useRef<HTMLDivElement>(null);

  const hash = React.useMemo(() => {
    const safeLabel =
      typeof label === "string"
        ? label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "time";
    return `time-${safeLabel || "picker"}`;
  }, [label]);

  useModalHistory(isOpen, () => setIsOpen(false), hash);

  React.useEffect(() => {
    if (isOpen) {
      if (value) {
        const [h, m] = value.split(":");
        if (h && m) {
          setTempHour(h);
          setTempMinute(m);
        }
      }

      // Auto scroll to center after a tiny delay
      setTimeout(() => {
        if (hourRef.current) {
          const selectedHourEl = hourRef.current.querySelector('[data-selected="true"]');
          if (selectedHourEl) selectedHourEl.scrollIntoView({ block: "center" });
        }
        if (minRef.current) {
          const selectedMinEl = minRef.current.querySelector('[data-selected="true"]');
          if (selectedMinEl) selectedMinEl.scrollIntoView({ block: "center" });
        }
      }, 50);
    }
  }, [isOpen, value]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const handleSave = () => {
    onChange(`${tempHour}:${tempMinute}`);
    setIsOpen(false);
  };

  const handleHourScroll = () => {
    if (!hourRef.current) return;
    const scrollTop = hourRef.current.scrollTop;
    const index = Math.round(scrollTop / 44);
    const h = hours[index];
    if (h && tempHour !== h) {
      setTempHour(h);
    }
  };

  const handleMinScroll = () => {
    if (!minRef.current) return;
    const scrollTop = minRef.current.scrollTop;
    const index = Math.round(scrollTop / 44);
    const m = minutes[index];
    if (m && tempMinute !== m) {
      setTempMinute(m);
    }
  };

  return (
    <div className="block">
      <span className="text-sm font-semibold text-slate-650 dark:text-slate-350 flex items-center gap-1.5">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1.5 w-full flex items-center justify-between rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal"
      >
        <span className={value ? "text-kat-text font-bold" : "text-slate-400 dark:text-slate-500"}>
          {value || placeholder}
        </span>
        <HugeiconsIcon
          icon={Clock01Icon}
          size={16}
          className="text-slate-400 dark:text-slate-500"
        />
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("ui.selectTime")}>
        <div className="flex flex-col items-center">
          <div className="flex justify-center w-full max-w-[240px] h-[200px] relative overflow-hidden bg-slate-50/80 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-kat-border/40 shadow-inner">
            {/* Highlight bar in the middle */}
            <div className="absolute top-1/2 -translate-y-1/2 w-[90%] h-[44px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm pointer-events-none" />

            {/* Hours column */}
            <div
              ref={hourRef}
              onScroll={handleHourScroll}
              className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[78px] px-2 relative z-10"
            >
              {hours.map((h) => (
                <div
                  key={`h-${h}`}
                  data-selected={tempHour === h}
                  onClick={() => {
                    setTempHour(h);
                    const el = hourRef.current?.querySelector(`[data-hour="${h}"]`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  data-hour={h}
                  className={`h-[44px] flex items-center justify-center snap-center cursor-pointer text-[22px] transition-all duration-200 ${tempHour === h ? "font-black text-kat-primary scale-110" : "font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                >
                  {h}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center text-xl font-black text-kat-text relative z-10 pb-1">
              :
            </div>

            {/* Minutes column */}
            <div
              ref={minRef}
              onScroll={handleMinScroll}
              className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[78px] px-2 relative z-10"
            >
              {minutes.map((m) => (
                <div
                  key={`m-${m}`}
                  data-selected={tempMinute === m}
                  onClick={() => {
                    setTempMinute(m);
                    const el = minRef.current?.querySelector(`[data-min="${m}"]`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  data-min={m}
                  className={`h-[44px] flex items-center justify-center snap-center cursor-pointer text-[22px] transition-all duration-200 ${tempMinute === m ? "font-black text-kat-primary scale-110" : "font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full mt-6">
            <button
              onClick={handleSave}
              className="w-full flex h-[52px] items-center justify-center rounded-2xl bg-kat-dark text-white dark:bg-kat-primary dark:text-kat-dark px-6 font-black shadow-sm hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all motion-press"
            >
              {t("ui.saveTime")}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
