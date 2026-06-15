import React, { useEffect, useState } from "react";
import { 
  Globe, MapPin, CalendarDays, Clock, Route,
  Users, MapPinned, WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, ChevronRight, Share2, SearchX, ShieldAlert, Link, X, MessageCircle, UserRoundCog,
  Crown, Car, Luggage, UsersRound, BadgeCheck,
  Plus, Edit3, Map, Compass, GitBranch, Check, ChevronDown
} from "lucide-react";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney, daysBetween, formatDateShort } from "../../utils/helpers";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import { SharedExpensesSection, SharedChecklistSection, SharedJournalsSection, SharedDocumentsSection, SharedMembersSection } from "./components/SharedSections";
import { getIdentity, saveIdentity, UserIdentity } from "../../services/identityService";
import { getAvatarSvg } from "../../utils/avatars";
import { ChatBox } from "./components/ChatBox";
import { WeatherWidget } from "../timeline/WeatherWidget";
import { BottomSheet, FormActions, Select } from "../../components/ui";
import { SharedBackupPlansSheet } from "./components/SharedBackupPlansSheet";

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
  const [isGlobalBackupOpen, setIsGlobalBackupOpen] = useState(false);

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
          if (roleLower === "dẫn đường") {
            return <span key={i} title="Dẫn đường" className="shrink-0"><Compass className="h-3.5 w-3.5 text-sky-500" /></span>;
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
  const [hasInitializedTab, setHasInitializedTab] = useState(false);
  const [selectedRoadmapDay, setSelectedRoadmapDay] = useState<string>("");
  const [isRoadmapFormOpen, setIsRoadmapFormOpen] = useState(false);
  const [isRoadmapDayPickerOpen, setIsRoadmapDayPickerOpen] = useState(false);
  const [roadmapInputLink, setRoadmapInputLink] = useState("");
  const [roadmapEditDay, setRoadmapEditDay] = useState("");

  const handleSaveRoadmap = async () => {
    if (!roadmapEditDay) return;
    try {
      const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
      if (roadmapInputLink.trim()) {
        currentRoadmaps[roadmapEditDay] = roadmapInputLink.trim();
      } else {
        delete currentRoadmaps[roadmapEditDay];
      }
      
      const { updateSharedTripRoadmaps } = await import("../../services/sharedTripEditService");
      await updateSharedTripRoadmaps(token, currentRoadmaps);
      
      setIsRoadmapFormOpen(false);
    } catch (err) {
      console.error("Lỗi khi lưu lộ trình:", err);
      alert("Không thể lưu lộ trình. Vui lòng kiểm tra kết nối mạng.");
    }
  };



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

  useEffect(() => {
    // Select first available tab based on what's included in shared content, only on initial load
    if (data && !hasInitializedTab) {
      const activities = data.activities || [];
      const backupPlans = data.backupPlans || [];
      const members = data.members || [];
      const expenses = data.expenses || [];
      const checklist = data.checklist || [];
      const journals = data.journals || [];
      
      const isOwnerOrAdmin = currentUser?.role === "owner" || currentUser?.role === "admin";
      const canRequestEdit = Boolean(isOwnerOrAdmin || (data.trip?.status !== 'archived' && (currentUser?.role || currentUser?.role === "member")));

      if (activities.length > 0 || (data.includeBackupPlans && backupPlans.length > 0) || canRequestEdit) {
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
      setHasInitializedTab(true);
    }
  }, [data, hasInitializedTab, currentUser]);

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
    userRoleLower.includes("dẫn đường") || 
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
    userRoleLower.includes("dẫn đường") || 
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

  // Mode for Journals (Bản tin)
  const journalsMode = (
    isOwnerOrAdmin || 
    userRoleLower.includes("trưởng nhóm") || 
    userRoleLower.includes("trưởng đoàn") || 
    userRoleLower.includes("leader")
  ) ? "edit" : (canRequestEdit ? "request_edit" : "view");

  // Navigation Tabs construction
  const tabsList = [
    {id: "activities", label: "Lịch trình", show: (activities.length > 0 || (data.includeBackupPlans && backupPlans.length > 0) || canRequestEdit), icon: Route },
    {id: "journals", label: "Bản tin", show: data.includeJournals && (journals.length > 0 || canRequestEdit), icon: Globe },
    {id: "expenses", label: "Chi phí", show: data.includeExpenses && (expenses.length > 0 || canRequestEdit), icon: WalletCards },
    {id: "checklist", label: "Chuẩn bị", show: data.includeChecklist && (checklist.length > 0 || canRequestEdit), icon: CheckCircle },
    {id: "others", label: "Tài liệu", show: data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit), icon: FileText },
    {id: "members", label: "Thành viên", show: members.length > 0 || canRequestEdit, icon: Users },
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
    <div className="min-h-screen bg-kat-bg">
      {/* Banner */}
      {isBannerVisible && (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí") || canRequestEdit) && (
        <div className={classNames(
          "text-white py-2 px-4 text-center text-[12px] font-semibold flex justify-between items-center shadow-md select-none border-b border-white/5",
          (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")) ? "bg-[#005c56]" : "bg-[#0C1938]"
        )}>
          <div className="flex-1 text-center pr-6">
            {(userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")) 
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
      <header className="sticky top-0 z-40 bg-[#FFFDF8]/90 backdrop-blur-xl border-b border-slate-100 px-2.5 min-[360px]:px-4 pb-3 pt-3 shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="max-w-[1120px] mx-auto w-full flex items-center justify-between h-9 md:h-11 gap-1.5 min-[360px]:gap-2">
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 select-none shrink-0">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-[26px] w-[26px] min-[360px]:h-[28px] min-[360px]:w-[28px] shrink-0 object-contain drop-shadow-sm" />
            <span className="text-[17px] min-[360px]:text-[20px] font-extrabold tracking-tight text-[#030D2E] whitespace-nowrap hidden min-[400px]:block shrink-0">KAT Journey</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 min-[360px]:px-2 py-0.5 text-[10px] font-bold text-indigo-600 whitespace-nowrap shrink-0">
              <Share2 className="h-3 w-3 shrink-0" /> Chia sẻ
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 shrink-0">
            {/* Switch identity button */}
            {currentUser && (
              <button
                onClick={() => {
                  localStorage.setItem("kat_pending_swap_" + trip.id, "true");
                  setStep("identity");
                  setShowIdentityModal(true);
                }}
                title="Chọn lại người dùng"
                className="flex items-center justify-center gap-1.5 min-h-[34px] min-[360px]:min-h-[36px] px-2 min-[360px]:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-650 hover:text-slate-900 shadow-sm transition-all active:scale-[0.97] shrink-0"
              >
                <UserRoundCog className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{currentUser.name}</span>
              </button>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="flex items-center justify-center min-h-[34px] min-[360px]:min-h-[38px] text-[12px] min-[360px]:text-[13px] font-black text-white bg-[#030D2E] hover:bg-[#030D2E]/90 px-4 rounded-xl shadow-sm transition-all active:scale-[0.97] whitespace-nowrap shrink-0"
            >
              Thoát
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1120px] mx-auto px-2.5 min-[360px]:px-4 py-6 space-y-6">
        
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
              <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md px-6 py-4 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_16px_rgba(0,0,0,0.1)] w-full sm:w-auto text-center">
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/10 rounded-full blur-md"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  {status === "past" ? "Trạng thái" : "Hành trình"}
                </p>
                <p className="mt-1.5 text-[22px] font-black text-white drop-shadow-sm tracking-tight">
                  {timing.label}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_2px_8px_rgba(3,13,46,0.02)] hover:shadow-[0_8px_20px_rgba(3,13,46,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-[22px] font-black text-[#030D2E] leading-none mb-1">{members.length}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thành viên</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_2px_8px_rgba(3,13,46,0.02)] hover:shadow-[0_8px_20px_rgba(3,13,46,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Route className="h-5 w-5" />
            </div>
            <p className="text-[22px] font-black text-[#030D2E] leading-none mb-1">{activities.length}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lịch trình</p>
          </div>
          {data.includeExpenses && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_2px_8px_rgba(3,13,46,0.02)] hover:shadow-[0_8px_20px_rgba(3,13,46,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <WalletCards className="h-5 w-5" />
              </div>
              <p className="text-[18px] font-black text-[#030D2E] leading-none mb-1 truncate max-w-full px-1">{formatMoney(totalExpense)}</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chi phí</p>
            </div>
          )}
          {data.includeChecklist && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_2px_8px_rgba(3,13,46,0.02)] hover:shadow-[0_8px_20px_rgba(3,13,46,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-[22px] font-black text-[#030D2E] leading-none mb-1">{checklistPercent}%</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuẩn bị</p>
            </div>
          )}
        </section>

        <section className="bg-slate-100/60 backdrop-blur-md p-1 rounded-2xl flex gap-1 overflow-x-auto scrollbar-none border border-slate-200/40 shadow-inner">
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-[13px] whitespace-nowrap transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-white text-[#030D2E] shadow-[0_2px_8px_rgba(3,13,46,0.08)] scale-[1.02] border border-slate-100" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                )}
              >
                <IconComponent className={classNames("h-4 w-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-500")} />
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
                {/* 1. Shared Roadmap Widget */}
                {days.length > 0 && (
                  <div className="rounded-3xl bg-white p-5 border border-slate-200/50 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Route className="h-4 w-4" />
                      </span>
                      <h4 className="text-[15px] font-extrabold text-[#030D2E]">Lộ trình di chuyển</h4>
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
                              <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="text-[10.5px] font-bold text-emerald-600/70 uppercase tracking-wide mb-0.5">
                                Ngày đang xem
                              </div>
                              <div className="text-[14.5px] font-extrabold text-[#030D2E]">
                                {selectedRoadmapDay ? `Ngày ${days.indexOf(selectedRoadmapDay) + 1} (${formatDateShort(selectedRoadmapDay)})` : "Chọn ngày"}
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-105">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </button>
                      </div>
                    )}


                    {/* Roadmap details for selected day */}
                    {(() => {
                      const dayIndex = days.indexOf(selectedRoadmapDay);
                      const dateParts = selectedRoadmapDay ? selectedRoadmapDay.split('-') : [];
                      const dateLabel = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : selectedRoadmapDay;
                      const mapUrl = (() => {
                        const manual = trip.dayRoadmaps?.[selectedRoadmapDay] || "";
                        if (manual) return manual;
                        const dayActs = activities.filter((e: any) => e.date === selectedRoadmapDay);
                        const travel = dayActs.find((e: any) => e.mapLink && (e.category === 'Di chuyển' || e.category === 'travel'));
                        const fallback = !travel ? dayActs.find((e: any) => e.mapLink) : null;
                        return (travel || fallback)?.mapLink || "";
                      })();
                      const isAutoMap = !trip.dayRoadmaps?.[selectedRoadmapDay] && !!mapUrl;
                      const isRoute = mapUrl && (mapUrl.includes("/maps/dir/") || mapUrl.includes("maps/dir"));

                      return (
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400">
                            <span>Ngày {dayIndex + 1} ({dateLabel})</span>
                            {activitiesMode === "edit" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoadmapInputLink(mapUrl);
                                  setRoadmapEditDay(selectedRoadmapDay);
                                  setIsRoadmapFormOpen(true);
                                }}
                                className="text-[#00BFB7] hover:opacity-85 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {mapUrl && <Edit3 className="w-3.5 h-3.5" />}
                                {mapUrl ? "Sửa" : "Thêm"}
                              </button>
                            )}
                          </div>

                          {mapUrl ? (
                            <div className="space-y-2.5">
                              <p className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5 flex-wrap">
                                {isRoute ? "Đã có link lộ trình cho ngày này." : "Đã liên kết bản đồ cho ngày này."}
                                {isAutoMap && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[10.5px] font-bold text-sky-500">
                                    Từ lịch trình
                                  </span>
                                )}
                              </p>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[13.5px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                              >
                                <Route className="w-4 h-4" />
                                Mở lộ trình &rarr;
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2 text-center py-2">
                              <p className="text-[12.5px] font-semibold text-slate-400">Chưa có lộ trình ngày này</p>
                              {activitiesMode === "edit" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoadmapInputLink("");
                                    setRoadmapEditDay(selectedRoadmapDay);
                                    setIsRoadmapFormOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-655 hover:text-slate-900 shadow-sm transition-all cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
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

                {/* 2. Weather Forecast Widget */}
                <WeatherWidget 
                  destination={trip.destination || trip.location} 
                  latitude={trip.latitude} 
                  longitude={trip.longitude} 
                  days={tripDays.length || 3} 
                />

                {/* 3. Shared General Backup Plans Widget */}
                {data.includeBackupPlans && (
                  <div className="rounded-3xl bg-white p-5 border border-slate-200/50 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <GitBranch className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-[15px] font-extrabold text-[#030D2E]">Dự phòng chung</h4>
                          <p className="text-[11px] text-slate-500/80 font-medium">Áp dụng cho toàn bộ chuyến đi</p>
                        </div>
                      </div>
                      
                      {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length > 0 && (
                        <button
                          onClick={() => setIsGlobalBackupOpen(true)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[12px] hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Xem ({backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length})
                        </button>
                      )}
                    </div>

                    {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).map((plan: BackupPlan) => (
                          <div key={plan.id} className="text-[13px] font-semibold text-[#030D2E] bg-slate-50/70 rounded-xl px-3 py-2.5 border border-slate-100/50 flex items-center justify-between gap-2">
                            <span className="truncate">{plan.title}</span>
                            <button
                              onClick={() => setIsGlobalBackupOpen(true)}
                              className="text-indigo-650 hover:text-indigo-800 shrink-0 text-[12px] font-bold"
                            >
                              Chi tiết &rarr;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60">
                        <p className="text-[12.5px] font-bold text-slate-400">Chưa có dự phòng chung</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Các phương án áp dụng cho toàn bộ chuyến đi.</p>
                      </div>
                    )}

                    {canRequestEdit && (
                      <button
                        onClick={() => setIsGlobalBackupOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200/80 text-indigo-600 font-bold text-[13px] hover:bg-indigo-50 transition-colors motion-press cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        {backupPlansMode === 'edit' ? 'Thêm phương án' : 'Đề xuất phương án'}
                      </button>
                    )}
                  </div>
                )}

                {/* 4. Trip Info context card */}
                <div className="rounded-3xl bg-white p-5 border border-slate-200/50 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#030D2E]/5 text-[#030D2E]">
                      <Route className="h-4 w-4" />
                    </span>
                    <h4 className="text-[15px] font-extrabold text-[#030D2E]">Thông tin hành trình</h4>
                  </div>
                  
                  <div className="space-y-3 text-[13.5px] font-semibold text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-100/40 pb-2.5">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        Điểm đến
                      </span>
                      <span className="font-black text-[#030D2E]">{trip.destination || trip.location || "Chưa xác định"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100/40 pb-2.5">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        Thời gian
                      </span>
                      <span className="font-black text-[#030D2E]">
                        {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-slate-400" />
                        Mục lịch trình
                      </span>
                      <span className="font-black text-[#030D2E]">{activities.length} mục</span>
                    </div>
                  </div>
                </div>
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
              tripId={trip.id}
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
              mode={journalsMode} 
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

      {/* Roadmap Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapFormOpen}
        onClose={() => setIsRoadmapFormOpen(false)}
        title={`Lộ trình di chuyển - Ngày ${days.indexOf(roadmapEditDay) + 1}`}
      >
        <div className="space-y-5 pb-4">
          
          {/* Instruction card */}
          <div className="flex items-start gap-3 bg-[#00BFB7]/8 border border-[#00BFB7]/20 rounded-2xl px-4 py-3">
            <Route className="h-5 w-5 text-[#00BFB7] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-[#030D2E]">Dán link lộ trình Google Maps</p>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                Vào Google Maps → chọn điểm đầu/cuối → nhấn <strong>Đường đi</strong> → sao chép link trên thanh địa chỉ.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Route className="h-4 w-4 text-[#00BFB7]" />
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
                    try {
                      const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
                      currentRoadmaps[roadmapEditDay] = pasted;
                      
                      const { updateSharedTripRoadmaps } = await import("../../services/sharedTripEditService");
                      await updateSharedTripRoadmaps(token, currentRoadmaps);
                      
                      setIsRoadmapFormOpen(false);
                    } catch (err) {
                      console.error("Lỗi khi lưu lộ trình:", err);
                      alert("Không thể lưu lộ trình. Vui lòng kiểm tra kết nối mạng.");
                    }
                  }, 50);
                }
              }}
              placeholder="https://www.google.com/maps/dir/..."
              className="w-full pl-11 pr-4 py-4 bg-white border-2 border-[#E8E1D8] rounded-2xl text-[14px] font-semibold text-[#030D2E] placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:border-[#00BFB7] focus:ring-2 focus:ring-[#00BFB7]/15 transition-all duration-200"
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
              <Map className="w-4 h-4" />
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
                      isSelected ? "text-emerald-900" : "text-[#030D2E]"
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
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      {data.includeBackupPlans && (
        <SharedBackupPlansSheet
          token={token}
          tripId={trip.id}
          isOpen={isGlobalBackupOpen}
          onClose={() => setIsGlobalBackupOpen(false)}
          backupPlans={backupPlans}
          changeRequests={changeRequests}
          mode={backupPlansMode || (canRequestEdit ? "request_edit" : "view")}
          guestName={currentUser?.name || "Khách"}
        />
      )}

    </div>
  );
}
