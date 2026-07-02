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

export function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("ui.selectDate");
  const [isOpen, setIsOpen] = React.useState(false);

  const hash = React.useMemo(() => {
    const safeLabel =
      typeof label === "string"
        ? label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "date";
    return `date-${safeLabel || "picker"}`;
  }, [label]);

  useModalHistory(isOpen, () => setIsOpen(false), hash);

  const [viewDate, setViewDate] = React.useState(() => {
    return value ? new Date(value) : new Date();
  });

  React.useEffect(() => {
    if (isOpen) {
      setViewDate(value ? new Date(value) : new Date());
    }
  }, [isOpen, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon

  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDayIndex }, (_, i) => i);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(year, month, day);
    // adjust timezone offset to avoid getting wrong UTC date
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
    const isoString = adjustedDate.toISOString().split("T")[0];
    onChange(isoString);
    setIsOpen(false);
  };

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // formatting selected value for display
  const displayValue = value
    ? (() => {
        const d = new Date(value);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      })()
    : "";

  return (
    <div className="block">
      <span className="text-sm font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1.5 w-full flex items-center justify-between rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal"
      >
        <span className={value ? "text-kat-text font-bold" : "text-slate-400 dark:text-slate-500"}>
          {displayValue || resolvedPlaceholder}
        </span>
        <HugeiconsIcon
          icon={Calendar01Icon}
          size={16}
          className="text-slate-400 dark:text-slate-500"
        />
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("ui.selectDate")}>
        <div className="flex flex-col items-center p-2">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center"
            >
              <HugeiconsIcon icon={ChevronLeftIcon} size={20} />
            </button>
            <h3 className="text-[17px] font-bold text-kat-text">
              {t("ui.monthYear", { month: month + 1, year })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center"
            >
              <HugeiconsIcon icon={ChevronRightIcon} size={20} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 w-full mb-2">
            {dayNames.map((d) => (
              <div
                key={d}
                className="text-center text-[13px] font-bold text-slate-400 dark:text-slate-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 w-full gap-y-2">
            {blanks.map((b) => (
              <div key={`blank-${b}`} className="h-10"></div>
            ))}
            {days.map((d) => {
              const currentDateStr = (() => {
                const newDate = new Date(year, month, d);
                const offset = newDate.getTimezoneOffset();
                const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
                return adjustedDate.toISOString().split("T")[0];
              })();
              const isSelected = value === currentDateStr;
              const isToday = (() => {
                const today = new Date();
                return (
                  today.getDate() === d &&
                  today.getMonth() === month &&
                  today.getFullYear() === year
                );
              })();

              return (
                <div key={d} className="flex items-center justify-center h-10">
                  <button
                    onClick={() => handleSelectDay(d)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-medium transition-all duration-200
                      ${
                        isSelected
                          ? "bg-kat-primary text-white font-bold shadow-md scale-110"
                          : isToday
                            ? "bg-slate-105 dark:bg-slate-800 text-kat-primary font-bold border border-kat-primary border-opacity-20"
                            : "text-kat-text hover:bg-slate-100 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    {d}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="w-full mt-8">
            <button
              onClick={() => {
                const today = new Date();
                const offset = today.getTimezoneOffset();
                const adjustedDate = new Date(today.getTime() - offset * 60 * 1000);
                onChange(adjustedDate.toISOString().split("T")[0]);
                setIsOpen(false);
              }}
              className="w-full flex h-[52px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-kat-text dark:text-slate-200 px-6 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all motion-press"
            >
              {t("ui.selectToday")}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
