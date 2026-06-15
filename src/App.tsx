import { useLiveQuery } from "dexie-react-hooks";
import { Backpack, CalendarDays, Calendar, CheckCircle, Compass, Menu, Plus, WalletCards, Settings, Plane, X, ArrowLeft, Search, Bell, BellRing, ChevronRight, Check, ListTodo, FileText, BookOpenText, Sparkles, Home, User, UserPlus, Heart, LogOut, Cloud, RefreshCw, Coffee, WifiOff, LockKeyhole, Link, MessageCircle } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChecklistItem, db, EventItem, Expense, JournalEntry, Member, PackingItem, Trip } from "./db";

// Components & Helpers
import { FormCard, ScreenTitle, BottomSheet } from "./components/ui";
import { classNames } from "./utils/helpers";
import { TripSearchModal } from "./components/TripSearchModal";
import { GlobalToast } from "./components/ui/ToastManager";
import { useTripReminders } from "./hooks/useTripReminders";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useModalHistory } from "./hooks/useModalHistory";

// Screens
import { HomeScreen } from "./features/home/HomeScreen";
import { TimelineScreen } from "./features/timeline/TimelineScreen";
import { ExpensesScreen } from "./features/expenses/ExpensesScreen";
import { ChecklistScreen } from "./features/checklist/ChecklistScreen";
import { MoreScreen, TripForm } from "./features/more/MoreScreen";
import { TripManagerScreen } from "./features/trips/TripManagerScreen";
import { ArchiveGallery } from "./features/archive/ArchiveGallery";

const SharedTripScreen = React.lazy(() => import("./features/share/SharedTripScreen"));
import { useShareChangeRequests } from "./hooks/useShareChangeRequests";
import { ShareChangeRequestsSheet } from "./features/share/components/ShareChangeRequestsSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ChatBox } from "./features/share/components/ChatBox";
import { useAuth } from "./hooks/useAuth";
import { useCloudBackup } from "./hooks/useCloudBackup";
import { signOutUser } from "./services/authService";
import { useNetworkStatus } from "./hooks/useNetworkStatus";

function NavButton({ 
  isActive, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={classNames(
        "relative flex items-center justify-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden motion-press",
        isActive 
          ? "bg-kat-primary/10 text-kat-primary px-2.5 min-[360px]:px-4 sm:px-5 h-10 min-[360px]:h-[52px] gap-1.5 min-[360px]:gap-2" 
          : "text-kat-text/60 hover:text-kat-text/80 w-10 min-[360px]:w-[52px] h-10 min-[360px]:h-[52px]"
      )}
    >
      <Icon className={classNames("h-[19px] w-[19px] min-[360px]:h-[22px] min-[360px]:w-[22px] shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]", isActive ? "scale-100" : "scale-[0.94]")} strokeWidth={isActive ? 2.5 : 2} />
      {isActive && <span className="text-[12px] min-[360px]:text-[14px] font-bold whitespace-nowrap">{label}</span>}
    </button>
  );
}

function App() {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "expenses" | "checklist" | "more">(() => {
    const saved = localStorage.getItem("kat_active_tab");
    return (saved as any) || "home";
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [moreSection, setMoreSection] = useState<"overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents">("overview");
  const [isAppInboxOpen, setIsAppInboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<"menu" | "auth" | "privacy" | "about" | "donate">("menu");

  const [expenseInitialAddState, setExpenseInitialAddState] = useState<{ date: string; eventId: number } | undefined>(undefined);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sharedLinkInput, setSharedLinkInput] = useState("");
  const [recentSharedTrips, setRecentSharedTrips] = useState<{ token: string; title: string; date: string; timestamp: number }[]>([]);

  React.useEffect(() => {
    if (isImportModalOpen) {
      const saved = localStorage.getItem("kat_recent_shared_trips");
      if (saved) {
        try {
          setRecentSharedTrips(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isImportModalOpen]);

  const parseToken = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (trimmed.includes("/share/")) {
      const parts = trimmed.split("/share/");
      if (parts.length > 1) {
        return parts[1].split("/")[0].split("?")[0];
      }
    }
    return trimmed;
  };

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem("kat_journey_welcome_viewed") !== "true";
  });
  const { user, provider, isAuthenticated, loading: authLoading } = useAuth();
  const syncProps = useCloudBackup();
  const { isAutoBackingUp } = syncProps;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const remindersRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isRemindersOpen && remindersRef.current && !remindersRef.current.contains(event.target as Node)) {
        setIsRemindersOpen(false);
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRemindersOpen, isUserMenuOpen]);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Chỉ tự động hiện màn hình welcome nếu người dùng chưa từng hoàn thành bước chào mừng (hoặc đã đăng xuất)
      if (localStorage.getItem("kat_journey_welcome_viewed") !== "true") {
        setShowWelcome(true);
      }
    }
  }, [isAuthenticated, authLoading]);

  const tripsRaw = useLiveQuery(async () => (await db.trips.toArray()).filter(t => !t.isDeleted && t.status !== 'archived'));
  const tripsLoading = tripsRaw === undefined;
  const trips = tripsRaw ?? [];
  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    const saved = localStorage.getItem("kat_selected_trip_id");
    return saved ? Number(saved) : null;
  });
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isManagingTrips, setIsManagingTrips] = useState<boolean>(() => {
    const saved = localStorage.getItem("kat_is_managing_trips");
    return saved ? saved === "true" : true;
  });
  const [isViewingArchive, setIsViewingArchive] = useState(false);

  React.useEffect(() => {
    localStorage.setItem("kat_active_tab", activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    if (selectedTripId !== null) {
      localStorage.setItem("kat_selected_trip_id", String(selectedTripId));
    } else {
      localStorage.removeItem("kat_selected_trip_id");
    }
  }, [selectedTripId]);

  React.useEffect(() => {
    localStorage.setItem("kat_is_managing_trips", String(isManagingTrips));
  }, [isManagingTrips]);

  // Synchronize global modals with browser back button
  useModalHistory(isImportModalOpen, () => {
    setIsImportModalOpen(false);
    setSharedLinkInput("");
  }, "import-modal");

  useModalHistory(isSearchOpen, () => setIsSearchOpen(false), "search-modal");
  useModalHistory(isRemindersOpen && !isDesktop, () => setIsRemindersOpen(false), "reminders-modal");
  useModalHistory(isAppInboxOpen, () => setIsAppInboxOpen(false), "inbox-modal");
  useModalHistory(isCreatingTrip, () => setIsCreatingTrip(false), "create-trip-modal");
  useModalHistory(isSettingsOpen, () => setIsSettingsOpen(false), "settings-modal");
  useModalHistory(isLogoutConfirmOpen, () => setIsLogoutConfirmOpen(false), "logout-modal");

  // View history state synchronization
  const isPopStateRef = React.useRef(false);
  const lastHistoryStateRef = React.useRef<any>(null);
  const historyDepthRef = React.useRef(0);

  // Clear any dangling hash on boot
  React.useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
  }, []);

  React.useEffect(() => {
    const view = isViewingArchive ? "archive" : (isManagingTrips || !selectedTripId ? "manager" : "trip");
    const initialState = {
      view,
      tripId: selectedTripId,
      activeTab,
      moreSection
    };
    window.history.replaceState(initialState, "");
    lastHistoryStateRef.current = initialState;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.isModal) return;

      const state = event.state;
      if (!state) return;

      isPopStateRef.current = true;

      if (state.view === "manager") {
        setIsManagingTrips(true);
        setIsViewingArchive(false);
        setSelectedTripId(null);
      } else if (state.view === "archive") {
        setIsViewingArchive(true);
        setIsManagingTrips(false);
        setSelectedTripId(null);
      } else if (state.view === "trip") {
        setIsManagingTrips(false);
        setIsViewingArchive(false);
        if (state.tripId !== undefined) setSelectedTripId(state.tripId);
        if (state.activeTab !== undefined) setActiveTab(state.activeTab);
        if (state.moreSection !== undefined) setMoreSection(state.moreSection);
      }

      lastHistoryStateRef.current = state;

      setTimeout(() => {
        isPopStateRef.current = false;
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  React.useEffect(() => {
    if (isPopStateRef.current) return;

    const view = isViewingArchive ? "archive" : (isManagingTrips || !selectedTripId ? "manager" : "trip");
    const currentState = {
      view,
      tripId: selectedTripId,
      activeTab,
      moreSection
    };

    const prevState = lastHistoryStateRef.current;
    if (!prevState) return;

    const viewChanged = prevState.view !== currentState.view;
    const tripChanged = prevState.tripId !== currentState.tripId;
    const tabChanged = prevState.activeTab !== currentState.activeTab;
    const sectionChanged = prevState.moreSection !== currentState.moreSection;

    if (!viewChanged && !tripChanged && !tabChanged && !sectionChanged) {
      return;
    }

    const goingBackToManager = viewChanged && currentState.view === "manager" && prevState.view !== "manager";
    const goingBackToArchive = viewChanged && currentState.view === "archive" && prevState.view === "trip";
    const goingBackToMoreOverview = sectionChanged && currentState.moreSection === "overview" && prevState.moreSection !== "overview";

    if (goingBackToManager || goingBackToArchive || goingBackToMoreOverview) {
      if (historyDepthRef.current > 0) {
        historyDepthRef.current--;
        window.history.back();
        lastHistoryStateRef.current = currentState;
        return;
      }
    }

    let shouldPush = false;

    if (viewChanged || tripChanged) {
      shouldPush = true;
    } else if (currentState.view === "trip") {
      if (tabChanged) {
        if (currentState.activeTab === "more" && currentState.moreSection !== "overview") {
          shouldPush = true;
        } else {
          shouldPush = false;
        }
      } else if (sectionChanged) {
        if (currentState.moreSection !== "overview") {
          shouldPush = true;
        } else {
          shouldPush = false;
        }
      }
    }

    if (shouldPush) {
      window.history.pushState(currentState, "");
      historyDepthRef.current++;
    } else {
      window.history.replaceState(currentState, "");
    }

    lastHistoryStateRef.current = currentState;
  }, [isManagingTrips, isViewingArchive, selectedTripId, activeTab, moreSection]);
  const [successToast, setSuccessToast] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check for share link route
  const pathname = window.location.pathname;
  const isShareRoute = pathname.startsWith("/share/");
  const shareToken = isShareRoute ? pathname.replace("/share/", "") : null;

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  React.useEffect(() => {
    (window as any).showToastGlobal = showToast;
    return () => {
      (window as any).showToastGlobal = undefined;
    };
  }, [showToast]);
  
  const tripId = isCreatingTrip || isManagingTrips || isViewingArchive ? null : (selectedTripId ?? trips[0]?.id ?? null);
  const trip = useLiveQuery(async () => {
    if (!tripId) return undefined;
    const t = await db.trips.get(tripId);
    return t && !t.isDeleted ? t : undefined;
  }, [tripId]);
  const isReadOnly = trip?.status === 'archived';
  const members = useLiveQuery(async () => tripId ? (await db.members.where("tripId").equals(tripId).toArray()).filter(m => !m.isDeleted) : [], [tripId]);
  const events = useLiveQuery(async () => tripId ? (await db.events.where("tripId").equals(tripId).toArray()).filter(e => !e.isDeleted) : [], [tripId]);
  const expenses = useLiveQuery(async () => tripId ? (await db.expenses.where("tripId").equals(tripId).toArray()).filter(e => !e.isDeleted) : [], [tripId]);
  const checklist = useLiveQuery(async () => tripId ? (await db.checklist.where("tripId").equals(tripId).toArray()).filter(c => !c.isDeleted) : [], [tripId]);
  const journals = useLiveQuery(async () => tripId ? (await db.journals.where("tripId").equals(tripId).toArray()).filter(j => !j.isDeleted) : [], [tripId]);
  const packingItems = useLiveQuery(async () => tripId ? (await db.packingItems.where("tripId").equals(tripId).toArray()).filter(p => !p.isDeleted) : [], [tripId]);
  const travelDocuments = useLiveQuery(async () => tripId ? (await db.travelDocuments.where("tripId").equals(tripId).toArray()).filter(d => !d.isDeleted) : [], [tripId]);
  const backupPlans = useLiveQuery(async () => tripId ? (await db.backupPlans.where("tripId").equals(tripId).toArray()).filter(b => !b.isDeleted) : [], [tripId]);

  // Khi tripId có giá trị, chờ tất cả data sẵn sàng trước khi render để tránh flash
  const tripDataLoading = tripId !== null && (
    trip === undefined ||
    members === undefined ||
    events === undefined ||
    expenses === undefined ||
    checklist === undefined ||
    journals === undefined ||
    packingItems === undefined ||
    travelDocuments === undefined ||
    backupPlans === undefined
  );
  const { pendingRequests, activeToken } = useShareChangeRequests(trip);
  const reminders = useTripReminders({ trip, checklist: checklist ?? [], travelDocuments: travelDocuments ?? [], events: events ?? [], backupPlans: backupPlans ?? [], pendingRequestsCount: pendingRequests.length });

  const sharedExpenses = (expenses ?? []).filter(e => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPerson = (members ?? []).length ? totalSharedExpense / (members ?? []).length : 0;

  function navigateToMore(section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents") {
    setMoreSection(section);
    setActiveTab("more");
  }

  function renderReminderItems() {
    if (reminders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-5 text-center bg-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2.5 border border-emerald-100">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <p className="text-[14px] font-bold text-[#030D2E]">Tuyệt vời! Không có nhắc nhở</p>
          <p className="text-[12px] text-slate-500 font-semibold mt-0.5">Hành trình của bạn đã sẵn sàng.</p>
        </div>
      );
    }

    return reminders.map((rem) => {
      let Icon = Bell;
      let colorClasses = "bg-slate-50 text-slate-600 border border-slate-100/50";
      
      switch (rem.tab) {
        case "timeline":
          Icon = Calendar;
          colorClasses = "bg-blue-50 text-blue-600 border border-blue-100/50";
          break;
        case "checklist":
          Icon = ListTodo;
          colorClasses = "bg-amber-50 text-amber-600 border border-amber-100/50";
          break;
        case "expenses":
          Icon = WalletCards;
          colorClasses = "bg-emerald-50 text-emerald-600 border border-emerald-100/50";
          break;
        case "documents":
          Icon = FileText;
          colorClasses = "bg-rose-50 text-rose-600 border border-rose-100/50";
          break;
        case "journal":
          Icon = BookOpenText;
          colorClasses = "bg-violet-50 text-violet-600 border border-violet-100/50";
          break;
        case "wrapped":
          Icon = Sparkles;
          colorClasses = "bg-sky-50 text-sky-600 border border-sky-100/50";
          break;
        case "share_requests" as any:
          Icon = BellRing;
          colorClasses = "bg-rose-50 text-rose-600 border border-rose-100/50";
          break;
      }

      return (
        <button
          key={rem.id}
          className="flex w-full items-center gap-3.5 bg-white p-4 text-left hover:bg-slate-50 transition-colors focus:outline-none"
          onClick={() => {
            setIsRemindersOpen(false);
            if (rem.tab === "share_requests" as any) {
              setIsAppInboxOpen(true);
            } else if (rem.tab === "documents" || rem.tab === "journal" || rem.tab === "wrapped") {
              navigateToMore(rem.tab);
            } else {
              setActiveTab(rem.tab);
            }
          }}
        >
          {/* Leading Icon */}
          <div className={classNames("flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm", colorClasses)}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-slate-700 leading-snug break-words">
              {rem.text}
            </p>
          </div>

          {/* Trailing Icon */}
          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-slate-400" />
        </button>
      );
    });
  }

  if (isShareRoute && shareToken) {
    return (
      <React.Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/30 border-t-kat-primary"></div>
        </div>
      }>
        <SharedTripScreen token={shareToken} />
      </React.Suspense>
    );
  }

  if (showWelcome && !isShareRoute) {
    return <WelcomeScreen onDismiss={() => setShowWelcome(false)} />;
  }

  return (
    <div className="font-sans text-kat-text antialiased selection:bg-kat-primary-light/30 selection:text-kat-text flex flex-col min-h-screen bg-kat-bg">
      <header className="sticky top-0 z-40 bg-kat-bg/90 px-2.5 min-[360px]:px-4 pb-3 pt-3 backdrop-blur-xl border-b border-kat-border shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <GlobalToast />
        <div className="mx-auto flex max-w-[1120px] items-center justify-between h-9 md:h-11">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 select-none">
              <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-[28px] w-[28px] object-contain drop-shadow-sm" />
              <h1 className="text-[17px] min-[360px]:text-[20px] font-extrabold tracking-tight text-kat-text whitespace-nowrap hidden min-[340px]:block">KAT Journey</h1>
            </div>
            
            {/* Desktop Navigation */}
            {!isManagingTrips && tripId && (
              <div className="hidden md:flex ml-6 gap-2 bg-kat-text/5 p-1 rounded-full">
                <button 
                  onClick={() => setActiveTab("home")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "home" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Tổng quan
                </button>
                <button 
                  onClick={() => setActiveTab("timeline")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "timeline" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Lịch trình
                </button>
                <button 
                  onClick={() => setActiveTab("expenses")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "expenses" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Chi phí
                </button>
                <button 
                  onClick={() => setActiveTab("checklist")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "checklist" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Chuẩn bị
                </button>
                <button 
                  onClick={() => {
                    setMoreSection("overview");
                    setActiveTab("more");
                  }}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "more" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Thêm
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {isAutoBackingUp && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 animate-pulse shrink-0" title="Đang tự động sao lưu...">
                <Cloud className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Đang lưu...</span>
              </div>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
              title="Xem chuyến đi qua link chia sẻ"
            >
              <Link className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5" />
            </button>

            {!isManagingTrips && tripId ? (
              <>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                  title="Tìm trong chuyến đi"
                >
                  <Search className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5" />
                </button>

                <div className="relative" ref={remindersRef}>
                  <button
                    onClick={() => setIsRemindersOpen(!isRemindersOpen)}
                    className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                    title="Việc cần chú ý"
                  >
                    {reminders.length > 0 ? (
                      <BellRing className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5 text-amber-500 animate-pulse" />
                    ) : (
                      <Bell className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5" />
                    )}
                  </button>
                  {reminders.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] min-[360px]:text-[10px] font-black text-white ring-2 ring-white pointer-events-none">
                      {reminders.length}
                    </span>
                  )}

                  {/* Popover on Desktop (md and up) */}
                  {isRemindersOpen && isDesktop && (
                    <>
                      {/* Desktop overlay backdrop to close popover on click outside */}
                      
                      <div className="absolute right-0 mt-2.5 z-50 w-[360px] rounded-2xl bg-white border border-slate-200/80 shadow-floating overflow-hidden animate-fadeIn">
                        {/* Popover Header */}
                        <div className="px-5 py-4 border-b border-slate-150/60 bg-[#FFFDF8]">
                          <h4 className="text-[14.5px] font-bold text-[#030D2E] leading-snug">Việc cần chú ý</h4>
                          <p className="text-[11.5px] text-slate-500 font-semibold mt-0.5 leading-normal">Các nhắc nhở quan trọng</p>
                        </div>
                        
                        {/* Popover Content */}
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {renderReminderItems()}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsManagingTrips(true);
                    setIsViewingArchive(false);
                  }}
                  className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                  title="Quay lại danh sách chuyến đi"
                >
                  <Home className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5" />
                </button>
              </>
            ) : (
              isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full overflow-hidden border border-kat-border/60 hover:ring-2 hover:ring-[#00BFB7]/40 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                    title="Menu tài khoản"
                  >
                    {provider === "google" ? (
                      user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-[11px] min-[360px]:text-[13px]">
                          {user.displayName ? user.displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "G"}
                        </div>
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                        <User className="h-4 w-4 min-[360px]:h-[18px] min-[360px]:w-[18px] text-slate-500" />
                      </div>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl bg-white border border-slate-200/80 shadow-floating p-1.5 animate-fadeIn">
                        <div className="px-3.5 py-2.5 border-b border-slate-100/80">
                          <p className="text-[13px] font-black text-[#030D2E] truncate text-left">
                            {provider === "guest" ? "Khách" : (user.displayName || "Tài khoản ẩn danh")}
                          </p>
                          {provider !== "guest" && user.email && (
                            <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5 text-left">
                              {user.email}
                            </p>
                          )}
                        </div>
                        
                        {provider === "guest" ? (
                          <>
                            <div className="py-1 space-y-0.5">
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setSettingsInitialView("auth");
                                  setIsSettingsOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                Hồ sơ & Tài khoản
                              </button>
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setSettingsInitialView("menu");
                                  setIsSettingsOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                                Cài đặt ứng dụng
                              </button>
                            </div>
                            <div className="border-t border-slate-100/80 pt-1 mt-1">
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setIsLogoutConfirmOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-black text-rose-650 hover:bg-rose-50 transition-colors"
                              >
                                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                                Thoát Khách
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="py-1 space-y-0.5">
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setSettingsInitialView("auth");
                                  setIsSettingsOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                Hồ sơ & Tài khoản
                              </button>
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setSettingsInitialView("menu");
                                  setIsSettingsOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                                Cài đặt ứng dụng
                              </button>
                            </div>
                            <div className="border-t border-slate-100/80 pt-1 mt-1">
                              <button
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  setIsLogoutConfirmOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-black text-rose-650 hover:bg-rose-50 transition-colors"
                              >
                                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                                Đăng xuất
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex h-8 w-8 min-[360px]:h-9 min-[360px]:w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                  title="Cài đặt"
                >
                  <Settings className="h-4 w-4 min-[360px]:h-[18px] min-[360px]:w-[18px]" />
                </button>
            )
          )}
        </div>
        </div>
      </header>

      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-sm animate-fadeIn z-40 relative">
          <WifiOff className="w-4 h-4 shrink-0" />
          <div className="text-[13px] font-bold">
            {t("offline_warning")} <span className="hidden sm:inline font-medium"> - {t("offline_desc")}</span>
          </div>
        </div>
      )}

      {syncProps.hasCloudVersion && (
        <div className="max-w-[1120px] mx-auto mt-4 mb-2 px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/40 shadow-sm p-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Background decorative blob */}
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/5 rounded-full blur-xl"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>

            <div className="relative flex items-center gap-2.5 z-10 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-blue-50 text-blue-600">
                <Cloud className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-extrabold text-slate-800 leading-tight">Đã tìm thấy bản cập nhật mới</h3>
                <p className="text-[12px] text-slate-500 mt-0.5 font-semibold leading-none truncate hidden sm:block">Có dữ liệu mới nhất từ thiết bị khác của bạn.</p>
              </div>
            </div>
            
            <button
              onClick={async () => {
                try {
                  await syncProps.restoreNow("merge");
                  syncProps.setHasCloudVersion(false);
                  showToast("Đã cập nhật dữ liệu mới từ thiết bị khác.");
                } catch (e: any) {
                  showToast("Khôi phục thất bại: " + e.message);
                }
              }}
              disabled={syncProps.isSyncing}
              className="relative z-10 shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:pointer-events-none"
            >
              {syncProps.isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đồng bộ ngay
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isReadOnly && !isManagingTrips && !isViewingArchive && !isCreatingTrip && (
        <div className="max-w-[1120px] mx-auto mt-4 px-4 md:px-6 animate-fadeIn">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-100/80 border border-stone-200/70">
            <LockKeyhole className="w-3.5 h-3.5 text-stone-400 shrink-0" strokeWidth={2.5} />
            <p className="text-[12.5px] text-stone-500 leading-snug">
              Chuyến đi đã kết thúc &mdash; chỉ xem, không chỉnh sửa.
            </p>
          </div>
        </div>
      )}

      <main className={classNames(
        "mx-auto flex flex-1 w-full max-w-[1120px] flex-col",
        (!isManagingTrips && tripId) ? "pb-24 md:pb-12" : (isManagingTrips && trips?.length === 0 && !isViewingArchive && !isCreatingTrip) ? "pb-0" : "pb-12"
      )}>
        <div className={classNames(
          "flex-1 px-4 md:px-6 flex flex-col",
          (isManagingTrips && trips?.length === 0 && !isViewingArchive && !isCreatingTrip) ? "py-0" : "py-6 md:py-8"
        )}>
          {tripsLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
            </div>
          ) : isViewingArchive ? (
            <div key="archive" className="motion-page-enter">
              <ArchiveGallery
                onBack={() => { setIsViewingArchive(false); setIsManagingTrips(true); }}
                onOpenTrip={(id) => {
                  setSelectedTripId(id);
                  setIsViewingArchive(false);
                  setIsManagingTrips(false);
                }}
              />
            </div>
          ) : isManagingTrips || !tripId ? (
            <div key="manager" className={classNames("motion-page-enter", (isManagingTrips && trips?.length === 0) ? "flex-1 flex flex-col" : "")}>
              <TripManagerScreen
                trips={trips}
                onOpenTrip={(id) => {
                  setSelectedTripId(id);
                  setIsManagingTrips(false);
                }}
                onCreateNew={() => {
                  setIsCreatingTrip(true);
                }}
                onOpenArchive={() => {
                  setIsManagingTrips(false);
                  setIsViewingArchive(true);
                }}
                onShowToast={showToast}
              />
            </div>
          ) : tripDataLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
            </div>
          ) : trip && tripId ? (
            <div key={activeTab} className="motion-page-enter">
              {activeTab === "home" && <HomeScreen trip={trip} members={members ?? []} events={events ?? []} expenses={expenses ?? []} checklist={checklist ?? []} travelDocuments={travelDocuments ?? []} totalExpense={totalExpense} perPerson={perPerson} onNavigateTab={setActiveTab} onNavigateMore={navigateToMore} onOpenInbox={() => setIsAppInboxOpen(true)} isReadOnly={isReadOnly} />}
              {activeTab === "timeline" && <TimelineScreen trip={trip} events={events ?? []} expenses={expenses ?? []} onAddExpense={(date, eventId) => { setExpenseInitialAddState({ date, eventId }); setActiveTab("expenses"); }} isReadOnly={isReadOnly} />}
              {activeTab === "expenses" && <ExpensesScreen expenses={expenses ?? []} members={members ?? []} totalExpense={totalExpense} perPerson={perPerson} tripId={tripId} events={events ?? []} initialAddState={expenseInitialAddState} onClearInitialAddState={() => setExpenseInitialAddState(undefined)} isReadOnly={isReadOnly} />}
              {activeTab === "checklist" && <ChecklistScreen checklist={checklist ?? []} tripId={tripId} isReadOnly={isReadOnly} />}
              {activeTab === "more" && <MoreScreen trip={trip} members={members ?? []} events={events ?? []} expenses={expenses ?? []} checklist={checklist ?? []} journals={journals ?? []} packingItems={packingItems ?? []} travelDocuments={travelDocuments ?? []} onTripDeleted={() => { setSelectedTripId(null); setIsManagingTrips(true); showToast("Đã xóa chuyến đi khỏi danh sách."); }} onTripSelected={setSelectedTripId} onShowToast={showToast} section={moreSection} setSection={setMoreSection} onOpenInbox={() => setIsAppInboxOpen(true)} isReadOnly={isReadOnly} onOpenSettings={(view) => { setSettingsInitialView(view ?? "menu"); setIsSettingsOpen(true); }} />}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          )}
        </div>
      </main>



      {!isManagingTrips && tripId && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-[520px] flex h-[68px] items-center justify-between px-2.5 min-[360px]:px-6">
            <NavButton
              isActive={activeTab === "home"}
              onClick={() => setActiveTab("home")}
              icon={Compass}
              label="Tổng quan"
            />
            <NavButton
              isActive={activeTab === "timeline"}
              onClick={() => setActiveTab("timeline")}
              icon={CalendarDays}
              label="Lịch trình"
            />
            <NavButton
              isActive={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              icon={WalletCards}
              label="Chi phí"
            />
            <NavButton
              isActive={activeTab === "checklist"}
              onClick={() => setActiveTab("checklist")}
              icon={CheckCircle}
              label="Chuẩn bị"
            />
            <NavButton
              isActive={activeTab === "more"}
              onClick={() => {
                setMoreSection("overview");
                setActiveTab("more");
              }}
              icon={Menu}
              label="Thêm"
            />
          </div>
        </nav>
      )}

      {successToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[420px] motion-toast-enter">
          <div className="bg-[#030D2E] text-white px-5 py-3 rounded-2xl shadow-floating flex items-center justify-between gap-4 border border-[#E8E1D8]/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-kat-primary/20 text-kat-primary">
                <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
              </div>
              <span className="text-[14px] font-bold tracking-wide text-sand">Đã tạo chuyến đi thành công</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => {
                  setSelectedTripId(successToast);
                  setIsManagingTrips(false);
                  setSuccessToast(null);
                }}
                className="text-kat-primary font-extrabold text-[14px] hover:text-[#00BFB7]/80 transition-colors whitespace-nowrap"
              >
                Xem chi tiết
              </button>
              <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[400px] pointer-events-none motion-toast-enter">
          <div className="bg-[#030D2E] text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 border border-slate-200/10">
            <span className="text-[14px] font-bold text-center leading-snug">{toastMessage}</span>
          </div>
        </div>
      )}

      {(syncProps.isSyncing || syncProps.isAutoSyncingUI) && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 animate-fadeIn pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 text-white shadow-lg backdrop-blur-sm border border-white/10 text-[12px] font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00BFB7] shrink-0" />
            <span>Đang đồng bộ từ Cloud...</span>
          </div>
        </div>
      )}

      {tripId && (
        <TripSearchModal 
          tripId={tripId}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigateTab={setActiveTab}
          onNavigateMore={navigateToMore}
        />
      )}

      {/* Bottom Sheet on Mobile only */}
      {isRemindersOpen && !isDesktop && (
        <BottomSheet
          isOpen={isRemindersOpen}
          onClose={() => setIsRemindersOpen(false)}
          title="Việc cần chú ý"
          subtitle="Các nhắc nhở quan trọng"
        >
          <div className="divide-y divide-slate-100 -mx-5 -mb-4 mt-1 border-t border-slate-100">
            {renderReminderItems()}
          </div>
        </BottomSheet>
      )}

      {activeToken && tripId && (
        <ShareChangeRequestsSheet
          isOpen={isAppInboxOpen}
          onClose={() => setIsAppInboxOpen(false)}
          token={activeToken}
          requests={pendingRequests}
          members={members ?? []}
        />
      )}

      {isCreatingTrip && (
        <TripForm
          isOpen={isCreatingTrip}
          onClose={() => setIsCreatingTrip(false)}
          onSaved={(id) => {
            setIsCreatingTrip(false);
            setSuccessToast(id);
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialView={settingsInitialView}
        syncProps={syncProps}
        onTripSelected={(id) => {
          setSelectedTripId(id);
          setIsManagingTrips(false);
        }}
      />

      <BottomSheet
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Đăng xuất tài khoản?"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#FFFDF8] border border-[#E8E1D8] p-4 text-[13.5px] text-slate-650 font-normal leading-relaxed text-left">
            Bạn sắp đăng xuất khỏi thiết bị này. Đừng lo, toàn bộ dữ liệu đã sao lưu trên <strong className="font-semibold text-slate-800">Cloud</strong> vẫn được giữ <strong className="font-semibold text-slate-800">an toàn</strong>.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsLogoutConfirmOpen(false);
                localStorage.removeItem("kat_journey_welcome_viewed");
                localStorage.removeItem("kat_auth_mode");
                setShowWelcome(true);
                await signOutUser();
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 active:scale-[0.98] transition-all duration-200 motion-press"
            >
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setSharedLinkInput("");
        }}
        title="Xem chuyến đi được chia sẻ"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-605 block">
              Nhập liên kết chia sẻ chuyến đi
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={sharedLinkInput}
                onChange={(e) => setSharedLinkInput(e.target.value)}
                placeholder="Dán link chuyến đi được chia sẻ..."
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 h-[50px] text-[15px] font-bold text-[#030D2E] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#00BFB7] focus:border-transparent placeholder:text-slate-400"
              />
              <button
                onClick={() => {
                  const token = parseToken(sharedLinkInput);
                  if (token) {
                    window.location.href = "/share/" + token;
                  } else {
                    showToast("Liên kết không hợp lệ. Vui lòng thử lại!");
                  }
                }}
                className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-[14px] bg-[#030D2E] hover:bg-[#030D2E]/90 text-white px-6 font-black active:scale-[0.98] transition-all duration-200"
              >
                Xem ngay
              </button>
            </div>
          </div>

          {recentSharedTrips.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-400">
                Lịch sử xem gần đây
              </h4>
              <div className="space-y-2">
                {recentSharedTrips.map((trip) => (
                  <div
                    key={trip.token}
                    onClick={() => {
                      window.location.href = "/share/" + trip.token;
                    }}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-[#FFFDF8] hover:bg-slate-50 hover:border-[#00BFB7]/20 cursor-pointer active:scale-[0.99] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00BFB7]/10 text-[#00BFB7]">
                        <Plane className="h-5 w-5 -rotate-45" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[14.5px] font-extrabold text-[#030D2E] truncate group-hover:text-[#00BFB7] transition-colors">
                          {trip.title}
                        </p>
                        <p className="text-[12px] font-semibold text-slate-400 mt-0.5">
                          Khởi hành: {trip.date}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#00BFB7] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

export default App;
