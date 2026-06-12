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
  Compass,
  Info,
  Wifi,
  ChevronRight,
  Map,
  X
} from "lucide-react";
import { db, EventItem, Trip } from "../../db";
import { classNames, daysBetween, formatDate, today } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, ScreenTitle, Textarea, Select } from "../../components/ui";

// Define categories for PWA Travel 2027
const ACTIVITY_CATEGORIES = [
  { id: "transport", label: "Di chuyển", icon: Plane, bgColor: "bg-blue-50 text-blue-600 border-blue-100", activeBg: "bg-blue-100 border-blue-400 text-blue-700" },
  { id: "dining", label: "Ăn uống", icon: Utensils, bgColor: "bg-rose-50 text-rose-600 border-rose-100", activeBg: "bg-rose-100 border-rose-400 text-rose-700" },
  { id: "sightseeing", label: "Tham quan", icon: Camera, bgColor: "bg-amber-50 text-amber-600 border-amber-100", activeBg: "bg-amber-100 border-amber-400 text-amber-700" },
  { id: "accommodation", label: "Lưu trú", icon: BedDouble, bgColor: "bg-slate-100 text-[#030D2E] border-slate-200", activeBg: "bg-[#030D2E]/10 border-[#030D2E] text-[#030D2E]" },
  { id: "relaxation", label: "Nghỉ ngơi", icon: Sparkles, bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100", activeBg: "bg-emerald-100 border-emerald-400 text-emerald-700" },
  { id: "shopping", label: "Mua sắm", icon: ShoppingBag, bgColor: "bg-purple-50 text-purple-600 border-purple-100", activeBg: "bg-purple-100 border-purple-400 text-purple-700" },
  { id: "other", label: "Khác", icon: CalendarDays, bgColor: "bg-slate-50 text-slate-600 border-slate-100", activeBg: "bg-slate-100 border-slate-400 text-slate-700" }
];

function getCategory(id?: string) {
  return ACTIVITY_CATEGORIES.find(c => c.id === id) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

function ActivityCard({ 
  item, 
  onEdit, 
  isToday, 
  isUpcoming 
}: { 
  item: EventItem; 
  onEdit: () => void; 
  isToday: boolean; 
  isUpcoming: boolean 
}) {
  const category = getCategory(item.type);
  const CatIcon = category.icon;
  
  const toggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.events.update(item.id!, { completed: !item.completed });
  };

  return (
    <article className="group relative flex gap-4 pl-1 mb-6 last:mb-2">
      {/* Timeline connector line */}
      <div className="absolute bottom-0 left-[21px] top-11 w-0.5 bg-slate-200/80 group-last:bg-transparent" />
      
      {/* Activity type icon serving as timeline marker (min 44x44px target) */}
      <div className="relative z-10 flex shrink-0">
        <button
          onClick={toggleComplete}
          className={classNames(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-4 ring-[#FAF7F1] transition-all duration-200 active:scale-90",
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
        className="min-w-0 flex-1 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md hover:border-slate-200 cursor-pointer active:scale-[0.99]"
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
  onClose 
}: { 
  tripId: number; 
  tripDays: string[]; 
  editing: EventItem | null; 
  isOpen: boolean; 
  onClose: () => void 
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
              date: tripDays.includes(today) ? today : (tripDays[0] || today)
            }
      );
    }
  }, [editing, isOpen, tripDays]);

  async function save() {
    if (!form.title.trim()) return;
    if (editing?.id) {
      await db.events.update(editing.id, { 
        ...form, 
        completed: editing.completed 
      });
      onClose();
    } else {
      await db.events.add({ 
        ...form, 
        tripId, 
        completed: false 
      });
      onClose();
    }
  }

  async function remove() {
    if (editing?.id && window.confirm("Xóa hoạt động này?\nHoạt động sẽ không còn xuất hiện trong lịch trình.")) {
      await db.events.delete(editing.id);
      onClose();
    }
  }

  const dateLabels = tripDays.reduce((acc, date, idx) => {
    acc[date] = `Ngày ${idx + 1} (${formatDate(date)})`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa hoạt động" : "Thêm hoạt động"}
    >
      <div className="space-y-5">
        {/* Title Input */}
        <Input 
          label="Tiêu đề *" 
          value={form.title} 
          onChange={(title) => setForm({ ...form, title })} 
          placeholder="VD: Ăn trưa tại quán địa phương" 
        />

        {/* Category Selector Grid */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Loại hoạt động</span>
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
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center h-[64px] active:scale-95",
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
          {tripDays.length > 0 ? (
            <Select
              label="Chọn Ngày"
              value={form.date}
              onChange={(date) => setForm({ ...form, date })}
              options={tripDays}
              labels={dateLabels}
            />
          ) : (
            <Input 
              label="Ngày (YYYY-MM-DD)" 
              value={form.date} 
              onChange={(date) => setForm({ ...form, date })} 
            />
          )}
          
          <Input 
            label="Giờ (không bắt buộc)" 
            type="time" 
            value={form.time} 
            onChange={(time) => setForm({ ...form, time })} 
          />
        </div>

        {/* Location and Map link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Địa điểm" 
            value={form.location} 
            onChange={(location) => setForm({ ...form, location })} 
            placeholder="VD: Bãi Trước, Vũng Tàu" 
          />
          <Input 
            label="Link Google Maps" 
            value={form.mapLink} 
            onChange={(mapLink) => setForm({ ...form, mapLink })} 
            placeholder="https://maps.google.com/..." 
          />
        </div>

        {/* Notes */}
        <Textarea 
          label="Ghi chú & mã đặt chỗ" 
          value={form.notes} 
          onChange={(notes) => setForm({ ...form, notes })} 
          placeholder="Lưu ý quan trọng, mã phòng, số điện thoại liên hệ..." 
        />

        {/* Form buttons */}
        <div className="pt-2 flex flex-col gap-3">
          <FormActions 
            onSave={save} 
            saveLabel={editing ? "Lưu thay đổi" : "Thêm vào lịch trình"} 
            onCancel={onClose}
          />
          
          {editing && (
            <button
              onClick={remove}
              className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-rose-50 border border-rose-200 px-6 font-bold text-rose-600 transition-colors hover:bg-rose-100 active:scale-95"
            >
              <Trash2 className="h-5 w-5" />
              Xóa hoạt động này
            </button>
          )}
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
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="w-full sm:w-auto">
          <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Lịch trình</h2>
          <p className="mt-1 text-[15px] font-medium text-slate-500">Từng điểm dừng nhỏ làm nên một hành trình trọn vẹn.</p>
          {/* Mobile CTA */}
          <button
            onClick={openNewForm}
            className="flex md:hidden items-center justify-center gap-2 w-full mt-3.5 h-[46px] rounded-2xl bg-[#00BFB7] text-[#030D2E] text-[14px] font-bold shadow-sm active:scale-98 transition-all duration-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Thêm hoạt động
          </button>
        </div>
        <div>
          {/* Desktop CTA */}
          <button
            onClick={openNewForm}
            className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-5 text-[14px] font-bold text-kat-text shadow-sm hover:bg-kat-primary/20 active:scale-98 transition-all duration-200 h-[48px]"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
            Thêm hoạt động
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start pb-8">
        {/* Left Column: Timeline list */}
        <div className="space-y-8">
          {events.length === 0 ? (
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
                <div className="min-w-0 flex-1 rounded-[24px] bg-kat-surface p-6 border border-kat-border/60 shadow-soft animate-fadeIn">
                  <h4 className="text-[15px] font-bold text-kat-text">Chưa có hoạt động nào</h4>
                  <p className="mt-1 text-[13.5px] text-kat-muted font-medium">Thêm điểm đến, giờ di chuyển hoặc việc cần làm để chuyến đi rõ ràng hơn.</p>
                  <button 
                    onClick={openNewForm}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-4 py-2 text-[13px] font-bold text-kat-text hover:bg-kat-primary/20 transition-all duration-200 active:scale-98"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Thêm hoạt động đầu tiên
                  </button>
                </div>
              </div>
            </div>
          ) : (
            (days.length ? days : [today]).map((day, index) => {
              const dayEvents = events.filter((item) => item.date === day).sort((a, b) => a.time.localeCompare(b.time));
              if (dayEvents.length === 0) return null;
              
              const isToday = tripIsActive && day === today;
              
              return (
                <div key={day}>
                  <DayHeader day={day} index={index} isToday={isToday} />
                  <div className="px-1">
                    {dayEvents.map((item) => (
                      <ActivityCard 
                        key={item.id} 
                        item={item} 
                        onEdit={() => openEditForm(item)} 
                        isToday={isToday} 
                        isUpcoming={day > today} 
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Dynamic smart widgets */}
        <div className="space-y-6 lg:sticky lg:top-[90px]">
          {/* Mini Trip Context Card */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                <Compass className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-[#030D2E]">Thông tin hành trình</h4>
            </div>
            
            <div className="space-y-3 text-[14px] font-medium text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Điểm đến</span>
                <span className="font-bold text-[#030D2E]">{trip.location || "Chưa xác định"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Thời gian</span>
                <span className="font-bold text-[#030D2E]">
                  {trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Hoạt động</span>
                <span className="font-bold text-[#030D2E]">{events.length} sự kiện</span>
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
                "Chuyến đi chưa có hoạt động nào. Hãy bắt đầu bằng cách thêm địa điểm lưu trú hoặc giờ xuất phát của bạn!"
              ) : !events.some(e => e.type === "dining") ? (
                "Mẹo: Bạn chưa thêm hoạt động Ăn uống nào. Hãy thêm các quán ngon địa phương muốn thử để không bỏ lỡ ẩm thực!"
              ) : !events.some(e => e.mapLink) ? (
                "Mẹo: Thêm link Google Maps cho các điểm tham quan để tra cứu đường đi siêu tốc kể cả khi đang di chuyển."
              ) : (
                "Lịch trình của bạn trông rất ổn! Đừng quên dành 1-2 tiếng nghỉ ngơi tự do giữa các điểm tham quan."
              )}
            </div>

            {/* Travel Tips List */}
            <div className="space-y-3 pt-2">
              <h5 className="text-[12.5px] font-black uppercase tracking-wider text-slate-400">Gợi ý hữu ích</h5>
              <ul className="space-y-3 text-[13.5px] font-medium text-slate-600">
                <li className="flex gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-kat-primary shrink-0 mt-2" />
                  <span>Nên chừa 30–45 phút giữa các hoạt động để tránh cập rập.</span>
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
      />
    </div>
  );
}
