import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  ChevronDownIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { RolesHelpSheet } from "../../components/RolesHelpSheet";
import {} from "../../services/cloudShareService";
import {
  formatDate,
  classNames,
  getTripTiming,
  formatMoney,
  formatMoneyCompact,
  daysBetween,
  formatDateShort,
} from "../../utils/helpers";
import {
  EventItem,
  Expense,
  ChecklistItem,
  Member,
  JournalEntry,
  TravelDocument,
  BackupPlan,
} from "../../db";
import { SharedActivitiesSection } from "./components/SharedActivitiesSection";
import {
  SharedExpensesSection,
  SharedChecklistSection,
  SharedJournalsSection,
  SharedDocumentsSection,
  SharedMembersSection,
} from "./components/SharedSections";
import { getIdentity, saveIdentity, UserIdentity } from "../../services/identityService";
import { getAvatarSvg } from "../../utils/avatars";
import { ChatBox } from "./components/ChatBox";
import { WeatherWidget } from "../timeline/WeatherWidget";
import { useWeather } from "../../hooks/useWeather";
import { useCurrentLocationWeather } from "../../hooks/useCurrentLocationWeather";
import { useScrollBarVisibility } from "../../hooks/useScrollBarVisibility";
import { usePackingTip } from "../../hooks/usePackingTip";
import { getWeatherIcon, getWeatherText, getWeatherGradient } from "../../services/weatherService";
import { useTemperatureUnit } from "../../hooks/useTemperatureUnit";
import { WeatherDetailsModal } from "../timeline/WeatherDetailsModal";
import { BottomSheet, FormActions, Select } from "../../components/ui";
import { SharedBackupPlansSheet } from "./components/SharedBackupPlansSheet";
import { ensureAbsoluteUrl } from "../../utils/mapUtils";

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

import { useTheme } from "../../hooks/useTheme";
import { useSharedTrip } from "../../hooks/useSharedTrip";
import { useSharedTripAuth } from "./hooks/useSharedTripAuth";
import { useSharedTripNavigation } from "./hooks/useSharedTripNavigation";
import { useSharedTripIdentity } from "./hooks/useSharedTripIdentity";

import { SharedTripBanner } from "./components/SharedTripBanner";
import { SharedTripStickyHeader } from "./components/SharedTripStickyHeader";
import { SharedTripMobileNav } from "./components/SharedTripMobileNav";
import { SharedTripPinGate } from "./components/SharedTripPinGate";
import { SharedTripIdentityModal } from "./components/SharedTripIdentityModal";

export default function SharedTripScreen({ token }: { token: string }) {
  const { t } = useTranslation();
  useTheme();
  const {
    enteredPin,
    pinInput,
    pinError,
    setPinError,
    handlePinInput,
    handlePinBackspace,
    confirmPin,
  } = useSharedTripAuth();
  const { data, error, errorCode, loading } = useSharedTrip(token, enteredPin);
  const {
    identityChecked,
    setIdentityChecked,
    currentUser,
    setCurrentUser,
    showIdentityModal,
    setShowIdentityModal,
    step,
    setStep,
    isBannerVisible,
    setIsBannerVisible,
    switchUser,
  } = useSharedTripIdentity(data);

  // Weather states
  const {
    forecast,
    loading: weatherLoading,
    error: weatherError,
  } = useWeather(
    data?.trip?.destination || data?.trip?.location,
    data?.trip?.latitude,
    data?.trip?.longitude,
    1
  );
  const { forecast: myForecast, locationName: myLocationName } = useCurrentLocationWeather();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const { formatTemp } = useTemperatureUnit();

  // Packing tip based on GPS vs destination temp
  const packingTip = usePackingTip(forecast, myForecast);

  const areBarsVisible = useScrollBarVisibility(1024);

  // Identity Modal state
  const [isGlobalBackupOpen, setIsGlobalBackupOpen] = useState(false);
  const [isRolesHelpOpen, setIsRolesHelpOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const renderRoleIcons = (role: string) => {
    const roles = (role || "Người đồng hành")
      .split(",")
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);

    return (
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {roles.map((roleLower, i) => {
          if (
            roleLower === "trưởng nhóm" ||
            roleLower === "trưởng đoàn" ||
            roleLower === "người đại diện" ||
            roleLower === "leader"
          ) {
            return (
              <span key={i} title={t("roles.roleLeader")} className="shrink-0">
                <HugeiconsIcon icon={CrownIcon} className="h-3.5 w-3.5 text-amber-500" />
              </span>
            );
          }
          if (roleLower === "quản lý chi phí") {
            return (
              <span key={i} title={t("roles.roleCostManager")} className="shrink-0">
                <HugeiconsIcon icon={Wallet01Icon} className="h-3.5 w-3.5 text-emerald-500" />
              </span>
            );
          }
          if (roleLower === "tài xế") {
            return (
              <span key={i} title={t("roles.roleDriver")} className="shrink-0">
                <HugeiconsIcon icon={Car01Icon} className="h-3.5 w-3.5 text-blue-500" />
              </span>
            );
          }
          if (roleLower === "dẫn đường") {
            return (
              <span key={i} title={t("roles.roleNavigator")} className="shrink-0">
                <HugeiconsIcon icon={CompassIcon} className="h-3.5 w-3.5 text-sky-500" />
              </span>
            );
          }
          if (roleLower === "hành lý") {
            return (
              <span key={i} title={t("roles.roleLuggage")} className="shrink-0">
                <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 text-indigo-500" />
              </span>
            );
          }
          if (
            !roleLower ||
            roleLower === "người đồng hành" ||
            roleLower === "bạn đồng hành" ||
            roleLower === "companion" ||
            roleLower === "member"
          ) {
            return (
              <span key={i} title={t("roles.roleCompanion")} className="shrink-0">
                <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5 text-slate-400" />
              </span>
            );
          }
          return (
            <span key={i} title={roleLower} className="shrink-0">
              <HugeiconsIcon icon={BadgeCheckIcon} className="h-3.5 w-3.5 text-teal-500" />
            </span>
          );
        })}
      </div>
    );
  };

  // Chat state
  const [showChatBox, setShowChatBox] = useState(false);

  const {
    activeTab,
    setActiveTab,
    checklistSubTab,
    setChecklistSubTab,
    indicatorStyle,
    containerRef,
    setButtonRef,
  } = useSharedTripNavigation(data, currentUser);

  // Dynamic robots tag for SharedTripScreen to prevent SEO indexing of shared trips
  useEffect(() => {
    const robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    robotsMeta.content = "noindex, nofollow";
    document.head.appendChild(robotsMeta);

    return () => {
      if (document.head.contains(robotsMeta)) {
        document.head.removeChild(robotsMeta);
      }
    };
  }, []);
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
      console.error("Error saving trip:", err);
      alert(t("share.saveTripError") || "Cannot save trip. Please check your network connection.");
    }
  };

  const tripDays = data?.trip ? daysBetween(data.trip.startDate, data.trip.endDate) : [];
  const eventDays = data?.activities
    ? Array.from(new Set(data.activities.map((e: any) => e.date)))
    : [];
  const days = Array.from(new Set([...tripDays, ...eventDays]))
    .filter(Boolean)
    .sort() as string[];

  useEffect(() => {
    if (days.length > 0 && !selectedRoadmapDay) {
      setSelectedRoadmapDay(days[0]);
    }
  }, [days, selectedRoadmapDay]);

  useEffect(() => {
    if (errorCode === "invalid_pin" && enteredPin) {
      setPinError(true);
    }
  }, [errorCode, enteredPin]);

  useEffect(() => {
    if (data && data.trip) {
      try {
        const savedRaw = localStorage.getItem("kat_recent_shared_trips");
        let list = savedRaw ? JSON.parse(savedRaw) : [];
        if (!Array.isArray(list)) list = [];

        // Remove existing item with same token
        list = list.filter((item: any) => item.token !== token);

        // Format date display
        const dateParts = data.trip.startDate ? data.trip.startDate.split("-") : [];
        const dateStr =
          dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : data.trip.startDate || "";

        // Add to front
        list.unshift({
          token,
          title: data.trip.title || data.trip.name || "Chuyến đi không tên",
          date: dateStr,
          timestamp: Date.now(),
        });

        // Keep max 3
        list = list.slice(0, 3);

        localStorage.setItem("kat_recent_shared_trips", JSON.stringify(list));
      } catch (e) {
        console.error("Error saving recent shared trip", e);
      }
    }
  }, [data, token]);

  // Stats
  const totalExpense = React.useMemo(() => {
    if (!data) return 0;
    const expenses = data.expenses || [];
    const changeRequests = data.changeRequests || [];
    const list = expenses
      .filter((e: any) => !e.isDeleted)
      .map((item: any) => {
        const pendingDelete = changeRequests.some(
          (r: any) =>
            r.section === "expenses" &&
            r.action === "delete" &&
            String(r.targetId) === String(item.id)
        );
        const updateReq = changeRequests.find(
          (r: any) =>
            r.section === "expenses" &&
            r.action === "update" &&
            String(r.targetId) === String(item.id)
        );

        if (updateReq) {
          return { ...item, ...updateReq.after };
        }
        if (pendingDelete) {
          return { ...item, isPendingDelete: true };
        }
        return item;
      });

    const pendingCreates = changeRequests.filter(
      (r: any) => r.section === "expenses" && r.action === "create" && r.status === "pending"
    );
    pendingCreates.forEach((r: any) => {
      list.push({ ...r.after } as any);
    });

    const activeExpenses = list.filter((e: any) => !e.isPendingDelete);
    return activeExpenses.reduce((acc: number, cur: any) => acc + Number(cur.amount || 0), 0);
  }, [data?.expenses, data?.changeRequests]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0A1124] flex-col gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-kat-primary/30 border-t-kat-primary"></div>
        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">
          {t("share.loadingTrip")}
        </p>
      </div>
    );
  }

  const isPinRequired = errorCode === "invalid_pin" || error === "Mã PIN không đúng.";

  if (error || !data) {
    if (!isPinRequired) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0A1124] p-6">
          <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 animate-fadeIn">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
              <HugeiconsIcon icon={SecurityWarningIcon} className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">
                {t("share.cannotAccessTrip")}
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t("share.linkNotExist")}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-2 leading-relaxed">
                {t("share.askOwnerToReshare")}
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-6 py-2.5 font-bold shadow-sm hover:bg-[#0a1a5c] dark:hover:brightness-110 active:scale-95 transition-all focus:outline-none"
            >
              {t("share.backToHome")}
            </button>
          </div>
        </div>
      );
    }
  }

  if (isPinRequired) {
    return (
      <SharedTripPinGate
        pinInput={pinInput}
        pinError={pinError}
        handlePinInput={handlePinInput}
        handlePinBackspace={handlePinBackspace}
        confirmPin={confirmPin}
        t={t}
      />
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
    changeRequests = [],
  } = data;

  const trip = rawTrip ? { ...rawTrip, title: rawTrip.title || rawTrip.name } : ({} as any);

  const isDayTrip = trip.startDate === trip.endDate;
  let durationText = t("share.sameDay");
  if (!isDayTrip) {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      durationText = t("home.duration", { days: diffDays, nights: diffNights });
    } catch {
      durationText = t("home.longTrip");
    }
  }

  const timing = getTripTiming(trip);

  // Status-aware hero gradient (matches HomeScreen logic)
  const status = timing.status;
  const currentCode = forecast?.current?.weathercode;
  const fallbackBg =
    status === "past"
      ? "linear-gradient(135deg, #2D1B4E 0%, #4A2C6E 50%, #6B3A8A 100%)"
      : status === "active"
        ? "linear-gradient(135deg, #0F4C81 0%, #1565C0 55%, #1976D2 100%)"
        : "linear-gradient(135deg, #1A3A5C 0%, #1E4976 55%, #2460A7 100%)";

  const heroBg = forecast && currentCode != null ? getWeatherGradient(currentCode) : fallbackBg;

  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((c: any) => c.completed).length;
  const checklistPercent = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  let canRequestEdit = (data.mode === "edit" || data.mode === "request_edit") && !data.revoked;
  if (currentUser?.isGuest && !currentUser?.canEdit) {
    canRequestEdit = false;
  }
  if (data.trip?.status === "archived") {
    canRequestEdit = false;
  }

  const isOwnerOrAdmin = currentUser && !currentUser.isGuest;
  const userRoleLower = (currentUser?.role || "").trim().toLowerCase();

  // Helper to translate comma-separated roles for display
  const getTranslatedRoles = (roleStr: string) => {
    if (!roleStr) return "";
    return roleStr
      .split(",")
      .map((r) => r.trim())
      .map((r) => {
        const lower = r.toLowerCase();
        if (
          lower === "trưởng nhóm" ||
          lower === "trưởng đoàn" ||
          lower === "leader" ||
          lower === "người đại diện"
        )
          return t("roles.roleLeader");
        if (lower === "quản lý chi phí") return t("roles.roleCostManager");
        if (lower === "tài xế") return t("roles.roleDriver");
        if (lower === "dẫn đường") return t("roles.roleNavigator");
        if (lower === "hành lý") return t("roles.roleLuggage");
        if (lower === "người đồng hành") return t("roles.roleCompanion");
        return r;
      })
      .join(", ");
  };

  // Mode for Activities (Lịch trình) - Driver or Trưởng nhóm has direct edit
  const activitiesMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("tài xế") ||
    userRoleLower.includes("dẫn đường") ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Expenses (Chi phí) - Cost Manager or Trưởng nhóm has direct edit
  const expensesMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("quản lý chi phí") ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Checklist (Chuẩn bị) - Trưởng nhóm has direct edit
  const checklistMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Backup Plans - Driver or Leader has direct edit
  const backupPlansMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("tài xế") ||
    userRoleLower.includes("dẫn đường") ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Documents (Tài liệu)
  const documentsMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Members (Thành viên)
  const membersMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Mode for Journals (Bản tin)
  const journalsMode =
    isOwnerOrAdmin ||
    userRoleLower.includes("trưởng nhóm") ||
    userRoleLower.includes("trưởng đoàn") ||
    userRoleLower.includes("leader")
      ? "edit"
      : canRequestEdit
        ? "request_edit"
        : "view";

  // Navigation Tabs construction (always show enabled categories even if they are empty)
  const tabsList = [
    { id: "activities", label: t("share.activities"), show: true, icon: RouteIcon },
    {
      id: "journals",
      label: t("share.journals"),
      show: Boolean(data?.includeJournals),
      icon: GlobeIcon,
    },
    {
      id: "expenses",
      label: t("share.expenses"),
      show: Boolean(data?.includeExpenses),
      icon: Wallet01Icon,
    },
    {
      id: "checklist",
      label: t("share.checklist"),
      show: Boolean(data?.includeChecklist || data?.includeDocuments),
      icon: CheckmarkCircle02Icon,
    },
    { id: "members", label: t("share.members"), show: true, icon: UserGroupIcon },
  ].filter((t) => t.show);

  if (showIdentityModal) {
    return (
      <>
        <SharedTripIdentityModal
          currentUser={currentUser}
          trip={trip}
          members={members}
          memberSearchQuery={memberSearchQuery}
          setMemberSearchQuery={setMemberSearchQuery}
          saveIdentity={saveIdentity}
          setCurrentUser={setCurrentUser}
          setShowIdentityModal={setShowIdentityModal}
          setIdentityChecked={setIdentityChecked}
          setIsBannerVisible={setIsBannerVisible}
          setIsRolesHelpOpen={setIsRolesHelpOpen}
          t={t}
          getAvatarSvg={getAvatarSvg}
          renderRoleIcons={renderRoleIcons}
        />
        <RolesHelpSheet isOpen={isRolesHelpOpen} onClose={() => setIsRolesHelpOpen(false)} />
      </>
    );
  }

  return (
    <div
      className="min-h-screen bg-kat-bg dark:bg-[#0A1124]"
      style={
        {
          "--sticky-header-offset": areBarsVisible ? "60px" : "0px",
          "--sticky-header-offset-md": areBarsVisible ? "68px" : "0px",
        } as React.CSSProperties
      }
    >
      {/* Banner */}
      <SharedTripBanner
        isVisible={isBannerVisible}
        onClose={() => setIsBannerVisible(false)}
        canEdit={!!currentUser?.canEdit}
        userRoleLower={userRoleLower}
        canRequestEdit={canRequestEdit}
        t={t}
        getTranslatedRoles={getTranslatedRoles}
        rawRole={currentUser?.role || ""}
      />

      {/* Header */}
      <SharedTripStickyHeader
        areBarsVisible={areBarsVisible}
        currentUser={currentUser}
        onSwitchUser={() => {
          localStorage.setItem("kat_pending_swap_" + trip.id, "true");
          setStep("identity");
          setShowIdentityModal(true);
        }}
        onExit={() => (window.location.href = "/")}
        t={t}
      />

      {/* Main Content */}
      <main className="max-w-[1120px] mx-auto px-2.5 min-[390px]:px-4 pt-6 pb-20 lg:pb-6 space-y-6">
        {/* Hero Card */}
        <section
          className="relative rounded-[32px] p-6 text-white overflow-hidden shadow-xl border border-white/5 group hover:shadow-2xl hover:scale-[1.002] transition-all duration-500 ease-out motion-weather-bg"
          style={{ background: heroBg }}
        >
          {/* Subtle World Map Watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                ●{" "}
                {status === "past"
                  ? t("trip.past")
                  : status === "active"
                    ? t("trip.ongoing")
                    : t("trip.upcoming")}
              </span>
              <h2 className="text-[28px] font-black leading-tight tracking-tight drop-shadow-sm">
                {trip.title}
              </h2>
              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90 max-w-full">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    className="h-3.5 w-3.5 text-white/70 shrink-0"
                  />
                  <span className="truncate">
                    {trip.destination || t("share.unknownDestination")}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90 max-w-full">
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    className="h-3.5 w-3.5 text-white/70 shrink-0"
                  />
                  <span className="truncate">
                    {isDayTrip
                      ? formatDate(trip.startDate)
                      : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium border border-white/10 text-white/90 max-w-full">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    className="h-3.5 w-3.5 text-white/70 shrink-0"
                  />
                  <span className="truncate">{durationText}</span>
                </span>
                {trip.mediaLink && (
                  <a
                    href={trip.mediaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[12px] font-bold backdrop-blur-md border border-sky-400/30 shadow-inner text-sky-100 hover:bg-sky-500/30 transition-colors max-w-full"
                  >
                    <HugeiconsIcon icon={Link02Icon} className="h-3 w-3 shrink-0" />
                    <span className="truncate">{t("share.originalPhotos")}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 w-full lg:w-[250px]">
              {/* Timing box with Progress Bar */}
              <div className="flex flex-col items-stretch justify-center rounded-2xl bg-white/10 px-4 py-3 border border-white/20 flex-1 lg:flex-none lg:w-full text-center shrink-0 min-h-[64px]">
                <p className="text-[10px] font-semibold text-white/60 text-center">
                  {status === "past" ? t("trip.status") : t("trip.journey")}
                </p>
                <p className="mt-1 text-[17px] sm:text-[19px] font-black text-white drop-shadow-sm tracking-tight leading-none text-center">
                  {timing.label}
                </p>
                {status === "active" &&
                  (() => {
                    let progressPercent = 0;
                    try {
                      const start = new Date(trip.startDate).getTime();
                      const end = new Date(trip.endDate).getTime();
                      const now = new Date().getTime();
                      if (end > start) {
                        progressPercent = Math.min(
                          100,
                          Math.max(0, ((now - start) / (end - start)) * 100)
                        );
                      }
                    } catch (e) {
                      console.error(e);
                    }
                    return (
                      <div className="mt-2.5 w-full space-y-1 text-left z-10">
                        <div className="flex items-center justify-between text-[8px] font-bold text-white/70">
                          <span>{t("share.depart")}</span>
                          <span>{t("share.onGoing")}</span>
                          <span>{t("share.end")}</span>
                        </div>
                        <div className="relative h-1.5 w-full rounded-full bg-white/15 overflow-hidden border border-white/10">
                          <div
                            className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.4)] transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 airplane-flight transition-all duration-500"
                            style={{ left: `calc(${progressPercent}% - 6px)` }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-2.5 h-2.5 fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] -rotate-45"
                            >
                              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-[8.5px] text-right text-white/50 font-semibold leading-none">
                          {t("trip.completed")} {Math.round(progressPercent)}%
                        </p>
                      </div>
                    );
                  })()}
                {status === "upcoming" &&
                  (() => {
                    let diffDays = 0;
                    try {
                      const start = new Date(trip.startDate).getTime();
                      const now = new Date().getTime();
                      diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
                    } catch {}
                    const maxCountdown = 30; // Scale relative to 30 days
                    const progressPercent = Math.max(
                      10,
                      Math.min(100, (1 - diffDays / maxCountdown) * 100)
                    );
                    return (
                      <div className="mt-2 w-full space-y-1 text-left z-10">
                        <div className="relative h-1 w-full rounded-full bg-white/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400/80 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Weather Widget */}
              {weatherLoading ? (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-3xl p-3 border border-white/20 animate-pulse flex-1 lg:flex-none lg:w-full">
                  <div className="w-9 h-9 bg-white/20 rounded-xl shrink-0"></div>
                  <div className="flex flex-col gap-2">
                    <div className="w-14 h-3 bg-white/20 rounded-full"></div>
                    <div className="w-10 h-3 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              ) : !trip.destination?.trim() && !trip.latitude ? (
                <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md rounded-3xl p-3 border border-white/10 flex-1 lg:flex-none lg:w-full">
                  <HugeiconsIcon icon={Location01Icon} className="w-5 h-5 text-white/40 shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-white/80 font-bold text-[11px]">
                      {t("share.noDestination")}
                    </span>
                    <span className="text-white/50 text-[10px]">
                      {t("share.addDestinationForWeather")}
                    </span>
                  </div>
                </div>
              ) : !trip.latitude || !trip.longitude ? null : weatherError || !forecast ? (
                <div className="flex items-center gap-2.5 bg-red-500/20 backdrop-blur-md rounded-3xl p-3 border border-red-500/30 flex-1 lg:flex-none lg:w-full">
                  <HugeiconsIcon
                    icon={CloudRainWindIcon}
                    className="w-5 h-5 text-white/60 shrink-0"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-[11px]">
                      {t("share.weatherError")}
                    </span>
                    <span className="text-white/70 text-[10px]">{t("share.connectionError")}</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setWeatherModalOpen(true)}
                  className="flex flex-col items-stretch justify-center bg-white/12 backdrop-blur-md border border-white/25 rounded-3xl p-3 gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:bg-white/18 hover:scale-[1.015] active:scale-[0.985] transition-all duration-300 flex-1 lg:flex-none lg:w-full text-left cursor-pointer select-none"
                >
                  {/* Weather Info Block */}
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 shrink">
                      <span className="text-3xl min-[360px]:text-4xl font-black text-white drop-shadow-sm tracking-tighter shrink-0">
                        {formatTemp(forecast.current?.temperature || 20)}°
                      </span>
                      <div className="flex flex-col ml-1 min-w-0 shrink">
                        <span className="mb-[-4px] flex items-center justify-center h-8 shrink-0">
                          {getWeatherIcon(
                            forecast.current?.weathercode || 0,
                            "w-7 h-7 drop-shadow-md"
                          )}
                        </span>
                        <span className="text-[10px] min-[360px]:text-[11px] font-extrabold text-white/95 uppercase tracking-normal mt-1 drop-shadow-sm truncate text-center">
                          {getWeatherText(forecast.current?.weathercode || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/30 mx-0.5 shrink-0" />
                    <div className="flex flex-col text-right whitespace-nowrap shrink-0">
                      <span className="text-[11px] min-[360px]:text-[11.5px] font-extrabold text-white/95">
                        {t("weather.high")}: {formatTemp(forecast.temperature_2m_max[0])}°
                      </span>
                      <span className="text-[11px] min-[360px]:text-[11.5px] font-bold text-white/70">
                        {t("weather.low")}: {formatTemp(forecast.temperature_2m_min[0])}°
                      </span>
                    </div>
                  </div>

                  {/* Divider - only visible when packingTip exists */}
                  {packingTip && <div className="h-px bg-white/15 w-full my-0.5" />}

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
          className={classNames("grid gap-3", data.includeExpenses ? "grid-cols-3" : "grid-cols-2")}
        >
          {/* Card 1: Lịch trình */}
          <div
            className={classNames(
              "rounded-3xl border px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full",
              activities.length > 0
                ? "border-emerald-500/10 dark:border-emerald-500/25 bg-white dark:bg-kat-surface"
                : "border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10"
            )}
          >
            <div
              className={classNames(
                "w-11 h-11 rounded-2xl flex items-center justify-center mb-3 border",
                activities.length > 0
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50"
              )}
            >
              <HugeiconsIcon icon={RouteIcon} className="h-5 w-5" />
            </div>
            <p
              className={classNames(
                "text-[20px] sm:text-[22px] font-black leading-none mb-1",
                activities.length > 0
                  ? "text-kat-dark dark:text-white"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {activities.length}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-kat-muted mt-1">
              {t("dashboard.itinerary")}
            </p>
          </div>

          {/* Card 2: Chi phí (Conditional) */}
          {data.includeExpenses && (
            <div
              className={classNames(
                "rounded-3xl border px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full",
                totalExpense > 0
                  ? "border-amber-500/10 dark:border-amber-500/25 bg-white dark:bg-kat-surface"
                  : "border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10"
              )}
            >
              <div
                className={classNames(
                  "w-11 h-11 rounded-2xl flex items-center justify-center mb-3 border",
                  totalExpense > 0
                    ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50"
                )}
              >
                <HugeiconsIcon icon={Wallet01Icon} className="h-5 w-5" />
              </div>
              {(() => {
                const formattedFull = formatMoney(totalExpense);
                const formattedDisplay =
                  totalExpense >= 10000000 ? formatMoneyCompact(totalExpense) : formattedFull;
                let sizeClass = "text-[14px] min-[390px]:text-[16px] sm:text-[18px]";
                if (formattedDisplay.length >= 13) {
                  sizeClass =
                    "text-[10px] min-[360px]:text-[11.5px] min-[390px]:text-[13.5px] sm:text-[18px]";
                } else if (formattedDisplay.length >= 10) {
                  sizeClass =
                    "text-[11.5px] min-[360px]:text-[13px] min-[390px]:text-[15px] sm:text-[18px]";
                }
                return (
                  <p
                    className={classNames(
                      `${sizeClass} font-black leading-none mb-1 px-0.5 whitespace-nowrap truncate w-full`,
                      totalExpense > 0
                        ? "text-kat-dark dark:text-white"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                    title={formattedFull}
                  >
                    {formattedDisplay}
                  </p>
                );
              })()}
              <p className="text-[11px] font-semibold text-slate-400 dark:text-kat-muted mt-1">
                {t("dashboard.expenses")}
              </p>
            </div>
          )}

          {/* Card 3: Thành viên */}
          <div
            className={classNames(
              "rounded-3xl border px-2 py-4 sm:p-5 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center select-none w-full",
              members.length > 0
                ? "border-blue-500/10 dark:border-blue-500/25 bg-white dark:bg-kat-surface"
                : "border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10"
            )}
          >
            <div
              className={classNames(
                "w-11 h-11 rounded-2xl flex items-center justify-center mb-3 border",
                members.length > 0
                  ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50"
              )}
            >
              <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />
            </div>
            <p
              className={classNames(
                "text-[20px] sm:text-[22px] font-black leading-none mb-1",
                members.length > 0
                  ? "text-kat-dark dark:text-white"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {members.length}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-kat-muted mt-1">
              {t("dashboard.members")}
            </p>
          </div>
        </section>

        <section className="hidden lg:flex bg-[#030D2E]/5 dark:bg-slate-950/40 p-1 rounded-full gap-1 overflow-x-auto scrollbar-none border border-slate-200/20 dark:border-slate-800/80">
          {tabsList.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  "flex-1 flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-full text-[13.5px] font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-white shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-slate-200/50 dark:border-slate-700/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                )}
              >
                <HugeiconsIcon
                  icon={IconComponent}
                  className={classNames(
                    "w-4 h-4",
                    isActive
                      ? "text-kat-dark dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Dynamic Section Contents */}
        <div className="space-y-6">
          {!activeTab && (
            <div className="text-center py-12 bg-white dark:bg-kat-surface rounded-3xl border border-slate-100 dark:border-kat-border/40 shadow-[0_2px_12px_rgba(3,13,46,0.02)] p-6 max-w-md mx-auto animate-fadeIn mt-4 flex flex-col items-center justify-center">
              <HugeiconsIcon
                icon={CompassIcon}
                className="w-12 h-12 text-slate-350 mb-3 animate-bounce"
              />
              <h4 className="text-[16px] font-black text-kat-dark">{t("share.readyToExplore")}</h4>
              <p className="text-[12.5px] text-slate-400 dark:text-kat-muted font-bold mt-1.5 leading-relaxed">
                {t("share.exploreDesc")}
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
                {/* 1. Trip Info context card */}
                <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 border border-slate-200/50 dark:border-kat-border/40 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-dark/5 dark:bg-slate-800/80 text-kat-dark">
                      <HugeiconsIcon icon={RouteIcon} className="h-4 w-4" />
                    </span>
                    <h4 className="text-[15px] font-extrabold text-kat-dark">
                      {t("share.tripInfo")}
                    </h4>
                  </div>

                  <div className="space-y-3 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-100/40 dark:border-slate-800/20 pb-2.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-400" />
                        {t("share.location")}
                      </span>
                      <span className="font-black text-kat-dark">
                        {trip.destination || trip.location || t("common.unknownLocation")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100/40 dark:border-slate-800/20 pb-2.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                        {t("share.time")}
                      </span>
                      <span className="font-black text-kat-dark">
                        {isDayTrip
                          ? formatDate(trip.startDate)
                          : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-0.5">
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={RouteIcon} className="h-4 w-4 text-slate-400" />
                        {t("share.roadmapItems")}
                      </span>
                      <span className="font-black text-kat-dark">
                        {activities.length} {t("share.itemsCount")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Weather Forecast Widget */}
                <WeatherWidget
                  destination={trip.destination || trip.location}
                  latitude={trip.latitude}
                  longitude={trip.longitude}
                  days={tripDays.length || 3}
                  startDate={trip.startDate}
                />

                {/* 3. Shared General Backup Plans Widget */}
                {data.includeBackupPlans && (
                  <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 border border-slate-200/50 dark:border-kat-border/40 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                          <HugeiconsIcon icon={GitBranchIcon} className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-[15px] font-extrabold text-kat-dark">
                            {t("share.generalBackup")}
                          </h4>
                          <p className="text-[11px] text-slate-500/80 dark:text-slate-400 font-medium">
                            {t("share.applyToWholeTrip")}
                          </p>
                        </div>
                      </div>

                      {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length >
                        0 && (
                        <button
                          onClick={() => setIsGlobalBackupOpen(true)}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-bold text-[12px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {t("share.view")} (
                          {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length})
                        </button>
                      )}
                    </div>

                    {backupPlans.filter((p: BackupPlan) => !p.activityId && !p.date).length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                        {backupPlans
                          .filter((p: BackupPlan) => !p.activityId && !p.date)
                          .map((plan: BackupPlan) => (
                            <div
                              key={plan.id}
                              className="text-[13px] font-semibold text-kat-dark dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl px-3 py-2.5 border border-slate-100/50 dark:border-slate-700/40 flex items-center justify-between gap-2"
                            >
                              <span className="truncate">{plan.title}</span>
                              <button
                                onClick={() => setIsGlobalBackupOpen(true)}
                                className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 shrink-0 text-[12px] font-bold"
                              >
                                {t("share.details")} &rarr;
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-700/40">
                        <p className="text-[12.5px] font-bold text-slate-400 dark:text-slate-500">
                          {t("share.noBackupPlans")}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {t("share.backupPlansDesc")}
                        </p>
                      </div>
                    )}

                    {canRequestEdit && (
                      <button
                        onClick={() => setIsGlobalBackupOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-500/35 text-indigo-600 dark:text-indigo-400 font-bold text-[13px] hover:bg-indigo-50 dark:hover:bg-indigo-950/25 transition-colors motion-press cursor-pointer"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                        {backupPlansMode === "edit" ? t("share.addPlan") : t("share.suggestPlan")}
                      </button>
                    )}
                  </div>
                )}

                {/* 4. Shared Roadmap Widget */}
                {days.length > 0 && (
                  <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 border border-slate-200/50 dark:border-kat-border/40 shadow-[0_2px_12px_rgba(3,13,46,0.02)] space-y-4 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                        <HugeiconsIcon icon={RouteIcon} className="h-4 w-4" />
                      </span>
                      <h4 className="text-[15px] font-extrabold text-kat-dark">
                        {t("share.travelRoadmap")}
                      </h4>
                    </div>

                    {/* Day selector custom pill */}
                    {days.length > 1 && (
                      <div className="pt-1 pb-2">
                        <button
                          type="button"
                          onClick={() => setIsRoadmapDayPickerOpen(true)}
                          className="w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-100/60 dark:border-emerald-900/30 transition-all hover:border-emerald-200 dark:hover:border-emerald-800/40 hover:shadow-sm active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[14px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="text-[10.5px] font-bold text-emerald-600/70 dark:text-emerald-400/80 uppercase tracking-wide mb-0.5">
                                {t("share.viewingDay")}
                              </div>
                              <div className="text-[14.5px] font-extrabold text-kat-dark dark:text-slate-100">
                                {selectedRoadmapDay
                                  ? `${t("share.day")} ${days.indexOf(selectedRoadmapDay) + 1} (${formatDateShort(selectedRoadmapDay)})`
                                  : t("share.selectDay")}
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm transition-transform group-hover:scale-105">
                            <HugeiconsIcon icon={ChevronDownIcon} className="w-4 h-4" />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Roadmap details for selected day */}
                    {(() => {
                      const dayIndex = days.indexOf(selectedRoadmapDay);
                      const dateParts = selectedRoadmapDay ? selectedRoadmapDay.split("-") : [];
                      const dateLabel =
                        dateParts.length === 3
                          ? `${dateParts[2]}/${dateParts[1]}`
                          : selectedRoadmapDay;
                      const mapUrl = (() => {
                        const manual = trip.dayRoadmaps?.[selectedRoadmapDay] || "";
                        if (manual) return manual;
                        const dayActs = activities.filter(
                          (e: any) => e.date === selectedRoadmapDay
                        );
                        const travel = dayActs.find(
                          (e: any) =>
                            e.mapLink && (e.category === "Di chuyển" || e.category === "travel")
                        );
                        const fallback = !travel ? dayActs.find((e: any) => e.mapLink) : null;
                        return (travel || fallback)?.mapLink || "";
                      })();
                      const isAutoMap = !trip.dayRoadmaps?.[selectedRoadmapDay] && !!mapUrl;
                      const isRoute =
                        mapUrl && (mapUrl.includes("/maps/dir/") || mapUrl.includes("maps/dir"));

                      return (
                        <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-kat-border/40 rounded-2xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400">
                            <span>
                              {t("timeline.dayN", { n: dayIndex + 1 })} ({dateLabel})
                            </span>
                            {activitiesMode === "edit" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRoadmapInputLink(mapUrl);
                                  setRoadmapEditDay(selectedRoadmapDay);
                                  setIsRoadmapFormOpen(true);
                                }}
                                className="text-kat-teal hover:opacity-85 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {mapUrl && (
                                  <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                                )}
                                {mapUrl ? t("share.edit") : t("share.add")}
                              </button>
                            )}
                          </div>

                          {mapUrl ? (
                            <div className="space-y-2.5">
                              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-350 flex items-center gap-1.5 flex-wrap">
                                {isRoute ? t("share.roadmapLinkExist") : t("share.mapLinked")}
                                {isAutoMap && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30 text-[10.5px] font-bold text-sky-500 dark:text-sky-400">
                                    {t("share.fromTimeline")}
                                  </span>
                                )}
                              </p>
                              <a
                                href={ensureAbsoluteUrl(mapUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[13.5px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                              >
                                <HugeiconsIcon icon={RouteIcon} className="w-4 h-4" />
                                {t("share.openRoadmap")} &rarr;
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2 text-center py-2">
                              <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500">
                                {t("share.noRoadmap")}
                              </p>
                              {activitiesMode === "edit" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoadmapInputLink("");
                                    setRoadmapEditDay(selectedRoadmapDay);
                                    setIsRoadmapFormOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-750 text-[12px] font-bold text-slate-655 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                                  {t("share.attachRoadmap")}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
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

          {activeTab === "expenses" &&
            data.includeExpenses &&
            (expenses.length > 0 || canRequestEdit) && (
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
                Boolean(
                  data.includeDocuments && (travelDocuments.length > 0 || canRequestEdit)
                ) && (
                  <div className="flex justify-center">
                    <div className="bg-slate-100/60 dark:bg-slate-800/60 p-1 rounded-xl inline-flex gap-1 border border-slate-200/40 dark:border-slate-700/50 shadow-inner">
                      <button
                        onClick={() => setChecklistSubTab("checklist")}
                        className={classNames(
                          "px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer",
                          checklistSubTab === "checklist"
                            ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-slate-100 shadow-[0_2px_6px_rgba(3,13,46,0.06)]"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                      >
                        {t("share.packing")}
                      </button>
                      <button
                        onClick={() => setChecklistSubTab("documents")}
                        className={classNames(
                          "px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer",
                          checklistSubTab === "documents"
                            ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-slate-100 shadow-[0_2px_6px_rgba(3,13,46,0.06)]"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        )}
                      >
                        {t("share.documents")}
                      </button>
                    </div>
                  </div>
                )}

              {/* Checklist content */}
              {((checklistSubTab === "checklist" &&
                data.includeChecklist &&
                (checklist.length > 0 || canRequestEdit)) ||
                !data.includeDocuments ||
                !(travelDocuments.length > 0 || canRequestEdit)) &&
                data.includeChecklist &&
                (checklist.length > 0 || canRequestEdit) && (
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
              {((checklistSubTab === "documents" &&
                data.includeDocuments &&
                (travelDocuments.length > 0 || canRequestEdit)) ||
                !data.includeChecklist ||
                !(checklist.length > 0 || canRequestEdit)) &&
                data.includeDocuments &&
                (travelDocuments.length > 0 || canRequestEdit) && (
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

          {activeTab === "journals" &&
            data.includeJournals &&
            (journals.length > 0 || canRequestEdit) && (
              <SharedJournalsSection
                tripId={trip.id}
                token={token}
                mode={journalsMode}
                journals={journals}
                changeRequests={changeRequests}
                guestName={currentUser?.name || "Khách"}
                members={members}
                renderChatBox={
                  currentUser
                    ? () => (
                        <ChatBox
                          token={token}
                          currentUser={currentUser}
                          inline={true}
                          isReadOnly={!canRequestEdit || data.trip.status === "archived"}
                        />
                      )
                    : undefined
                }
              />
            )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-[13px] font-medium text-slate-400">{t("sharedScreen.secureData")}</p>
        </div>
      </main>

      {/* Roadmap Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapFormOpen}
        onClose={() => setIsRoadmapFormOpen(false)}
        title={`${t("share.travelRoadmap")} - ${t("timeline.dayN", { n: days.indexOf(roadmapEditDay) + 1 })}`}
      >
        <div className="space-y-5 pb-4">
          {/* Instruction card */}
          <div className="flex items-start gap-3 bg-kat-primary-soft border border-kat-teal border-opacity-20 rounded-2xl px-4 py-3">
            <HugeiconsIcon icon={RouteIcon} className="h-5 w-5 text-kat-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-kat-dark">{t("share.pasteMapLink")}</p>
              <p
                className="text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t("share.mapInstruction") }}
              />
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <HugeiconsIcon icon={RouteIcon} className="h-4 w-4 text-kat-teal" />
            </div>
            <input
              type="url"
              value={roadmapInputLink}
              onChange={(e) => setRoadmapInputLink(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text").trim();
                if (pasted && pasted.startsWith("http")) {
                  // Đặt giá trị rồi auto-save sau 1 tick để state kịp cập nhật
                  setTimeout(async () => {
                    if (!roadmapEditDay) return;
                    try {
                      const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
                      currentRoadmaps[roadmapEditDay] = pasted;

                      const { updateSharedTripRoadmaps } =
                        await import("../../services/sharedTripEditService");
                      await updateSharedTripRoadmaps(token, currentRoadmaps);

                      setIsRoadmapFormOpen(false);
                    } catch (err) {
                      console.error("Error saving trip:", err);
                      alert(
                        t("share.saveTripError") ||
                          "Cannot save trip. Please check your network connection."
                      );
                    }
                  }, 50);
                }
              }}
              placeholder="https://www.google.com/maps/dir/..."
              className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800/40 border-2 border-slate-200 dark:border-kat-border rounded-2xl text-[14px] font-semibold text-kat-dark dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-kat-teal focus:ring-2 focus:ring-kat-teal/15 transition-all duration-200"
            />
          </div>

          {/* Test link button – only show when there's input */}
          {roadmapInputLink.trim() && (
            <a
              href={ensureAbsoluteUrl(roadmapInputLink)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-[13.5px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <HugeiconsIcon icon={MapsIcon} className="w-4 h-4" />
              {t("share.openLinkTest")} &rarr;
            </a>
          )}

          <FormActions
            onCancel={() => setIsRoadmapFormOpen(false)}
            onSave={handleSaveRoadmap}
            saveLabel={t("share.saveRoadmap")}
          />
        </div>
      </BottomSheet>

      {/* Custom Roadmap Day Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapDayPickerOpen}
        onClose={() => setIsRoadmapDayPickerOpen(false)}
        title={t("share.selectRoadmapDay")}
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
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-800/40 shadow-sm"
                    : "bg-white hover:bg-slate-50 dark:bg-kat-surface hover:dark:bg-slate-800/40 border border-slate-100 hover:border-slate-200 dark:border-kat-border/40 hover:dark:border-kat-border/70"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={classNames(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <div
                      className={classNames(
                        "text-[15px] font-extrabold",
                        isSelected
                          ? "text-emerald-900 dark:text-emerald-300"
                          : "text-kat-dark dark:text-slate-100"
                      )}
                    >
                      {t("timeline.dayN", { n: idx + 1 })}
                    </div>
                    <div className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(day)}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={CheckIcon}
                      className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                )}
              </button>
            );
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
        destination={trip.destination || trip.location || t("share.location")}
        forecast={forecast}
        currentLocationForecast={myForecast}
        currentLocationName={myLocationName}
      />

      {/* Mobile Bottom Navigation Bar */}
      <SharedTripMobileNav
        areBarsVisible={areBarsVisible}
        containerRef={containerRef}
        indicatorStyle={indicatorStyle}
        tabsList={tabsList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setButtonRef={setButtonRef}
      />

      <RolesHelpSheet isOpen={isRolesHelpOpen} onClose={() => setIsRolesHelpOpen(false)} />
    </div>
  );
}
