import React, { useState, useEffect, useRef } from "react";
import { useNotification } from "../hooks/useNotification";
import { showToast } from "./ui/ToastManager";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  LockIcon,
  InformationCircleIcon,
  Mail01Icon,
  PackageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Coffee01Icon,
  GlobeIcon,
  Shield01Icon,
  CompassIcon,
  Download01Icon,
  Loading01Icon,
  PencilEdit01Icon,
  CheckIcon,
  Cancel01Icon,
  CloudIcon,
  AlertCircleIcon,
  Delete01Icon,
  EraserIcon,
  UserRemove01Icon,
  RotateLeft01Icon,
  Notification01Icon,
  PackageReceiveIcon,
  Upload01Icon,
  GitMergeIcon,
  Clock01Icon,
  Calendar01Icon,
  Coins01Icon,
  Location01Icon,
  Navigation02Icon,
  ColorsIcon,
  Sun01Icon,
  Moon01Icon,
  ComputerIcon,
  Globe02Icon,
  LanguageSkillIcon,
} from "@hugeicons/core-free-icons";
import { SettingsMenu, SettingsView } from "./settings/SettingsMenu";
import { AuthSettings } from "./settings/AuthSettings";
import { ThemeSettings } from "./settings/ThemeSettings";
import { LanguageSettings } from "./settings/LanguageSettings";
import { PrivacySettings } from "./settings/PrivacySettings";
import { AboutSettings } from "./settings/AboutSettings";
import { DonateSettings } from "./settings/DonateSettings";
import { ExchangeRatesSettings } from "./settings/ExchangeRatesSettings";
import { BottomSheet, classNames } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useCloudBackup } from "../hooks/useCloudBackup";
import {
  signInAsGuest,
  signInWithGoogle,
  signOutUser,
  updateUserDisplayName,
} from "../services/authService";
import { db } from "../db";
import { clearTemporaryFiles } from "../utils/dataActions";
import { exportDataToFile, importDataFromFile } from "../utils/importExportActions";
import { DeleteAccountModal } from "./settings/DeleteAccountModal";
import { FactoryResetModal } from "./settings/FactoryResetModal";
import { useModalHistory } from "../hooks/useModalHistory";
import { today, checklistSections, packingTripTypes, APP_VERSION } from "../utils/helpers";
import { fetchExchangeRates, ExchangeRate } from "../services/currencyService";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { PWAInstallInstructionsSheet } from "./modals/PWAInstallInstructionsSheet";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: SettingsView;
  onTripSelected?: (id: number | null) => void;
  syncProps: {
    isSyncing: boolean;
    isAutoBackingUp: boolean;
    lastBackupAt: string | null;
    autoBackupEnabled: boolean;
    hasCloudVersion: boolean;
    setAutoBackupEnabled: (enabled: boolean) => void;
    restoreNow: (mode: "merge" | "replace") => Promise<void>;
    syncData: () => Promise<"uploaded" | "prompt_restore" | "up_to_date">;
  };
}

const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export function SettingsSheet({
  isOpen,
  onClose,
  initialView,
  syncProps,
  onTripSelected,
}: SettingsSheetProps) {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, provider, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    isSupported: isNotificationSupported,
    enabled: notificationEnabled,
    setEnabled: setNotificationEnabled,
    fcmToken,
    isFcmLoading,
  } = useNotification();
  const {
    isSyncing,
    isAutoBackingUp,
    lastBackupAt,
    autoBackupEnabled,
    hasCloudVersion,
    setAutoBackupEnabled,
    restoreNow,
    syncData,
  } = syncProps;

  const [view, setView] = useState<SettingsView>("menu");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);
  const [actionLoading, setActionLoading] = useState<"google" | "guest" | "signout" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isClearingTemp, setIsClearingTemp] = useState(false);
  const [clearTempSuccess, setClearTempSuccess] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);

  // PWA Install Assistant states
  const { isInstallable, isStandalone, platform, triggerInstall } = usePWAInstall();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleInstallPWA = async () => {
    const showGuide = await triggerInstall();
    if (showGuide) {
      setIsGuideOpen(true);
    }
  };

  // Cloud backup states
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Restore from file states
  const [importing, setImporting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(localStorage.getItem("kat_gps_enabled") !== "false");
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<File | null>(null);
  const [isRestoreFileConfirmOpen, setIsRestoreFileConfirmOpen] = useState(false);

  // System Settings
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">(
    (localStorage.getItem("kat_temperature_unit") as "C" | "F") || "C"
  );
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">(
    (localStorage.getItem("kat_distance_unit") as "km" | "mi") || "km"
  );

  const toggleTemperatureUnit = () => {
    const newUnit = temperatureUnit === "C" ? "F" : "C";
    setTemperatureUnit(newUnit);
    localStorage.setItem("kat_temperature_unit", newUnit);
    window.dispatchEvent(new Event("kat_settings_changed"));
  };

  const toggleDistanceUnit = () => {
    const newUnit = distanceUnit === "km" ? "mi" : "km";
    setDistanceUnit(newUnit);
    localStorage.setItem("kat_distance_unit", newUnit);
    window.dispatchEvent(new Event("kat_settings_changed"));
  };

  // Import preview modal
  const [importPreview, setImportPreview] = useState<{
    parsed: any;
    isFullBackup?: boolean;
    tripName: string;
    tripCount?: number;
    exportedAt: string;
    memberCount: number;
    eventCount: number;
    expenseCount: number;
    checklistCount: number;
    journalCount: number;
  } | null>(null);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [donateTab, setDonateTab] = useState<"vn" | "intl">(i18n.language === "vi" ? "vn" : "intl");

  // Modal history registration
  useModalHistory(
    isRestoreFileConfirmOpen,
    () => setIsRestoreFileConfirmOpen(false),
    "restore-file-confirm"
  );
  useModalHistory(isImportPreviewOpen, () => setIsImportPreviewOpen(false), "import-preview");

  useModalHistory(
    isOpen && view !== "menu" && view !== "auth",
    () => {
      setView("menu");
      setErrorMsg(null);
    },
    `settings-${view}`
  );

  useEffect(() => {
    if (user) {
      setNewName(user.displayName || "");
    }
    setIsEditingName(false);
  }, [user, isOpen]);

  // Listen for import-preview event dispatched from MoreScreen
  useEffect(() => {
    function handleImportEvent(e: Event) {
      const parsed = (e as CustomEvent).detail;
      if (!parsed) return;
      setImportPreview({
        parsed,
        tripName: parsed.trip?.title ?? "Không có tên",
        exportedAt: parsed.exportedAt ?? "",
        memberCount: (parsed.members ?? []).length,
        eventCount: (parsed.events ?? []).length,
        expenseCount: (parsed.expenses ?? []).length,
        checklistCount: (parsed.checklist ?? []).length,
        journalCount: (parsed.journals ?? []).length,
      });
      setIsImportPreviewOpen(true);
    }
    window.addEventListener("kat:import-preview", handleImportEvent);
    return () => window.removeEventListener("kat:import-preview", handleImportEvent);
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setActionLoading("guest");
    setErrorMsg(null);
    try {
      await updateUserDisplayName(newName.trim());
      setIsEditingName(false);
    } catch (err: any) {
      console.error("Update name failed:", err);
      setErrorMsg(err.message || "Không thể cập nhật tên hiển thị.");
    } finally {
      setActionLoading(null);
    }
  };

  // Reset view to menu when sheet is opened
  useEffect(() => {
    if (isOpen) {
      setView(initialView || "menu");
      setErrorMsg(null);
      setActionLoading(null);
      setSyncError(null);
      setSyncSuccess(null);
      setIsRestoreConfirmOpen(false);
    }
  }, [isOpen, initialView]);

  const handleGuestSignIn = async () => {
    setActionLoading("guest");
    setErrorMsg(null);
    try {
      await signInAsGuest();
      setView("auth");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể đăng nhập tài khoản khách.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setActionLoading("google");
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setView("auth");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối tài khoản Google.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    setActionLoading("signout");
    setErrorMsg(null);
    try {
      localStorage.removeItem("kat_journey_welcome_viewed");
      localStorage.removeItem("kat_auth_mode");
      await signOutUser();
      setView("auth");
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi đăng xuất.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBackupAllData = async () => {
    setActionLoading("guest");
    setErrorMsg(null);
    try {
      await exportDataToFile();
    } catch (err: any) {
      console.error("Backup failed:", err);
      setErrorMsg("Sao lưu dữ liệu thất bại: " + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };
  const handleSync = async () => {
    if (!user) return;
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const result = await syncData();
      if (result === "uploaded") {
        setSyncSuccess(t("settings.auth.syncSuccessCloud"));
      } else if (result === "up_to_date") {
        setSyncSuccess(t("settings.auth.syncSuccess"));
      } else if (result === "prompt_restore") {
        // Show restore confirm modal
        setIsRestoreConfirmOpen(true);
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      setSyncError(t("settings.auth.syncFailed") + (err.message || err));
    }
  };

  const handleRestore = async () => {
    setIsRestoreConfirmOpen(false);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      await restoreNow(restoreMode);
      setSyncSuccess(
        restoreMode === "merge"
          ? t("settings.dialogs.cloudRestore.restoreSuccessMerge")
          : t("settings.dialogs.cloudRestore.restoreSuccessReplace")
      );
    } catch (err: any) {
      console.error("Restore failed:", err);
      setSyncError(t("settings.dialogs.cloudRestore.restoreFailed") + (err.message || err));
    }
  };

  /** Step 1: Read file and show preview modal */
  async function previewImportFile(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as any;
      if (parsed.app !== "KAT Journey") {
        showToast(t("toast.invalidFileFormat"), "error");
        return;
      }
      const isFullBackup = parsed.type === "full_backup";
      if (!isFullBackup && !parsed.trip?.title) {
        showToast(t("toast.invalidFileFormat"), "error");
        return;
      }
      setImportPreview({
        parsed,
        isFullBackup,
        tripName: isFullBackup
          ? "Toàn bộ dữ liệu ứng dụng"
          : (parsed.trip.title ?? t("settings.dialogs.importPreview.untitledTrip")),
        tripCount: isFullBackup ? (parsed.trips ?? []).length : undefined,
        exportedAt: parsed.exportedAt ?? "",
        memberCount: (parsed.members ?? []).length,
        eventCount: (parsed.events ?? []).length,
        expenseCount: (parsed.expenses ?? []).length,
        checklistCount: (parsed.checklist ?? []).length,
        journalCount: (parsed.journals ?? []).length,
      });
      setIsImportPreviewOpen(true);
    } catch {
      showToast(t("toast.cantReadFile"), "error");
    }
  }

  /** Step 2: Confirmed — do the actual import with all fields */
  async function importTrip(parsed?: any) {
    if (!parsed) return;
    setImporting(true);
    try {
      const newTripId = await importDataFromFile(parsed);
      if (parsed.type === "full_backup") {
        setIsImportPreviewOpen(false);
        setImportPreview(null);
        onClose();
        showToast("Đã khôi phục toàn bộ dữ liệu thành công");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      onTripSelected?.(newTripId ?? null);
      setIsImportPreviewOpen(false);
      setImportPreview(null);
      onClose();
      showToast(t("toast.importSuccess"));
    } catch (error) {
      showToast(
        t("toast.importError", {
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        "error"
      );
    } finally {
      setImporting(false);
    }
  }
  const getInitials = (name: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderTitle = () => {
    switch (view) {
      case "auth":
        return t("settings.auth.title");
      case "privacy":
        return t("settings.menu.privacy.title");
      case "about":
        return t("settings.menu.about.title");
      case "donate":
        return t("settings.menu.donate.title");
      case "exchangeRates":
        return t("settings.menu.exchangeRates.title");
      case "theme":
        return t("settings.menu.theme.title");
      case "language":
        return t("settings.menu.language.title");
      default:
        return t("settings.header.title");
    }
  };

  const renderSubtitle = () => {
    return null;
  };

  const notificationBadgeClass = () => {
    switch (isNotificationSupported ? notificationPermission : "unsupported") {
      case "granted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "denied":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "unsupported":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const notificationLabel = () => {
    switch (isNotificationSupported ? notificationPermission : "unsupported") {
      case "granted":
        return "Đã bật";
      case "denied":
        return "Đã từ chối";
      case "unsupported":
        return "Không hỗ trợ";
      default:
        return "Chưa hỏi";
    }
  };

  const handleSheetClose = () => {
    if (view !== "menu" && view !== "auth") {
      setView("menu");
      setErrorMsg(null);
    } else {
      onClose();
    }
  };

  const renderHeaderAction = () => {
    if (view !== "menu" && view !== "auth") {
      return (
        <button
          onClick={handleSheetClose}
          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700/60 focus:outline-hidden"
          title="Quay lại"
          aria-label="Quay lại"
        >
          <HugeiconsIcon icon={ChevronLeftIcon} className="h-5 w-5" />
        </button>
      );
    }
    return null;
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={handleSheetClose}
        title={renderTitle()}
        subtitle={renderSubtitle()}
        headerAction={renderHeaderAction()}
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13.5px] text-rose-800 font-semibold leading-relaxed animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {view === "menu" && (
            <SettingsMenu
              user={user}
              setView={setView}
              temperatureUnit={temperatureUnit}
              toggleTemperatureUnit={toggleTemperatureUnit}
              isNotificationSupported={isNotificationSupported}
              notificationPermission={notificationPermission}
              notificationEnabled={notificationEnabled}
              requestNotificationPermission={requestNotificationPermission}
              setNotificationEnabled={setNotificationEnabled}
              gpsEnabled={gpsEnabled}
              setGpsEnabled={setGpsEnabled}
              importing={importing}
              previewImportFile={previewImportFile}
              setIsDeleteAccountOpen={setIsDeleteAccountOpen}
              setIsFactoryResetOpen={setIsFactoryResetOpen}
              handleInstallPWA={handleInstallPWA}
            />
          )}

          {view === "auth" && (
            <AuthSettings
              user={user}
              authLoading={authLoading}
              provider={provider}
              actionLoading={actionLoading}
              isEditingName={isEditingName}
              setIsEditingName={setIsEditingName}
              newName={newName}
              setNewName={setNewName}
              handleUpdateName={handleUpdateName}
              handleGoogleSignIn={handleGoogleSignIn}
              handleGuestSignIn={handleGuestSignIn}
              handleBackupAllData={handleBackupAllData}
              handleSync={handleSync}
              syncProps={syncProps}
              syncError={syncError}
              syncSuccess={syncSuccess}
              getInitials={getInitials}
            />
          )}

          {view === "privacy" && <PrivacySettings setView={setView} />}
          {view === "about" && <AboutSettings setView={setView} />}
          {view === "donate" && <DonateSettings setView={setView} />}
          {view === "exchangeRates" && <ExchangeRatesSettings setView={setView} />}
          {view === "language" && <LanguageSettings i18n={i18n} setView={setView} />}
          {view === "theme" && (
            <ThemeSettings theme={theme} setTheme={setTheme} setView={setView} />
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isRestoreConfirmOpen}
        onClose={() => setIsRestoreConfirmOpen(false)}
        title={t("settings.dialogs.cloudRestore.title")}
      >
        <div className="space-y-5 text-left">
          <div className="rounded-[22px] bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/30 p-4 text-[13px] text-amber-800 dark:text-amber-350 font-bold leading-relaxed flex items-start gap-3 shadow-inner">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 shadow-xs">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4.5 h-4.5" />
            </div>
            <span className="pt-1 flex-1">{t("settings.dialogs.cloudRestore.warning")}</span>
          </div>

          <div className="space-y-3.5">
            {/* Option 1: Merge */}
            <label
              className={`flex items-center gap-4 p-5 rounded-[22px] border transition-all duration-300 cursor-pointer select-none shadow-soft hover:shadow-md relative overflow-hidden ${
                restoreMode === "merge"
                  ? "border-indigo-500/80 dark:border-indigo-500/85 bg-indigo-500/5 dark:bg-indigo-950/20 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20"
                  : "border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                type="radio"
                name="restoreMode"
                value="merge"
                checked={restoreMode === "merge"}
                onChange={() => setRestoreMode("merge")}
                className="sr-only"
              />
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-colors ${
                  restoreMode === "merge"
                    ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/25 dark:text-indigo-400 dark:border-indigo-500/20 shadow-inner"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-450 dark:text-slate-500 border-slate-200/80 dark:border-white/3 shadow-xs"
                }`}
              >
                <HugeiconsIcon icon={GitMergeIcon} className="w-5.5 h-5.5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p
                  className={`text-[15px] font-black leading-tight ${
                    restoreMode === "merge"
                      ? "text-indigo-650 dark:text-indigo-300"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {t("settings.dialogs.cloudRestore.mergeTitle")}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mt-1.5 leading-normal">
                  {t("settings.dialogs.cloudRestore.mergeDesc")}
                </p>
              </div>
              <div
                className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  restoreMode === "merge"
                    ? "border-indigo-500 dark:border-indigo-500 bg-white dark:bg-slate-950"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-955"
                }`}
              >
                {restoreMode === "merge" && (
                  <div className="h-3 w-3 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                )}
              </div>
            </label>

            {/* Option 2: Replace */}
            <label
              className={`flex items-center gap-4 p-5 rounded-[22px] border transition-all duration-300 cursor-pointer select-none shadow-soft hover:shadow-md relative overflow-hidden ${
                restoreMode === "replace"
                  ? "border-rose-500/80 dark:border-rose-500/85 bg-rose-500/5 dark:bg-rose-950/20 ring-1 ring-rose-500/10 dark:ring-rose-500/20"
                  : "border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                type="radio"
                name="restoreMode"
                value="replace"
                checked={restoreMode === "replace"}
                onChange={() => setRestoreMode("replace")}
                className="sr-only"
              />
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-colors ${
                  restoreMode === "replace"
                    ? "bg-rose-500/15 text-rose-500 border-rose-500/20 dark:bg-rose-500/25 dark:text-rose-400 dark:border-rose-500/20 shadow-inner"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-450 dark:text-slate-500 border-slate-200/80 dark:border-white/3 shadow-xs"
                }`}
              >
                <HugeiconsIcon icon={Delete01Icon} className="w-5.5 h-5.5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p
                  className={`text-[15px] font-black leading-tight ${
                    restoreMode === "replace"
                      ? "text-rose-600 dark:text-rose-455"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {t("settings.dialogs.cloudRestore.replaceTitle")}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mt-1.5 leading-normal">
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider block text-[10.5px] mb-0.5">
                    {t("settings.dialogs.cloudRestore.replaceWarning")}
                  </span>
                  {t("settings.dialogs.cloudRestore.replaceDesc")}
                </p>
              </div>
              <div
                className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  restoreMode === "replace"
                    ? "border-rose-500 dark:border-rose-500 bg-white dark:bg-slate-950"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-955"
                }`}
              >
                {restoreMode === "replace" && (
                  <div className="h-3 w-3 rounded-full bg-rose-500 dark:bg-rose-400" />
                )}
              </div>
            </label>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsRestoreConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100/80 dark:bg-slate-800/80 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200 border border-transparent dark:border-white/5 cursor-pointer shadow-xs"
            >
              {t("settings.dialogs.cloudRestore.cancel")}
            </button>
            <button
              type="button"
              onClick={handleRestore}
              className={`flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] px-6 font-black active:scale-[0.98] transition-all duration-200 shadow-xs border border-transparent dark:border-white/4 cursor-pointer ${
                restoreMode === "replace"
                  ? "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-[0_4px_16px_rgba(225,29,72,0.3)]"
                  : "bg-[#00BFB7] text-slate-950 hover:bg-[#00A19D] hover:shadow-[0_4px_16px_rgba(0,191,183,0.3)]"
              }`}
            >
              {t("settings.dialogs.cloudRestore.continue")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Import Trip Confirmation Modal */}
      <BottomSheet
        isOpen={isRestoreFileConfirmOpen}
        onClose={() => {
          setIsRestoreFileConfirmOpen(false);
          setSelectedFileForRestore(null);
        }}
        title={t("settings.dialogs.fileRestore.title")}
      >
        <div className="space-y-5 text-left">
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13.5px] text-amber-800 font-semibold leading-relaxed flex items-start gap-2.5">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="w-5 h-5 text-amber-650 shrink-0 mt-0.5"
            />
            <span>{t("settings.dialogs.fileRestore.warning")}</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setIsRestoreFileConfirmOpen(false);
                setSelectedFileForRestore(null);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all duration-200 border border-transparent dark:border-slate-700"
            >
              {t("settings.dialogs.fileRestore.cancel")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsRestoreFileConfirmOpen(false);
                if (selectedFileForRestore) {
                  await importTrip(selectedFileForRestore);
                }
                setSelectedFileForRestore(null);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-slate-800 border border-kat-dark dark:border-white/4 px-6 font-bold text-white dark:text-slate-200 hover:bg-kat-dark dark:hover:bg-slate-700 bg-opacity-90 active:scale-98 transition-all duration-200 shadow-xs"
            >
              <HugeiconsIcon icon={Upload01Icon} className="h-5 w-5" />
              {t("settings.dialogs.fileRestore.restore")}
            </button>
          </div>
        </div>
      </BottomSheet>

      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />
      <FactoryResetModal isOpen={isFactoryResetOpen} onClose={() => setIsFactoryResetOpen(false)} />

      {/* ── Import Preview Modal ── */}
      {isImportPreviewOpen && importPreview && (
        <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-kat-surface w-full max-w-md rounded-[28px] border border-slate-200 dark:border-kat-border/60 shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                  <HugeiconsIcon icon={PackageReceiveIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-kat-dark dark:text-slate-100">
                    {t("settings.dialogs.importPreview.title")}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {t("settings.dialogs.importPreview.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportPreviewOpen(false);
                  setImportPreview(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              </button>
            </div>

            {/* Trip info */}
            <div className="px-5 py-5 sm:px-6 space-y-5">
              <div className="relative rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 p-4 sm:p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    {t("settings.dialogs.importPreview.tripName")}
                  </p>
                  <p className="text-[18px] sm:text-[22px] font-black text-kat-dark dark:text-slate-100 leading-tight">
                    {importPreview.tripName}
                  </p>
                  {importPreview.exportedAt && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-1.5">
                      <HugeiconsIcon icon={Clock01Icon} className="w-3.5 h-3.5" />
                      {t("settings.dialogs.importPreview.exportedAt")}{" "}
                      {new Date(importPreview.exportedAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
                {[
                  ...(importPreview.isFullBackup
                    ? [
                        {
                          label: "Chuyến đi",
                          value: importPreview.tripCount || 0,
                          icon: CompassIcon,
                          color: "text-indigo-500 dark:text-indigo-400",
                          bg: "bg-indigo-50 dark:bg-indigo-500/10",
                          border: "border-indigo-100/50 dark:border-indigo-500/20",
                        },
                      ]
                    : []),
                  {
                    label: t("settings.dialogs.importPreview.members"),
                    value: importPreview.memberCount,
                    icon: UserIcon,
                    color: "text-blue-500 dark:text-blue-400",
                    bg: "bg-blue-50 dark:bg-blue-500/10",
                    border: "border-blue-100/50 dark:border-blue-500/20",
                  },
                  {
                    label: t("settings.dialogs.importPreview.timeline"),
                    value: importPreview.eventCount,
                    icon: Calendar01Icon,
                    color: "text-emerald-500 dark:text-emerald-400",
                    bg: "bg-emerald-50 dark:bg-emerald-500/10",
                    border: "border-emerald-100/50 dark:border-emerald-500/20",
                  },
                  {
                    label: t("settings.dialogs.importPreview.expenses"),
                    value: importPreview.expenseCount,
                    icon: Coins01Icon,
                    color: "text-amber-500 dark:text-amber-400",
                    bg: "bg-amber-50 dark:bg-amber-500/10",
                    border: "border-amber-100/50 dark:border-amber-500/20",
                  },
                  {
                    label: t("settings.dialogs.importPreview.checklist"),
                    value: importPreview.checklistCount,
                    icon: CheckIcon,
                    color: "text-purple-500 dark:text-purple-400",
                    bg: "bg-purple-50 dark:bg-purple-500/10",
                    border: "border-purple-100/50 dark:border-purple-500/20",
                  },
                  {
                    label: t("settings.dialogs.importPreview.journal"),
                    value: importPreview.journalCount,
                    icon: PencilEdit01Icon,
                    color: "text-pink-500 dark:text-pink-400",
                    bg: "bg-pink-50 dark:bg-pink-500/10",
                    border: "border-pink-100/50 dark:border-pink-500/20",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`rounded-[16px] ${item.bg} border ${item.border} p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 ${
                      importPreview.isFullBackup
                        ? "col-span-2"
                        : idx < 3
                          ? "col-span-2"
                          : "col-span-3"
                    }`}
                  >
                    <div
                      className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${item.color}`}
                    >
                      <HugeiconsIcon icon={item.icon} className="w-16 h-16" />
                    </div>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-xs mb-2 ${item.color}`}
                    >
                      <HugeiconsIcon icon={item.icon} className="w-4 h-4" />
                    </div>
                    <p className="text-[20px] sm:text-[24px] font-black text-kat-dark dark:text-slate-100 leading-none mb-1">
                      {item.value}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t("settings.dialogs.importPreview.notice")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                onClick={() => {
                  setIsImportPreviewOpen(false);
                  setImportPreview(null);
                }}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
              >
                {t("settings.dialogs.importPreview.cancel")}
              </button>
              <button
                onClick={() => importTrip(importPreview.parsed)}
                disabled={importing}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary font-black text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-xs dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] border border-transparent dark:border-kat-primary dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent"
              >
                {importing ? (
                  <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
                )}
                {importing
                  ? t("settings.dialogs.importPreview.importing")
                  : t("settings.dialogs.importPreview.importNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      <PWAInstallInstructionsSheet
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        platform={platform as "ios" | "android" | "other"}
      />
    </>
  );
}
