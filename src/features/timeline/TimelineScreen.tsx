import React, { useEffect, useState, useRef } from "react";
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
  GitBranch,
  MoreVertical
} from "lucide-react";
import { db, EventItem, Trip } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { classNames, daysBetween, formatDate, today, getTripTiming } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, Textarea, Select, DeleteConfirmModal } from "../../components/ui";
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
  onOpenBackup,
  onDelete
}: { 
  item: EventItem; 
  onEdit: () => void; 
  isToday: boolean; 
  isUpcoming: boolean;
  idx?: number;
  backupCount?: number;
  onOpenBackup?: () => void;
  onDelete: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

          {/* Quick options menu trigger (min 44x44px target zone) */}
          <div className="relative shrink-0">
            <button 
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00BFB7]/40" 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }} 
              title="Tùy chọn"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }} 
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 w-36 rounded-2xl border border-slate-150 bg-white p-1.5 shadow-lg animate-scaleIn text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-slate-500" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    Xóa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DayHeader({ day, index, isToday }: { day: string; index: number; isToday: boolean }) {
  return (
    <div 
      id={`day-section-${day}`} 
      className="scroll-mt-[180px] sticky top-[115px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
    >
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
  onSaved,
  onDelete
}: { 
  tripId: number; 
  tripDays: string[]; 
  editing: EventItem | null; 
  isOpen: boolean; 
  onClose: () => void;
  defaultDate?: string;
  onSaved?: (date: string) => void;
  onDelete: () => void;
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
              onClick={onDelete}
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

  const [filterDay, setFilterDay] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<string | "all">("all");
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string>("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  const [isBackupPlansOpen, setIsBackupPlansOpen] = useState(false);
  const [backupPlanCtx, setBackupPlanCtx] = useState<{ activityId?: number; date?: string }>({});

  const backupPlans = useLiveQuery(() => db.backupPlans.where("tripId").equals(trip.id!).toArray(), [trip.id]) ?? [];
  const isScrollingRef = useRef(false);

  // Default selected day calculations on mount or trip bounds change
  useEffect(() => {
    const isTodayInTrip = days.includes(today);
    const timing = getTripTiming(trip);

    setFilterDay("all");
    setActiveTab("all");

    if (isTodayInTrip) {
      setTimeout(() => {
        const element = document.getElementById(`day-section-${today}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, [trip.startDate, trip.endDate]);

  // Scrollspy viewport tracking
  useEffect(() => {
    const handleScroll = () => {
      if (filterDay !== "all") return;
      if (isScrollingRef.current) return;
      
      const daySections = days.map(day => document.getElementById(`day-section-${day}`)).filter(Boolean) as HTMLElement[];
      let currentActiveDay = "all";
      const scrollPosition = window.scrollY + 185; 
      
      for (const section of daySections) {
        if (section.offsetTop <= scrollPosition) {
          currentActiveDay = section.id.replace("day-section-", "");
        }
      }
      
      if (window.scrollY < 80) {
        currentActiveDay = "all";
      }
      
      setActiveTab(currentActiveDay);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [days, filterDay]);

  const selectDayFilter = (day: string | "all") => {
    setFilterDay(day);
    setActiveTab(day);
    
    if (day === "all") {
      isScrollingRef.current = true;
      const element = document.getElementById("timeline-top");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  function openNewForm(defaultDateVal?: string) {
    setEditing(null);
    if (defaultDateVal) {
      setFormDefaultDate(defaultDateVal);
    } else if (filterDay !== "all") {
      setFormDefaultDate(filterDay);
    } else {
      setFormDefaultDate(tripDays.includes(today) ? today : (tripDays[0] || today));
    }
    setIsFormOpen(true);
  }

  function openEditForm(item: EventItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  function initiateDelete(item: EventItem) {
    setEventToDelete(item);
    setIsDeleteConfirmOpen(true);
  }

  async function executeDelete() {
    if (!eventToDelete?.id) return;
    await db.events.delete(eventToDelete.id);
    setIsDeleteConfirmOpen(false);
    setEventToDelete(null);
    setIsFormOpen(false);
  }

  const handleEventSaved = (date: string) => {
    selectDayFilter(date);
  };

  const renderDayNav = () => {
    // If the trip has only 1 day, don't show select rail
    if (days.length <= 1) {
      return null;
    }

    const hasMoreDays = days.length > 4;
    const visibleDays = days.slice(0, 4);
    
    // If selected day is beyond the first 4, append it dynamically so it is visible and highlighted
    const selectedIdx = days.indexOf(filterDay);
    if (filterDay !== "all" && selectedIdx >= 4) {
      visibleDays.push(filterDay);
    }

    return (
      <div 
        className="flex items-center gap-2 overflow-x-auto py-1 w-full select-none shrink-0 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* "Tất cả" tab */}
        <button
          type="button"
          onClick={() => selectDayFilter("all")}
          className={classNames(
            "flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border shrink-0 text-[13px] font-extrabold transition-all duration-200 motion-press cursor-pointer",
            activeTab === "all"
              ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <span>Tất cả</span>
          <span className={classNames(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          )}>
            {events.length}
          </span>
        </button>

        {/* Day tabs */}
        {visibleDays.map((day) => {
          const idx = days.indexOf(day);
          const hasEvents = events.some(e => e.date === day);
          const isActive = activeTab === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDayFilter(day)}
              className={classNames(
                "flex items-center gap-2 py-1.5 px-3.5 rounded-full border shrink-0 text-[13px] font-extrabold transition-all duration-200 motion-press cursor-pointer",
                isActive
                  ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
                  : hasEvents 
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
                    : "bg-white/40 border-slate-200/60 text-slate-400 hover:bg-slate-50"
              )}
            >
              <span>Ngày {idx + 1}</span>
              {hasEvents ? (
                <span className={classNames(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isActive ? "bg-white" : "bg-[#00BFB7]"
                )} />
              ) : (
                <span className="text-[10.5px] text-slate-400 font-semibold">({formatDateShort(day)})</span>
              )}
            </button>
          );
        })}

        {/* "Xem thêm" pill at the end of the rail if there are more than 4 days */}
        {hasMoreDays && (
          <button
            type="button"
            onClick={() => setIsDayPickerOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full border border-slate-200 bg-white text-[#00BFB7] hover:bg-slate-50 shrink-0 text-[13px] font-extrabold transition-all duration-200 motion-press cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#00BFB7]" />
            <span>Xem thêm ({days.length - 4})</span>
          </button>
        )}
      </div>
    );
  };

  const undatedEvents = events.filter(e => !e.date);

  const renderTimeline = () => {
    const activeDays = filterDay === "all" ? days : days.filter(d => d === filterDay);

    return (
      <div id="timeline-top" className="space-y-8 motion-page-enter">
        {activeDays.map((day) => {
          const index = days.indexOf(day);
          const dayEvents = events.filter((item) => item.date === day).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          const isToday = tripIsActive && day === today;
          
          if (dayEvents.length === 0) {
            // Smart Collapse: Slim Row (max height 48px, keeps vertical line connection)
            return (
              <div 
                key={day} 
                id={`day-section-${day}`} 
                className="scroll-mt-[180px] relative flex items-center justify-between h-[48px] pl-1 py-1 group"
              >
                {/* Vertical line through marker */}
                <div className="absolute bottom-0 left-[21px] top-0 w-0.5 bg-slate-200/80 group-last:bg-transparent" />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  {/* Circle marker */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-extrabold border border-slate-200 text-[12px]">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#030D2E]">Ngày {index + 1}</span>
                    <span className="text-xs font-semibold text-slate-400">({formatDateShort(day)})</span>
                    {isToday && (
                      <span className="rounded-full bg-sunset-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-sunset-600 border border-sunset-100">
                        Hôm nay
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => openNewForm(day)}
                  className="relative z-10 text-[13px] font-bold text-[#00BFB7] hover:brightness-95 transition-colors pr-2 flex items-center gap-1 motion-press"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Thêm
                </button>
              </div>
            );
          }

          // Non-empty days: DayHeader + ActivityCards
          return (
            <div key={day} className="space-y-4">
              <DayHeader day={day} index={index} isToday={isToday} />
              <div className="px-1">
                {dayEvents.map((item, idx) => (
                  <ActivityCard 
                    key={item.id} 
                    item={item} 
                    onEdit={() => openEditForm(item)} 
                    onDelete={() => initiateDelete(item)}
                    isToday={isToday} 
                    isUpcoming={day > today} 
                    idx={idx}
                    backupCount={backupPlans.filter(p => p.activityId === item.id).length}
                    onOpenBackup={() => {
                      setBackupPlanCtx({ activityId: item.id, date: day });
                      setIsBackupPlansOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Undated fallback events */}
        {filterDay === "all" && undatedEvents.length > 0 && (
          <div key="undated" className="space-y-4">
            <div 
              id="day-section-undated"
              className="scroll-mt-[180px] sticky top-[115px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
            >
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
                  onDelete={() => initiateDelete(item)}
                  isToday={false} 
                  isUpcoming={false} 
                  idx={idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* Backup plans for all days */}
        {filterDay === "all" && backupPlans.filter(p => !p.activityId && !p.date).length > 0 && (
          <div key="backup" className="space-y-4">
            <div 
              id="day-section-backup"
              className="scroll-mt-[180px] sticky top-[115px] z-20 -mx-4 mb-4 flex items-center justify-between bg-[#FAF7F1]/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
            >
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

        {filterDay === "all" && (
          <div className="flex justify-center mt-6">
             <button
                onClick={() => { setBackupPlanCtx({}); setIsBackupPlansOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-kat-primary/30 text-kat-primary font-bold text-[14px] hover:bg-kat-primary/10 transition-colors motion-press"
             >
               <GitBranch className="w-4.5 h-4.5" />
               Thêm phương án dự phòng chuyến đi
             </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      
      {/* Sticky Header Block */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[#FAF7F1]/95 backdrop-blur-md border-b border-slate-200/50 mb-6 shadow-sm md:mx-0 md:px-0 md:rounded-b-2xl">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#030D2E] leading-none">Lịch trình</h2>
            <p className="hidden md:block mt-1 text-[13.5px] font-medium text-slate-500">
              Sắp xếp từng điểm dừng để hành trình rõ ràng và trọn vẹn hơn.
            </p>
          </div>
          
          {/* Desktop CTA docked in header */}
          <button
            onClick={() => openNewForm()}
            className="hidden md:flex items-center justify-center gap-1.5 rounded-xl bg-[#00BFB7] text-[#030D2E] px-4 py-2 text-[13.5px] font-extrabold shadow-sm hover:brightness-105 active:scale-95 transition-all h-10 motion-press"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Thêm lịch trình
          </button>
        </div>

        {/* Day Navigation Tabs selection bar */}
        {renderDayNav()}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start pb-0 md:pb-8">
        {/* Left Column: Timeline list */}
        <div className="space-y-8">
          {events.length === 0 ? (
            /* Compact Empty Timeline Card */
            <div id="timeline-top">
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
                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-[#00BFB7] px-4 py-2 text-[13px] font-bold text-[#030D2E] hover:brightness-105 transition-all motion-press"
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
        <div className="space-y-6 lg:sticky lg:top-[160px]">
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


      <EventForm
        tripId={trip.id!}
        tripDays={tripDays}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultDate={formDefaultDate}
        onSaved={handleEventSaved}
        onDelete={() => initiateDelete(editing!)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={executeDelete}
        title="Xóa mục lịch trình này?"
        itemName={eventToDelete?.title}
        description="Mục lịch trình này sẽ không còn xuất hiện trong lịch trình. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa mục lịch trình"
      />

      <BackupPlansSheet
        tripId={trip.id!}
        activityId={backupPlanCtx.activityId}
        date={backupPlanCtx.date}
        isOpen={isBackupPlansOpen}
        onClose={() => setIsBackupPlansOpen(false)}
      />

      {/* Grid Day Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isDayPickerOpen}
        onClose={() => setIsDayPickerOpen(false)}
        title="Chọn nhanh ngày lịch trình"
      >
        <div className="space-y-4">
          <p className="text-[13.5px] font-semibold text-slate-500 pb-1">
            Chọn một ngày cụ thể dưới đây để lọc xem chi tiết hoạt động hoặc chọn "Tất cả các ngày".
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none pb-4">
            {/* "Tất cả" button */}
            <button
              type="button"
              onClick={() => {
                selectDayFilter("all");
                setIsDayPickerOpen(false);
              }}
              className={classNames(
                "flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-200 active:scale-95 min-h-[72px] cursor-pointer",
                filterDay === "all"
                  ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
                  : "bg-[#FFFDF8] border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="text-[13.5px] font-extrabold">Tất cả các ngày</span>
              <span className={classNames(
                "text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full",
                filterDay === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {events.length} mục
              </span>
            </button>

            {/* Day buttons */}
            {days.map((day, idx) => {
              const hasEvents = events.some(e => e.date === day);
              const isActive = filterDay === day;
              const count = events.filter(e => e.date === day).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    selectDayFilter(day);
                    setIsDayPickerOpen(false);
                  }}
                  className={classNames(
                    "flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-200 active:scale-95 min-h-[72px] cursor-pointer",
                    isActive
                      ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
                      : "bg-[#FFFDF8] border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-[13.5px] font-extrabold">Ngày {idx + 1}</span>
                  <span className={classNames(
                    "text-[10.5px] font-medium mt-0.5",
                    isActive ? "text-slate-200" : "text-slate-400"
                  )}>
                    {formatDateShort(day)}
                  </span>
                  {hasEvents && (
                    <span className={classNames(
                      "text-[9px] font-black mt-1 px-1.5 py-0.2 rounded-full",
                      isActive ? "bg-white/20 text-white" : "bg-kat-primary/15 text-kat-primary"
                    )}>
                      {count} mục
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
