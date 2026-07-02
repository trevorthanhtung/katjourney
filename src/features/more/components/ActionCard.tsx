import { classNames } from "../../../utils/helpers";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../../constants/currencies";
import { showToast } from "../../../components/ui/ToastManager";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AwardIcon,
  BookOpen01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Car01Icon,
  Camera01Icon,
  CallIcon,
  CircleUnlock01Icon,
  CheckIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock01Icon,
  Coffee01Icon,
  CompassIcon,
  CopyIcon,
  CrownIcon,
  DatabaseBackupIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  FileDownloadIcon,
  GlobeIcon,
  InformationCircleIcon,
  Location01Icon,
  Coins01Icon,
  LockIcon,
  Luggage01Icon,
  MapsIcon,
  MoreVerticalIcon,
  Note01Icon,
  PackageIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Route01Icon,
  Search01Icon,
  Share01Icon,
  SmilePlusIcon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
  Table01Icon,
  Ticket01Icon,
  UserIcon,
  UserAdd01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  ChevronDownIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

export function ActionCard({
  icon: Icon,
  title,
  onClick,
  iconBgColor = "bg-kat-primary-soft dark:bg-kat-primary/10",
  iconTextColor = "text-kat-teal dark:text-kat-teal",
  className = "",
  titleClassName = "text-kat-dark dark:text-slate-200",
  rightElement,
  disabled,
}: {
  icon: any;
  title: string;
  onClick?: () => void;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
  titleClassName?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="absolute inset-0 bg-linear-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5"></div>
      <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
        <div
          className={classNames(
            "flex shrink-0 h-11 w-11 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3",
            iconBgColor,
            iconTextColor
          )}
        >
          <HugeiconsIcon icon={Icon} className="h-5.5 w-5.5" />
        </div>
        <span
          className={classNames(
            "text-[15px] font-bold truncate leading-tight transition-colors group-hover:text-kat-primary dark:group-hover:text-kat-teal",
            titleClassName
          )}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-2 relative z-10">
        {rightElement !== undefined
          ? rightElement
          : (onClick || disabled) && (
              <HugeiconsIcon
                icon={ChevronRightIcon}
                className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-1"
              />
            )}
      </div>
    </>
  );

  const wrapperClasses = classNames(
    "group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border p-4 shadow-xs transition-all focus:outline-hidden",
    disabled
      ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60 cursor-not-allowed"
      : "bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 hover:border-kat-primary/30 dark:hover:border-kat-primary/40 hover:shadow-md active:scale-[0.98]",
    className
  );

  if (onClick || disabled) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={wrapperClasses}>
        {content}
      </button>
    );
  }

  return (
    <div
      className={classNames(
        "flex w-full items-center justify-between bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-4 py-3 rounded-2xl min-h-[56px] text-kat-dark dark:text-slate-200",
        className
      )}
    >
      {content}
    </div>
  );
}
