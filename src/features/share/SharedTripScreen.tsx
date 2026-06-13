import React, { useEffect, useState } from "react";
import { 
  Globe, MapPin, CalendarDays, Clock, Route,
  Users, MapPinned, WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, ChevronRight, Share2, SearchX, ShieldAlert
} from "lucide-react";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney } from "../../utils/helpers";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import { SharedExpensesSection, SharedChecklistSection, SharedJournalsSection, SharedBackupPlansSection, SharedDocumentsSection } from "./components/SharedSections";

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
  
  // Stats
  const totalExpense = expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((c: any) => c.completed).length;
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const canRequestEdit = (data.mode === 'edit' || data.mode === 'request_edit') && !data.revoked;

  return (
    <div className="font-sans text-kat-text bg-[#FAF7F1] min-h-screen">
      <header className="sticky top-0 z-40 bg-white/85 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-slate-200/60 shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
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

      {canRequestEdit && (
        <div className="sticky top-[53px] md:top-[61px] z-30 bg-[#030D2E] text-white px-4 py-2.5 text-center shadow-md animate-fadeIn">
          <p className="text-[13.5px] font-bold">
            Chế độ Đề xuất: Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt.
          </p>
        </div>
      )}

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
        {(activities.length > 0 || canRequestEdit) && (
          <SharedActivitiesSection 
            token={token} 
            mode={canRequestEdit ? 'request_edit' : 'view'} 
            activities={activities} 
            changeRequests={changeRequests}
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
             />
          )}

          {data.includeChecklist && (checklist.length > 0 || canRequestEdit) && (
             <SharedChecklistSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               checklist={checklist} 
               changeRequests={changeRequests}
               members={members}
             />
          )}

          {data.includeJournals && (journals.length > 0 || canRequestEdit) && (
             <SharedJournalsSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               journals={journals} 
               changeRequests={changeRequests}
             />
          )}

          {data.includeBackupPlans && (backupPlans.length > 0 || canRequestEdit) && (
             <SharedBackupPlansSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               backupPlans={backupPlans} 
               changeRequests={changeRequests}
             />
          )}

          {data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit) && (
             <SharedDocumentsSection 
               token={token} 
               mode={canRequestEdit ? 'request_edit' : 'view'} 
               documents={travelDocuments} 
               changeRequests={changeRequests}
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
