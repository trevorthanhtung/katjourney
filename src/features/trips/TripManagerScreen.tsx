import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Airplane01Icon,
  Calendar01Icon,
  Location01Icon,
  CompassIcon,
  UserGroupIcon,
  WalletCardsIcon,
  SparklesIcon,
  MapsIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, deleteTripCascade, Expense, ChecklistItem } from "../../db";
import { formatDate, getTripTiming, formatMoneyCompact } from "../../utils/helpers";
const TripForm = React.lazy(() =>
  import("../more/MoreScreen").then((m) => ({ default: m.TripForm }))
);
import { TypedDeleteConfirmModal, BottomSheet } from "../../components/ui";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";
import { GamificationStats, TimezonesWidget } from "./components/DashboardWidgets";
import { HeroTripCard } from "./components/HeroTripCard";
import { AtlasScreen } from "../atlas/AtlasScreen";
import { NavButton } from "../../components/ui/NavButton";

function getTripDurationText(trip: Trip, t: any) {
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  if (isDayTrip) return t("dashboard.dayTrip");

  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return t("dashboard.longTrip");
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
  isSingle?: boolean;
  idx?: number;
  allExpenses: Expense[];
  allChecklist: ChecklistItem[];
  memberCounts: Record<number, number>;
  onOpenTrip: (id: number) => void;
  viewMode?: "grid" | "list";
}

function TripCard({
  trip,
  isSingle = false,
  idx = 0,
  allExpenses,
  allChecklist,
  memberCounts,
  onOpenTrip,
  viewMode = "grid",
}: TripCardProps) {
  const { t, i18n } = useTranslation();
  const timing = getTripTiming(trip);
  const tripExpenses = allExpenses.filter((e) => e.tripId === trip.id);
  const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Compute days
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  let daysTotal = 1;
  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    daysTotal =
      Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
  }

  // Generate a random-looking gradient based on trip ID
  const gradients = [
    "from-kat-primary to-kat-blue",
    "from-amber-400 to-orange-500",
    "from-teal-400 to-emerald-600",
    "from-sky-400 to-blue-600",
    "from-rose-400 to-pink-600",
  ];
  const gradientClass = gradients[(trip.id || 0) % gradients.length];

  // Date formatting for the middle section
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(i18n.language || "vi-VN", { month: "short", day: "numeric" });
  };

  const startStr = formatShortDate(trip.startDate);
  const endStr = formatShortDate(trip.endDate);

  let dateDisplay = startStr;
  if (endStr && startStr !== endStr) {
    dateDisplay = `${startStr} ➔ ${endStr}`;
  }

  const statusLabel =
    timing.status === "active"
      ? t("dashboard.statusActive")
      : timing.status === "upcoming"
        ? t("dashboard.statusUpcoming")
        : t("dashboard.statusPast");
  const statusColorClass =
    timing.status === "active"
      ? "bg-emerald-400"
      : timing.status === "upcoming"
        ? "bg-amber-400"
        : "bg-slate-400";

  if (viewMode === "list") {
    return (
      <div
        onClick={() => onOpenTrip(trip.id!)}
        className={`group relative cursor-pointer flex flex-row overflow-hidden rounded-[24px] bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 w-full h-24 motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
      >
        {/* Left Side (Gradient & Title) */}
        <div
          className={`w-[35%] sm:w-[35%] lg:w-[30%] shrink-0 bg-gradient-to-r ${gradientClass} relative px-4 sm:px-6 flex flex-col justify-center`}
        >
          {/* Status Badge */}
          <div className="absolute top-3 left-4 sm:left-6 flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
            <span className={`relative flex h-1.5 w-1.5 rounded-full ${statusColorClass}`}></span>
            {statusLabel}
          </div>

          <h4 className="text-[18px] sm:text-[24px] font-bold text-white leading-tight truncate tracking-tight drop-shadow-sm mt-3">
            {trip.title}
          </h4>
        </div>

        {/* Right Side (Stats) */}
        <div className="flex-1 bg-white dark:bg-kat-surface flex flex-row items-center justify-between px-3 sm:px-6 min-w-0">
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 pr-2 sm:pr-4">
            <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate w-full text-center">
              {dateDisplay
                ? dateDisplay.split(" ➔ ").map((d, i, arr) => (
                    <span key={i}>
                      {d} {i < arr.length - 1 && <span className="text-slate-300 mx-1">➔</span>}
                    </span>
                  ))
                : t("dashboard.card.openDates", "Open dates")}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800/80 mx-2 sm:mx-4 shrink-0"></div>

          <div className="grid grid-cols-3 shrink-0 w-[150px] sm:w-[200px] xl:w-[240px] gap-1 sm:gap-2">
            <div className="flex flex-col items-center min-w-0">
              <span className="text-[16px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center">
                {daysTotal}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate w-full text-center">
                {t("dashboard.card.days", "NGÀY")}
              </span>
            </div>
            <div className="flex flex-col items-center min-w-0">
              <span className="text-[16px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center">
                {memberCounts[trip.id!] || 1}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate w-full text-center">
                {t("dashboard.card.buddies", "NGƯỜI")}
              </span>
            </div>
            <div className="flex flex-col items-center min-w-0">
              <span
                className="text-[16px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center"
                title={
                  totalExpense > 0
                    ? formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND")
                    : "0"
                }
              >
                {totalExpense > 0
                  ? formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND")
                  : "0"}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate w-full text-center">
                {t("dashboard.card.expense", "CHI PHÍ")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenTrip(trip.id!)}
      className={`group relative cursor-pointer flex flex-col overflow-hidden rounded-[24px] bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 w-full h-[260px] sm:h-auto sm:aspect-[4/4.5] lg:aspect-square motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
    >
      {/* Top Banner Area (Gradient) */}
      <div
        className={`flex-1 bg-gradient-to-br ${gradientClass} relative p-6 flex flex-col justify-between overflow-hidden`}
      >
        {/* Status Badge */}
        <div className="relative z-10 flex justify-start items-start">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">
            <span className={`relative flex h-2 w-2 rounded-full ${statusColorClass}`}></span>
            {statusLabel}
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 mt-auto">
          <h4 className="text-[26px] sm:text-[30px] font-bold text-white leading-tight line-clamp-2 tracking-tight drop-shadow-sm">
            {trip.title}
          </h4>
        </div>
      </div>

      {/* Bottom Info Area (White/Solid) */}
      <div className="h-[120px] bg-white dark:bg-kat-surface flex flex-col justify-between p-5">
        {/* Dates */}
        <div className="text-center">
          <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {dateDisplay || t("dashboard.card.openDates", "Open dates")}
          </span>
        </div>

        {/* Subtle Divider */}
        <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50 my-2"></div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center pb-1">
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[18px] font-black text-kat-text dark:text-slate-200 truncate w-full px-1">
              {daysTotal}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate w-full px-1">
              {t("dashboard.card.days", "NGÀY")}
            </span>
          </div>
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[18px] font-black text-kat-text dark:text-slate-200 truncate w-full px-1">
              {memberCounts[trip.id!] || 1}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate w-full px-1">
              {t("dashboard.card.buddies", "NGƯỜI")}
            </span>
          </div>
          <div className="flex flex-col items-center min-w-0">
            <span
              className="text-[18px] font-black text-kat-text dark:text-slate-200 truncate w-full px-1"
              title={
                totalExpense > 0
                  ? formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND")
                  : "0"
              }
            >
              {totalExpense > 0
                ? formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND")
                : "0"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate w-full px-1">
              {t("dashboard.card.expense", "CHI PHÍ")}
            </span>
          </div>
        </div>
      </div>
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
  showCreateCard?: boolean;
  onCreateNew?: () => void;
  viewMode?: "grid" | "list";
}

function TripList({
  title,
  subtitle,
  items,
  allExpenses,
  allChecklist,
  memberCounts,
  onOpenTrip,
  showCreateCard = false,
  onCreateNew,
  viewMode = "grid",
}: TripListProps) {
  const { t } = useTranslation();
  if (!items.length && !showCreateCard) return null;

  return (
    <section className="mb-10 md:mb-12">
      <div className="mb-4">
        <h3 className="px-1 text-[20px] font-extrabold text-kat-text motion-title-enter">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 px-1 text-[13.5px] font-semibold text-slate-500 motion-title-enter">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={
          viewMode === "list"
            ? "flex flex-col gap-4 items-stretch w-full"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
        }
      >
        {items.map((trip, idx) => (
          <TripCard
            key={trip.id}
            trip={trip}
            idx={idx}
            allExpenses={allExpenses}
            allChecklist={allChecklist}
            memberCounts={memberCounts}
            onOpenTrip={onOpenTrip}
            viewMode={viewMode}
          />
        ))}

        {showCreateCard && (
          <div
            onClick={onCreateNew}
            className={`hidden sm:flex group cursor-pointer ${viewMode === "list" ? "flex-col h-32" : "flex-col h-[260px] sm:h-auto sm:aspect-[4/4.5] lg:aspect-square"} items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-[0.97] transition-all duration-200 ease-out w-full motion-card-enter`}
          >
            <div
              className={`rounded-full bg-slate-800 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ease-out shadow-sm ${viewMode === "list" ? "w-10 h-10 mb-2" : "w-14 h-14 mb-4"}`}
            >
              <svg
                className={viewMode === "list" ? "w-5 h-5" : "w-6 h-6"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </div>
            <h4
              className={`${viewMode === "list" ? "text-[15px]" : "text-[18px]"} font-bold text-kat-text dark:text-slate-200 group-hover:text-slate-800 dark:group-hover:text-white transition-colors`}
            >
              {t("dashboard.card.newTripTitle", "New Trip")}
            </h4>
            {viewMode === "grid" && (
              <p className="text-[12px] font-semibold text-slate-400 mt-2 px-6 text-center">
                {t("dashboard.card.newTripDesc", "Plan a new trip from scratch")}
              </p>
            )}
          </div>
        )}
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
  const [isAtlasOpen, setIsAtlasOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"planned" | "archived" | "completed">("planned");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allMembersRaw = useLiveQuery(async () =>
    (await db.members.toArray()).filter((m) => !m.isDeleted)
  );
  const allExpensesRaw = useLiveQuery(async () =>
    (await db.expenses.toArray()).filter((e) => !e.isDeleted)
  );
  const allChecklistRaw = useLiveQuery(async () =>
    (await db.checklist.toArray()).filter((c) => !c.isDeleted)
  );
  const archivedTripsRaw = useLiveQuery(async () =>
    (await db.trips.toArray()).filter((t) => !t.isDeleted && t.status === "archived")
  );

  const isLoading =
    allMembersRaw === undefined ||
    allExpensesRaw === undefined ||
    allChecklistRaw === undefined ||
    archivedTripsRaw === undefined;
  const allMembers = allMembersRaw ?? [];
  const allExpenses = allExpensesRaw ?? [];
  const allChecklist = allChecklistRaw ?? [];
  const archivedTripsCount = archivedTripsRaw?.length ?? 0;

  const memberCounts = allMembers.reduce(
    (acc, m) => {
      acc[m.tripId] = (acc[m.tripId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  async function executeDeleteTrip() {
    if (tripToDelete?.id) {
      await deleteTripCascade(tripToDelete.id);
      setTripToDelete(null);
      onShowToast?.("Đã xóa chuyến đi khỏi thiết bị này.");
    }
  }

  // getTripDurationText, TripCard, and TripList have been moved to the top level (outside TripManagerScreen) to prevent React unmounting/re-rendering animation bugs.
  const allFutureTrips = trips
    .filter((t) => {
      const timing = getTripTiming(t);
      return (
        timing.status === "active" || timing.status === "upcoming" || timing.status === "unknown"
      );
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastTrips = trips.filter((t) => getTripTiming(t).status === "past");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00BFB7]/20 border-t-kat-primary"></div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-full max-w-[1120px] flex-1 flex flex-col ${trips.length === 0 ? "justify-center py-0 md:py-0" : "py-6 pb-28 md:pt-4 md:pb-16"}`}
    >
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
              opacity: 0.05,
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
            <HugeiconsIcon
              icon={SparklesIcon}
              size={11}
              className="animate-spin duration-[4000ms]"
            />
            Kat Journey
          </div>

          {/* Pulsing Glowing Airplane Card */}
          <div className="mb-6 relative flex items-center justify-center relative z-10">
            <div className="absolute w-32 h-32 rounded-full bg-[#00BFB7]/5 animate-ping duration-[4000ms] pointer-events-none" />
            <div className="absolute w-24 h-24 rounded-full bg-[#00BFB7]/10 border border-[#00BFB7]/20 pointer-events-none animate-pulse duration-[3000ms]" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white shadow-[0_12px_32px_rgba(0,191,183,0.25)] border-2 border-white transform hover:rotate-[360deg] transition-transform duration-1000">
              <HugeiconsIcon icon={Airplane01Icon} size={38} className="text-white -rotate-45" />
            </div>
          </div>

          <h3 className="mb-2.5 text-[24px] sm:text-[28px] font-black text-kat-text tracking-tight relative z-10 leading-tight">
            {t("dashboard.emptyTitle")}
          </h3>
          <p className="mb-6 text-[14px] sm:text-[15.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[380px] relative z-10">
            {t("dashboard.emptyDesc")}
          </p>

          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[460px] mb-8 relative z-10">
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#0081BE]/8 dark:bg-[#38bdf8]/10 text-[#0081BE] dark:text-[#38bdf8] flex items-center justify-center mb-2 shadow-sm border border-[#0081BE]/10 dark:border-[#38bdf8]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={Calendar01Icon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">
                {t("dashboard.emptyFeature1")}
              </span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
                {t("dashboard.emptyFeature1Desc")}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#F89B02]/8 dark:bg-[#fbbf24]/10 text-[#F89B02] dark:text-[#fbbf24] flex items-center justify-center mb-2 shadow-sm border border-[#F89B02]/10 dark:border-[#fbbf24]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={WalletCardsIcon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">
                {t("dashboard.emptyFeature2")}
              </span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
                {t("dashboard.emptyFeature2Desc")}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#F8FAFC]/50 dark:bg-slate-800/40 border border-[#E2E8F0]/60 dark:border-slate-700/50 hover:bg-[#F8FAFC]/90 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] group/item">
              <div className="h-9 w-9 rounded-xl bg-[#00BFB7]/8 dark:bg-[#2dd4bf]/10 text-[#00BFB7] dark:text-[#2dd4bf] flex items-center justify-center mb-2 shadow-sm border border-[#00BFB7]/10 dark:border-[#2dd4bf]/20 group-hover/item:scale-110 transition-transform duration-300">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
              </div>
              <span className="text-[11.5px] font-black text-[#030D2E] dark:text-slate-100 tracking-tight">
                {t("dashboard.emptyFeature3")}
              </span>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
                {t("dashboard.emptyFeature3Desc")}
              </span>
            </div>
          </div>

          <button
            onClick={onCreateNew}
            className="group flex h-12 sm:h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white px-6 font-black text-[14.5px] sm:text-[15.5px] hover:brightness-[1.08] active:scale-[0.98] transition-all duration-300 relative z-10 shadow-[0_8px_30px_rgba(0,191,183,0.2)] hover:shadow-[0_12px_36px_rgba(0,191,183,0.35)] motion-press"
          >
            <span className="text-[20px] leading-none group-hover:rotate-90 transition-transform duration-300 font-bold">
              +
            </span>
            {t("dashboard.emptyCreateBtn")}
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 w-full motion-page-enter">
          {/* Main Content Column */}
          <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-[26px] font-black text-kat-text tracking-tight motion-title-enter">
                Hành trình
              </h2>

              <div className="hidden sm:flex items-center justify-center w-full sm:w-auto gap-2">
                <div className="flex bg-slate-100/80 dark:bg-slate-800/70 p-1.5 rounded-full backdrop-blur-md gap-1">
                  <button
                    onClick={() => setFilterTab("planned")}
                    className={`px-5 py-1.5 rounded-full text-[13.5px] font-bold transition-all duration-300 
${filterTab === "planned" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    {t("dashboard.tabs.planned", "Kế hoạch")}
                  </button>
                  <button
                    onClick={() => setFilterTab("archived")}
                    className={`px-5 py-1.5 rounded-full text-[13.5px] font-bold transition-all duration-300 
${filterTab === "archived" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    {t("dashboard.tabs.archived", "Lưu trữ")}
                  </button>
                  <button
                    onClick={() => setFilterTab("completed")}
                    className={`px-5 py-1.5 rounded-full text-[13.5px] font-bold transition-all duration-300 
${filterTab === "completed" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  >
                    {t("dashboard.tabs.completed", "Đã qua")}
                  </button>
                </div>

                <div className="flex bg-slate-100/80 dark:bg-slate-800/70 p-1.5 rounded-full backdrop-blur-md gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-full transition-all duration-300 ${viewMode === "grid" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    title={t("dashboard.viewMode.grid", "Grid View")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-full transition-all duration-300 ${viewMode === "list" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    title={t("dashboard.viewMode.list", "List View")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {filterTab === "planned" && (
              <>
                {/* Gamification Stats */}
                <GamificationStats trips={trips} onAtlasClick={() => setIsAtlasOpen(true)} />

                {/* All Future Trips List */}
                <div className="space-y-4">
                  {allFutureTrips.length > 0 && (
                    <HeroTripCard trip={allFutureTrips[0]} onOpenTrip={onOpenTrip} />
                  )}
                  <TripList
                    title=""
                    items={allFutureTrips.slice(1)}
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                    showCreateCard={true}
                    onCreateNew={onCreateNew}
                    viewMode={viewMode}
                  />
                </div>
              </>
            )}

            {filterTab === "archived" && (
              <div className="space-y-4 motion-page-enter">
                <TripList
                  title=""
                  items={archivedTripsRaw}
                  allExpenses={allExpenses}
                  allChecklist={allChecklist}
                  memberCounts={memberCounts}
                  onOpenTrip={onOpenTrip}
                  showCreateCard={false}
                  viewMode={viewMode}
                />
                {archivedTripsRaw.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                      Không có chuyến đi nào được lưu trữ
                    </p>
                  </div>
                )}
              </div>
            )}

            {filterTab === "completed" && (
              <div className="space-y-4 motion-page-enter">
                <TripList
                  title=""
                  items={pastTrips}
                  allExpenses={allExpenses}
                  allChecklist={allChecklist}
                  memberCounts={memberCounts}
                  onOpenTrip={onOpenTrip}
                  showCreateCard={false}
                  viewMode={viewMode}
                />
                {pastTrips.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                      Chưa có chuyến đi nào hoàn thành
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div className="xl:col-span-4 flex flex-col gap-5 lg:gap-6">
            <TimezonesWidget />
          </div>
        </div>
      )}

      <React.Suspense fallback={null}>
        <TripForm
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          trip={editingTrip || undefined}
          onSaved={() => setEditingTrip(null)}
        />
      </React.Suspense>

      <ConfirmDeleteTripDialog
        open={Boolean(tripToDelete)}
        tripName={tripToDelete?.title}
        onClose={() => setTripToDelete(null)}
        onConfirm={executeDeleteTrip}
      />

      {isAtlasOpen && (
        <AtlasScreen
          isOpen={isAtlasOpen}
          onClose={() => setIsAtlasOpen(false)}
          totalTrips={trips.length}
          totalDays={trips.reduce((acc, t) => {
            const s = new Date(t.startDate);
            const e = new Date(t.endDate);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return acc;
            return acc + Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
          }, 0)}
        />
      )}

      {/* Mobile Bottom Navigation (TripManagerScreen specific) */}
      <nav
        className="fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 rounded-[26px] glass-panel-nav shadow-floating-premium transition-transform duration-200 ease-out flex sm:hidden"
        style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="relative flex h-[56px] min-[390px]:h-[60px] items-center justify-between px-2 w-full">
          <NavButton
            isActive={filterTab === "planned"}
            onClick={() => setFilterTab("planned")}
            icon={Calendar01Icon}
            label={t("dashboard.tabs.planned", "Kế hoạch")}
            layoutIdPrefix="trip-nav"
          />
          <NavButton
            isActive={filterTab === "archived"}
            onClick={() => setFilterTab("archived")}
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
            }
            label={t("dashboard.tabs.archived", "Lưu trữ")}
            layoutIdPrefix="trip-nav"
          />

          {/* Center FAB */}
          <div className="relative -top-5 flex justify-center w-14 z-10 shrink-0">
            <button
              onClick={onCreateNew}
              className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-gradient-to-tr from-[#004E5A] to-[#00BFB7] text-white shadow-[0_8px_20px_rgba(0,191,183,0.35)] active:scale-[0.92] transition-transform motion-press"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <NavButton
            isActive={filterTab === "completed"}
            onClick={() => setFilterTab("completed")}
            icon={CheckmarkCircle02Icon}
            label={t("dashboard.tabs.completed", "Đã qua")}
            layoutIdPrefix="trip-nav"
          />
          <NavButton
            isActive={false}
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            icon={
              viewMode === "grid" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              )
            }
            label={viewMode === "grid" ? "Lưới" : "Danh sách"}
            layoutIdPrefix="trip-nav"
          />
        </div>
      </nav>
    </div>
  );
}
