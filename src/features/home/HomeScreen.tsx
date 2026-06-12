import React from "react";
import { Backpack, BookOpen, CalendarDays, Clock, MapPin, WalletCards, Users, Briefcase, ChevronRight, Plus, Globe } from "lucide-react";
import { ChecklistItem, EventItem, Expense, Member, Trip } from "../../db";
import { formatDate, formatMoney, getChecklistStats, getPackingStats, getTripTiming, today } from "../../utils/helpers";
import { EmptyCard } from "../../components/ui";

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center justify-center gap-2.5 rounded-[20px] bg-white p-5 shadow-sm border border-slate-100 transition-all duration-300 active:scale-95 md:hover:-translate-y-1 md:hover:shadow-md md:hover:border-kat-primary/30 w-full"
      onClick={onClick}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">{icon}</div>
      <span className="text-[14px] font-bold text-slate-700">{label}</span>
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
  onNavigateTab: (tab: "timeline" | "expenses" | "checklist") => void;
  onNavigateMore: (section: "journal" | "packing" | "members") => void;
}) {
  const timing = getTripTiming(trip);
  const checklistStats = getChecklistStats(checklist);
  const nextEvent =
    events.find((item) => !item.completed && item.date >= today) ??
    events.find((item) => !item.completed) ??
    events[0];

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  let durationText = "Đi trong ngày";
  if (!isDayTrip) {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      durationText = `${diffDays} ngày ${diffNights} đêm`;
    } catch {
      durationText = "Dài ngày";
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden rounded-[32px] p-6 pt-8 md:p-8 md:px-10 text-white shadow-soft"
        style={{ background: "linear-gradient(135deg, #030D2E 0%, #003D4A 60%, #007C78 100%)" }}
      >
        <Globe className="absolute -bottom-24 -right-12 w-[360px] h-[360px] text-white opacity-[0.04] pointer-events-none stroke-[1]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="flex flex-col items-start text-left max-w-2xl w-full">
            <p className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-white/92 shadow-sm backdrop-blur-md border border-white/14 mb-4 md:mb-5">
              {timing.status === "upcoming" ? "Sắp diễn ra" : timing.status === "active" ? "Đang diễn ra" : "Đã kết thúc"}
            </p>
            <h2 className="text-[32px] md:text-[44px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{trip.title}</h2>
            
            <div className="mt-5 md:mt-6 flex flex-wrap gap-2 md:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/14 shadow-inner text-white/92">
                <MapPin className="h-4 w-4 text-kat-primary" />
                {trip.location || "Đang lên kế hoạch"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/14 shadow-inner text-white/92">
                <CalendarDays className="h-4 w-4 text-kat-primary" />
                {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/14 shadow-inner text-white/92">
                <Clock className="h-4 w-4 text-kat-primary" />
                {durationText}
              </span>
            </div>
          </div>

          <div className="flex w-full md:w-auto flex-col items-center justify-center rounded-2xl bg-white/8 p-5 md:px-8 backdrop-blur-md border border-white/14 shadow-sm shrink-0 mt-2 md:mt-0">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/80">
              {timing.status === "upcoming" ? "Đếm ngược" : timing.status === "active" ? "Tiến độ" : "Hành trình"}
            </p>
            <p className="mt-1 text-[28px] md:text-[34px] font-extrabold tracking-tight text-white/95">{timing.label}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <QuickAction icon={<CalendarDays className="h-7 w-7" />} label="Lịch trình" onClick={() => onNavigateTab("timeline")} />
        <QuickAction icon={<WalletCards className="h-7 w-7" />} label="Chi phí" onClick={() => onNavigateTab("expenses")} />
        <QuickAction icon={<Backpack className="h-7 w-7" />} label="Chuẩn bị" onClick={() => onNavigateTab("checklist")} />
        <QuickAction icon={<BookOpen className="h-7 w-7" />} label="Nhật ký" onClick={() => onNavigateMore("journal")} />
      </section>

      {/* Desktop Responsive Split */}
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:items-start space-y-6 md:space-y-0">
        
        {/* Next Activity */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-kat-text px-1">Hoạt động tiếp theo</h3>
          {nextEvent ? (
            <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer group" onClick={() => onNavigateTab("timeline")}>
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#E50A62]/10 text-[#E50A62] transition-colors group-hover:bg-[#E50A62]/20">
                <span className="text-[12px] font-bold uppercase leading-none">{formatDate(nextEvent.date).split("/")[0]}</span>
                <span className="mt-1 text-[10px] font-semibold leading-none opacity-90">Tháng {formatDate(nextEvent.date).split("/")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                {nextEvent.time && (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#F89B02]">
                    <Clock className="h-3.5 w-3.5" />
                    {nextEvent.time}
                  </p>
                )}
                <h4 className="mt-1 truncate text-lg font-bold text-kat-text">{nextEvent.title}</h4>
                {nextEvent.location && <p className="mt-0.5 truncate text-[14px] text-slate-500">{nextEvent.location}</p>}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </div>
          ) : (
            <div className="rounded-[24px] bg-kat-surface p-6 border border-kat-border/60 shadow-soft flex flex-col items-center text-center animate-fadeIn">
              <p className="text-[14px] font-semibold text-kat-muted">Chưa có hoạt động nào được lên lịch.</p>
              <button 
                onClick={() => onNavigateTab("timeline")}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-kat-primary/10 border border-kat-primary/10 px-4 py-2 text-[13px] font-bold text-kat-primary transition-all duration-200 hover:bg-kat-primary/15 active:scale-98 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Thêm hoạt động
              </button>
            </div>
          )}
        </section>

        {/* Trip Summary */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-kat-text px-1">Tóm tắt chuyến đi</h3>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0081BE]/10 text-[#0081BE]">
                  <Users className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Thành viên</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-kat-text truncate">
                    {members.length > 0 ? `${members.length} người: ${members.map(m => m.name.split(' ')[0]).join(", ")}` : "Chưa có thành viên"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E50A62]/10 text-[#E50A62]">
                  <Briefcase className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Chuẩn bị</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                    {checklistStats.completed} / {checklistStats.total} món đã chuẩn bị
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F89B02]/10 text-[#F89B02]">
                  <MapPin className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Hoạt động kế tiếp</p>
                  <p className="mt-0.5 truncate text-[15px] font-extrabold text-kat-text">
                    {nextEvent ? nextEvent.title : "Chưa lên lịch"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                  <WalletCards className="h-[22px] w-[22px]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Đã chi</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">{formatMoney(totalExpense)}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
