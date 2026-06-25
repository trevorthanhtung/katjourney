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
  SparklesIcon 
} from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, Expense } from "../../db";
import { formatDate } from "../../utils/helpers";

// A palette of premium gradients for cards
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #1A3A5C 0%, #1E4976 55%, #2460A7 100%)",
  "linear-gradient(135deg, #2D1B69 0%, #3D2B8C 55%, #4A35A8 100%)",
  "linear-gradient(135deg, #0F4C3A 0%, #1A6B50 55%, #217A5C 100%)",
  "linear-gradient(135deg, #4A1942 0%, #6B2760 55%, #7D3070 100%)",
  "linear-gradient(135deg, #1A3A5C 0%, #0F4C81 55%, #1565C0 100%)",
  "linear-gradient(135deg, #5C2A1A 0%, #7A3A20 55%, #963F1E 100%)",
];

function getTripDurationText(trip: Trip, t: any) {
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  if (isDayTrip) return t('dashboard.dayTrip');
  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return t('dashboard.longTrip');
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    return diffNights > 0 ? t('dashboard.duration', { days: diffDays, nights: diffNights }) : t('dashboard.durationDaysOnly', { days: diffDays });
  } catch {
    return t('dashboard.longTrip');
  }
}

interface TripCardProps {
  trip: Trip;
  index: number;
  allExpenses: Expense[];
  memberCounts: Record<number, number>;
  onOpenTrip: (id: number) => void;
}

function TripCard({ 
  trip, 
  index,
  allExpenses,
  memberCounts,
  onOpenTrip
}: TripCardProps) {
  const { t } = useTranslation();
  const tripExpenses = allExpenses.filter(e => e.tripId === trip.id);
  const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      onClick={() => onOpenTrip(trip.id!)}
      className="group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-[28px] p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl motion-card-enter h-full min-h-[200px]"
      style={{
        background: gradient,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      {/* Background decorative compass */}
      <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none rotate-12">
        <HugeiconsIcon icon={CompassIcon} size={112} className="text-white" />
      </div>

      {/* Top: Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
          style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          {getTripDurationText(trip, t)}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <HugeiconsIcon icon={SparklesIcon} size={16} className="text-white/80" />
        </div>
      </div>

      {/* Trip title */}
      <h4 className="text-[20px] font-extrabold text-white leading-tight mb-5 line-clamp-2 tracking-tight">
        {trip.title}
      </h4>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={Location01Icon} size={14} className="text-white/50 shrink-0" />
          <span className="text-[12.5px] font-semibold text-white/75 truncate">
            {trip.location || t("common.unknownLocation")}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-white/50 shrink-0" />
          <span className="text-[12.5px] font-semibold text-white/75 truncate">
            {formatDate(trip.startDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-white/50 shrink-0" />
          <span className="text-[12.5px] font-semibold text-white/75 truncate">
            {t('dashboard.peopleCount', { count: memberCounts[trip.id!] || 1 })}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={WalletCardsIcon} size={14} className="text-white/50 shrink-0" />
          <span className="text-[12.5px] font-semibold text-white/75 truncate">
            {totalExpense > 0 ? t('dashboard.expenseTotal', { amount: totalExpense.toLocaleString() + 'đ' }) : t('dashboard.noExpense')}
          </span>
        </div>
      </div>

      {/* Hover shimmer overlay */}
      <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)" }}
      />
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
const archivedTrips = useLiveQuery(async () =>
    (await db.trips.toArray()).filter(t => !t.isDeleted && t.status === 'archived')
  ) ?? [];
  const allMembers = useLiveQuery(async () =>
    (await db.members.toArray()).filter(m => !m.isDeleted)
  ) ?? [];
  const allExpenses = useLiveQuery(async () =>
    (await db.expenses.toArray()).filter(e => !e.isDeleted)
  ) ?? [];

  const memberCounts = allMembers.reduce((acc, m) => {
    acc[m.tripId] = (acc[m.tripId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const sortedTrips = [...archivedTrips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const tripsByYear: { [year: string]: Trip[] } = {};
  sortedTrips.forEach(trip => {
    const year = trip.startDate ? trip.startDate.split("-")[0] : t('archive.unknownYear');
    if (!tripsByYear[year]) {
      tripsByYear[year] = [];
    }
    tripsByYear[year].push(trip);
  });

  const years = Object.keys(tripsByYear).sort((a, b) => b.localeCompare(a));

  // getTripDurationText and TripCard have been moved to the top level (outside ArchiveGallery) to prevent React unmounting/re-rendering animation bugs.

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:px-6 md:pt-4 md:pb-16">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label={t('archive.back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-kat-surface border border-slate-200 dark:border-kat-border text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-[24px] font-black text-kat-dark">{t('archive.title')}</h1>
          <p className="text-[13.5px] font-semibold text-slate-500">
            {archivedTrips.length > 0
              ? t('archive.savedTrips', { count: archivedTrips.length })
              : t('archive.noTripsDesc')}
          </p>
        </div>
      </div>

      {archivedTrips.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: "linear-gradient(135deg, #1A3A5C 0%, #2460A7 100%)", boxShadow: "0 8px 32px rgba(26,58,92,0.3)" }}
          >
            <HugeiconsIcon icon={CompassIcon} size={40} className="text-white" />
          </div>
          <h3 className="text-[20px] font-extrabold text-kat-dark">{t('archive.emptyTitle')}</h3>
          <p className="mt-2 text-[14px] font-semibold text-slate-500 max-w-xs leading-relaxed">
            {t('archive.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map(year => (
            <div key={year} className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-[19px] font-black text-kat-dark tracking-tight">{year}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100/75 border border-slate-200/50 px-3 py-1 rounded-full">
                  {t('archive.tripCount', { count: tripsByYear[year].length })}
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
