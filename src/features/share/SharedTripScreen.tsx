import React, { useEffect, useState } from "react";
import { 
  Globe, MapPin, CalendarDays, Clock, Route,
  Users, MapPinned, WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, ChevronRight, Share2, SearchX, ShieldAlert, Link, X, MessageCircle, UserRoundCog,
  Crown, Car, Luggage, UsersRound, BadgeCheck
} from "lucide-react";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney, daysBetween } from "../../utils/helpers";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import { SharedExpensesSection, SharedChecklistSection, SharedJournalsSection, SharedDocumentsSection, SharedMembersSection } from "./components/SharedSections";
import { getIdentity, saveIdentity, UserIdentity } from "../../services/identityService";
import { getAvatarSvg } from "../../utils/avatars";
import { ChatBox } from "./components/ChatBox";
import { WeatherWidget } from "../timeline/WeatherWidget";

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

  const renderRoleIcons = (role: string) => {
    const roles = (role || "Người đồng hành")
      .split(",")
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {roles.map((roleLower, i) => {
          if (roleLower === "trưởng nhóm" || roleLower === "trưởng đoàn" || roleLower === "người đại diện" || roleLower === "leader") {
            return <span key={i} title="Trưởng nhóm" className="shrink-0"><Crown className="h-3.5 w-3.5 text-amber-500" /></span>;
          }
          if (roleLower === "quản lý chi phí") {
            return <span key={i} title="Quản lý chi phí" className="shrink-0"><WalletCards className="h-3.5 w-3.5 text-emerald-500" /></span>;
          }
          if (roleLower === "tài xế") {
            return <span key={i} title="Tài xế" className="shrink-0"><Car className="h-3.5 w-3.5 text-blue-500" /></span>;
          }
          if (roleLower === "phụ trách hành lý") {
            return <span key={i} title="Phụ trách hành lý" className="shrink-0"><Luggage className="h-3.5 w-3.5 text-indigo-500" /></span>;
          }
          if (!roleLower || roleLower === "người đồng hành" || roleLower === "bạn đồng hành" || roleLower === "companion" || roleLower === "member") {
            return <span key={i} title="Người đồng hành" className="shrink-0"><UsersRound className="h-3.5 w-3.5 text-slate-400" /></span>;
          }
          return <span key={i} title={roleLower} className="shrink-0"><BadgeCheck className="h-3.5 w-3.5 text-teal-500" /></span>;
        })}
      </div>
    );
  };

  // Chat state
  const [showChatBox, setShowChatBox] = useState(false);

  const [activeTab, setActiveTab] = useState<string>("activities");
  const [selectedRoadmapDay, setSelectedRoadmapDay] = useState<string>("");



  const tripDays = data?.trip ? daysBetween(data.trip.startDate, data.trip.endDate) : [];
  const eventDays = data?.activities ? Array.from(new Set(data.activities.map((e: any) => e.date))) : [];
  const days = Array.from(new Set([...tripDays, ...eventDays])).filter(Boolean).sort() as string[];

  useEffect(() => {
    if (days.length > 0 && !selectedRoadmapDay) {
      setSelectedRoadmapDay(days[0]);
    }
  }, [days, selectedRoadmapDay]);

  useEffect(() => {
    if (data && data.trip) {
      const saved = getIdentity(data.trip.id);
      const pendingSwap = localStorage.getItem("kat_pending_swap_" + data.trip.id) === "true";
      
      if (!saved || pendingSwap) {
        setShowIdentityModal(true);
        if (pendingSwap || !data.sharePin) {
          setStep("identity");
        }
      } else {
        const member = data.members?.find((m: any) => m.name === saved.name);
        if (member) {
          saved.role = member.role;
          saveIdentity(saved, data.trip.id);
        }
        setCurrentUser(saved);
        setIdentityChecked(true);
      }
    }
  }, [data]);

  useEffect(() => {
    // Select first available tab based on what's included in shared content
    if (data) {
      if (activities.length > 0 || canRequestEdit) {
        setActiveTab("activities");
      } else if (members.length > 0 || canRequestEdit) {
        setActiveTab("members");
      } else if (data.includeExpenses && (expenses.length > 0 || canRequestEdit)) {
        setActiveTab("expenses");
      } else if (data.includeChecklist && (checklist.length > 0 || canRequestEdit)) {
        setActiveTab("checklist");
      } else if (data.includeJournals && (journals.length > 0 || canRequestEdit)) {
        setActiveTab("journals");
      } else {
        setActiveTab("others");
      }
    }
  }, [data]);

  useEffect(() => {
    if (data && data.trip) {
      try {
        const savedRaw = localStorage.getItem("kat_recent_shared_trips");
        let list = savedRaw ? JSON.parse(savedRaw) : [];
        if (!Array.isArray(list)) list = [];
        
        // Remove existing item with same token
        list = list.filter((item: any) => item.token !== token);
        
        // Format date display
        const dateParts = data.trip.startDate ? data.trip.startDate.split('-') : [];
        const dateStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : (data.trip.startDate || "");
        
        // Add to front
        list.unshift({
          token,
          title: data.trip.title || data.trip.name || "Chuyến đi không tên",
          date: dateStr,
          timestamp: Date.now()
        });
        
        // Keep max 3
        list = list.slice(0, 3);
        
        localStorage.setItem("kat_recent_shared_trips", JSON.stringify(list));
      } catch (e) {
        console.error("Error saving recent shared trip", e);
      }
    }
  }, [data, token]);

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
    trip: rawTrip, 
    activities = [], 
    members = [], 
    expenses = [], 
    checklist = [], 
    journals = [], 
    backupPlans = [], 
    travelDocuments = [],
    changeRequests = []
  } = data;

  const trip = rawTrip ? { ...rawTrip, title: rawTrip.title || rawTrip.name } : {} as any;


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
  if (data.trip?.status === 'archived') {
    canRequestEdit = false;
  }

  const isOwnerOrAdmin = currentUser && !currentUser.isGuest;
  const userRoleLower = (currentUser?.role || "").trim().toLowerCase();

  // Mode for Activities (Lịch trình) - Driver or Trưởng nhóm has direct edit
  const activitiesMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("tài xế") || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Mode for Expenses (Chi phí) - Cost Manager or Trưởng nhóm has direct edit
  const expensesMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("quản lý chi phí") || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Mode for Checklist (Chuẩn bị) - Trưởng nhóm has direct edit
  const checklistMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Mode for Backup Plans - Driver or Leader has direct edit
  const backupPlansMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("tài xế") || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Mode for Documents (Tài liệu)
  const documentsMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Mode for Members (Thành viên)
  const membersMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Navigation Tabs construction
  const tabsList = [
    {id: "activities", label: "Lịch trình", show: (activities.length > 0 || (data.includeBackupPlans && backupPlans.length > 0) || canRequestEdit), icon: Route },
    {id: "members", label: "Thành viên", show: members.length > 0 || canRequestEdit, icon: Users },
    {id: "expenses", label: "Chi phí", show: data.includeExpenses && (expenses.length > 0 || canRequestEdit), icon: WalletCards },
    {id: "checklist", label: "Chuẩn bị", show: data.includeChecklist && (checklist.length > 0 || canRequestEdit), icon: CheckCircle },
    {id: "journals", label: "Bản tin", show: data.includeJournals && (journals.length > 0 || canRequestEdit), icon: BookOpenText },
    {id: "others", label: "Tài liệu", show: data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit), icon: FileText },
  ].filter(t => t.show);

  if (showIdentityModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FAF7F1] p-4 animate-fadeIn overflow-hidden z-50">
        <div className="w-full max-w-md max-h-[90dvh] rounded-[32px] bg-white p-6 shadow-xl border border-slate-100 animate-scaleIn flex flex-col relative">
          {/* Close button — only show when user already has an identity (re-selecting) */}
          {currentUser && (
            <button
              onClick={() => {
                localStorage.removeItem("kat_pending_swap_" + trip.id);
                setShowIdentityModal(false);
              }}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10"
              title="Đóng, giữ lựa chọn cũ"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex flex-col items-center text-center shrink-0">
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
                ? "Chuyến đi này được bảo vệ bằng mã PIN. Vui lòng nhập mã PIN để xem nội dung."
                : "Chọn tên của bạn trong danh sách để chúng ta dễ dàng tương tác nhé."
              }
            </p>
          </div>

          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            {step === "pin" ? (
              <div className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="Nhập mã PIN gồm 4-6 số"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className={classNames(
                    "w-full rounded-[16px] border px-4 py-3 text-center text-lg font-black tracking-widest outline-none transition-all",
                    pinError
                      ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-400"
                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#030D2E]"
                  )}
                />
                {pinError && (
                  <p className="text-center text-xs font-bold text-rose-500">Mã PIN không chính xác. Vui lòng thử lại.</p>
                )}
                <button
                  onClick={() => {
                    if (pinInput === data.sharePin) {
                      setStep("identity");
                    } else {
                      setPinError(true);
                    }
                  }}
                  className="w-full rounded-[16px] bg-[#030D2E] py-3 text-[14px] font-black text-white transition-all active:scale-[0.98] shadow-sm"
                >
                  Xác nhận mã PIN
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/50 custom-scrollbar">
                  {members
                    .filter((m: Member) => {
                      const roleLower = (m.role || "").trim().toLowerCase();
                      return !(
                        roleLower === "trưởng nhóm" ||
                        roleLower === "trưởng đoàn" ||
                        roleLower === "người đại diện" ||
                        roleLower === "leader"
                      );
                    })
                    .map((m: Member) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          const guest = { name: m.name, role: m.role, isGuest: true, canEdit: true };
                          saveIdentity(guest, trip.id);
                          localStorage.removeItem("kat_pending_swap_" + trip.id);
                          setCurrentUser(guest);
                          setShowIdentityModal(false);
                          setIdentityChecked(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-slate-200">
                          {m.avatar ? getAvatarSvg(m.avatar, "w-full h-full") : <Users className="h-4 w-4 text-slate-400" />}
                        </div>
                        <div className="flex items-center justify-between flex-1 pr-1">
                          <span className="text-[14px] font-bold text-slate-800">{m.name}</span>
                          {renderRoleIcons(m.role || "")}
                        </div>
                      </button>
                    ))}
                </div>
                
                <button
                  onClick={() => {
                    const guest = { name: "Người xem", isGuest: true, canEdit: false };
                    saveIdentity(guest, trip.id);
                    localStorage.removeItem("kat_pending_swap_" + trip.id);
                    setCurrentUser(guest);
                    setShowIdentityModal(false);
                    setIdentityChecked(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl bg-slate-50/50 shrink-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span className="text-[14px] font-bold text-slate-600">Tôi chỉ muốn xem bản tin chuyến đi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8]">
      {/* Banner */}
      {isBannerVisible && (userRoleLower.includes("tài xế") || userRoleLower.includes("quản lý chi phí") || canRequestEdit) && (
        <div className={classNames(
          "text-white py-2 px-4 text-center text-[12px] font-semibold flex justify-between items-center shadow-md select-none border-b border-white/5",
          (userRoleLower.includes("tài xế") || userRoleLower.includes("quản lý chi phí")) ? "bg-[#005c56]" : "bg-[#0C1938]"
        )}>
          <div className="flex-1 text-center pr-6">
            {(userRoleLower.includes("tài xế") || userRoleLower.includes("quản lý chi phí")) 
              ? `Vai trò "${currentUser?.role}": Bạn có quyền chỉnh sửa trực tiếp phần được phân công.`
              : "Chế độ Đề xuất: Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt."
            }
          </div>
          <button 
            onClick={() => setIsBannerVisible(false)}
            className="text-white/70 hover:text-white p-1 rounded-full transition-colors"
            title="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#FFFDF8] border-b border-slate-100 px-4 py-3 shadow-sm">
        <div className="max-w-[1120px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-[28px] w-[28px] object-contain drop-shadow-sm" />
            <span className="text-lg font-black text-[#030D2E] tracking-tight">KAT Journey</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              <Share2 className="h-3 w-3" /> Chia sẻ
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Switch identity button */}
            {currentUser && (
              <button
                onClick={() => {
                  localStorage.setItem("kat_pending_swap_" + trip.id, "true");
                  setStep("identity");
                  setShowIdentityModal(true);
                }}
                title="Chọn lại người dùng"
                className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-650 hover:text-slate-900 shadow-sm transition-all active:scale-[0.97]"
              >
                <UserRoundCog className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{currentUser.name}</span>
              </button>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="min-h-[38px] text-[13px] font-black text-white bg-[#030D2E] hover:bg-[#030D2E]/90 px-4 rounded-xl shadow-sm transition-all active:scale-[0.97]"
            >
              Tạo chuyến đi
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Hero Card */}
        <section 
          className="relative rounded-[32px] p-6 text-white overflow-hidden shadow-xl border border-white/5"
          style={{ background: heroBg }}
        >
          {/* Subtle World Map Watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                ● {status === "past" ? "Đã đi" : status === "active" ? "Đang diễn ra" : "Sắp diễn ra"}
              </span>
              <h2 className="text-[28px] font-black leading-tight tracking-tight drop-shadow-sm">
                {trip.title}
              </h2>
              <div className="flex flex-wrap gap-2.5">
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
            
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {/* Timing box */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] w-full sm:w-auto">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
                  {status === "past" ? "Trạng thái" : "Hành trình"}
                </p>
                <p className="mt-1 text-[20px] font-black text-white drop-shadow-sm">
                  {timing.label}
                </p>
              </div>
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

        <section className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 overflow-x-auto scrollbar-none border border-slate-200/50">
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-[13px] whitespace-nowrap transition-all duration-200",
                  isActive 
                    ? "bg-white text-[#030D2E] shadow-sm border border-slate-200/10" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <IconComponent className={classNames("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Dynamic Section Contents */}
        <div className="space-y-6">
          {activeTab === "activities" && (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start">
              {/* Left Column: Activities & Backup Plans */}
              <div className="space-y-6">
                {(activities.length > 0 || canRequestEdit) && (
                  <SharedActivitiesSection 
                    token={token} 
                    mode={activitiesMode} 
                    backupPlansMode={backupPlansMode}
                    activities={activities} 
                    changeRequests={changeRequests}
                    members={members}
                    guestName={currentUser?.name || "Khách"}
                    expenses={expenses}
                    backupPlans={backupPlans}
                    trip={trip}
                  />
                )}
              </div>

              {/* Right Column: Sidebar Widgets */}
              <div className="space-y-6">
                {/* 1. Trip Info context card */}
                <div className="rounded-3xl bg-white p-5 border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Route className="h-4 w-4" />
                    </span>
                    <h4 className="text-[15px] font-extrabold text-[#030D2E]">Thông tin hành trình</h4>
                  </div>
                  
                  <div className="space-y-3 text-[14px] font-medium text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        Điểm đến
                      </span>
                      <span className="font-bold text-[#030D2E]">{trip.destination || trip.location || "Chưa xác định"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Thời gian
                      </span>
                      <span className="font-bold text-[#030D2E]">
                        {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-slate-400" />
                        Mục lịch trình
                      </span>
                      <span className="font-bold text-[#030D2E]">{activities.length} mục</span>
                    </div>
                  </div>
                </div>

                {/* 2. Shared Roadmap Widget */}
                {days.length > 0 && (
                  <div className="rounded-3xl bg-white p-5 border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Route className="h-4 w-4" />
                      </span>
                      <h4 className="text-[15px] font-extrabold text-[#030D2E]">Lộ trình di chuyển</h4>
                    </div>

                    {/* Day selector tabs inside the widget */}
                    {days.length > 1 && (
                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {days.map((d, idx) => {
                          const isActive = selectedRoadmapDay === d;
                          const hasLink = !!trip.dayRoadmaps?.[d];
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setSelectedRoadmapDay(d)}
                              className={classNames(
                                "px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap border shrink-0 transition-all active:scale-95 cursor-pointer",
                                isActive
                                  ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
                                  : hasLink
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-[#030D2E]/10"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              Ngày {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Roadmap details for selected day */}
                    {(() => {
                      const dayIndex = days.indexOf(selectedRoadmapDay);
                      const dateParts = selectedRoadmapDay ? selectedRoadmapDay.split('-') : [];
                      const dateLabel = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : selectedRoadmapDay;
                      const mapUrl = trip.dayRoadmaps?.[selectedRoadmapDay] || "";
                      const isRoute = mapUrl && (mapUrl.includes("/maps/dir/") || mapUrl.includes("maps/dir"));

                      return (
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                          <div className="text-[12px] font-semibold text-slate-400">
                            Ngày {dayIndex + 1} ({dateLabel})
                          </div>

                          {mapUrl ? (
                            <div className="space-y-2.5">
                              <p className="text-[13px] font-medium text-slate-600">
                                {isRoute ? "Chủ chuyến đi đã cấu hình lộ trình cho ngày này." : "Bản đồ/địa điểm được liên kết cho ngày này."}
                              </p>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[13.5px] shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                              >
                                <Route className="w-4 h-4" />
                                Mở lộ trình &rarr;
                              </a>
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <p className="text-[12.5px] font-semibold text-slate-400">Chưa có lộ trình cho ngày này</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 3. Weather Forecast Widget */}
                <WeatherWidget 
                  destination={trip.destination || trip.location} 
                  latitude={trip.latitude} 
                  longitude={trip.longitude} 
                  days={tripDays.length || 3} 
                />
              </div>
            </div>
          )}

          {activeTab === "members" && (members.length > 0 || canRequestEdit) && (
            <SharedMembersSection 
              token={token}
              mode={membersMode}
              members={members} 
              checklist={checklist}
              expenses={expenses}
              changeRequests={changeRequests}
              guestName={currentUser?.name || "Khách"}
            />
          )}

          {activeTab === "expenses" && data.includeExpenses && (expenses.length > 0 || canRequestEdit) && (
            <SharedExpensesSection 
              token={token} 
              mode={expensesMode} 
              expenses={expenses} 
              changeRequests={changeRequests}
              members={members}
              events={activities}
              guestName={currentUser?.name || "Khách"}
            />
          )}

          {activeTab === "checklist" && data.includeChecklist && (checklist.length > 0 || canRequestEdit) && (
            <SharedChecklistSection 
              token={token} 
              mode={checklistMode} 
              checklist={checklist} 
              changeRequests={changeRequests}
              members={members}
              guestName={currentUser?.name || "Khách"}
            />
          )}

          {activeTab === "journals" && data.includeJournals && (journals.length > 0 || canRequestEdit) && (
            <SharedJournalsSection 
              tripId={trip.id}
              token={token} 
              mode={canRequestEdit ? 'request_edit' : 'view'} 
              journals={journals} 
              changeRequests={changeRequests}
              guestName={currentUser?.name || "Khách"}
              members={members}
              renderChatBox={currentUser ? () => (
                <ChatBox 
                  token={token} 
                  currentUser={currentUser} 
                  inline={true}
                  isReadOnly={!canRequestEdit || data.trip.status === 'archived'}
                />
              ) : undefined}
            />
          )}

          {activeTab === "others" && data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit) && (
            <SharedDocumentsSection 
              token={token} 
              mode={documentsMode} 
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
