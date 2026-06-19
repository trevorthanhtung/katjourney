import React, { useEffect, useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CheckIcon, 
  Cancel01Icon, 
  Location01Icon, 
  Add01Icon, 
  Calendar01Icon, 
  Delete01Icon, 
  Clock01Icon, 
  Route01Icon, 
  MapPinned, 
  ChevronRightIcon, 
  MapsIcon, 
  ChevronDownIcon, 
  MoreVerticalIcon, 
  PencilEdit01Icon, 
  StickyNote01Icon, 
  TextIcon, 
  GitBranchIcon, 
  Dish01Icon, 
  Camera01Icon, 
  HotelIcon, 
  Coffee01Icon, 
  ShoppingBag01Icon, 
  MoreHorizontalCircle01Icon 
} from "@hugeicons/core-free-icons";
import { db, EventItem, Trip, Expense } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { classNames, formatDate, formatMoney, getTripTiming, formatDateShort, daysBetween, today } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, Textarea, Select, TimePicker, DeleteConfirmModal } from "../../components/ui";
import { BackupPlansSheet } from "./BackupPlansSheet";
import { TimelineCalendarView } from "./TimelineCalendarView";
import { getEmbedMapUrl } from "../../utils/mapUtils";
import { WeatherWidget } from "./WeatherWidget";
import { useModalHistory } from "../../hooks/useModalHistory";

// Define categories for PWA Travel 2027
const ACTIVITY_CATEGORIES = [
  { id: "transport", label: "Di chuyển", icon: Route01Icon, bgColor: "bg-blue-50 text-blue-600 border-blue-100", activeBg: "bg-blue-100 border-blue-400 text-blue-700" },
  { id: "dining", label: "Ăn uống", icon: Dish01Icon, bgColor: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-100 border-rose-400 text-rose-700" },
  { id: "sightseeing", label: "Tham quan", icon: Camera01Icon, bgColor: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-100 border-amber-400 text-amber-700" },
  { id: "accommodation", label: "Lưu trú", icon: HotelIcon, bgColor: "bg-slate-100 text-kat-dark border-slate-200", activeBg: "bg-kat-dark/10 border-kat-dark text-kat-dark" },
  { id: "relaxation", label: "Nghỉ ngơi", icon: Coffee01Icon, bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-100 border-emerald-400 text-emerald-700" },
  { id: "shopping", label: "Mua sắm", icon: ShoppingBag01Icon, bgColor: "bg-purple-50 text-purple-600 border-purple-100", activeBg: "bg-purple-100 border-purple-400 text-purple-700" },
  { id: "other", label: "Khác", icon: MoreHorizontalCircle01Icon, bgColor: "bg-slate-50 text-slate-600 border-slate-100", activeBg: "bg-slate-100 border-slate-400 text-slate-700" }
];

function getCategory(id?: string) {
  return ACTIVITY_CATEGORIES.find(c => c.id === id) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}



const ActivityCard = React.memo(function ActivityCard({ 
  item, 
  onEdit, 
  isToday, 
  isUpcoming,
  idx = 0,
  backupCount,
  linkedExpenses,
  onOpenBackup,
  onDelete,
  onAddExpense
}: { 
  item: EventItem; 
  onEdit: () => void; 
  isToday: boolean; 
  isUpcoming: boolean;
  idx?: number;
  backupCount?: number;
  linkedExpenses?: Expense[];
  onOpenBackup?: () => void;
  onDelete: () => void;
  onAddExpense?: () => void;
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
            <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
          ) : (
            <HugeiconsIcon icon={CatIcon} className="h-5 w-5" />
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
                  <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3 shrink-0" />
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
              "text-[17px] font-extrabold text-kat-dark leading-tight", 
              item.completed && "text-slate-400 line-through decoration-slate-300"
            )}>
              {item.title}
            </h3>

            {/* Location */}
            {item.location && (
              <p className="mt-2 flex items-start gap-1 text-[14px] font-medium text-slate-600">
                <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                <span className="truncate">{item.location}</span>
              </p>
            )}

            {/* Notes */}
            {item.notes && (
              <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-medium">
                {item.notes}
              </p>
            )}

            {/* Google Maps link & Embed */}
            {(item.mapLink || item.location) && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                {getEmbedMapUrl(item.mapLink || item.location || "", item.location) && (
                  <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 relative min-h-[160px]">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <span className="text-[12px] font-medium animate-pulse">Đang tải bản đồ...</span>
                    </div>
                    <iframe
                      title="Google Maps Embed"
                      width="100%"
                      height="160"
                      className="border-0 relative z-10"
                      loading="lazy"
                      allowFullScreen
                      src={getEmbedMapUrl(item.mapLink || item.location || "", item.location)}
                    ></iframe>
                  </div>
                )}
                {(() => {
                  const isRoute = item.mapLink && (item.mapLink.includes("/maps/dir/") || item.mapLink.includes("maps/dir"));
                  return (
                    <a 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[13px] font-bold text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors" 
                      href={item.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || "")}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      {isRoute ? <HugeiconsIcon icon={Route01Icon} className="w-3.5 h-3.5" /> : <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />}
                      {isRoute ? "Xem lộ trình di chuyển " : "Mở bằng ứng dụng Google Maps "}
                      &rarr;
                    </a>
                  );
                })()}
              </div>
            )}

            {/* Backup Plans Badge */}
            <div className="mt-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenBackup?.(); }}
                className={classNames(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-colors motion-press",
                  backupCount && backupCount > 0 
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <HugeiconsIcon icon={GitBranchIcon} className="w-3.5 h-3.5" />
                {backupCount && backupCount > 0 ? `${backupCount} phương án dự phòng` : "Thêm phương án dự phòng"}
              </button>
            </div>

            {/* Expenses Linked */}
            {(linkedExpenses && linkedExpenses.length > 0 || onAddExpense) && (
              <div className="mt-4 border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {linkedExpenses?.map(exp => (
                  <div key={exp.id} className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 text-[12px] rounded-lg border border-rose-200 shadow-sm">
                    <span className="font-extrabold">{new Intl.NumberFormat('vi-VN').format(exp.amount)}đ</span>
                    <span className="text-rose-600 truncate max-w-[120px] font-medium">- {exp.description || exp.category}</span>
                  </div>
                ))}
                {onAddExpense && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddExpense(); }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[12px] font-bold transition-colors"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                    Thêm chi phí
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

function DayHeader({ 
  day, 
  index, 
  isToday, 
  totalExpense = 0,
  mapUrl
}: { 
  day: string; 
  index: number; 
  isToday: boolean; 
  totalExpense?: number;
  mapUrl?: string;
}) {
  return (
    <div 
      id={`day-section-${day}`} 
      className="scroll-mt-[110px] md:scroll-mt-[120px] sticky top-[var(--sticky-header-offset,60px)] md:top-[var(--sticky-header-offset-md,68px)] transition-[top] duration-300 ease-in-out z-20 -mx-4 mb-4 flex items-center justify-between bg-slate-50/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-dark text-white font-black text-[14px] shadow-sm">
          {index + 1}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[16px] font-extrabold text-kat-dark">Ngày {index + 1}</h4>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/50 text-[11px] font-extrabold tracking-wide transition-all active:scale-95 shadow-sm"
                title="Mở bản đồ lộ trình"
              >
                <HugeiconsIcon icon={Location01Icon} className="w-3 h-3 text-emerald-600" />
                <span>Bản đồ</span>
              </a>
            )}
          </div>
          <p className="text-[13px] font-semibold text-slate-500">{formatDate(day)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {totalExpense > 0 && (
          <span className="text-[12.5px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
            Đã chi: {new Intl.NumberFormat('vi-VN').format(totalExpense)}đ
          </span>
        )}
        {isToday && (
          <span className="rounded-full bg-sunset-100 px-3 py-1 text-[10.5px] font-black uppercase tracking-widest text-sunset-700 shadow-inner">
            Hôm nay
          </span>
        )}
      </div>
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

  // Tránh reset form khi đang nhập mà parent component render lại
  const editingId = editing?.id;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

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
        <div className="flex items-center gap-2.5 w-full">
          {editing && (
            <button
              type="button"
              onClick={onDelete}
              title="Xóa mục lịch trình"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 transition-colors hover:bg-rose-100 active:scale-[0.96] motion-press"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-5 w-5" />
            </button>
          )}
          
          <button
            type="button"
            onClick={onClose}
            className="flex h-[52px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.96] transition-all motion-press"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={save}
            disabled={!form.title.trim()}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark text-white px-6 font-black shadow-sm hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed motion-press"
          >
            <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
            {editing ? "Lưu thông tin" : "Thêm mục lịch trình"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
      {/* Title Input */}
      <Input 
        label={
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={TextIcon} className="h-4 w-4 text-slate-500" />
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
                <HugeiconsIcon icon={Icon} className="h-5 w-5" />
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
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
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
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
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
        
        <TimePicker 
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4 text-slate-500" />
                Giờ khởi hành / thời gian
              </span>
            } 
            value={form.time} 
            onChange={(time) => setForm({ ...form, time })} 
          />
      </div>

      {/* Location and Map link */}
      <div className="flex flex-col gap-4">
        <Input 
          label={
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-500" />
                Địa điểm
              </span>
              <span className="text-xs font-normal text-slate-400">
                Nhập tên địa điểm, hệ thống sẽ tự động tìm kiếm trên Google Maps.
              </span>
            </span>
          } 
          value={form.location} 
          onChange={(location) => setForm({ ...form, location })} 
          placeholder="VD: Bãi Trước, Vũng Tàu" 
        />
        <Input 
          label={
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={MapsIcon} className="h-4 w-4 text-slate-500" />
                Link bản đồ Google Maps
              </span>
              <span className="text-xs font-normal text-slate-400">
                Dán link địa điểm từ Google Maps. Dùng để hiển thị vị trí chính xác nếu tên địa điểm không tự tìm được.
              </span>
            </span>
          } 
          value={form.mapLink} 
          onChange={(mapLink) => setForm({ ...form, mapLink })} 
          placeholder="VD: https://www.google.com/maps/dir/..." 
        />
        {form.mapLink && (
          <div className="mt-1 flex justify-end">
            <a
              href={form.mapLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />
              Mở link kiểm tra &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Notes */}
      <Textarea 
        label={
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={StickyNote01Icon} className="h-4 w-4 text-slate-500" />
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
export function TimelineScreen({ trip, events, expenses = [], onAddExpense, isReadOnly }: { trip: Trip; events: EventItem[]; expenses?: Expense[]; onAddExpense?: (date: string, eventId: number) => void; isReadOnly?: boolean }) {
  const tripDays = daysBetween(trip.startDate, trip.endDate);
  const eventDays = Array.from(new Set(events.map((e) => e.date)));
  const days = Array.from(new Set([...tripDays, ...eventDays])).filter(Boolean).sort();
  const tripIsActive = today >= trip.startDate && today <= trip.endDate;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string>("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  const [isBackupPlansOpen, setIsBackupPlansOpen] = useState(false);
  const [backupPlanCtx, setBackupPlanCtx] = useState<{ activityId?: number; date?: string }>({});

  const [selectedRoadmapDay, setSelectedRoadmapDay] = useState<string>("");
  const [isRoadmapFormOpen, setIsRoadmapFormOpen] = useState(false);
  const [isRoadmapDayPickerOpen, setIsRoadmapDayPickerOpen] = useState(false);
  const [roadmapEditDay, setRoadmapEditDay] = useState<string>("");
  const [roadmapInputLink, setRoadmapInputLink] = useState("");

  useEffect(() => {
    if (days.length > 0 && !selectedRoadmapDay) {
      setSelectedRoadmapDay(days[0]);
    }
  }, [days, selectedRoadmapDay]);

  const handleSaveRoadmap = async () => {
    if (!roadmapEditDay) return;
    const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
    if (roadmapInputLink.trim()) {
      currentRoadmaps[roadmapEditDay] = roadmapInputLink.trim();
    } else {
      delete currentRoadmaps[roadmapEditDay];
    }
    await db.trips.update(trip.id!, { dayRoadmaps: currentRoadmaps });
    if (trip.shareToken) {
      const { updateSharedTripRoadmaps } = await import("../../services/sharedTripEditService");
      await updateSharedTripRoadmaps(trip.shareToken, currentRoadmaps);
    }
    setIsRoadmapFormOpen(false);
  };

  useModalHistory(isFormOpen, () => {
    setIsFormOpen(false);
    setEditing(null);
  }, "activity-form-modal");

  useModalHistory(isBackupPlansOpen, () => {
    setIsBackupPlansOpen(false);
    setBackupPlanCtx({});
  }, "backup-plans-modal");

  useModalHistory(isDeleteConfirmOpen, () => {
    setIsDeleteConfirmOpen(false);
    setEventToDelete(null);
  }, "delete-event-confirm");

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const backupPlans = useLiveQuery(async () => (await db.backupPlans.where("tripId").equals(trip.id!).toArray()).filter(p => !p.isDeleted), [trip.id]) ?? [];
  const isScrollingRef = useRef(false);

  // Default selected day calculations on mount or trip bounds change
  useEffect(() => {
    const isTodayInTrip = days.includes(today);

    if (isTodayInTrip) {
      setTimeout(() => {
        const element = document.getElementById(`day-section-${today}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, [trip.startDate, trip.endDate]);

  const scrollToDay = (day: string) => {
    const element = document.getElementById(`day-section-${day}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  function openNewForm(defaultDateVal?: string) {
    setEditing(null);
    if (defaultDateVal) {
      setFormDefaultDate(defaultDateVal);
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
    await db.events.update(eventToDelete.id, { isDeleted: true });
    setIsDeleteConfirmOpen(false);
    setEventToDelete(null);
    setIsFormOpen(false);
  }

  const handleEventSaved = (date: string) => {
    if (date) {
      setTimeout(() => scrollToDay(date), 100);
    }
  };

  const undatedEvents = events.filter(e => !e.date);

  const renderTimeline = () => {
    const activeDays = days;

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
                    <span className="text-sm font-extrabold text-kat-dark">Ngày {index + 1}</span>
                    <span className="text-xs font-semibold text-slate-400">({formatDateShort(day)})</span>
                    {isToday && (
                      <span className="rounded-full bg-sunset-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-sunset-600 border border-sunset-100">
                        Hôm nay
                      </span>
                    )}
                  </div>
                </div>
                
                {!isReadOnly && (
                  <button 
                    type="button"
                    onClick={() => openNewForm(day)}
                    className="relative z-10 text-[13px] font-bold text-kat-teal hover:brightness-95 transition-colors pr-2 flex items-center gap-1 motion-press"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                    Thêm
                  </button>
                )}
              </div>
            );
          }

          // Non-empty days: DayHeader + ActivityCards
          const dayExpenses = expenses.filter(exp => exp.date === day);
          const totalDayExpense = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

          return (
            <div key={day} className="space-y-4">
              <DayHeader day={day} index={index} isToday={isToday} totalExpense={totalDayExpense} mapUrl={trip.dayRoadmaps?.[day]} />
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
                    linkedExpenses={expenses.filter(exp => String(exp.eventId) === String(item.id))}
                    onAddExpense={onAddExpense ? () => onAddExpense(day, item.id!) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Undated fallback events */}
        {undatedEvents.length > 0 && (
          <div key="undated" className="space-y-4">
            <div 
              id="day-section-undated"
              className="scroll-mt-[110px] md:scroll-mt-[120px] sticky top-[var(--sticky-header-offset,60px)] md:top-[var(--sticky-header-offset-md,68px)] transition-[top] duration-300 ease-in-out z-20 -mx-4 mb-4 flex items-center justify-between bg-slate-50/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-white font-black text-[14px] shadow-sm">
                  ?
                </div>
                <div>
                  <h4 className="text-[16px] font-extrabold text-kat-dark">Chưa phân ngày</h4>
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
        {backupPlans.filter(p => !p.activityId && !p.date).length > 0 && (
          <div key="backup" className="space-y-4">
            <div 
              id="day-section-backup"
              className="scroll-mt-[110px] md:scroll-mt-[120px] sticky top-[var(--sticky-header-offset,60px)] md:top-[var(--sticky-header-offset-md,68px)] transition-[top] duration-300 ease-in-out z-20 -mx-4 mb-4 flex items-center justify-between bg-slate-50/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-black text-[14px] shadow-sm">
                  <HugeiconsIcon icon={GitBranchIcon} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[16px] font-extrabold text-kat-dark">Dự phòng chung</h4>
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

        {!isReadOnly && (
          <div className="flex justify-center mt-6">
             <button
                onClick={() => { setBackupPlanCtx({}); setIsBackupPlansOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-indigo-200 text-indigo-600 font-bold text-[14px] hover:bg-indigo-50 transition-colors motion-press"
             >
               <HugeiconsIcon icon={GitBranchIcon} className="w-4.5 h-4.5" />
               Thêm phương án dự phòng chuyến đi
             </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[32px] font-black tracking-tight text-kat-dark">Lịch trình</h2>
          <p className="mt-1 text-[15px] font-bold text-slate-500">
            Sắp xếp từng điểm dừng để hành trình rõ ràng và trọn vẹn hơn.
          </p>
        </div>
        
        <div className="flex items-center justify-center w-full sm:w-auto gap-3">
          <div className="flex bg-[#E8E1D8]/40 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("list")}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all motion-press",
                viewMode === "list" ? "bg-white text-kat-dark shadow-sm" : "text-slate-500 hover:text-kat-dark"
              )}
            >
              Danh sách
            </button>
            <button 
              onClick={() => setViewMode("calendar")}
              className={classNames(
                "flex items-center justify-center w-9 h-8 rounded-lg transition-all motion-press",
                viewMode === "calendar" ? "bg-white text-kat-dark shadow-sm" : "text-slate-500 hover:text-kat-dark"
              )}
              aria-label="Xem dạng lịch"
            >
              <HugeiconsIcon icon={Calendar01Icon} className="h-4.5 w-4.5" />
            </button>
          </div>
          
          {!isReadOnly && (
            <button 
              onClick={() => openNewForm()}
              className="hidden md:flex items-center justify-center gap-1.5 rounded-xl bg-kat-dark text-white px-4 py-2 text-[13.5px] font-extrabold shadow-[0_4px_14px_rgba(3,13,46,0.18)] hover:bg-kat-dark bg-opacity-90 active:scale-95 transition-all h-10 motion-press"
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
              Thêm lịch trình
            </button>
          )}
        </div>
      </div>



      {/* Global Add FAB (Mobile only) */}
      {!isReadOnly && (
        <button
          onClick={() => openNewForm()}
          className="md:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-2xl border border-white/40 text-kat-dark shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label="Thêm lịch trình"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start pb-0 md:pb-8">
        {/* Left Column: Timeline list */}
        <div className="space-y-8">
          {events.length === 0 && viewMode === "list" ? (
            /* Compact Empty Timeline Card */
            <div id="timeline-top">
              <DayHeader day={trip.startDate} index={0} isToday={tripIsActive && trip.startDate === today} mapUrl={trip.dayRoadmaps?.[trip.startDate]} />
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
                    <HugeiconsIcon icon={Location01Icon} className="h-6 w-6" />
                  </div>
                  <h4 className="text-[15px] font-bold text-kat-text">Chưa có mục lịch trình nào</h4>
                  <p className="mt-1 text-[13.5px] text-kat-muted font-medium max-w-sm">Thêm điểm đến, thời gian di chuyển hoặc việc cần làm để hành trình rõ ràng hơn.</p>
                </div>
              </div>
            </div>
          ) : viewMode === "calendar" ? (
            <TimelineCalendarView 
              events={events} 
              trip={trip} 
              onOpenNewForm={openNewForm}
              renderActivityCard={(item, idx) => (
                <ActivityCard 
                  key={item.id} 
                  item={item} 
                  onEdit={() => openEditForm(item)} 
                  onDelete={() => initiateDelete(item)}
                  isToday={item.date === today} 
                  isUpcoming={(item.date || "") > today} 
                  idx={idx}
                  backupCount={backupPlans.filter(p => p.activityId === item.id).length}
                  onOpenBackup={() => {
                    setBackupPlanCtx({ activityId: item.id, date: item.date });
                    setIsBackupPlansOpen(true);
                  }}
                  linkedExpenses={expenses.filter(exp => String(exp.eventId) === String(item.id))}
                  onAddExpense={onAddExpense && item.date ? () => onAddExpense(item.date!, item.id!) : undefined}
                />
              )}
            />
          ) : (
            renderTimeline()
          )}
        </div>

        {/* Right Column: Dynamic smart widgets */}
        <div className="space-y-6">
          {/* Roadmap Widget */}
          {days.length > 0 && (
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <HugeiconsIcon icon={Route01Icon} className="h-4 w-4" />
                </span>
                <h4 className="text-[15px] font-extrabold text-kat-dark">Lộ trình di chuyển</h4>
              </div>

              {/* Day selector custom pill */}
              {days.length > 1 && (
                <div className="pt-1 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsRoadmapDayPickerOpen(true)}
                    className="w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/60 transition-all hover:border-emerald-200 hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[14px] bg-white shadow-sm flex items-center justify-center text-emerald-600">
                        <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10.5px] font-bold text-emerald-600/70 uppercase tracking-wide mb-0.5">
                          Ngày đang xem
                        </div>
                        <div className="text-[14.5px] font-extrabold text-kat-dark">
                          {selectedRoadmapDay ? `Ngày ${days.indexOf(selectedRoadmapDay) + 1} (${formatDateShort(selectedRoadmapDay)})` : "Chọn ngày"}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-105">
                      <HugeiconsIcon icon={ChevronDownIcon} className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}

              {/* Roadmap details for selected day */}
              {(() => {
                const dayIndex = days.indexOf(selectedRoadmapDay);
                const dateLabel = selectedRoadmapDay ? formatDateShort(selectedRoadmapDay) : "";
                const manualMapUrl = trip.dayRoadmaps?.[selectedRoadmapDay] || "";
                // Fallback: lấy mapLink từ activity "Di chuyển" trong ngày này
                const dayActivities = events.filter(e => e.date === selectedRoadmapDay);
                const travelActivity = dayActivities.find(e => e.mapLink && (e.type === 'Di chuyển' || e.type === 'travel'));
                const fallbackActivity = !travelActivity ? dayActivities.find(e => e.mapLink) : null;
                const autoMapUrl = (travelActivity || fallbackActivity)?.mapLink || "";
                const mapUrl = manualMapUrl || autoMapUrl;
                const isAuto = !manualMapUrl && !!autoMapUrl;
                const isRoute = mapUrl && (mapUrl.includes("/maps/dir/") || mapUrl.includes("maps/dir"));

                return (
                  <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400">
                      <span>Ngày {dayIndex + 1} ({dateLabel})</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setRoadmapInputLink(mapUrl);
                            setRoadmapEditDay(selectedRoadmapDay);
                            setIsRoadmapFormOpen(true);
                          }}
                          className="text-kat-teal hover:opacity-85 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {mapUrl && <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />}
                          {mapUrl ? "Sửa" : "Thêm"}
                        </button>
                      )}
                    </div>

                    {mapUrl ? (
                      <div className="space-y-2.5">
                        <p className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5 flex-wrap">
                          {isRoute ? "Đã có link lộ trình cho ngày này." : "Đã liên kết bản đồ cho ngày này."}
                          {isAuto && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[10.5px] font-bold text-sky-500">
                              Từ lịch trình
                            </span>
                          )}
                        </p>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[13.5px] shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Route01Icon} className="w-4 h-4" />
                          Mở lộ trình &rarr;
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[12.5px] font-semibold text-slate-400">Chưa có lộ trình ngày này</p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoadmapInputLink("");
                              setRoadmapEditDay(selectedRoadmapDay);
                              setIsRoadmapFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-600 shadow-sm transition-all cursor-pointer"
                          >
                            <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                            Gắn link lộ trình
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <WeatherWidget destination={trip.location} latitude={trip.latitude} longitude={trip.longitude} days={tripDays.length} startDate={trip.startDate} />

          {/* Mini Trip Context Card */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                <HugeiconsIcon icon={Route01Icon} className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-kat-dark">Thông tin hành trình</h4>
            </div>
            
            <div className="space-y-3 text-[14px] font-medium text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-400" />
                  Điểm đến
                </span>
                <span className="font-bold text-kat-dark">{trip.location || "Chưa xác định"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                  Thời gian
                </span>
                <span className="font-bold text-kat-dark">
                  {trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-slate-400" />
                  Mục lịch trình
                </span>
                <span className="font-bold text-kat-dark">{events.length} mục</span>
              </div>
            </div>
          </div>
          
          {/* Gợi ý hành trình has been replaced by the redesigned WeatherWidget above */}
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

      {/* Roadmap Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapFormOpen}
        onClose={() => setIsRoadmapFormOpen(false)}
        title={`Lộ trình di chuyển - Ngày ${days.indexOf(roadmapEditDay) + 1}`}
      >
        <div className="space-y-5 pb-4">
          
          {/* Instruction card */}
          <div className="flex items-start gap-3 bg-kat-primary-soft border border-kat-teal border-opacity-20 rounded-2xl px-4 py-3">
            <HugeiconsIcon icon={Route01Icon} className="h-5 w-5 text-kat-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-kat-dark">Dán link lộ trình Google Maps</p>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Vào Google Maps → chọn điểm đầu/cuối → nhấn <strong>Đường đi</strong> → sao chép link trên thanh địa chỉ.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-kat-teal" />
            </div>
            <input
              type="url"
              value={roadmapInputLink}
              onChange={e => setRoadmapInputLink(e.target.value)}
              onPaste={e => {
                const pasted = e.clipboardData.getData("text").trim();
                if (pasted && pasted.startsWith("http")) {
                  // Đặt giá trị rồi auto-save sau 1 tick để state kịp cập nhật
                  setTimeout(async () => {
                    if (!roadmapEditDay) return;
                    const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
                    currentRoadmaps[roadmapEditDay] = pasted;
                    await db.trips.update(trip.id!, { dayRoadmaps: currentRoadmaps });
                    if (trip.shareToken) {
                      const { updateSharedTripRoadmaps } = await import("../../services/sharedTripEditService");
                      await updateSharedTripRoadmaps(trip.shareToken, currentRoadmaps);
                    }
                    setIsRoadmapFormOpen(false);
                  }, 50);
                }
              }}
              placeholder="https://www.google.com/maps/dir/..."
              className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[14px] font-semibold text-kat-dark placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:border-kat-teal focus:ring-2 focus:ring-kat-teal/15 transition-all duration-200"
            />
          </div>

          {/* Test link button – only show when there's input */}
          {roadmapInputLink.trim() && (
            <a
              href={roadmapInputLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[13.5px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <HugeiconsIcon icon={MapsIcon} className="w-4 h-4" />
              Mở link kiểm tra &rarr;
            </a>
          )}

          <FormActions
            onCancel={() => setIsRoadmapFormOpen(false)}
            onSave={handleSaveRoadmap}
            saveLabel="Lưu lộ trình"
          />
        </div>
      </BottomSheet>

      {/* Custom Roadmap Day Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapDayPickerOpen}
        onClose={() => setIsRoadmapDayPickerOpen(false)}
        title="Chọn ngày lộ trình"
      >
        <div className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
          {days.map((day, idx) => {
            const isSelected = selectedRoadmapDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedRoadmapDay(day);
                  setIsRoadmapDayPickerOpen(false);
                }}
                className={classNames(
                  "w-full flex items-center justify-between p-4 rounded-[16px] transition-all duration-200 active:scale-[0.98]",
                  isSelected 
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm" 
                    : "bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={classNames(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors",
                    isSelected ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <div className={classNames(
                      "text-[15px] font-extrabold",
                      isSelected ? "text-emerald-900" : "text-kat-dark"
                    )}>
                      Ngày {idx + 1}
                    </div>
                    <div className="text-[12.5px] font-medium text-slate-500 mt-0.5">
                      {formatDate(day)}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <HugeiconsIcon icon={CheckIcon} className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>


    </div>
  );
}
