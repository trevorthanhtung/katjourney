import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  CheckmarkCircle02Icon,
  BookOpen01Icon,
  File01Icon,
  AlertCircleIcon,
  Add01Icon,
  PenTool01Icon,
  Delete01Icon,
  MoreVerticalIcon,
  ReceiptTextIcon,
  UserCheck01Icon,
  Tag01Icon,
  ChevronRightIcon,
  BalanceScaleIcon,
  InformationCircleIcon,
  CheckIcon,
  Cancel01Icon,
  Clock01Icon,
  FileCheckIcon,
  ShirtIcon,
  Briefcase01Icon,
  PlugIcon,
  PillIcon,
  Bread01Icon,
  PackageIcon,
  BadgeCheckIcon,
  StickyNoteIcon,
  MinusSignIcon,
  UserIcon,
  Calendar01Icon,
  Maximize01Icon,
  Image01Icon,
  Loading01Icon,
  SmileIcon,
  NotebookIcon,
  SaveIcon,
  SparklesIcon,
  HelpCircleIcon,
  UserGroupIcon,
  BubbleChatIcon,
  GlobeIcon,
  CrownIcon,
  Luggage01Icon,
  Car01Icon,
  CalculatorIcon,
  PieChartIcon,
  Search01Icon,
  Airplane01Icon,
  HotelIcon,
  Ticket01Icon,
  ShoppingBag01Icon,
  Gamepad2Icon,
  CompassIcon,
  ChevronDownIcon,
  Location01Icon,
  LocationOfflineIcon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import {
  Expense,
  ChecklistItem,
  JournalEntry,
  TravelDocument,
  BackupPlan,
  Member,
  EventItem,
} from "../../../db";
import {
  formatMoney,
  expenseCategories,
  formatDate,
  moodLabels,
  sumBy,
  getSettlementSuggestions,
} from "../../../utils/helpers";
import { submitChangeRequest } from "../../../services/cloudShareService";
import { showToast } from "../../../components/ui/ToastManager";
import { processLocalImage } from "../../../services/storageService";
import { getIdentity } from "../../../utils/identityCache";
import {
  getCurrentPosition,
  reverseGeocode,
  getCurrencyForCountry,
} from "../../../services/locationService";
import {
  BottomSheet,
  Input,
  Select,
  Textarea,
  DatePicker,
  DeleteConfirmModal,
} from "../../../components/ui";
import { getAvatarSvg, getRandomAvatarId } from "../../../utils/avatars";
import { BreakdownSection, CategoryBar, SettlementCard } from "../../expenses/ExpensesScreen";
import { fetchExchangeRates, ExchangeRate } from "../../../services/currencyService";

const classNames = (...classes: any[]) => classes.filter(Boolean).join(" ");

const CATEGORIES = [
  "documents",
  "clothing",
  "personal",
  "electronics",
  "medical",
  "money",
  "snacks",
  "other",
] as const;
const CATEGORY_ICONS: Record<string, any> = {
  documents: FileCheckIcon,
  clothing: ShirtIcon,
  personal: Briefcase01Icon,
  electronics: PlugIcon,
  medical: PillIcon,
  money: Wallet01Icon,
  snacks: Bread01Icon,
  other: PackageIcon,
};

interface LocalMember extends Member {
  isPendingDelete?: boolean;
  isPendingCreate?: boolean;
  isPendingUpdate?: boolean;
  isOwner?: boolean;
}
export function SharedMembersSection({
  token,
  mode,
  members = [],
  checklist = [],
  expenses = [],
  changeRequests = [],
  guestName,
}: {
  token: string;
  mode: string;
  members?: LocalMember[];
  checklist?: ChecklistItem[];
  expenses?: Expense[];
  changeRequests?: any[];
  guestName?: string;
}) {
  const { t } = useTranslation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const [roleChangeMemberId, setRoleChangeMemberId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Người đồng hành"]);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeMenuId]);

  const [form, setForm] = useState({
    name: "",
    role: "Người đồng hành",
    gender: "male",
  });
  const [showValidationError, setShowValidationError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isRequestEdit = mode === "request_edit";

  const mergedMembers = React.useMemo(() => {
    const list: LocalMember[] = members
      .filter((m: any) => !m.isDeleted)
      .map((item) => {
        const pendingDelete = changeRequests.some(
          (r) =>
            r.section === "members" &&
            r.action === "delete" &&
            String(r.targetId) === String(item.id) &&
            (!r.status || r.status === "pending")
        );
        const updateReq = changeRequests.find(
          (r) =>
            r.section === "members" &&
            r.action === "update" &&
            String(r.targetId) === String(item.id) &&
            (!r.status || r.status === "pending")
        );

        if (updateReq) {
          return {
            ...item,
            role: updateReq.after?.role as string,
            isPendingUpdate: true,
            isPendingDelete: pendingDelete,
          };
        }
        return {
          ...item,
          isPendingDelete: pendingDelete,
        };
      });

    const pendingCreates = changeRequests.filter(
      (r) => r.section === "members" && r.action === "create" && r.status === "pending"
    );
    pendingCreates.forEach((r) => {
      list.push({
        id: ("pending-create-" + r.id) as any,
        ...r.after,
        isPendingCreate: true,
      } as any);
    });

    list.sort((a, b) => {
      const isLeader = (m: LocalMember) => {
        const roleLower = (m.role || "").trim().toLowerCase();
        return (
          roleLower.includes("trưởng nhóm") ||
          roleLower.includes("trưởng đoàn") ||
          roleLower.includes("người đại diện") ||
          roleLower.includes("leader")
        );
      };
      const aLeader = isLeader(a);
      const bLeader = isLeader(b);
      if (aLeader && !bLeader) return -1;
      if (!aLeader && bLeader) return 1;
      return 0;
    });

    return list;
  }, [members, changeRequests]);

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return mergedMembers;
    const q = searchQuery.toLowerCase().trim();
    return mergedMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.role && m.role.toLowerCase().includes(q))
    );
  }, [mergedMembers, searchQuery]);

  async function handleRoleChangeSubmit() {
    if (!roleChangeMemberId) return;
    const member = members.find((m) => String(m.id) === roleChangeMemberId);
    if (!member) return;

    const finalRole = selectedRoles.join(", ");
    if (!finalRole) {
      showToast(t("toast.requireRole"), "error");
      return;
    }

    const payload = {
      section: "members" as const,
      action: "update" as const,
      targetId: String(member.id),
      before: {
        id: member.id,
        name: member.name,
        role: member.role || "Người đồng hành",
        avatar: member.avatar,
      },
      after: {
        id: member.id,
        name: member.name,
        role: finalRole,
        avatar: member.avatar,
      },
      requesterName: guestName,
    };

    try {
      await submitChangeRequest(token, payload);
      setRoleChangeMemberId(null);
      showToast(t("toast.roleRequestSent"));
    } catch (e: any) {
      showToast(t("toast.errorMsg", { message: e.message }), "error");
    }
  }

  async function handleAdd() {
    setForm({ name: "", role: "Người đồng hành", gender: "male" });
    setShowValidationError(false);
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setShowValidationError(true);
      return;
    }

    const existingAvatars = mergedMembers.map((m) => m.avatar).filter(Boolean) as string[];
    const randAvatar = getRandomAvatarId(form.gender, existingAvatars);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || "Người đồng hành",
      avatar: randAvatar,
      isOwner: false,
    };

    try {
      await submitChangeRequest(token, {
        section: "members",
        action: "create",
        after: payload,
        requesterName: guestName,
      });
      setIsFormOpen(false);
      showToast(t("toast.memberAddRequestSent"));
    } catch (e: any) {
      showToast(t("toast.errorMsg", { message: e.message }), "error");
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = members.find((m) => String(m.id) === id);
      await submitChangeRequest(token, {
        section: "members",
        action: "delete",
        targetId: id,
        before: before as any,
        requesterName: guestName,
      });
      showToast(t("toast.memberDeleteRequestSent"));
    } catch (e: any) {
      showToast(t("toast.errorMsg", { message: e.message }), "error");
    }
  }

  return (
    <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-blue-500/[0.03] dark:bg-blue-500/[0.05] blur-[30px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 shadow-inner">
            <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-200">
              {t("members.membersTitle")}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              {t("share.membersDesc", "Danh sách thành viên tham gia hành trình")}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {mergedMembers.length > 0 && (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t("members.searchMember")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 py-2.5 pl-10 pr-10 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
            <HugeiconsIcon icon={Search01Icon} className="h-4.5 w-4.5 text-slate-400" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {filteredMembers.length > 0 ? (
        (() => {
          const groups: { name: string; members: typeof filteredMembers }[] = [];
          const noGroup: typeof filteredMembers = [];

          filteredMembers.forEach((m) => {
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

          const renderMemberCard = (member: LocalMember) => {
            const isPending = member.isPendingCreate || member.isPendingDelete;
            const initial = member.name.trim().charAt(0).toUpperCase() || "?";

            // Helper computations
            const assignedTasksCount = checklist.filter(
              (c) => c.assignedTo === member.name && !c.isDeleted
            ).length;
            const memberExpenses = expenses.filter((e) => e.payer === member.name && !e.isDeleted);
            const paidExpensesCount = memberExpenses.length;
            const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const roleLower = (member.role || "").trim().toLowerCase();
            const isLeader =
              roleLower.includes("trưởng nhóm") ||
              roleLower.includes("trưởng đoàn") ||
              roleLower.includes("leader");
            const isCost = roleLower.includes("quản lý chi phí");
            const isDriver = roleLower.includes("tài xế");
            const isGuide = roleLower.includes("dẫn đường");
            const isLuggage =
              roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");

            let cardBg =
              "bg-gradient-to-br from-slate-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-slate-800/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
            let borderAccent = "border-l-[3.5px] border-l-slate-400";
            let avatarRing = "ring-2 ring-slate-100 dark:ring-slate-800";

            if (member.isPendingCreate) {
              cardBg =
                "bg-gradient-to-br from-sky-50/40 via-white/80 to-white/70 border-sky-200/80 backdrop-blur-md dark:from-sky-950/15 dark:via-slate-900/30 dark:to-slate-900/40 dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-sky-500";
              avatarRing =
                "ring-2 ring-sky-400/60 dark:ring-sky-500/40 shadow-[0_0_8px_rgba(14,165,233,0.2)]";
            } else if (member.isPendingDelete) {
              cardBg =
                "bg-gradient-to-br from-rose-50/40 via-white/80 to-white/70 border-rose-200/80 opacity-80 backdrop-blur-md dark:from-rose-950/15 dark:via-slate-900/30 dark:to-slate-900/40 dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-rose-500";
              avatarRing =
                "ring-2 ring-rose-400/60 dark:ring-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]";
            } else if (isLeader) {
              cardBg =
                "bg-gradient-to-br from-amber-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-amber-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-amber-500";
              avatarRing =
                "ring-2 ring-amber-400/60 dark:ring-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
            } else if (isCost) {
              cardBg =
                "bg-gradient-to-br from-emerald-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-emerald-500";
              avatarRing =
                "ring-2 ring-emerald-400/60 dark:ring-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
            } else if (isDriver) {
              cardBg =
                "bg-gradient-to-br from-blue-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-blue-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-blue-500";
              avatarRing =
                "ring-2 ring-blue-400/60 dark:ring-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]";
            } else if (isGuide) {
              cardBg =
                "bg-gradient-to-br from-sky-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-sky-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-sky-500";
              avatarRing =
                "ring-2 ring-sky-400/60 dark:ring-sky-500/40 shadow-[0_0_8px_rgba(14,165,233,0.2)]";
            } else if (isLuggage) {
              cardBg =
                "bg-gradient-to-br from-indigo-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-indigo-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-indigo-500";
              avatarRing =
                "ring-2 ring-indigo-400/60 dark:ring-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]";
            } else if (member.isGroupLeader) {
              cardBg =
                "bg-gradient-to-br from-teal-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-teal-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
              borderAccent = "border-l-[3.5px] border-l-teal-500";
              avatarRing =
                "ring-2 ring-teal-400/60 dark:ring-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]";
            }

            const renderRoleBadge = (roleStr: string) => {
              const roles = (roleStr || "Người đồng hành")
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean);
              if (roles.length === 0) roles.push(t("more.companion", "Người đồng hành"));

              return (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {roles.map((r, idx) => {
                    const rLower = r.toLowerCase();
                    if (
                      rLower.includes("trưởng nhóm") ||
                      rLower.includes("trưởng đoàn") ||
                      rLower.includes("leader")
                    ) {
                      return (
                        <span
                          key={idx}
                          title={t("roles.roleLeader")}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                        >
                          <HugeiconsIcon
                            icon={CrownIcon}
                            className="w-4 h-4 text-amber-500 fill-amber-500/10"
                          />
                        </span>
                      );
                    }
                    if (rLower.includes("quản lý chi phí")) {
                      return (
                        <span
                          key={idx}
                          title={t("roles.roleCostManager")}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                        >
                          <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4 text-emerald-500" />
                        </span>
                      );
                    }
                    if (rLower.includes("tài xế")) {
                      return (
                        <span
                          key={idx}
                          title={t("roles.roleDriver")}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                        >
                          <HugeiconsIcon icon={Car01Icon} className="w-4 h-4 text-blue-500" />
                        </span>
                      );
                    }
                    if (rLower.includes("dẫn đường")) {
                      return (
                        <span
                          key={idx}
                          title={t("roles.roleNavigator")}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                        >
                          <HugeiconsIcon icon={CompassIcon} className="w-4 h-4 text-sky-500" />
                        </span>
                      );
                    }
                    if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
                      return (
                        <span
                          key={idx}
                          title={t("roles.roleLuggage")}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                        >
                          <HugeiconsIcon icon={Luggage01Icon} className="w-4 h-4 text-indigo-500" />
                        </span>
                      );
                    }
                    return (
                      <span
                        key={idx}
                        title={t("roles.roleCompanion")}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
                      >
                        <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-slate-400" />
                      </span>
                    );
                  })}
                </div>
              );
            };

            return (
              <div
                key={member.id || member.name}
                className={classNames(
                  "relative rounded-3xl border transition-all flex flex-col justify-between gap-4.5 p-5 shadow-[0_4px_15px_rgba(3,13,46,0.015)] hover:shadow-[0_8px_25px_rgba(3,13,46,0.04)] hover:scale-[1.005] duration-200",
                  cardBg,
                  borderAccent
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${avatarRing}`}
                    >
                      {member.avatar ? (
                        getAvatarSvg(member.avatar, "w-full h-full")
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-slate-300 text-[18px] font-black">
                          {initial}
                        </div>
                      )}
                    </div>

                    {/* Member details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
                        <h4
                          className={classNames(
                            "text-[16.5px] font-extrabold text-kat-dark truncate leading-tight min-w-0",
                            member.isPendingDelete
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : ""
                          )}
                        >
                          {member.name}
                        </h4>
                        {renderRoleBadge(member.role || "Người đồng hành")}
                        {member.isPendingCreate && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-pulse">
                            {t("members.suggestNew")}
                          </span>
                        )}
                        {member.isPendingUpdate && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none">
                            {t("members.suggestChangeRole")}
                          </span>
                        )}
                        {member.isPendingDelete && (
                          <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-450 shrink-0 select-none">
                            {t("members.suggestDelete")}
                          </span>
                        )}
                      </div>
                      {member.group && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[13.5px] font-semibold text-slate-500 flex items-center">
                            {t("members.groupPrefix")}
                            <span
                              className={
                                member.isGroupLeader
                                  ? "text-kat-dark font-extrabold dark:text-kat-primary-usable"
                                  : "text-slate-700 dark:text-slate-300"
                              }
                            >
                              {member.group}
                            </span>
                          </p>
                          {member.isGroupLeader && (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-900/30 dark:text-teal-400 select-none">
                              {t("more.representative", "Đại diện")}
                            </span>
                          )}
                        </div>
                      )}
                      {member.phone && (
                        <div className="mt-0.5">
                          <a
                            href={`tel:${member.phone}`}
                            className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-slate-500 hover:text-kat-teal dark:hover:text-kat-primary transition-colors leading-none"
                            title={`${t("more.call", "Gọi")} ${member.name}`}
                          >
                            <HugeiconsIcon
                              icon={CallIcon}
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            />
                            <span>{member.phone}</span>
                          </a>
                        </div>
                      )}
                      {member.note && (
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 italic mt-2.5 border-l-2 border-slate-200 dark:border-slate-700/60 pl-3 py-0.5 max-w-full break-words leading-relaxed">
                          "{member.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {isRequestEdit &&
                    !isPending &&
                    member.name === guestName &&
                    !(() => {
                      const r = (member.role || "").toLowerCase();
                      return (
                        r.includes("trưởng đoàn") ||
                        r.includes("trưởng nhóm") ||
                        r.includes("người đại diện") ||
                        r.includes("leader")
                      );
                    })() && (
                      <div className="shrink-0">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                            if (activeMenuId === String(member.id)) {
                              setActiveMenuId(null);
                              setMenuPos(null);
                            } else {
                              setActiveMenuId(String(member.id));
                              setMenuPos({
                                top: rect.bottom + 4,
                                right: window.innerWidth - rect.right,
                              });
                            }
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
                          title={t("members.options")}
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                </div>

                {/* Mini Stats Row */}
                <div className="pt-3 border-t border-slate-100/60 dark:border-slate-700/40 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-wrap gap-2 text-[12px]">
                    <span
                      className={classNames(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-all duration-200 hover:scale-[1.02] cursor-default",
                        assignedTasksCount === 0
                          ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-150 dark:border-white/5 text-slate-450 dark:text-slate-500 font-bold"
                          : "bg-sky-500/[0.04] dark:bg-sky-500/[0.08] border-sky-500/10 text-sky-650 dark:text-sky-400 font-extrabold"
                      )}
                    >
                      <HugeiconsIcon
                        icon={Luggage01Icon}
                        className="h-3.5 w-3.5 shrink-0 text-sky-500"
                      />
                      {assignedTasksCount} {t("members.taskCount")}
                    </span>
                    <span
                      className={classNames(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-all duration-200 hover:scale-[1.02] cursor-default",
                        totalSpent === 0
                          ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-150 dark:border-white/5 text-slate-450 dark:text-slate-500 font-bold"
                          : "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/10 text-emerald-650 dark:text-emerald-400 font-extrabold"
                      )}
                    >
                      <HugeiconsIcon
                        icon={Wallet01Icon}
                        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                      />
                      {t("members.paidPrefix")}
                      {formatMoney(totalSpent)}{" "}
                      {paidExpensesCount > 0 && `(${paidExpensesCount} ${t("members.paidTimes")})`}
                    </span>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="flex flex-col">
              {groups.map((g) => (
                <div key={g.name} className="animate-fadeIn mb-4">
                  <div className="flex items-center mb-3 px-1">
                    <div className="inline-flex items-center gap-2 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 px-3.5 py-1.5 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] select-none">
                      <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-blue-500" />
                      <h3 className="text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                        {g.name}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                    {g.members.map(renderMemberCard)}
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
                    {noGroup.map(renderMemberCard)}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="text-center py-8">
          <p className="text-[14px] font-semibold text-slate-400 dark:text-slate-500">
            {mergedMembers.length > 0
              ? `${t("members.noSearchResults")} "${searchQuery}"`
              : t("members.noMembersYet")}
          </p>
        </div>
      )}

      {/* Fixed-position dropdown — renders above everything */}
      {activeMenuId &&
        menuPos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[998]"
              onClick={() => {
                setActiveMenuId(null);
                setMenuPos(null);
              }}
            />
            <div
              className="fixed z-[999] w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/50 py-1.5 animate-fadeIn"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                onClick={() => {
                  const id = activeMenuId;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  const mem = members.find((m) => String(m.id) === id);
                  if (mem) {
                    setRoleChangeMemberId(id);
                    const currentRole = mem.role || "Người đồng hành";
                    const presets = ["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"];
                    const existingRoles = currentRole
                      .split(",")
                      .map((r: string) => r.trim())
                      .filter((r: string) => presets.includes(r));
                    setSelectedRoles(
                      existingRoles.length > 0 ? existingRoles : ["Người đồng hành"]
                    );
                  }
                }}
                className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-100 dark:border-slate-700"
              >
                {t("members.changeRole")}
              </button>
              <button
                onClick={() => {
                  const id = activeMenuId;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  handleDelete(id);
                }}
                className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                {t("members.suggestDelete")}
              </button>
            </div>
          </>,
          document.body
        )}

      {isRequestEdit && (
        <button
          onClick={handleAdd}
          className="flex h-12 w-full items-center justify-center gap-2 text-[14px] font-bold text-kat-dark/80 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-2 border-dashed border-slate-200/80 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-2xl transition-all active:scale-[0.99] shadow-sm shadow-slate-100 dark:shadow-none"
          title={t("members.btnSuggestAdd")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" /> {t("members.btnSuggestAdd")}
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t("members.btnSuggestAdd")}
      >
        <div className="flex flex-col gap-5 py-2">
          <Input
            label={t("members.nameLabel")}
            value={form.name}
            onChange={(name) => {
              setForm({ ...form, name });
              setShowValidationError(false);
            }}
            placeholder={t("members.namePlaceholder")}
          />
          {showValidationError && (
            <p className="text-rose-500 text-[12.5px] font-bold -mt-3 pl-1">
              {t("members.nameRequired")}
            </p>
          )}

          <div className="space-y-2">
            <span className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-400">
              {t("members.genderLabel")}
            </span>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: "male" })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all border",
                  form.gender === "male"
                    ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200/60 dark:border-slate-700 shadow-sm"
                    : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                )}
              >
                {t("members.genderMale")}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: "female" })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all border",
                  form.gender === "female"
                    ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200/60 dark:border-slate-700 shadow-sm"
                    : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                )}
              >
                {t("members.genderFemale")}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-dark dark:bg-kat-primary font-black text-white dark:text-slate-950 hover:bg-opacity-95 dark:hover:bg-kat-primary/95 active:scale-[0.98] transition-all shadow-sm"
          >
            {t("members.btnSuggestAdd")}
          </button>
        </div>
      </BottomSheet>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await executeDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={t("members.suggestDeleteTitle")}
        description={t("members.suggestDeleteDesc")}
        confirmLabel={t("members.suggestDeleteBtn")}
        itemName={members.find((m) => String(m.id) === deleteTargetId)?.name}
      />

      <BottomSheet
        isOpen={roleChangeMemberId !== null}
        onClose={() => setRoleChangeMemberId(null)}
        title={t("members.suggestRoleTitle")}
      >
        <div className="flex flex-col gap-5 py-2">
          <div className="space-y-1">
            <p className="text-[13.5px] font-bold text-slate-500 dark:text-slate-400">
              {t("members.memberLabel")}
              <span className="font-extrabold text-kat-dark dark:text-slate-200">
                {members.find((m) => String(m.id) === roleChangeMemberId)?.name}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-350 block">
              {t("members.chooseNewRole")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"].map((r) => {
                const isSelected = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setSelectedRoles((prev) => {
                        if (r === "Người đồng hành") return ["Người đồng hành"];
                        if (prev.includes(r)) {
                          const filtered = prev.filter((x) => x !== r);
                          return filtered.length === 0 ? ["Người đồng hành"] : filtered;
                        }
                        return prev.filter((x) => x !== "Người đồng hành").concat(r);
                      })
                    }
                    className={classNames(
                      "py-2.5 px-3 text-left text-[12.5px] font-bold rounded-xl transition-all border",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-sm"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    {t(
                      `roles.role${r === "Người đồng hành" ? "Companion" : r === "Quản lý chi phí" ? "CostManager" : r === "Tài xế" ? "Driver" : "Navigator"}`
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRoleChangeSubmit}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-dark dark:bg-kat-primary font-black text-white dark:text-slate-950 hover:bg-opacity-95 dark:hover:bg-kat-primary/95 active:scale-[0.98] transition-all shadow-sm"
          >
            {t("members.btnSuggestRole")}
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

interface LocalMember extends Member {
  isPendingDelete?: boolean;
  isPendingCreate?: boolean;
  isPendingUpdate?: boolean;
  isOwner?: boolean;
}
