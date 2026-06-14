import React from "react";
import { ArrowLeft, Compass, Calendar, MapPin, Users, WalletCards } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";

export function ArchiveGallery({
  onBack,
  onOpenTrip,
}: {
  onBack: () => void;
  onOpenTrip: (id: number) => void;
}) {
  const archivedTrips = useLiveQuery(async () => (await db.trips.toArray()).filter(t => !t.isDeleted && t.status === 'archived')) ?? [];
  const allMembers = useLiveQuery(async () => (await db.members.toArray()).filter(m => !m.isDeleted)) ?? [];
  const allExpenses = useLiveQuery(async () => (await db.expenses.toArray()).filter(e => !e.isDeleted)) ?? [];

  const memberCounts = allMembers.reduce((acc, m) => {
    acc[m.tripId] = (acc[m.tripId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

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

  function TripCard({ trip }: { trip: Trip }) {
    const tripExpenses = allExpenses.filter(e => e.tripId === trip.id);
    const totalExpense = tripExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return (
      <div 
        onClick={() => onOpenTrip(trip.id!)}
        className="group relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] hover:border-kat-primary/40 hover:bg-slate-50/40 transition-all hover:shadow-md w-full max-w-[420px] mx-auto md:mx-0 h-full motion-card-enter"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 tracking-wide">
              {getTripDurationText(trip)}
            </span>
          </div>

          <h4 className="text-[18px] md:text-[19px] font-extrabold text-kat-text leading-tight mb-4 line-clamp-2 text-slate-600">
            {trip.title}
          </h4>

          {/* Glanceable Grid Info */}
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[13px] font-semibold text-slate-500 mb-2 opacity-80">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{trip.location || "Chưa xác định"}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)}`}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{memberCounts[trip.id!] || 1} người</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <WalletCards className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{totalExpense > 0 ? `${totalExpense.toLocaleString()}đ` : "Chưa chi"}</span>
            </div>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 rotate-12 pointer-events-none opacity-20">
          <Compass className="w-12 h-12 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:px-6 md:pt-4 md:pb-16">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[24px] font-black text-kat-text">Kỷ niệm</h1>
          <p className="text-[14px] font-semibold text-slate-500">Các chuyến đi đã kết thúc và được lưu giữ.</p>
        </div>
      </div>

      {archivedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Compass className="h-8 w-8" />
          </div>
          <h3 className="text-[18px] font-bold text-slate-700">Kỷ niệm trống</h3>
          <p className="mt-2 text-[14px] text-slate-500">Những chuyến đi đã kết thúc sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {archivedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
