import { useLiveQuery } from "dexie-react-hooks";
import { useViewTransition } from "./hooks/useViewTransition";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Link01Icon,
  UserIcon,
  Search01Icon,
  Notification01Icon,
  NotificationBubbleIcon,
  Home01Icon,
  CompassIcon,
  Calendar01Icon,
  WalletCardsIcon,
  CheckmarkCircle02Icon,
  Menu01Icon,
  CheckListIcon,
  File01Icon,
  Globe02Icon,
  SparklesIcon,
  ChevronRightIcon,
  Settings01Icon,
  Logout01Icon,
  WifiOffIcon,
  LockIcon,
  Cancel01Icon,
  CheckIcon,
  CloudIcon,
  RefreshIcon,
  Airplane01Icon,
} from "@hugeicons/core-free-icons";
import React, { useEffect, useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "./lib/motion";
import {
  ChecklistItem,
  db,
  EventItem,
  Expense,
  JournalEntry,
  Member,
  PackingItem,
  Trip,
} from "./db";

// Components & Helpers
import { FormCard, ScreenTitle, BottomSheet } from "./components/ui";
import { classNames } from "./utils/helpers";
import { TripSearchModal } from "./components/modals/TripSearchModal";
import { GlobalToast } from "./components/ui/ToastManager";
import { useTripReminders } from "./hooks/useTripReminders";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useModalHistory } from "./hooks/useModalHistory";
import { useAppNavigation } from "./hooks/useAppNavigation";
import { useTripData } from "./hooks/useTripData";
import { ReloadPrompt } from "./components/ReloadPrompt";

// Screens
import { HomeScreen } from "./features/home/HomeScreen";
const TimelineScreen = React.lazy(() =>
  import("./features/timeline/TimelineScreen").then((m) => ({ default: m.TimelineScreen }))
);
const ExpensesScreen = React.lazy(() =>
  import("./features/expenses/ExpensesScreen").then((m) => ({ default: m.ExpensesScreen }))
);
const ChecklistScreen = React.lazy(() =>
  import("./features/checklist/ChecklistScreen").then((m) => ({ default: m.ChecklistScreen }))
);
const MoreScreen = React.lazy(() =>
  import("./features/more/MoreScreen").then((m) => ({ default: m.MoreScreen }))
);
const TripForm = React.lazy(() =>
  import("./features/more/MoreScreen").then((m) => ({ default: m.TripForm }))
);
import { TripManagerScreen } from "./features/trips/TripManagerScreen";
import { ArchiveGallery } from "./features/archive/ArchiveGallery";

const SharedTripScreen = React.lazy(() => import("./features/share/SharedTripScreen"));
import { useShareChangeRequests } from "./hooks/useShareChangeRequests";
import { ShareChangeRequestsSheet } from "./features/share/components/ShareChangeRequestsSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { ImportTripSheet } from "./components/modals/ImportTripSheet";
import { SplashScreen } from "./components/SplashScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ChatBox } from "./features/share/components/ChatBox";
import { useAuth } from "./hooks/useAuth";
import { useCloudBackup } from "./hooks/useCloudBackup";
import { signOutUser } from "./services/authService";
import { updateShareLink } from "./services/cloudShareService";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useScrollBarVisibility } from "./hooks/useScrollBarVisibility";
import { useTheme } from "./hooks/useTheme";
import { useAutoSync } from "./hooks/useAutoSync";

import { NavButton } from "./components/ui/NavButton";

function App() {
  const { startViewTransition } = useViewTransition();
  const { t } = useTranslation();
  useTheme();
  const isOnline = useNetworkStatus();
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const {
    activeTab,
    setActiveTab,
    moreSection,
    setMoreSection,
    setMoreSectionRaw,
    selectedTripId,
    setSelectedTripId,
    isManagingTrips,
    setIsManagingTrips,
    isViewingArchive,
    setIsViewingArchive,
    navigateToMore,
    lastHistoryStateRef,
  } = useAppNavigation();

  const deferredActiveTab = React.useDeferredValue(activeTab);

  // Handle PWA Shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get("shortcut");
    if (shortcut === "new_trip") {
      setIsManagingTrips(true);
      setIsCreatingTrip(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (shortcut === "archive") {
      setIsViewingArchive(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [setIsManagingTrips, setIsViewingArchive]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // moreSection managed by useAppNavigation
  const [isAppInboxOpen, setIsAppInboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<
    "menu" | "auth" | "privacy" | "about" | "donate"
  >("menu");

  const [expenseInitialAddState, setExpenseInitialAddState] = useState<
    { date: string; eventId: number } | undefined
  >(undefined);

  const areBarsVisible = useScrollBarVisibility(1024);

  // 2027 Bottom Navigation Bar animation system (Refactored to Framer Motion layoutId)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem("kat_journey_welcome_viewed") !== "true";
  });
  const { user, provider, isAuthenticated, loading: authLoading } = useAuth();
  const syncProps = useCloudBackup();
  const { isAutoBackingUp } = syncProps;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Shared destination index for weather widgets across tabs
  const [selectedDestIndex, setSelectedDestIndex] = useState(0);

  // Reset dest index when trip changes
  useEffect(() => {
    setSelectedDestIndex(0);
  }, [selectedTripId]);

  const remindersRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Chỉ tự động đóng Popover nhắc nhở trên Desktop.
      // Trên Mobile (khi dùng BottomSheet), BottomSheet sẽ tự bắt sự kiện bấm ra ngoài thông qua Backdrop overlay.
      // Nếu không, sự kiện mousedown sẽ làm BottomSheet unmount trước khi click kịp xảy ra!
      if (
        isRemindersOpen &&
        isDesktop &&
        remindersRef.current &&
        !remindersRef.current.contains(event.target as Node)
      ) {
        setIsRemindersOpen(false);
      }
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRemindersOpen, isUserMenuOpen]);

  // Dọn dẹp các tham số lỗi OAuth trên URL để thanh địa chỉ luôn sạch sẽ
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
      url.search = "";
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        // Tự động ẩn màn hình chào mừng và lưu trạng thái khi đã đăng nhập thành công
        localStorage.setItem("kat_journey_welcome_viewed", "true");
        if (provider) {
          localStorage.setItem("kat_auth_mode", provider);
        }
        setShowWelcome(false);
      } else {
        // Chỉ tự động hiện màn hình welcome nếu người dùng chưa từng hoàn thành bước chào mừng (hoặc đã đăng xuất)
        if (localStorage.getItem("kat_journey_welcome_viewed") !== "true") {
          setShowWelcome(true);
        }
      }
    }
  }, [isAuthenticated, authLoading, provider]);

  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const {
    allTripsRaw,
    tripsLoading,
    trips,
    tripId,
    trip,
    isReadOnly,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans,
    tripDataLoading,
  } = useTripData(selectedTripId, isCreatingTrip, isManagingTrips, isViewingArchive);

  // Handle PWA Shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get("shortcut");
    if (shortcut === "new_trip") {
      setIsManagingTrips(true);
      setIsCreatingTrip(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (shortcut === "archive") {
      setIsViewingArchive(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [setIsManagingTrips, setIsViewingArchive]);

  // Local storage sync managed by useAppNavigation

  // Vòng đời màn hình Splash (2027 Premium Motion transition)
  React.useEffect(() => {
    if (!authLoading && !tripsLoading) {
      const timer = setTimeout(() => {
        setIsSplashFading(true);
        const exitTimer = setTimeout(() => {
          setShowSplash(false);
        }, 450);
        return () => clearTimeout(exitTimer);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [authLoading, tripsLoading]);

  // Synchronize global modals with browser back button

  useModalHistory(isSearchOpen, () => setIsSearchOpen(false), "search-modal");
  useModalHistory(
    isRemindersOpen && !isDesktop,
    () => setIsRemindersOpen(false),
    "reminders-modal"
  );
  useModalHistory(isAppInboxOpen, () => setIsAppInboxOpen(false), "inbox-modal");
  useModalHistory(isCreatingTrip, () => setIsCreatingTrip(false), "create-trip-modal");
  useModalHistory(isSettingsOpen, () => setIsSettingsOpen(false), "settings-modal");
  useModalHistory(isLogoutConfirmOpen, () => setIsLogoutConfirmOpen(false), "logout-modal");

  // History ref managed by useAppNavigation

  // Initialize deep links for query param based modals
  React.useEffect(() => {
    // We can still clear legacy dangling hashes to be safe
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search
      );
    }

    const url = new URL(window.location.href);
    const modalParam = url.searchParams.get("modal");

    if (modalParam) {
      // Create a base history entry so hitting back closes the modal instead of exiting app
      const baseUrl = new URL(window.location.href);
      baseUrl.searchParams.delete("modal");
      window.history.replaceState(window.history.state, "", baseUrl.toString());
      window.history.pushState({ isModal: true, modalHash: modalParam }, "", url.toString());

      // Open the corresponding global modal
      switch (modalParam) {
        case "settings-modal":
          setIsSettingsOpen(true);
          break;
        case "search-modal":
          setIsSearchOpen(true);
          break;
        case "inbox-modal":
          setIsAppInboxOpen(true);
          break;
        case "reminders-modal":
          setIsRemindersOpen(true);
          break;
        case "create-trip-modal":
          setIsCreatingTrip(true);
          break;
      }
    }
  }, []);

  // History sync managed by useAppNavigation
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

  // If trips have loaded and selectedTripId no longer exists (deleted), fall back to manager
  React.useEffect(() => {
    if (!tripsLoading && !isManagingTrips && !isViewingArchive && selectedTripId !== null) {
      const exists = (allTripsRaw ?? []).some((t) => t.id === selectedTripId);
      if (!exists) {
        setSelectedTripId(null);
        setIsManagingTrips(true);
      }
    }
  }, [tripsLoading, allTripsRaw, selectedTripId, isManagingTrips, isViewingArchive]);
  const { pendingRequests, activeToken } = useShareChangeRequests(trip);
  const reminders = useTripReminders({
    trip,
    checklist: checklist ?? [],
    travelDocuments: travelDocuments ?? [],
    events: events ?? [],
    backupPlans: backupPlans ?? [],
    pendingRequestsCount: pendingRequests.length,
  });

  // --- BADGING API INTEGRATION ---
  useEffect(() => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      if (reminders.length > 0) {
        navigator.setAppBadge(reminders.length).catch((err) => {
          console.error("[Badging API] Error setting app badge:", err);
        });
      } else {
        navigator.clearAppBadge().catch((err) => {
          console.error("[Badging API] Error clearing app badge:", err);
        });
      }
    }
  }, [reminders.length]);

  const sharedExpenses = (expenses ?? []).filter((e) => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const totalExpense = (expenses ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPerson = (members ?? []).length ? totalSharedExpense / (members ?? []).length : 0;

  // --- AUTO SYNC FOR SHARED TRIP ---
  const { isAutoSyncing, lastSyncedAt } = useAutoSync({
    trip,
    isReadOnly,
    members,
    events,
    expenses,
    checklist,
    journals,
    backupPlans,
    travelDocuments,
  });
  // --- END AUTO SYNC ---

  // navigateToMore managed by useAppNavigation

  function renderReminderItems() {
    if (reminders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-5 text-center bg-white dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mb-2.5 border border-emerald-100 dark:border-emerald-900/30">
            <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" strokeWidth={3} />
          </div>
          <p className="text-[14px] font-bold text-kat-dark">Tuyệt vời! Không có nhắc nhở</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Hành trình của bạn đã sẵn sàng.
          </p>
        </div>
      );
    }

    return reminders.map((rem) => {
      let icon = Notification01Icon;
      let colorClasses =
        "bg-slate-50 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-transparent";

      switch (rem.tab) {
        case "timeline":
          icon = Calendar01Icon;
          colorClasses =
            "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-transparent";
          break;
        case "checklist":
          icon = CheckListIcon;
          colorClasses =
            "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-transparent";
          break;
        case "expenses":
          icon = WalletCardsIcon;
          colorClasses =
            "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-transparent";
          break;
        case "documents":
          icon = File01Icon;
          colorClasses =
            "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-transparent";
          break;
        case "journal":
          icon = Globe02Icon;
          colorClasses =
            "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-transparent";
          break;
        case "wrapped":
          icon = SparklesIcon;
          colorClasses =
            "bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-transparent";
          break;
        case "share_requests" as any:
          icon = NotificationBubbleIcon;
          colorClasses =
            "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-transparent";
          break;
      }

      return (
        <button
          key={rem.id}
          className="flex w-full items-center gap-4 bg-white dark:bg-slate-900 px-5 py-4.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors focus:outline-hidden"
          onClick={() => {
            const handleNavigation = (action: () => void) => {
              if (!isDesktop && window.location.hash === "#reminders-modal") {
                // Xóa hash modal đồng bộ mà không trigger popstate.
                // Điều này ngăn useModalHistory gọi history.back() khi unmount,
                // tránh xung đột state React với lịch sử trình duyệt.
                window.history.replaceState(
                  lastHistoryStateRef.current || window.history.state,
                  "",
                  window.location.pathname + window.location.search
                );
              }
              setIsRemindersOpen(false);

              // Chờ xíu để modal kịp animate/unmount trước khi đổi view
              setTimeout(() => {
                action();
              }, 10);
            };

            if (rem.tab === ("share_requests" as any)) {
              handleNavigation(() => setIsAppInboxOpen(true));
            } else if (rem.tab === "documents" || rem.tab === "journal" || rem.tab === "wrapped") {
              const targetTab = rem.tab;
              handleNavigation(() => navigateToMore(targetTab));
            } else {
              const targetTab = rem.tab;
              handleNavigation(() => setActiveTab(targetTab));
            }
          }}
        >
          {/* Leading Icon */}
          <div
            className={classNames(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-xs",
              colorClasses
            )}
          >
            <HugeiconsIcon icon={icon} className="h-5 w-5" />
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 leading-snug wrap-break-word">
              {rem.text}
            </p>
          </div>

          {/* Trailing Icon */}
          <HugeiconsIcon
            icon={ChevronRightIcon}
            className="h-4.5 w-4.5 shrink-0 text-slate-400 dark:text-slate-500"
          />
        </button>
      );
    });
  }

  if (isShareRoute && shareToken) {
    return (
      <React.Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/30 border-t-kat-primary"></div>
          </div>
        }
      >
        <GlobalToast />
        <SharedTripScreen token={shareToken} />
      </React.Suspense>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen isFading={isSplashFading} />}

      {showWelcome && (
        <WelcomeScreen
          onDismiss={() => {
            setShowWelcome(false);
          }}
        />
      )}

      {!isShareRoute && (
        <div
          className={classNames(
            "font-sans text-kat-text antialiased selection:bg-kat-primary-light/30 selection:text-kat-text flex flex-col min-h-screen bg-kat-bg",
            showSplash && "transition-all duration-500 ease-out",
            showSplash && (isSplashFading ? "scale-100 opacity-100" : "scale-[0.96] opacity-0")
          )}
          style={
            {
              transitionTimingFunction: showSplash ? "var(--motion-ease-spring-soft)" : undefined,
              "--sticky-header-offset": areBarsVisible ? "60px" : "0px",
              "--sticky-header-offset-md": areBarsVisible ? "68px" : "0px",
            } as React.CSSProperties
          }
        >
          <header
            className={`sticky top-0 z-40 px-2.5 min-[390px]:px-4 pb-3 pt-3 glass-panel-header shadow-[0_4px_24px_rgba(3,13,46,0.05)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/70 before:to-transparent transition-transform duration-200 ease-out ${areBarsVisible ? "translate-y-0" : "-translate-y-full"}`}
            style={{
              paddingTop: "calc(0.75rem + var(--safe-top))",
              paddingLeft: "max(0.625rem, var(--safe-left))",
              paddingRight: "max(0.625rem, var(--safe-right))",
            }}
          >
            <GlobalToast />
            <div className="mx-auto flex max-w-[1280px] items-center justify-between h-9 md:h-11 gap-1.5 min-[390px]:gap-2">
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 min-[390px]:gap-2 select-none shrink-0">
                  <img
                    src="/asset/logo.png"
                    alt="KAT Journey Logo"
                    className="hidden lg:block h-[26px] w-[26px] min-[390px]:h-[28px] min-[390px]:w-[28px] shrink-0 object-contain drop-shadow-xs"
                  />
                  <h1 className="text-[17px] min-[390px]:text-[20px] font-extrabold tracking-tight text-kat-text whitespace-nowrap shrink-0">
                    KAT Journey
                  </h1>
                </div>

                {/* Desktop Navigation */}
                {!isManagingTrips && tripId && (
                  <div className="hidden lg:flex ml-6 gap-2 bg-slate-100/50 dark:bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-slate-200/50 dark:border-white/10 shadow-xs relative">
                    {(["home", "timeline", "expenses", "checklist", "more"] as const).map((tab) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            if (tab === "more") setMoreSectionRaw("overview");
                            setActiveTab(tab as any);
                          }}
                          className={classNames(
                            "relative px-5 py-2 rounded-full text-[14px] font-semibold transition-colors z-0",
                            isActive
                              ? "text-kat-text dark:text-white"
                              : "text-slate-500 dark:text-slate-400 hover:text-kat-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="desktop-nav-active-pill"
                              className="absolute inset-0 bg-white dark:bg-white/15 rounded-full shadow-xs ring-1 ring-black/5 dark:ring-white/10 -z-10"
                              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
                            />
                          )}
                          <span className="relative z-10">{t(`nav.${tab}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {isAutoBackingUp && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 animate-pulse shrink-0"
                    title={t("common.autoSavingTooltip")}
                  >
                    <HugeiconsIcon icon={CloudIcon} className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                      {t("common.savingBadge")}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex h-8 w-8 min-[390px]:h-9 min-[390px]:w-9 items-center justify-center rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-[0.97] transition-all duration-150 shadow-xs focus:outline-hidden shrink-0"
                  title="Xem chuyến đi qua link chia sẻ"
                  aria-label="Xem chuyến đi qua link chia sẻ"
                >
                  <HugeiconsIcon
                    icon={Link01Icon}
                    className="h-4 w-4 min-[390px]:h-4.5 min-[390px]:w-4.5"
                  />
                </button>

                {!isManagingTrips && tripId ? (
                  <>
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="flex h-8 w-8 min-[390px]:h-9 min-[390px]:w-9 items-center justify-center rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-[0.97] transition-all duration-150 shadow-xs focus:outline-hidden shrink-0"
                      title="Tìm trong chuyến đi"
                      aria-label={t("search.placeholder")}
                    >
                      <HugeiconsIcon
                        icon={Search01Icon}
                        className="h-4 w-4 min-[390px]:h-4.5 min-[390px]:w-4.5"
                      />
                    </button>

                    <div className="relative" ref={remindersRef}>
                      <button
                        onClick={() => setIsRemindersOpen(!isRemindersOpen)}
                        className="flex h-8 w-8 min-[390px]:h-9 min-[390px]:w-9 items-center justify-center rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-[0.97] transition-all duration-150 shadow-xs focus:outline-hidden shrink-0"
                        title={t("reminders.title")}
                        aria-label={t("reminders.title")}
                      >
                        {reminders.length > 0 ? (
                          <HugeiconsIcon
                            icon={NotificationBubbleIcon}
                            className="h-4 w-4 min-[390px]:h-4.5 min-[390px]:w-4.5 text-amber-500 animate-pulse"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Notification01Icon}
                            className="h-4 w-4 min-[390px]:h-4.5 min-[390px]:w-4.5"
                          />
                        )}
                      </button>
                      {reminders.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 min-[390px]:h-4 min-[390px]:w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] min-[390px]:text-[10px] font-black text-white ring-2 ring-white dark:ring-kat-dark pointer-events-none">
                          {reminders.length}
                        </span>
                      )}

                      {/* Popover on Desktop (md and up) */}
                      {isRemindersOpen && isDesktop && (
                        <>
                          {/* Desktop overlay backdrop to close popover on click outside */}

                          <div className="absolute right-0 mt-2.5 z-50 w-[360px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-floating overflow-hidden animate-fadeIn">
                            {/* Popover Header */}
                            <div className="px-5 py-4 border-b border-slate-150/60 dark:border-slate-800/80 bg-white dark:bg-slate-900">
                              <h4 className="text-[14.5px] font-bold text-kat-dark leading-snug">
                                {t("reminders.title")}
                              </h4>
                              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-normal">
                                {t("reminders.subtitle")}
                              </p>
                            </div>

                            {/* Popover Content */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
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
                      className="flex h-8 w-8 min-[390px]:h-9 min-[390px]:w-9 items-center justify-center rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-[0.97] transition-all duration-150 shadow-xs focus:outline-hidden shrink-0"
                      title="Quay lại danh sách chuyến đi"
                      aria-label="Quay lại danh sách chuyến đi"
                    >
                      <HugeiconsIcon
                        icon={Home01Icon}
                        className="h-4 w-4 min-[390px]:h-4.5 min-[390px]:w-4.5"
                      />
                    </button>
                  </>
                ) : (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex h-8 w-8 min-[390px]:h-9 min-[390px]:w-9 items-center justify-center rounded-full overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white hover:ring-2 hover:ring-[#00BFB7]/40 active:scale-[0.97] transition-all duration-150 shadow-xs focus:outline-hidden shrink-0"
                      title={t("userMenu.accountMenu")}
                      aria-label={t("userMenu.accountMenu")}
                    >
                      {isAuthenticated && user && provider === "google" ? (
                        user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-[11px] min-[390px]:text-[13px]">
                            {user.displayName
                              ? user.displayName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()
                              : "G"}
                          </div>
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-transparent text-slate-500 dark:text-slate-400">
                          <HugeiconsIcon
                            icon={UserIcon}
                            className="h-4 w-4 min-[390px]:h-[18px] min-[390px]:w-[18px]"
                          />
                        </div>
                      )}
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl bg-white dark:bg-kat-surface border border-slate-200/80 dark:border-kat-border shadow-floating p-1.5 animate-fadeIn">
                          <div className="px-3.5 py-2.5 border-b border-slate-100/80 dark:border-slate-800/60">
                            <p className="text-[13px] font-black text-kat-dark truncate text-left">
                              {isAuthenticated && user
                                ? provider === "guest"
                                  ? t("userMenu.guest")
                                  : user.displayName || t("userMenu.anonymous")
                                : t("userMenu.notLoggedIn")}
                            </p>
                            {isAuthenticated && user && provider !== "guest" && user.email ? (
                              <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5 text-left">
                                {user.email}
                              </p>
                            ) : (
                              (!isAuthenticated || !user) && (
                                <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5 text-left">
                                  {t("userMenu.loginToSync")}
                                </p>
                              )
                            )}
                          </div>

                          {isAuthenticated && user ? (
                            provider === "guest" ? (
                              <>
                                <div className="py-1 space-y-0.5">
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      setSettingsInitialView("auth");
                                      setIsSettingsOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={UserIcon}
                                      className="w-4 h-4 text-slate-400 shrink-0"
                                    />
                                    {t("userMenu.profileAndAccount")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      setSettingsInitialView("menu");
                                      setIsSettingsOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={Settings01Icon}
                                      className="w-4 h-4 text-slate-400 shrink-0"
                                    />
                                    {t("userMenu.appSettings")}
                                  </button>
                                </div>
                                <div className="border-t border-slate-100/80 dark:border-slate-800/60 pt-1 mt-1">
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      setIsLogoutConfirmOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-black text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={Logout01Icon}
                                      className="w-4 h-4 text-rose-500 shrink-0"
                                    />
                                    {t("userMenu.exitGuest")}
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
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={UserIcon}
                                      className="w-4 h-4 text-slate-400 shrink-0"
                                    />
                                    {t("userMenu.profileAndAccount")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      setSettingsInitialView("menu");
                                      setIsSettingsOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={Settings01Icon}
                                      className="w-4 h-4 text-slate-400 shrink-0"
                                    />
                                    {t("userMenu.appSettings")}
                                  </button>
                                </div>
                                <div className="border-t border-slate-100/80 dark:border-slate-800/60 pt-1 mt-1">
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false);
                                      setIsLogoutConfirmOpen(true);
                                    }}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-black text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  >
                                    <HugeiconsIcon
                                      icon={Logout01Icon}
                                      className="w-4 h-4 text-rose-500 shrink-0"
                                    />
                                    {t("userMenu.logout")}
                                  </button>
                                </div>
                              </>
                            )
                          ) : (
                            <>
                              <div className="py-1 space-y-0.5">
                                <button
                                  onClick={() => {
                                    setIsUserMenuOpen(false);
                                    setSettingsInitialView("auth");
                                    setIsSettingsOpen(true);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <HugeiconsIcon
                                    icon={UserIcon}
                                    className="w-4 h-4 text-slate-400 shrink-0"
                                  />
                                  {t("userMenu.loginRegister")}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsUserMenuOpen(false);
                                    setSettingsInitialView("menu");
                                    setIsSettingsOpen(true);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-xl text-left text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <HugeiconsIcon
                                    icon={Settings01Icon}
                                    className="w-4 h-4 text-slate-400 shrink-0"
                                  />
                                  {t("userMenu.appSettings")}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {!isOnline && (
            <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-xs animate-fadeIn z-40 relative">
              <HugeiconsIcon icon={WifiOffIcon} className="w-4 h-4 shrink-0" />
              <div className="text-[13px] font-bold">
                {t("offline.title")}{" "}
                <span className="hidden sm:inline font-medium">{t("offline.subtitle")}</span>
              </div>
            </div>
          )}

          {syncProps.hasCloudVersion && (
            <div className="max-w-[1280px] mx-auto mt-4 mb-2 px-4 sm:px-6">
              <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/35 dark:to-indigo-950/35 border border-blue-100/40 dark:border-blue-900/40 shadow-xs p-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Background decorative blob */}
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-xl"></div>
                <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-xl"></div>

                <div className="relative flex items-center gap-2.5 z-10 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 border border-blue-50 dark:border-slate-700/50 text-blue-600 dark:text-blue-450">
                    <HugeiconsIcon icon={CloudIcon} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                      {t("sync.foundUpdate", "Update found")}
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold leading-none truncate hidden sm:block">
                      {t("sync.foundUpdateDesc", "There's new data from another device.")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await syncProps.restoreNow("merge");
                      syncProps.setHasCloudVersion(false);
                      showToast(t("sync.syncSuccess", "Updated data from another device."));
                    } catch (e: any) {
                      showToast(t("sync.syncFail", "Restore failed: ") + e.message);
                    }
                  }}
                  disabled={syncProps.isSyncing}
                  className="relative z-10 shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {syncProps.isSyncing ? (
                    <>
                      <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5 animate-spin" />
                      {t("share.processing", "Processing...")}
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5" />
                      {t("sync.syncNow", "Sync Now")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isReadOnly && !isManagingTrips && !isViewingArchive && !isCreatingTrip && (
            <div className="max-w-[1280px] mx-auto mt-4 px-4 md:px-6 animate-fadeIn">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/50">
                <HugeiconsIcon
                  icon={LockIcon}
                  className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0"
                  strokeWidth={2.5}
                />
                <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-snug">
                  {t("common.archivedBanner")}
                </p>
              </div>
            </div>
          )}

          <main
            className={classNames(
              "mx-auto flex flex-1 w-full max-w-[1280px] flex-col min-w-0",
              !isManagingTrips && tripId
                ? "pb-32 md:pb-12"
                : isManagingTrips && trips?.length === 0 && !isViewingArchive && !isCreatingTrip
                  ? "pb-0"
                  : "pb-12"
            )}
          >
            <div
              className={classNames(
                "flex-1 px-4 md:px-6 flex flex-col min-w-0",
                isManagingTrips && trips?.length === 0 && !isViewingArchive && !isCreatingTrip
                  ? "py-0"
                  : "py-6 md:py-8"
              )}
            >
              {tripsLoading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
                </div>
              ) : isViewingArchive ? (
                <motion.div
                  key="archive"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex-1 flex flex-col"
                >
                  <ArchiveGallery
                    onBack={() => {
                      startViewTransition(() => {
                        setIsViewingArchive(false);
                        setIsManagingTrips(true);
                      });
                    }}
                    onOpenTrip={(id) => {
                      startViewTransition(() => {
                        setSelectedTripId(id);
                        setIsViewingArchive(false);
                        setIsManagingTrips(false);
                      });
                    }}
                  />
                </motion.div>
              ) : isManagingTrips || !tripId ? (
                <motion.div
                  key="manager"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={classNames(
                    isManagingTrips && trips?.length === 0 ? "flex-1 flex flex-col" : ""
                  )}
                >
                  <TripManagerScreen
                    trips={trips}
                    onOpenTrip={(id) => {
                      startViewTransition(() => {
                        setSelectedTripId(id);
                        setIsManagingTrips(false);
                      });
                    }}
                    onCreateNew={() => {
                      setIsCreatingTrip(true);
                    }}
                    onOpenArchive={() => {
                      startViewTransition(() => {
                        setIsManagingTrips(false);
                        setIsViewingArchive(true);
                      });
                    }}
                    onShowToast={showToast}
                  />
                </motion.div>
              ) : tripDataLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
                </div>
              ) : trip && tripId ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={deferredActiveTab}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full origin-top flex-1 flex flex-col h-full min-w-0"
                  >
                    {deferredActiveTab === "home" && (
                      <HomeScreen
                        trip={trip}
                        members={members ?? []}
                        events={events ?? []}
                        expenses={expenses ?? []}
                        checklist={checklist ?? []}
                        travelDocuments={travelDocuments ?? []}
                        totalExpense={totalExpense}
                        perPerson={perPerson}
                        onNavigateTab={setActiveTab}
                        onNavigateMore={navigateToMore}
                        onOpenInbox={() => setIsAppInboxOpen(true)}
                        isReadOnly={isReadOnly}
                        selectedDestIndex={selectedDestIndex}
                        onSelectDestIndex={setSelectedDestIndex}
                      />
                    )}
                    <React.Suspense
                      fallback={
                        <div className="flex items-center justify-center py-20">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/20 border-t-kat-primary"></div>
                        </div>
                      }
                    >
                      {deferredActiveTab === "timeline" && (
                        <TimelineScreen
                          trip={trip}
                          events={events ?? []}
                          expenses={expenses ?? []}
                          selectedDestIndex={selectedDestIndex}
                          onSelectDestIndex={setSelectedDestIndex}
                          onAddExpense={(date, eventId) => {
                            setExpenseInitialAddState({ date, eventId });
                            setActiveTab("expenses");
                          }}
                          isReadOnly={isReadOnly}
                        />
                      )}
                      {deferredActiveTab === "expenses" && (
                        <ExpensesScreen
                          expenses={expenses ?? []}
                          members={members ?? []}
                          totalExpense={totalExpense}
                          perPerson={perPerson}
                          tripId={tripId}
                          events={events ?? []}
                          initialAddState={expenseInitialAddState}
                          onClearInitialAddState={() => setExpenseInitialAddState(undefined)}
                          isReadOnly={isReadOnly}
                        />
                      )}
                      {deferredActiveTab === "checklist" && (
                        <ChecklistScreen
                          checklist={checklist ?? []}
                          tripId={tripId}
                          isReadOnly={isReadOnly}
                        />
                      )}
                      {deferredActiveTab === "more" && (
                        <MoreScreen
                          trip={trip}
                          members={members ?? []}
                          events={events ?? []}
                          expenses={expenses ?? []}
                          checklist={checklist ?? []}
                          journals={journals ?? []}
                          packingItems={packingItems ?? []}
                          travelDocuments={travelDocuments ?? []}
                          onTripDeleted={() => {
                            setSelectedTripId(null);
                            setIsManagingTrips(true);
                            showToast("Đã xóa chuyến đi khỏi danh sách.");
                          }}
                          onTripSelected={setSelectedTripId}
                          onShowToast={showToast}
                          section={moreSection}
                          setSection={setMoreSection}
                          onOpenInbox={() => setIsAppInboxOpen(true)}
                          isReadOnly={isReadOnly}
                          onOpenSettings={(view) => {
                            setSettingsInitialView(view ?? "menu");
                            setIsSettingsOpen(true);
                          }}
                          isAutoSyncing={isAutoSyncing}
                          lastSyncedAt={lastSyncedAt}
                          onNavigateToTab={setActiveTab}
                        />
                      )}
                    </React.Suspense>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
                </div>
              )}
            </div>
          </main>

          {!isManagingTrips && tripId && (
            <nav
              className={`fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 rounded-[26px] glass-panel-nav shadow-floating-premium lg:hidden transition-transform duration-200 ease-out ${areBarsVisible ? "translate-y-0" : "translate-y-[calc(100%+2.5rem)]"}`}
              style={{ bottom: "calc(0.5rem + var(--safe-bottom))" }}
            >
              <div className="relative flex h-[56px] min-[390px]:h-[60px] items-center justify-between px-2">
                <NavButton
                  isActive={activeTab === "home"}
                  onClick={() => setActiveTab("home")}
                  icon={Home01Icon}
                  label={t("nav.home")}
                />
                <NavButton
                  isActive={activeTab === "timeline"}
                  onClick={() => setActiveTab("timeline")}
                  icon={CompassIcon}
                  label={t("nav.timeline")}
                />
                <NavButton
                  isActive={activeTab === "expenses"}
                  onClick={() => setActiveTab("expenses")}
                  icon={WalletCardsIcon}
                  label={t("nav.expenses")}
                />
                <NavButton
                  isActive={activeTab === "checklist"}
                  onClick={() => setActiveTab("checklist")}
                  icon={CheckListIcon}
                  label={t("nav.checklist")}
                />
                <NavButton
                  isActive={activeTab === "more"}
                  onClick={() => {
                    setMoreSectionRaw("overview");
                    setActiveTab("more");
                  }}
                  icon={Menu01Icon}
                  label={t("nav.more")}
                />
              </div>
            </nav>
          )}

          {successToast && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[420px] motion-toast-enter">
              <div className="bg-kat-dark dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-floating flex items-center justify-between gap-4 border border-slate-200/20 dark:border-slate-700/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-kat-primary/20 text-kat-primary">
                    <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5" strokeWidth={3.5} />
                  </div>
                  <span className="text-[14px] font-bold tracking-wide text-sand dark:text-slate-200">
                    Đã tạo chuyến đi thành công
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedTripId(successToast);
                      setIsManagingTrips(false);
                      setSuccessToast(null);
                    }}
                    className="text-kat-primary font-extrabold text-[14px] hover:text-kat-teal/80 transition-colors whitespace-nowrap"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => setSuccessToast(null)}
                    className="text-slate-400 hover:text-white p-1 transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {toastMessage && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[400px] pointer-events-none motion-toast-enter">
              <div className="bg-kat-dark dark:bg-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 border border-slate-200/10 dark:border-slate-700/50">
                <span className="text-[14px] font-bold text-center leading-snug text-white dark:text-slate-200">
                  {toastMessage}
                </span>
              </div>
            </div>
          )}

          {(syncProps.isSyncing || syncProps.isAutoSyncingUI) && (
            <div className="fixed bottom-24 md:bottom-6 right-6 z-50 animate-fadeIn pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 text-white shadow-lg backdrop-blur-xs border border-white/10 text-[12px] font-bold">
                <HugeiconsIcon
                  icon={RefreshIcon}
                  className="w-3.5 h-3.5 animate-spin text-kat-teal shrink-0"
                />
                <span>Đang đồng bộ từ Cloud…</span>
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
              title={t("reminders.title")}
              subtitle={t("reminders.subtitle")}
            >
              <div className="-mx-5 -mb-4 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                {renderReminderItems()}
              </div>
            </BottomSheet>
          )}

          {tripId && (
            <ShareChangeRequestsSheet
              isOpen={isAppInboxOpen}
              onClose={() => setIsAppInboxOpen(false)}
              token={activeToken ?? ""}
              requests={pendingRequests}
              members={members ?? []}
            />
          )}

          {isCreatingTrip && (
            <React.Suspense fallback={null}>
              <TripForm
                isOpen={isCreatingTrip}
                onClose={() => setIsCreatingTrip(false)}
                onSaved={(id) => {
                  setIsCreatingTrip(false);
                  setSuccessToast(id);
                  setTimeout(() => setSuccessToast(null), 4000);
                }}
              />
            </React.Suspense>
          )}

          <SettingsSheet
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            initialView={settingsInitialView}
            syncProps={syncProps}
            onTripSelected={(id: number | null) => {
              setSelectedTripId(id);
              setIsManagingTrips(false);
            }}
          />

          <BottomSheet
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            title={t("userMenu.logoutConfirmTitle")}
          >
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-4 text-[13.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-left">
                <Trans i18nKey="userMenu.logoutConfirmMessage">
                  Bạn sắp đăng xuất khỏi thiết bị này. Đừng lo, toàn bộ dữ liệu đã sao lưu trên{" "}
                  <strong className="font-bold text-slate-800 dark:text-slate-100">Cloud</strong>{" "}
                  vẫn được giữ{" "}
                  <strong className="font-bold text-slate-800 dark:text-slate-100">an toàn</strong>.
                </Trans>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200 motion-press"
                >
                  {t("common.cancel")}
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
                  <HugeiconsIcon icon={Logout01Icon} className="h-5 w-5" />
                  {t("userMenu.logoutButton")}
                </button>
              </div>
            </div>
          </BottomSheet>

          <ImportTripSheet
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            showToast={showToast}
          />
        </div>
      )}

      <ReloadPrompt hasBottomNav={!isManagingTrips && !!tripId} />
    </>
  );
}

export default App;
