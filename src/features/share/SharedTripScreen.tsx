import React, { useEffect, useState } from "react";
import { 
  Globe, MapPin, CalendarDays, Clock, Route,
  Users, MapPinned, WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, ChevronRight, Share2, SearchX
} from "lucide-react";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney } from "../../utils/helpers";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";

interface SharedData {
  trip: any;
  members: Member[];
  activities: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  backupPlans: BackupPlan[];
  travelDocuments: TravelDocument[];
  includeExpenses: boolean;
  includeJournals: boolean;
  includeChecklist: boolean;
  includeBackupPlans: boolean;
  includeDocuments: boolean;
  ownerUid: string;
}

export default function SharedTripScreen({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getViewShareData(token);
        // sort activities
        result.activities.sort((a: any, b: any) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time || "").localeCompare(b.time || "");
        });
        setData(result as SharedData);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải dữ liệu chia sẻ.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] flex-col gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kat-primary/30 border-t-kat-primary"></div>
        <p className="text-slate-500 font-bold animate-pulse">Đang tải hành trình...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <SearchX className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-[#030D2E]">Rất tiếc!</h2>
          <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
            {error || "Không tìm thấy dữ liệu hành trình."}
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="mt-6 inline-flex rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Về trang chủ KAT Journey
          </button>
        </div>
      </div>
    );
  }

  const { trip, activities, members, expenses, checklist, journals, backupPlans, travelDocuments } = data;

  const isDayTrip = trip.startDate === trip.endDate;
  let durationText = "Trong ngày";
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

  const timing = getTripTiming(trip);
  
  // Stats
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter(c => c.completed).length;
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  return (
    <div className="font-sans text-kat-text bg-[#FAF7F1] min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-slate-200/60 shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-extrabold tracking-tight text-[#030D2E]">KAT Journey</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
              <Share2 className="h-3 w-3" />
              Bản chia sẻ
            </span>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="text-[13px] font-bold text-kat-primary hover:underline"
          >
            Tạo chuyến đi của bạn
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 md:py-8 space-y-6">
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden rounded-[32px] text-white shadow-soft transition-all p-6 md:p-8"
          style={{ background: "linear-gradient(135deg, #030D2E 0%, #003D4A 60%, #007C78 100%)" }}
        >
          <Globe className="absolute -bottom-24 -right-12 w-[360px] h-[360px] text-white opacity-[0.04] pointer-events-none stroke-[1]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col items-start max-w-xl">
              <h2 className="text-[32px] md:text-[40px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{trip.name}</h2>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <MapPin className="h-3.5 w-3.5 text-kat-primary" />
                  {trip.destination || "Chưa rõ điểm đến"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <CalendarDays className="h-3.5 w-3.5 text-kat-primary" />
                  {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <Clock className="h-3.5 w-3.5 text-kat-primary" />
                  {durationText}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-4 border border-white/10 shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                {timing.status === "past" ? "Trạng thái" : "Hành trình"}
              </p>
              <p className="mt-1 text-[20px] font-black text-kat-primary drop-shadow-sm">
                {timing.label}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
            <Users className="mx-auto h-6 w-6 text-blue-500 mb-2" />
            <p className="text-[20px] font-black text-[#030D2E]">{members.length}</p>
            <p className="text-[12px] font-bold text-slate-500 uppercase">Thành viên</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
            <Route className="mx-auto h-6 w-6 text-emerald-500 mb-2" />
            <p className="text-[20px] font-black text-[#030D2E]">{activities.length}</p>
            <p className="text-[12px] font-bold text-slate-500 uppercase">Lịch trình</p>
          </div>
          {data.includeExpenses && (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
              <WalletCards className="mx-auto h-6 w-6 text-amber-500 mb-2" />
              <p className="text-[16px] font-black text-[#030D2E] truncate">{formatMoney(totalExpense)}</p>
              <p className="text-[12px] font-bold text-slate-500 uppercase mt-1">Chi phí</p>
            </div>
          )}
          {data.includeChecklist && (
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center shadow-sm">
              <CheckCircle className="mx-auto h-6 w-6 text-purple-500 mb-2" />
              <p className="text-[20px] font-black text-[#030D2E]">{checklistPercent}%</p>
              <p className="text-[12px] font-bold text-slate-500 uppercase">Chuẩn bị</p>
            </div>
          )}
        </section>

        {/* Timeline */}
        {activities.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/60 p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Route className="h-6 w-6 text-kat-primary" />
              <h3 className="text-[18px] font-black text-[#030D2E]">Lịch trình chi tiết</h3>
            </div>
            <div className="space-y-6">
              {activities.map((item, idx) => (
                <div key={item.id} className="relative flex gap-4 pl-1">
                  <div className="absolute bottom-0 left-[21px] top-8 w-0.5 bg-slate-200 group-last:bg-transparent" />
                  <div className="relative z-10 flex shrink-0 mt-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white shadow-sm border border-slate-200/60">
                      <MapPinned className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="flex flex-col w-full min-w-0 pt-0.5 pb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-[15px] font-bold text-[#030D2E] break-words">{item.title}</h4>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-slate-500">
                      {item.time && (
                        <span className="flex items-center gap-1 font-bold text-kat-primary">
                          <Clock className="h-3.5 w-3.5" />
                          {item.time}
                        </span>
                      )}
                      <span>{formatDate(item.date)}</span>
                    </div>
                    {item.location && (
                      <p className="mt-1.5 text-[13.5px] text-slate-600 flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                        <span className="break-words">{item.location}</span>
                      </p>
                    )}
                    {item.notes && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Other Sections included in Share */}
        <div className="grid grid-cols-1 gap-4">
          {data.includeExpenses && expenses.length > 0 && (
             <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <WalletCards className="h-5 w-5 text-amber-500" />
                  <h3 className="text-[16px] font-black text-[#030D2E]">Chi phí chuyến đi</h3>
                </div>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map(e => (
                    <div key={e.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[14px] font-semibold text-slate-700">{e.description}</span>
                      <span className="text-[14px] font-bold text-[#030D2E]">{formatMoney(e.amount)}</span>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <p className="text-[13px] font-medium text-slate-400 text-center pt-2">
                      Và {expenses.length - 5} khoản chi khác...
                    </p>
                  )}
                </div>
             </section>
          )}

          {data.includeChecklist && checklist.length > 0 && (
             <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[16px] font-black text-[#030D2E]">Danh sách chuẩn bị</h3>
                </div>
                <div className="space-y-2">
                  {checklist.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className={classNames("h-4 w-4 rounded border flex items-center justify-center", c.completed ? "bg-purple-500 border-purple-500" : "border-slate-300")}>
                        {c.completed && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <span className={classNames("text-[14px] font-medium", c.completed ? "text-slate-400 line-through" : "text-slate-700")}>{c.title}</span>
                    </div>
                  ))}
                   {checklist.length > 5 && (
                    <p className="text-[13px] font-medium text-slate-400 text-center pt-2">
                      Và {checklist.length - 5} mục khác...
                    </p>
                  )}
                </div>
             </section>
          )}

          {data.includeJournals && journals.length > 0 && (
             <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpenText className="h-5 w-5 text-blue-500" />
                  <h3 className="text-[16px] font-black text-[#030D2E]">Nhật ký</h3>
                </div>
                <p className="text-[14px] text-slate-600 font-medium">Đã ghi {journals.length} trang nhật ký.</p>
             </section>
          )}
          
          {data.includeDocuments && travelDocuments.length > 0 && (
             <section className="bg-rose-50/50 rounded-2xl border border-rose-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-rose-500" />
                  <h3 className="text-[16px] font-black text-[#030D2E]">Giấy tờ & đặt chỗ</h3>
                </div>
                <p className="text-[14px] text-rose-700/80 font-medium">Bao gồm {travelDocuments.length} mục giấy tờ được chia sẻ.</p>
             </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-[13px] font-medium text-slate-400">
            Dữ liệu được chia sẻ an toàn qua KAT Journey.
          </p>
        </div>
      </main>
    </div>
  );
}
