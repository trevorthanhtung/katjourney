import React, { useState } from "react";
import { Calendar, MapPin, Plane, Trash2, Edit3, Compass, Users, Map } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";
import { TripForm } from "../more/MoreScreen";

export function TripManagerScreen({
  trips,
  onOpenTrip,
  onCreateNew,
}: {
  trips: Trip[];
  onOpenTrip: (id: number) => void;
  onCreateNew: () => void;
}) {
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const allMembers = useLiveQuery(() => db.members.toArray()) ?? [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) ?? [];
  const allChecklist = useLiveQuery(() => db.checklist.toArray()) ?? [];

  const memberCounts = allMembers.reduce((acc, m) => {
    acc[m.tripId] = (acc[m.tripId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  async function handleDelete(trip: Trip) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${trip.title}" không? Dữ liệu không thể khôi phục.`)) {
      if (trip.id) {
        await db.trips.delete(trip.id);
      }
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

  function TripCard({ trip }: { trip: Trip }) {
    const timing = getTripTiming(trip);
    const tripExpenses = allExpenses.filter(e => e.tripId === trip.id);
    const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const tripChecklist = allChecklist.filter(c => c.tripId === trip.id);
    const checklistRemaining = tripChecklist.filter(c => !c.completed).length;

    return (
      <div className="group relative flex flex-col h-full overflow-hidden rounded-[24px] bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] transition-all hover:shadow-md hover:border-kat-primary/40">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1 cursor-pointer pr-4" onClick={() => onOpenTrip(trip.id!)}>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h4 className="text-[18px] font-bold text-kat-text truncate leading-tight">{trip.title}</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {timing.status === "active" && (
                <span className="flex-none rounded-full bg-kat-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-kat-primary tracking-wide">Đang diễn ra</span>
              )}
              {timing.status === "upcoming" && (
                <span className="flex-none rounded-full bg-kat-accent-yellow/15 px-2.5 py-0.5 text-[11px] font-bold text-kat-accent-yellow tracking-wide">Sắp diễn ra</span>
              )}
              {timing.status === "past" && (
                <span className="flex-none rounded-full bg-kat-accent-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-kat-accent-blue tracking-wide">Đã kết thúc</span>
              )}
              <span className="flex-none rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 tracking-wide">
                {getTripDurationText(trip)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); }}
              title="Sửa thông tin"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
              onClick={(e) => { e.stopPropagation(); void handleDelete(trip); }}
              title="Xóa chuyến đi"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 cursor-pointer" onClick={() => onOpenTrip(trip.id!)}>
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <MapPin className="h-[14px] w-[14px] text-slate-400" />
            <span className="truncate">{trip.location || "Chưa có địa điểm"}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Calendar className="h-[14px] w-[14px] text-slate-400" />
            <span>{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{memberCounts[trip.id!] || 1} người</span> 
            </div>
            {totalExpense > 0 && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                <span>{totalExpense.toLocaleString()}đ</span>
              </div>
            )}
            {tripChecklist.length > 0 && checklistRemaining > 0 && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                <span>Còn {checklistRemaining} món cần chuẩn bị</span>
              </div>
            )}
            {tripChecklist.length > 0 && checklistRemaining === 0 && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <span>Sẵn sàng lên đường</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function TripList({ title, items }: { title: string; items: Trip[] }) {
    if (!items.length) return null;

    return (
      <section className="mb-8 md:mb-10">
        <h3 className="mb-4 px-1 text-[20px] font-extrabold text-kat-text">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] pb-24">
      {trips.length === 0 ? (
        <div className="mt-8 md:mt-16 flex flex-col items-center justify-center rounded-[32px] bg-[#FFFDF8] p-8 md:p-12 text-center border border-[#E8E1D8] shadow-sm mx-auto max-w-lg relative overflow-hidden">
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
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-kat-primary/10 border border-kat-primary/30 px-6 font-bold text-kat-text shadow-sm hover:bg-kat-primary/20 active:scale-[0.98] transition-all duration-200 relative z-10"
          >
            + Tạo chuyến đi
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 md:mb-12 rounded-[24px] bg-[#FFFDF8] border border-[#E8E1D8] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-kat-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-[32px] md:text-[36px] font-extrabold text-kat-text tracking-tight leading-tight">Chuyến đi của bạn</h1>
              <p className="mt-2 text-[15px] text-kat-muted max-w-md">Lưu lịch trình, thành viên, chi phí và những điều cần chuẩn bị cho từng chuyến đi.</p>
            </div>
            <button
              onClick={onCreateNew}
              className="flex h-[52px] w-full md:w-auto shrink-0 items-center justify-center rounded-[16px] bg-kat-primary/10 border border-kat-primary/30 px-8 font-bold text-kat-text shadow-sm hover:bg-kat-primary/20 active:scale-[0.98] transition-all duration-200 relative z-10"
            >
              + Tạo chuyến đi
            </button>
          </div>

          {featuredTrip && (
            <section className="mb-10 md:mb-14">
              <h3 className="mb-4 px-1 text-[20px] font-extrabold text-kat-text">Chuyến tiếp theo</h3>
              <div 
                className="group relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border border-[#E8E1D8] p-6 md:p-8 lg:p-10 shadow-sm cursor-pointer hover:border-kat-primary/40 transition-all min-h-[220px] flex flex-col justify-center"
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
                      <span className="rounded-full bg-kat-accent-yellow/15 px-3 py-1 text-[12px] font-bold text-kat-accent-yellow uppercase tracking-wider">Sắp khởi hành</span>
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
                      <MapPin className="h-5 w-5 text-kat-primary/70" />
                      <span className="font-medium text-[15px]">{featuredTrip.location || "Chưa có địa điểm"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-kat-primary/70" />
                      <span className="font-medium text-[15px]">{featuredTrip.startDate === featuredTrip.endDate ? formatDate(featuredTrip.startDate) : `${formatDate(featuredTrip.startDate)} - ${formatDate(featuredTrip.endDate)}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-kat-primary/70" />
                      <span className="font-medium text-[15px]">{memberCounts[featuredTrip.id!] || 1} người</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="h-10 px-5 rounded-full bg-kat-primary/10 border border-kat-primary/30 text-kat-text font-bold text-[14px] hover:bg-kat-primary/20 active:scale-95 transition-all shadow-sm">
                      Xem chi tiết
                    </button>
                    <button 
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                      onClick={(e) => { e.stopPropagation(); setEditingTrip(featuredTrip); }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {remainingTrips.length > 0 && (
            <div className="mt-2">
              {featuredTrip && remainingTrips.length <= 2 ? (
                <TripList title="Tất cả chuyến đi" items={remainingTrips} />
              ) : (
                <>
                  <TripList title="Sắp diễn ra" items={remainingUpcoming} />
                  <TripList title="Đang diễn ra" items={remainingActive} />
                  <TripList title="Đã hoàn thành" items={remainingPast} />
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
    </div>
  );
}

