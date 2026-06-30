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
