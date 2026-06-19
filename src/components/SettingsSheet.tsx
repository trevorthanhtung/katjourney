import React, { useState, useEffect } from "react";
import { useNotification } from "../hooks/useNotification";
import { showToast } from "./ui/ToastManager";
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
} from "@hugeicons/core-free-icons";
import { BottomSheet } from "./ui";
import { useAuth } from "../hooks/useAuth";
import { useCloudBackup } from "../hooks/useCloudBackup";
import { signInAsGuest, signInWithGoogle, signOutUser, updateUserDisplayName } from "../services/authService";
import { db } from "../db";
import { clearTemporaryFiles } from "../utils/dataActions";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { FactoryResetModal } from "./FactoryResetModal";
import { useModalHistory } from "../hooks/useModalHistory";
import { today, checklistSections, packingTripTypes } from "../utils/helpers";
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

type SettingsView = "menu" | "auth" | "privacy" | "about" | "donate" | "exchangeRates";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);


export function SettingsSheet({ isOpen, onClose, initialView, syncProps, onTripSelected }: SettingsSheetProps) {
  const { user, loading: authLoading, provider, isAuthenticated } = useAuth();
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
        setSyncSuccess("Đã đồng bộ dữ liệu lên Cloud thành công!");
      } else if (result === "up_to_date") {
        setSyncSuccess("Dữ liệu đã được cập nhật mới nhất.");
      } else if (result === "prompt_restore") {
        // Show restore confirm modal
        setIsRestoreConfirmOpen(true);
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      setSyncError("Đồng bộ thất bại: " + (err.message || err));
    }
  };

  const handleRestore = async () => {
    setIsRestoreConfirmOpen(false);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      await restoreNow(restoreMode);
      setSyncSuccess(`Khôi phục dữ liệu (${restoreMode === "merge" ? "hợp nhất" : "thay thế"}) thành công!`);
    } catch (err: any) {
      console.error("Restore failed:", err);
      setSyncError("Khôi phục thất bại: " + (err.message || err));
    }
  };

  /** Step 1: Read file and show preview modal */
  async function previewImportFile(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as any;
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        showToast("Tệp không đúng định dạng KAT Journey.", "error");
        return;
      }
      setImportPreview({
        parsed,
        tripName: parsed.trip.title ?? "Không có tên",
        exportedAt: parsed.exportedAt ?? "",
        memberCount: (parsed.members ?? []).length,
        eventCount: (parsed.events ?? []).length,
        expenseCount: (parsed.expenses ?? []).length,
        checklistCount: (parsed.checklist ?? []).length,
        journalCount: (parsed.journals ?? []).length,
      });
      setIsImportPreviewOpen(true);
    } catch {
      showToast("Không đọc được tệp. Đảm bảo file đúng định dạng .katjourney", "error");
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
      showToast("Đã nhập chuyến đi thành công!");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể import tệp này.", "error");
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
      <div className="border-t border-slate-200/60 pt-5 mt-4 space-y-4 text-left animate-fadeIn">
        <div className="flex items-center gap-3 mb-1 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/70 text-indigo-600 border border-indigo-100/40 shrink-0">
            <HugeiconsIcon icon={CloudIcon} className={`w-5 h-5 ${(isSyncing || isAutoBackingUp) ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h4 className="text-[15.5px] font-black text-kat-dark">Đồng bộ dữ liệu</h4>
            <p className="text-[12px] text-slate-455 font-semibold">Tự động sao lưu và bảo mật dữ liệu</p>
          </div>
        </div>

        {hasCloudVersion && (
          <div className="rounded-[22px] bg-amber-50 border border-amber-200/60 p-4 text-[13.5px] text-amber-900 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">Có phiên bản mới hơn trên Cloud. Vui lòng bấm Đồng bộ để tải về.</span>
          </div>
        )}

        {syncError && (
          <div className="rounded-[22px] bg-rose-50 border border-rose-200/60 p-4 text-[13.5px] text-rose-900 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">{syncError}</span>
          </div>
        )}

        {syncSuccess && (
          <div className="rounded-[22px] bg-emerald-50 border border-emerald-200/60 p-4 text-[13.5px] text-emerald-900 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <HugeiconsIcon icon={CheckIcon} className="w-4 h-4" strokeWidth={3.5} />
            </div>
            <span className="pt-0.5 flex-1">{syncSuccess}</span>
          </div>
        )}

        {!user ? (
          <div className="rounded-[22px] bg-amber-50/50 border border-amber-100/70 p-4 text-[13.5px] text-amber-800 font-bold leading-relaxed shadow-soft">
            Vui lòng đăng nhập để sử dụng đồng bộ.
          </div>
        ) : (
          <>
            {/* 2. Status Card (Thông tin tĩnh) */}
            <div className="bg-white border border-slate-200 rounded-[22px] p-4.5 flex justify-between items-center text-[13.5px] font-bold text-slate-500 min-h-[60px] shadow-soft">
              <span className="text-slate-550 font-bold">Lần đồng bộ cuối</span>
              {lastBackupAt && backupTimeStr && backupDateStr ? (
                <div className="flex gap-2 items-center">
                  <div className="inline-flex items-center gap-1.5 font-black text-kat-dark bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-[13px]">
                    <HugeiconsIcon icon={Clock01Icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{backupTimeStr}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-black text-kat-dark bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-[13px]">
                    <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{backupDateStr}</span>
                  </div>
                </div>
              ) : (
                <span className="font-black text-slate-450 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-full text-[13px]">
                  Chưa từng đồng bộ
                </span>
              )}
            </div>

            {/* 3. Action Card (Thiết lập) */}
            <div className="flex items-center justify-between p-4.5 rounded-[22px] border border-slate-200 bg-white min-h-[76px] shadow-soft">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/70 text-indigo-600 border border-indigo-100/40 shrink-0">
                  <HugeiconsIcon icon={CloudIcon} className="w-5 h-5" />
                </div>
                <div className="text-left pr-2">
                  <span className="text-[14px] font-black text-kat-dark">Tự động sao lưu lên Cloud</span>
                  <p className="text-[12px] text-slate-455 font-semibold mt-0.5 leading-normal">Sao lưu ngầm sau khi thay đổi dữ liệu 5s</p>
                </div>
              </div>
              
              {/* Premium Switch Component */}
              <button
                type="button"
                role="switch"
                aria-checked={autoBackupEnabled}
                onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoBackupEnabled ? "bg-kat-primary" : "bg-slate-200"
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
                <span>Đang đồng bộ dữ liệu...</span>
              </>
            ) : isAutoBackingUp ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>Đang tự động sao lưu...</span>
              </>
            ) : (
              <>
                <span>Đồng bộ dữ liệu ngay</span>
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
        return "Tài khoản & Đồng bộ";
      case "privacy":
        return "Quyền riêng tư";
      case "about":
        return "Thông tin ứng dụng";
      case "donate":
        return "Ủng hộ tác giả";
      case "exchangeRates":
        return "Tỉ giá ngoại tệ";
      default:
        return "Cài đặt";
    }
  };

  const renderSubtitle = () => {
    if (view === "menu") return "Tùy chỉnh hệ thống và cá nhân hóa trải nghiệm";
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
          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none"
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
                className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none mb-2"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-100">
                    <HugeiconsIcon icon={Download01Icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800">Mang KAT Journey theo bạn</h4>
                    <p className="text-[12px] text-slate-400 font-medium">Mở app siêu tốc từ màn hình chính, dùng mượt mà không quảng cáo</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
              </button>
            )}

            <button
              onClick={() => setView("privacy")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  <HugeiconsIcon icon={LockIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Quyền riêng tư</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Quản lý an toàn dữ liệu và quyền cá nhân</p>
                </div>
              </div>
              <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
            </button>

            {/* Notifications */}
            {(() => {
              const isNotificationActive = isNotificationSupported && notificationPermission === "granted" && notificationEnabled;
              return (
                <div
                  className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <HugeiconsIcon icon={Notification01Icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-[15px] font-bold text-slate-800">Thông báo</h4>
                      <p className="text-[12px] text-slate-400 font-medium">Nhắc lịch, chi phí và hoạt động chuyến đi</p>
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
                          showToast("Đã bật nhận thông báo thành công!", "success");
                        } else if (result === "denied") {
                          showToast("Quyền thông báo bị từ chối. Hãy bật lại trong cài đặt trình duyệt.", "error");
                        }
                      } else {
                        const nextState = !notificationEnabled;
                        setNotificationEnabled(nextState);
                        if (nextState) {
                          showToast("Đã bật nhận thông báo từ ứng dụng.", "success");
                        } else {
                          showToast("Đã tắt nhận thông báo từ ứng dụng.", "success");
                        }
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isNotificationActive ? "bg-kat-primary" : "bg-slate-200"
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
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] mb-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <HugeiconsIcon icon={Location01Icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800">Vị trí</h4>
                    <p className="text-[12px] text-slate-400 font-medium">Tự động gợi ý địa điểm và ngoại tệ</p>
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
                    showToast(nextState ? "Đã bật tự động truy cập GPS." : "Đã tắt tự động truy cập GPS.", "success");
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    gpsEnabled ? "bg-kat-primary" : "bg-slate-200"
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
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none mb-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <HugeiconsIcon icon={Coins01Icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[15px] font-bold text-slate-800">Tỉ giá ngoại tệ</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Dữ liệu trực tuyến từ Vietcombank</p>
                </div>
              </div>
              <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
            </button>

            {/* About */}
            <button
              onClick={() => setView("about")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none mb-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                  <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Thông tin ứng dụng</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Khám phá thông tin và hành trình phát triển</p>
                </div>
              </div>
              <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
            </button>

            {/* Support Author */}
            <button
              onClick={() => setView("donate")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[15px] font-bold text-slate-800">Ủng hộ tác giả</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Tiếp thêm động lực để ứng dụng phát triển hơn</p>
                </div>
              </div>
              <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
            </button>

            {/* Send Feedback */}
            <a
              href="mailto:trevorthanhtung@gmail.com?subject=Phản hồi ứng dụng KAT Journey"
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                  <HugeiconsIcon icon={Mail01Icon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Góp ý & Phản hồi</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Chia sẻ ý kiến giúp KAT Journey hoàn thiện hơn mỗi ngày</p>
                </div>
              </div>
              <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
            </a>

            {/* Version */}
            <div className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200/50">
                  <HugeiconsIcon icon={PackageIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Phiên bản</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Phiên bản hiện tại trên thiết bị</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full border border-slate-200">
                2.0.0
              </span>
            </div>

            {/* ── Section: Quản lý dữ liệu ── */}
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1 pb-2">Quản lý dữ liệu</p>
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
                className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 active:scale-[0.99] transition-all text-left focus:outline-none disabled:opacity-60"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {isClearingTemp
                      ? <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 animate-spin" />
                      : <HugeiconsIcon icon={EraserIcon} className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800">Dọn dẹp tệp tạm</h4>
                    <p className="text-[12px] text-slate-400 font-medium">Xóa bộ nhớ đệm và tệp không quan trọng</p>
                  </div>
                </div>
                {clearTempSuccess
                  ? <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <HugeiconsIcon icon={CheckIcon} className="h-3 w-3" /> Xong!
                    </span>
                  : <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />}
              </button>

              <label className="group flex w-full cursor-pointer items-center justify-between bg-slate-50 border border-slate-100 px-4 py-4 rounded-[20px] text-left hover:bg-slate-100/70 transition-all focus-within:ring-2 focus-within:ring-kat-teal/50">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">
                    <HugeiconsIcon icon={PackageReceiveIcon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800">
                      {importing ? "Đang nhập..." : "Khôi phục hành trình"}
                    </h4>
                    <p className="text-[12px] text-slate-400 font-medium">Nhập chuyến đi từ tệp sao lưu (.katjourney)</p>
                  </div>
                </div>
                <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400" />
                <input
                  className="sr-only"
                  type="file"
                  accept=".katjourney,application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) previewImportFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {/* ── Section: Vùng nguy hiểm ── */}
            <div className="pt-1 pb-2">
              <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest px-1 pb-2">Vùng nguy hiểm</p>
              {user && !user.isAnonymous ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="flex items-center justify-between w-full p-4 rounded-[20px] bg-red-50/60 border border-red-200/60 hover:bg-red-50 active:scale-[0.99] transition-all text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 border border-red-200">
                      <HugeiconsIcon icon={UserRemove01Icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-red-700">Xóa tài khoản</h4>
                      <p className="text-[12px] text-red-400 font-medium">Xóa vĩnh viễn tài khoản & dữ liệu</p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={Delete01Icon} className="h-5 w-5 text-red-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFactoryResetOpen(true)}
                  className="flex items-center justify-between w-full p-4 rounded-[20px] bg-red-50/60 border border-red-200/60 hover:bg-red-50 active:scale-[0.99] transition-all text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 border border-red-200">
                      <HugeiconsIcon icon={RotateLeft01Icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-red-700">Khôi phục cài đặt gốc</h4>
                      <p className="text-[12px] text-red-400 font-medium">Xóa vĩnh viễn toàn bộ dữ liệu</p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={Delete01Icon} className="h-5 w-5 text-red-400" />
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
                <p className="text-sm font-bold text-slate-400">Đang tải trạng thái tài khoản...</p>
              </div>
            ) : !user ? (
              <>
                <div className="space-y-6 flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary ring-4 ring-kat-primary/5">
                    <HugeiconsIcon icon={CompassIcon} className="h-6 w-6" />
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-[20px] font-black text-kat-dark text-balance">Chào mừng đến với KAT Journey</h3>
                    <p className="text-[13.5px] font-semibold leading-relaxed text-slate-500">
                      Khách có thể sử dụng ứng dụng bình thường trên thiết bị hiện tại. Đăng nhập Google sẽ hỗ trợ đồng bộ dữ liệu trong các phiên bản tương lai.
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-2">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-3 min-h-[50px] rounded-[16px] border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-[15px] text-kat-dark active:scale-[0.98] shadow-sm disabled:opacity-60"
                    >
                      {actionLoading === "google" ? (
                        <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 text-kat-teal animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      Tiếp tục với Google
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
                      Tiếp tục với Khách
                    </button>
                  </div>
                </div>
                {renderBackupSection()}
              </>
            ) : (
              <div className="space-y-6">
                {/* Unified User Info Card with Edit Display Name support */}
                <div className="flex items-center gap-4.5 p-5 rounded-[24px] bg-gradient-to-br from-white to-[#F8FAFC]/80 border border-slate-200 shadow-soft hover:shadow-md transition-all duration-350">
                  {provider === "google" ? (
                    user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "Avatar"} 
                        className="h-14 w-14 rounded-full border border-slate-200/80 object-cover shadow-sm shrink-0 ring-2 ring-slate-100"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-lg shadow-inner shrink-0">
                        {getInitials(user.displayName || "Google User")}
                      </div>
                    )
                  ) : (
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#0081BE] via-kat-teal to-[#80EAD6] text-white shadow-[0_4px_16px_rgba(0,191,183,0.2)] border-2 border-white shrink-0">
                      <HugeiconsIcon icon={UserIcon} className="h-6.5 w-6.5 text-white" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white"></span>
                      </span>
                    </div>
                  )}

                  {isEditingName ? (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 h-10 px-3 text-[14.5px] font-bold text-kat-dark rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-kat-teal/40 min-w-0"
                        placeholder="Tên hiển thị..."
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
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
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
                          <h3 className="text-[17.5px] font-black text-kat-dark leading-snug truncate">
                            {user.displayName || (provider === "guest" ? "Tài khoản cục bộ" : "Tài khoản ẩn danh")}
                          </h3>
                          <div className="p-1.5 text-slate-400 group-hover:text-kat-teal group-hover:bg-slate-100 rounded-lg shrink-0 transition-all">
                            <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                        </button>
                      </div>
                      {provider === "google" && user.email && (
                        <p className="text-[13px] text-slate-455 font-semibold leading-normal truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <div className="mt-2.5">
                        {provider === "google" ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-50 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <span className="text-[#4285F4]">G</span>
                            <span className="text-[#EA4335]">O</span>
                            <span className="text-[#FBBC05]">O</span>
                            <span className="text-[#4285F4]">G</span>
                            <span className="text-[#34A853]">L</span>
                            <span className="text-[#EA4335]">E</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-250/50 shadow-[inset_0_1px_1px_rgba(245,158,11,0.05)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Chưa đồng bộ
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {provider === "guest" && (
                  <>
                    <div className="p-4 rounded-[22px] bg-kat-primary-soft border border-[#00BFB7]/25 text-left flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00BFB7]/15 text-kat-primary-usable shrink-0 mt-0.5">
                        <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                      </div>
                      <p className="text-[13px] font-semibold leading-relaxed text-slate-600">
                        Toàn bộ lịch trình và chi phí đang được lưu tạm trên thiết bị này. Hãy liên kết tài khoản để sao lưu <strong className="font-extrabold text-kat-dark">an toàn</strong> lên đám mây và mở khóa tính năng <strong className="font-extrabold text-kat-dark">chia sẻ chuyến đi</strong>.
                      </p>
                    </div>

                    {/* Guest Action Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-3 h-13 rounded-[20px] border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all font-bold text-[14.5px] text-kat-dark shadow-sm hover:shadow-md disabled:opacity-60 relative overflow-hidden"
                      >
                        {actionLoading === "google" ? (
                          <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 text-kat-teal animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                        Liên kết Google để Đồng bộ
                      </button>

                      <button
                        onClick={handleBackupAllData}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-2.5 h-11.5 rounded-[16px] border border-slate-200/60 bg-slate-50/50 text-slate-650 hover:bg-slate-50 hover:text-kat-dark active:scale-[0.98] transition-all font-bold text-[13px] disabled:opacity-60 shadow-sm"
                      >
                        <HugeiconsIcon icon={Download01Icon} className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                        Sao lưu dữ liệu thủ công (.katjourney)
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

            <h3 className="text-[18px] font-black text-kat-dark text-balance">Cam kết bảo mật dữ liệu</h3>

            <div className="space-y-3.5 text-[14px] font-semibold text-slate-600 leading-relaxed">
              <p>
                <strong>Lưu trữ an toàn trên thiết bị (Offline-first):</strong> Toàn bộ thông tin chi tiết về chuyến đi, chi phí và bản tin hành trình được cất giữ an toàn ngay trong bộ nhớ điện thoại của bạn. Bạn có thể tra cứu lịch trình mọi lúc, mọi nơi kể cả khi không có mạng.
              </p>
              <p>
                <strong>Bảo mật danh tính tuyệt đối:</strong> Hệ thống đăng nhập được thiết lập để xác minh danh tính nghiêm ngặt. Việc này đảm bảo tài khoản và mọi kế hoạch của bạn được phân quyền an toàn, chỉ duy nhất bạn (chính chủ) mới có quyền quản lý và chỉnh sửa.
              </p>
              <p>
                <strong>Nói "Không" với việc tự động lấy dữ liệu:</strong> Lịch trình là của riêng bạn. Chúng tôi cam kết không có bất kỳ thông tin cá nhân hay kế hoạch nào bị tự động tải lên đám mây. Dữ liệu chỉ được đưa lên mạng khi bạn chủ động bấm chọn tính năng Sao lưu hoặc Chia sẻ chuyến đi với bạn bè.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-4 w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200 text-slate-700 px-6 font-bold hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Quay lại menu
            </button>
          </div>
        )}

        {view === "about" && (
          <div className="space-y-4 py-2 text-center flex flex-col items-center">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-16 w-16 object-contain drop-shadow-sm mb-2" />
            
            <h3 className="text-[20px] font-black text-kat-dark">KAT Journey</h3>
            <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              Trợ lý hành trình cá nhân
            </span>

            <p className="text-[14px] font-semibold leading-relaxed text-muted-foreground text-center max-w-sm mt-2">
              Hơn cả một công cụ lên kế hoạch, KAT Journey là người bạn đồng hành giúp bạn kiểm soát chi tiêu, sắp xếp lịch trình và gói ghém trọn vẹn mọi khoảnh khắc đáng nhớ.
            </p>

            <div className="w-full max-w-lg rounded-[24px] border border-slate-200/60 bg-white p-5 text-left shadow-soft">
              <h4 className="text-[13.5px] font-black text-kat-dark">Công nghệ & giấy phép</h4>
              <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-slate-500">
                KAT Journey được xây dựng bằng React, Vite, Dexie và Firebase. Hệ thống chỉ sử dụng Firebase để đồng bộ và chia sẻ khi bạn chủ động đăng nhập.
              </p>
              <p className="mt-2 text-[11.5px] font-medium leading-relaxed text-slate-400">
                Chúng mình xin gửi lời cảm ơn chân thành đến các tác giả và cộng đồng mã nguồn mở đã đồng hành cùng dự án.
              </p>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[13px] font-semibold text-slate-400">
                thực hiện bởi{" "}
                <a
                  href="https://tranthanhtung-trevor.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-slate-500 font-bold"
                >
                  thanhtungg.
                </a>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("menu")}
              className="mt-4 w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200 text-slate-700 px-6 font-bold hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Quay lại menu
            </button>
          </div>
        )}

        {view === "donate" && (
          <div className="space-y-5 flex flex-col items-center text-center py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
              <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h4 className="text-[18px] font-black text-kat-dark">Đồng hành cùng KAT Journey</h4>
              <p className="text-[14px] font-semibold leading-relaxed text-slate-550">
                Nếu KAT Journey hữu ích với bạn, bạn có thể gửi một ly cà phê nhỏ để ủng hộ tác giả tiếp tục phát triển ứng dụng.
              </p>
              <p className="text-[12px] font-medium text-slate-400">
                Ủng hộ là tùy chọn. Cảm ơn bạn đã sử dụng KAT Journey.
              </p>
            </div>

            <div className="w-[85%] max-w-[280px] p-4 bg-white border border-slate-200 rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
              <img 
                src="/donates.png" 
                alt="Donate QR Code" 
                className="w-full h-auto rounded-[16px] object-contain aspect-square" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="mt-3 text-[11px] font-extrabold text-kat-dark uppercase tracking-wider bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100">
                Quét mã QR để chuyển khoản
              </span>
            </div>

            <a 
              href="/donates.png" 
              download="kat-journey-donate-qr.png"
              className="text-[13px] font-bold text-kat-teal hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
              Lưu mã QR về máy
            </a>

            <button
              type="button"
              onClick={() => setView("menu")}
              className="w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200 text-slate-700 px-6 font-bold hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Quay lại menu
            </button>
          </div>
        )}

        {view === "exchangeRates" && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <HugeiconsIcon icon={Coins01Icon} className="w-4 h-4" />
                  <span className="text-[13px] font-bold">Vietcombank</span>
                </div>
                <div className="text-[12px] font-medium text-slate-400">Đơn vị: VNĐ</div>
              </div>

              <div className="space-y-2">
                {exchangeRates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <HugeiconsIcon icon={Loading01Icon} className="w-5 h-5 animate-spin mb-2" />
                    <span className="text-[13px] font-medium">Đang tải tỉ giá...</span>
                  </div>
                ) : (
                  exchangeRates.map((rate, idx) => (
                    <div 
                      key={rate.currencyCode} 
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-700 text-[13px] border border-slate-100">
                          {rate.currencyCode}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800">{rate.currencyName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-black text-kat-primary">
                          {new Intl.NumberFormat('vi-VN').format(rate.transfer)}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                          Chuyển khoản
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setView("menu")}
              className="w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-100 border border-slate-200 text-slate-700 px-6 font-bold hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Quay lại menu
            </button>
          </div>
        )}
      </div>
    </BottomSheet>

    <BottomSheet
      isOpen={isRestoreConfirmOpen}
      onClose={() => setIsRestoreConfirmOpen(false)}
      title="Khôi phục dữ liệu từ Cloud?"
    >
      <div className="space-y-5 text-left">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[13px] text-amber-900 font-bold leading-relaxed flex items-start gap-3">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>Dữ liệu trên thiết bị này có thể bị thay đổi. Vui lòng cân nhắc chọn phương thức khôi phục phù hợp bên dưới.</span>
        </div>

        <div className="space-y-3.5">
          {/* Option 1: Merge */}
          <label className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md ${
            restoreMode === "merge"
              ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50/50"
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
                ? "bg-indigo-600 text-white border-indigo-600" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <HugeiconsIcon icon={GitMergeIcon} className="w-5.5 h-5.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className={`text-[14.5px] font-black leading-tight ${
                restoreMode === "merge" ? "text-indigo-950" : "text-kat-dark"
              }`}>
                Hợp nhất dữ liệu (Merge)
              </p>
              <p className="text-[12px] text-slate-500 font-semibold mt-1 leading-normal">
                Giữ nguyên dữ liệu hiện tại, chỉ bổ sung thêm chuyến đi và bài viết mới từ bản sao lưu.
              </p>
            </div>
            <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              restoreMode === "merge" 
                ? "border-indigo-600 bg-white" 
                : "border-slate-300 bg-white"
            }`}>
              {restoreMode === "merge" && (
                <div className="h-3 w-3 rounded-full bg-indigo-600" />
              )}
            </div>
          </label>

          {/* Option 2: Replace */}
          <label className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md ${
            restoreMode === "replace"
              ? "border-rose-600 bg-rose-50/30 ring-1 ring-rose-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50/50"
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
                ? "bg-rose-600 text-white border-rose-600" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <HugeiconsIcon icon={Delete01Icon} className="w-5.5 h-5.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className={`text-[14.5px] font-black leading-tight ${
                restoreMode === "replace" ? "text-rose-950" : "text-kat-dark"
              }`}>
                Thay thế hoàn toàn (Replace)
              </p>
              <p className="text-[12px] text-slate-500 font-semibold mt-1 leading-normal">
                <span className="font-extrabold text-rose-650 uppercase tracking-wider block text-[10.5px] mb-0.5">CẢNH BÁO NGUY HIỂM</span>
                Xóa sạch toàn bộ dữ liệu trên thiết bị này và ghi đè bằng bản sao lưu trên Cloud.
              </p>
            </div>
            <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
              restoreMode === "replace" 
                ? "border-rose-600 bg-white" 
                : "border-slate-300 bg-white"
            }`}>
              {restoreMode === "replace" && (
                <div className="h-3 w-3 rounded-full bg-rose-600" />
              )}
            </div>
          </label>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsRestoreConfirmOpen(false)}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleRestore}
            className={`flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] text-white px-6 font-black active:scale-[0.98] transition-all duration-200 motion-press shadow-sm ${
              restoreMode === "replace"
                ? "bg-rose-600 hover:bg-rose-700 hover:shadow-rose-100"
                : "bg-kat-dark hover:bg-kat-dark bg-opacity-90 hover:shadow-indigo-100"
            }`}
          >
            Tiếp tục
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
      title="Khôi phục hành trình?"
    >
      <div className="space-y-5 text-left">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13.5px] text-amber-800 font-semibold leading-relaxed flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
          <span>Dữ liệu hiện tại có thể bị thay đổi sau khi nhập bản sao lưu. Vui lòng đảm bảo tệp của bạn là hợp lệ trước khi tiến hành.</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              setIsRestoreFileConfirmOpen(false);
              setSelectedFileForRestore(null);
            }}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
          >
            Hủy
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
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-dark border border-kat-dark px-6 font-bold text-white hover:bg-kat-dark bg-opacity-90 active:scale-98 transition-all duration-200 shadow-sm"
          >
            <HugeiconsIcon icon={Upload01Icon} className="h-5 w-5" />
            Khôi phục
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
          <div className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <HugeiconsIcon icon={PackageReceiveIcon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-kat-dark">Xác nhận nhập chuyến đi</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Kiểm tra thông tin trước khi nhập</p>
                </div>
              </div>
              <button
                onClick={() => { setIsImportPreviewOpen(false); setImportPreview(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              </button>
            </div>

            {/* Trip info */}
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Tên chuyến đi</p>
                <p className="text-[18px] font-black text-kat-dark leading-tight">{importPreview.tripName}</p>
                {importPreview.exportedAt && (
                  <p className="text-[11px] text-indigo-400 font-medium mt-1">
                    Xuất lúc: {new Date(importPreview.exportedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Thành viên", value: importPreview.memberCount },
                  { label: "Lịch trình", value: importPreview.eventCount },
                  { label: "Chi phí", value: importPreview.expenseCount },
                  { label: "Chuẩn bị", value: importPreview.checklistCount },
                  { label: "Nhật ký", value: importPreview.journalCount },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-[20px] font-black text-kat-dark">{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-[12px] text-slate-400 font-medium text-center leading-relaxed">
                Dữ liệu sẽ được thêm vào thiết bị này. Chuyến đi hiện có sẽ không bị ảnh hưởng.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                onClick={() => { setIsImportPreviewOpen(false); setImportPreview(null); }}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.98] transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => importTrip(importPreview.parsed)}
                disabled={importing}
                className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-kat-dark font-black text-white hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-sm"
              >
                {importing ? <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 animate-spin" /> : <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />}
                {importing ? "Đang nhập..." : "Nhập ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PWAInstallInstructionsSheet isOpen={isIosGuideOpen} onClose={() => setIsIosGuideOpen(false)} />
    </>
  );
}
