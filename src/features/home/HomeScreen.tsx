import React from "react";
import { 
  Backpack, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  MapPin, 
  WalletCards, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Plus, 
  Globe, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle,
  Trophy,
  FileDown,
  Sparkles,
  FileText,
  Table2,
  GitBranch,
  Circle,
  CheckCircle2,
  Receipt
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChecklistItem, EventItem, Expense, Member, Trip, db, TravelDocument } from "../../db";
import { formatDate, formatMoney, getChecklistStats, getTripTiming, today } from "../../utils/helpers";
import { getTripReminders } from "../../utils/reminderRules";
import { exportTripPdf, exportTripExcel } from "../../utils/exports";
import { useShareChangeRequests } from "../../hooks/useShareChangeRequests";
import { ShareChangeRequestsSheet } from "../share/components/ShareChangeRequestsSheet";

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex flex-col items-center justify-center gap-2.5 rounded-[20px] bg-white p-5 shadow-sm border border-slate-100 transition-all duration-200 ease-in-out motion-press md:motion-hover-lift hover:border-kat-primary/30 w-full"
      onClick={onClick}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
        {icon}
      </div>
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
  travelDocuments = [],
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
  travelDocuments?: TravelDocument[];
  totalExpense: number;
  perPerson: number;
  onNavigateTab: (tab: "timeline" | "expenses" | "checklist") => void;
  onNavigateMore: (section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents") => void;
}) {
  const [isInboxOpen, setIsInboxOpen] = React.useState(false);
  const journals = useLiveQuery(() => db.journals.where("tripId").equals(trip.id!).toArray(), [trip.id]) ?? [];
  const packingItems = useLiveQuery(() => db.packingItems.where("tripId").equals(trip.id!).toArray(), [trip.id]) ?? [];
  const backupPlans = useLiveQuery(() => db.backupPlans.where("tripId").equals(trip.id!).toArray(), [trip.id]) ?? [];
  const { pendingRequests, activeToken } = useShareChangeRequests(trip);

  const timing = getTripTiming(trip);
  const checklistStats = getChecklistStats(checklist);
  const nextEvent =
    events.find((item) => !item.completed && item.date >= today) ??
    events.find((item) => !item.completed) ??
    events[0];

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  let durationText = "Chuyến đi trong ngày";
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

  const tripData = { trip, members, events, expenses, checklist, journals, packingItems, travelDocuments };
  const status = timing.status;

  // Reusable helper to render visual Avatar Group + concise description for companions
  const renderCompanions = () => {
    if (members.length === 0) {
      return <span className="font-semibold text-slate-400">Chưa có người đồng hành</span>;
    }
    
    // First member's first name
    const firstMemberName = members[0].name.trim().split(" ").pop() || members[0].name;
    let text = "";
    if (members.length === 1) {
      text = firstMemberName;
    } else {
      text = `${firstMemberName} và ${members.length - 1} người khác`;
    }

    // Get first 3 members for avatars
    const displayMembers = members.slice(0, 3);
    const remainingCount = members.length - displayMembers.length;

    const bgColors = [
      "bg-blue-100 text-blue-600",
      "bg-emerald-100 text-emerald-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600"
    ];

    return (
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 overflow-hidden">
          {displayMembers.map((member, i) => {
            const initials = member.name.charAt(0).toUpperCase();
            const colorClass = bgColors[i % bgColors.length];
            return (
              <div 
                key={member.id || i} 
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[12px] font-bold ${colorClass}`}
                title={member.name}
              >
                {initials}
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-extrabold text-slate-600">
              +{remainingCount}
            </div>
          )}
        </div>
        <span className="text-[14.5px] font-semibold text-slate-800">{text}</span>
      </div>
    );
  };

  // 1. Hero rendering helper
  const renderHero = () => {
    let badge = "Sắp diễn ra";
    let statusLabel = "Đếm ngược";
    let statusValue = timing.label;
    let isPast = false;

    if (status === "active") {
      badge = "Đang diễn ra";
      statusLabel = "Hành trình";
      statusValue = timing.label;
    } else if (status === "past") {
      badge = "Đã kết thúc";
      statusLabel = "Trạng thái";
      statusValue = timing.label;
      isPast = true;
    }

    return (
      <section 
        className="relative overflow-hidden rounded-[24px] text-white shadow-soft transition-all duration-300 motion-page-enter p-5 md:p-6"
        style={{ background: "linear-gradient(135deg, #030D2E 0%, #003D4A 60%, #007C78 100%)" }}
      >
        <Globe className="absolute -bottom-24 -right-12 w-[300px] h-[300px] text-white opacity-[0.04] pointer-events-none stroke-[1]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-col items-start text-left max-w-2xl w-full">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider text-white/90 shadow-sm backdrop-blur-md border border-white/10 mb-3">
              {badge}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-sm">{trip.title}</h2>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-md border border-white/10 shadow-inner text-white/90">
                <MapPin className="h-3.5 w-3.5 text-kat-primary" />
                {trip.location || "Đang lên kế hoạch"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-md border border-white/10 shadow-inner text-white/90">
                <CalendarDays className="h-3.5 w-3.5 text-kat-primary" />
                {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-md border border-white/10 shadow-inner text-white/90">
                <Clock className="h-3.5 w-3.5 text-kat-primary" />
                {durationText}
              </span>
            </div>
          </div>

          <div className="flex w-full md:w-auto flex-col items-center justify-center rounded-xl bg-white/8 p-4 md:px-6 backdrop-blur-md border border-white/10 shadow-sm shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              {statusLabel}
            </p>
            <p className="mt-0.5 text-[22px] md:text-[26px] font-extrabold tracking-tight text-white/95">{statusValue}</p>
          </div>
        </div>
      </section>
    );
  };





  // 3. Layout for completed trips
  const renderPastLayout = () => {
    return (
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:items-start space-y-6 md:space-y-0">
        {/* Left Column: Nhìn lại chuyến đi */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#030D2E] px-1 motion-title-enter">Nhìn lại chuyến đi</h3>
          
          <div className="space-y-4">
            {/* Tổng kết card */}
            <div className="rounded-3xl bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] motion-card-enter motion-delay-1 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/35">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-extrabold text-[#030D2E]">Tổng kết chuyến đi</h4>
                <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">
                  Xem lại chi phí, hoạt động và những dấu ấn đáng nhớ.
                </p>
                <button
                  onClick={() => onNavigateMore("wrapped")}
                  className="mt-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-[#00BFB7]/10 hover:bg-[#00BFB7]/20 border border-[#00BFB7]/20 px-4 py-2 text-[12.5px] font-extrabold text-[#030D2E] transition-all duration-200 motion-press shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-kat-primary" />
                  <span>Xem tổng kết</span>
                </button>
              </div>
            </div>

            {/* Nhật ký card */}
            <div className="rounded-3xl bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] motion-card-enter motion-delay-2 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-extrabold text-[#030D2E]">Nhật ký chuyến đi</h4>
                <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">
                  {journals.length > 0 ? `${journals.length} trang nhật ký đã được lưu.` : "Chưa có trang nhật ký nào được ghi lại."}
                </p>
                <button
                  onClick={() => onNavigateMore("journal")}
                  className="mt-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-kat-primary text-[#030D2E] hover:brightness-105 px-4 py-2 text-[12.5px] font-black transition-all duration-200 motion-press shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Viết nhật ký</span>
                </button>
              </div>
            </div>

            {/* Báo cáo card */}
            <div id="report-card" className="rounded-3xl bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] motion-card-enter motion-delay-3 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0081BE]/10 text-[#0081BE] border border-[#0081BE]/20">
                <FileDown className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-extrabold text-[#030D2E]">Báo cáo chuyến đi</h4>
                <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">
                  Tải xuống báo cáo tổng hợp lịch trình, chi phí và chuẩn bị hành lý.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => exportTripPdf(tripData)}
                    className="flex-1 min-w-[100px] h-10 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#030D2E] font-bold text-[13px] transition-all motion-press"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Xuất PDF</span>
                  </button>
                  <button
                    onClick={() => exportTripExcel(tripData)}
                    className="flex-1 min-w-[100px] h-10 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#030D2E] font-bold text-[13px] transition-all motion-press"
                  >
                    <Table2 className="w-4 h-4 text-slate-400" />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Tổng quan hành trình */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#030D2E] px-1 motion-title-enter">Tổng quan hành trình</h3>
          
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 motion-card-enter motion-delay-2">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/50">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Người đồng hành</p>
                  <div className="mt-1.5">
                    {renderCompanions()}
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100/50">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Lịch trình đã ghi</p>
                  {events.length > 0 ? (
                    <p className="mt-0.5 text-[15px] font-extrabold text-[#030D2E]">
                      {events.length} hoạt động đã được ghi lại
                    </p>
                  ) : (
                    <div>
                      <p className="mt-0.5 text-[14px] font-semibold text-slate-400">Chưa có lịch trình được ghi lại</p>
                      <button 
                        onClick={() => onNavigateTab("timeline")}
                        className="mt-1.5 text-[12.5px] font-bold text-kat-primary hover:text-kat-primary-usable transition-all motion-press text-left"
                      >
                        Bổ sung lịch trình
                      </button>
                    </div>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100/50">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Chuẩn bị</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-[#030D2E]">
                    {checklistStats.total > 0 
                      ? `${checklistStats.completed} / ${checklistStats.total} món hành lý` 
                      : "Chưa có món nào trong checklist"}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">Tổng đã chi chuyến đi</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-[#030D2E]">{formatMoney(totalExpense)}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    );
  };

  // 4. Layout for upcoming trips
  const renderUpcomingLayout = () => {
    const reminders = getTripReminders({ trip, members, events, expenses, checklist, travelDocuments });

    return (
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:items-start space-y-6 md:space-y-0">
        {/* Left Column: Hoạt động tiếp theo & Nhắc việc trước chuyến đi */}
        <div className="space-y-6">
          {/* Hoạt động tiếp theo */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Hoạt động tiếp theo</h3>
            {nextEvent ? (
              <div 
                className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md cursor-pointer group motion-card-enter motion-delay-1 motion-press" 
                onClick={() => onNavigateTab("timeline")}
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary transition-colors group-hover:bg-kat-primary/20">
                  <span className="text-[13px] font-extrabold uppercase leading-none">{formatDate(nextEvent.date).split("/")[0]}</span>
                  <span className="mt-1 text-[11px] font-bold leading-none opacity-90">Tháng {formatDate(nextEvent.date).split("/")[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  {nextEvent.time && (
                    <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#F89B02]">
                      <Clock className="h-3.5 w-3.5" />
                      {nextEvent.time}
                    </p>
                  )}
                  <h4 className="mt-1 truncate text-base font-extrabold text-kat-text">{nextEvent.title}</h4>
                  {nextEvent.location && <p className="mt-0.5 truncate text-[13.5px] text-slate-500">{nextEvent.location}</p>}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            ) : (
              <div className="rounded-[24px] bg-[#FFFDF8] p-6 border border-[#E8E1D8] shadow-sm flex flex-col items-center text-center motion-card-enter motion-delay-1">
                <p className="text-[13.5px] font-semibold text-slate-500">Chưa có hoạt động nào được lên lịch trình.</p>
                <button 
                  onClick={() => onNavigateTab("timeline")}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-kat-primary text-[#030D2E] hover:brightness-105 px-4 py-2.5 text-[13px] font-black transition-all duration-200 shadow-sm motion-press"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Thêm lịch trình
                </button>
              </div>
            )}
          </section>

          {/* Nhắc việc trước chuyến đi */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Nhắc việc trước chuyến đi</h3>
            {reminders.length > 0 ? (
              <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm space-y-4 motion-card-enter motion-delay-2">
                <div className="grid grid-cols-1 gap-3.5">
                  {reminders.map((rem, idx) => (
                    <div 
                      key={rem.id} 
                      className="flex flex-col justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/20 hover:border-amber-200/60 transition-all group"
                    >
                      <div>
                        <h4 className="text-[14px] font-extrabold text-slate-800 leading-snug flex items-start gap-2">
                          <AlertTriangle className={`h-4.5 w-4.5 shrink-0 ${
                            rem.type === "danger" ? "text-rose-500" : "text-amber-500"
                          }`} />
                          <span>{rem.title}</span>
                        </h4>
                        <p className="text-[13px] font-semibold text-slate-500 mt-1 pl-6.5 leading-relaxed">{rem.description}</p>
                      </div>
                      {rem.actionLabel && rem.onClickSection && (
                        <button
                          onClick={() => {
                            if (rem.onClickSection === "timeline" || rem.onClickSection === "expenses" || rem.onClickSection === "checklist") {
                              onNavigateTab(rem.onClickSection);
                            } else if (rem.onClickSection) {
                              onNavigateMore(rem.onClickSection as "members" | "documents");
                            }
                          }}
                          className="mt-3 pl-6.5 self-start text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1 motion-press"
                        >
                          <span>{rem.actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] bg-[#FFFDF8] p-6 border border-[#E8E1D8] shadow-sm flex flex-col items-center text-center motion-card-enter motion-delay-2">
                <p className="text-[13.5px] font-semibold text-slate-500">Mọi thứ đã sẵn sàng cho chuyến đi sắp tới!</p>
                <button 
                  onClick={() => onNavigateTab("checklist")}
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-kat-primary text-[#030D2E] hover:brightness-105 px-4 py-2.5 text-[13px] font-black transition-all duration-200 shadow-sm motion-press"
                >
                  <Briefcase className="h-4 w-4" />
                  Chuẩn bị hành lý
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Tổng quan hành trình & Giấy tờ & đặt chỗ */}
        <div className="space-y-6">
          {/* Tổng quan hành trình */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Tổng quan hành trình</h3>
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 motion-card-enter motion-delay-3">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/50">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Người đồng hành</p>
                    <div className="mt-1.5">
                      {renderCompanions()}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100/50">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Chuẩn bị</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {checklistStats.total > 0 ? `${checklistStats.completed} / ${checklistStats.total} món hành lý` : "Chưa có món nào được lên checklist"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100/50">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Lịch trình kế tiếp</p>
                    <p className="mt-0.5 truncate text-[15px] font-extrabold text-kat-text">
                      {nextEvent ? nextEvent.title : "Chưa có hoạt động nào"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Dự kiến chi phí</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">{formatMoney(totalExpense)}</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Giấy tờ & đặt chỗ */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Giấy tờ & đặt chỗ</h3>
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm motion-card-enter motion-delay-4">
              {travelDocuments.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[13.5px] font-semibold text-slate-500">
                    Đã lưu {travelDocuments.length} tài liệu quan trọng cho chuyến đi.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(travelDocuments.map(d => d.type || "other"))).map((type) => {
                      const label = 
                        type === "ticket" ? "Vé xe/máy bay" :
                        type === "hotel" ? "Khách sạn" :
                        type === "booking" ? "Mã đặt chỗ" :
                        type === "contact" ? "Liên hệ" :
                        type === "map" ? "Bản đồ" : "Khác";
                      const count = travelDocuments.filter(d => d.type === type).length;
                      return (
                        <span key={type} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-[11.5px] font-bold text-slate-650">
                          {label} ({count})
                        </span>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => onNavigateMore("documents")}
                    className="mt-2.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1.5 motion-press"
                  >
                    <span>Xem toàn bộ giấy tờ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13.5px] font-semibold text-slate-400">Chưa lưu vé xe, mã khách sạn hay tài liệu nào.</p>
                  <button 
                    onClick={() => onNavigateMore("documents")}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/20 px-4 py-2.5 text-[13px] font-extrabold text-slate-700 transition-all duration-200 shadow-sm motion-press"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm giấy tờ
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  // 5. Layout for active trips
  const renderActiveLayout = () => {
    const todayEvents = events.filter(e => e.date === today);
    const incompleteChecklist = checklist.filter(c => !c.completed);
    const displayChecklist = [...checklist]
      .sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1; // incomplete first
      })
      .slice(0, 5);
    const idDocs = travelDocuments.filter(d => 
      d.type === "ticket" || 
      d.type === "booking" || 
      d.title.toLowerCase().includes("vé") || 
      d.title.toLowerCase().includes("đặt chỗ") || 
      d.title.toLowerCase().includes("hotel")
    );

    const todayBackupPlans = backupPlans.filter(p => p.date === today || (p.activityId && todayEvents.some(e => e.id === p.activityId)));

    return (
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:items-start space-y-6 md:space-y-0">
        {/* Left Column: Hôm nay focus */}
        <div className="space-y-6">
          {/* Day Mode Top Card */}
          <section id="today-widget" className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-5 motion-card-enter motion-delay-1">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-[17px] font-extrabold text-[#030D2E] flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" style={{ animationDuration: "2s" }} />
                Hôm nay là ngày đi
              </h3>
              <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">
                Kiểm tra nhanh lịch trình, giấy tờ và những món cần mang theo.
              </p>
            </div>

            {/* Phương án dự phòng hôm nay */}
            {todayBackupPlans.length > 0 && (
              <div className="p-4 bg-kat-primary/5 rounded-2xl border border-kat-primary/20 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-kat-primary-light flex items-center justify-center text-kat-primary shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14.5px] font-extrabold text-[#030D2E]">Phương án dự phòng hôm nay</h4>
                  <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                    Bạn có {todayBackupPlans.length} phương án dự phòng cho hôm nay.
                  </p>
                  <button 
                    onClick={() => onNavigateTab("timeline")}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[12.5px] font-bold text-kat-primary hover:bg-slate-50 transition-colors motion-press"
                  >
                    Xem phương án <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Hoạt động tiếp theo / Lịch trình hôm nay */}
            <div className="space-y-3">
              <h4 className="text-[12.5px] font-black uppercase tracking-wider text-slate-400">Lịch trình hôm nay</h4>
              {todayEvents.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-100/80 bg-slate-50/20 text-center">
                  <p className="text-[13px] font-semibold text-slate-400">Không có lịch trình nào được lên kế hoạch hôm nay.</p>
                  <button 
                    onClick={() => onNavigateTab("timeline")}
                    className="mt-2.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors inline-flex items-center gap-1 motion-press"
                  >
                    <span>Xem lịch trình đầy đủ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {todayEvents
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                    .map((item, idx) => (
                      <button 
                        key={item.id}
                        onClick={() => item.id && db.events.update(item.id, { completed: !item.completed })}
                        className={`w-full min-h-[46px] flex items-center justify-between p-3 px-4 rounded-2xl border transition-all text-left group motion-press ${
                          item.completed 
                            ? "bg-slate-50/45 border-slate-100/60 text-slate-400/80" 
                            : "bg-[#FFFDF8] border-slate-200/60 text-slate-700 hover:bg-slate-50/60 hover:border-kat-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0">
                            {item.completed ? (
                              <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="h-5.5 w-5.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13.5px] font-bold ${item.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{item.title}</p>
                            {item.time && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{item.time}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Chuẩn bị còn thiếu (Món còn thiếu) */}
            <div className="space-y-3">
              <h4 className="text-[12.5px] font-black uppercase tracking-wider text-slate-400">Chuẩn bị còn thiếu</h4>
              {checklist.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-100/80 bg-slate-50/20 text-center">
                  <p className="text-[13px] font-semibold text-slate-400">Chưa có món nào được lên checklist.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {displayChecklist.map((item, idx) => (
                    <button 
                      key={item.id}
                      onClick={() => item.id && db.checklist.update(item.id, { completed: !item.completed })}
                      className={`w-full min-h-[46px] flex items-center justify-between p-3 px-4 rounded-2xl border transition-all text-left group motion-press ${
                        item.completed 
                          ? "bg-slate-50/45 border-slate-100/60 text-slate-400/80" 
                          : "bg-[#FFFDF8] border-slate-200/60 text-slate-700 hover:bg-slate-50/60 hover:border-kat-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {item.completed ? (
                            <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50" />
                          ) : (
                            <Circle className="h-5.5 w-5.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                          )}
                        </div>
                        <span className={`text-[13.5px] font-bold truncate ${item.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {item.title}
                        </span>
                      </div>
                    </button>
                  ))}
                  {incompleteChecklist.length > 5 && (
                    <button 
                      onClick={() => onNavigateTab("checklist")}
                      className="w-full text-center py-2 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Xem thêm {incompleteChecklist.length - 5} món chưa chuẩn bị</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Giấy tờ cần kiểm tra */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Giấy tờ cần kiểm tra</h3>
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm motion-card-enter motion-delay-2">
              {idDocs.length > 0 ? (
                <div className="space-y-3.5">
                  <p className="text-[13.5px] font-semibold text-slate-500">
                    Tra cứu nhanh các thông tin vé hoặc đặt chỗ dưới đây:
                  </p>
                  <div className="divide-y divide-slate-100">
                    {idDocs.map((doc) => (
                      <div key={doc.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <h5 className="text-[13.5px] font-bold text-slate-800 truncate">{doc.title}</h5>
                          {doc.code && <p className="text-[11.5px] font-bold text-slate-400 mt-0.5">Mã: {doc.code}</p>}
                        </div>
                        <button
                          onClick={() => onNavigateMore("documents")}
                          className="shrink-0 text-[12.5px] font-extrabold text-kat-primary hover:text-kat-primary-usable transition-all motion-press"
                        >
                          Chi tiết
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13.5px] font-semibold text-slate-400">Chưa có vé hay đặt chỗ nào được đánh dấu cần kiểm tra.</p>
                  <button 
                    onClick={() => onNavigateMore("documents")}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/20 px-4 py-2.5 text-[13px] font-extrabold text-slate-700 transition-all duration-200 shadow-sm motion-press"
                  >
                    <Plus className="h-4 w-4" />
                    Bổ sung giấy tờ
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Tổng quan hành trình & Lịch trình đã ghi */}
        <div className="space-y-6">
          {/* Tổng quan hành trình */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Tổng quan hành trình</h3>
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 motion-card-enter motion-delay-3">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/50">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Người đồng hành</p>
                    <div className="mt-1.5">
                      {renderCompanions()}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100/50">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Chuẩn bị</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {checklistStats.total > 0 ? `${checklistStats.completed} / ${checklistStats.total} món hành lý` : "Chưa có món nào được lên checklist"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100/50">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Hoạt động tiếp theo</p>
                    <p className="mt-0.5 truncate text-[15px] font-extrabold text-kat-text">
                      {nextEvent ? nextEvent.title : "Chưa có hoạt động nào"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">Tổng đã chi chuyến đi</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">{formatMoney(totalExpense)}</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Lịch trình đã ghi */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">Lịch trình đã ghi</h3>
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm motion-card-enter motion-delay-4">
              <p className="text-[13.5px] font-semibold text-slate-500">
                {events.length > 0 
                  ? `Đang có ${events.length} hoạt động trong lịch trình chuyến đi.`
                  : "Chưa ghi nhận hoạt động nào trong lịch trình."}
              </p>
              <button 
                onClick={() => onNavigateTab("timeline")}
                className="mt-3.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1.5 motion-press"
              >
                <span>Xem lịch trình chi tiết</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn mx-auto w-full max-w-[1120px]">
      {renderHero()}
      
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsInboxOpen(true)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-rose-800">Yêu cầu chỉnh sửa</h4>
              <p className="text-[13px] font-medium text-rose-700 leading-snug mt-0.5">Có {pendingRequests.length} yêu cầu đang chờ duyệt</p>
            </div>
          </div>
          <button className="text-[13px] font-bold text-rose-700 bg-white border border-rose-100 shadow-sm px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
            Xem yêu cầu
          </button>
        </div>
      )}

      
      {status === "past" && renderPastLayout()}
      {status === "active" && renderActiveLayout()}
      {(status !== "past" && status !== "active") && renderUpcomingLayout()}

      {activeToken && (
        <ShareChangeRequestsSheet
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
          token={activeToken}
          requests={pendingRequests}
        />
      )}
    </div>
  );
}
