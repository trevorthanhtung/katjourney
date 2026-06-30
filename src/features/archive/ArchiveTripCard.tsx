import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CompassIcon,
  Calendar01Icon,
  Location01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Trip, Expense } from "../../db";
import { formatDate, formatMoneyCompact } from "../../utils/helpers";

const CARD_GLOWS = [
  "bg-blue-400/15",
  "bg-fuchsia-400/15",
  "bg-emerald-400/15",
  "bg-rose-400/15",
  "bg-cyan-400/15",
  "bg-amber-400/15",
];

function getTripDurationText(trip: Trip, t: any) {
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  if (isDayTrip) return t("dashboard.dayTrip");
  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return t("dashboard.longTrip");
    const diffDays =
      Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    return diffNights > 0
      ? t("dashboard.duration", { days: diffDays, nights: diffNights })
      : t("dashboard.durationDaysOnly", { days: diffDays });
  } catch {
    return t("dashboard.longTrip");
  }
}

interface TripCardProps {
  trip: Trip;
  index: number;
  allExpenses: Expense[];
  memberCounts: Record<number, number>;
  onOpenTrip: (id: number) => void;
}

export function ArchiveTripCard({
  trip,
  index,
  allExpenses,
  memberCounts,
  onOpenTrip,
}: TripCardProps) {
  const { t } = useTranslation();
  const tripExpenses = allExpenses.filter((e) => e.tripId === trip.id);
  const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const glowClass = CARD_GLOWS[index % CARD_GLOWS.length];

  return (
    <div
      onClick={() => onOpenTrip(trip.id!)}
      className="group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-[28px] bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-200/60 dark:border-white/10 hover:border-[#00BFB7]/40 dark:hover:border-[#00BFB7]/50 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,191,183,0.08)] transition-all duration-500 motion-card-enter h-full min-h-[200px]"
    >
      {/* Ambient glass glow specific to each card */}
      <div
        className={`absolute top-0 right-0 w-[200px] h-[200px] ${glowClass} blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700`}
      />

      {/* Background decorative compass */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.05] dark:opacity-[0.1] pointer-events-none rotate-12 group-hover:rotate-[24deg] group-hover:scale-110 transition-transform duration-1000 ease-out">
        <HugeiconsIcon icon={CompassIcon} size={140} className="text-kat-primary" />
      </div>

      {/* Top: Badge */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="inline-flex items-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-[11px] font-black tracking-wide text-slate-700 dark:text-slate-300">
          {getTripDurationText(trip, t)}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
          <HugeiconsIcon
            icon={SparklesIcon}
            size={16}
            className="text-kat-primary group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm"
          />
        </div>
      </div>

      {/* Trip title */}
      <h4 className="text-[20px] font-black text-kat-text leading-tight mb-5 line-clamp-2 tracking-tight group-hover:bg-gradient-to-r group-hover:from-kat-primary group-hover:to-teal-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 relative z-10 w-fit">
        {trip.title}
      </h4>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 mt-auto relative z-10">
        <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-[12px] min-w-0 transition-all group-hover:bg-white/60 dark:group-hover:bg-white/10 backdrop-blur-sm">
          <HugeiconsIcon
            icon={Location01Icon}
            size={14}
            className="text-kat-primary shrink-0 drop-shadow-sm"
          />
          <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">
            {trip.destinations && trip.destinations.length > 1
              ? t("trip.locationAndOthers", {
                  location: trip.destinations[0].name,
                  count: trip.destinations.length - 1,
                  defaultValue: "{{location}} & {{count}} điểm khác",
                })
              : trip.location || t("common.unknownLocation")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-[12px] min-w-0 transition-all group-hover:bg-white/60 dark:group-hover:bg-white/10 backdrop-blur-sm">
          <HugeiconsIcon
            icon={Calendar01Icon}
            size={14}
            className="text-kat-primary shrink-0 drop-shadow-sm"
          />
          <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">
            {formatDate(trip.startDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-[12px] min-w-0 transition-all group-hover:bg-white/60 dark:group-hover:bg-white/10 backdrop-blur-sm">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={14}
            className="text-kat-primary shrink-0 drop-shadow-sm"
          />
          <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">
            {t("dashboard.peopleCount", { count: memberCounts[trip.id!] || 1 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-[12px] min-w-0 transition-all group-hover:bg-white/60 dark:group-hover:bg-white/10 backdrop-blur-sm">
          <HugeiconsIcon
            icon={WalletCardsIcon}
            size={14}
            className="text-kat-primary shrink-0 drop-shadow-sm"
          />
          <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">
            {totalExpense > 0
              ? t("dashboard.expenseTotal", {
                  amount: formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND"),
                })
              : t("dashboard.noExpense")}
          </span>
        </div>
      </div>
    </div>
  );
}
