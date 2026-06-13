import React, { useState } from "react";
import { Calendar, MapPin, Plane, Trash2, Edit3, Compass, Users, Map, WalletCards, Trophy } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db, deleteTripCascade } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";
import { TripForm } from "../more/MoreScreen";
import { TypedDeleteConfirmModal } from "../../components/ui";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";

export function TripManagerScreen({
  trips,
  onOpenTrip,
  onCreateNew,
  onShowToast,
}: {
  trips: Trip[];
  onOpenTrip: (id: number) => void;
  onCreateNew: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  const allMembers = useLiveQuery(() => db.members.toArray()) ?? [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) ?? [];
  const allChecklist = useLiveQuery(() => db.checklist.toArray()) ?? [];

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

  const allFutureTrips = trips.filter(t => {
    const timing = getTripTiming(t);
    return timing.status === "active" || timing.status === "upcoming" || timing.status === "unknown";
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const featuredTrip = allFutureTrips.length > 0 ? allFutureTrips[0] : null;
  const remainingTrips = trips.filter(t => t.id !== featuredTrip?.id);
  
  const remainingActive = remainingTrips.filter((t) => getTripTiming(t).status === "active");
  const remainingUpcoming = remainingTrips.filter((t) => getTripTiming(t).status === "upcoming" || getTripTiming(t).status === "unknown");
  const remainingPast = remainingTrips.filter((t) => getTripTiming(t).status === "past");

  function TripCard({ 
    trip, 
    isSingle = false, 
    idx = 0 
  }: { 
    trip: Trip; 
    isSingle?: boolean; 
    idx?: number; 
  }) {
    const timing = getTripTiming(trip);
    const tripExpenses = allExpenses.filter(e => e.tripId === trip.id);
    const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const tripChecklist = allChecklist.filter(c => c.tripId === trip.id);
    const checklistRemaining = tripChecklist.filter(c => !c.completed).length;

    // Render edit and delete action buttons
    const renderActions = () => (
      <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-20">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 bg-white/95 border border-slate-200/60 shadow-sm hover:bg-slate-50 hover:text-slate-700 transition-colors motion-press"
          onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); }}
          title="Sửa thông tin"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    );

    // Single Featured Card Layout
    if (isSingle) {
      return (
        <div 
          className={`group relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border border-[#E8E1D8] p-6 md:p-8 shadow-sm hover:shadow-md hover:border-kat-primary/40 transition-all w-full flex flex-col md:flex-row gap-6 justify-between items-stretch md:min-w-[560px] md:max-w-[700px] motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
        >
          
          {/* Left info column */}
          <div className="flex-1 flex flex-col justify-between pr-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {timing.status === "active" && (
                  <span className="inline-flex items-center rounded-full bg-kat-primary-soft border border-kat-primary/20 px-3 py-1 text-[11px] font-bold text-kat-primary-usable uppercase tracking-wider">Đang diễn ra</span>
                )}
                {timing.status === "upcoming" && (
                  <span className="inline-flex items-center rounded-full bg-[#F89B02]/10 border border-[#F89B02]/20 px-3 py-1 text-[11px] font-bold text-[#F89B02] uppercase tracking-wider">Sắp diễn ra</span>
                )}
                {timing.status === "past" && (
                  <span className="inline-flex items-center rounded-full bg-[#0081BE]/10 border border-[#0081BE]/20 px-3 py-1 text-[11px] font-bold text-[#0081BE] uppercase tracking-wider">Đã kết thúc</span>
                )}
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-605 tracking-wide">
                  {getTripDurationText(trip)}
                </span>
              </div>

              <h4 
                className="text-[22px] md:text-[25px] font-extrabold text-kat-text leading-tight mb-4 cursor-pointer hover:text-kat-primary transition-colors"
                onClick={() => onOpenTrip(trip.id!)}
              >
                {trip.title}
              </h4>
            </div>

            <div className="space-y-2.5 pb-2 border-slate-100">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-500">
                <MapPin className="h-4.5 w-4.5 text-kat-primary shrink-0" />
                <span className="truncate">{trip.location || "Chưa có địa điểm"}</span>
              </div>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-500">
                <Calendar className="h-4.5 w-4.5 text-[#0081BE] shrink-0" />
                <span>{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
              </div>
            </div>
          </div>

          {/* Right stats and action column */}
          <div className="w-full md:w-[260px] shrink-0 md:border-l md:border-[#E8E1D8]/60 md:pl-6 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-slate-650 bg-slate-50 border border-slate-200/50 px-3 py-2 rounded-xl">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{memberCounts[trip.id!] || 1} người đồng hành</span> 
              </div>
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-slate-650 bg-slate-50 border border-slate-200/50 px-3 py-2 rounded-xl">
                <WalletCards className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{totalExpense > 0 ? `${totalExpense.toLocaleString()}đ chi phí` : "Chưa có chi phí"}</span>
              </div>
              
              {tripChecklist.length > 0 && checklistRemaining > 0 && (
                <div className="flex items-center gap-2 text-[12px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                  <span className="truncate">
                    {timing.status === "past" 
                      ? `${checklistRemaining} món chưa được đánh dấu chuẩn bị` 
                      : `Còn ${checklistRemaining} món cần chuẩn bị`}
                  </span>
                </div>
              )}
              {tripChecklist.length > 0 && checklistRemaining === 0 && (
                <div className="flex items-center gap-2 text-[12px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                  <span>Hành lý đã chuẩn bị xong</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100/60">
              <button 
                onClick={() => onOpenTrip(trip.id!)}
                className="flex-1 h-11 flex items-center justify-center rounded-xl bg-[#030D2E] hover:bg-[#030D2E]/90 text-white font-black text-[14px] shadow-sm transition-all motion-press"
              >
                Xem chi tiết
              </button>
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors motion-press"
                onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); }}
                title="Sửa thông tin"
              >
                <Edit3 className="h-4.5 w-4.5" />
              </button>
              {timing.status === "past" && (
                <button 
                  onClick={() => onOpenTrip(trip.id!)}
                  className="h-11 px-4 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13.5px] transition-all motion-press"
                >
                  Tổng kết
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Grid Card Layout
    return (
      <div 
        className={`group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] transition-all hover:shadow-md hover:border-kat-primary/40 w-full max-w-[420px] mx-auto md:mx-0 motion-card-enter motion-delay-${Math.min(idx + 2, 10)}`}
      >
        {renderActions()}

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {timing.status === "active" && (
              <span className="inline-flex items-center rounded-full bg-kat-primary-soft border border-kat-primary/20 px-2.5 py-0.5 text-[10.5px] font-bold text-kat-primary-usable uppercase tracking-wider">Đang diễn ra</span>
            )}
            {timing.status === "upcoming" && (
              <span className="inline-flex items-center rounded-full bg-[#F89B02]/10 border border-[#F89B02]/20 px-2.5 py-0.5 text-[10.5px] font-bold text-[#F89B02] uppercase tracking-wider">Sắp diễn ra</span>
            )}
            {timing.status === "past" && (
              <span className="inline-flex items-center rounded-full bg-[#0081BE]/10 border border-[#0081BE]/20 px-2.5 py-0.5 text-[10.5px] font-bold text-[#0081BE] uppercase tracking-wider">Đã kết thúc</span>
            )}
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 tracking-wide">
              {getTripDurationText(trip)}
            </span>
          </div>

          <h4 
            className="text-[18px] md:text-[19px] font-extrabold text-kat-text leading-tight mb-4 cursor-pointer hover:text-kat-primary transition-colors line-clamp-2 pr-12"
            onClick={() => onOpenTrip(trip.id!)}
          >
            {trip.title}
          </h4>

          <div className="space-y-2 mb-4 pt-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <MapPin className="h-4 w-4 text-kat-primary shrink-0" />
              <span className="truncate">{trip.location || "Chưa có địa điểm"}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
              <Calendar className="h-4 w-4 text-[#0081BE] shrink-0" />
              <span className="truncate">{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 pt-3.5 border-t border-[#E8E1D8]/50">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-lg">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{memberCounts[trip.id!] || 1} người</span> 
            </div>
            {totalExpense > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 bg-emerald-500/8 border border-emerald-500/15 px-2.5 py-1 rounded-lg">
                <WalletCards className="w-3.5 h-3.5 text-emerald-600/60" />
                <span>{totalExpense.toLocaleString()}đ</span>
              </div>
            )}
            {tripChecklist.length > 0 && checklistRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                <span>
                  {timing.status === "past" 
                    ? `${checklistRemaining} món chưa được đánh dấu chuẩn bị` 
                    : `Còn ${checklistRemaining} món cần chuẩn bị`}
                </span>
              </div>
            )}
            {tripChecklist.length > 0 && checklistRemaining === 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                <span>Xong hành lý</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-slate-100/60">
            <button 
              onClick={() => onOpenTrip(trip.id!)}
              className="flex-1 h-10 flex items-center justify-center rounded-xl bg-[#030D2E] hover:bg-[#030D2E]/90 text-white font-extrabold text-[13.5px] shadow-sm transition-all motion-press"
            >
              Xem chi tiết
            </button>
            {timing.status === "past" && (
              <button 
                onClick={() => onOpenTrip(trip.id!)}
                className="h-10 px-3.5 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-all motion-press"
              >
                Tổng kết
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function TripList({ 
    title, 
    subtitle, 
    items 
  }: { 
    title: string; 
    subtitle?: string; 
    items: Trip[]; 
  }) {
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
            <TripCard key={trip.id} trip={trip} isSingle={isSingle} idx={idx} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:px-6 md:pt-4 md:pb-16">
      {trips.length === 0 ? (
        <div className="mt-8 md:mt-16 flex flex-col items-center justify-center rounded-[32px] bg-[#FFFDF8] p-8 md:p-12 text-center border border-[#E8E1D8] shadow-sm mx-auto max-w-[580px] relative overflow-hidden motion-page-enter">
          <Map className="absolute -right-12 -top-12 w-48 h-48 text-kat-primary/[0.03] rotate-12 pointer-events-none" />
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-kat-primary/10 relative z-10">
            <Plane className="h-12 w-12 text-kat-primary" />
          </div>
          <h3 className="mb-3 text-[24px] font-bold text-kat-text relative z-10">Chưa có chuyến đi nào</h3>
          <p className="mb-8 text-[15px] text-kat-muted leading-relaxed relative z-10">
            Tạo chuyến đi đầu tiên để bắt đầu lên lịch trình, quản lý chi phí và chuẩn bị hành lý.
          </p>
          <button
            onClick={onCreateNew}
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#00BFB7] text-[#030D2E] px-6 font-bold hover:brightness-105 active:scale-[0.98] transition-all duration-200 relative z-10 motion-press"
          >
            + Tạo chuyến đi
          </button>
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="mb-10 md:mb-12 rounded-[28px] bg-gradient-to-br from-[#030D2E] via-[#004E5A] to-[#007C78] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-soft relative overflow-hidden motion-page-enter">
            <Compass className="absolute -right-8 -bottom-8 w-44 h-44 text-white/[0.04] rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-[32px] md:text-[36px] font-black text-white tracking-tight leading-tight">Chuyến đi của bạn</h1>
              <p className="mt-2 text-[15.5px] font-semibold text-white/80 max-w-md">Lưu lịch trình, người đồng hành, chi phí và những việc cần chuẩn bị cho từng chuyến đi.</p>
            </div>
            <button
              onClick={onCreateNew}
              className="flex h-[52px] w-full md:w-auto shrink-0 items-center justify-center rounded-[16px] bg-white text-[#030D2E] hover:bg-white/95 px-8 font-black text-[14.5px] shadow-sm active:scale-[0.98] transition-all duration-200 relative z-10 motion-press"
            >
              + Tạo chuyến đi
            </button>
          </div>

          {/* Featured Trip (Sắp diễn ra tiếp theo) */}
          {featuredTrip && (
            <section className="mb-12 md:mb-14">
              <h3 className="mb-4 px-1 text-[20px] font-extrabold text-kat-text motion-title-enter">Chuyến tiếp theo</h3>
              <div 
                className="group relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border border-[#E8E1D8] p-6 md:p-8 lg:p-10 shadow-sm cursor-pointer hover:border-kat-primary/40 transition-all min-h-[220px] flex flex-col justify-center motion-card-enter motion-delay-2"
                onClick={() => onOpenTrip(featuredTrip.id!)}
              >
                {/* Decorative background */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-1/3 bg-gradient-to-l from-kat-primary/5 to-transparent pointer-events-none" />
                <Compass className="absolute -right-10 -bottom-10 w-64 h-64 text-kat-primary/[0.04] rotate-12 pointer-events-none transition-transform group-hover:scale-105 duration-700" />
                
                <div className="relative z-10 md:w-2/3">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getTripTiming(featuredTrip).status === "active" ? (
                      <span className="rounded-full bg-kat-primary/15 px-3 py-1 text-[12px] font-bold text-kat-primary uppercase tracking-wider">Đang diễn ra</span>
                    ) : (
                      <span className="rounded-full bg-[#F89B02]/15 px-3 py-1 text-[12px] font-bold text-[#F89B02] uppercase tracking-wider">Sắp khởi hành</span>
                    )}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-600">
                      {getTripDurationText(featuredTrip)}
                    </span>
                  </div>
                  
                  <h4 className="text-[28px] md:text-[36px] font-extrabold text-kat-text leading-tight mb-4 group-hover:text-kat-primary transition-colors">
                    {featuredTrip.title}
                  </h4>
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-kat-primary" />
                      <span className="font-semibold text-[15px] text-slate-700">{featuredTrip.location || "Chưa có địa điểm"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#0081BE]" />
                      <span className="font-semibold text-[15px] text-slate-700">{featuredTrip.startDate === featuredTrip.endDate ? formatDate(featuredTrip.startDate) : `${formatDate(featuredTrip.startDate)} - ${formatDate(featuredTrip.endDate)}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-[15px] text-slate-700">{memberCounts[featuredTrip.id!] || 1} người</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="h-10 px-5 rounded-full bg-[#030D2E] hover:bg-[#030D2E]/90 text-white font-bold text-[14px] active:scale-95 transition-all shadow-sm motion-press">
                      Xem chi tiết
                    </button>
                    <button 
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all motion-press"
                      onClick={(e) => { e.stopPropagation(); setEditingTrip(featuredTrip); }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Remaining Trips List */}
          {remainingTrips.length > 0 && (
            <div className="space-y-4">
              {featuredTrip && remainingTrips.length <= 2 ? (
                <TripList 
                  title="Tất cả chuyến đi" 
                  subtitle="Tất cả chuyến đi của bạn." 
                  items={remainingTrips} 
                />
              ) : (
                <>
                  <TripList 
                    title="Đang diễn ra" 
                    subtitle="Hành trình đang diễn ra ngay lúc này." 
                    items={remainingActive} 
                  />
                  <TripList 
                    title="Sắp diễn ra" 
                    subtitle="Hành trình chuẩn bị khởi hành sắp tới." 
                    items={remainingUpcoming} 
                  />
                  <TripList 
                    title="Đã hoàn thành" 
                    subtitle="Những chuyến đi đã kết thúc và có thể xem lại tổng kết." 
                    items={remainingPast} 
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
