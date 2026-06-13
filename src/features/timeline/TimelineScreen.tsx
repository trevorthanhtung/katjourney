import React, { useEffect, useState } from "react";
import { 
  Check, 
  Edit3, 
  MapPin, 
  Plus, 
  CalendarDays, 
  Trash2, 
  Plane, 
  Utensils, 
  Camera, 
  BedDouble, 
  ShoppingBag, 
  Sparkles, 
  Clock, 
  Route,
  MapPinned,
  ChevronRight,
  Map,
  X,
  Hotel,
  Coffee,
  CircleEllipsis,
  StickyNote,
  Type,
  GitBranch
} from "lucide-react";
import { db, EventItem, Trip } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { classNames, daysBetween, formatDate, today, getTripTiming } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, Textarea, Select } from "../../components/ui";
import { BackupPlansSheet } from "./BackupPlansSheet";

// Define categories for PWA Travel 2027
const ACTIVITY_CATEGORIES = [
  { id: "transport", label: "Di chuyển", icon: Route, bgColor: "bg-blue-50 text-blue-600 border-blue-100", activeBg: "bg-blue-100 border-blue-400 text-blue-700" },
  { id: "dining", label: "Ăn uống", icon: Utensils, bgColor: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-100 border-rose-400 text-rose-700" },
  { id: "sightseeing", label: "Tham quan", icon: Camera, bgColor: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-100 border-amber-400 text-amber-700" },
  { id: "accommodation", label: "Lưu trú", icon: Hotel, bgColor: "bg-slate-100 text-[#030D2E] border-slate-200", activeBg: "bg-[#030D2E]/10 border-[#030D2E] text-[#030D2E]" },
  { id: "relaxation", label: "Nghỉ ngơi", icon: Coffee, bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-100 border-emerald-400 text-emerald-700" },
  { id: "shopping", label: "Mua sắm", icon: ShoppingBag, bgColor: "bg-purple-50 text-purple-600 border-purple-100", activeBg: "bg-purple-100 border-purple-400 text-purple-700" },
  { id: "other", label: "Khác", icon: CircleEllipsis, bgColor: "bg-slate-50 text-slate-600 border-slate-100", activeBg: "bg-slate-100 border-slate-400 text-slate-700" }
];

function getCategory(id?: string) {
  return ACTIVITY_CATEGORIES.find(c => c.id === id) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

function ActivityCard({ 
  item, 
  onEdit, 
  isToday, 
  isUpcoming,
  idx = 0,
  backupCount,
  onOpenBackup
}: { 
  item: EventItem; 
  onEdit: () => void; 
  isToday: boolean; 
  isUpcoming: boolean;
  idx?: number;
  backupCount?: number;
  onOpenBackup?: () => void;
}) {
  const category = getCategory(item.type);
  const CatIcon = category.icon;
  
  const toggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.events.update(item.id!, { completed: !item.completed });
  };

  return (
    <article className={`group relative flex gap-4 pl-1 mb-6 last:mb-2 motion-card-enter motion-delay-${Math.min(idx + 1, 5)}`}>
      {/* Timeline connector line */}
      <div className="absolute bottom-0 left-[21px] top-11 w-0.5 bg-slate-200/80 group-last:bg-transparent" />
      
      {/* Activity type icon serving as timeline marker (min 44x44px target) */}
      <div className="relative z-10 flex shrink-0">
        <button
          onClick={toggleComplete}
          className={classNames(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-4 ring-[#FAF7F1] transition-all duration-200 motion-press",
            item.completed 
              ? "bg-emerald-500 text-white hover:bg-emerald-600" 
              : `${category.bgColor} border hover:scale-105`
          )}
          aria-label={item.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
        >
          {item.completed ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <CatIcon className="h-5 w-5" strokeWidth={2.2} />
          )}
        </button>
      </div>

      {/* Card Body */}
      <div 
        onClick={onEdit}
        className="min-w-0 flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer transition-all duration-200 motion-press"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Header: Time and Category Badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {item.time ? (
                <span className="flex items-center gap-1 text-[13px] font-bold text-sunset-600 bg-sunset-50 px-2.5 py-0.5 rounded-full border border-sunset-100">
                  <Clock className="h-3 w-3 shrink-0" />
                  {item.time}
                </span>
              ) : (
                <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100/60">
                  Chưa đặt giờ
                </span>
              )}
              
              <span className={classNames("text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border", category.bgColor)}>
                {category.label}
              </span>
            </div>

            {/* Title */}
            <h3 className={classNames(
              "text-[17px] font-extrabold text-[#030D2E] leading-tight", 
              item.completed && "text-slate-400 line-through decoration-slate-300"
            )}>
              {item.title}
            </h3>

            {/* Location */}
            {item.location && (
              <p className="mt-2 flex items-start gap-1 text-[14px] font-medium text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                <span className="truncate">{item.location}</span>
              </p>
            )}

            {/* Notes */}
            {item.notes && (
              <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-medium">
                {item.notes}
              </p>
            )}

            {/* Google Maps link */}
            {item.mapLink && (
              <a 
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors" 
                href={item.mapLink} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Map className="w-3.5 h-3.5" />
                Xem trên Google Maps &rarr;
              </a>
            )}

            {/* Backup Plans Badge */}
            <div className="mt-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenBackup?.(); }}
                className={classNames(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-colors motion-press",
                  backupCount && backupCount > 0 
                    ? "bg-kat-primary-light text-kat-primary border-kat-primary/30 hover:bg-kat-primary/20"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                {backupCount && backupCount > 0 ? `${backupCount} phương án dự phòng` : "Thêm phương án dự phòng"}
              </button>
            </div>
          </div>

          {/* Quick Edit icon */}
          <button 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }} 
            title="Chỉnh sửa"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DayHeader({ day, index, isToday }: { day: string; index: number; isToday: boolean }) {
  return (
    <div className="sticky top-[64px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/90 px-4 py-3.5 backdrop-blur-md border-b border-slate-200/40">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#030D2E] text-white font-black text-[14px] shadow-sm">
          {index + 1}
        </div>
        <div>
          <h4 className="text-[16px] font-extrabold text-[#030D2E]">Ngày {index + 1}</h4>
          <p className="text-[13px] font-semibold text-slate-500">{formatDate(day)}</p>
        </div>
      </div>
      {isToday && (
        <span className="rounded-full bg-sunset-100 px-3 py-1 text-[10.5px] font-black uppercase tracking-widest text-sunset-700 shadow-inner">
          Hôm nay
        </span>
      )}
    </div>
  );
}

function EventForm({ 
  tripId, 
  tripDays, 
  editing, 
  isOpen, 
  onClose,
  defaultDate,
  onSaved
}: { 
  tripId: number; 
  tripDays: string[]; 
  editing: EventItem | null; 
  isOpen: boolean; 
  onClose: () => void;
  defaultDate?: string;
  onSaved?: (date: string) => void;
}) {
  const [form, setForm] = useState({
    time: "",
    title: "",
    location: "",
    notes: "",
    mapLink: "",
    type: "other",
    date: ""
  });

  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? {
              time: editing.time || "",
              title: editing.title || "",
              location: editing.location || "",
              notes: editing.notes || "",
              mapLink: editing.mapLink || "",
              type: editing.type || "other",
              date: editing.date || (tripDays[0] || today)
            }
          : { 
              time: "", 
              title: "", 
              location: "", 
              notes: "", 
              mapLink: "", 
              type: "other",
              date: defaultDate || (tripDays.includes(today) ? today : (tripDays[0] || today))
            }
      );
    }
  }, [editing, isOpen, tripDays, defaultDate]);

  async function save() {
    if (!form.title.trim()) return;
    if (editing?.id) {
      await db.events.update(editing.id, { 
        ...form, 
        completed: editing.completed 
      });
      onSaved?.(form.date);
      onClose();
    } else {
      await db.events.add({ 
        ...form, 
        tripId, 
        completed: false 
      });
      onSaved?.(form.date);
      onClose();
    }
  }

  async function remove() {
    if (editing?.id && window.confirm("Xóa mục lịch trình này?\nMục lịch trình sẽ không còn xuất hiện trong lịch trình.")) {
      await db.events.delete(editing.id);
      onClose();
    }
  }

  const dateLabels = tripDays.reduce((acc, date, idx) => {
    acc[date] = `Ngày ${idx + 1} (${formatDate(date)})`;
    return acc;
  }, {} as Record<string, string>);

  const selectedDateIdx = tripDays.indexOf(form.date);
  const helperText = selectedDateIdx !== -1 
    ? `Mục lịch trình sẽ được thêm vào Ngày ${selectedDateIdx + 1} · ${formatDate(form.date)}`
    : "";

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa mục lịch trình" : "Thêm mục lịch trình"}
      footer={
        <div className="flex flex-col gap-2.5 w-full">
          <FormActions 
            onSave={save} 
            saveLabel={editing ? "Lưu thông tin" : "Thêm mục lịch trình"} 
            onCancel={onClose}
            disabled={!form.title.trim()}
          />
          {editing && (
            <button
              onClick={remove}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[16px] bg-rose-50 border border-rose-200 px-6 font-bold text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.98] transition-all duration-200"
            >
              <Trash2 className="h-4.5 w-4.5" />
              Xóa mục lịch trình
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title Input */}
        <Input 
          label={
            <span className="flex items-center gap-1.5">
              <Type className="h-4 w-4 text-slate-500" />
              Tên mục lịch trình *
            </span>
          } 
          value={form.title} 
          onChange={(title) => setForm({ ...form, title })} 
          placeholder="VD: Ăn trưa tại quán địa phương" 
        />

        {/* Category Selector Grid */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Loại lịch trình</span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {ACTIVITY_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = form.type === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: cat.id })}
                  className={classNames(
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center h-[64px] motion-press",
                    isSelected 
                      ? cat.activeBg 
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                  <span className="text-[10px] font-bold leading-none">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            {tripDays.length > 0 ? (
              <Select
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    Chọn ngày
                  </span>
                }
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                options={tripDays}
                labels={dateLabels}
              />
            ) : (
              <Input 
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    Ngày (YYYY-MM-DD)
                  </span>
                } 
                value={form.date} 
                onChange={(date) => setForm({ ...form, date })} 
              />
            )}
            {helperText && (
              <p className="px-1 text-[12px] font-semibold text-slate-500">{helperText}</p>
            )}
          </div>
          
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-500" />
                Giờ khởi hành / thời gian
              </span>
            } 
            type="time" 
            value={form.time} 
            onChange={(time) => setForm({ ...form, time })} 
          />
        </div>

        {/* Location and Map link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500" />
                Địa điểm
              </span>
            } 
            value={form.location} 
            onChange={(location) => setForm({ ...form, location })} 
            placeholder="VD: Bãi Trước, Vũng Tàu" 
          />
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <Map className="h-4 w-4 text-slate-500" />
                Link bản đồ
              </span>
            } 
            value={form.mapLink} 
            onChange={(mapLink) => setForm({ ...form, mapLink })} 
            placeholder="https://maps.google.com/..." 
          />
        </div>

        {/* Notes */}
        <Textarea 
          label={
            <span className="flex items-center gap-1.5">
              <StickyNote className="h-4 w-4 text-slate-500" />
              Ghi chú, mã đặt chỗ
            </span>
          } 
          value={form.notes} 
          onChange={(notes) => setForm({ ...form, notes })} 
          placeholder="Lưu ý quan trọng, mã phòng, số điện thoại liên hệ..." 
        />
      </div>
    </BottomSheet>
  );
}

export function TimelineScreen({ trip, events }: { trip: Trip; events: EventItem[] }) {
  const tripDays = daysBetween(trip.startDate, trip.endDate);
  const eventDays = Array.from(new Set(events.map((e) => e.date)));
  const days = Array.from(new Set([...tripDays, ...eventDays])).filter(Boolean).sort();
  const tripIsActive = today >= trip.startDate && today <= trip.endDate;

  const [selectedDay, setSelectedDay] = useState<string | "all">("all");
  const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string>("");

  const [isBackupPlansOpen, setIsBackupPlansOpen] = useState(false);
  const [backupPlanCtx, setBackupPlanCtx] = useState<{ activityId?: number; date?: string }>({});

  const backupPlans = useLiveQuery(() => db.backupPlans.where("tripId").equals(trip.id!).toArray(), [trip.id]) ?? [];

  // Default selected day calculations on mount or trip bounds change
  useEffect(() => {
    const isTodayInTrip = days.includes(today);
    const timing = getTripTiming(trip);

    if (isTodayInTrip) {
      setSelectedDay(today);
    } else if (timing.status === "upcoming") {
      const isMobile = window.innerWidth < 768;
      setSelectedDay(isMobile ? (trip.startDate || "all") : "all");
    } else {
      setSelectedDay("all");
    }
  }, [trip.startDate, trip.endDate]);

  function openNewForm(defaultDateVal?: string) {
    setEditing(null);
    if (defaultDateVal) {
      setFormDefaultDate(defaultDateVal);
    } else if (selectedDay !== "all") {
      setFormDefaultDate(selectedDay);
    } else {
      setFormDefaultDate(tripDays.includes(today) ? today : (tripDays[0] || today));
    }
    setIsFormOpen(true);
  }

  function openEditForm(item: EventItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  const handleEventSaved = (date: string) => {
    setSelectedDay(date);
  };

  const renderDayNav = () => {
    // If the trip has only 1 day, don't show select rail
    if (days.length <= 1) {
      return (
        <div className="mb-6 px-1 text-[15px] font-bold text-slate-600">
          Ngày 1 · {days[0] ? formatDate(days[0]) : ""}
        </div>
      );
    }

    let chipsToRender: Array<{ date: string | "all"; label: string; sub: string }> = [];
    const is15Plus = days.length >= 15;

    if (is15Plus) {
      // Simplify rail for 15+ days: Tất cả, Hôm nay (if inside range), Ngày đang chọn, Chọn ngày
      chipsToRender.push({ date: "all", label: "Tất cả", sub: `${events.length} mục` });
      
      const isTodayInTrip = days.includes(today);
      if (isTodayInTrip) {
        const todayIdx = days.indexOf(today);
        chipsToRender.push({ date: today, label: "Hôm nay", sub: `Ngày ${todayIdx + 1}` });
      }

      if (selectedDay !== "all" && selectedDay !== today && days.includes(selectedDay)) {
        const selIdx = days.indexOf(selectedDay);
        chipsToRender.push({ date: selectedDay, label: `Ngày ${selIdx + 1}`, sub: formatDateShort(selectedDay) });
      }
    } else {
      // 2-14 Days: Tất cả + all days
      chipsToRender.push({ date: "all", label: "Tất cả", sub: `${events.length} mục` });
      days.forEach((day, idx) => {
        const count = events.filter(e => e.date === day).length;
        chipsToRender.push({
          date: day,
          label: `Ngày ${idx + 1}`,
          sub: `${formatDateShort(day)} · ${count}`
        });
      });
    }

    return (
      <div className="mb-6 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none w-full select-none shrink-0">
        {chipsToRender.map((chip) => {
          const isActive = selectedDay === chip.date;
          return (
            <button
              key={chip.date}
              type="button"
              onClick={() => setSelectedDay(chip.date)}
              className={classNames(
                "flex flex-col items-center justify-center py-2 px-4 rounded-2xl border shrink-0 min-w-[96px] min-h-[52px] transition-all motion-press select-none",
                isActive 
                  ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm" 
                  : "bg-[#FFFDF8] border-[#E8E1D8] text-slate-700 hover:bg-slate-50 hover:border-slate-350"
              )}
            >
              <span className="text-[13.5px] font-extrabold leading-none">{chip.label}</span>
              <span className={classNames(
                "text-[10.5px] font-bold mt-1.5 leading-none",
                isActive ? "text-white/80" : "text-slate-400"
              )}>
                {chip.sub}
              </span>
            </button>
          );
        })}

        {days.length >= 8 && (
          <button
            type="button"
            onClick={() => setIsDaySelectorOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl border border-dashed border-[#00BFB7]/40 bg-[#00BFB7]/5 text-[#030D2E] font-extrabold text-[13.5px] shrink-0 min-h-[52px] hover:bg-[#00BFB7]/10 transition-all motion-press select-none"
          >
            <span>Chọn ngày</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const undatedEvents = events.filter(e => !e.date);

  const renderTimeline = () => {
    if (selectedDay === "all") {
      return (
        <div key="all" className="space-y-8 motion-page-enter">
          {days.map((day, index) => {
            const dayEvents = events.filter((item) => item.date === day).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
            const isToday = tripIsActive && day === today;
            
            return (
              <div key={day} className="space-y-4">
                <DayHeader day={day} index={index} isToday={isToday} />
                <div className="px-1">
                  {dayEvents.length === 0 ? (
                    <div className="px-1 relative flex gap-4 pl-1 mb-6">
                      <div className="relative z-10 flex shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400 font-extrabold border border-slate-200/40">
                          {index + 1}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl bg-slate-50/45 p-3.5 border border-dashed border-slate-200 text-center py-4">
                        <p className="text-[13px] font-semibold text-slate-400">Chưa có mục lịch trình trong ngày này.</p>
                      </div>
                    </div>
                  ) : (
                    dayEvents.map((item, idx) => (
                      <ActivityCard 
                        key={item.id} 
                        item={item} 
                        onEdit={() => openEditForm(item)} 
                        isToday={isToday} 
                        isUpcoming={day > today} 
                        idx={idx}
                        backupCount={backupPlans.filter(p => p.activityId === item.id).length}
                        onOpenBackup={() => {
                          setBackupPlanCtx({ activityId: item.id, date: day });
                          setIsBackupPlansOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Undated fallback events */}
          {undatedEvents.length > 0 && (
            <div key="undated" className="space-y-4">
              <div className="sticky top-[64px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/90 px-4 py-3.5 backdrop-blur-md border-b border-slate-200/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-white font-black text-[14px] shadow-sm">
                    ?
                  </div>
                  <div>
                    <h4 className="text-[16px] font-extrabold text-[#030D2E]">Chưa phân ngày</h4>
                    <p className="text-[13px] font-semibold text-slate-500">Các mục lịch trình chưa xếp ngày cụ thể</p>
                  </div>
                </div>
              </div>
              <div className="px-1">
                {undatedEvents.map((item, idx) => (
                  <ActivityCard 
                    key={item.id} 
                    item={item} 
                    onEdit={() => openEditForm(item)} 
                    isToday={false} 
                    isUpcoming={false} 
                    idx={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Backup plans for all days */}
          {backupPlans.filter(p => !p.activityId && !p.date).length > 0 && (
            <div className="space-y-4">
              <div className="sticky top-[64px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/90 px-4 py-3.5 backdrop-blur-md border-b border-slate-200/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-primary-light text-kat-primary font-black text-[14px] shadow-sm">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-extrabold text-[#030D2E]">Dự phòng chung</h4>
                    <p className="text-[13px] font-semibold text-slate-500">Các phương án áp dụng cho toàn bộ chuyến đi</p>
                  </div>
                </div>
                <button
                  onClick={() => { setBackupPlanCtx({}); setIsBackupPlansOpen(true); }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 motion-press"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-6">
             <button
                onClick={() => { setBackupPlanCtx({}); setIsBackupPlansOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-kat-primary/30 text-kat-primary font-bold text-[14px] hover:bg-kat-primary/10 transition-colors motion-press"
             >
               <GitBranch className="w-4.5 h-4.5" />
               Thêm phương án dự phòng chuyến đi
             </button>
          </div>
        </div>
      );
    } else {
      const dayIndex = days.indexOf(selectedDay);
      const isToday = tripIsActive && selectedDay === today;
      const dayEvents = events.filter((item) => item.date === selectedDay).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      const dayLabel = dayIndex !== -1 ? `Ngày ${dayIndex + 1}` : "ngày này";

      return (
        <div key={selectedDay} className="space-y-4 motion-page-enter">
          {dayIndex !== -1 && (
            <DayHeader day={selectedDay} index={dayIndex} isToday={isToday} />
          )}
          
          <div className="px-1">
            {dayEvents.length === 0 ? (
              <div className="min-w-0 flex-1 rounded-[24px] bg-kat-surface p-8 border border-kat-border/60 shadow-soft flex flex-col items-center text-center motion-card-enter mt-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                  <MapPinned className="h-6 w-6" />
                </div>
                <h4 className="text-[15.5px] font-bold text-kat-text">Chưa có mục lịch trình trong {dayLabel}</h4>
                <p className="mt-1.5 text-[13.5px] text-kat-muted font-medium max-w-sm leading-relaxed">
                  Thêm điểm đến, giờ di chuyển hoặc việc cần làm cho ngày này.
                </p>
                <button 
                  onClick={() => openNewForm(selectedDay)}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-kat-primary text-[#030D2E] hover:brightness-105 px-5 py-2.5 text-[13.5px] font-black shadow-sm transition-all motion-press"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Thêm mục lịch trình cho {dayLabel}
                </button>
              </div>
            ) : (
              dayEvents.map((item, idx) => (
                <ActivityCard 
                  key={item.id} 
                  item={item} 
                  onEdit={() => openEditForm(item)} 
                  isToday={isToday} 
                  isUpcoming={selectedDay > today} 
                  idx={idx}
                  backupCount={backupPlans.filter(p => p.activityId === item.id).length}
                  onOpenBackup={() => {
                    setBackupPlanCtx({ activityId: item.id, date: selectedDay });
                    setIsBackupPlansOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* Backup plans for the specific day */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-1 mb-4">
               <h4 className="text-[15px] font-extrabold text-[#030D2E] flex items-center gap-2">
                 <GitBranch className="w-4 h-4 text-kat-primary" />
                 Dự phòng trong ngày
               </h4>
               <button
                 onClick={() => { setBackupPlanCtx({ date: selectedDay }); setIsBackupPlansOpen(true); }}
                 className="text-[13px] font-bold text-kat-primary hover:text-kat-primary-usable motion-press"
               >
                 {backupPlans.filter(p => !p.activityId && p.date === selectedDay).length > 0 ? "Quản lý" : "Thêm mới"}
               </button>
            </div>
            {backupPlans.filter(p => !p.activityId && p.date === selectedDay).length > 0 && (
              <div className="px-1 space-y-3">
                 {backupPlans.filter(p => !p.activityId && p.date === selectedDay).map(plan => (
                   <div key={plan.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-kat-primary/30 transition-colors cursor-pointer motion-press" onClick={() => { setBackupPlanCtx({ date: selectedDay }); setIsBackupPlansOpen(true); }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-kat-primary bg-kat-primary-light px-2 py-0.5 rounded-md border border-kat-primary/20">
                          {plan.title}
                        </span>
                        {plan.reason && <span className="text-[12px] font-bold text-slate-500 truncate">Khi: {plan.reason}</span>}
                      </div>
                      {plan.location && <p className="text-[13px] font-semibold text-slate-600 mt-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {plan.location}</p>}
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="w-full sm:w-auto">
          <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Lịch trình</h2>
          <p className="mt-1 text-[15px] font-medium text-slate-500">Sắp xếp từng điểm dừng để hành trình rõ ràng và trọn vẹn hơn.</p>
          {/* Mobile CTA */}
          <button
            onClick={() => openNewForm()}
            className="flex md:hidden items-center justify-center gap-2 w-full mt-3.5 h-[46px] rounded-2xl bg-[#00BFB7] text-[#030D2E] text-[14px] font-bold shadow-sm motion-press"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Thêm mục lịch trình
          </button>
        </div>
        <div>
          {/* Desktop CTA */}
          <button
            onClick={() => openNewForm()}
            className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-5 text-[14px] font-bold text-kat-text shadow-sm hover:bg-kat-primary/20 motion-press h-[48px]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
            Thêm mục lịch trình
          </button>
        </div>
      </div>

      {/* Day Navigation Selection Rail */}
      {renderDayNav()}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start pb-0 md:pb-8">
        {/* Left Column: Timeline list */}
        <div className="space-y-8">
          {events.length === 0 && selectedDay === "all" ? (
            /* Compact Empty Timeline Card */
            <div>
              <DayHeader day={trip.startDate} index={0} isToday={tripIsActive && trip.startDate === today} />
              <div className="px-1 relative flex gap-4 pl-1">
                {/* Circle marker */}
                <div className="relative z-10 flex shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 font-extrabold border border-slate-200/50">
                    1
                  </div>
                </div>
                
                {/* Compact Card */}
                <div className="min-w-0 flex-1 rounded-[24px] bg-kat-surface p-6 border border-kat-border/60 shadow-soft animate-fadeIn flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                    <MapPinned className="h-6 w-6" />
                  </div>
                  <h4 className="text-[15px] font-bold text-kat-text">Chưa có mục lịch trình nào</h4>
                  <p className="mt-1 text-[13.5px] text-kat-muted font-medium max-w-sm">Thêm điểm đến, thời gian di chuyển hoặc việc cần làm để hành trình rõ ràng hơn.</p>
                  <button 
                    onClick={() => openNewForm()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-4 py-2 text-[13px] font-bold text-kat-text hover:bg-kat-primary/20 motion-press"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Thêm mục lịch trình đầu tiên
                  </button>
                </div>
              </div>
            </div>
          ) : (
            renderTimeline()
          )}
        </div>

        {/* Right Column: Dynamic smart widgets */}
        <div className="space-y-6 lg:sticky lg:top-[90px]">
          {/* Mini Trip Context Card */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                <Route className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-[#030D2E]">Thông tin hành trình</h4>
            </div>
            
            <div className="space-y-3 text-[14px] font-medium text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Điểm đến
                </span>
                <span className="font-bold text-[#030D2E]">{trip.location || "Chưa xác định"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Thời gian
                </span>
                <span className="font-bold text-[#030D2E]">
                  {trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-slate-400" />
                  Mục lịch trình
                </span>
                <span className="font-bold text-[#030D2E]">{events.length} mục</span>
              </div>
            </div>
          </div>

          {/* Smart Assistant Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-[#030D2E]">Gợi ý hành trình</h4>
            </div>

            {/* Smart Dynamic Tip */}
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100/60 text-[13.5px] leading-relaxed text-amber-800 font-medium">
              {events.length === 0 ? (
                "Chuyến đi của bạn chưa có mục lịch trình nào. Hãy bắt đầu bằng nơi lưu trú, giờ xuất phát hoặc điểm dừng đầu tiên."
              ) : !events.some(e => e.type === "dining") ? (
                "Mẹo: Hành trình của bạn chưa có mục Ăn uống nào. Hãy lưu thêm các quán ngon địa phương muốn thử để thưởng thức ẩm thực!"
              ) : !events.some(e => e.mapLink) ? (
                "Mẹo: Thêm link Google Maps cho các điểm dừng để tra cứu đường đi siêu tốc kể cả khi đang di chuyển."
              ) : (
                "Lịch trình của bạn trông rất ổn! Đừng quên dành 1-2 tiếng nghỉ ngơi tự do giữa các điểm tham quan."
              )}
            </div>

            {/* Travel Tips List */}
            <div className="space-y-3 pt-2">
              <h5 className="text-[12.5px] font-black uppercase tracking-wider text-slate-400">Mẹo hữu ích</h5>
              <ul className="space-y-3 text-[13.5px] font-medium text-slate-600">
                <li className="flex gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-kat-primary shrink-0 mt-2" />
                  <span>Nên chừa 30–45 phút giữa các điểm dừng để tránh cập rập.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-kat-primary shrink-0 mt-2" />
                  <span>Thêm link Google Maps để tra cứu nhanh khi đang di chuyển.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-kat-primary shrink-0 mt-2" />
                  <span>Lưu mã đặt phòng, vé hoặc số điện thoại liên hệ vào ghi chú.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Select Day Bottom Sheet selector for 8+ days */}
      <BottomSheet
        isOpen={isDaySelectorOpen}
        onClose={() => setIsDaySelectorOpen(false)}
        title="Chọn ngày lịch trình"
      >
        <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => { setSelectedDay("all"); setIsDaySelectorOpen(false); }}
            className={classNames(
              "p-3 rounded-2xl border text-center font-bold text-[14px] transition-all motion-press h-[60px] flex flex-col items-center justify-center",
              selectedDay === "all" ? "bg-[#030D2E] text-white border-[#030D2E]" : "bg-[#FFFDF8] border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <span className="font-extrabold text-[13.5px]">Tất cả</span>
            <span className={classNames("text-[11px] font-semibold mt-0.5", selectedDay === "all" ? "text-white/80" : "text-slate-450")}>
              {events.length} mục
            </span>
          </button>
          {days.map((day, idx) => {
            const count = events.filter(e => e.date === day).length;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => { setSelectedDay(day); setIsDaySelectorOpen(false); }}
                className={classNames(
                  "p-3 rounded-2xl border text-center transition-all motion-press h-[60px] flex flex-col items-center justify-center",
                  isSelected ? "bg-[#030D2E] text-white border-[#030D2E]" : "bg-[#FFFDF8] border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="font-extrabold text-[13.5px]">Ngày {idx + 1}</div>
                <div className={classNames("text-[11px] mt-0.5 font-semibold", isSelected ? "text-white/80" : "text-slate-400")}>
                  {formatDateShort(day)} {count > 0 ? `· ${count} mục` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <EventForm
        tripId={trip.id!}
        tripDays={tripDays}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultDate={formDefaultDate}
        onSaved={handleEventSaved}
      />

      <BackupPlansSheet
        tripId={trip.id!}
        activityId={backupPlanCtx.activityId}
        date={backupPlanCtx.date}
        isOpen={isBackupPlansOpen}
        onClose={() => setIsBackupPlansOpen(false)}
      />
    </div>
  );
}
