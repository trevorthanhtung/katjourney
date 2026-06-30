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
