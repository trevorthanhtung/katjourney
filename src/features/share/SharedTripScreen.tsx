import React, { useEffect, useState } from "react";
import { 
  Globe, MapPin, CalendarDays, Clock, Route,
  Users, MapPinned, WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, ChevronRight, Share2, SearchX, ShieldAlert, Link, X
} from "lucide-react";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney } from "../../utils/helpers";
import { getWeatherGradient } from "../../services/weatherService";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import { SharedExpensesSection, SharedChecklistSection, SharedJournalsSection, SharedBackupPlansSection, SharedDocumentsSection } from "./components/SharedSections";
import { getIdentity, saveIdentity, UserIdentity } from "../../services/identityService";

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

import { useSharedTrip } from "../../hooks/useSharedTrip";

export default function SharedTripScreen({ token }: { token: string }) {
  const { data, error, loading } = useSharedTrip(token);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  
  // Identity Modal state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [step, setStep] = useState<"pin" | "identity">("pin");
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    if (data && data.trip) {
      const saved = getIdentity(data.trip.id);
      if (!saved) {
        setShowIdentityModal(true);
        if (!data.sharePin) {
          setStep("identity");
        }
      } else {
        setCurrentUser(saved);
        setIdentityChecked(true);
      }
    }
  }, [data]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 animate-fadeIn">
          {/* Icon Container */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ShieldAlert className="h-10 w-10" />
          </div>
          
          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Không thể truy cập chuyến đi</h2>
            
            {/* Copywriting (Body & Sub-body) */}
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              Liên kết này không tồn tại hoặc bạn không có quyền truy cập.
            </p>
            <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed">
              Vui lòng kiểm tra lại đường dẫn hoặc yêu cầu chủ chuyến đi chia sẻ lại liên kết.
            </p>
          </div>
          
          {/* CTA Button */}
          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-[#030D2E] text-white px-6 py-2.5 font-bold shadow-sm hover:bg-[#030D2E]/90 active:scale-95 transition-all focus:outline-none"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const { 
    trip, 
    activities = [], 
    members = [], 
    expenses = [], 
    checklist = [], 
    journals = [], 
    backupPlans = [], 
    travelDocuments = [],
    changeRequests = []
  } = data;

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

  // Status-aware hero gradient (matches HomeScreen logic)
  const status = timing.status;
  const heroBg = status === "past"
    ? "linear-gradient(135deg, #2D1B4E 0%, #4A2C6E 50%, #6B3A8A 100%)"
    : status === "active"
    ? "linear-gradient(135deg, #0F4C81 0%, #1565C0 55%, #1976D2 100%)"
    : "linear-gradient(135deg, #1A3A5C 0%, #1E4976 55%, #2460A7 100%)";
  
  // Stats
  const totalExpense = expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((c: any) => c.completed).length;
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  let canRequestEdit = (data.mode === 'edit' || data.mode === 'request_edit') && !data.revoked;
  if (currentUser?.isGuest && !currentUser?.canEdit) {
    canRequestEdit = false;
  }

  if (showIdentityModal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F1] p-4 animate-fadeIn">
        <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-xl border border-slate-100 animate-scaleIn">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              {step === "pin"
                ? <ShieldAlert className="h-8 w-8" />
                : <Users className="h-8 w-8" />
              }
            </div>

            <h2 className="text-[22px] font-extrabold text-[#030D2E] tracking-tight">
              {step === "pin" ? "Trạm kiểm soát" : "Bạn là ai trong chuyến đi?"}
            </h2>
            <p className="mt-2 text-[14px] text-slate-500 font-medium leading-relaxed">
              {step === "pin"
                ? "Chủ chuyến đi đã thiết lập mã PIN bảo mật. Vui lòng nhập mã để tiếp tục."
                : "Chọn danh tính của bạn để tương tác, viết nhật ký và lưu lại kỷ niệm nhé."}
            </p>

            {step === "pin" && (
              <div className="w-full mt-6 space-y-4">
                <input
                  type="text"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                    setPinError(false);
                  }}
                  className={classNames(
                    "w-full h-14 rounded-2xl border bg-slate-50 px-4 text-center text-[24px] tracking-[0.5em] font-black focus:bg-white focus:outline-none transition-all",
                    pinError
                      ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-600"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800"
                  )}
                  placeholder="****"
                />
                {pinError && <p className="text-sm font-bold text-rose-500">Mã PIN không chính xác!</p>}

                <button
                  onClick={() => {
                    if (pinInput === data.sharePin) {
                      setStep("identity");
                    } else {
                      setPinError(true);
                    }
                  }}
                  className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Xác nhận
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Hoặc</span></div>
                </div>

                <button
                  onClick={() => {
                    const idt: UserIdentity = { name: "Khách", isGuest: true, canEdit: false };
                    saveIdentity(idt, trip.id);
                    setCurrentUser(idt);
                    setIdentityChecked(true);
                    setShowIdentityModal(false);
                  }}
                  className="w-full h-12 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Tôi chỉ xem thôi
                </button>
              </div>
            )}

            {step === "identity" && (
              <div className="w-full mt-6 space-y-3">
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {members.map((m: Member) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        const idt: UserIdentity = { id: String(m.id), name: m.name, isGuest: true, canEdit: true };
                        saveIdentity(idt, trip.id);
                        setCurrentUser(idt);
                        setIdentityChecked(true);
                        setShowIdentityModal(false);
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all text-left group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 group-hover:bg-indigo-200 text-slate-600 group-hover:text-indigo-700 font-black">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-[15px]">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  if (!identityChecked) return null;

  return (
    <div className="font-sans text-kat-text bg-[#FAF7F1] min-h-screen">
      <header className="sticky top-0 z-40 bg-kat-bg/90 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-kat-border shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between h-9 md:h-11">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 select-none">
              <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-[28px] w-[28px] object-contain drop-shadow-sm" />
              <h1 className="text-[20px] font-extrabold tracking-tight text-kat-text whitespace-nowrap">KAT Journey</h1>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 select-none">
              <Share2 className="h-3 w-3" />
              Bản chia sẻ
            </span>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center justify-center rounded-full bg-[#030D2E] px-4 py-1.5 text-[13px] font-black text-white hover:bg-[#030D2E]/90 active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            Tạo chuyến đi của bạn
          </button>
        </div>
      </header>

      {canRequestEdit && isBannerVisible && (
        <div className="sticky top-[53px] md:top-[61px] z-30 bg-[#030D2E] text-white px-4 py-2.5 shadow-md animate-fadeIn flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-[13.5px] font-bold">
              Chế độ Đề xuất: Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt.
            </p>
          </div>
          <button 
            onClick={() => setIsBannerVisible(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 md:py-8 space-y-6">
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden rounded-[32px] text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-white/10 transition-all p-6 md:p-8 group"
          style={{ background: heroBg }}
        >
          {/* Glass gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-60 pointer-events-none rounded-[32px]" />
          <Globe className="absolute -bottom-24 -right-12 w-[360px] h-[360px] text-white opacity-[0.04] pointer-events-none stroke-[1]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col items-start max-w-xl">
              {/* Status badge */}
              {status === "active" && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white shadow-[0_2px_8px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/20 mb-3">
                  <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  Đang diễn ra
                </span>
              )}
              {status === "upcoming" && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white/90 backdrop-blur-md border border-white/10 mb-3">
                  <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  Sắp diễn ra
                </span>
              )}
              {status === "past" && (
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white/70 backdrop-blur-md border border-white/10 mb-3">
                  Đã kết thúc
                </span>
              )}

              <h2 className="text-[32px] md:text-[40px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{trip.name}</h2>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <MapPin className="h-3.5 w-3.5 text-white/70" />
                  {trip.destination || "Chưa rõ điểm đến"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <CalendarDays className="h-3.5 w-3.5 text-white/70" />
                  {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <Clock className="h-3.5 w-3.5 text-white/70" />
                  {durationText}
                </span>
                {trip.mediaLink && (
                  <a href={trip.mediaLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[12px] font-bold backdrop-blur-md border border-sky-400/30 shadow-inner text-sky-100 hover:bg-sky-500/30 transition-colors">
                    <Link className="h-3 w-3" />
                    Kho Ảnh Gốc
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                {status === "past" ? "Trạng thái" : "Hành trình"}
              </p>
              <p className="mt-1 text-[20px] font-black text-white drop-shadow-sm">
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
        {(activities.length > 0 || canRequestEdit) && (
          <SharedActivitiesSection 
            token={token} 
            mode={canRequestEdit ? 'request_edit' : 'view'} 
            activities={activities} 
            changeRequests={changeRequests}
            members={members}
            guestName={currentUser?.name || "Khách"}
          />
        )}

        {/* Other Sections included in Share */}
        <div className="grid grid-cols-1 gap-4">
          {data.includeExpenses && (expenses.length > 0 || canRequestEdit) && (
             <SharedExpensesSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               expenses={expenses} 
               changeRequests={changeRequests}
               members={members}
               events={activities}
               guestName={currentUser?.name || "Khách"}
             />
          )}

          {data.includeChecklist && (checklist.length > 0 || canRequestEdit) && (
             <SharedChecklistSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               checklist={checklist} 
               changeRequests={changeRequests}
               members={members}
               guestName={currentUser?.name || "Khách"}
             />
          )}

          {data.includeJournals && (journals.length > 0 || canRequestEdit) && (
             <SharedJournalsSection 
               tripId={trip.id}
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               journals={journals} 
               changeRequests={changeRequests}
               guestName={currentUser?.name || "Khách"}
             />
          )}

          {data.includeBackupPlans && (backupPlans.length > 0 || canRequestEdit) && (
             <SharedBackupPlansSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               backupPlans={backupPlans} 
               changeRequests={changeRequests}
               guestName={currentUser?.name || "Khách"}
             />
          )}

          {data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit) && (
             <SharedDocumentsSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               documents={travelDocuments} 
               changeRequests={changeRequests}
               guestName={currentUser?.name || "Khách"}
             />
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
