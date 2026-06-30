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
              <Trans
                i18nKey="ui.typeToConfirm"
                values={{ text: actualConfirmationText }}
                components={{ span: <span className="text-rose-500 font-black" /> }}
              />
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
