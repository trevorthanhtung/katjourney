import React, { useEffect, useState } from "react";
import { Check, Edit3, MapPin, Plus, CalendarDays } from "lucide-react";
import { db, EventItem, Trip } from "../../db";
import { classNames, daysBetween, formatDate, today } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, IconButton, Input, ScreenTitle, Textarea } from "../../components/ui";

function ActivityCard({ item, onEdit, isToday, isUpcoming }: { item: EventItem; onEdit: () => void; isToday: boolean; isUpcoming: boolean }) {
  let iconContent = null;
  let buttonClass = "z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-sand transition-all duration-200";

  if (item.completed) {
    buttonClass += " bg-emerald-500 text-white";
    iconContent = <Check className="h-3.5 w-3.5" strokeWidth={3} />;
  } else if (isUpcoming) {
    buttonClass += " bg-white border-2 border-slate-300 hover:border-slate-400";
  } else {
    buttonClass += " bg-emerald-500";
    iconContent = <div className="h-2 w-2 rounded-full bg-white" />;
  }

  return (
    <article className="group relative flex gap-4 pl-2">
      <div className="absolute bottom-0 left-5 top-8 w-px bg-slate-200 group-last:bg-transparent" />
      
      <div className="relative mt-1 flex shrink-0">
        <button
          className={buttonClass}
          onClick={() => db.events.update(item.id!, { completed: !item.completed })}
          aria-label="Đánh dấu hoàn thành"
        >
          {iconContent}
        </button>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 mb-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {item.time && (
              <p className="text-[13px] font-bold text-sunset-600 mb-1">{item.time}</p>
            )}
            <h3 className={classNames("text-[17px] font-bold text-slate-900 leading-tight", item.completed && "text-slate-400 line-through")}>
              {item.title}
            </h3>
            {item.location && (
              <p className="mt-1.5 flex items-start gap-1 text-[14px] text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                <span className="truncate">{item.location}</span>
              </p>
            )}
            {item.notes && (
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {item.notes}
              </p>
            )}
            {item.mapLink && (
              <a className="mt-3 inline-block text-[14px] font-semibold text-emerald-600 hover:text-emerald-700" href={item.mapLink} target="_blank" rel="noreferrer">
                Xem trên Google Maps &rarr;
              </a>
            )}
          </div>
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600" onClick={onEdit} title="Chỉnh sửa">
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DayHeader({ day, index, isToday }: { day: string; index: number; isToday: boolean }) {
  return (
    <div className="sticky top-[72px] z-20 -mx-4 mb-4 flex items-center justify-between bg-sand/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold">
          {index + 1}
        </div>
        <div>
          <h4 className="text-[15px] font-bold text-slate-900">Ngày {index + 1}</h4>
          <p className="text-[13px] font-medium text-slate-500">{formatDate(day)}</p>
        </div>
      </div>
      {isToday && <span className="rounded-full bg-sunset-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sunset-700">Hôm nay</span>}
    </div>
  );
}

function EventForm({ tripId, day, editing, isOpen, onClose }: { tripId: number; day: string; editing: EventItem | null; isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    time: "",
    title: "",
    location: "",
    notes: "",
    mapLink: ""
  });

  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? {
              time: editing.time,
              title: editing.title,
              location: editing.location,
              notes: editing.notes,
              mapLink: editing.mapLink
            }
          : { time: "", title: "", location: "", notes: "", mapLink: "" }
      );
    }
  }, [editing, isOpen]);

  async function save() {
    if (!form.title.trim()) return;
    if (editing?.id) {
      await db.events.update(editing.id, { ...form, date: editing.date });
      onClose();
    } else {
      await db.events.add({ ...form, tripId, date: day, completed: false });
      onClose();
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editing ? "Sửa hoạt động" : "Thêm hoạt động"}>
      <div className="space-y-4">
        <Input label="Tiêu đề *" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="VD: Ra sân bay" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Địa điểm" value={form.location} onChange={(location) => setForm({ ...form, location })} placeholder="VD: Nội Bài" />
          <Input label="Giờ (không bắt buộc)" type="time" value={form.time} onChange={(time) => setForm({ ...form, time })} />
        </div>
        <Input label="Link bản đồ" value={form.mapLink} onChange={(mapLink) => setForm({ ...form, mapLink })} placeholder="https://maps.google.com/..." />
        <Textarea label="Ghi chú" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Mã đặt chỗ, lưu ý..." />
        <div className="pt-2">
          <FormActions onSave={save} saveLabel={editing ? "Lưu thay đổi" : "Thêm vào lịch trình"} />
        </div>
      </div>
    </BottomSheet>
  );
}

export function TimelineScreen({ trip, events }: { trip: Trip; events: EventItem[] }) {
  const tripDays = daysBetween(trip.startDate, trip.endDate);
  const eventDays = Array.from(new Set(events.map((e) => e.date)));
  const days = Array.from(new Set([...tripDays, ...eventDays])).sort();
  const tripIsActive = today >= trip.startDate && today <= trip.endDate;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  function openNewForm() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: EventItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="space-y-6">
        <ScreenTitle 
          title="Lịch trình" 
          subtitle="Từng bước nhỏ làm nên chuyến đi lớn." 
          action={
            <button
              onClick={openNewForm}
              className="hidden md:flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Thêm hoạt động
            </button>
          }
        />
        
        {events.length === 0 ? (
          <div className="rounded-[32px] bg-white px-6 py-12 shadow-sm border border-slate-100 flex flex-col items-center text-center mt-8 animate-fadeIn">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 ring-8 ring-emerald-50/50">
              <CalendarDays className="h-10 w-10" />
            </div>
            <p className="text-[18px] font-bold text-slate-900 mb-2">Chưa có hoạt động nào.</p>
            <p className="text-[15px] font-medium text-slate-500 mb-10 max-w-sm">
              Lịch trình sẽ giúp bạn sắp xếp chuyến đi dễ dàng hơn.
            </p>
            <button 
              onClick={openNewForm}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-[16px] font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:bg-emerald-700 active:scale-95 w-full sm:w-auto"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
              Thêm hoạt động đầu tiên
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12 lg:items-start pb-8">
            <div className="space-y-8">
              {(days.length ? days : [today]).map((day, index) => {
                const dayEvents = events.filter((item) => item.date === day).sort((a, b) => a.time.localeCompare(b.time));
                if (dayEvents.length === 0) return null;
                
                const isToday = tripIsActive && day === today;
                
                return (
                  <div key={day}>
                    <DayHeader day={day} index={index} isToday={isToday} />
                    <div className="px-1">
                      {dayEvents.map((item) => (
                        <ActivityCard key={item.id} item={item} onEdit={() => openEditForm(item)} isToday={isToday} isUpcoming={day > today} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:block sticky top-[88px] rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 mb-4">Gợi ý lịch trình</h3>
              <ul className="space-y-4 text-[14px] text-slate-600">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  <span>Sắp xếp thời gian di chuyển giữa các điểm đến.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  <span>Lưu sẵn link bản đồ để dễ tìm đường khi không có mạng (nếu lưu offline).</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  <span>Dành một chút khoảng trống để nghỉ ngơi ngẫu hứng.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {events.length > 0 && (
        <FAB 
          icon={<Plus className="h-7 w-7" strokeWidth={2.5} />} 
          label="Thêm hoạt động" 
          onClick={openNewForm} 
          className="md:hidden h-14 w-14 sm:h-16 sm:w-16 bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
        />
      )}

      <EventForm
        tripId={trip.id!}
        day={days.includes(today) ? today : days[0] ?? today}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
