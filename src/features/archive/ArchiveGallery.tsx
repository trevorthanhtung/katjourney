import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CompassIcon,
  Calendar01Icon,
  Location01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, Expense } from "../../db";
import { formatDate, formatMoneyCompact } from "../../utils/helpers";

// A palette of premium glassmorphism glow colors for cards
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

function TripCard({ trip, index, allExpenses, memberCounts, onOpenTrip }: TripCardProps) {
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

export function ArchiveGallery({
  onBack,
  onOpenTrip,
}: {
  onBack: () => void;
  onOpenTrip: (id: number) => void;
}) {
  const { t } = useTranslation();
  const archivedTrips =
    useLiveQuery(async () =>
      (await db.trips.toArray()).filter((t) => !t.isDeleted && t.status === "archived")
    ) ?? [];
  const allMembers =
    useLiveQuery(async () => (await db.members.toArray()).filter((m) => !m.isDeleted)) ?? [];
  const allExpenses =
    useLiveQuery(async () => (await db.expenses.toArray()).filter((e) => !e.isDeleted)) ?? [];

  const memberCounts = allMembers.reduce(
    (acc, m) => {
      acc[m.tripId] = (acc[m.tripId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const sortedTrips = [...archivedTrips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const tripsByYear: { [year: string]: Trip[] } = {};
  sortedTrips.forEach((trip) => {
    const year = trip.startDate ? trip.startDate.split("-")[0] : t("archive.unknownYear");
    if (!tripsByYear[year]) {
      tripsByYear[year] = [];
    }
    tripsByYear[year].push(trip);
  });

  const years = Object.keys(tripsByYear).sort((a, b) => b.localeCompare(a));

  // getTripDurationText and TripCard have been moved to the top level (outside ArchiveGallery) to prevent React unmounting/re-rendering animation bugs.

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 md:pt-4 md:pb-16 motion-page-enter">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label={t("archive.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 hover:border-[#00BFB7]/40 dark:hover:border-[#00BFB7]/50 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,191,183,0.12)] transition-all duration-300 shadow-sm group motion-press"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            className="text-kat-dark dark:text-white group-hover:text-kat-primary transition-colors"
          />
        </button>
        <div>
          <h1 className="text-[24px] font-black bg-gradient-to-r from-kat-dark to-kat-primary dark:from-white dark:to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
            {t("archive.title")}
          </h1>
          <p className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
            {archivedTrips.length > 0
              ? t("archive.savedTrips", { count: archivedTrips.length })
              : t("archive.noTripsDesc")}
          </p>
        </div>
      </div>

      {archivedTrips.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #1A3A5C 0%, #2460A7 100%)",
              boxShadow: "0 8px 32px rgba(26,58,92,0.3)",
            }}
          >
            <HugeiconsIcon icon={CompassIcon} size={40} className="text-white" />
          </div>
          <h3 className="text-[20px] font-extrabold text-kat-dark">{t("archive.emptyTitle")}</h3>
          <p className="mt-2 text-[14px] font-semibold text-slate-500 max-w-xs leading-relaxed">
            {t("archive.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <div key={year} className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-[19px] font-black text-kat-dark tracking-tight">{year}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100/75 border border-slate-200/50 px-3 py-1 rounded-full">
                  {t("archive.tripCount", { count: tripsByYear[year].length })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {tripsByYear[year].map((trip, i) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    index={i}
                    allExpenses={allExpenses}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
