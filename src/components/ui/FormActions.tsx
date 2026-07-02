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
        className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark text-white dark:bg-kat-primary dark:text-kat-dark px-6 font-bold shadow-xs hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed motion-press"
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
