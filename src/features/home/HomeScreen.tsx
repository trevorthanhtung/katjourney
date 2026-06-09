import React from "react";
import { Backpack, BookOpen, CalendarDays, Clock, MapPin, WalletCards, Users, Briefcase, ChevronRight, Plus } from "lucide-react";
import { ChecklistItem, EventItem, Expense, Member, Trip } from "../../db";
import { formatDate, formatMoney, getChecklistStats, getPackingStats, getTripTiming, today } from "../../utils/helpers";
import { EmptyCard } from "../../components/ui";

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 active:scale-95 lg:hover:-translate-y-1 lg:hover:shadow-md w-full"
      onClick={onClick}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-emerald-700">{icon}</div>
      <span className="text-[14px] font-semibold text-slate-700">{label}</span>
    </button>
  );
}

export function HomeScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  totalExpense,
  perPerson,
  onNavigateTab,
  onNavigateMore
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  totalExpense: number;
  perPerson: number;
  onNavigateTab: (tab: "timeline" | "expenses") => void;
  onNavigateMore: (section: "journal" | "packing" | "members") => void;
}) {
  const timing = getTripTiming(trip);
  const checklistStats = getChecklistStats(checklist);
  const nextEvent =
    events.find((item) => !item.completed && item.date >= today) ??
    events.find((item) => !item.completed) ??
    events[0];

  const getEmotionalMessage = () => {
    if (timing.status === "upcoming") return "Chuyến đi sắp bắt đầu. Đừng quên kiểm tra hành lý.";
    if (timing.status === "active") return "Hôm nay có khoảnh khắc nào đáng nhớ?";
    return "Chuyến đi này đã trở thành một kỷ niệm đẹp.";
  };

  return (
    <div className="space-y-6">
      {/* Emotional Context Message */}
      <p className="text-[14px] font-medium text-emerald-800 text-center animate-fadeIn">
        {getEmotionalMessage()}
      </p>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-soft">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-emerald-100/90">
            {timing.status === "upcoming" ? "Sắp diễn ra" : timing.status === "active" ? "Đang diễn ra" : "Đã kết thúc"}
          </p>
          <h2 className="mt-4 text-[36px] font-bold leading-tight tracking-tight drop-shadow-sm">{trip.title}</h2>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/20">
              <MapPin className="h-4 w-4" />
              {trip.location || "Đang lên kế hoạch"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/20">
              <CalendarDays className="h-4 w-4" />
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
          </div>

          <div className="mt-8 flex w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 shadow-sm">
            <p className="text-[13px] font-medium uppercase tracking-wider text-emerald-100/80">
              {timing.status === "upcoming" ? "Đếm ngược" : timing.status === "active" ? "Tiến độ" : "Hành trình"}
            </p>
            <p className="mt-1 text-[28px] font-bold tracking-tight">{timing.label}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={<CalendarDays className="h-7 w-7" />} label="Lịch trình" onClick={() => onNavigateTab("timeline")} />
        <QuickAction icon={<WalletCards className="h-7 w-7" />} label="Chi phí" onClick={() => onNavigateTab("expenses")} />
        <QuickAction icon={<BookOpen className="h-7 w-7" />} label="Nhật ký" onClick={() => onNavigateMore("journal")} />
        <QuickAction icon={<Backpack className="h-7 w-7" />} label="Hành lý" onClick={() => onNavigateMore("packing")} />
      </section>

      {/* Desktop Responsive Split */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
        
        {/* Next Activity */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-bold text-slate-900 px-1">Hoạt động tiếp theo</h3>
          {nextEvent ? (
            <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer" onClick={() => onNavigateTab("timeline")}>
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-sunset-50 text-sunset-600">
                <span className="text-[11px] font-bold uppercase leading-none">{formatDate(nextEvent.date).split("/")[0]}</span>
                <span className="mt-1 text-[10px] font-semibold leading-none opacity-80">Tháng {formatDate(nextEvent.date).split("/")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                {nextEvent.time && (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sunset-600">
                    <Clock className="h-3.5 w-3.5" />
                    {nextEvent.time}
                  </p>
                )}
                <h4 className="mt-1 truncate text-lg font-bold text-slate-900">{nextEvent.title}</h4>
                {nextEvent.location && <p className="mt-0.5 truncate text-[14px] text-slate-500">{nextEvent.location}</p>}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <p className="text-[15px] font-medium text-slate-600">Cuộc phiêu lưu đang chờ bạn bắt đầu.</p>
              <button 
                onClick={() => onNavigateTab("timeline")}
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-[14px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Plus className="h-4 w-4" />
                Thêm hoạt động
              </button>
            </div>
          )}
        </section>

        {/* Trip Summary */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-bold text-slate-900 px-1">Tóm tắt chuyến đi</h3>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-500">Thành viên</p>
                  <p className="mt-0.5 text-[15px] font-bold text-slate-900 truncate">
                    {members.length > 0 ? `${members.length} người: ${members.map(m => m.name.split(' ')[0]).join(", ")}` : "Chưa có"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-500">Hành lý</p>
                  <p className="mt-0.5 text-[15px] font-bold text-slate-900">
                    {checklistStats.completed} / {checklistStats.total} món đã chuẩn bị
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-500">Tiếp theo</p>
                  <p className="mt-0.5 truncate text-[15px] font-bold text-slate-900">
                    {nextEvent ? nextEvent.title : "Chưa lên lịch"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-500">Đã chi</p>
                  <p className="mt-0.5 text-[15px] font-bold text-slate-900">{formatMoney(totalExpense)}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
