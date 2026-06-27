import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Airplane01Icon, Calendar01Icon, Location01Icon, CompassIcon, UserGroupIcon, WalletCardsIcon, SparklesIcon, MapsIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, deleteTripCascade, Expense, ChecklistItem } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";
import { TripForm } from "../more/MoreScreen";
import { TypedDeleteConfirmModal, BottomSheet } from "../../components/ui";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";

function getTripDurationText(trip: Trip, t: any) {
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  if (isDayTrip) return t('dashboard.dayTrip');
  
  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return t('dashboard.longTrip');
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    return diffNights > 0 ? t('dashboard.duration', { days: diffDays, nights: diffNights }) : t('dashboard.durationDaysOnly', { days: diffDays });
  } catch {
    return t('dashboard.longTrip');
  }
}

interface TripCardProps {
  trip: Trip;
  isSingle?: boolean;
  idx?: number;
  allExpenses: Expense[];
  allChecklist: ChecklistItem[];
  memberCounts: Record<number, number>;
  onOpenTrip: (id: number) => void;
}

function TripCard({ 
  trip, 
  isSingle = false, 
  idx = 0,
  allExpenses,
  allChecklist,
  memberCounts,
  onOpenTrip
}: TripCardProps) {
  const { t } = useTranslation();
  const timing = getTripTiming(trip);
  const tripExpenses = allExpenses.filter(e => e.tripId === trip.id);
  const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const tripChecklist = allChecklist.filter(c => c.tripId === trip.id);
  const checklistRemaining = tripChecklist.filter(c => !c.completed).length;

  const statusColor = 
    timing.status === "active" 
      ? "border-l-[#00BFB7]" 
      : timing.status === "upcoming" 
        ? "border-l-[#F89B02]" 
        : "border-l-[#0081BE]";

  // Single Featured Card Layout
  if (isSingle) {
    return (
      <div 
        onClick={() => onOpenTrip(trip.id!)}
        className={`group relative cursor-pointer overflow-hidden rounded-[32px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border border-l-4 ${statusColor} p-6 lg:p-8 shadow-soft hover:shadow-md hover:border-slate-350 dark:hover:border-kat-border hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 w-full flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:min-w-[560px] lg:max-w-[700px] motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
      >
        {/* Left info column */}
        <div className="flex-1 flex flex-col justify-between pr-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {timing.status === "active" && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t('dashboard.statusActive')}
                </span>
              )}
              {timing.status === "upcoming" && (
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-400 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t('dashboard.statusUpcoming')}
                </span>
              )}
              {timing.status === "past" && (
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                  </span>
                  {t('dashboard.statusPast')}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-650 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-300 tracking-wide">
                {getTripDurationText(trip, t)}
              </span>
            </div>

            <h4 className="text-[22px] lg:text-[25px] font-extrabold text-kat-text leading-tight mb-4 tracking-tight">
              {trip.title}
            </h4>
          </div>

          <div className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-650 dark:text-slate-300 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-3 py-1.5 rounded-[12px] w-fit max-w-full">
              <HugeiconsIcon icon={Location01Icon} size={15} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[180px] min-[360px]:max-w-[220px] min-[390px]:max-w-[280px]">{trip.location || t('dashboard.noLocation')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-650 dark:text-slate-300 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-3 py-1.5 rounded-[12px] w-fit max-w-full">
              <HugeiconsIcon icon={Calendar01Icon} size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
            </div>
          </div>
        </div>

        {/* Right stats column */}
        <div className="w-full lg:w-[250px] shrink-0 lg:border-l lg:border-slate-200 dark:lg:border-kat-border lg:pl-6 flex flex-col justify-center gap-2.5">
          <div className="flex items-center gap-2 text-[12px] font-extrabold text-slate-650 dark:text-slate-300 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-3.5 py-2 rounded-[12px]">
            <HugeiconsIcon icon={UserGroupIcon} size={15} className="text-slate-400 shrink-0" />
            <span>{t('dashboard.peopleCountCompanion', { count: memberCounts[trip.id!] || 1 })}</span> 
          </div>
          <div className="flex items-center gap-2 text-[12px] font-extrabold text-slate-650 dark:text-slate-300 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-3.5 py-2 rounded-[12px]">
            <HugeiconsIcon icon={WalletCardsIcon} size={15} className="text-slate-400 shrink-0" />
            <span>{totalExpense > 0 ? t('dashboard.expenseTotal', { amount: totalExpense.toLocaleString() + 'đ' }) : t('dashboard.noExpenseFull')}</span>
          </div>
          
          {tripChecklist.length > 0 && (
            checklistRemaining > 0 ? (
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30 px-3.5 py-2 rounded-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                <span className="truncate">
                  {timing.status === "past" 
                    ? t('dashboard.itemsUnprepared', { count: checklistRemaining }) 
                    : t('dashboard.itemsToPrepare', { count: checklistRemaining })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 px-3.5 py-2 rounded-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">{t('dashboard.luggageReady')}</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Grid Card Layout
  return (
    <div 
      onClick={() => onOpenTrip(trip.id!)}
      className={`group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-[24px] bg-white dark:bg-kat-surface p-5 shadow-soft border border-slate-200 dark:border-kat-border border-l-4 ${statusColor} hover:border-slate-350 dark:hover:border-kat-border hover:-translate-y-1 hover:shadow-md transition-all duration-300 w-full max-w-[420px] mx-auto md:mx-0 h-full motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {timing.status === "active" && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {t('dashboard.statusActive')}
            </span>
          )}
          {timing.status === "upcoming" && (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-400 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {t('dashboard.statusUpcoming')}
            </span>
          )}
          {timing.status === "past" && (
            <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400"></span>
              </span>
              {t('dashboard.statusPast')}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-300 tracking-wide">
            {getTripDurationText(trip, t)}
          </span>
        </div>

        <h4 className="text-[18px] md:text-[19px] font-extrabold text-kat-text leading-tight mb-4 line-clamp-2 tracking-tight">
          {trip.title}
        </h4>

        {/* Glanceable Grid Info */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-[12px] font-bold text-slate-655 dark:text-slate-350 mb-1">
          <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-slate-500/10 dark:group-hover:bg-slate-400/10">
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{trip.location || t('dashboard.noLocationGrid')}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-slate-500/10 dark:group-hover:bg-slate-400/10">
            <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate text-slate-600 dark:text-slate-300">{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)}`}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/60 dark:border-kat-border px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-slate-500/10 dark:group-hover:bg-slate-400/10 col-span-1 min-[360px]:col-span-2">
            <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{t('dashboard.peopleCount', { count: memberCounts[trip.id!] || 1 })}</span>
            <span className="text-slate-300 mx-0.5">·</span>
            <HugeiconsIcon icon={WalletCardsIcon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{totalExpense > 0 ? t('dashboard.expenseTotal', { amount: totalExpense.toLocaleString() + 'đ' }) : t('dashboard.noExpense')}</span>
          </div>
        </div>
      </div>

      {/* Checklist Status Border Block */}
      {tripChecklist.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex">
          {checklistRemaining > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30 px-2.5 py-1 rounded-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{t('dashboard.itemsToPrepare', { count: checklistRemaining })}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 px-2.5 py-1 rounded-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>{t('dashboard.luggageReady')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TripListProps {
  title: string;
  subtitle?: string;
  items: Trip[];
  allExpenses: Expense[];
  allChecklist: ChecklistItem[];
  memberCounts: Record<number, number>;
  onOpenTrip: (id: number) => void;
}

function TripList({ 
  title, 
  subtitle, 
  items,
  allExpenses,
  allChecklist,
  memberCounts,
  onOpenTrip
}: TripListProps) {
  if (!items.length) return null;
  const isSingle = items.length === 1;

  return (
    <section className="mb-10 md:mb-12">
      <div className="mb-4">
        <h3 className="px-1 text-[20px] font-extrabold text-kat-text motion-title-enter">{title}</h3>
        {subtitle && (
          <p className="mt-1 px-1 text-[13.5px] font-semibold text-slate-500 motion-title-enter">
            {subtitle}
          </p>
        )}
      </div>
      
      <div 
        className={
          isSingle 
            ? "flex flex-col items-start" 
            : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
        }
      >
        {items.map((trip, idx) => (
          <TripCard 
            key={trip.id} 
            trip={trip} 
            isSingle={isSingle} 
            idx={idx} 
            allExpenses={allExpenses}
            allChecklist={allChecklist}
            memberCounts={memberCounts}
            onOpenTrip={onOpenTrip}
          />
        ))}
      </div>
    </section>
  );
}

export function TripManagerScreen({
  trips,
  onOpenTrip,
  onCreateNew,
  onOpenArchive,
  onShowToast,
}: {
  trips: Trip[];
  onOpenTrip: (id: number) => void;
  onCreateNew: () => void;
  onOpenArchive: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);


  const allMembersRaw = useLiveQuery(async () => (await db.members.toArray()).filter(m => !m.isDeleted));
  const allExpensesRaw = useLiveQuery(async () => (await db.expenses.toArray()).filter(e => !e.isDeleted));
  const allChecklistRaw = useLiveQuery(async () => (await db.checklist.toArray()).filter(c => !c.isDeleted));
  const archivedTripsRaw = useLiveQuery(async () => (await db.trips.toArray()).filter(t => !t.isDeleted && t.status === 'archived'));

  const isLoading = allMembersRaw === undefined || allExpensesRaw === undefined || allChecklistRaw === undefined || archivedTripsRaw === undefined;
  const allMembers = allMembersRaw ?? [];
  const allExpenses = allExpensesRaw ?? [];
  const allChecklist = allChecklistRaw ?? [];
  const archivedTripsCount = archivedTripsRaw?.length ?? 0;

  const memberCounts = allMembers.reduce((acc, m) => {
    acc[m.tripId] = (acc[m.tripId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  async function executeDeleteTrip() {
    if (tripToDelete?.id) {
      await deleteTripCascade(tripToDelete.id);
      setTripToDelete(null);
      onShowToast?.("Đã xóa chuyến đi khỏi thiết bị này.");
    }
  }

  // getTripDurationText, TripCard, and TripList have been moved to the top level (outside TripManagerScreen) to prevent React unmounting/re-rendering animation bugs.
  const allFutureTrips = trips.filter(t => {
    const timing = getTripTiming(t);
    return timing.status === "active" || timing.status === "upcoming" || timing.status === "unknown";
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const featuredTrip = allFutureTrips.length > 0 ? allFutureTrips[0] : null;
  const remainingTrips = trips.filter(t => t.id !== featuredTrip?.id);
  
  const remainingActive = remainingTrips.filter((t) => getTripTiming(t).status === "active");
  const remainingUpcoming = remainingTrips.filter((t) => getTripTiming(t).status === "upcoming" || getTripTiming(t).status === "unknown");
  const remainingPast = remainingTrips.filter((t) => getTripTiming(t).status === "past");


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00BFB7]/20 border-t-kat-primary"></div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-[1120px] flex-1 flex flex-col ${trips.length === 0 ? "justify-center py-0 md:py-0" : "py-6 md:pt-4 md:pb-16"}`}>
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] bg-white dark:bg-kat-surface p-6 sm:p-10 md:p-14 text-center border border-slate-200 dark:border-kat-border shadow-[0_20px_50px_rgba(0,191,183,0.06)] hover:shadow-[0_20px_50px_rgba(0,191,183,0.12)] hover:border-[#00BFB7]/40 dark:hover:border-[#00BFB7]/60 transition-all duration-500 mx-auto w-full max-w-[580px] relative overflow-hidden motion-page-enter motion-hover-lift">
          {/* Ambient Background Glows */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#00BFB7]/10 blur-[80px] rounded-full pointer-events-none animate-pulse duration-[8000ms]" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-[#030D2E]/5 blur-[90px] rounded-full pointer-events-none animate-pulse duration-[6000ms]" />
          
          {/* Subtle Dot Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none select-none z-0" 
            style={{
              backgroundImage: "radial-gradient(#00BFB7 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              opacity: 0.05
            }}
          />
          
          {/* Watermark Map Icon */}
          <div 
            className="absolute -right-12 -top-12 w-48 h-48 pointer-events-none select-none rotate-12"
            style={{ opacity: 0.04, color: "#00BFB7" }}
          >
            <HugeiconsIcon icon={MapsIcon} className="w-full h-full" />
          </div>
          
          {/* Branded Label tag */}
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#00BFB7]/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#00AFA8] border border-[#00BFB7]/25 relative z-10">
            <HugeiconsIcon icon={SparklesIcon} size={11} className="animate-spin duration-[4000ms]" />
            Kat Journey
          </div>
          
          {/* Pulsing Glowing Airplane Card */}
          <div className="mb-6 relative flex items-center justify-center relative z-10">
            <div className="absolute w-32 h-32 rounded-full bg-[#00BFB7]/5 animate-ping duration-[4000ms] pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full bg-[#00BFB7]/10 border border-[#00BFB7]/20 pointer-events-none animate-pulse duration-[3000ms]" />
            
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white shadow-[0_12px_32px_rgba(0,191,183,0.25)] border-2 border-white transform hover:rotate-[360deg] transition-transform duration-1000">
              <HugeiconsIcon 
                icon={Airplane01Icon} 
                size={38}
                className="text-white -rotate-45" 
              />
            </div>
          </div>
          
          <h3 className="mb-2.5 text-[24px] sm:text-[28px] font-black text-kat-text tracking-tight relative z-10 leading-tight">
            {t('dashboard.emptyTitle')}
          </h3>
          <p className="mb-6 text-[14px] sm:text-[15.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[380px] relative z-10">
            {t('dashboard.emptyDesc')}
          </p>
          
          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[460px] mb-8 relative z-10">
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#0081BE]/8 dark:bg-[#38bdf8]/10 text-[#0081BE] dark:text-[#38bdf8] flex items-center justify-center mb-2 shadow-sm border border-[#0081BE]/10 dark:border-[#38bdf8]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={Calendar01Icon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">{t('dashboard.emptyFeature1')}</span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">{t('dashboard.emptyFeature1Desc')}</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#F89B02]/8 dark:bg-[#fbbf24]/10 text-[#F89B02] dark:text-[#fbbf24] flex items-center justify-center mb-2 shadow-sm border border-[#F89B02]/10 dark:border-[#fbbf24]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={WalletCardsIcon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">{t('dashboard.emptyFeature2')}</span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">{t('dashboard.emptyFeature2Desc')}</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#00BFB7]/8 dark:bg-[#2dd4bf]/10 text-[#00BFB7] dark:text-[#2dd4bf] flex items-center justify-center mb-2 shadow-sm border border-[#00BFB7]/10 dark:border-[#2dd4bf]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">{t('dashboard.emptyFeature3')}</span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">{t('dashboard.emptyFeature3Desc')}</span>
            </div>
          </div>
          
          <button
            onClick={onCreateNew}
            className="group flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white px-6 font-black text-[14.5px] sm:text-[15.5px] hover:brightness-[1.08] active:scale-[0.98] transition-all duration-300 relative z-10 shadow-[0_8px_30px_rgba(0,191,183,0.2)] hover:shadow-[0_12px_36px_rgba(0,191,183,0.35)] motion-press"
          >
            <span className="text-[20px] leading-none group-hover:rotate-90 transition-transform duration-300 font-bold">+</span>
            {t('dashboard.emptyCreateBtn')}
          </button>
 
          {archivedTripsCount > 0 && (
            <button
              onClick={onOpenArchive}
              className="mt-3.5 flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-[20px] border-2 border-[#00BFB7]/25 hover:border-[#00BFB7] bg-white dark:bg-kat-surface text-[#030D2E] dark:text-kat-text px-6 font-extrabold text-[14px] sm:text-[15px] active:scale-[0.98] hover:bg-slate-50/80 dark:hover:bg-kat-surface/80 transition-all duration-300 relative z-10 shadow-[0_4px_12px_rgba(3,13,46,0.02)] hover:shadow-[0_6px_16px_rgba(0,191,183,0.08)] motion-press"
            >
              <HugeiconsIcon icon={SparklesIcon} size={16} className="text-[#00BFB7] shrink-0" />
              Xem kỷ niệm chuyến đi ({archivedTripsCount})
            </button>
          )}
          
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="group/hero mb-10 md:mb-12 rounded-[32px] bg-gradient-to-br from-[#030D2E] via-[#012633] to-[#004E5A] py-6 px-5 sm:px-6 md:py-8 md:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 shadow-[0_12px_40px_-12px_rgba(3,13,46,0.3)] relative overflow-hidden motion-page-enter">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-kat-teal opacity-20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-600 opacity-20 blur-[100px] rounded-full pointer-events-none" />
            <HugeiconsIcon 
              icon={CompassIcon} 
              size={176} 
              className="absolute -right-8 -bottom-8 text-white/[0.03] rotate-12 pointer-events-none transition-all group-hover/hero:scale-110 group-hover/hero:rotate-[24deg] duration-700" 
            />
            
            <div className="relative z-10">
              <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-black text-white tracking-tight leading-tight">
                {t('dashboard.heroTitle')}
              </h1>
              <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-white/70 max-w-md leading-relaxed">
                {t('dashboard.heroDesc')}
              </p>
            </div>
            
            <div className="flex flex-row flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 relative z-10 justify-center lg:justify-end">
              <button
                onClick={onOpenArchive}
                className="group relative flex h-[46px] md:h-[50px] items-center justify-center gap-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-white px-3 sm:px-6 font-bold text-[12.5px] min-[360px]:text-[13.5px] md:text-[14px] border border-white/15 backdrop-blur-md overflow-hidden active:scale-[0.97] hover:border-white/25 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)] whitespace-nowrap shrink-0"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <HugeiconsIcon 
                  icon={SparklesIcon} 
                  size={16} 
                  className="text-kat-teal group-hover:scale-110 transition-transform duration-300" 
                />
                <span className="tracking-wide">{t('dashboard.memoriesBtn')}</span>
              </button>
              
              <button
                onClick={onCreateNew}
                className="group flex h-[46px] md:h-[50px] items-center justify-center gap-1.5 rounded-2xl bg-white text-[#030D2E] px-3.5 sm:px-7 font-black text-[12.5px] min-[360px]:text-[13.5px] md:text-[14px] shadow-[0_6px_20px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all duration-300 hover:bg-[#F8F9FA] hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)] whitespace-nowrap shrink-0"
              >
                <span className="text-md md:text-lg leading-none group-hover:rotate-90 transition-transform duration-300 font-extrabold">+</span>
                {t('dashboard.createTripBtn')}
              </button>
            </div>
          </div>

          {/* Featured Trip (Sắp diễn ra tiếp theo) */}
          {featuredTrip && (() => {
            const featuredStatus = getTripTiming(featuredTrip);
            const featuredBorderColor = featuredStatus.status === "active" ? "border-l-[#00BFB7]" : "border-l-[#F89B02]";
            const featuredTotalExpense = allExpenses
              .filter((expense) => expense.tripId === featuredTrip.id)
              .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
            return (
              <section className="mb-12 md:mb-14">
                <h3 className="mb-4 px-1 text-[20px] font-extrabold text-kat-text motion-title-enter">{t('dashboard.nextTripTitle')}</h3>
                <div 
                  className={`group relative overflow-hidden rounded-[32px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border border-l-4 ${featuredBorderColor} p-6 sm:p-8 lg:p-10 shadow-soft cursor-pointer hover:shadow-md hover:border-slate-350/80 dark:hover:border-kat-border hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-center motion-card-enter motion-delay-2`}
                  onClick={() => onOpenTrip(featuredTrip.id!)}
                >
                  
                  {/* Watermark Compass Icon - Mobile */}
                  <HugeiconsIcon 
                    icon={CompassIcon} 
                    size={160} 
                    className="block lg:hidden absolute -right-6 -bottom-6 text-kat-primary opacity-[0.05] rotate-12 pointer-events-none transition-all group-hover:scale-110 group-hover:rotate-[20deg] duration-700" 
                  />
                  {/* Watermark Compass Icon - Desktop */}
                  <HugeiconsIcon 
                    icon={CompassIcon} 
                    size={240} 
                    className="hidden lg:block absolute -right-8 -bottom-8 text-kat-primary opacity-[0.05] rotate-12 pointer-events-none transition-all group-hover:scale-110 group-hover:rotate-[24deg] duration-700" 
                  />
                  
                  <div className="relative z-10 lg:w-2/3 pr-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredStatus.status === "active" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400 uppercase tracking-wider shadow-sm">
                          <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {t('dashboard.statusActive')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-400 uppercase tracking-wider shadow-sm">
                          <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          {t('dashboard.statusUpcoming')}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:border-slate-700/60 dark:text-slate-300">
                        {getTripDurationText(featuredTrip, t)}
                      </span>
                    </div>
                    
                    <h4 className="text-[26px] sm:text-[28px] md:text-[34px] font-extrabold text-kat-text leading-tight mb-4 tracking-tight">
                      {featuredTrip.title}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/40 dark:border-kat-border px-3 py-1.5 rounded-[12px] max-w-full">
                        <HugeiconsIcon icon={Location01Icon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600 dark:text-slate-300 truncate max-w-[180px] min-[360px]:max-w-[220px] min-[390px]:max-w-[280px]">{featuredTrip.location || t('dashboard.noLocation')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/40 dark:border-kat-border px-3 py-1.5 rounded-[12px] max-w-full">
                        <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600 dark:text-slate-300 truncate">{featuredTrip.startDate === featuredTrip.endDate ? formatDate(featuredTrip.startDate) : `${formatDate(featuredTrip.startDate)} - ${formatDate(featuredTrip.endDate)}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-500/5 dark:bg-slate-400/5 border border-slate-200/40 dark:border-kat-border px-3 py-1.5 rounded-[12px] max-w-full">
                        <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600 dark:text-slate-300 truncate">{t('dashboard.peopleCount', { count: memberCounts[featuredTrip.id!] || 1 })}</span>
                        <span className="text-slate-300 dark:text-slate-500 mx-0.5">·</span>
                        <HugeiconsIcon icon={WalletCardsIcon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600 dark:text-slate-300 truncate">{featuredTotalExpense > 0 ? t('dashboard.expenseTotal', { amount: featuredTotalExpense.toLocaleString() + 'đ' }) : t('dashboard.noExpense')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Remaining Trips List */}
          {remainingTrips.length > 0 && (
            <div className="space-y-4">
              {featuredTrip && remainingTrips.length <= 2 ? (
                <TripList 
                  title={t('dashboard.allTripsTitle')} 
                  subtitle={t('dashboard.allTripsDesc')} 
                  items={remainingTrips} 
                  allExpenses={allExpenses}
                  allChecklist={allChecklist}
                  memberCounts={memberCounts}
                  onOpenTrip={onOpenTrip}
                />
              ) : (
                <>
                  <TripList 
                    title={t('dashboard.activeTripsTitle')} 
                    subtitle={t('dashboard.activeTripsDesc')} 
                    items={remainingActive} 
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                  <TripList 
                    title={t('dashboard.upcomingTripsTitle')} 
                    subtitle={t('dashboard.upcomingTripsDesc')} 
                    items={remainingUpcoming} 
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                  <TripList 
                    title={t('dashboard.pastTripsTitle')} 
                    subtitle={t('dashboard.pastTripsDesc')} 
                    items={remainingPast} 
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                </>
              )}
            </div>
          )}
        </>
      )}

      <TripForm
        isOpen={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        trip={editingTrip || undefined}
        onSaved={() => setEditingTrip(null)}
      />

      <ConfirmDeleteTripDialog
        open={Boolean(tripToDelete)}
        tripName={tripToDelete?.title}
        onClose={() => setTripToDelete(null)}
        onConfirm={executeDeleteTrip}
      />


    </div>
  );
}
