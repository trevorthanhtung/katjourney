import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Add01Icon,
  Calendar01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { EventItem, Trip } from "../../db";
import { classNames } from "../../utils/helpers";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function TimelineCalendarView({
  events,
  trip,
  onOpenNewForm,
  renderActivityCard,
}: {
  events: EventItem[];
  trip: Trip;
  onOpenNewForm: (date?: string) => void;
  renderActivityCard: (item: EventItem, idx: number) => React.ReactNode;
}) {
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(() => {
    return trip.startDate ? new Date(trip.startDate) : new Date();
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(trip.startDate || null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
  // We want Monday = 0, Sunday = 6
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsByDate = events.reduce<Record<string, EventItem[]>>((acc, event) => {
    if (!event.date) return acc;
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Formatting helper for standard YYYY-MM-DD
  const formatIsoDate = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const selectedEvents =
    selectedDate && eventsByDate[selectedDate]
      ? eventsByDate[selectedDate].sort((a, b) => (a.time || "").localeCompare(b.time || ""))
      : [];

  return (
    <div className="space-y-6 motion-page-enter">
      {/* Calendar Card */}
      <div className="bg-white dark:bg-kat-surface rounded-[28px] p-5 md:p-6 shadow-soft border border-slate-100 dark:border-kat-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-black text-kat-dark capitalize">
            {t("calendar.monthTitle", { month: month + 1, year })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              aria-label={t("ui.prevMonth")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <HugeiconsIcon icon={ChevronLeftIcon} className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              aria-label={t("ui.nextMonth")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <HugeiconsIcon icon={ChevronRightIcon} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2 border-b border-slate-100 dark:border-slate-700/40 pb-2">
          {[
            t("calendar.mon"),
            t("calendar.tue"),
            t("calendar.wed"),
            t("calendar.thu"),
            t("calendar.fri"),
            t("calendar.sat"),
            t("calendar.sun"),
          ].map((d) => (
            <div key={d} className="text-[12px] font-bold text-slate-400 dark:text-slate-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10 md:h-12" />;
            }

            const dateStr = formatIsoDate(day);
            const isSelected = selectedDate === dateStr;
            const hasEvents = !!eventsByDate[dateStr];
            const isTripDay =
              dateStr >= (trip.startDate || "") &&
              dateStr <= (trip.endDate || trip.startDate || "");

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={classNames(
                  "relative h-10 md:h-12 w-full flex flex-col items-center justify-center rounded-[14px] transition-all duration-200 cursor-pointer motion-press",
                  isSelected
                    ? "bg-[#030D2E] dark:bg-kat-primary text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_16px_rgba(0,191,183,0.3)] border border-[#030D2E]/20 dark:border-kat-primary font-extrabold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent",
                  !isSelected && isTripDay
                    ? "bg-kat-primary-soft text-kat-text font-extrabold"
                    : !isSelected && "text-slate-600 dark:text-slate-400 font-semibold"
                )}
              >
                <span className={classNames("text-[14px] md:text-[15px]")}>{day}</span>
                {hasEvents && (
                  <div
                    className={classNames(
                      "absolute bottom-[5px] w-[5px] h-[5px] rounded-full",
                      isSelected ? "bg-white dark:bg-slate-900" : "bg-kat-teal"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-100 dark:border-slate-700/40 pb-3">
            <h4 className="text-[16px] font-extrabold text-kat-dark flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5 text-kat-teal" />
              {t("calendar.scheduleForDate", { date: selectedDate.split("-").reverse().join("/") })}
            </h4>
            <button
              onClick={() => onOpenNewForm(selectedDate)}
              className="flex items-center gap-1 text-[13px] font-bold text-kat-teal hover:brightness-95 transition-colors motion-press px-2 py-1 bg-kat-primary-soft rounded-lg"
            >
              <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              {t("calendar.add")}
            </button>
          </div>

          <div className="space-y-4">
            {selectedEvents.length > 0 ? (
              <div className="px-1">
                {selectedEvents.map((item, idx) => renderActivityCard(item, idx))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-kat-surface border border-slate-200 dark:border-kat-border rounded-[24px] p-6 text-center shadow-xs">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-xs text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5" />
                  </div>
                </div>
                <h5 className="text-[15px] font-bold text-kat-dark dark:text-slate-100">
                  {t("calendar.emptyDay")}
                </h5>
                <p className="mt-1 text-[13.5px] font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t("calendar.emptyDayDesc")}
                </p>
                <button
                  onClick={() => onOpenNewForm(selectedDate)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-4 py-2.5 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs motion-press"
                >
                  <HugeiconsIcon icon={Add01Icon} className="w-4 h-4 text-kat-primary" />
                  {t("calendar.addActivity")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
