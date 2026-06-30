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

export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-kat-border/60 bg-kat-surface p-5 shadow-soft">
      <h3 className="mb-4 text-xl font-bold text-kat-text">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  onFocus,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  onFocus?: () => void;
}) {
  const isDateOrTime = type === "date" || type === "time";

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-650 dark:text-slate-350 flex items-center gap-1.5">
        {label}
      </span>
      <div className="relative mt-1.5">
        <input
          className={`w-full rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium text-kat-text outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500 ${
            isDateOrTime
              ? "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer bg-white dark:bg-kat-surface"
              : ""
          }`}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
        />
        {isDateOrTime && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 bg-white dark:bg-kat-surface pl-2">
            {type === "date" ? (
              <HugeiconsIcon icon={Calendar01Icon} size={16} />
            ) : (
              <HugeiconsIcon icon={Clock01Icon} size={16} />
            )}
          </div>
        )}
      </div>
    </label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-655 dark:text-slate-350 flex items-center gap-1.5">
        {label}
      </span>
      <textarea
        className="mt-1.5 min-h-[120px] w-full rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 py-3.5 text-[15px] font-medium text-kat-text outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

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
        className="mt-1.5 w-full flex items-center justify-between rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal"
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

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  labels,
  buttonClassName,
}: {
  label?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  labels?: Record<string, string>;
  buttonClassName?: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const hash = React.useMemo(() => {
    const safeLabel =
      typeof label === "string"
        ? label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "select";
    return `select-${safeLabel || "picker"}`;
  }, [label]);

  useModalHistory(isOpen, () => setIsOpen(false), hash);

  return (
    <div className="block">
      {label && (
        <span className="text-sm font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ??
          "mt-1.5 w-full flex items-center justify-between rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal"
        }
      >
        <span className={value ? "text-kat-text font-bold" : "text-slate-400 dark:text-slate-500"}>
          {value ? (labels?.[value] ?? value) : (placeholder ?? t("ui.notSelected"))}
        </span>
        <HugeiconsIcon
          icon={ChevronDownIcon}
          size={16}
          className="text-slate-400 dark:text-slate-500"
        />
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("ui.selectOption")}>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-none pb-2">
          {options.map((option) => {
            const isSelected = value === option;
            const displayLabel = option
              ? (labels?.[option] ?? option)
              : (placeholder ?? t("ui.notSelected"));
            return (
              <button
                key={option || `empty-${Math.random()}`}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors border-b border-slate-100/60 dark:border-white/5 last:border-0 ${
                  isSelected
                    ? "bg-[#00BFB7]/10 dark:bg-white/10 text-kat-primary dark:text-kat-teal font-bold"
                    : "text-kat-text hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span className={`text-[15px] ${isSelected ? "font-extrabold" : "font-semibold"}`}>
                  {displayLabel}
                </span>
                {isSelected && (
                  <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export function FormActions({
  onSave,
  saveLabel,
  saveAriaLabel,
  onCancel,
  disabled,
}: {
  onSave: () => void;
  saveLabel: string;
  saveAriaLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2.5 pt-2 w-full">
      {onCancel && (
        <button
          className="flex shrink-0 h-[52px] items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border-0 ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.96] transition-all duration-200 motion-press"
          type="button"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </button>
      )}
      <button
        className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark text-white dark:bg-kat-primary dark:text-kat-dark px-6 font-black shadow-sm hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed motion-press"
        type="button"
        onClick={onSave}
        disabled={disabled}
        aria-label={saveAriaLabel ?? saveLabel}
      >
        <HugeiconsIcon icon={CheckIcon} size={20} />
        {saveLabel}
      </button>
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      className={classNames(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors motion-press",
        danger
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30"
          : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/60"
      )}
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function EmptyCard({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] bg-kat-surface p-8 text-center border border-kat-border/60 shadow-soft max-w-md mx-auto">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold text-kat-text/80">{text}</p>
    </div>
  );
}

export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 px-1 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-kat-surface p-5 shadow-sm border border-kat-border/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-bold text-kat-text">{value}</p>
    </div>
  );
}

export function ProgressBar({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div
      className={classNames(
        "overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        compact ? "mt-3 h-1.5" : "mt-4 h-2.5"
      )}
    >
      <div
        className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="absolute -rotate-90 transform" width={size} height={size}>
        <circle
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerAction,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const { t } = useTranslation();
  useBodyScrollLock(isOpen);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            variants={modalOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet / Dialog */}
          <motion.div
            variants={sheetContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10 flex w-full flex-col max-h-[90vh] sm:max-h-[min(720px,calc(100vh-48px))] rounded-t-[32px] sm:rounded-[24px] bg-white/90 dark:bg-[#0A0F1C]/85 backdrop-blur-3xl pb-safe shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] sm:mx-auto sm:w-full sm:max-w-[720px] overflow-hidden border border-slate-200/60 dark:border-white/10"
          >
            {/* Ambient glow inside modal */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-kat-primary/10 dark:bg-[#00BFB7]/15 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

            {/* Drag handle (mobile only) */}
            <div className="relative z-10 flex shrink-0 h-1.5 w-12 mx-auto mt-3 mb-1 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

            {/* Header */}
            <div className="relative z-10 flex shrink-0 items-start justify-between border-b border-slate-200/60 dark:border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 gap-3 bg-transparent">
              <div className="pr-2 min-w-0 flex-1">
                <h3 className="text-[20px] sm:text-[22px] font-black bg-gradient-to-r from-kat-dark to-kat-primary dark:from-white dark:to-teal-300 bg-clip-text text-transparent drop-shadow-sm leading-snug truncate">
                  {title}
                </h3>
                {subtitle && (
                  <div className="mt-1 text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                    {subtitle}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerAction}
                <button
                  className="group flex shrink-0 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-sm focus:outline-none"
                  onClick={onClose}
                  title={t("ui.close")}
                  aria-label={t("ui.close")}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={20}
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 scrollbar-hide bg-slate-50/50 dark:bg-transparent">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="relative z-10 flex-none border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#0A0F1C]/40 dark:backdrop-blur-xl px-5 sm:px-6 py-3.5 sm:py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function TypedDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmLabel,
  confirmationText,
  inputPlaceholder,
  itemName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  warning?: React.ReactNode;
  confirmLabel?: string;
  confirmationText?: string;
  inputPlaceholder?: string;
  itemName?: string;
}) {
  const { t } = useTranslation();
  const actualConfirmLabel = confirmLabel || t("common.delete");
  const actualConfirmationText = confirmationText || t("common.delete").toUpperCase();

  const [typedText, setTypedText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isConfirmed =
    typedText.trim().localeCompare(actualConfirmationText.trim(), undefined, {
      sensitivity: "base",
    }) === 0;

  React.useEffect(() => {
    if (isOpen) {
      setTypedText("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (!isConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-[13.5px] text-rose-800 dark:text-rose-400 font-semibold leading-relaxed">
          {warning ?? description}
        </div>

        {warning && (
          <p className="text-[14px] font-semibold leading-relaxed text-kat-muted">{description}</p>
        )}

        {itemName && (
          <div className="rounded-2xl border border-kat-border/40 bg-slate-50 dark:bg-slate-800/20 px-4 py-3">
            <p className="text-[12px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t("common.itemToDelete")}
            </p>
            <p className="mt-1 break-words text-[15px] font-extrabold text-kat-text">{itemName}</p>
          </div>
        )}

        <label className="block space-y-2">
          <span className="text-[13.5px] font-bold text-slate-650 dark:text-slate-400 block">
            <Trans i18nKey="common.typeToConfirm" values={{ text: actualConfirmationText }}>
              Nhập <span className="text-rose-500 font-black">{actualConfirmationText}</span> để xác
              nhận thao tác này.
            </Trans>
          </span>
          <input
            type="text"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            placeholder={
              inputPlaceholder ??
              t("common.typeToConfirmPlaceholder", { text: actualConfirmationText })
            }
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-[14px] border border-slate-200/60 dark:border-slate-700/65 bg-slate-50 dark:bg-slate-800/40 px-4 h-[50px] text-[15px] font-bold text-kat-text outline-none transition-all focus:bg-white dark:focus:bg-kat-surface focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </label>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border-0 ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 text-slate-700 dark:text-slate-200 px-6 font-bold hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200 motion-press"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleConfirm}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 disabled:bg-rose-200 dark:disabled:bg-rose-950/20 disabled:border-rose-200 dark:disabled:border-rose-900/10 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100 motion-press"
          >
            <HugeiconsIcon icon={Delete01Icon} size={20} />
            {isSubmitting ? t("common.deleting") : actualConfirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  itemName?: string;
  confirmLabel?: string;
}) {
  const { t } = useTranslation();
  const actualConfirmLabel = confirmLabel || t("common.delete");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 text-[13.5px] text-rose-800 dark:text-rose-400 font-semibold leading-relaxed">
          {description}
        </div>

        {itemName && (
          <div className="rounded-2xl border border-kat-border/40 bg-slate-50 dark:bg-slate-800/20 px-4 py-3">
            <p className="text-[12px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t("common.itemToDelete")}
            </p>
            <p className="mt-1 break-words text-[15px] font-extrabold text-kat-text">{itemName}</p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border-0 ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200 motion-press"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 disabled:bg-rose-200 dark:disabled:bg-rose-950/20 disabled:border-rose-200 dark:disabled:border-rose-900/10 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100 motion-press"
          >
            <HugeiconsIcon icon={Delete01Icon} size={20} />
            {isSubmitting ? t("common.deleting") : actualConfirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export function FAB({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={classNames(
        "fixed bottom-[120px] right-4 z-30 flex items-center justify-center rounded-full shadow-floating lg:right-[calc(max(1rem,50vw-512px+1rem))] motion-press lg:motion-hover-lift",
        className || "h-14 w-14 bg-sunset-600 hover:scale-105 text-white"
      )}
      style={{ bottom: "calc(6rem + var(--safe-bottom))" }}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
export * from "./DateRangePicker";
