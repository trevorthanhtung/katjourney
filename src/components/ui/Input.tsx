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
          className={`w-full rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 h-[50px] text-[15px] font-medium text-kat-text outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500 ${
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
        className="mt-1.5 min-h-[120px] w-full rounded-xl border-0 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md px-4 py-3.5 text-[15px] font-medium text-kat-text outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 transition-shadow focus:bg-white/80 dark:focus:bg-white/5 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
