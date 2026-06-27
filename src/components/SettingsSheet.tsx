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
  ColorsIcon,
  Sun01Icon,
  Moon01Icon,
  ComputerIcon,
  Globe02Icon,
  LanguageSkillIcon,
} from "@hugeicons/core-free-icons";
import { BottomSheet, classNames } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useCloudBackup } from "../hooks/useCloudBackup";
import { signInAsGuest, signInWithGoogle, signOutUser, updateUserDisplayName } from "../services/authService";
import { db } from "../db";
import { clearTemporaryFiles } from "../utils/dataActions";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { FactoryResetModal } from "./FactoryResetModal";
import { useModalHistory } from "../hooks/useModalHistory";
import { today, checklistSections, packingTripTypes, APP_VERSION } from "../utils/helpers";
import { fetchExchangeRates, ExchangeRate } from "../services/currencyService";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { PWAInstallInstructionsSheet } from "./PWAInstallInstructionsSheet";

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

type SettingsView = "menu" | "auth" | "privacy" | "about" | "donate" | "exchangeRates" | "theme" | "language";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);


export function SettingsSheet({ isOpen, onClose, initialView, syncProps, onTripSelected }: SettingsSheetProps) {
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
    isFcmLoading
  } = useNotification();
  const { 
    isSyncing, 
    isAutoBackingUp, 
    lastBackupAt, 
    autoBackupEnabled, 
    hasCloudVersion, 
    setAutoBackupEnabled, 
    restoreNow, 
    syncData 
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
  const [isIosGuideOpen, setIsIosGuideOpen] = useState(false);

  const handleInstallPWA = async () => {
    const showGuide = await triggerInstall();
    if (showGuide && platform === "ios") {
      setIsIosGuideOpen(true);
    }
  };

  // Cloud backup states
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Restore from file states
  const [importing, setImporting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(
    localStorage.getItem("kat_gps_enabled") !== "false"
  );
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<File | null>(null);
  const [isRestoreFileConfirmOpen, setIsRestoreFileConfirmOpen] = useState(false);

  // Import preview modal
  const [importPreview, setImportPreview] = useState<{
    parsed: any;
    tripName: string;
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
  useModalHistory(isRestoreFileConfirmOpen, () => setIsRestoreFileConfirmOpen(false), "restore-file-confirm");
  useModalHistory(isImportPreviewOpen, () => setIsImportPreviewOpen(false), "import-preview");

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
      const [trips, members, events, expenses, checklist, journals, packingItems, travelDocuments, backupPlans] = await Promise.all([
        db.trips.toArray(),
        db.members.toArray(),
        db.events.toArray(),
        db.expenses.toArray(),
        db.checklist.toArray(),
        db.journals.toArray(),
        db.packingItems.toArray(),
        db.travelDocuments.toArray(),
        db.backupPlans.toArray()
      ]);

      const backupData = {
        app: "KAT Journey",
        type: "full_backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        trips,
        members,
        events,
        expenses,
        checklist,
        journals,
        packingItems,
        travelDocuments,
        backupPlans
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const dateStr = new Date().toISOString().slice(0, 10);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kat-journey-backup-${dateStr}.katjourney`;
      link.click();
      URL.revokeObjectURL(url);
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
        setSyncSuccess(t('settings.auth.syncSuccessCloud'));
      } else if (result === "up_to_date") {
        setSyncSuccess(t('settings.auth.syncSuccess'));
      } else if (result === "prompt_restore") {
        // Show restore confirm modal
        setIsRestoreConfirmOpen(true);
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      setSyncError(t('settings.auth.syncFailed') + (err.message || err));
    }
  };

  const handleRestore = async () => {
    setIsRestoreConfirmOpen(false);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      await restoreNow(restoreMode);
      setSyncSuccess(restoreMode === "merge" ? t("settings.dialogs.cloudRestore.restoreSuccessMerge") : t("settings.dialogs.cloudRestore.restoreSuccessReplace"));
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
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        showToast(t("toast.invalidFileFormat"), "error");
        return;
      }
      setImportPreview({
        parsed,
        tripName: parsed.trip.title ?? t("settings.dialogs.importPreview.untitledTrip"),
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
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        throw new Error("Tệp không đúng định dạng KAT Journey.");
      }

      const newTripId = await db.transaction("rw", [db.trips, db.members, db.events, db.expenses, db.checklist, db.journals, db.packingItems, db.travelDocuments, db.backupPlans], async () => {
        const t = parsed.trip!;
        const id = await db.trips.add({
          title: t.title,
          location: t.location ?? t.destination ?? "",
          tripType: t.tripType,
          startDate: t.startDate || today,
          endDate: t.endDate || t.startDate || today,
          latitude: t.latitude,
          longitude: t.longitude,
          defaultCurrency: t.defaultCurrency,
          mediaLink: t.mediaLink,
          dayRoadmaps: t.dayRoadmaps,
          shareToken: t.shareToken,
          sharePin: t.sharePin,
          shareIncludeExpenses: t.shareIncludeExpenses,
          shareIncludeJournals: t.shareIncludeJournals,
          shareIncludeChecklist: t.shareIncludeChecklist,
          shareIncludeBackupPlans: t.shareIncludeBackupPlans,
          shareIncludeDocuments: t.shareIncludeDocuments,
          shareUsePinProtection: t.shareUsePinProtection,
          status: t.status === "archived" ? "archived" : "active",
          createdAt: new Date().toISOString(),
        });

        const importedMembers = (parsed.members ?? []).map((m: any) => ({
          tripId: id,
          name: m.name ?? "",
          phone: m.phone ?? "",
          role: m.role ?? "",
          note: m.note ?? "",
          gender: m.gender,
          avatar: m.avatar,
          isDeleted: m.isDeleted,
        }));
        const importedEvents = (parsed.events ?? []).map((e: any) => ({
          tripId: id,
          date: e.date || today,
          time: e.time ?? "",
          title: e.title ?? "",
          location: e.location ?? "",
          notes: e.notes ?? "",
          mapLink: e.mapLink ?? "",
          completed: Boolean(e.completed),
          assignee: e.assignee,
          type: e.type,
          isDeleted: e.isDeleted,
        }));
        const importedExpenses = (parsed.expenses ?? []).map((ex: any) => ({
          tripId: id,
          amount: Number(ex.amount || 0),
          payer: ex.payer ?? "",
          category: ex.category ?? "Khác",
          description: ex.description ?? "",
          splitType: ex.splitType ?? "shared",
          date: ex.date,
          eventId: ex.eventId,
          originalAmount: ex.originalAmount !== undefined ? Number(ex.originalAmount) : undefined,
          currency: ex.currency,
          exchangeRate: ex.exchangeRate !== undefined ? Number(ex.exchangeRate) : undefined,
          isDeleted: ex.isDeleted,
        }));
        const importedChecklist = (parsed.checklist ?? []).map((c: any) => ({
          tripId: id,
          section: checklistSections.includes(c.section) ? c.section : "Before Trip",
          title: c.title ?? "",
          completed: Boolean(c.completed),
          category: c.category,
          quantity: c.quantity,
          assignedTo: c.assignedTo,
          priority: (["normal", "important", "required"].includes(c.priority)) ? c.priority : "normal",
          note: c.note,
          isPrivate: c.isPrivate !== undefined ? Boolean(c.isPrivate) : undefined,
          isDeleted: c.isDeleted,
        }));
        const importedJournals = (parsed.journals ?? []).map((j: any) => ({
          tripId: id,
          date: j.date || today,
          title: j.title ?? "",
          content: j.content ?? "",
          mood: (["very_bad", "bad", "okay", "good", "great"].includes(j.mood)) ? j.mood : "okay",
          authorName: j.authorName,
          imageUrl: j.imageUrl,
          postedAt: j.postedAt,
          reactions: j.reactions,
          authorId: j.authorId,
          locationName: j.locationName,
          latitude: j.latitude !== undefined ? Number(j.latitude) : undefined,
          longitude: j.longitude !== undefined ? Number(j.longitude) : undefined,
          isDeleted: j.isDeleted,
        }));
        const importedPackingItems = (parsed.packingItems ?? []).map((p: any) => ({
          tripId: id,
          tripType: packingTripTypes.includes(p.tripType) ? p.tripType : "Thành phố",
          title: p.title ?? "",
          completed: Boolean(p.completed),
          isDeleted: p.isDeleted,
        }));
        const importedDocuments = (parsed.travelDocuments ?? []).map((d: any) => ({
          tripId: id,
          title: d.title ?? "",
          type: d.type ?? "other",
          code: d.code ?? "",
          date: d.date ?? "",
          link: d.link ?? "",
          attachmentUrl: d.attachmentUrl,
          isPrivate: d.isPrivate !== undefined ? Boolean(d.isPrivate) : undefined,
          note: d.note ?? "",
          isDeleted: d.isDeleted,
        }));
        const importedBackupPlans = (parsed.backupPlans ?? []).map((b: any) => ({
          tripId: id,
          title: b.title ?? "",
          type: b.type ?? "other",
          reason: b.reason ?? "",
          location: b.location ?? "",
          mapLink: b.mapLink ?? "",
          estimatedCost: b.estimatedCost !== undefined ? Number(b.estimatedCost) : undefined,
          note: b.note ?? "",
          activityId: b.activityId,
          date: b.date,
          isDeleted: b.isDeleted,
        }));

        if (importedMembers.length) await db.members.bulkAdd(importedMembers);
        if (importedEvents.length) await db.events.bulkAdd(importedEvents);
        if (importedExpenses.length) await db.expenses.bulkAdd(importedExpenses);
        if (importedChecklist.length) await db.checklist.bulkAdd(importedChecklist);
        if (importedJournals.length) await db.journals.bulkAdd(importedJournals);
        if (importedPackingItems.length) await db.packingItems.bulkAdd(importedPackingItems);
        if (importedDocuments.length) await db.travelDocuments.bulkAdd(importedDocuments);
        if (importedBackupPlans.length) await db.backupPlans.bulkAdd(importedBackupPlans);
        return id;
      });

      onTripSelected?.(newTripId);
      setIsImportPreviewOpen(false);
      setImportPreview(null);
      onClose();
      showToast(t("toast.importSuccess"));
    } catch (error) {
      showToast(t("toast.importError", { message: error instanceof Error ? error.message : "Unknown error" }), "error");
    } finally {
      setImporting(false);
    }
  }

  const renderBackupSection = () => {
    const backupTimeStr = lastBackupAt
      ? new Date(lastBackupAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    const backupDateStr = lastBackupAt
      ? new Date(lastBackupAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null;

    return (
      <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-5 mt-4 space-y-4 text-left animate-fadeIn">
        <div className="flex items-center gap-3 mb-1 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 shrink-0">
            <HugeiconsIcon icon={CloudIcon} className={`w-5 h-5 ${(isSyncing || isAutoBackingUp) ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h4 className="text-[15.5px] font-black text-kat-dark dark:text-slate-200">{t('settings.auth.dataSync')}</h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold">{t('settings.auth.dataSyncDesc')}</p>
          </div>
        </div>

        {hasCloudVersion && (
          <div className="rounded-[22px] bg-amber-50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 p-4 text-[13.5px] text-amber-900 dark:text-amber-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">{t('settings.auth.newerVersionAlert')}</span>
          </div>
        )}

        {syncError && (
          <div className="rounded-[22px] bg-rose-50 dark:bg-rose-950/15 border border-rose-200/60 dark:border-rose-900/30 p-4 text-[13.5px] text-rose-900 dark:text-rose-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">{syncError}</span>
          </div>
        )}

        {syncSuccess && (
          <div className="rounded-[22px] bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-900/30 p-4 text-[13.5px] text-emerald-900 dark:text-emerald-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={CheckIcon} className="w-4 h-4" strokeWidth={3.5} />
            </div>
            <span className="pt-0.5 flex-1">{syncSuccess}</span>
          </div>
        )}

        {!user ? (
          <div className="rounded-[22px] bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/70 dark:border-amber-900/30 p-4 text-[13.5px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed shadow-soft">
            {t('settings.auth.loginToSync')}
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/[0.04] rounded-[22px] p-4.5 flex justify-between items-center text-[13.5px] font-bold text-slate-500 dark:text-slate-400 min-h-[60px] shadow-soft">
              <span className="text-slate-500 dark:text-slate-400 font-bold">{t('settings.auth.lastSync')}</span>
              {lastBackupAt && backupTimeStr && backupDateStr ? (
                <div className="flex gap-2 items-center">
                  <div className="inline-flex items-center gap-1.5 font-black text-kat-dark dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.04] px-3.5 py-1.5 rounded-full text-[13px]">
                    <HugeiconsIcon icon={Clock01Icon} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{backupTimeStr}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-black text-kat-dark dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.04] px-3.5 py-1.5 rounded-full text-[13px]">
                    <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>{backupDateStr}</span>
                  </div>
                </div>
              ) : (
                <span className="font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.04] px-4 py-1.5 rounded-full text-[13px]">
                  {t('settings.auth.neverSynced')}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4.5 rounded-[22px] border border-slate-200 dark:border-white/[0.04] bg-white dark:bg-slate-800/50 min-h-[76px] shadow-soft">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 shrink-0">
                  <HugeiconsIcon icon={CloudIcon} className="w-5 h-5" />
                </div>
                <div className="text-left pr-2">
                  <span className="text-[14px] font-black text-kat-dark dark:text-slate-200">{t('settings.auth.autoBackupCloud')}</span>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-normal">{t('settings.auth.autoBackupDesc')}</p>
                </div>
              </div>
              
              <button
                type="button"
                role="switch"
                aria-checked={autoBackupEnabled}
                onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoBackupEnabled ? "bg-kat-primary" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    autoBackupEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            onClick={handleSync}
            disabled={!user || isSyncing}
            className="w-full flex items-center justify-center gap-2.5 h-13 rounded-[20px] bg-kat-primary text-white hover:bg-kat-primary-usable active:scale-[0.97] transition-all font-black text-[15px] shadow-[0_4px_14px_rgba(0,191,183,0.25)] hover:shadow-[0_6px_20px_rgba(0,191,183,0.4)] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none shrink-0 motion-press"
          >
            {isSyncing ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>{t('settings.auth.syncing')}</span>
              </>
            ) : isAutoBackingUp ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>{t('settings.auth.autoBackingUp')}</span>
              </>
            ) : (
              <>
                <span>{t('settings.auth.syncNow')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "K";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const renderTitle = () => {
    switch (view) {
      case "auth":
        return t('settings.auth.title');
      case "privacy":
        return t('settings.menu.privacy.title');
      case "about":
        return t('settings.menu.about.title');
      case "donate":
        return t('settings.menu.donate.title');
      case "exchangeRates":
        return t('settings.menu.exchangeRates.title');
      case "theme":
        return t('settings.menu.theme.title');
      case "language":
        return t('settings.menu.language.title');
      default:
        return t('settings.header.title');
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

  const renderHeaderAction = () => {
    if (view !== "menu" && view !== "auth") {
      return (
        <button
          onClick={() => {
            setView("menu");
            setErrorMsg(null);
          }}
          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700/60 focus:outline-none"
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
        onClose={onClose}
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
          <div className="flex flex-col gap-2">

            {/* Install PWA Option (Top position) */}
            {isInstallable && !isStandalone && (
              <button
                onClick={handleInstallPWA}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-teal-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-teal-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-teal-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 shadow-inner dark:from-teal-900/40 dark:to-teal-800/20 dark:text-teal-400">
                    <HugeiconsIcon icon={Download01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{t('settings.menu.install.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.install.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {/* Giao diện (Theme Selector Row) */}
            <button
              onClick={() => setView("theme")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-violet-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-violet-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 shadow-inner dark:from-violet-900/40 dark:to-violet-800/20 dark:text-violet-400">
                    <HugeiconsIcon icon={ColorsIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{t('settings.menu.theme.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.theme.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Language Selector Row */}
            <button
              onClick={() => setView("language")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-sky-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-sky-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-sky-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-inner dark:from-sky-900/40 dark:to-sky-800/20 dark:text-sky-400">
                    <HugeiconsIcon icon={LanguageSkillIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{t('settings.menu.language.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.language.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setView("privacy")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-blue-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-inner dark:from-blue-900/40 dark:to-blue-800/20 dark:text-blue-400">
                    <HugeiconsIcon icon={LockIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t('settings.menu.privacy.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.privacy.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Notifications */}
            {(() => {
              const isNotificationActive = isNotificationSupported && notificationPermission === "granted" && notificationEnabled;
              return (
                <div
                  className="group relative flex items-center justify-between w-full p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-emerald-500/50 mb-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-emerald-500/10"></div>
                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-inner dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-emerald-400">
                      <HugeiconsIcon icon={Notification01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t('settings.menu.notification.title')}</h4>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.notification.desc')}</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isNotificationActive}
                    disabled={!isNotificationSupported}
                    onClick={async () => {
                      if (!isNotificationSupported) return;
                      
                      if (notificationPermission !== "granted") {
                        const result = await requestNotificationPermission();
                        if (result === "granted") {
                          setNotificationEnabled(true);
                          showToast(t("toast.pushNotifEnabled"), "success");
                        } else if (result === "denied") {
                          showToast(t("toast.pushNotifDenied"), "error");
                        }
                      } else {
                        const nextState = !notificationEnabled;
                        setNotificationEnabled(nextState);
                        if (nextState) {
                          showToast(t("toast.inAppNotifEnabled"), "success");
                        } else {
                          showToast(t("toast.inAppNotifDisabled"), "success");
                        }
                      }
                    }}
                    className={`relative z-10 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isNotificationActive ? "bg-kat-primary" : "bg-slate-200 dark:bg-slate-700"
                    } ${!isNotificationSupported ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isNotificationActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })()}

            {/* GPS Setting */}
            <div className="group relative flex items-center justify-between p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-indigo-500/50 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-500/10"></div>
              <div className="flex items-center gap-4 relative z-10 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-inner dark:from-indigo-900/40 dark:to-indigo-800/20 dark:text-indigo-400">
                  <HugeiconsIcon icon={Location01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('settings.menu.location.title')}</h4>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.location.desc')}</p>
                </div>
              </div>
              
              <button
                type="button"
                role="switch"
                aria-checked={gpsEnabled}
                onClick={() => {
                  const nextState = !gpsEnabled;
                  setGpsEnabled(nextState);
                  localStorage.setItem("kat_gps_enabled", String(nextState));
                  showToast(nextState ? t("toast.gpsAutoEnabled") : t("toast.gpsAutoDisabled"), "success");
                }}
                className={`relative z-10 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  gpsEnabled ? "bg-kat-primary" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    gpsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Exchange Rates */}
            <button
              onClick={() => setView("exchangeRates")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-cyan-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-cyan-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-600 shadow-inner dark:from-cyan-900/40 dark:to-cyan-800/20 dark:text-cyan-400">
                    <HugeiconsIcon icon={Coins01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{t('settings.menu.exchangeRates.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.exchangeRates.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            {/* About */}
            <button
              onClick={() => setView("about")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-fuchsia-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-fuchsia-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-fuchsia-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-fuchsia-600 shadow-inner dark:from-fuchsia-900/40 dark:to-fuchsia-800/20 dark:text-fuchsia-400">
                    <HugeiconsIcon icon={InformationCircleIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">{t('settings.menu.about.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.about.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Support Author */}
            <button
              onClick={() => setView("donate")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-amber-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-amber-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-inner dark:from-amber-900/40 dark:to-amber-800/20 dark:text-amber-400">
                    <HugeiconsIcon icon={Coffee01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{t('settings.menu.donate.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.donate.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Send Feedback */}
            <a
              href="mailto:trevorthanhtung@gmail.com?subject=Phản hồi ứng dụng KAT Journey"
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-sky-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-sky-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-sky-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-inner dark:from-sky-900/40 dark:to-sky-800/20 dark:text-sky-400">
                    <HugeiconsIcon icon={Mail01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{t('settings.menu.feedback.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.feedback.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </a>

            {/* Version */}
            <div className="group relative flex items-center justify-between w-full p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-slate-500/50 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-500/10"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 shadow-inner dark:from-slate-800/40 dark:to-slate-700/20 dark:text-slate-400">
                  <HugeiconsIcon icon={PackageIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-left">
                  <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">{t('settings.menu.version.title')}</h4>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.version.desc')}</p>
                </div>
              </div>
              <span className="relative z-10 text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {APP_VERSION}
              </span>
            </div>

            {/* ── Section: Quản lý dữ liệu ── */}
            <div className="pt-2 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 pb-1">{t('settings.menu.dataManagement.title')}</p>
              
              <button
                type="button"
                disabled={isClearingTemp}
                onClick={async () => {
                  setIsClearingTemp(true);
                  setClearTempSuccess(false);
                  try {
                    await clearTemporaryFiles();
                    setClearTempSuccess(true);
                    setTimeout(() => setClearTempSuccess(false), 3000);
                  } finally {
                    setIsClearingTemp(false);
                  }
                }}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-rose-500/50 disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 shadow-inner dark:from-rose-900/40 dark:to-rose-800/20 dark:text-rose-400">
                    {isClearingTemp
                      ? <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 animate-spin" />
                      : <HugeiconsIcon icon={EraserIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:rotate-6" />}
                  </div>
                  <div className="text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{t('settings.menu.dataManagement.clearTemp.title')}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.dataManagement.clearTemp.desc')}</p>
                  </div>
                </div>
                {clearTempSuccess
                  ? <span className="relative z-10 flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-sm">
                      {t('common.done')}
                    </span>
                  : <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-lime-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-lime-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-lime-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 text-lime-600 shadow-inner dark:from-lime-900/40 dark:to-lime-800/20 dark:text-lime-400">
                    {importing 
                      ? <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 animate-spin" />
                      : <HugeiconsIcon icon={PackageReceiveIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5" />}
                  </div>
                  <div className="text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                      {importing ? "..." : t('settings.menu.dataManagement.restoreData.title')}
                    </h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.dataManagement.restoreData.desc')}</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept=".katjourney,application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) previewImportFile(file);
                    event.target.value = "";
                  }}
                />
              </button>
            </div>

            {/* ── Section: Vùng nguy hiểm ── */}
            <div className="pt-1 pb-2">
              <p className="text-[11px] font-bold text-red-400 dark:text-rose-500 uppercase tracking-widest px-2 pb-1">{t('settings.menu.dangerZone.title')}</p>
              {user && !user.isAnonymous ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-red-200/60 bg-white p-4 shadow-sm transition-all hover:border-red-400 hover:shadow-md active:scale-[0.98] dark:border-rose-900/35 dark:bg-slate-800/40 dark:hover:border-rose-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-rose-950/40 dark:to-rose-900/20 dark:text-rose-400">
                      <HugeiconsIcon icon={UserRemove01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[15px] font-bold text-red-700 dark:text-rose-400 group-hover:text-red-600 transition-colors">{t('settings.menu.dangerZone.deleteAccount.title')}</h4>
                      <p className="text-[12px] font-medium text-red-400 dark:text-rose-500 mt-0.5">{t('settings.menu.dangerZone.deleteAccount.desc')}</p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={Delete01Icon} className="relative z-10 h-5.5 w-5.5 text-red-500/80 transition-transform group-hover:scale-110 dark:text-rose-500/80" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFactoryResetOpen(true)}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-red-200/60 bg-white p-4 shadow-sm transition-all hover:border-red-400 hover:shadow-md active:scale-[0.98] dark:border-rose-900/35 dark:bg-slate-800/40 dark:hover:border-rose-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-rose-950/40 dark:to-rose-900/20 dark:text-rose-400">
                      <HugeiconsIcon icon={RotateLeft01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[15px] font-bold text-red-700 dark:text-rose-400 group-hover:text-red-600 transition-colors">{t('settings.menu.dangerZone.factoryReset.title')}</h4>
                      <p className="text-[12px] font-medium text-red-400 dark:text-rose-500 mt-0.5">{t('settings.menu.dangerZone.factoryReset.desc')}</p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={Delete01Icon} className="relative z-10 h-5.5 w-5.5 text-red-500/80 transition-transform group-hover:scale-110 dark:text-rose-500/80" />
                </button>
              )}
            </div>

          </div>
        )}

        {view === "auth" && (
          <div className="space-y-5 py-2">
            {authLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <HugeiconsIcon icon={Loading01Icon} className="h-8 w-8 text-kat-teal animate-spin" />
                <p className="text-sm font-bold text-slate-400">{t('settings.authView.loading')}</p>
              </div>
            ) : !user ? (
              <>
                <div className="space-y-6 flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary ring-4 ring-kat-primary/5">
                    <HugeiconsIcon icon={CompassIcon} className="h-6 w-6" />
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-[20px] font-black text-kat-dark text-balance">{t('settings.authView.welcome')}</h3>
                    <p className="text-[13.5px] font-semibold leading-relaxed text-slate-500">
                      {t('settings.authView.guestDesc')}
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-2">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={actionLoading !== null}
                      className="group relative flex w-full items-center justify-center gap-3 min-h-[50px] overflow-hidden rounded-[20px] border border-slate-200/60 bg-white font-bold text-[15px] text-kat-dark shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] disabled:opacity-60 dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50"
                    >
                      {actionLoading === "google" ? (
                        <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 text-kat-teal animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      {t('settings.authView.continueGoogle')}
                    </button>

                    <button
                      onClick={handleGuestSignIn}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-3 min-h-[50px] rounded-[16px] bg-kat-teal hover:bg-kat-teal bg-opacity-90 text-kat-dark transition-all font-black text-[15px] active:scale-[0.98] shadow-sm disabled:opacity-60"
                    >
                      {actionLoading === "guest" ? (
                        <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 text-kat-dark animate-spin" />
                      ) : (
                        <HugeiconsIcon icon={UserIcon} className="h-5 w-5" />
                      )}
                      {t('settings.authView.continueGuest')}
                    </button>
                  </div>
                </div>
                {renderBackupSection()}
              </>
            ) : (
              <div className="space-y-6">
                {/* Unified User Info Card with Edit Display Name support */}
                <div className="flex items-center gap-4.5 p-5 rounded-[24px] bg-gradient-to-br from-white to-[#F8FAFC]/80 dark:from-slate-900/60 dark:to-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-350">
                  {provider === "google" ? (
                    user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "Avatar"} 
                        className="h-14 w-14 rounded-full border border-slate-200/80 dark:border-white/[0.04] object-cover shadow-sm shrink-0 ring-2 ring-slate-100 dark:ring-slate-900"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-lg shadow-inner shrink-0">
                        {getInitials(user.displayName || "Google User")}
                      </div>
                    )
                  ) : (
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#0081BE] via-kat-teal to-[#80EAD6] text-white shadow-[0_4px_16px_rgba(0,191,183,0.2)] border-2 border-white dark:border-slate-800 shrink-0">
                      <HugeiconsIcon icon={UserIcon} className="h-6.5 w-6.5 text-white" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white dark:border-slate-800"></span>
                      </span>
                    </div>
                  )}

                  {isEditingName ? (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 h-10 px-3 text-[14.5px] font-bold text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-kat-teal/40 min-w-0"
                        placeholder={t('settings.authView.displayName')}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateName();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={actionLoading !== null || !newName.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-kat-teal text-kat-dark hover:brightness-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
                      >
                        {actionLoading === "guest" ? (
                          <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <HugeiconsIcon icon={CheckIcon} className="w-4.5 h-4.5" strokeWidth={3} />
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={actionLoading !== null}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5 max-w-full">
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="flex items-center gap-2 text-left hover:opacity-85 transition-all min-w-0 group"
                          title="Đổi tên hiển thị"
                        >
                          <h3 className="text-[17.5px] font-black text-slate-800 dark:text-slate-200 leading-snug truncate">
                            {user.displayName || (provider === "guest" ? t('settings.authView.localAccount') : t('settings.authView.anonymousAccount'))}
                          </h3>
                          <div className="p-1.5 text-slate-400 dark:text-slate-500 group-hover:text-kat-teal group-hover:bg-slate-100 dark:group-hover:bg-slate-800 rounded-lg shrink-0 transition-all">
                            <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                        </button>
                      </div>
                      {provider === "google" && user.email && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold leading-normal truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <div className="mt-2.5">
                        {provider === "google" ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <span className="text-[#4285F4]">G</span>
                            <span className="text-[#EA4335]">O</span>
                            <span className="text-[#FBBC05]">O</span>
                            <span className="text-[#4285F4]">G</span>
                            <span className="text-[#34A853]">L</span>
                            <span className="text-[#EA4335]">E</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250/50 dark:border-amber-900/30 shadow-[inset_0_1px_1px_rgba(245,158,11,0.05)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t('settings.authView.notSynced')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {provider === "guest" && (
                  <>
                    <div className="p-4 rounded-[22px] bg-kat-primary-soft dark:bg-cyan-950/15 border border-[#00BFB7]/25 dark:border-[#00BFB7]/20 text-left flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00BFB7]/15 dark:bg-[#00BFB7]/10 text-kat-primary-usable dark:text-cyan-400 shrink-0 mt-0.5">
                        <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                      </div>
                      <p className="text-[13px] font-semibold leading-relaxed text-slate-650 dark:text-slate-300">
                        {t('settings.authView.guestNotice1')}<strong className="font-extrabold text-slate-800 dark:text-slate-200">{t('settings.authView.safe')}</strong>{t('settings.authView.guestNotice2')}<strong className="font-extrabold text-slate-800 dark:text-slate-200">{t('settings.authView.shareTrip')}</strong>{t('settings.authView.guestNotice3')}
                      </p>
                    </div>

                    {/* Guest Action Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-3 h-13 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-[0.98] transition-all font-bold text-[14.5px] text-slate-800 dark:text-slate-200 shadow-sm hover:shadow-md disabled:opacity-60 relative overflow-hidden"
                      >
                        {actionLoading === "google" ? (
                          <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 text-kat-teal animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                        {t('settings.authView.linkGoogle')}
                      </button>

                      <button
                        onClick={handleBackupAllData}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-2.5 h-11.5 rounded-[16px] border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:scale-[0.98] transition-all font-bold text-[13px] disabled:opacity-60 shadow-sm"
                      >
                        <HugeiconsIcon icon={Download01Icon} className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                        {t('settings.authView.manualBackup')}
                      </button>
                    </div>
                  </>
                )}


                {renderBackupSection()}
              </div>
            )}
          </div>
        )}

        {view === "privacy" && (
          <div className="space-y-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-primary border border-kat-primary/20 mb-2">
              <HugeiconsIcon icon={LockIcon} className="h-6 w-6" />
            </div>

            <h3 className="text-[18px] font-black text-kat-dark text-balance">{t('settings.privacyView.title')}</h3>

            <div className="space-y-3.5 text-[14px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <strong className="dark:text-slate-200">{t('settings.privacyView.offlineTitle')}</strong>{t('settings.privacyView.offlineDesc')}
              </p>
              <p>
                <strong className="dark:text-slate-200">{t('settings.privacyView.identityTitle')}</strong>{t('settings.privacyView.identityDesc')}
              </p>
              <p>
                <strong className="dark:text-slate-200">{t('settings.privacyView.noDataTitle')}</strong>{t('settings.privacyView.noDataDesc')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-4 w-full inline-flex min-h-[50px] items-center justify-center rounded-[18px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.04] text-slate-700 dark:text-slate-300 px-6 font-bold hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}

        {view === "about" && (
          <div className="space-y-4 py-2 text-center flex flex-col items-center">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-16 w-16 object-contain drop-shadow-sm mb-2" />
            
            <h3 className="text-[20px] font-black text-kat-dark">KAT Journey</h3>
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-white/[0.04]">
              {t('settings.aboutView.subtitle')}
            </span>

            <p className="text-[14px] font-semibold leading-relaxed text-slate-650 dark:text-slate-300 text-center max-w-sm mt-2">
              {t('settings.aboutView.desc')}
            </p>

            <div className="w-full max-w-lg rounded-[24px] border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-slate-800/40 p-5 text-left shadow-soft">
              <h4 className="text-[13.5px] font-black text-kat-dark">{t('settings.aboutView.techTitle')}</h4>
              <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                {t('settings.aboutView.techDesc1')}
              </p>
              <p className="mt-2 text-[11.5px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
                {t('settings.aboutView.techDesc2')}
              </p>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                {t('settings.aboutView.madeBy')}{" "}
                <a
                  href="https://tranthanhtung-trevor.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-slate-500 dark:text-slate-400 font-bold"
                >
                  thanhtungg.
                </a>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-4 w-full inline-flex min-h-[50px] items-center justify-center rounded-[18px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.04] text-slate-700 dark:text-slate-300 px-6 font-bold hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}

        {view === "donate" && (
          <div className="space-y-5 flex flex-col items-center text-center py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shadow-sm">
              <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h4 className="text-[18px] font-black text-kat-dark dark:text-slate-200">{t('settings.donateView.title')}</h4>
              <p className="text-[14px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                {t('settings.donateView.desc1')}
              </p>
              <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                {t('settings.donateView.desc2')}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-[85%] max-w-[280px] mb-2 mt-2">
              <button
                onClick={() => setDonateTab("vn")}
                className={classNames(
                  "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
                  donateTab === "vn" ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {t("settings.donateView.tabVietQR", "VietQR")}
              </button>
              <button
                onClick={() => setDonateTab("intl")}
                className={classNames(
                  "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
                  donateTab === "intl" ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {t("settings.donateView.tabInternational", "International")}
              </button>
            </div>

            {donateTab === "vn" ? (
              <>
                <div className="w-[85%] max-w-[280px] p-4 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/[0.04] rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
                  <img 
                    src="/asset/donates.png" 
                    alt="Donate QR Code" 
                    className="w-full h-auto rounded-[16px] object-contain aspect-square" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="mt-3 text-[11px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                    {t('settings.donateView.scanQR')}
                  </span>
                </div>

                <a 
                  href="/asset/donates.png" 
                  download="kat-journey-donate-qr.png"
                  className="text-[13px] font-bold text-kat-teal hover:underline flex items-center gap-1 active:scale-95 transition-all"
                >
                  <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                  {t('settings.donateView.saveQR')}
                </a>
              </>
            ) : (
              <div className="w-full max-w-[280px] space-y-3 mt-2">
                <a 
                  href="https://paypal.me/trevorthanhtung"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full gap-2 py-3.5 px-4 rounded-[16px] bg-[#00457C] text-white font-extrabold text-[14px] transition-all hover:bg-[#005a9e] active:scale-[0.98] shadow-sm"
                >
                  <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5" />
                  {t("settings.donateView.supportPayPal", "Support via PayPal")}
                </a>
                <p className="text-[12px] font-medium text-slate-400 mt-3">
                  {t("settings.donateView.thankYou", "(Thank you for your support!)")}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setView("menu")}
              className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}

        {view === "exchangeRates" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4" />
                  <span className="text-[13px] font-bold">Vietcombank</span>
                </div>
                <div className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t('settings.exchangeRatesView.unit')}</div>
              </div>

              <div className="space-y-2">
                {exchangeRates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <HugeiconsIcon icon={Loading01Icon} className="w-5 h-5 animate-spin mb-2" />
                    <span className="text-[13px] font-medium">{t('settings.exchangeRatesView.loading')}</span>
                  </div>
                ) : (
                  exchangeRates.map((rate, idx) => (
                    <div 
                      key={rate.currencyCode} 
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center font-bold text-slate-700 dark:text-slate-400 text-[13px] border border-slate-100 dark:border-slate-800/50">
                          {rate.currencyCode}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{rate.currencyName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-black text-kat-primary">
                          {new Intl.NumberFormat('vi-VN').format(rate.transfer)}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                          {t('settings.exchangeRatesView.transfer')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setView("menu")}
              className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}

        {view === "language" && (
          <div className="space-y-5 animate-fadeIn text-left">
            <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-kat-border/30 rounded-[28px] p-5">
              <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-5 leading-relaxed text-center">
                {t('settings.languageView.desc')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { code: 'vi', label: 'Tiếng Việt', char: 'Vi', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200/50 dark:border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
                  { code: 'en', label: 'English', char: 'En', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200/50 dark:border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
                  { code: 'ko', label: '한국어', char: '한', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200/50 dark:border-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
                  { code: 'zh', label: '中文', char: '文', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200/50 dark:border-red-500/20', text: 'text-red-600 dark:text-red-400' },
                  { code: 'ja', label: '日本語', char: 'あ', bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', border: 'border-fuchsia-200/50 dark:border-fuchsia-500/20', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
                  { code: 'th', label: 'ไทย', char: 'ก', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200/50 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
                  { code: 'es', label: 'Español', char: 'Es', bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200/50 dark:border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' },
                  { code: 'fr', label: 'Français', char: 'Fr', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200/50 dark:border-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
                  { code: 'de', label: 'Deutsch', char: 'De', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200/50 dark:border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
                  { code: 'it', label: 'Italiano', char: 'It', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200/50 dark:border-teal-500/20', text: 'text-teal-600 dark:text-teal-400' },
                  { code: 'pt', label: 'Português', char: 'Pt', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200/50 dark:border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
                  { code: 'id', label: 'Indonesia', char: 'Id', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200/50 dark:border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={classNames(
                      "relative flex items-center gap-3.5 p-3 rounded-[20px] border-2 transition-all duration-300 group focus:outline-none text-left overflow-hidden w-full",
                      i18n.language === lang.code
                        ? "border-kat-primary bg-kat-primary/5 shadow-md scale-[1.02] dark:border-kat-primary/50 dark:bg-kat-primary/10"
                        : "border-slate-100 dark:border-white/[0.04] bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:scale-[1.01] active:scale-[0.98]"
                    )}
                  >
                    {/* Icon */}
                    <div className={classNames(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] shadow-sm transition-transform duration-300 group-hover:scale-105",
                      lang.bg,
                      "border",
                      lang.border
                    )}>
                      <span className={classNames("font-black text-[18px]", lang.text)}>
                        {lang.char}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span className={classNames(
                        "block text-[14.5px] font-bold truncate transition-colors duration-200",
                        i18n.language === lang.code ? "text-kat-primary" : "text-slate-800 dark:text-slate-200"
                      )}>
                        {lang.label}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    <div className={classNames(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mr-1",
                      i18n.language === lang.code 
                        ? "border-kat-primary bg-kat-primary" 
                        : "border-slate-200 dark:border-slate-700 bg-transparent opacity-0 group-hover:opacity-100"
                    )}>
                      {i18n.language === lang.code && (
                        <HugeiconsIcon icon={CheckIcon} className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setView("menu")}
              className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}

        {view === "theme" && (
          <div className="space-y-5 animate-fadeIn text-left">
            <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-kat-border/30 rounded-[28px] p-5">
              <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500 mb-5 leading-relaxed text-center">
                {t('settings.themeView.desc')}
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={classNames(
                    "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-none w-full",
                    theme === "light"
                      ? "border-amber-400 bg-amber-50 shadow-[0_4px_20px_rgba(251,191,36,0.15)] scale-[1.02] dark:border-amber-500/50 dark:bg-amber-500/5 dark:shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
                      : "bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98]"
                  )}
                >
                  {/* Mini Screen Preview */}
                  <div className="w-[76px] h-[52px] rounded-xl bg-white border border-slate-200/80 relative overflow-hidden flex flex-col items-center justify-center shadow-sm shrink-0 mt-0.5">
                    <div className="absolute top-0 inset-x-0 h-2 bg-slate-50 border-b border-slate-100" />
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <HugeiconsIcon icon={Sun01Icon} className="w-5 h-5 text-amber-500 transition-transform duration-500 group-hover:rotate-45" />
                    </div>
                  </div>

                  <div className="mt-2.5 mb-0.5">
                    <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                      {t('settings.themeView.light')}
                    </span>
                    <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                      {t('settings.themeView.lightDesc')}
                    </span>
                  </div>

                  {theme === "light" && (
                    <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
                  )}
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={classNames(
                    "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-none w-full",
                    theme === "dark"
                      ? "border-violet-400 bg-violet-50 shadow-[0_4px_20px_rgba(167,139,250,0.15)] scale-[1.02] dark:border-violet-500/50 dark:bg-violet-500/5 dark:shadow-[0_4px_20px_rgba(139,92,246,0.12)]"
                      : "bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98]"
                  )}
                >
                  {/* Mini Screen Preview */}
                  <div className="w-[76px] h-[52px] rounded-xl bg-slate-950 border border-slate-900 relative overflow-hidden flex flex-col items-center justify-center shadow-sm shrink-0 mt-0.5">
                    <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 border-b border-slate-800" />
                    <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <HugeiconsIcon icon={Moon01Icon} className="w-5 h-5 text-violet-400 transition-transform duration-500 group-hover:-rotate-12" />
                    </div>
                  </div>

                  <div className="mt-2.5 mb-0.5">
                    <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                      {t('settings.themeView.dark')}
                    </span>
                    <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                      {t('settings.themeView.darkDesc')}
                    </span>
                  </div>

                  {theme === "dark" && (
                    <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
                  )}
                </button>

                {/* Automatic Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={classNames(
                    "flex flex-col items-center justify-between p-3 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden group select-none h-[142px] text-center focus:outline-none w-full",
                    theme === "system"
                      ? "border-teal-400 bg-teal-50 shadow-[0_4px_20px_rgba(45,212,191,0.15)] scale-[1.02] dark:border-teal-500/50 dark:bg-teal-500/5 dark:shadow-[0_4px_20px_rgba(20,184,166,0.08)]"
                      : "bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.98]"
                  )}
                >
                  {/* Mini Screen Preview (Split) */}
                  <div className="w-[76px] h-[52px] rounded-xl bg-white border border-slate-200/80 relative overflow-hidden shadow-sm shrink-0 mt-0.5">
                    {/* Light Underlay */}
                    <div className="absolute inset-0 flex items-center justify-start pl-2 bg-white">
                      <div className="absolute top-0 inset-x-0 h-2 bg-slate-50 border-b border-slate-100" />
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        <HugeiconsIcon icon={Sun01Icon} className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                    </div>

                    {/* Dark Overlay (Clipped) */}
                    <div
                      className="absolute inset-0 bg-slate-950 flex items-center justify-end pr-2 border-l border-slate-900"
                      style={{ clipPath: "polygon(100% 0, 0% 100%, 100% 100%)" }}
                    >
                      <div className="absolute top-0 inset-x-0 h-2 bg-slate-900 border-b border-slate-800" />
                      <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        <HugeiconsIcon icon={Moon01Icon} className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 mb-0.5">
                    <span className="block text-[13.5px] font-black text-slate-800 dark:text-slate-200">
                      {t('settings.themeView.system')}
                    </span>
                    <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                      {t('settings.themeView.systemDesc')}
                    </span>
                  </div>

                  {theme === "system" && (
                    <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setView("menu")}
              className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"
            >
              {t('settings.actions.backToMenu')}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>

    <BottomSheet
      isOpen={isRestoreConfirmOpen}
      onClose={() => setIsRestoreConfirmOpen(false)}
      title={t('settings.dialogs.cloudRestore.title')}
    >
      <div className="space-y-5 text-left">
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 text-[13px] text-amber-900 dark:text-amber-350 font-bold leading-relaxed flex items-start gap-3">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>{t('settings.dialogs.cloudRestore.warning')}</span>
        </div>

        <div className="space-y-3.5">
          {/* Option 1: Merge */}
          <label className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md ${
            restoreMode === "merge"
              ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20 dark:ring-indigo-500/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/60"
          }`}>
            <input
              type="radio"
              name="restoreMode"
              value="merge"
              checked={restoreMode === "merge"}
              onChange={() => setRestoreMode("merge")}
              className="sr-only"
            />
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              restoreMode === "merge" 
                ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/50" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.04]"
            }`}>
              <HugeiconsIcon icon={GitMergeIcon} className="w-5.5 h-5.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className={`text-[14.5px] font-black leading-tight ${
                restoreMode === "merge" ? "text-indigo-950 dark:text-indigo-300" : "text-kat-dark"
              }`}>
                {t('settings.dialogs.cloudRestore.mergeTitle')}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-normal">
                {t('settings.dialogs.cloudRestore.mergeDesc')}
              </p>
            </div>
            <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              restoreMode === "merge" 
                ? "border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900" 
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            }`}>
              {restoreMode === "merge" && (
                <div className="h-3 w-3 rounded-full bg-indigo-600 dark:bg-indigo-500" />
              )}
            </div>
          </label>

          {/* Option 2: Replace */}
          <label className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md ${
            restoreMode === "replace"
              ? "border-rose-600 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500/20 dark:ring-rose-500/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/60"
          }`}>
            <input
              type="radio"
              name="restoreMode"
              value="replace"
              checked={restoreMode === "replace"}
              onChange={() => setRestoreMode("replace")}
              className="sr-only"
            />
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              restoreMode === "replace" 
                ? "bg-rose-600 text-white border-rose-600 dark:bg-rose-500/20 dark:text-rose-450 dark:border-rose-500/50" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.04]"
            }`}>
              <HugeiconsIcon icon={Delete01Icon} className="w-5.5 h-5.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className={`text-[14.5px] font-black leading-tight ${
                restoreMode === "replace" ? "text-rose-950 dark:text-rose-300" : "text-kat-dark"
              }`}>
                {t('settings.dialogs.cloudRestore.replaceTitle')}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-normal">
                <span className="font-extrabold text-rose-650 dark:text-rose-400 uppercase tracking-wider block text-[10.5px] mb-0.5">{t('settings.dialogs.cloudRestore.replaceWarning')}</span>
                {t('settings.dialogs.cloudRestore.replaceDesc')}
              </p>
            </div>
            <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              restoreMode === "replace" 
                ? "border-rose-600 dark:border-rose-500 bg-white dark:bg-slate-900" 
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            }`}>
              {restoreMode === "replace" && (
                <div className="h-3 w-3 rounded-full bg-rose-600 dark:bg-rose-500" />
              )}
            </div>
          </label>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsRestoreConfirmOpen(false)}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all duration-200 border border-transparent dark:border-slate-700 motion-press"
          >
            {t('settings.dialogs.cloudRestore.cancel')}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            className={`flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] text-white dark:text-slate-200 px-6 font-black active:scale-[0.98] transition-all duration-200 motion-press shadow-sm border border-transparent dark:border-white/[0.04] ${
              restoreMode === "replace"
                ? "bg-rose-600 hover:bg-rose-700 hover:shadow-rose-100"
                : "bg-kat-dark dark:bg-slate-800 hover:bg-kat-dark dark:hover:bg-slate-700 bg-opacity-90 hover:shadow-indigo-100"
            }`}
          >
            {t('settings.dialogs.cloudRestore.continue')}
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
      title={t('settings.dialogs.fileRestore.title')}
    >
      <div className="space-y-5 text-left">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13.5px] text-amber-800 font-semibold leading-relaxed flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
          <span>{t('settings.dialogs.fileRestore.warning')}</span>
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
            {t('settings.dialogs.fileRestore.cancel')}
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
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-slate-800 border border-kat-dark dark:border-white/[0.04] px-6 font-bold text-white dark:text-slate-200 hover:bg-kat-dark dark:hover:bg-slate-700 bg-opacity-90 active:scale-98 transition-all duration-200 shadow-sm"
          >
            <HugeiconsIcon icon={Upload01Icon} className="h-5 w-5" />
            {t('settings.dialogs.fileRestore.restore')}
          </button>
        </div>
      </div>
    </BottomSheet>

      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />
      <FactoryResetModal
        isOpen={isFactoryResetOpen}
        onClose={() => setIsFactoryResetOpen(false)}
      />

      {/* ── Import Preview Modal ── */}
      {isImportPreviewOpen && importPreview && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-kat-surface w-full max-w-md rounded-[28px] border border-slate-200 dark:border-kat-border/60 shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                  <HugeiconsIcon icon={PackageReceiveIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-kat-dark dark:text-slate-100">{t('settings.dialogs.importPreview.title')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{t('settings.dialogs.importPreview.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsImportPreviewOpen(false); setImportPreview(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              </button>
            </div>

            {/* Trip info */}
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4">
                <p className="text-[11px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider mb-1">{t('settings.dialogs.importPreview.tripName')}</p>
                <p className="text-[18px] font-black text-kat-dark dark:text-slate-100 leading-tight">{importPreview.tripName}</p>
                {importPreview.exportedAt && (
                  <p className="text-[11px] text-indigo-400 dark:text-indigo-500 font-medium mt-1">
                    {t('settings.dialogs.importPreview.exportedAt')} {new Date(importPreview.exportedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t('settings.dialogs.importPreview.members'), value: importPreview.memberCount },
                  { label: t('settings.dialogs.importPreview.timeline'), value: importPreview.eventCount },
                  { label: t('settings.dialogs.importPreview.expenses'), value: importPreview.expenseCount },
                  { label: t('settings.dialogs.importPreview.checklist'), value: importPreview.checklistCount },
                  { label: t('settings.dialogs.importPreview.journal'), value: importPreview.journalCount },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] p-3 text-center">
                    <p className="text-[20px] font-black text-kat-dark dark:text-slate-100">{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{item.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium text-center leading-relaxed">
                {t('settings.dialogs.importPreview.notice')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                onClick={() => { setIsImportPreviewOpen(false); setImportPreview(null); }}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
              >
                {t('settings.dialogs.importPreview.cancel')}
              </button>
              <button
                onClick={() => importTrip(importPreview.parsed)}
                disabled={importing}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary font-black text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] border border-transparent dark:border-kat-primary dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent"
              >
                {importing ? <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />}
                {importing ? t('settings.dialogs.importPreview.importing') : t('settings.dialogs.importPreview.importNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      <PWAInstallInstructionsSheet isOpen={isIosGuideOpen} onClose={() => setIsIosGuideOpen(false)} />
    </>
  );
}
