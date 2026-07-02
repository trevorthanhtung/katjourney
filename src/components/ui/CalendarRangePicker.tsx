import { classNames } from "../../utils/helpers";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../constants/currencies";
import { showToast } from "../../components/ui/ToastManager";
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

export function CalendarRangePicker({
  startDate,
  endDate,
  tripType,
  onChangeTripType,
  onChangeStart,
  onChangeEnd,
}: {
  startDate: string;
  endDate: string;
  tripType: "dayTrip" | "multiDay";
  onChangeTripType: (t: "dayTrip" | "multiDay") => void;
  onChangeStart: (d: string) => void;
  onChangeEnd: (d: string) => void;
}) {
  const { t } = useTranslation();
  const daysOfWeek = t("tripForm.daysOfWeek", { returnObjects: true }) as string[];
  const months = t("tripForm.months", { returnObjects: true }) as string[];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const initialMonth = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = React.useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initialMonth.getMonth());
  // hoverDate for range preview (multiDay)
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);
  // picking state: first click = start, second click = end
  const [pickingEnd, setPickingEnd] = React.useState(false);

  function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfWeek(y: number, m: number) {
    return new Date(y, m, 1).getDay(); // 0=Sun
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((v) => v - 1);
    } else setViewMonth((v) => v - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((v) => v + 1);
    } else setViewMonth((v) => v + 1);
  }

  function handleDayClick(iso: string) {
    if (tripType === "dayTrip") {
      onChangeStart(iso);
      onChangeEnd(iso);
      return;
    }
    // multiDay: 2-tap selection
    if (!pickingEnd) {
      onChangeStart(iso);
      onChangeEnd(iso);
      setPickingEnd(true);
    } else {
      if (iso < startDate) {
        onChangeStart(iso);
        onChangeEnd(startDate);
      } else {
        onChangeEnd(iso);
      }
      setPickingEnd(false);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const effectiveEnd =
    tripType === "dayTrip"
      ? startDate
      : pickingEnd && hoverDate
        ? hoverDate < startDate
          ? startDate
          : hoverDate
        : endDate;

  // Format display
  function fmtDisplay(iso: string) {
    if (!iso) return "--";
    const d = new Date(iso + "T00:00:00");
    return t("tripForm.dateFmt", {
      day: d.getDate(),
      month: months[d.getMonth()],
      year: d.getFullYear(),
    });
  }

  const monthLabel = `${months[viewMonth]} ${viewYear}`;

  return (
    <div className="w-full">
      {/* Sliding Pill Segmented Control */}
      <div className="relative flex p-1.5 mb-6 bg-slate-100/80 dark:bg-slate-800/50 rounded-[20px] backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
        <div
          className={classNames(
            "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-[16px] bg-white dark:bg-[#1a2336] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-300",
            tripType === "multiDay" ? "translate-x-[calc(100%+12px)]" : "translate-x-0"
          )}
        />
        <button
          type="button"
          onClick={() => {
            onChangeTripType("dayTrip");
            setPickingEnd(false);
          }}
          className="relative z-10 flex flex-col items-center justify-center flex-1 py-2 sm:py-2.5 transition-colors"
        >
          <span
            className={classNames(
              "text-[14.5px] font-bold transition-colors duration-300",
              tripType === "dayTrip"
                ? "text-kat-dark dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {t("tripForm.dayTripBtn")}
          </span>
          <span
            className={classNames(
              "text-[11.5px] font-semibold mt-0.5 transition-colors duration-300",
              tripType === "dayTrip"
                ? "text-slate-500 dark:text-slate-400"
                : "text-slate-400/70 dark:text-slate-500/70"
            )}
          >
            {t("tripForm.dayTripDesc")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            onChangeTripType("multiDay");
            setPickingEnd(false);
          }}
          className="relative z-10 flex flex-col items-center justify-center flex-1 py-2 sm:py-2.5 transition-colors"
        >
          <span
            className={classNames(
              "text-[14.5px] font-bold transition-colors duration-300",
              tripType === "multiDay"
                ? "text-kat-dark dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {t("tripForm.multiDayBtn")}
          </span>
          <span
            className={classNames(
              "text-[11.5px] font-semibold mt-0.5 transition-colors duration-300",
              tripType === "multiDay"
                ? "text-slate-500 dark:text-slate-400"
                : "text-slate-400/70 dark:text-slate-500/70"
            )}
          >
            {t("tripForm.multiDayDesc")}
          </span>
        </button>
      </div>

      {/* Calendar Card */}
      <div className="rounded-[24px] bg-white dark:bg-[#0A0F1C]/60 border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Date Summary Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div className="text-[18px] sm:text-[20px] font-bold text-kat-dark dark:text-white flex items-center flex-wrap gap-2">
            {tripType === "dayTrip" ? (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} size={20} className="text-kat-primary" />
                {fmtDisplay(startDate)}
              </span>
            ) : (
              <>
                <span
                  className={classNames(
                    "flex items-center gap-2 transition-colors",
                    !startDate && "text-slate-400"
                  )}
                >
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={20}
                    className={startDate ? "text-kat-primary" : "text-slate-400/60"}
                  />
                  {startDate
                    ? fmtDisplay(startDate)
                    : t("tripForm.pickStartPrompt", "Pick start date...")}
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  className="text-slate-400/60 mx-1"
                />
                <span
                  className={classNames(
                    "transition-colors",
                    (!effectiveEnd || pickingEnd) && "text-kat-primary animate-pulse"
                  )}
                >
                  {pickingEnd
                    ? t("tripForm.pickEndPrompt", "Pick end date...")
                    : fmtDisplay(effectiveEnd)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-500 dark:text-slate-400"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
          </button>
          <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-500 dark:text-slate-400"
          >
            <HugeiconsIcon icon={ChevronRightIcon} size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/10">
          {daysOfWeek.map((d) => (
            <div
              key={d}
              className="py-1.5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-1 pb-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-8" />;
            const iso = toISO(viewYear, viewMonth, day);
            const isStart = iso === startDate;
            const isEnd = tripType !== "dayTrip" && iso === effectiveEnd;
            const inRange =
              tripType !== "dayTrip" &&
              startDate &&
              effectiveEnd &&
              iso > startDate &&
              iso < effectiveEnd;
            const isToday = iso === todayDate.toISOString().split("T")[0];

            // Rounded cap logic for range bar
            const isStartCap = isStart && tripType !== "dayTrip" && startDate !== effectiveEnd;
            const isEndCap = isEnd && startDate !== effectiveEnd;
            const isSingleDay = isStart && isEnd;

            return (
              <div
                key={iso}
                className="relative h-8 flex items-center justify-center"
                onMouseEnter={() => tripType === "multiDay" && pickingEnd && setHoverDate(iso)}
                onMouseLeave={() => tripType === "multiDay" && pickingEnd && setHoverDate(null)}
              >
                {/* Range bar background */}
                {(inRange || isStartCap || isEndCap) && !isSingleDay && (
                  <div
                    className={classNames(
                      "absolute inset-y-0.5 bg-[#00BFB7]/15 dark:bg-kat-teal/20",
                      isStartCap
                        ? "left-1/2 right-0"
                        : isEndCap
                          ? "left-0 right-1/2"
                          : "left-0 right-0"
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleDayClick(iso)}
                  className={classNames(
                    "relative z-10 h-7 w-7 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all active:scale-95",
                    (isStart || isEnd) && !isSingleDay
                      ? "bg-kat-primary text-white dark:text-slate-950 font-bold shadow-xs"
                      : isSingleDay
                        ? "bg-kat-primary text-white dark:text-slate-950 font-bold shadow-xs"
                        : inRange
                          ? "text-kat-primary dark:text-kat-teal font-semibold hover:bg-[#00BFB7]/10 dark:hover:bg-kat-teal/20"
                          : isToday
                            ? "text-kat-primary dark:text-kat-teal font-bold ring-1 ring-[#00BFB7]/50 dark:ring-kat-teal/50 hover:bg-[#00BFB7]/10 dark:hover:bg-kat-teal/20"
                            : "text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/5"
                  )}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// --- End CalendarRangePicker ---
