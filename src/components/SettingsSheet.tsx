import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useTheme, type Theme } from "../hooks/useTheme";
import { useNotification } from "../hooks/useNotification";
import { showToast } from "./ui/ToastManager";
import { 
  User, 
  Lock, 
  Info, 
  Mail,
  Heart, 
  Package, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Coffee, 
  ShieldCheck, 
  Compass, 
  Download,
  Loader2,
  Pencil,
  Check,
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  AlertTriangle,
  RefreshCw,
  Languages,
  Palette,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Trash2,
  Sparkles,
  Eraser,
  UserX,
  RotateCcw,
  Bell,
  ArchiveRestore,
  Upload,
} from "lucide-react";
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

type SettingsView = "menu" | "auth" | "privacy" | "about" | "donate";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);


// ─── Segmented Control (reusable) ────────────────────────────────────────────
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "px-3 py-1.5 rounded-full text-[12.5px] font-bold transition-all active:scale-95 whitespace-nowrap border",
            value === opt.value
              ? "bg-[#030D2E] text-white border-[#030D2E] shadow-sm"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}


export function SettingsSheet({ isOpen, onClose, initialView, syncProps, onTripSelected }: SettingsSheetProps) {
  const { user, loading: authLoading, provider, isAuthenticated } = useAuth();
  const { 
    permission: notificationPermission, 
    requestPermission: requestNotificationPermission, 
    isSupported: isNotificationSupported,
    enabled: notificationEnabled,
    setEnabled: setNotificationEnabled
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
  const [actionLoading, setActionLoading] = useState<"google" | "guest" | "signout" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isClearingTemp, setIsClearingTemp] = useState(false);
  const [clearTempSuccess, setClearTempSuccess] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);

  // Cloud backup states
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Restore from file states
  const [importing, setImporting] = useState(false);
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<File | null>(null);
  const [isRestoreFileConfirmOpen, setIsRestoreFileConfirmOpen] = useState(false);

  // Modal history registration
  useModalHistory(isRestoreFileConfirmOpen, () => setIsRestoreFileConfirmOpen(false), "restore-file-confirm");

  useEffect(() => {
    if (user) {
      setNewName(user.displayName || "");
    }
    setIsEditingName(false);
  }, [user, isOpen]);

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
      link.download = `kat-journey-backup-${dateStr}.kattrip`;
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

  async function importTrip(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as any;
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        throw new Error("Tệp không đúng định dạng KAT Journey.");
      }

      const newTripId = await db.transaction("rw", [db.trips, db.members, db.events, db.expenses, db.checklist, db.journals, db.packingItems, db.travelDocuments, db.backupPlans], async () => {
        const importedTrip = parsed.trip!;
        const id = await db.trips.add({
          title: `${importedTrip.title} (import)`,
          location: importedTrip.location ?? "",
          startDate: importedTrip.startDate || today,
          endDate: importedTrip.endDate || importedTrip.startDate || today,
          createdAt: new Date().toISOString()
        });

        const importedMembers = (parsed.members ?? []).map((member: any) => ({
          tripId: id,
          name: member.name ?? "",
          phone: member.phone ?? "",
          role: member.role ?? ""
        }));
        const importedEvents = (parsed.events ?? []).map((event: any) => ({
          tripId: id,
          date: event.date || today,
          time: event.time ?? "",
          title: event.title ?? "",
          location: event.location ?? "",
          notes: event.notes ?? "",
          mapLink: event.mapLink ?? "",
          completed: Boolean(event.completed)
        }));
        const importedExpenses = (parsed.expenses ?? []).map((expense: any) => ({
          tripId: id,
          amount: Number(expense.amount || 0),
          payer: expense.payer ?? "",
          category: expense.category ?? "Khác",
          description: expense.description ?? "",
          splitType: expense.splitType ?? "shared"
        }));
        const importedChecklist = (parsed.checklist ?? []).map((item: any) => ({
          tripId: id,
          section: checklistSections.includes(item.section) ? item.section : "Before Trip",
          title: item.title ?? "",
          completed: Boolean(item.completed)
        }));
        const importedJournals = (parsed.journals ?? []).map((entry: any) => ({
          tripId: id,
          date: entry.date || today,
          title: entry.title ?? "",
          content: entry.content ?? "",
          mood: (["very_bad", "bad", "okay", "good", "great"].includes(entry.mood as string)) ? entry.mood : "okay"
        }));
        const importedPackingItems = (parsed.packingItems ?? []).map((item: any) => ({
          tripId: id,
          tripType: packingTripTypes.includes(item.tripType) ? item.tripType : "Thành phố",
          title: item.title ?? "",
          completed: Boolean(item.completed)
        }));
        const importedDocuments = (parsed.travelDocuments ?? []).map((doc: any) => ({
          tripId: id,
          title: doc.title ?? "",
          type: doc.type ?? "other",
          code: doc.code ?? "",
          date: doc.date ?? "",
          link: doc.link ?? "",
          note: doc.note ?? ""
        }));
        const importedBackupPlans = (parsed.backupPlans ?? []).map((plan: any) => ({
          tripId: id,
          title: plan.title ?? "",
          type: plan.type ?? "other",
          reason: plan.reason ?? "",
          location: plan.location ?? "",
          note: plan.note ?? "",
          activityId: plan.activityId,
          date: plan.date
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
      onClose();
      showToast("Đã nhập bản sao lưu thành công.");
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
      <div className="border-t border-[#E8E1D8]/60 pt-5 mt-4 space-y-4 text-left animate-fadeIn">
        <div className="flex items-center gap-2.5 mb-1 px-1">
          <div className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#00BFB7]/10 text-[#00BFB7] border border-[#00BFB7]/25 shrink-0">
            <Cloud className={`w-5 h-5 ${(isSyncing || isAutoBackingUp) ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h4 className="text-[15px] font-black text-[#030D2E]">Đồng bộ dữ liệu</h4>
            <p className="text-[11.5px] text-slate-400 font-medium">Tự động sao lưu và bảo mật dữ liệu</p>
          </div>
        </div>

        {hasCloudVersion && (
          <div className="rounded-[22px] bg-amber-50/60 border border-amber-200/50 p-4 text-[13.5px] text-amber-800 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200/50 shrink-0 mt-0.5">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <span className="pt-0.5">Có phiên bản mới hơn trên Cloud. Vui lòng bấm Đồng bộ để tải về.</span>
          </div>
        )}

        {syncError && (
          <div className="rounded-[22px] bg-rose-50/60 border border-rose-200/50 p-4 text-[13.5px] text-rose-800 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200/50 shrink-0 mt-0.5">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <span className="pt-0.5">{syncError}</span>
          </div>
        )}

        {syncSuccess && (
          <div className="rounded-[22px] bg-emerald-50/60 border border-emerald-200/50 p-4 text-[13.5px] text-[#0F766E] font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-soft">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#0F766E] border border-emerald-200/50 shrink-0 mt-0.5">
              <Check className="w-4.5 h-4.5" strokeWidth={3.5} />
            </div>
            <span className="pt-0.5">{syncSuccess}</span>
          </div>
        )}

        {!user ? (
          <div className="rounded-[22px] bg-amber-50/50 border border-amber-100/70 p-4 text-[13.5px] text-amber-800 font-bold leading-relaxed shadow-soft">
            Vui lòng đăng nhập để sử dụng đồng bộ.
          </div>
        ) : (
          <>
            {/* 2. Status Card (Thông tin tĩnh) */}
            <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-[22px] p-4 flex justify-between items-center text-[13.5px] font-bold text-slate-500 min-h-[54px] shadow-soft hover:shadow-md transition-all duration-300 motion-hover-lift">
              <span className="text-slate-400 font-bold">Lần đồng bộ cuối</span>
              {lastBackupAt && backupTimeStr && backupDateStr ? (
                <div className="flex gap-1.5 items-center">
                  <span className="font-black text-[#030D2E] bg-slate-50 border border-[#E8E1D8] px-3.5 py-1.5 rounded-full text-[13px]">{backupTimeStr}</span>
                  <span className="font-black text-[#030D2E] bg-slate-50 border border-[#E8E1D8] px-3.5 py-1.5 rounded-full text-[13px]">{backupDateStr}</span>
                </div>
              ) : (
                <span className="font-black text-[#030D2E] bg-slate-50 border border-[#E8E1D8] px-3.5 py-1.5 rounded-full text-[13px]">
                  Chưa từng đồng bộ
                </span>
              )}
            </div>

            {/* 3. Action Card (Thiết lập) */}
            <div className="flex items-center justify-between p-4 rounded-[22px] border border-[#E8E1D8] bg-[#FFFDF8] min-h-[72px] shadow-soft hover:shadow-md transition-all duration-300 motion-hover-lift">
              <div className="flex items-center gap-3">
                <div className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#00BFB7]/10 text-[#00BFB7] border border-[#00BFB7]/20">
                  <Cloud className="w-4.5 h-4.5" />
                </div>
                <div className="text-left pr-2">
                  <span className="text-[13.5px] font-black text-[#030D2E]">Tự động sao lưu lên Cloud</span>
                  <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 leading-normal">Sao lưu ngầm sau khi thay đổi dữ liệu 5s</p>
                </div>
              </div>
              
              {/* Premium Switch Component */}
              <button
                type="button"
                role="switch"
                aria-checked={autoBackupEnabled}
                onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                  autoBackupEnabled ? "bg-[#00BFB7]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-250 ease-in-out ${
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
            className="w-full flex items-center justify-center gap-2.5 h-13 rounded-[18px] bg-gradient-to-r from-[#00BFB7] to-[#00AFA8] text-[#030D2E] hover:brightness-[1.03] active:scale-[0.97] transition-all font-black text-[15px] shadow-[0_4px_14px_rgba(0,191,183,0.2)] hover:shadow-[0_6px_20px_rgba(0,191,183,0.35)] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none shrink-0 motion-press"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>Đang đồng bộ dữ liệu...</span>
              </>
            ) : isAutoBackingUp ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0" />
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
          <ChevronLeft className="h-5 w-5" />
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



            {/* Privacy */}
            <button
              onClick={() => setView("privacy")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Quyền riêng tư</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Quản lý an toàn dữ liệu và quyền cá nhân</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
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
                      <Bell className="h-5 w-5" />
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
                      isNotificationActive ? "bg-[#030D2E]" : "bg-slate-200"
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

            {/* About */}
            <button
              onClick={() => setView("about")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Thông tin ứng dụng</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Khám phá thông tin và hành trình phát triển</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>

            {/* Support Author */}
            <button
              onClick={() => setView("donate")}
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  <Coffee className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Ủng hộ tác giả</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Nếu bạn thấy app hữu ích, cảm ơn rất nhiều</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>

            {/* Send Feedback */}
            <a
              href="mailto:trevorthanhtung@gmail.com?subject=Phản hồi ứng dụng KAT Journey"
              className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-all text-left focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Góp ý & Phản hồi</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Chia sẻ ý kiến giúp KAT Journey hoàn thiện hơn mỗi ngày</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </a>

            {/* Version */}
            <div className="flex items-center justify-between w-full p-4 rounded-[20px] bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200/50">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800">Phiên bản</h4>
                  <p className="text-[12px] text-slate-400 font-medium">Phiên bản hiện tại trên thiết bị</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full border border-slate-200">
                1.0.0
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
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <Eraser className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800">Dọn dẹp tệp tạm</h4>
                    <p className="text-[12px] text-slate-400 font-medium">Xóa bộ nhớ đệm và tệp không quan trọng</p>
                  </div>
                </div>
                {clearTempSuccess
                  ? <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Check className="h-3 w-3" /> Xong!
                    </span>
                  : <ChevronRight className="h-5 w-5 text-slate-400" />}
              </button>

              <label className="group flex w-full cursor-pointer items-center justify-between bg-slate-50 border border-slate-100 px-4 py-4 rounded-[20px] text-left hover:bg-slate-100/70 transition-all focus-within:ring-2 focus-within:ring-[#00BFB7]/50">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">
                    <ArchiveRestore className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-800">
                      {importing ? "Đang nhập..." : "Khôi phục hành trình"}
                    </h4>
                    <p className="text-[12px] text-slate-400 font-medium">Nhập chuyến đi từ tệp sao lưu (.kattrip)</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
                <input
                  className="sr-only"
                  type="file"
                  accept=".kattrip,application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setSelectedFileForRestore(file);
                      setIsRestoreFileConfirmOpen(true);
                    }
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
                      <UserX className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-red-700">Xóa tài khoản</h4>
                      <p className="text-[12px] text-red-400 font-medium">Xóa vĩnh viễn tài khoản & dữ liệu</p>
                    </div>
                  </div>
                  <Trash2 className="h-5 w-5 text-red-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFactoryResetOpen(true)}
                  className="flex items-center justify-between w-full p-4 rounded-[20px] bg-red-50/60 border border-red-200/60 hover:bg-red-50 active:scale-[0.99] transition-all text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 border border-red-200">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-red-700">Khôi phục cài đặt gốc</h4>
                      <p className="text-[12px] text-red-400 font-medium">Xóa vĩnh viễn toàn bộ dữ liệu</p>
                    </div>
                  </div>
                  <Trash2 className="h-5 w-5 text-red-400" />
                </button>
              )}
            </div>

          </div>
        )}

        {view === "auth" && (
          <div className="space-y-5 py-2">
            {authLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="h-8 w-8 text-[#00BFB7] animate-spin" />
                <p className="text-sm font-bold text-slate-400">Đang tải trạng thái tài khoản...</p>
              </div>
            ) : !user ? (
              <>
                <div className="space-y-6 flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary ring-4 ring-kat-primary/5">
                    <Compass className="h-6 w-6" />
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-[20px] font-black text-[#030D2E]">Chào mừng đến với KAT Journey</h3>
                    <p className="text-[13.5px] font-semibold leading-relaxed text-slate-500">
                      Khách có thể sử dụng ứng dụng bình thường trên thiết bị hiện tại. Đăng nhập Google sẽ hỗ trợ đồng bộ dữ liệu trong các phiên bản tương lai.
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-2">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-3 min-h-[50px] rounded-[16px] border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-[15px] text-[#030D2E] active:scale-[0.98] shadow-sm disabled:opacity-60"
                    >
                      {actionLoading === "google" ? (
                        <Loader2 className="h-5 w-5 text-[#00BFB7] animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      Tiếp tục với Google
                    </button>

                    <button
                      onClick={handleGuestSignIn}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-3 min-h-[50px] rounded-[16px] bg-[#00BFB7] hover:bg-[#00BFB7]/90 text-[#030D2E] transition-all font-black text-[15px] active:scale-[0.98] shadow-sm disabled:opacity-60"
                    >
                      {actionLoading === "guest" ? (
                        <Loader2 className="h-5 w-5 text-[#030D2E] animate-spin" />
                      ) : (
                        <User className="h-5 w-5" />
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
                <div className="flex items-center gap-4 p-5 rounded-[24px] bg-[#FFFDF8] border border-[#E8E1D8] shadow-soft hover:shadow-md transition-all duration-350 motion-hover-lift">
                  {provider === "google" ? (
                    user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "Avatar"} 
                        className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-lg shadow-inner shrink-0">
                        {getInitials(user.displayName || "Google User")}
                      </div>
                    )
                  ) : (
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00BFB7] via-[#0081BE] to-[#6366F1] text-white shadow-[0_4px_16px_rgba(0,191,183,0.25)] border-2 border-white shrink-0">
                      <User className="h-6.5 w-6.5 text-white" />
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
                        className="flex-1 h-9 px-3 text-[14px] font-bold text-[#030D2E] rounded-xl border border-[#E8E1D8] bg-white focus:outline-none focus:border-[#00BFB7] focus:ring-1 focus:ring-[#00BFB7]/40 min-w-0"
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
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00BFB7] text-[#030D2E] hover:brightness-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
                      >
                        {actionLoading === "guest" ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <Check className="w-4.5 h-4.5" strokeWidth={3} />
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={actionLoading !== null}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all shrink-0"
                      >
                        <X className="w-4 h-4" />
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
                          <h3 className="text-[17px] font-black text-[#030D2E] leading-snug truncate">
                            {user.displayName || (provider === "guest" ? "Tài khoản cục bộ" : "Tài khoản ẩn danh")}
                          </h3>
                          <div className="p-1.5 text-slate-400 group-hover:text-[#00BFB7] group-hover:bg-slate-100 rounded-lg shrink-0 transition-all">
                            <Pencil className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                        </button>
                      </div>
                      {provider === "google" && user.email && (
                        <p className="text-[13px] text-slate-500 font-semibold leading-normal truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <div className="mt-2.5">
                        {provider === "google" ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] bg-slate-50 border border-slate-200 shadow-sm">
                            <span>
                              <span className="text-[#4285F4]">G</span>
                              <span className="text-[#EA4335]">o</span>
                              <span className="text-[#FBBC05]">o</span>
                              <span className="text-[#4285F4]">g</span>
                              <span className="text-[#34A853]">l</span>
                              <span className="text-[#EA4335]">e</span>
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-amber-50/60 text-amber-700 border border-amber-200/50 shadow-[inset_0_1px_1px_rgba(245,158,11,0.05)]">
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
                    {/* Upsell Message Box */}
                    <div className="p-4.5 rounded-[22px] border-l-4 border-l-[#00BFB7] bg-[#FFFDF8] border-y border-r border-[#E8E1D8] text-left flex items-start gap-3.5 shadow-soft hover:shadow-md transition-all duration-300">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00BFB7]/10 text-[#00BFB7] shrink-0">
                        <Info className="w-4.5 h-4.5" />
                      </div>
                      <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                        Toàn bộ lịch trình và chi phí đang được lưu tạm trên thiết bị này. Hãy liên kết tài khoản để sao lưu <strong className="font-black text-[#030D2E]">an toàn</strong> lên đám mây và mở khóa tính năng <strong className="font-black text-[#030D2E]">chia sẻ chuyến đi</strong>.
                      </p>
                    </div>

                    {/* Guest Action Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-3 h-13 rounded-[18px] border border-[#E8E1D8] bg-[#FFFDF8] hover:bg-white hover:border-[#00BFB7]/40 active:scale-[0.98] transition-all motion-hover-lift font-extrabold text-[14.5px] text-[#030D2E] shadow-soft hover:shadow-md disabled:opacity-60"
                      >
                        {actionLoading === "google" ? (
                          <Loader2 className="h-5 w-5 text-[#00BFB7] animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                        Liên kết Google để Đồng bộ
                      </button>

                      <button
                        onClick={handleBackupAllData}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-2 h-11.5 rounded-[16px] border border-[#E8E1D8] bg-[#FAF7F1]/50 text-slate-500 hover:bg-[#FAF7F1] hover:text-[#030D2E] hover:border-[#E8E1D8] active:scale-[0.98] transition-all font-bold text-[13px] disabled:opacity-60 shadow-sm motion-hover-lift"
                      >
                        <Download className="h-4.5 w-4.5 text-slate-400" />
                        Sao lưu dữ liệu thủ công (.kattrip)
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 mb-2">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="text-[18px] font-black text-[#030D2E]">Cam kết bảo mật dữ liệu</h3>

            <div className="space-y-3.5 text-[14px] font-semibold text-slate-600 leading-relaxed">
              <p>
                <strong>Lưu trữ an toàn trên thiết bị (Offline-first):</strong> Toàn bộ thông tin chi tiết về chuyến đi, chi phí và nhật ký hành trình được cất giữ an toàn ngay trong bộ nhớ điện thoại của bạn. Bạn có thể tra cứu lịch trình mọi lúc, mọi nơi kể cả khi không có mạng.
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
            
            <h3 className="text-[20px] font-black text-[#030D2E]">KAT Journey</h3>
            <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              Trợ lý hành trình cá nhân
            </span>

            <p className="text-[14px] font-semibold leading-relaxed text-muted-foreground text-center max-w-sm mt-2">
              Hơn cả một công cụ lên kế hoạch, KAT Journey là người bạn đồng hành giúp bạn kiểm soát chi tiêu, sắp xếp lịch trình và gói ghém trọn vẹn mọi khoảnh khắc đáng nhớ.
            </p>

            <div className="w-full max-w-md rounded-[20px] border border-slate-100 bg-slate-50/70 p-4 text-left">
              <h4 className="text-[13px] font-black text-[#030D2E]">Công nghệ & giấy phép</h4>
              <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-slate-500">
                KAT Journey được xây dựng với React, Vite, Dexie, Firebase và các thư viện mã nguồn mở khác. Firebase được dùng cho đăng nhập, đồng bộ và chia sẻ dữ liệu khi bạn bật các tính năng liên quan.
              </p>
              <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-400">
                Các thư viện mã nguồn mở thuộc bản quyền và giấy phép của tác giả tương ứng.
              </p>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[13px] font-semibold text-slate-400">
                thực hiện bởi{" "}
                <a
                  href="https://www.youtube.com/@kat.thanhtungg"
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
              <Coffee className="h-5 w-5" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h4 className="text-[18px] font-black text-[#030D2E]">Đồng hành cùng KAT Journey</h4>
              <p className="text-[14px] font-semibold leading-relaxed text-slate-550">
                Nếu KAT Journey hữu ích với bạn, bạn có thể gửi một ly cà phê nhỏ để ủng hộ tác giả tiếp tục phát triển ứng dụng.
              </p>
              <p className="text-[12px] font-medium text-slate-400">
                Ủng hộ là tùy chọn. Cảm ơn bạn đã sử dụng KAT Journey.
              </p>
            </div>

            <div className="w-[85%] max-w-[280px] p-4 bg-[#FFFDF8] border border-[#E8E1D8] rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
              <img 
                src="/donates.webp" 
                alt="Donate QR Code" 
                className="w-full h-auto rounded-[16px] object-contain aspect-square" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="mt-3 text-[11px] font-extrabold text-[#030D2E] uppercase tracking-wider bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100">
                Quét mã QR để chuyển khoản
              </span>
            </div>

            <a 
              href="/donates.webp" 
              download="kat-journey-donate-qr.webp"
              className="text-[13px] font-bold text-[#00BFB7] hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
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
      </div>
    </BottomSheet>

    <BottomSheet
      isOpen={isRestoreConfirmOpen}
      onClose={() => setIsRestoreConfirmOpen(false)}
      title="Khôi phục dữ liệu từ Cloud?"
    >
      <div className="space-y-5 text-left">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13.5px] text-amber-800 font-semibold leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
          <span>Dữ liệu trên thiết bị có thể bị thay đổi. Vui lòng chọn phương thức khôi phục phù hợp.</span>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
            <input
              type="radio"
              name="restoreMode"
              value="merge"
              checked={restoreMode === "merge"}
              onChange={() => setRestoreMode("merge")}
              className="mt-1 h-4 w-4 text-[#00BFB7] focus:ring-[#00BFB7]"
            />
            <div className="text-left">
              <p className="text-[14px] font-bold text-[#030D2E]">Hợp nhất dữ liệu (Merge)</p>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5 leading-normal">
                Giữ nguyên các dữ liệu hiện có trên thiết bị và chỉ bổ sung thêm các chuyến đi/dữ liệu mới từ bản sao lưu.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
            <input
              type="radio"
              name="restoreMode"
              value="replace"
              checked={restoreMode === "replace"}
              onChange={() => setRestoreMode("replace")}
              className="mt-1 h-4 w-4 text-[#00BFB7] focus:ring-[#00BFB7]"
            />
            <div className="text-left">
              <p className="text-[14px] font-bold text-[#030D2E]">Thay thế hoàn toàn (Replace)</p>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5 leading-normal text-rose-600">
                CẢNH BÁO: Xóa sạch toàn bộ dữ liệu hiện tại trên thiết bị và ghi đè bằng toàn bộ dữ liệu từ bản sao lưu trên Cloud.
              </p>
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
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#00BFB7] text-[#030D2E] px-6 font-black hover:brightness-105 active:scale-[0.98] transition-all duration-200 motion-press"
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
          <AlertTriangle className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
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
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#030D2E] border border-[#030D2E] px-6 font-bold text-white hover:bg-[#030D2E]/90 active:scale-98 transition-all duration-200 shadow-sm"
          >
            <Upload className="h-5 w-5" />
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
    </>
  );
}
