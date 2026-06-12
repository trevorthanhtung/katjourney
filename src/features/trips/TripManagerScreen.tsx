import React, { useState } from "react";
import { Calendar, MapPin, MoreHorizontal, Plane, Trash2, Edit3 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db } from "../../db";
import { formatDate, getTripTiming } from "../../utils/helpers";
import { classNames, ScreenTitle } from "../../components/ui";
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
  const memberCounts = allMembers.reduce((acc, m) => {
    acc[m.tripId] = (acc[m.tripId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const activeTrips = trips.filter((t) => getTripTiming(t).status === "active");
  const upcomingTrips = trips.filter((t) => getTripTiming(t).status === "upcoming" || getTripTiming(t).status === "unknown");
  const pastTrips = trips.filter((t) => getTripTiming(t).status === "past");

  async function handleDelete(trip: Trip) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${trip.title}" không? Dữ liệu không thể khôi phục.`)) {
      if (trip.id) {
        await db.trips.delete(trip.id);
      }
    }
  }

  function TripList({ title, items }: { title: string; items: Trip[] }) {
    if (!items.length) return null;

    return (
      <section className="mb-8">
        <h3 className="mb-3 px-2 text-[16px] font-bold text-slate-900">{title}</h3>
        <div className="space-y-3">
          {items.map((trip) => {
            const timing = getTripTiming(trip);
            return (
              <div key={trip.id} className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 cursor-pointer pr-4" onClick={() => onOpenTrip(trip.id!)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[17px] font-bold text-slate-900 truncate">{trip.title}</h4>
                      {timing.status === "active" && (
                        <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Đang diễn ra</span>
                      )}
                      {timing.status === "upcoming" && (
                        <span className="flex-none rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">Sắp tới</span>
                      )}
                      {timing.status === "past" && (
                        <span className="flex-none rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">Hoàn thành</span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{trip.location || "Chưa có địa điểm"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        <span className="font-medium text-slate-700">{memberCounts[trip.id!] || 1}</span> người tham gia
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setEditingTrip(trip)}
                      title="Sửa thông tin"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-full text-rose-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => void handleDelete(trip)}
                      title="Xóa chuyến đi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <ScreenTitle title="Chuyến đi của bạn" subtitle="Lưu lịch trình, thành viên, chi phí và việc cần chuẩn bị cho từng chuyến đi." />
      
      <div className="mt-6">
        <button
          onClick={onCreateNew}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4 font-bold text-emerald-700 transition-colors hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100"
        >
          + Tạo chuyến đi
        </button>

        <TripList title="Đang diễn ra" items={activeTrips} />
        <TripList title="Sắp diễn ra" items={upcomingTrips} />
        <TripList title="Đã hoàn thành" items={pastTrips} />
      </div>

      <TripForm
        isOpen={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        trip={editingTrip || undefined}
        onSaved={() => setEditingTrip(null)}
      />
    </div>
  );
}
