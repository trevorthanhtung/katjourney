import { ensureAnonymousUser } from "../../services/authService";
import { supabaseEnabled, supabase } from "../../lib/supabase";
import {
  createShareLink,
  revokeShareLink,
  updateShareLink,
} from "../../services/cloudShareService";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../constants/currencies";
import { showToast } from "../../components/ui/ToastManager";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AwardIcon,
  BookOpen01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Car01Icon,
  Camera01Icon,
  CallIcon,
  CircleUnlock01Icon,
  CheckIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock01Icon,
  Coffee01Icon,
  CompassIcon,
  CopyIcon,
  CrownIcon,
  DatabaseBackupIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  FileDownloadIcon,
  GlobeIcon,
  InformationCircleIcon,
  Location01Icon,
  Coins01Icon,
  LockIcon,
  Luggage01Icon,
  MapsIcon,
  MoreVerticalIcon,
  Note01Icon,
  PackageIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Route01Icon,
  Search01Icon,
  Share01Icon,
  SmilePlusIcon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
  Table01Icon,
  Ticket01Icon,
  UserIcon,
  UserAdd01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  ChevronDownIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

import { MemberCardRow } from "./components/MemberCardRow";
import { ActionCard } from "./components/ActionCard";
import { MiniStatCard } from "./components/MiniStatCard";
import { WrappedSection } from "./components/WrappedSection";
import { DonateModal } from "./components/DonateModal";
import { DeleteMemberConfirmModal } from "./components/DeleteMemberConfirmModal";
import { MemberForm } from "./components/MemberForm";
import { TripForm } from "./components/TripForm";
import { CalendarRangePicker } from "../../components/ui/CalendarRangePicker";
import { LocationInput } from "../../components/ui/LocationInput";
function ShareSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-kat-primary focus:ring-offset-2 ${
        checked ? "bg-kat-primary" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
import {
  ChecklistItem,
  db,
  deleteTripCascade,
  EventItem,
  Expense,
  JournalEntry,
  Member,
  PackingItem,
  Trip,
  TripDestination,
  archiveTrip,
  unarchiveTrip,
} from "../../db";
import { getAvatarSvg, getRandomAvatarId } from "../../utils/avatars";
import { ConfirmDeleteTripDialog } from "../../components/modals/ConfirmDeleteTripDialog";
import {
  checklistSections,
  createTripExport,
  formatDate,
  formatMoney,
  getWrappedStats,
  moodLabels,
  packingTripTypes,
  safeFileName,
  today,
  TripData,
  getChecklistStats,
  getTripTiming,
  APP_VERSION,
  downloadBlob,
} from "../../utils/helpers";
import { normalizeVietnameseDisplayText } from "../../utils/helpers";
import {
  BottomSheet,
  FormActions,
  Input,
  ScreenTitle,
  Select,
  TypedDeleteConfirmModal,
  classNames,
} from "../../components/ui";
import { RolesHelpSheet } from "../../components/modals/RolesHelpSheet";
import { JournalSection } from "../journal/JournalSection";
import { TravelDocumentsSection } from "./TravelDocumentsSection";
import { ChatBox } from "../share/components/ChatBox";
import { searchLocation, GeocodingResult } from "../../services/weatherService";
import { useModalHistory } from "../../hooks/useModalHistory";
import { getCurrencyForCountry } from "../../services/locationService";

// --- LocationInput Component ---
export function MoreScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  journals,
  packingItems,
  travelDocuments,
  onTripDeleted,
  onTripSelected,
  onShowToast,
  section,
  setSection,
  onOpenInbox,
  onOpenSettings,
  isReadOnly,
  isAutoSyncing,
  lastSyncedAt,
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  packingItems: PackingItem[];
  travelDocuments?: import("../../db").TravelDocument[];
  onTripDeleted: () => void;
  onTripSelected: (id: number) => void;
  onShowToast?: (msg: string) => void;
  section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents";
  setSection: (
    section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents"
  ) => void;
  onOpenInbox?: () => void;
  onOpenSettings?: (view?: "menu" | "auth" | "privacy" | "about" | "donate") => void;
  isReadOnly?: boolean;
  isAutoSyncing?: boolean;
  lastSyncedAt?: Date | null;
}) {
  const { t } = useTranslation();
  const [authName, setAuthName] = useState<string | null>(null);

  useEffect(() => {
    if (supabaseEnabled) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.user_metadata?.full_name) {
          setAuthName(data.user.user_metadata.full_name);
        }
      });
    }
  }, []);

  const [editingTrip, setEditingTrip] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Modal confirmations states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isUnarchiveConfirmOpen, setIsUnarchiveConfirmOpen] = useState(false);
  const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);

  // Delete Member Confirm Dialog states
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);

  // Cloud share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync hooks with history for closing modals on browser back action
  useModalHistory(editingTrip, () => setEditingTrip(false), "edit-trip-modal");
  useModalHistory(
    isMemberFormOpen,
    () => {
      setIsMemberFormOpen(false);
      setEditingMember(null);
    },
    "member-form-modal"
  );
  useModalHistory(isDataSectionOpen, () => setIsDataSectionOpen(false), "data-backup-modal");
  useModalHistory(isDonateOpen, () => setIsDonateOpen(false), "donate-modal");
  useModalHistory(isShareModalOpen, () => setIsShareModalOpen(false), "share-trip-modal");

  useModalHistory(isDeleteConfirmOpen, () => setIsDeleteConfirmOpen(false), "delete-trip-confirm");
  useModalHistory(
    isArchiveConfirmOpen,
    () => setIsArchiveConfirmOpen(false),
    "archive-trip-confirm"
  );
  useModalHistory(
    isUnarchiveConfirmOpen,
    () => setIsUnarchiveConfirmOpen(false),
    "unarchive-trip-confirm"
  );
  useModalHistory(
    isFactoryResetConfirmOpen,
    () => setIsFactoryResetConfirmOpen(false),
    "factory-reset-confirm"
  );
  useModalHistory(
    isDeleteMemberConfirmOpen,
    () => {
      setIsDeleteMemberConfirmOpen(false);
      setMemberToDelete(null);
    },
    "delete-member-confirm"
  );
  const [shareLoading, setShareLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    includeExpenses: trip.shareIncludeExpenses ?? true,
    includeJournals: trip.shareIncludeJournals ?? true,
    includeChecklist: trip.shareIncludeChecklist ?? true,
    includeBackupPlans: trip.shareIncludeBackupPlans ?? true,
    includeDocuments: trip.shareIncludeDocuments ?? false,
    sharePin: trip.sharePin ?? "",
    usePinProtection: trip.shareUsePinProtection ?? false,
  });

  useEffect(() => {
    setShareOptions({
      includeExpenses: trip.shareIncludeExpenses ?? true,
      includeJournals: trip.shareIncludeJournals ?? true,
      includeChecklist: trip.shareIncludeChecklist ?? true,
      includeBackupPlans: trip.shareIncludeBackupPlans ?? true,
      includeDocuments: trip.shareIncludeDocuments ?? false,
      sharePin: trip.sharePin ?? "",
      usePinProtection: trip.shareUsePinProtection ?? false,
    });
  }, [
    trip.id,
    trip.shareIncludeExpenses,
    trip.shareIncludeJournals,
    trip.shareIncludeChecklist,
    trip.shareIncludeBackupPlans,
    trip.shareIncludeDocuments,
    trip.shareUsePinProtection,
    trip.sharePin,
  ]);

  const [copiedLink, setCopiedLink] = useState(false);

  const activeShareLink = trip.shareToken
    ? {
        token: trip.shareToken,
        url: `${window.location.origin}/share/${trip.shareToken}`,
      }
    : null;

  const tripData = {
    trip,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
  };

  const sortedMembers = React.useMemo(() => {
    let list = [...members];
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase().trim();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || (m.role && m.role.toLowerCase().includes(q))
      );
    }
    const isLeader = (m: Member) => {
      const roleLower = (m.role || "").trim().toLowerCase();
      return (
        roleLower === "trưởng nhóm" ||
        roleLower === "trưởng đoàn" ||
        roleLower === "người đại diện" ||
        roleLower === "leader"
      );
    };
    list.sort((a, b) => {
      const aHasGroup = !!a.group;
      const bHasGroup = !!b.group;

      if (aHasGroup && bHasGroup) {
        const groupComp = a.group!.localeCompare(b.group!);
        if (groupComp !== 0) return groupComp;

        if (a.isGroupLeader && !b.isGroupLeader) return -1;
        if (!a.isGroupLeader && b.isGroupLeader) return 1;
      }

      if (aHasGroup && !bHasGroup) return -1;
      if (!aHasGroup && bHasGroup) return 1;

      const aLeader = isLeader(a);
      const bLeader = isLeader(b);
      if (aLeader && !bLeader) return -1;
      if (!aLeader && bLeader) return 1;

      return a.name.localeCompare(b.name);
    });
    return list;
  }, [members, memberSearchQuery]);
  async function handleShareTrip() {
    if (!supabaseEnabled) {
      showToast(t("toast.supabaseNotConfigured"), "error");
      return;
    }
    setShareLoading(true);
    try {
      await ensureAnonymousUser();
      setIsShareModalOpen(true);
    } catch (e: any) {
      showToast(t("toast.supabaseError", { message: e.message }), "error");
    } finally {
      setShareLoading(false);
    }
  }
  async function handleCreateLink() {
    try {
      setShareLoading(true);
      await createShareLink(trip.id!, {
        ...shareOptions,
        mode: "request_edit",
        sharePin:
          shareOptions.usePinProtection && shareOptions.sharePin.length === 4
            ? shareOptions.sharePin
            : undefined,
      });
      // Save sharing configuration to local Dexie so background sync knows about it!
      await db.trips.update(trip.id!, {
        shareIncludeExpenses: shareOptions.includeExpenses,
        shareIncludeJournals: shareOptions.includeJournals,
        shareIncludeChecklist: shareOptions.includeChecklist,
        shareIncludeBackupPlans: shareOptions.includeBackupPlans,
        shareIncludeDocuments: shareOptions.includeDocuments,
        shareUsePinProtection: shareOptions.usePinProtection,
        sharePin:
          shareOptions.usePinProtection && shareOptions.sharePin.length === 4
            ? shareOptions.sharePin
            : undefined,
      });
    } catch (e: any) {
      showToast(t("toast.shareLinkCreateError"), "error");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleSyncLink() {
    if (!activeShareLink) return;
    try {
      setSyncLoading(true);
      await updateShareLink(trip.id!, activeShareLink.token, {
        ...shareOptions,
        mode: "request_edit",
        sharePin:
          shareOptions.usePinProtection && shareOptions.sharePin.length === 4
            ? shareOptions.sharePin
            : undefined,
      });
      showToast(t("toast.syncSuccess"));
    } catch (e: any) {
      showToast(t("toast.syncError"), "error");
      console.error(e);
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleRevokeLink() {
    if (!activeShareLink) return;
    try {
      setShareLoading(true);
      await revokeShareLink(trip.id!, activeShareLink.token);
      showToast(t("toast.shareLinkDisabled"));
    } catch (e: any) {
      showToast(t("toast.shareLinkDisableError"), "error");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function executeDeleteMember() {
    if (!memberToDelete?.id) return;
    await db.members.delete(memberToDelete.id);
    onShowToast?.(t("members.toastDeletedMember"));
    setIsDeleteMemberConfirmOpen(false);
    setMemberToDelete(null);
  }

  async function executeDeleteTrip() {
    if (!trip.id) return;
    await deleteTripCascade(trip.id);
    onShowToast?.("Đã xóa chuyến đi khỏi thiết bị này.");
    onTripDeleted();
  }

  function exportTrip() {
    try {
      const payload = createTripExport(tripData);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${safeFileName(trip.title)}.katjourney`);
      onShowToast?.("Đã tạo bản sao lưu thành công");
    } catch {
      onShowToast?.("Đã xảy ra lỗi khi tạo sao lưu");
    }
  }

  async function factoryReset() {
    try {
      await db.delete();
      showToast(t("toast.deleteDataSuccess"));
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      showToast(t("toast.deleteDataError"), "error");
    }
  }

  function openNewMember() {
    setEditingMember(null);
    setIsMemberFormOpen(true);
  }

  function openEditMember(member: Member) {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  }

  const getTripDurationText = () => {
    const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
    if (isDayTrip) return t("more.wrappedDayTrip");
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return t("home.longTrip");
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      return t("home.duration", { days: diffDays, nights: diffNights });
    } catch {
      return t("home.longTrip");
    }
  };

  if (section === "journal") {
    return (
      <JournalSection
        tripId={trip.id!}
        journals={journals}
        onShowToast={onShowToast}
        onBack={() => setSection("overview")}
        isReadOnly={isReadOnly}
        renderChatBox={
          trip.shareToken
            ? () => {
                const leader = members?.find(
                  (m) =>
                    m.role?.toLowerCase().includes("trưởng nhóm") ||
                    m.role?.toLowerCase().includes("leader")
                );

                let chatName = t("chat.tripCreator");
                let chatRole = t("chat.tripCreator");

                if (leader) {
                  chatName = leader.name;
                  chatRole = "Trưởng nhóm";
                } else if (authName) {
                  chatName = authName;
                  chatRole = t("chat.tripCreator");
                }

                return (
                  <ChatBox
                    token={trip.shareToken!}
                    currentUser={{
                      name: chatName,
                      role: chatRole,
                      isGuest: false,
                      canEdit: true,
                    }}
                    inline={true}
                    isReadOnly={isReadOnly}
                  />
                );
              }
            : undefined
        }
      />
    );
  }
  if (section === "wrapped") return <WrappedSection data={tripData} setSection={setSection} />;
  if (section === "documents")
    return (
      <TravelDocumentsSection
        tripId={trip.id!}
        onBack={() => setSection("overview")}
        onShowToast={onShowToast}
        isReadOnly={isReadOnly}
      />
    );

  if (section === "members") {
    const membersWithTasks = members.filter((m) =>
      checklist.some((c) => c.assignedTo === m.name)
    ).length;
    const membersWithExpenses = members.filter((m) =>
      expenses.some((e) => e.payer === m.name)
    ).length;

    return (
      <div className="mx-auto max-w-[1280px] space-y-6 pb-36 md:pb-8">
        {/* Header / Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSection("overview")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all shrink-0"
              title="Quay lại"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">
                {t("members.membersTitle")}
              </h2>
              <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">
                {t("members.membersSubtitle")}
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <button
              className="flex h-11 sm:h-12 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 transition-all hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] shadow-sm w-full sm:w-auto shrink-0 border border-transparent dark:border-kat-primary px-5 text-[14px] font-black"
              onClick={openNewMember}
            >
              <HugeiconsIcon icon={UserAdd01Icon} className="w-4.5 h-4.5" />
              {t("members.addMember")}
            </button>
          )}
        </div>

        {/* Overview Card */}
        <div className="mb-6">
          {members.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-[22px] bg-white/75 dark:bg-[#0E172A]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.025] hover:shadow-md cursor-default">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 border border-blue-500/20 shadow-inner">
                    <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark dark:text-white leading-none">
                    {members.length}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-2">
                    {t("members.statMembers")}
                  </span>
                </div>

                <div className="rounded-[22px] bg-white/75 dark:bg-[#0E172A]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.025] hover:shadow-md cursor-default">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 border border-amber-500/20 shadow-inner">
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark dark:text-white leading-none">
                    {membersWithTasks}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-2">
                    {t("members.statTasks")}
                  </span>
                </div>

                <div className="rounded-[22px] bg-white/75 dark:bg-[#0E172A]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.025] hover:shadow-md cursor-default">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 border border-emerald-500/20 shadow-inner">
                    <HugeiconsIcon icon={WalletCardsIcon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark dark:text-white leading-none">
                    {membersWithExpenses}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-2">
                    {t("members.statPaid")}
                  </span>
                </div>

                <div className="rounded-[22px] bg-white/75 dark:bg-[#0E172A]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.025] hover:shadow-md cursor-default">
                  <div
                    className={classNames(
                      "h-10 w-10 rounded-xl flex items-center justify-center mb-2 border shadow-inner",
                      members.length >= 2
                        ? "bg-teal-500/10 text-teal-500 border-teal-500/20"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                    )}
                  >
                    <HugeiconsIcon
                      icon={members.length >= 2 ? CheckmarkCircle01Icon : AlertCircleIcon}
                      className="w-5 h-5"
                    />
                  </div>
                  <span
                    className={classNames(
                      "text-[14px] font-black leading-none",
                      members.length >= 2 ? "text-kat-dark dark:text-white" : "text-slate-400"
                    )}
                  >
                    {members.length >= 2 ? t("members.statReady") : t("members.statNeedMore")}
                  </span>
                  <span className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-2">
                    {t("members.statSplit")}
                  </span>
                </div>
              </div>

              {members.length < 2 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[13px] font-semibold text-slate-500">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="h-4.5 w-4.5 text-kat-teal shrink-0"
                  />
                  <p>{t("members.emptyMembers")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-1 text-[14px] md:text-[15px] font-semibold text-slate-500 leading-relaxed">
              <HugeiconsIcon
                icon={UserGroupIcon}
                className="h-5 w-5 text-kat-teal shrink-0 mt-0.5"
              />
              <span>{t("members.emptyMembers")}</span>
            </div>
          )}
        </div>

        {/* Member List Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h3 className="text-[17px] font-extrabold text-kat-dark">
              {t("members.memberListTitle")} {members.length > 0 && `(${members.length})`}
            </h3>
            {members.length > 0 && (
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={t("members.searchMember")}
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md py-2.5 pl-10 pr-10 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-350 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800/50 transition-all shadow-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                  <HugeiconsIcon icon={Search01Icon} className="h-4.5 w-4.5 text-slate-400" />
                </div>
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {sortedMembers.length ? (
            (() => {
              const groups: { name: string; members: typeof sortedMembers }[] = [];
              const noGroup: typeof sortedMembers = [];

              sortedMembers.forEach((m) => {
                if (m.group) {
                  let g = groups.find((x) => x.name === m.group);
                  if (!g) {
                    g = { name: m.group, members: [] };
                    groups.push(g);
                  }
                  g.members.push(m);
                } else {
                  noGroup.push(m);
                }
              });

              return (
                <div className="flex flex-col gap-6">
                  {groups.map((g) => (
                    <div key={g.name} className="animate-fadeIn">
                      <div className="flex items-center mb-3 px-1">
                        <div className="inline-flex items-center gap-2 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 px-3.5 py-1.5 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] select-none">
                          <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-kat-teal" />
                          <h3 className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                            {g.name}
                          </h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                        {g.members.map((member) => (
                          <MemberCardRow
                            key={member.id}
                            member={member}
                            checklist={checklist}
                            expenses={expenses}
                            openEditMember={openEditMember}
                            isReadOnly={isReadOnly}
                            onDeleteMember={(m) => {
                              setMemberToDelete(m);
                              setIsDeleteMemberConfirmOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {noGroup.length > 0 && (
                    <div className={groups.length > 0 ? "animate-fadeIn" : "animate-fadeIn"}>
                      {groups.length > 0 && (
                        <div className="flex items-center mb-3 px-1">
                          <div className="inline-flex items-center gap-2 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 px-3.5 py-1.5 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] select-none">
                            <HugeiconsIcon icon={UserIcon} className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                              {t("members.otherMembers")}
                            </h3>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                        {noGroup.map((member) => (
                          <MemberCardRow
                            key={member.id}
                            member={member}
                            checklist={checklist}
                            expenses={expenses}
                            openEditMember={openEditMember}
                            isReadOnly={isReadOnly}
                            onDeleteMember={(m) => {
                              setMemberToDelete(m);
                              setIsDeleteMemberConfirmOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : members.length > 0 ? (
            <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-8 text-center shadow-soft max-w-md mx-auto my-6 animate-fadeIn">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto mb-4 ring-4 ring-slate-50 dark:ring-slate-900/30">
                <HugeiconsIcon icon={UserGroupIcon} className="h-6 w-6" />
              </div>
              <h3 className="text-[15px] font-extrabold text-kat-dark">
                {t("common.noResults", "Không tìm thấy kết quả")}
              </h3>
              <p className="mt-2 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("members.noSearchResults")} "{memberSearchQuery}"
              </p>
            </div>
          ) : (
            /* Empty State Layout */
            <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-6 text-center shadow-soft max-w-md mx-auto my-6 animate-fadeIn">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mx-auto mb-4 ring-4 ring-kat-primary/5">
                <HugeiconsIcon icon={UserGroupIcon} className="h-6 w-6" />
              </div>
              <h3 className="text-[16px] font-bold text-kat-dark">
                {t("share.noMembersTitle", "No members yet")}
              </h3>
              <p className="mt-2 text-[14.5px] font-semibold text-slate-500 leading-relaxed">
                {t(
                  "share.noMembersDesc",
                  "Add members to split costs, pack bags, and keep track of roles on your trip."
                )}
              </p>
            </div>
          )}
        </section>

        <MemberForm
          tripId={trip.id!}
          editing={editingMember}
          isOpen={isMemberFormOpen}
          onClose={() => setIsMemberFormOpen(false)}
          onShowToast={onShowToast}
        />

        <DeleteMemberConfirmModal
          isOpen={isDeleteMemberConfirmOpen}
          onClose={() => {
            setIsDeleteMemberConfirmOpen(false);
            setMemberToDelete(null);
          }}
          onConfirm={executeDeleteMember}
          memberName={memberToDelete?.name ?? ""}
          hasExpenses={
            memberToDelete ? expenses.some((e) => e.payer === memberToDelete.name) : false
          }
          hasChecklist={
            memberToDelete ? checklist.some((c) => c.assignedTo === memberToDelete.name) : false
          }
        />
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="mx-auto max-w-[640px] space-y-6 pb-36 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">
              {t("more.workspaceTitle")}
            </h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">
              {t("more.workspaceDescNoTrip")}
            </p>
          </div>
          <button
            onClick={() => setSection("overview")}
            className="flex h-10 items-center justify-center rounded-full bg-[#EDEAE2] dark:bg-slate-800 border border-[#C8BDB0] dark:border-slate-700 px-4 text-[13.5px] font-bold text-kat-dark dark:text-slate-200 transition-all hover:bg-[#E2DDD3] dark:hover:bg-slate-700 active:scale-95 shadow-sm"
          >
            {t("common.back", "Quay lại")}
          </button>
        </div>

        {/* App settings items */}
        <div className="flex flex-col gap-2">
          {/* Privacy */}
          <button
            onClick={() => onOpenSettings?.("privacy")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <HugeiconsIcon icon={LockIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">
                  {t("more.privacy", "Quyền riêng tư")}
                </h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                  {t("more.privacyDesc", "Quản lý an toàn dữ liệu và quyền cá nhân")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
            />
          </button>

          {/* About */}
          <button
            onClick={() => onOpenSettings?.("about")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">
                  {t("more.appInfo", "Thông tin ứng dụng")}
                </h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                  {t("more.appInfoDesc", "Khám phá thông tin và hành trình phát triển")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
            />
          </button>

          {/* Donate */}
          <button
            onClick={() => onOpenSettings?.("donate")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">
                  {t("more.donateTitle", "Ủng hộ tác giả")}
                </h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                  {t("more.donateDesc", "Nếu bạn thấy app hữu ích, cảm ơn rất nhiều")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
            />
          </button>

          {/* Version */}
          <div className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <HugeiconsIcon icon={PackageIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">
                  {t("more.version", "Phiên bản")}
                </h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                  {t("more.versionDesc", "Phiên bản hiện tại trên thiết bị")}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              {APP_VERSION}
            </span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest px-1 pb-1">
            {t("more.dangerZone", "Vùng nguy hiểm")}
          </p>
          <ActionCard
            icon={Delete01Icon}
            title="Khôi phục cài đặt gốc"
            onClick={() => setIsFactoryResetConfirmOpen(true)}
            iconBgColor="bg-rose-50 dark:bg-rose-950/20"
            iconTextColor="text-rose-600 border-rose-100/60 dark:text-rose-450 dark:border-rose-900/30"
            titleClassName="text-rose-600 dark:text-rose-400 font-semibold"
            className="border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500/50"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            {t("more.madeBy")}{" "}
            <a
              href="https://tranthanhtung-trevor.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>
      </div>
    );
  }

  const checklistPercent = getChecklistStats(checklist).percent;
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const tripDurationText = getTripDurationText();

  return (
    <div className="w-full mx-auto max-w-[1280px] px-2 md:px-0">
      <div className="flex flex-col gap-6 pb-36 md:pb-8">
        {/* Title Block */}
        <div>
          <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">
            {t("more.workspaceTitle")}
          </h2>
          <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">
            {t("more.workspaceDesc")}
          </p>
        </div>

        {/* Hero chuyến đi compact hơn */}
        <section className="relative overflow-hidden rounded-[28px] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 p-5 md:p-6 text-kat-text shadow-soft">
          {/* Ambient background glow */}
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-kat-primary/5 dark:bg-kat-primary/10 blur-[40px] pointer-events-none" />

          <div
            className="absolute -right-6 -bottom-6 w-32 h-32 rotate-12 pointer-events-none z-0 flex items-center justify-center text-kat-primary"
            style={{ opacity: 0.04, color: "var(--kat-primary)" }}
          >
            <HugeiconsIcon icon={CompassIcon} size={128} />
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            {/* Header info */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                {t("more.currentTrip")}
              </p>
              <h3 className="mt-1 break-words text-[24px] md:text-[28px] font-black leading-tight tracking-tight text-kat-dark dark:text-slate-200">
                {trip.title}
              </h3>
            </div>

            {/* Metadata tags */}
            <div className="flex flex-wrap gap-2 text-[12.5px] font-bold text-slate-650 dark:text-slate-355">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/45 border border-slate-200/60 dark:border-white/5 px-3.5 py-1.5 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80 duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {trip.location || t("more.noLocation")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/45 border border-slate-200/60 dark:border-white/5 px-3.5 py-1.5 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80 duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {trip.startDate === trip.endDate
                  ? formatDate(trip.startDate)
                  : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/45 border border-slate-200/60 dark:border-white/5 px-3.5 py-1.5 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80 duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {tripDurationText}
              </span>
            </div>

            {/* Compact inline stats pills */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-kat-primary-soft dark:bg-kat-primary/10 px-3.5 py-1.5 text-[12.5px] font-bold text-kat-primary-usable dark:text-kat-primary transition-all hover:scale-[1.025] duration-200 cursor-default">
                <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5" />
                {members.length} {t("more.membersCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0081BE]/8 dark:bg-[#0081BE]/10 px-3.5 py-1.5 text-[12.5px] font-bold text-[#0081BE] transition-all hover:scale-[1.025] duration-200 cursor-default">
                <HugeiconsIcon icon={Route01Icon} className="h-3.5 w-3.5" />
                {events.length} {t("more.eventsCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-450 transition-all hover:scale-[1.025] duration-200 cursor-default">
                <HugeiconsIcon icon={WalletCardsIcon} className="h-3.5 w-3.5" />
                {formatMoney(totalExpense)} {t("more.expensesCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F89B02]/8 dark:bg-[#F89B02]/10 px-3.5 py-1.5 text-[12.5px] font-bold text-[#F89B02] transition-all hover:scale-[1.025] duration-200 cursor-default">
                <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5" />
                {t("more.packingProgress")} {checklistPercent}%
              </span>
            </div>
          </div>
        </section>

        {/* Thao tác chính */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">
            {t("more.sectionFeatures")}
          </h3>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            <ActionCard
              icon={MapsIcon}
              title={t("more.featureTripInfo")}
              onClick={() => setEditingTrip(true)}
              disabled={isReadOnly}
              iconBgColor="bg-sky-50 dark:bg-sky-950/20"
              iconTextColor="text-sky-600 border-sky-100 dark:text-sky-400 dark:border-sky-900/30"
            />
            <ActionCard
              icon={UserGroupIcon}
              title={t("more.featureMembers")}
              onClick={() => setSection("members")}
              iconBgColor="bg-amber-50 dark:bg-amber-950/20"
              iconTextColor="text-amber-600 border-amber-100 dark:text-amber-400 dark:border-amber-900/30"
            />
            <ActionCard
              icon={AwardIcon}
              title={t("more.featureWrapped")}
              onClick={() => setSection("wrapped")}
              iconBgColor="bg-indigo-50 dark:bg-indigo-950/20"
              iconTextColor="text-indigo-600 border-indigo-100 dark:text-indigo-400 dark:border-indigo-900/30"
            />
            <ActionCard
              icon={GlobeIcon}
              title={t("more.featureJournal")}
              onClick={() => setSection("journal")}
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
              iconTextColor="text-emerald-600 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30"
            />
            <ActionCard
              icon={Ticket01Icon}
              title={t("more.featureDocuments")}
              onClick={() => setSection("documents")}
              iconBgColor="bg-teal-50 dark:bg-teal-950/20"
              iconTextColor="text-teal-600 border-teal-100 dark:text-teal-400 dark:border-teal-900/30"
            />
            <ActionCard
              icon={Share01Icon}
              title={t("more.featureShare")}
              onClick={handleShareTrip}
              iconBgColor="bg-violet-50 dark:bg-violet-950/20"
              iconTextColor="text-violet-600 border-violet-100 dark:text-violet-400 dark:border-violet-900/30"
            />
          </div>
        </section>

        {/* Hệ thống */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">
            {t("more.sectionData")}
          </h3>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
              <ActionCard
                icon={DatabaseBackupIcon}
                title={t("more.dataTripData")}
                onClick={() => setIsDataSectionOpen(!isDataSectionOpen)}
                iconBgColor="bg-blue-50 dark:bg-blue-950/20"
                iconTextColor="text-blue-600 border-blue-100 dark:text-blue-400 dark:border-blue-900/30"
                rightElement={
                  <HugeiconsIcon
                    icon={ChevronRightIcon}
                    className={classNames(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      isDataSectionOpen ? "rotate-90" : ""
                    )}
                  />
                }
              />

              {isDataSectionOpen && (
                <div className="flex flex-col gap-2.5 mt-1 animate-fadeIn sm:pl-8 pl-4">
                  <div className="relative">
                    {/* Decorative connection line */}
                    <div className="absolute -left-3 top-0 bottom-6 w-px bg-gradient-to-b from-blue-200 via-sky-200 to-transparent dark:from-blue-800 dark:via-sky-800 hidden sm:block"></div>

                    <div className="flex flex-col gap-2.5">
                      <ActionCard
                        icon={Download01Icon}
                        title={t("more.dataBackup")}
                        onClick={exportTrip}
                        iconBgColor="bg-sky-50 dark:bg-sky-950/20"
                        iconTextColor="text-sky-600 border-sky-100 dark:text-sky-400 dark:border-sky-900/30"
                      />

                      <ActionCard
                        icon={File01Icon}
                        title={t("more.dataExportPdf")}
                        onClick={async () => {
                          const { exportTripPdf } = await import("../../utils/exportPdf");
                          exportTripPdf(tripData);
                        }}
                        iconBgColor="bg-rose-50 dark:bg-rose-950/20"
                        iconTextColor="text-rose-600 border-rose-100 dark:text-rose-450 dark:border-rose-900/30"
                      />

                      <ActionCard
                        icon={File01Icon}
                        title={t("more.dataExportItineraryPdf", "Export Itinerary PDF")}
                        onClick={async () => {
                          const { exportItineraryPdf } = await import("../../utils/exportPdf");
                          exportItineraryPdf(tripData);
                        }}
                        iconBgColor="bg-fuchsia-50 dark:bg-fuchsia-950/20"
                        iconTextColor="text-fuchsia-600 border-fuchsia-100 dark:text-fuchsia-450 dark:border-fuchsia-900/30"
                      />

                      <ActionCard
                        icon={Table01Icon}
                        title={t("more.dataExportExcel")}
                        onClick={async () => {
                          const { exportTripExcel } = await import("../../utils/exportExcel");
                          exportTripExcel(tripData).catch(console.error);
                        }}
                        iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
                        iconTextColor="text-emerald-600 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Vùng thao tác cẩn trọng */}
        <section className="space-y-3 pt-2">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-rose-500/80">
            {t("more.sectionDanger")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {!isReadOnly ? (
              <ActionCard
                icon={LockIcon}
                title={t("more.actionEndTrip")}
                onClick={() => setIsArchiveConfirmOpen(true)}
                iconBgColor="bg-slate-100 dark:bg-slate-800/40"
                iconTextColor="text-slate-600 border-slate-200/60 dark:text-slate-400 dark:border-slate-700/30"
                titleClassName="text-slate-700 dark:text-slate-300 font-semibold"
                className="border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-300 focus:ring-slate-500/50 md:col-span-2"
              />
            ) : (
              <ActionCard
                icon={CircleUnlock01Icon}
                title={t("more.actionRestoreTrip")}
                onClick={() => setIsUnarchiveConfirmOpen(true)}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
                iconTextColor="text-emerald-600 border-emerald-100/60 dark:text-emerald-400 dark:border-emerald-900/30"
                titleClassName="text-emerald-700 dark:text-emerald-450 font-semibold"
                className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500/50 md:col-span-2"
              />
            )}
            <ActionCard
              icon={Delete01Icon}
              title={t("more.actionDeleteTrip")}
              onClick={() => setIsDeleteConfirmOpen(true)}
              iconBgColor="bg-rose-50 dark:bg-rose-950/20"
              iconTextColor="text-rose-600 border-rose-100/60 dark:text-rose-450 dark:border-rose-900/30"
              titleClassName="text-rose-600 dark:text-rose-400 font-semibold"
              className="border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500/50 md:col-span-2"
            />
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            {t("more.madeBy")}{" "}
            <a
              href="https://tranthanhtung-trevor.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>
      </div>

      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />

      <TripForm
        trip={trip}
        isOpen={editingTrip}
        onClose={() => setEditingTrip(false)}
        onSaved={onTripSelected}
      />

      <MemberForm
        tripId={trip.id!}
        editing={editingMember}
        isOpen={isMemberFormOpen}
        onClose={() => setIsMemberFormOpen(false)}
        onShowToast={onShowToast}
      />

      <DeleteMemberConfirmModal
        isOpen={isDeleteMemberConfirmOpen}
        onClose={() => {
          setIsDeleteMemberConfirmOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={executeDeleteMember}
        memberName={memberToDelete?.name ?? ""}
        hasExpenses={memberToDelete ? expenses.some((e) => e.payer === memberToDelete.name) : false}
        hasChecklist={
          memberToDelete ? checklist.some((c) => c.assignedTo === memberToDelete.name) : false
        }
      />

      <ConfirmDeleteTripDialog
        open={isDeleteConfirmOpen}
        tripName={trip.title}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleteConfirmOpen(false);
          await executeDeleteTrip();
        }}
      />

      <TypedDeleteConfirmModal
        isOpen={isFactoryResetConfirmOpen}
        onClose={() => setIsFactoryResetConfirmOpen(false)}
        onConfirm={async () => {
          setIsFactoryResetConfirmOpen(false);
          await factoryReset();
        }}
        title="Khôi phục cài đặt gốc?"
        description="Hành động này sẽ xóa toàn bộ dữ liệu KAT Journey trên thiết bị hiện tại, bao gồm chuyến đi, lịch trình, chi phí, bản tin hành trình và dữ liệu liên quan. Không thể hoàn tác."
        confirmLabel="Xóa toàn bộ dữ liệu"
      />

      <BottomSheet
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
        }}
        title={t("more.featureShare")}
        subtitle={t("share.shareSubtitle")}
      >
        <div className="space-y-5 px-1 pb-4">
          {!activeShareLink ? (
            <>
              {/* Option Rows */}
              <div className="space-y-2.5">
                {/* Row: Bao gồm chi phí */}
                <div
                  onClick={() =>
                    setShareOptions({
                      ...shareOptions,
                      includeExpenses: !shareOptions.includeExpenses,
                    })
                  }
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400">
                      <HugeiconsIcon icon={WalletCardsIcon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                      {t("share.includeExpenses")}
                    </span>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.includeExpenses}
                    onChange={(val) => setShareOptions({ ...shareOptions, includeExpenses: val })}
                  />
                </div>

                {/* Row: Bao gồm bản tin */}
                <div
                  onClick={() =>
                    setShareOptions({
                      ...shareOptions,
                      includeJournals: !shareOptions.includeJournals,
                    })
                  }
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/20 text-violet-500 dark:text-violet-400">
                      <HugeiconsIcon icon={BookOpen01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                      {t("share.includeJournals")}
                    </span>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.includeJournals}
                    onChange={(val) => setShareOptions({ ...shareOptions, includeJournals: val })}
                  />
                </div>

                {/* Row: Bao gồm danh sách chuẩn bị */}
                <div
                  onClick={() =>
                    setShareOptions({
                      ...shareOptions,
                      includeChecklist: !shareOptions.includeChecklist,
                    })
                  }
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                      {t("share.includeChecklist")}
                    </span>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.includeChecklist}
                    onChange={(val) => setShareOptions({ ...shareOptions, includeChecklist: val })}
                  />
                </div>

                {/* Row: Bao gồm phương án dự phòng */}
                <div
                  onClick={() =>
                    setShareOptions({
                      ...shareOptions,
                      includeBackupPlans: !shareOptions.includeBackupPlans,
                    })
                  }
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-500 dark:text-sky-400">
                      <HugeiconsIcon icon={Alert01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                      {t("share.includeBackup")}
                    </span>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.includeBackupPlans}
                    onChange={(val) =>
                      setShareOptions({ ...shareOptions, includeBackupPlans: val })
                    }
                  />
                </div>

                {/* Row: Bao gồm giấy tờ & đặt chỗ */}
                <div
                  onClick={() =>
                    setShareOptions({
                      ...shareOptions,
                      includeDocuments: !shareOptions.includeDocuments,
                    })
                  }
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400">
                      <HugeiconsIcon icon={File01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                      {t("share.includeDocs")}
                    </span>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.includeDocuments}
                    onChange={(val) => setShareOptions({ ...shareOptions, includeDocuments: val })}
                  />
                </div>

                {shareOptions.includeDocuments && (
                  <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-4 text-[13px] text-rose-800 dark:text-rose-400 font-semibold flex gap-2 animate-fadeIn dark:bg-rose-950/20 dark:border-rose-900/30">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5"
                    />
                    <span>{t("share.docWarning")}</span>
                  </div>
                )}
              </div>

              {/* PIN Protection */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                <div
                  onClick={() =>
                    setShareOptions((o) => ({
                      ...o,
                      usePinProtection: !o.usePinProtection,
                      sharePin: "",
                    }))
                  }
                  className="flex min-h-[52px] items-center justify-between py-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
                      <HugeiconsIcon icon={LockIcon} className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">
                        {t("share.pinProtect")}
                      </span>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium">
                        {t("share.pinDesc")}
                      </p>
                    </div>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.usePinProtection}
                    onChange={(val) =>
                      setShareOptions((o) => ({ ...o, usePinProtection: val, sharePin: "" }))
                    }
                  />
                </div>

                {shareOptions.usePinProtection && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50 animate-fadeIn">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mb-2.5">
                      {t("share.enterPin")}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {[0, 1, 2, 3].map((i) => (
                        <input
                          key={i}
                          id={`pin-digit-${i}`}
                          type="number"
                          inputMode="numeric"
                          maxLength={1}
                          value={shareOptions.sharePin[i] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(-1);
                            const arr = shareOptions.sharePin.padEnd(4, " ").split("");
                            arr[i] = val || " ";
                            const newPin = arr.join("").replace(/ +$/, "");
                            setShareOptions((o) => ({ ...o, sharePin: newPin }));
                            if (val && i < 3) {
                              const next = document.getElementById(`pin-digit-${i + 1}`);
                              (next as HTMLInputElement)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !shareOptions.sharePin[i] && i > 0) {
                              const prev = document.getElementById(`pin-digit-${i - 1}`);
                              (prev as HTMLInputElement)?.focus();
                            }
                          }}
                          className="w-12 h-12 rounded-xl border-2 text-center text-[20px] font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-kat-dark focus:dark:border-kat-primary focus:ring-2 focus:ring-[#030D2E]/20 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ borderColor: shareOptions.sharePin[i] ? undefined : undefined }}
                        />
                      ))}
                    </div>
                    {shareOptions.sharePin.length === 4 && (
                      <p className="mt-2 text-center text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <HugeiconsIcon icon={CheckIcon} className="h-3 w-3" /> {t("share.pinReady")}
                      </p>
                    )}
                    {shareOptions.usePinProtection && shareOptions.sharePin.length < 4 && (
                      <p className="mt-2 text-center text-[12px] text-amber-500 dark:text-amber-400 font-semibold">
                        {t("share.pinError")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 py-3 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {t("share.close")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={
                    shareLoading ||
                    (shareOptions.usePinProtection && shareOptions.sharePin.length < 4)
                  }
                  className="flex-[2] rounded-xl bg-kat-dark dark:bg-kat-primary py-3 font-bold text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none border border-transparent dark:border-kat-primary"
                >
                  {shareLoading ? t("share.creatingLink") : t("share.createLink")}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-fadeIn pb-2">
              {/* Premium Success Layout */}
              <div className="relative overflow-hidden flex items-center gap-3 rounded-[16px] bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/20 py-2.5 px-3.5">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                  <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13.5px] font-bold text-emerald-800 dark:text-emerald-400 tracking-tight mt-0.5">
                  {t("share.linkCreated")}
                </span>
              </div>

              {/* Ultra-sleek Link Input container */}
              <div className="group relative flex items-center rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-1.5 pl-5 shadow-sm hover:border-sky-500/30 transition-all duration-300 min-h-[48px]">
                <input
                  type="text"
                  readOnly
                  value={activeShareLink.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 text-[13.5px] font-medium truncate cursor-text mr-2"
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeShareLink.url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all active:scale-95"
                    title="Sao chép link"
                  >
                    {copiedLink ? (
                      <HugeiconsIcon
                        icon={CheckIcon}
                        className="h-5 w-5 text-emerald-500 dark:text-emerald-400"
                      />
                    ) : (
                      <HugeiconsIcon icon={CopyIcon} className="h-4.5 w-4.5" />
                    )}
                  </button>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: "KAT Journey",
                            text: t("share.joinTrip", { trip: trip?.title || "" }),
                            url: activeShareLink.url,
                          });
                        } catch (err) {
                          console.log("Share failed or cancelled", err);
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 hover:brightness-110 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all active:scale-95"
                      title="Chia sẻ qua hệ thống"
                    >
                      <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status display with pulsing dot */}
              <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl py-3.5 px-4 animate-fadeIn">
                <div className="relative flex h-2.5 w-2.5 shrink-0">
                  {isAutoSyncing ? (
                    <HugeiconsIcon
                      icon={Refresh01Icon}
                      className="h-3.5 w-3.5 absolute -top-0.5 -left-0.5 animate-spin text-sky-600 dark:text-sky-400"
                    />
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAutoSyncing ? (
                    t("share.syncingChanges")
                  ) : (
                    <>
                      {t("share.autoSyncLast")}{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {lastSyncedAt
                          ? lastSyncedAt.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : t("share.justNow")}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {/* Success actions */}
              <div className="flex gap-3 flex-col sm:flex-row mt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-[16px] bg-slate-100 dark:bg-slate-800 py-3.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[48px] text-[13.5px] focus:outline-none"
                >
                  {t("share.close")}
                </button>
                <button
                  type="button"
                  onClick={handleSyncLink}
                  disabled={syncLoading}
                  className="flex-[2] rounded-[16px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-sky-500/30 py-3 font-bold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all disabled:opacity-50 min-h-[48px] text-[13.5px] focus:outline-none flex items-center justify-center gap-2 shadow-sm"
                >
                  <HugeiconsIcon
                    icon={Refresh01Icon}
                    className={classNames("h-4.5 w-4.5", syncLoading && "animate-spin")}
                  />
                  {syncLoading ? t("share.syncing") : t("share.syncData")}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeLink}
                  disabled={shareLoading}
                  className="flex-1 rounded-[16px] bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 py-3.5 font-bold active:scale-95 transition-colors disabled:opacity-50 min-h-[48px] text-[13.5px] focus:outline-none"
                >
                  {shareLoading ? t("share.turningOff") : t("share.turnOff")}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        title={t("more.archiveModalTitle")}
      >
        <div className="space-y-5">
          <div className="rounded-[20px] bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-5 text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <Trans
              i18nKey="more.archiveModalDesc"
              components={{ b: <b className="text-kat-dark" /> }}
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsArchiveConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsArchiveConfirmOpen(false);
                if (trip.id) {
                  await archiveTrip(trip.id);
                  onShowToast?.("Đã kết thúc và lưu trữ chuyến đi.");
                }
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary border border-kat-dark dark:border-kat-primary px-6 font-bold text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-98 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(3,13,46,0.4)] dark:shadow-[0_8px_24px_-8px_rgba(0,191,183,0.3)]"
            >
              <HugeiconsIcon icon={LockIcon} className="h-5 w-5 opacity-80" />
              {t("more.archiveModalConfirm")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Unarchive Confirm Modal */}
      <BottomSheet
        isOpen={isUnarchiveConfirmOpen}
        onClose={() => setIsUnarchiveConfirmOpen(false)}
        title={t("more.unarchiveModalTitle")}
      >
        <div className="space-y-5">
          <div className="rounded-[20px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 text-[14px] text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed">
            <Trans
              i18nKey="more.unarchiveModalDesc"
              components={{ b: <b className="text-emerald-700 dark:text-emerald-300" /> }}
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsUnarchiveConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsUnarchiveConfirmOpen(false);
                if (trip.id) {
                  await unarchiveTrip(trip.id);
                  onShowToast?.("Đã mở khóa chuyến đi.");
                }
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 dark:bg-emerald-600 border border-emerald-500 dark:border-emerald-500 px-6 font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 active:scale-98 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(5,150,105,0.4)]"
            >
              <HugeiconsIcon icon={CircleUnlock01Icon} className="h-5 w-5 opacity-80" />
              {t("more.unarchiveModalConfirm")}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
export { TripForm };
