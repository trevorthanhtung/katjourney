import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Airplane01Icon, Calendar01Icon, Location01Icon, CompassIcon, UserGroupIcon, WalletCardsIcon, SparklesIcon, MapsIcon } from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, deleteTripCascade, Expense, ChecklistItem } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";
import { TripForm } from "../more/MoreScreen";
import { TypedDeleteConfirmModal, BottomSheet } from "../../components/ui";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";

function getTripDurationText(trip: Trip) {
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  if (isDayTrip) return "Đi trong ngày";
  
  try {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Dài ngày";
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    return `${diffDays} ngày ${diffNights} đêm`;
  } catch {
    return "Dài ngày";
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
        className={`group relative cursor-pointer overflow-hidden rounded-[32px] bg-gradient-to-b from-white to-[#FCFAF2] border border-[#E8E1D8] border-l-4 ${statusColor} p-6 md:p-8 shadow-soft hover:shadow-md hover:border-slate-350/80 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 w-full flex flex-col md:flex-row gap-6 justify-between items-stretch md:min-w-[560px] md:max-w-[700px] motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
      >
        {/* Left info column */}
        <div className="flex-1 flex flex-col justify-between pr-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {timing.status === "active" && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Đang diễn ra
                </span>
              )}
              {timing.status === "upcoming" && (
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Sắp diễn ra
                </span>
              )}
              {timing.status === "past" && (
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                  </span>
                  Đã kết thúc
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-655 tracking-wide">
                {getTripDurationText(trip)}
              </span>
            </div>

            <h4 className="text-[22px] md:text-[25px] font-extrabold text-kat-text leading-tight mb-4 tracking-tight">
              {trip.title}
            </h4>
          </div>

          <div className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3D4B5E] bg-[#030D2E]/[0.02] border border-[#E8E1D8]/45 px-3 py-1.5 rounded-[12px] w-fit">
              <HugeiconsIcon icon={Location01Icon} size={15} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[280px]">{trip.location || "Chưa có địa điểm"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3D4B5E] bg-[#030D2E]/[0.02] border border-[#E8E1D8]/45 px-3 py-1.5 rounded-[12px] w-fit">
              <HugeiconsIcon icon={Calendar01Icon} size={15} className="text-slate-400 shrink-0" />
              <span>{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
            </div>
          </div>
        </div>

        {/* Right stats column */}
        <div className="w-full md:w-[250px] shrink-0 md:border-l md:border-[#E8E1D8]/45 md:pl-6 flex flex-col justify-center gap-2.5">
          <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#3D4B5E] bg-[#030D2E]/[0.02] border border-[#E8E1D8]/45 px-3.5 py-2 rounded-[12px]">
            <HugeiconsIcon icon={UserGroupIcon} size={15} className="text-slate-400 shrink-0" />
            <span>{memberCounts[trip.id!] || 1} người đồng hành</span> 
          </div>
          <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#3D4B5E] bg-[#030D2E]/[0.02] border border-[#E8E1D8]/45 px-3.5 py-2 rounded-[12px]">
            <HugeiconsIcon icon={WalletCardsIcon} size={15} className="text-slate-400 shrink-0" />
            <span>{totalExpense > 0 ? `${totalExpense.toLocaleString()}đ chi phí` : "Chưa có chi phí"}</span>
          </div>
          
          {tripChecklist.length > 0 && (
            checklistRemaining > 0 ? (
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-rose-700 bg-rose-50/40 border border-rose-100/60 px-3.5 py-2 rounded-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                <span className="truncate">
                  {timing.status === "past" 
                    ? `${checklistRemaining} món chưa chuẩn bị` 
                    : `Còn ${checklistRemaining} món cần soạn`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-emerald-700 bg-emerald-50/40 border border-emerald-100/60 px-3.5 py-2 rounded-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">Hành lý chuẩn bị xong</span>
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
      className={`group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-b from-white to-[#FCFAF2] p-5 shadow-soft border border-[#E8E1D8] border-l-4 ${statusColor} hover:border-slate-350/80 hover:-translate-y-1 hover:shadow-md transition-all duration-300 w-full max-w-[420px] mx-auto md:mx-0 h-full motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {timing.status === "active" && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Đang diễn ra
            </span>
          )}
          {timing.status === "upcoming" && (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Sắp diễn ra
            </span>
          )}
          {timing.status === "past" && (
            <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider shadow-sm">
              <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400"></span>
              </span>
              Đã kết thúc
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 tracking-wide">
            {getTripDurationText(trip)}
          </span>
        </div>

        <h4 className="text-[18px] md:text-[19px] font-extrabold text-kat-text leading-tight mb-4 line-clamp-2 tracking-tight">
          {trip.title}
        </h4>

        {/* Glanceable Grid Info */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-[12px] font-bold text-[#3D4B5E] mb-1">
          <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-[#030D2E]/[0.04]">
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{trip.location || "Chưa xác định"}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-[#030D2E]/[0.04]">
            <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate text-slate-600">{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)}`}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-[#030D2E]/[0.04]">
            <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{memberCounts[trip.id!] || 1} người</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-2.5 py-1.5 rounded-[10px] min-w-0 transition-all group-hover:bg-[#030D2E]/[0.04]">
            <HugeiconsIcon icon={WalletCardsIcon} size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{totalExpense > 0 ? `${totalExpense.toLocaleString()}đ` : "Chưa chi"}</span>
          </div>
        </div>
      </div>

      {/* Checklist Status Border Block */}
      {tripChecklist.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E8E1D8]/45 flex">
          {checklistRemaining > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 bg-rose-50/40 border border-rose-100/60 px-2.5 py-1 rounded-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Còn {checklistRemaining} món cần chuẩn bị</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50/40 border border-emerald-100/60 px-2.5 py-1 rounded-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Hành lý chuẩn bị xong</span>
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
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-[1120px] flex-1 flex flex-col ${trips.length === 0 ? "justify-center px-2.5 min-[360px]:px-4 py-0 md:py-0" : "px-4 py-6 md:px-6 md:pt-4 md:pb-16"}`}>
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] bg-[#FFFDF8] p-5 sm:p-8 md:p-12 text-center border border-[#E8E1D8] shadow-floating hover:shadow-xl hover:border-[#00BFB7]/35 transition-all duration-500 mx-auto w-full max-w-[540px] relative overflow-hidden motion-page-enter motion-hover-lift">
          {/* Ambient Background Glows */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#00BFB7]/5 blur-[40px] rounded-full pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
          
          <HugeiconsIcon icon={MapsIcon} className="absolute -right-12 -top-12 w-48 h-48 text-kat-primary/[0.03] rotate-12 pointer-events-none" />
          
          <div className="mb-4 sm:mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white shadow-[0_8px_24px_rgba(3,13,46,0.2)] relative z-10 border-2 border-white transform hover:rotate-12 transition-all duration-300">
            <HugeiconsIcon 
              icon={Airplane01Icon} 
              size={36}
              className="text-white -rotate-45" 
            />
          </div>
          
          <h3 className="mb-2 sm:mb-3 text-[22px] sm:text-[24px] font-black text-kat-text tracking-tight relative z-10">Chưa có chuyến đi nào</h3>
          <p className="mb-5 sm:mb-8 text-[13.5px] sm:text-[14.5px] font-semibold text-slate-500 leading-relaxed max-w-[340px] relative z-10">
            Tạo chuyến đi đầu tiên để bắt đầu lên lịch trình, quản lý chi phí và chuẩn bị hành lý.
          </p>
          
          <button
            onClick={onCreateNew}
            className="group flex h-11 sm:h-13 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-[18px] bg-gradient-to-r from-[#030D2E] via-[#004E5A] to-[#00BFB7] text-white px-4 sm:px-6 font-black text-[14px] sm:text-[15px] hover:brightness-[1.05] active:scale-[0.97] transition-all duration-300 relative z-10 shadow-[0_6px_20px_rgba(3,13,46,0.2)] hover:shadow-[0_8px_28px_rgba(3,13,46,0.35)] motion-press"
          >
            <span className="text-[18px] leading-none group-hover:rotate-90 transition-transform duration-300 font-bold">+</span>
            Tạo chuyến đi đầu tiên
          </button>

          {archivedTripsCount > 0 && (
            <button
              onClick={onOpenArchive}
              className="mt-3.5 flex h-11 sm:h-13 w-full items-center justify-center gap-2 rounded-[18px] border-2 border-kat-primary/30 hover:border-kat-primary bg-white text-[#030D2E] px-4 sm:px-6 font-extrabold text-[14px] sm:text-[15px] active:scale-[0.97] hover:bg-slate-50 transition-all duration-300 relative z-10 motion-press"
            >
              <HugeiconsIcon icon={SparklesIcon} size={16} className="text-kat-primary shrink-0" />
              Xem kỷ niệm chuyến đi ({archivedTripsCount})
            </button>
          )}
          
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="group/hero mb-10 md:mb-12 rounded-[32px] bg-gradient-to-br from-[#030D2E] via-[#012633] to-[#004E5A] py-6 px-5 sm:px-6 md:py-8 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 shadow-[0_12px_40px_-12px_rgba(3,13,46,0.3)] relative overflow-hidden motion-page-enter">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#00BFB7] opacity-20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-600 opacity-20 blur-[100px] rounded-full pointer-events-none" />
            <HugeiconsIcon 
              icon={CompassIcon} 
              size={176} 
              className="absolute -right-8 -bottom-8 text-white/[0.03] rotate-12 pointer-events-none transition-all group-hover/hero:scale-110 group-hover/hero:rotate-[24deg] duration-700" 
            />
            
            <div className="relative z-10">
              <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-black text-white tracking-tight leading-tight">
                Chuyến đi của bạn
              </h1>
              <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-white/70 max-w-md leading-relaxed">
                Lưu lịch trình, người đồng hành, chi phí và những việc cần chuẩn bị cho từng chuyến đi.
              </p>
            </div>
            
            <div className="flex flex-row items-center gap-2.5 w-full md:w-auto shrink-0 relative z-10 justify-start md:justify-end">
              <button
                onClick={onOpenArchive}
                className="group relative flex h-[46px] md:h-[50px] items-center justify-center gap-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-white px-4 sm:px-6 font-bold text-[13.5px] md:text-[14px] border border-white/15 backdrop-blur-md overflow-hidden active:scale-[0.97] hover:border-white/25 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <HugeiconsIcon 
                  icon={SparklesIcon} 
                  size={16} 
                  className="text-[#00BFB7] group-hover:scale-110 transition-transform duration-300" 
                />
                <span className="tracking-wide">Kỷ niệm</span>
              </button>
              
              <button
                onClick={onCreateNew}
                className="group flex h-[46px] md:h-[50px] items-center justify-center gap-1.5 rounded-2xl bg-white text-[#030D2E] px-5 sm:px-7 font-black text-[13.5px] md:text-[14px] shadow-[0_6px_20px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all duration-300 hover:bg-[#F8F9FA] hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
              >
                <span className="text-md md:text-lg leading-none group-hover:rotate-90 transition-transform duration-300 font-extrabold">+</span>
                Tạo chuyến đi
              </button>
            </div>
          </div>

          {/* Featured Trip (Sắp diễn ra tiếp theo) */}
          {featuredTrip && (() => {
            const featuredStatus = getTripTiming(featuredTrip);
            const featuredBorderColor = featuredStatus.status === "active" ? "border-l-[#00BFB7]" : "border-l-[#F89B02]";
            return (
              <section className="mb-12 md:mb-14">
                <h3 className="mb-4 px-1 text-[20px] font-extrabold text-kat-text motion-title-enter">Chuyến tiếp theo</h3>
                <div 
                  className={`group relative overflow-hidden rounded-[32px] bg-gradient-to-b from-white to-[#FCFAF2] border border-[#E8E1D8] border-l-4 ${featuredBorderColor} p-6 sm:p-8 lg:p-10 shadow-soft cursor-pointer hover:shadow-md hover:border-slate-350/80 hover:-translate-y-1 transition-all duration-300 min-h-[220px] flex flex-col justify-center motion-card-enter motion-delay-2`}
                  onClick={() => onOpenTrip(featuredTrip.id!)}
                >
                  {/* Decorative background */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-1/3 bg-gradient-to-l from-kat-primary/5 to-transparent pointer-events-none" />
                  
                  {/* Watermark Compass Icon - Mobile */}
                  <HugeiconsIcon 
                    icon={CompassIcon} 
                    size={160} 
                    className="block md:hidden absolute -right-6 -bottom-6 text-kat-primary opacity-[0.05] rotate-12 pointer-events-none transition-all group-hover:scale-110 group-hover:rotate-[20deg] duration-700" 
                  />
                  {/* Watermark Compass Icon - Desktop */}
                  <HugeiconsIcon 
                    icon={CompassIcon} 
                    size={240} 
                    className="hidden md:block absolute -right-8 -bottom-8 text-kat-primary opacity-[0.05] rotate-12 pointer-events-none transition-all group-hover:scale-110 group-hover:rotate-[24deg] duration-700" 
                  />
                  
                  <div className="relative z-10 md:w-2/3 pr-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredStatus.status === "active" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm">
                          <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Đang diễn ra
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider shadow-sm">
                          <span className="relative flex h-2 w-2 mr-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          Sắp diễn ra
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-600">
                        {getTripDurationText(featuredTrip)}
                      </span>
                    </div>
                    
                    <h4 className="text-[26px] sm:text-[28px] md:text-[34px] font-extrabold text-kat-text leading-tight mb-4 tracking-tight">
                      {featuredTrip.title}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 text-slate-700">
                      <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-3 py-1.5 rounded-[12px]">
                        <HugeiconsIcon icon={Location01Icon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600">{featuredTrip.location || "Chưa có địa điểm"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-3 py-1.5 rounded-[12px]">
                        <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600">{featuredTrip.startDate === featuredTrip.endDate ? formatDate(featuredTrip.startDate) : `${formatDate(featuredTrip.startDate)} - ${formatDate(featuredTrip.endDate)}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#030D2E]/[0.02] border border-[#E8E1D8]/40 px-3 py-1.5 rounded-[12px]">
                        <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-slate-400 shrink-0" />
                        <span className="font-extrabold text-[13px] text-slate-600">{memberCounts[featuredTrip.id!] || 1} người</span>
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
                  title="Tất cả chuyến đi" 
                  subtitle="Tất cả chuyến đi của bạn." 
                  items={remainingTrips} 
                  allExpenses={allExpenses}
                  allChecklist={allChecklist}
                  memberCounts={memberCounts}
                  onOpenTrip={onOpenTrip}
                />
              ) : (
                <>
                  <TripList 
                    title="Đang diễn ra" 
                    subtitle="Hành trình đang diễn ra ngay lúc này." 
                    items={remainingActive} 
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                  <TripList 
                    title="Sắp diễn ra" 
                    subtitle="Hành trình chuẩn bị khởi hành sắp tới." 
                    items={remainingUpcoming} 
                    allExpenses={allExpenses}
                    allChecklist={allChecklist}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                  <TripList 
                    title="Đã hoàn thành" 
                    subtitle="Những chuyến đi đã kết thúc và có thể xem lại tổng kết." 
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
