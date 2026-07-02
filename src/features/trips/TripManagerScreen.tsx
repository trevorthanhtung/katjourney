import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { useAuth } from "../../hooks/useAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { listContainerVariants, listItemVariants, springInteraction } from "../../lib/motion";
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
  PlusSignIcon,
  Archive02Icon,
  DashboardSquare01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, deleteTripCascade, Expense, ChecklistItem } from "../../db";
import { formatDate, getTripTiming, formatMoneyCompact, classNames } from "../../utils/helpers";
import { useScrollBarVisibility } from "../../hooks/useScrollBarVisibility";
const TripForm = React.lazy(() =>
  import("../more/MoreScreen").then((m) => ({ default: m.TripForm }))
);
import { TypedDeleteConfirmModal, BottomSheet } from "../../components/ui";
import { ConfirmDeleteTripDialog } from "../../components/modals/ConfirmDeleteTripDialog";
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
      <motion.div
        variants={listItemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springInteraction}
        onClick={() => onOpenTrip(trip.id!)}
        className={`group relative cursor-pointer flex flex-row items-center p-1.5 sm:p-2 overflow-hidden rounded-[24px] bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 w-full h-[104px] sm:h-[112px]`}
      >
        {/* Left Side (Gradient & Title) - Card in Card */}
        <div
          className={`w-[40%] sm:w-[35%] lg:w-[30%] h-full shrink-0 bg-linear-to-br ${gradientClass} relative px-3 sm:px-5 flex flex-col justify-center rounded-[18px] sm:rounded-[20px] overflow-hidden shadow-inner`}
        >
          {/* Status Badge */}
          <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
            <span className={`relative flex h-1.5 w-1.5 rounded-full ${statusColorClass}`}></span>
            {statusLabel}
          </div>

          <h4 className="text-[16px] sm:text-[22px] font-bold text-white leading-tight truncate tracking-tight drop-shadow-xs mt-4 sm:mt-3">
            {trip.title}
          </h4>
        </div>

        {/* Right Side (Stats) */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-between px-1.5 sm:px-6 min-w-0 h-full py-1 sm:py-0">
          <div className="flex w-full sm:flex-1 flex-row items-center justify-center min-w-0 mb-1 sm:mb-0 sm:pr-4 gap-1">
            {dateDisplay ? (
              <>
                <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {dateDisplay.split(" ➔ ")[0]}
                </span>
                {dateDisplay.split(" ➔ ")[1] && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 mx-0.5 sm:mx-1">➔</span>
                    <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {dateDisplay.split(" ➔ ")[1]}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {t("dashboard.card.openDates", "Open dates")}
              </span>
            )}
          </div>

          <div className="hidden sm:block h-10 w-px bg-slate-100 dark:bg-slate-800/80 mx-1 sm:mx-4 shrink-0"></div>

          <div className="grid grid-cols-3 w-full shrink-0 sm:w-[200px] xl:w-[240px] gap-0.5 sm:gap-2">
            <div className="flex flex-col items-center min-w-0">
              <span className="text-[14px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center">
                {daysTotal}
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate w-full text-center">
                {t("dashboard.card.days", "DAYS")}
              </span>
            </div>
            <div className="flex flex-col items-center min-w-0 border-x border-slate-100/60 dark:border-slate-800/60 sm:border-0">
              <span className="text-[14px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center">
                {memberCounts[trip.id!] || 1}
              </span>
              <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate w-full text-center">
                {t("dashboard.card.buddies", "PEOPLE")}
              </span>
            </div>
            <div className="flex flex-col items-center min-w-0">
              <span
                className="text-[14px] sm:text-[18px] font-black text-kat-text dark:text-slate-200 leading-none truncate w-full text-center"
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
              <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate w-full text-center">
                {t("dashboard.card.expense", "EXPENSES")}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springInteraction}
      onClick={() => onOpenTrip(trip.id!)}
      className={`group relative cursor-pointer flex flex-col overflow-hidden rounded-[24px] bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-shadow duration-300 w-full h-[290px] sm:h-auto sm:aspect-4/4.5 lg:aspect-square p-1.5 sm:p-2`}
    >
      {/* Top Banner Area (Gradient) - Card in Card */}
      <div
        className={`flex-1 bg-linear-to-br ${gradientClass} relative p-4 sm:p-5 flex flex-col justify-between overflow-hidden rounded-[20px] shadow-inner`}
      >
        {/* Status Badge */}
        <div className="relative z-10 flex justify-start items-start shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <span className={`relative flex h-2 w-2 rounded-full ${statusColorClass}`}></span>
            {statusLabel}
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 mt-auto shrink-0 pb-1">
          <h4 className="text-[24px] sm:text-[28px] font-bold text-white leading-tight line-clamp-2 tracking-tight drop-shadow-xs">
            {trip.title}
          </h4>
        </div>
      </div>

      {/* Bottom Info Area (White/Solid) */}
      <div className="h-[120px] flex flex-col justify-between p-4 sm:p-5 bg-transparent">
        {/* Dates */}
        <div className="text-center flex flex-row items-center justify-center gap-1.5">
          <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5 text-slate-400" />
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
              {t("dashboard.card.days", "DAYS")}
            </span>
          </div>
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[18px] font-black text-kat-text dark:text-slate-200 truncate w-full px-1">
              {memberCounts[trip.id!] || 1}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate w-full px-1">
              {t("dashboard.card.buddies", "PEOPLE")}
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
              {t("dashboard.card.expense", "EXPENSES")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
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

      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className={
          viewMode === "list"
            ? "flex flex-col gap-4 items-stretch w-full"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
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
          <motion.div
            variants={listItemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springInteraction}
            onClick={onCreateNew}
            className={`hidden lg:flex group cursor-pointer ${
              viewMode === "list"
                ? "flex-col h-32"
                : "flex-col h-[260px] sm:h-auto sm:aspect-4/4.5 lg:aspect-square"
            } items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-200 ease-out w-full`}
          >
            <div
              className={`rounded-full bg-slate-800 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ease-out shadow-xs ${viewMode === "list" ? "w-10 h-10 mb-2" : "w-14 h-14 mb-4"}`}
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
          </motion.div>
        )}
      </motion.div>
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
  const areBarsVisible = useScrollBarVisibility(1024);
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
      className={`mx-auto w-full max-w-[1280px] flex-1 flex flex-col ${trips.length === 0 ? "justify-center py-0 md:py-0" : "py-6 pb-40 md:pt-4 md:pb-16"}`}
    >
      {trips.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-[32px] bg-white/80 dark:bg-[#060B14]/80 backdrop-blur-xl p-8 sm:p-12 text-center border border-slate-200/60 dark:border-white/[0.04] shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,191,183,0.03)] mx-auto w-full max-w-[540px] relative overflow-hidden"
        >
          {/* Ambient Glowing Blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-400/10 dark:bg-[#00BFB7]/10 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/10 dark:bg-[#0081BE]/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 translate-y-1/3" />
          
          {/* Subtle top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#00BFB7] to-transparent opacity-60" />

          {/* Premium Animated Icon Container */}
          <div className="relative mb-10 mt-2 flex items-center justify-center">
            {/* Pulsing glow */}
            <motion.div 
              animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.05, 1] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#00BFB7] rounded-full blur-2xl" 
            />
            {/* Dotted orbit */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[140px] h-[140px] rounded-full border border-dashed border-[#00BFB7]/30 dark:border-[#00BFB7]/20"
            />
            {/* Floating airplane container */}
            <motion.div 
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-[#0C1425] border border-white dark:border-white/5 shadow-[0_8px_30px_rgba(0,191,183,0.15)] ring-1 ring-black/5 dark:ring-0"
            >
              <HugeiconsIcon
                icon={Airplane01Icon}
                size={40}
                className="text-[#00BFB7] -rotate-45"
                strokeWidth={2}
              />
            </motion.div>
          </div>

          <h3 className="mb-3 text-[26px] sm:text-[30px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight z-10 relative">
            {t("dashboard.emptyTitle")}
          </h3>

          <p className="mb-10 text-[15px] sm:text-[16px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[400px] z-10 relative">
            {t("dashboard.emptyDesc")}
          </p>

          {/* Elegant Feature List with Journey Line */}
          <div className="relative flex flex-col gap-5 w-full max-w-[420px] mb-12 z-10 text-left">
            {/* Vertical connector line */}
            <div className="absolute left-[23px] top-[30px] bottom-[30px] w-0.5 bg-linear-to-b from-slate-200 via-slate-200 to-slate-200 dark:from-white/10 dark:via-white/10 dark:to-transparent" />
            
            {[
              {
                icon: Calendar01Icon,
                title: t("dashboard.emptyFeature1"),
                desc: t("dashboard.emptyFeature1Desc"),
                colorClass: "text-[#0081BE] dark:text-[#38bdf8]",
                bgClass: "bg-[#0081BE]/10",
              },
              {
                icon: WalletCardsIcon,
                title: t("dashboard.emptyFeature2"),
                desc: t("dashboard.emptyFeature2Desc"),
                colorClass: "text-[#F89B02] dark:text-amber-400",
                bgClass: "bg-[#F89B02]/10",
              },
              {
                icon: CheckmarkCircle02Icon,
                title: t("dashboard.emptyFeature3"),
                desc: t("dashboard.emptyFeature3Desc"),
                colorClass: "text-[#00BFB7] dark:text-[#2dd4bf]",
                bgClass: "bg-[#00BFB7]/10",
              },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group relative flex items-center gap-5 p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:shadow-sm dark:hover:shadow-none hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-default"
              >
                <div className={`relative z-10 h-[46px] w-[46px] shrink-0 rounded-2xl ${feature.bgClass} ${feature.colorClass} flex items-center justify-center border border-white dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <HugeiconsIcon icon={feature.icon} size={22} strokeWidth={2} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[14.5px] font-bold text-slate-900 dark:text-slate-100 mb-0.5 group-hover:text-[#00BFB7] transition-colors">
                    {feature.title}
                  </span>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                    {feature.desc}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateNew}
            className="group relative flex h-14 w-full max-w-[360px] items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-[#00BFB7] to-[#00A8A2] text-white px-6 font-bold text-[16px] shadow-[0_12px_24px_rgba(0,191,183,0.3)] hover:shadow-[0_16px_32px_rgba(0,191,183,0.4)] transition-shadow duration-300 z-10 overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 -translate-x-[150%] bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
            <motion.div
               initial={false}
               animate={{ rotate: 0 }}
               whileHover={{ rotate: 90 }}
               transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={22} strokeWidth={2.5} />
            </motion.div>
            {t("dashboard.emptyCreateBtn")}
          </motion.button>

          {archivedTripsCount > 0 && (
            <button
              onClick={onOpenArchive}
              className="mt-6 text-[14px] font-semibold text-slate-500 hover:text-[#00BFB7] transition-colors z-10 relative"
            >
              {t("trips.viewMemories", "Xem kỷ niệm chuyến đi ({{count}})", {
                count: archivedTripsCount,
              })}
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 w-full motion-page-enter">
          {/* Main Content Column */}
          <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8 order-last xl:order-first">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-[26px] font-black text-kat-text tracking-tight motion-title-enter">
                {t("trips.journey", "Hành trình")}
              </h2>

              <div className="hidden sm:flex items-center justify-center w-full sm:w-auto gap-2">
                <SegmentedControl
                  options={[
                    { id: "planned", label: t("dashboard.tabs.planned", "Planned") },
                    { id: "archived", label: t("dashboard.tabs.archived", "Archived") },
                    { id: "completed", label: t("dashboard.tabs.completed", "Past") },
                  ]}
                  value={filterTab}
                  onChange={(val) => setFilterTab(val as any)}
                  layoutIdPrefix="trip-manager-tabs"
                  className="rounded-full bg-slate-100/80 dark:bg-slate-800/70 p-1.5 backdrop-blur-md"
                  buttonClassName="px-5 py-1.5 rounded-full"
                  pillClassName="shadow-md rounded-full"
                />

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
                      {t("trips.noArchived", "Không có chuyến đi nào được lưu trữ")}
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
                      {t("trips.noCompleted", "Chưa có chuyến đi nào hoàn thành")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div className="xl:col-span-4 flex flex-col gap-5 lg:gap-6 order-first xl:order-last">
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

      {/* Mobile Bottom Navigation (TripManagerScreen specific) */}
      {trips.length > 0 &&
        createPortal(
          <nav
            className={`fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[480px] -translate-x-1/2 rounded-[28px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-floating-premium transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex lg:hidden ${areBarsVisible ? "translate-y-0" : "translate-y-[150%]"}`}
            style={{ bottom: "calc(0.5rem + var(--safe-bottom))" }}
          >
            <div className="relative flex h-[68px] items-center w-full px-1">
              {/* 5-Column Grid for perfect symmetry */}
              <div className="grid grid-cols-5 w-full h-full items-center justify-items-center">
                {/* Tab 1: Kế hoạch */}
                <NavButton
                  isActive={filterTab === "planned"}
                  onClick={() => setFilterTab("planned")}
                  icon={Calendar01Icon}
                  label={t("dashboard.tabs.planned", "Planned")}
                  layoutIdPrefix="trip-manager-nav"
                  compact
                />

                {/* Tab 2: Lưu trữ */}
                <NavButton
                  isActive={filterTab === "archived"}
                  onClick={() => setFilterTab("archived")}
                  icon={Archive02Icon}
                  label={t("dashboard.tabs.archived", "Archived")}
                  layoutIdPrefix="trip-manager-nav"
                  compact
                />

                {/* Tab 3: Empty space for FAB */}
                <div className="w-full h-full pointer-events-none" />

                {/* Tab 4: Đã qua */}
                <NavButton
                  isActive={filterTab === "completed"}
                  onClick={() => setFilterTab("completed")}
                  icon={CheckmarkCircle02Icon}
                  label={t("dashboard.tabs.completed", "Past")}
                  layoutIdPrefix="trip-manager-nav"
                  compact
                />

                {/* Tab 5: Đổi View */}
                <NavButton
                  isActive={false}
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  icon={viewMode === "grid" ? Menu01Icon : DashboardSquare01Icon}
                  label={t("dashboard.tabs.view", "View")}
                  layoutIdPrefix="trip-manager-nav"
                  compact
                />
              </div>

              {/* Absolute Center FAB - Floats prominently */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[-60%] z-20 pointer-events-auto">
                <button
                  onClick={onCreateNew}
                  className="flex items-center justify-center w-[50px] h-[50px] rounded-full bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 shadow-[0_4px_12px_rgba(2,6,23,0.15)] dark:shadow-[0_4px_12px_rgba(0,191,183,0.25)] hover:shadow-[0_8px_20px_rgba(2,6,23,0.2)] dark:hover:shadow-[0_8px_20px_rgba(0,191,183,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-press border-[3px] border-white dark:border-slate-900"
                  aria-label="Thêm chuyến đi"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>,
          document.body
        )}
    </div>
  );
}
