import React, { useEffect, useState, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GlobeIcon,
  Location01Icon,
  Calendar01Icon,
  Clock01Icon,
  RouteIcon,
  CloudRainWindIcon,
  UserGroupIcon,
  MapsIcon,
  Wallet01Icon,
  CheckmarkCircle02Icon,
  BookOpen01Icon,
  File01Icon,
  AlertCircleIcon,
  ChevronRightIcon,
  Share01Icon,
  Search01Icon,
  SecurityWarningIcon,
  Link02Icon,
  Cancel01Icon,
  BubbleChatIcon,
  UserSettingsIcon,
  CrownIcon,
  Car01Icon,
  Luggage01Icon,
  BadgeCheckIcon,
  Add01Icon,
  PencilEdit01Icon,
  CompassIcon,
  GitBranchIcon,
  CheckIcon,
  ChevronDownIcon
} from "@hugeicons/core-free-icons";
import { getViewShareData } from "../../services/cloudShareService";
import { formatDate, classNames, getTripTiming, formatMoney, daysBetween, formatDateShort } from "../../utils/helpers";
import { EventItem, Expense, ChecklistItem, Member, JournalEntry, TravelDocument, BackupPlan } from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import { SharedExpensesSection, SharedChecklistSection, SharedJournalsSection, SharedDocumentsSection, SharedMembersSection } from "./components/SharedSections";
import { getIdentity, saveIdentity, UserIdentity } from "../../services/identityService";
import { getAvatarSvg } from "../../utils/avatars";
import { ChatBox } from "./components/ChatBox";
import { WeatherWidget } from "../timeline/WeatherWidget";
import { useWeather } from "../../hooks/useWeather";
import { useCurrentLocationWeather } from "../../hooks/useCurrentLocationWeather";
import { getWeatherIcon, getWeatherText, getWeatherGradient } from "../../services/weatherService";
import { WeatherDetailsModal } from "../timeline/WeatherDetailsModal";
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

  // Weather states
  const { forecast, loading: weatherLoading, error: weatherError } = useWeather(
    data?.trip?.destination || data?.trip?.location,
    data?.trip?.latitude,
    data?.trip?.longitude,
    1
  );
  const { forecast: myForecast, locationName: myLocationName } = useCurrentLocationWeather();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);

  // Packing tip based on GPS vs destination temp
  const packingTip = (() => {
    if (!forecast || !myForecast) return null;
    const destTemp = forecast.current?.temperature ?? ((forecast.temperature_2m_max?.[0] ?? 0) + (forecast.temperature_2m_min?.[0] ?? 0)) / 2;
    const myTemp = myForecast.current?.temperature ?? ((myForecast.temperature_2m_max?.[0] ?? 0) + (myForecast.temperature_2m_min?.[0] ?? 0)) / 2;
    const destCode = forecast.current?.weathercode ?? forecast.weathercode?.[0] ?? 0;
    const myCode = myForecast.current?.weathercode ?? myForecast.weathercode?.[0] ?? 0;
    const diff = destTemp - myTemp;
    const isDestRainy = (destCode >= 51 && destCode <= 67) || (destCode >= 80 && destCode <= 82) || (destCode >= 95 && destCode <= 99);
    const isMyRainy = (myCode >= 51 && myCode <= 67) || (myCode >= 80 && myCode <= 82) || (myCode >= 95 && myCode <= 99);
    if (isDestRainy && !isMyRainy) return { emoji: "🌧️", message: `Điểm đến đang có mưa, đừng quên bỏ ô vào vali!`, color: "bg-sky-500/15 border-sky-400/30 text-white" };
    if (diff <= -7) return { emoji: "🧥", message: `Lạnh hơn nơi bạn ${Math.abs(Math.round(diff))}°C. Nhớ mang áo ấm!`, color: "bg-white/15 border-white/25 text-white" };
    if (diff <= -4) return { emoji: "🧣", message: `Mát hơn nơi bạn ${Math.abs(Math.round(diff))}°C. Mang áo khoác mỏng nhé.`, color: "bg-white/15 border-white/25 text-white" };
    if (diff >= 7) return { emoji: "☀️", message: `Nóng hơn nơi bạn ${Math.round(diff)}°C. Chuẩn bị kem chống nắng!`, color: "bg-amber-500/15 border-amber-400/30 text-white" };
    if (diff >= 4) return { emoji: "🕶️", message: `Ấm hơn nơi bạn ${Math.round(diff)}°C. Đừng quên kính mát.`, color: "bg-orange-500/15 border-orange-400/30 text-white" };
    return null;
  })();

  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const [areBarsVisible, setAreBarsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      if (window.innerWidth >= 768) {
        setAreBarsVisible(true);
        ticking = false;
        return;
      }

      const scrollY = window.scrollY;
      
      if (Math.abs(scrollY - lastScrollY) < 15) {
        ticking = false;
        return;
      }
      
      if (scrollY < 60) {
        setAreBarsVisible(true);
      } else if (scrollY > lastScrollY) {
        setAreBarsVisible(false);
      } else {
        setAreBarsVisible(true);
      }
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("bars-hidden", !areBarsVisible);
  }, [areBarsVisible]);
  
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
            return <span key={i} title="Trưởng nhóm" className="shrink-0"><HugeiconsIcon icon={CrownIcon} className="h-3.5 w-3.5 text-amber-500" /></span>;
          }
          if (roleLower === "quản lý chi phí") {
            return <span key={i} title="Quản lý chi phí" className="shrink-0"><HugeiconsIcon icon={Wallet01Icon} className="h-3.5 w-3.5 text-emerald-500" /></span>;
          }
          if (roleLower === "tài xế") {
            return <span key={i} title="Tài xế" className="shrink-0"><HugeiconsIcon icon={Car01Icon} className="h-3.5 w-3.5 text-blue-500" /></span>;
          }
          if (roleLower === "dẫn đường") {
            return <span key={i} title="Dẫn đường" className="shrink-0"><HugeiconsIcon icon={CompassIcon} className="h-3.5 w-3.5 text-sky-500" /></span>;
          }
          if (roleLower === "phụ trách hành lý") {
            return <span key={i} title="Phụ trách hành lý" className="shrink-0"><HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 text-indigo-500" /></span>;
          }
          if (!roleLower || roleLower === "người đồng hành" || roleLower === "bạn đồng hành" || roleLower === "companion" || roleLower === "member") {
            return <span key={i} title="Người đồng hành" className="shrink-0"><HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5 text-slate-400" /></span>;
          }
          return <span key={i} title={roleLower} className="shrink-0"><HugeiconsIcon icon={BadgeCheckIcon} className="h-3.5 w-3.5 text-teal-500" /></span>;
        })}
      </div>
    );
  };

  // Chat state
  const [showChatBox, setShowChatBox] = useState(false);

  const [activeTab, setActiveTab] = useState<string>("");
  const [checklistSubTab, setChecklistSubTab] = useState<"checklist" | "documents">("checklist");
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  // 2027 Bottom Navigation Bar animation system
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const updateIndicator = () => {
      if (!activeTab) {
        setIndicatorStyle({ left: 0, width: 0 });
        return;
      }
      const activeButton = buttonsRef.current[activeTab];
      const container = containerRef.current;
      if (activeButton && container) {
        const rect = activeButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setIndicatorStyle({
          left: rect.left - containerRect.left,
          width: rect.width
        });
      }
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);

    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
      clearTimeout(timer);
    };
  }, [activeTab]);
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
        setIsBannerVisible(true);
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
    if (data && !hasInitializedTab) {
      const hasChecklist = Boolean(data.includeChecklist);
      const hasDocuments = Boolean(data.includeDocuments);

      if (hasChecklist) {
        setChecklistSubTab("checklist");
      } else if (hasDocuments) {
        setChecklistSubTab("documents");
      }

      // Default active tab initialization (always default to "activities" which is always visible)
      setActiveTab("activities");
      setHasInitializedTab(true);
    }
  }, [data, hasInitializedTab, currentUser]);

  // Stats
  const totalExpense = React.useMemo(() => {
    if (!data) return 0;
    const expenses = data.expenses || [];
    const changeRequests = data.changeRequests || [];
    const list = expenses.filter((e: any) => !e.isDeleted).map((item: any) => {
      const pendingDelete = changeRequests.some((r: any) => r.section === 'expenses' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find((r: any) => r.section === 'expenses' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return { ...item, ...updateReq.after };
      }
      if (pendingDelete) {
        return { ...item, isPendingDelete: true };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter((r: any) => r.section === 'expenses' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach((r: any) => {
      list.push({ ...r.after } as any);
    });

    const activeExpenses = list.filter((e: any) => !e.isPendingDelete);
    return activeExpenses.reduce((acc: number, cur: any) => acc + Number(cur.amount || 0), 0);
  }, [data?.expenses, data?.changeRequests]);

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
            <HugeiconsIcon icon={SecurityWarningIcon} className="h-10 w-10" />
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
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-[#030D2E] text-white px-6 py-2.5 font-bold shadow-sm hover:bg-[#0a1a5c] active:scale-95 transition-all focus:outline-none"
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
  const currentCode = forecast?.current?.weathercode;
  const fallbackBg = status === "past"
    ? "linear-gradient(135deg, #2D1B4E 0%, #4A2C6E 50%, #6B3A8A 100%)"
    : status === "active"
    ? "linear-gradient(135deg, #0F4C81 0%, #1565C0 55%, #1976D2 100%)"
    : "linear-gradient(135deg, #1A3A5C 0%, #1E4976 55%, #2460A7 100%)";

  const heroBg = (forecast && currentCode != null)
    ? getWeatherGradient(currentCode)
    : fallbackBg;

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

  // Navigation Tabs construction (always show enabled categories even if they are empty)
  const tabsList = [
    {id: "activities", label: "Lịch trình", show: true, icon: RouteIcon },
    {id: "journals", label: "Bản tin", show: Boolean(data?.includeJournals), icon: GlobeIcon },
    {id: "expenses", label: "Chi phí", show: Boolean(data?.includeExpenses), icon: Wallet01Icon },
    {id: "checklist", label: "Chuẩn bị", show: Boolean(data?.includeChecklist || data?.includeDocuments), icon: CheckmarkCircle02Icon },
    {id: "members", label: "Thành viên", show: true, icon: UserGroupIcon },
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
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </button>
          )}
          <div className="flex flex-col items-center text-center shrink-0">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              {step === "pin"
                ? <HugeiconsIcon icon={SecurityWarningIcon} className="h-8 w-8" />
                : <HugeiconsIcon icon={UserGroupIcon} className="h-8 w-8" />
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
              <div className="space-y-5">
                <div className="flex gap-3 justify-center py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <input
                      key={i}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      id={`share-pin-digit-${i}`}
                      value={pinInput[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const arr = pinInput.split("").slice(0, 4);
                        arr[i] = val;
                        const newPin = arr.join("").slice(0, 4);
                        setPinInput(newPin);
                        setPinError(false);
                        if (val && i < 3) {
                          const next = document.getElementById(`share-pin-digit-${i+1}`);
                          next?.focus();
                        }
                        if (newPin.length === 4) {
                          if (newPin === data.sharePin) {
                            setStep("identity");
                          } else {
                            setPinError(true);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !pinInput[i] && i > 0) {
                          const prev = document.getElementById(`share-pin-digit-${i-1}`);
                          prev?.focus();
                        }
                      }}
                      className={classNames(
                        "w-12 h-12 rounded-xl border-2 text-center text-[20px] font-black focus:ring-2 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        pinError
                          ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-400 focus:ring-rose-200"
                          : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#030D2E] focus:ring-[#030D2E]/20"
                      )}
                    />
                  ))}
                </div>
                {pinError && (
                  <p className="text-center text-xs font-bold text-rose-500">Mã PIN không chính xác. Vui lòng thử lại.</p>
                )}
                <button
                  disabled={pinInput.length < 4}
                  onClick={() => {
                    if (pinInput === data.sharePin) {
                      setStep("identity");
                    } else {
                      setPinError(true);
                    }
                  }}
                  className="w-full rounded-[16px] bg-[#030D2E] py-3 text-[14px] font-black text-white transition-all active:scale-[0.98] shadow-sm hover:bg-[#0a1a5c] disabled:opacity-50 disabled:pointer-events-none"
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
                          setIsBannerVisible(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-slate-200">
                          {m.avatar ? getAvatarSvg(m.avatar, "w-full h-full") : <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-slate-400" />}
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
                    setIsBannerVisible(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl bg-slate-50/50 shrink-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <HugeiconsIcon icon={GlobeIcon} className="h-4 w-4" />
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
    <div 
      className="min-h-screen bg-kat-bg"
      style={{
        "--sticky-header-offset": areBarsVisible ? "60px" : "0px",
        "--sticky-header-offset-md": areBarsVisible ? "68px" : "0px",
      } as React.CSSProperties}
    >
      {/* Banner */}
      {(isBannerVisible && currentUser && currentUser.canEdit && (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí") || canRequestEdit)) && (
        <div className={classNames(
          "text-white py-2.5 px-4 shadow-md select-none border-b border-white/5",
          (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")) 
            ? "bg-gradient-to-r from-[#003830] via-[#005c56] to-[#004c43]" 
            : "bg-gradient-to-r from-[#0a122c] via-[#0f1d4a] to-[#161330]"
        )}>
          <div className="max-w-[1120px] mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-[12px] font-bold text-white/90">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <HugeiconsIcon icon={PencilEdit01Icon} className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={classNames(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-white/10",
                  (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí"))
                    ? "bg-[#00bfb7]/20 text-[#00bfb7]"
                    : "bg-amber-500/20 text-amber-300"
                )}>
                  {userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")
                    ? "Chỉnh sửa trực tiếp"
                    : "Chế độ Đề xuất"
                  }
                </span>
                <span className="text-white/85 font-medium">
                  {userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")
                    ? `Vai trò "${currentUser?.role}": Bạn có quyền chỉnh sửa trực tiếp phần được phân công.`
                    : "Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt."
                  }
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsBannerVisible(false);
              }}
              className="text-white/40 hover:text-white/85 p-1 rounded-full transition-colors cursor-pointer shrink-0"
              title="Đóng thông báo"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 bg-white/55 supports-[backdrop-filter]:bg-white/45 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 px-2.5 min-[360px]:px-4 pb-3 pt-3 shadow-[0_4px_24px_rgba(3,13,46,0.06)] transition-transform duration-300 ease-in-out ${areBarsVisible ? "translate-y-0" : "-translate-y-full"}`} style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="max-w-[1120px] mx-auto w-full flex items-center justify-between h-9 md:h-11 gap-1.5 min-[360px]:gap-2">
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 select-none shrink-0">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="hidden md:block h-[26px] w-[26px] min-[360px]:h-[28px] min-[360px]:w-[28px] shrink-0 object-contain drop-shadow-sm" />
            <span className="text-[17px] min-[360px]:text-[20px] font-extrabold tracking-tight text-[#030D2E] whitespace-nowrap shrink-0">KAT Journey</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-1.5 min-[360px]:px-2 py-0.5 text-[10px] font-bold text-indigo-600 whitespace-nowrap shrink-0">
              <HugeiconsIcon icon={Share01Icon} className="h-3 w-3 shrink-0" /> Chia sẻ
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
                <HugeiconsIcon icon={UserSettingsIcon} className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{currentUser.name}</span>
              </button>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="flex items-center justify-center min-h-[34px] min-[360px]:min-h-[38px] text-[12px] min-[360px]:text-[13px] font-black text-white bg-[#030D2E] hover:bg-[#0a1a5c] px-4 rounded-xl shadow-sm transition-all active:scale-[0.97] whitespace-nowrap shrink-0"
            >
              Thoát
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1120px] mx-auto px-2.5 min-[360px]:px-4 pt-6 pb-20 sm:pb-6 space-y-6">
        
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
                  <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5 text-white/70" />
                  {trip.destination || "Chưa rõ điểm đến"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-white/70" />
                  {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90">
                  <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 text-white/70" />
                  {durationText}
                </span>
                {trip.mediaLink && (
                  <a href={trip.mediaLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[12px] font-bold backdrop-blur-md border border-sky-400/30 shadow-inner text-sky-100 hover:bg-sky-500/30 transition-colors">
                    <HugeiconsIcon icon={Link02Icon} className="h-3 w-3" />
                    Kho Ảnh Gốc
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-3 shrink-0 w-full sm:w-[290px] md:w-[290px] justify-center md:justify-end">
              {/* Timing box */}
              <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md px-6 py-4 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_16px_rgba(0,0,0,0.1)] w-full text-center shrink-0 min-h-[72px]">
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/10 rounded-full blur-md"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  {status === "past" ? "Trạng thái" : "Hành trình"}
                </p>
                <p className="mt-1.5 text-[22px] font-black text-white drop-shadow-sm tracking-tight leading-none">
                  {timing.label}
                </p>
              </div>

              {/* Weather Widget */}
              {weatherLoading ? (
                 <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 animate-pulse w-full">
                   <div className="w-10 h-10 bg-white/20 rounded-xl"></div>
                   <div className="flex flex-col gap-2">
                     <div className="w-16 h-3 bg-white/20 rounded-full"></div>
                     <div className="w-10 h-3 bg-white/20 rounded-full"></div>
                   </div>
                 </div>
              ) : (!trip.destination?.trim() && !trip.latitude) ? (
                 <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 w-full">
                   <HugeiconsIcon icon={Location01Icon} className="w-6 h-6 text-white/40" />
                   <div className="flex flex-col gap-0.5">
                     <span className="text-white/80 font-bold text-[12px]">Chưa có điểm đến</span>
                     <span className="text-white/50 text-[10px]">Thêm điểm đến để xem thời tiết</span>
                   </div>
                 </div>
              ) : (!trip.latitude || !trip.longitude) ? null : weatherError || !forecast ? (
                 <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-md rounded-3xl p-4 border border-red-500/30 w-full">
                   <HugeiconsIcon icon={CloudRainWindIcon} className="w-6 h-6 text-white/60" />
                   <div className="flex flex-col gap-1">
                     <span className="text-white font-bold text-[12px]">Không thể tải thời tiết</span>
                     <span className="text-white/70 text-[10px]">Lỗi kết nối</span>
                   </div>
                 </div>
              ) : (
                <div
                  onClick={() => setWeatherModalOpen(true)}
                  className="flex flex-col items-stretch bg-white/12 backdrop-blur-md border border-white/25 rounded-3xl p-4 gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:bg-white/18 hover:scale-[1.015] active:scale-[0.985] transition-all duration-300 w-full text-left cursor-pointer select-none"
                >
                  {/* Weather Info Block */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xl min-[360px]:text-4xl font-black text-white drop-shadow-sm tracking-tighter">
                        {Math.round(forecast.current?.temperature || 20)}°
                      </span>
                      <div className="flex flex-col ml-1 flex-shrink-0">
                        <span className="mb-[-4px] flex items-center justify-center h-8">
                          {getWeatherIcon(forecast.current?.weathercode || 0, "w-7 h-7 drop-shadow-md")}
                        </span>
                        <span className="text-[10.5px] min-[360px]:text-[11.5px] font-extrabold text-white/95 uppercase tracking-wide whitespace-nowrap mt-1 drop-shadow-sm">
                          {getWeatherText(forecast.current?.weathercode || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/30 mx-0.5 shrink-0" />
                    <div className="flex flex-col text-right whitespace-nowrap">
                      <span className="text-[11.5px] font-extrabold text-white/95">
                        Cao: {Math.round(forecast.temperature_2m_max[0])}°
                      </span>
                      <span className="text-[11.5px] font-bold text-white/70">
                        Thấp: {Math.round(forecast.temperature_2m_min[0])}°
                      </span>
                    </div>
                  </div>

                  {/* Divider - only visible when packingTip exists */}
                  {packingTip && (
                    <div className="h-px bg-white/15 w-full my-0.5" />
                  )}

                  {/* Packing Tip Block */}
                  {packingTip && (
                    <div className="w-full flex items-center">
                      <p className="text-[12px] font-extrabold text-white/95 leading-normal whitespace-normal break-words">
                        {packingTip.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section
          className={classNames(
            "grid gap-3",
            data.includeExpenses ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {/* Card 1: Lịch trình */}
          <div
            className="rounded-3xl border border-emerald-500/10 bg-white px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mb-3">
              <HugeiconsIcon icon={RouteIcon} className="h-5 w-5" />
            </div>
            <p className="text-[20px] sm:text-[22px] font-black text-[#030D2E] leading-none mb-1">{activities.length}</p>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Lịch trình</p>
          </div>

          {/* Card 2: Chi phí (Conditional) */}
          {data.includeExpenses && (
            <div
              className="rounded-3xl border border-amber-500/10 bg-white px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mb-3">
                <HugeiconsIcon icon={Wallet01Icon} className="h-5 w-5" />
              </div>
              <p className="text-[14px] min-[360px]:text-[16px] sm:text-[18px] font-black text-[#030D2E] leading-none mb-1 px-0.5 break-all">
                {formatMoney(totalExpense)}
              </p>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Chi phí</p>
            </div>
          )}

          {/* Card 3: Thành viên */}
          <div
            className="rounded-3xl border border-blue-500/10 bg-white px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center mb-3">
              <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />
            </div>
            <p className="text-[20px] sm:text-[22px] font-black text-[#030D2E] leading-none mb-1">{members.length}</p>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Thành viên</p>
          </div>
        </section>

        <section className="hidden sm:flex bg-[#030D2E]/5 p-1 rounded-full gap-1 overflow-x-auto scrollbar-none border border-slate-200/20">
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-[13.5px] whitespace-nowrap transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-white text-[#030D2E] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-[#E8E1D8]/30" 
                    : "text-slate-500 hover:text-[#030D2E] hover:bg-white/40"
                )}
              >
                <HugeiconsIcon icon={IconComponent} className={classNames("h-4 w-4 transition-colors", isActive ? "text-[#030D2E]" : "text-slate-500")} />
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Dynamic Section Contents */}
        <div className="space-y-6">
          {!activeTab && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(3,13,46,0.02)] p-6 max-w-md mx-auto animate-fadeIn mt-4 flex flex-col items-center justify-center">
              <HugeiconsIcon icon={CompassIcon} className="w-12 h-12 text-slate-350 mb-3 animate-bounce" />
              <h4 className="text-[16px] font-black text-[#030D2E]">Sẵn sàng khám phá chuyến đi!</h4>
              <p className="text-[12.5px] text-slate-400 font-bold mt-1.5 leading-relaxed">
                Hãy chọn một danh mục ở thanh điều hướng hoặc nhấp vào các thẻ thống kê để xem chi tiết hành trình nhé.
              </p>
            </div>
          )}
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
                        <HugeiconsIcon icon={RouteIcon} className="h-4 w-4" />
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
                              <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5" />
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
                            <HugeiconsIcon icon={ChevronDownIcon} className="w-4 h-4" />
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
                                {mapUrl && <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />}
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
                                <HugeiconsIcon icon={RouteIcon} className="w-4 h-4" />
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
                          <HugeiconsIcon icon={GitBranchIcon} className="h-4 w-4" />
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
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
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
                        <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                        {backupPlansMode === 'edit' ? 'Thêm phương án' : 'Đề xuất phương án'}
                      </button>
                    )}
                  </div>
                )}

                {/* 4. Trip Info context card */}
                <div className="rounded-3xl bg-white p-5 border border-slate-200/50 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#030D2E]/5 text-[#030D2E]">
                      <HugeiconsIcon icon={RouteIcon} className="h-4 w-4" />
                    </span>
                    <h4 className="text-[15px] font-extrabold text-[#030D2E]">Thông tin hành trình</h4>
                  </div>
                  
                  <div className="space-y-3 text-[13.5px] font-semibold text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-100/40 pb-2.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-400" />
                        Điểm đến
                      </span>
                      <span className="font-black text-[#030D2E]">{trip.destination || trip.location || "Chưa xác định"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100/40 pb-2.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                        Thời gian
                      </span>
                      <span className="font-black text-[#030D2E]">
                        {isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={RouteIcon} className="h-4 w-4 text-slate-400" />
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
              trip={trip}
              token={token} 
              mode={expensesMode} 
              expenses={expenses} 
              changeRequests={changeRequests}
              members={members}
              events={activities}
              guestName={currentUser?.name || "Khách"}
            />
          )}

          {activeTab === "checklist" && (
            <div className="space-y-4">
              {/* Sub-tab switcher if both checklist and documents are shared and available */}
              {Boolean(data.includeChecklist && (checklist.length > 0 || canRequestEdit)) && 
               Boolean(data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit)) && (
                <div className="flex justify-center">
                  <div className="bg-slate-100/60 p-1 rounded-xl inline-flex gap-1 border border-slate-200/40 shadow-inner">
                    <button
                      onClick={() => setChecklistSubTab("checklist")}
                      className={classNames(
                        "px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer",
                        checklistSubTab === "checklist"
                          ? "bg-white text-[#030D2E] shadow-[0_2px_6px_rgba(3,13,46,0.06)]"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Chuẩn bị hành lý
                    </button>
                    <button
                      onClick={() => setChecklistSubTab("documents")}
                      className={classNames(
                        "px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer",
                        checklistSubTab === "documents"
                          ? "bg-white text-[#030D2E] shadow-[0_2px_6px_rgba(3,13,46,0.06)]"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Giấy tờ du lịch
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist content */}
              {((checklistSubTab === "checklist" && data.includeChecklist && (checklist.length > 0 || canRequestEdit)) ||
                (!data.includeDocuments || !(travelDocuments.length > 0 || canRequestEdit))) && 
               data.includeChecklist && (checklist.length > 0 || canRequestEdit) && (
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

              {/* Documents content */}
              {((checklistSubTab === "documents" && data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit)) ||
                (!data.includeChecklist || !(checklist.length > 0 || canRequestEdit))) && 
               data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit) && (
                <SharedDocumentsSection 
                  tripId={trip.id}
                  token={token} 
                  mode={documentsMode} 
                  documents={travelDocuments} 
                  changeRequests={changeRequests}
                  guestName={currentUser?.name || "Khách"}
                />
              )}
            </div>
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
            <HugeiconsIcon icon={RouteIcon} className="h-5 w-5 text-[#00BFB7] shrink-0 mt-0.5" />
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
              <HugeiconsIcon icon={RouteIcon} className="h-4 w-4 text-[#00BFB7]" />
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
                    <HugeiconsIcon icon={CheckIcon} className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
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

      <WeatherDetailsModal
        isOpen={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        destination={trip.destination || trip.location || "Điểm đến"}
        forecast={forecast}
        currentLocationForecast={myForecast}
        currentLocationName={myLocationName}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`fixed bottom-5 left-4 right-4 z-40 flex sm:hidden bg-white/55 supports-[backdrop-filter]:bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/45 rounded-[24px] shadow-[0_10px_36px_rgba(3,13,46,0.12)] ring-1 ring-inset ring-white/30 px-2 h-[56px] min-[360px]:h-[60px] items-center justify-around transition-transform duration-300 ease-in-out ${areBarsVisible ? "translate-y-0" : "translate-y-[calc(100%+2.5rem)]"}`}>
        <div ref={containerRef} className="relative w-full h-full flex items-center justify-around">
          {/* Active Indicator Slide Pill */}
          {indicatorStyle.width > 0 && (
            <div 
              className="absolute top-[6px] bottom-[6px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1.1)] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-[#E8E1D8]/45"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`
              }}
            />
          )}
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { buttonsRef.current[tab.id] = el; }}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "relative flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1.1)] overflow-hidden motion-press z-10",
                  isActive 
                    ? "text-[#030D2E] px-3 min-[360px]:px-5 h-11 min-[360px]:h-12 gap-1.5 min-[360px]:gap-2 font-extrabold" 
                    : "text-[#030D2E]/50 hover:text-[#030D2E]/75 w-11 min-[360px]:w-12 h-11 min-[360px]:h-12"
                )}
              >
                <HugeiconsIcon 
                  icon={IconComponent} 
                  className={classNames("h-[19px] w-[19px] min-[360px]:h-[22px] min-[360px]:w-[22px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1.1)]", isActive ? "scale-105" : "scale-100")} 
                />
                {isActive && <span className="text-[12px] min-[360px]:text-[13px] font-bold whitespace-nowrap">{tab.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
