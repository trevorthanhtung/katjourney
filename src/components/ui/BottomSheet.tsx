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
                <h3 className="text-[20px] sm:text-[22px] font-bold bg-gradient-to-r from-kat-dark to-kat-primary dark:from-white dark:to-teal-300 bg-clip-text text-transparent drop-shadow-sm leading-snug truncate">
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
