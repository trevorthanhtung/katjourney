import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
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
  Note01Icon,
  TextIcon,
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  documents: {
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    text: "text-blue-800 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  clothing: {
    bg: "bg-orange-50/70 dark:bg-orange-950/20",
    text: "text-orange-800 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900/30",
  },
  personal: {
    bg: "bg-teal-50/70 dark:bg-teal-950/20",
    text: "text-teal-800 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-900/30",
  },
  electronics: {
    bg: "bg-purple-50/70 dark:bg-purple-950/20",
    text: "text-purple-800 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900/30",
  },
  medical: {
    bg: "bg-green-50/70 dark:bg-green-950/20",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-100 dark:border-green-900/30",
  },
  money: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    text: "text-emerald-800 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  snacks: {
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    text: "text-amber-800 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  other: {
    bg: "bg-slate-100/70 dark:bg-slate-800/20",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700/50",
  },
};

export function SharedChecklistSection({
  tripId,
  token,
  mode,
  checklist,
  changeRequests = [],
  members = [],
  guestName,
}: {
  tripId?: string | number;
  token: string;
  mode: string;
  checklist: ChecklistItem[];
  changeRequests?: any[];
  members?: Member[];
  guestName?: string;
}) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = useMemo(
    () => ({
      documents: t("packing.catDocuments"),
      clothing: t("packing.catClothing"),
      personal: t("packing.catPersonal"),
      electronics: t("packing.catElectronics"),
      medical: t("packing.catMedical"),
      money: t("packing.catMoney"),
      snacks: t("packing.catSnacks"),
      other: t("packing.catOther"),
    }),
    [t]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"shared" | "private">("shared");

  const localPrivateItems =
    useLiveQuery(async () => {
      if (!tripId) return [];
      const targetTripId =
        typeof tripId === "number" ? tripId : isNaN(Number(tripId)) ? tripId : Number(tripId);
      try {
        const items = await db.checklist.where("tripId").equals(targetTripId).toArray();
        return items.filter(
          (c: ChecklistItem) =>
            c.isPrivate &&
            !c.isDeleted &&
            (c.createdBy === guestName || (!c.createdBy && !guestName))
        );
      } catch (e) {
        console.error("Error loading local private checklist items:", e);
        return [];
      }
    }, [tripId, activeSubTab, guestName]) ?? [];

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
    title: "",
    category: "documents",
    quantity: 1,
    assignedTo: "",
    priority: "normal" as "normal" | "important" | "required",
    note: "",
  });
  const [showValidationError, setShowValidationError] = useState(false);

  const isRequestEdit = mode === "request_edit" || mode === "edit";
  const isDirectEdit = mode === "edit";
  const canModifyPrivate = activeSubTab === "private";
  const canAdd = isRequestEdit || canModifyPrivate;
  const canToggle = isRequestEdit || canModifyPrivate;

  useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      if (editingId) {
        const item =
          activeSubTab === "private"
            ? localPrivateItems.find((c) => String(c.id) === editingId)
            : checklist.find((c) => String(c.id) === editingId);
        if (item) {
          setForm({
            title: item.title,
            category: item.category || "other",
            quantity: item.quantity || 1,
            assignedTo: item.assignedTo || "",
            priority: item.priority || "normal",
            note: item.note || "",
          });
        }
      } else {
        setForm({
          title: "",
          category: "documents",
          quantity: 1,
          assignedTo: "",
          priority: "normal",
          note: "",
        });
      }
    }
  }, [editingId, isFormOpen, checklist, localPrivateItems, activeSubTab]);

  function startAdd() {
    setEditingId(null);
    setIsFormOpen(true);
  }
  function startEdit(item: ChecklistItem) {
    setEditingId(String(item.id));
    setIsFormOpen(true);
  }

  // Merge pending change requests into checklist for visual diffs
  const mergedChecklist = useMemo(() => {
    const list = checklist
      .filter((c: any) => !c.isDeleted)
      .map((item) => {
        const pendingDelete = changeRequests.some(
          (r) =>
            r.section === "checklist" &&
            r.action === "delete" &&
            String(r.targetId) === String(item.id)
        );
        const updateReq = changeRequests.find(
          (r) =>
            r.section === "checklist" &&
            r.action === "update" &&
            String(r.targetId) === String(item.id)
        );

        if (updateReq) {
          return {
            ...item,
            ...updateReq.after,
            isPendingUpdate: true,
            changeRequestId: updateReq.id,
          };
        }
        if (pendingDelete) {
          return {
            ...item,
            isPendingDelete: true,
            changeRequestId: changeRequests.find(
              (r) =>
                r.section === "checklist" &&
                r.action === "delete" &&
                String(r.targetId) === String(item.id)
            )?.id,
          };
        }
        return item;
      });

    const pendingCreates = changeRequests.filter(
      (r) => r.section === "checklist" && r.action === "create" && r.status === "pending"
    );
    pendingCreates.forEach((r) => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id,
      } as any);
    });

    return list;
  }, [checklist, changeRequests]);

  const displayedChecklist = activeSubTab === "private" ? localPrivateItems : mergedChecklist;

  async function handleToggle(item: ChecklistItem) {
    if (activeSubTab === "private") {
      try {
        await db.checklist.update(Number(item.id), { completed: !item.completed });
      } catch (e: any) {
        showToast(t("toast.errorMsg", { message: e.message }), "error");
      }
      return;
    }
    if (!isRequestEdit) return;
    try {
      const status = isDirectEdit ? "auto_approved" : undefined;
      await submitChangeRequest(token, {
        section: "checklist",
        action: "update",
        targetId: String(item.id),
        before: item as any,
        after: { completed: !item.completed },
        status,
        requesterName: guestName,
      });
      showToast(isDirectEdit ? t("toast.statusUpdated") : t("toast.requestSent"));
    } catch (e: any) {
      showToast(t("toast.errorMsg", { message: e.message }), "error");
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }

    if (activeSubTab === "private") {
      if (!tripId) {
        showToast(t("toast.tripNotFound"), "error");
        return;
      }
      const targetTripId =
        typeof tripId === "number" ? tripId : isNaN(Number(tripId)) ? tripId : Number(tripId);
      try {
        if (editingId) {
          await db.checklist.update(Number(editingId), {
            title: form.title.trim(),
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            createdBy: guestName || "guest",
            updatedAt: new Date().toISOString(),
          });
          showToast(t("toast.personalPreparationUpdated"));
        } else {
          await db.checklist.add({
            tripId: targetTripId as any,
            section: "Before Trip",
            title: form.title.trim(),
            completed: false,
            isPrivate: true,
            createdBy: guestName || "guest",
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          showToast(t("toast.personalPreparationAdded"));
        }
        setIsFormOpen(false);
        setEditingId(null);
      } catch (e: any) {
        showToast(t("toast.saveError", { message: e.message }), "error");
      }
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      quantity: form.quantity,
      assignedTo: form.assignedTo || undefined,
      priority: form.priority,
      note: form.note.trim() || undefined,
      section: "Before Trip" as const,
      completed: false,
    };

    try {
      const status = isDirectEdit ? "auto_approved" : undefined;
      const successMessage = isDirectEdit
        ? "Đã cập nhật trực tiếp!"
        : "Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.";
      if (!editingId) {
        await submitChangeRequest(token, {
          section: "checklist",
          action: "create",
          after: payload,
          status,
          requesterName: guestName,
        });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const before = checklist.find((c) => String(c.id) === editingId);
        await submitChangeRequest(token, {
          section: "checklist",
          action: "update",
          targetId: editingId,
          before: before as any,
          after: payload,
          status,
          requesterName: guestName,
        });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) {
      showToast(
        isDirectEdit
          ? t("toast.updateError", { message: e.message })
          : t("toast.submitRequestError", { message: e.message }),
        "error"
      );
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = checklist.find((c) => String(c.id) === id);
      await submitChangeRequest(token, {
        section: "checklist",
        action: "delete",
        targetId: id,
        before: before as any,
        status: isDirectEdit ? "auto_approved" : undefined,
        requesterName: guestName,
      });
      showToast(isDirectEdit ? t("toast.directDelete") : t("toast.requestSent"));
    } catch (e: any) {
      showToast(
        isDirectEdit
          ? t("toast.deleteError", { message: e.message })
          : t("toast.submitRequestError", { message: e.message }),
        "error"
      );
    }
  }

  // Group items by category (default fallback is "other")
  const groupedItems = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = [];
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  displayedChecklist.forEach((item) => {
    const cat =
      item.category && CATEGORIES.includes(item.category as any) ? item.category : "other";
    groupedItems[cat].push(item);
  });

  const activeCategories = CATEGORIES.filter((cat) => groupedItems[cat].length > 0);

  const renderCategoryCard = (catName: string, catIdx: number) => {
    const items = groupedItems[catName];
    const catDone = items.filter((i) => i.completed).length;
    const catTotal = items.length;

    return (
      <div
        key={catName}
        className={`bg-white/70 dark:bg-slate-900/30 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-xs space-y-4 hover:shadow-md transition-all duration-200`}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            {(() => {
              const IconComponent = CATEGORY_ICONS[catName] || PackageIcon;
              const theme = CATEGORY_COLORS[catName] || CATEGORY_COLORS["other"];
              return (
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-[10px] ${theme.bg} ${theme.text} border ${theme.border} shadow-inner`}
                >
                  <HugeiconsIcon icon={IconComponent} className="w-4.5 h-4.5" />
                </div>
              );
            })()}
            <h3 className="text-[16.5px] font-black text-slate-800 dark:text-slate-200">
              {catMap[catName] || catName}
            </h3>
          </div>
          <span className="text-[11.5px] font-black text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60">
            {t("packing.catCount", { done: catDone, total: catTotal })}
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {items.map((c) => {
            const itemAny = c as any;
            const isPending =
              itemAny.isPendingCreate || itemAny.isPendingUpdate || itemAny.isPendingDelete;
            return (
              <div
                key={c.id}
                onClick={() => handleToggle(c)}
                className={classNames(
                  "flex justify-between items-center p-3 transition-all rounded-[20px] border",
                  canToggle ? "cursor-pointer" : "cursor-default",
                  c.completed
                    ? "bg-slate-50/40 dark:bg-slate-900/20 border-slate-150 dark:border-white/5 opacity-70"
                    : "bg-white/50 dark:bg-slate-800/20 backdrop-blur-xs border-slate-200/55 dark:border-white/5 hover:border-slate-350 dark:hover:border-slate-700 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
                  itemAny.isPendingCreate || itemAny.isPendingUpdate
                    ? "bg-sky-50/40 dark:bg-sky-950/20 border-sky-100/50 dark:border-sky-900/30"
                    : "",
                  itemAny.isPendingDelete
                    ? "bg-slate-50/30 dark:bg-slate-900/20 border-rose-100 dark:border-rose-900/30 opacity-70 pointer-events-none"
                    : ""
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Interactive Checkbox */}
                  {canToggle ? (
                    <div className="shrink-0 mt-0.5">
                      {c.completed ? (
                        <div className="w-5 h-5 rounded-[6px] bg-emerald-550/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all scale-100 border border-transparent shadow-xs">
                          <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5 text-current" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-[6px] border border-slate-300 dark:border-slate-655 bg-white dark:bg-slate-800 transition-all scale-100" />
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 mt-0.5">
                      {c.completed ? (
                        <div className="w-5 h-5 rounded-[6px] bg-emerald-500/10 text-emerald-655/70 dark:text-emerald-450 flex items-center justify-center">
                          <HugeiconsIcon icon={CheckIcon} className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40" />
                      )}
                    </div>
                  )}

                  {/* Item Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={classNames(
                          "text-[14px] font-bold wrap-break-word leading-tight",
                          c.completed
                            ? "text-slate-400 dark:text-slate-400/80 line-through font-medium"
                            : "text-kat-dark dark:text-slate-200",
                          itemAny.isPendingDelete
                            ? "line-through text-slate-400 dark:text-slate-500 opacity-60 font-medium"
                            : ""
                        )}
                      >
                        {c.title}
                      </span>
                      {c.quantity && c.quantity > 1 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                          x{c.quantity}
                        </span>
                      )}

                      {/* Pending Request Status Badges */}
                      {itemAny.isPendingDelete && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none animate-fadeIn">
                          {changeRequests.find(
                            (r) => String(r.id) === String(itemAny.changeRequestId)
                          )?.status === "auto_approved"
                            ? "Đang xóa..."
                            : "Đề xuất xóa"}
                        </span>
                      )}
                      {itemAny.isPendingCreate && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-fadeIn">
                          {changeRequests.find(
                            (r) => String(r.id) === String(itemAny.changeRequestId)
                          )?.status === "auto_approved"
                            ? t("common.savingBadge")
                            : t("share.suggestAdd")}
                        </span>
                      )}
                      {itemAny.isPendingUpdate && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none animate-fadeIn">
                          {changeRequests.find(
                            (r) => String(r.id) === String(itemAny.changeRequestId)
                          )?.status === "auto_approved"
                            ? t("common.savingBadge")
                            : t("share.suggestEdit")}
                        </span>
                      )}
                    </div>

                    {/* Metadata and Badges */}
                    <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                      {c.assignedTo && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold dark:bg-slate-800! dark:text-slate-300! dark:border-slate-700/60! dark:border"
                          style={{
                            backgroundColor: `hsl(${(c.assignedTo.charCodeAt(0) * 137.5) % 360}, 75%, 95%)`,
                            color: `hsl(${(c.assignedTo.charCodeAt(0) * 137.5) % 360}, 70%, 35%)`,
                            border: `1px solid hsl(${(c.assignedTo.charCodeAt(0) * 137.5) % 360}, 70%, 90%)`,
                          }}
                        >
                          <HugeiconsIcon icon={UserIcon} className="h-2.5 w-2.5" />
                          {c.assignedTo}
                        </span>
                      )}

                      {c.priority && c.priority !== "normal" && (
                        <span
                          className={classNames(
                            "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide border",
                            c.priority === "required"
                              ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                              : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                          )}
                        >
                          {c.priority === "required"
                            ? t("packing.priorityRequired")
                            : t("packing.priorityImportant")}
                        </span>
                      )}
                    </div>

                    {/* Note */}
                    {c.note && (
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 pl-1.5 border-l border-slate-200 dark:border-slate-700 italic font-medium">
                        {c.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {(activeSubTab === "private" || (isRequestEdit && !isPending)) && (
                  <div className="shrink-0 ml-2">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                        if (activeMenuId === String(c.id)) {
                          setActiveMenuId(null);
                          setMenuPos(null);
                        } else {
                          setActiveMenuId(String(c.id));
                          setMenuPos({
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right,
                          });
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all focus:outline-hidden"
                      title={activeSubTab === "private" ? "Tùy chọn" : "Tùy chọn đề xuất"}
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-purple-500/3 dark:bg-purple-500/5 blur-[30px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30 shadow-inner">
              <HugeiconsIcon icon={Luggage01Icon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-200">
                {t("packing.pageTitle")}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {t("share.checklistDesc", "Chuẩn bị hành lý và đồ dùng trước chuyến đi")}
              </p>
            </div>
          </div>
          {displayedChecklist.length > 0 && (
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30">
              {t("packing.progressStatus", {
                completed: displayedChecklist.filter((c) => c.completed).length,
                total: displayedChecklist.length,
              })}
            </span>
          )}
        </div>

        {/* Switcher Tab Slider */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl mb-4 relative z-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("shared")}
            className={classNames(
              "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer",
              activeSubTab === "shared"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {t("packing.sharedTab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("private")}
            className={classNames(
              "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1.5",
              activeSubTab === "private"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {t("packing.personalTab")}
            {localPrivateItems.length > 0 && (
              <span className="flex items-center justify-center min-w-4.5 h-4.5 text-[9.5px] font-black px-1 rounded-full bg-purple-650 text-white">
                {localPrivateItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Items List grouped by Categories (Grid on desktop, List on mobile) */}
        {displayedChecklist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start mt-4">
            {/* Column 1 */}
            <div className="space-y-6">
              {activeCategories
                .filter((_, idx) => idx % 3 === 0)
                .map((catName, idx) => {
                  const catIdx = idx * 3;
                  return renderCategoryCard(catName, catIdx);
                })}
            </div>
            {/* Column 2 */}
            <div className="space-y-6">
              {activeCategories
                .filter((_, idx) => idx % 3 === 1)
                .map((catName, idx) => {
                  const catIdx = idx * 3 + 1;
                  return renderCategoryCard(catName, catIdx);
                })}
            </div>
            {/* Column 3 */}
            <div className="space-y-6">
              {activeCategories
                .filter((_, idx) => idx % 3 === 2)
                .map((catName, idx) => {
                  const catIdx = idx * 3 + 2;
                  return renderCategoryCard(catName, catIdx);
                })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/80 my-2">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-400 dark:text-purple-500 mb-3">
              <HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />
            </div>
            <h4 className="text-[14px] font-bold text-kat-dark dark:text-slate-200">
              {activeSubTab === "private" ? t("packing.emptyPrivate") : t("packing.emptyShared")}
            </h4>
            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 font-bold max-w-[220px]">
              {activeSubTab === "private"
                ? t("packing.emptyPrivateDesc")
                : "Hãy thêm các vật dụng cần thiết để chuẩn bị cho chuyến đi"}
            </p>
          </div>
        )}

        {activeMenuId &&
          menuPos &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-998"
                onClick={() => {
                  setActiveMenuId(null);
                  setMenuPos(null);
                }}
              />
              <div
                className="fixed z-999 w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 animate-fadeIn"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                <button
                  onClick={() => {
                    const id = activeMenuId;
                    setActiveMenuId(null);
                    setMenuPos(null);
                    const item =
                      activeSubTab === "private"
                        ? localPrivateItems.find((x) => String(x.id) === id)
                        : checklist.find((x) => String(x.id) === id);
                    if (item) startEdit(item);
                  }}
                  className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {activeSubTab === "private"
                    ? t("packing.edit")
                    : isDirectEdit
                      ? t("packing.edit")
                      : t("packing.proposeEdit")}
                </button>
                <button
                  onClick={() => {
                    const id = activeMenuId;
                    setActiveMenuId(null);
                    setMenuPos(null);
                    handleDelete(id);
                  }}
                  className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  {activeSubTab === "private"
                    ? t("packing.deleteAction")
                    : isDirectEdit
                      ? t("packing.deleteAction")
                      : t("packing.proposeDelete")}
                </button>
              </div>
            </>,
            document.body
          )}

        {/* Add Button */}
        {canAdd && (
          <button
            onClick={startAdd}
            className={classNames(
              "mt-4 items-center justify-center gap-2 text-[13.5px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/25 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 active:scale-[0.99] rounded-xl transition-all shadow-xs shadow-purple-100/30 dark:shadow-none h-11 w-full",
              displayedChecklist.length > 0 ? "hidden lg:flex" : "flex"
            )}
            title={
              activeSubTab === "private"
                ? t("packing.addPrivate")
                : isDirectEdit
                  ? t("packing.addToList")
                  : t("packing.proposeAdd")
            }
          >
            <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
            {activeSubTab === "private"
              ? t("packing.addPrivate")
              : isDirectEdit
                ? t("packing.addToList")
                : t("packing.proposeAdd")}
          </button>
        )}

        <BottomSheet
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingId(null);
          }}
          title={
            activeSubTab === "private"
              ? editingId
                ? t("packing.editPrivate")
                : t("packing.addPrivate")
              : isDirectEdit
                ? editingId
                  ? t("packing.edit")
                  : t("packing.addToList")
                : editingId
                  ? t("packing.proposeEdit")
                  : t("packing.proposeAdd")
          }
          footer={
            <div className="w-full">
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="w-full h-[52px] rounded-2xl bg-kat-dark dark:bg-kat-primary font-black text-[14px] text-white dark:text-slate-950 hover:bg-opacity-95 dark:hover:bg-kat-primary-light active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent disabled:cursor-not-allowed border border-transparent motion-press"
              >
                {activeSubTab === "private"
                  ? editingId
                    ? t("packing.saveChanges")
                    : t("packing.addToList")
                  : isDirectEdit
                    ? editingId
                      ? t("packing.saveChanges")
                      : t("packing.addToList")
                    : editingId
                      ? t("packing.proposeEdit")
                      : t("packing.proposeAdd")}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3.5 py-1">
            {/* Item Name */}
            <div className="space-y-1">
              <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={TextIcon}
                  className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                />
                {t("packing.itemNameLabel")}
              </label>
              <input
                className={`w-full rounded-[12px] border bg-slate-50 dark:bg-slate-800/50 px-3.5 h-11 text-[14px] font-semibold text-slate-800 dark:text-slate-200 outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 ${
                  showValidationError
                    ? "border-red-500 ring-2 ring-red-500"
                    : "border-slate-200 dark:border-slate-700/60 focus:border-kat-teal"
                }`}
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (e.target.value.trim()) setShowValidationError(false);
                }}
                placeholder="VD: Sạc dự phòng"
              />
              {showValidationError && (
                <p className="text-rose-500 dark:text-rose-450 text-[11.5px] font-bold mt-1 pl-1 flex items-center gap-1">
                  <span>{t("packing.itemNameLabel")}</span>
                </p>
              )}
            </div>

            {/* Category Segment Select (Grid of chips) */}
            <div className="space-y-2">
              <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={PackageIcon}
                  className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                />
                {t("packing.categoryLabel")}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const IconComponent = CATEGORY_ICONS[cat] || PackageIcon;
                  const isSelected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`flex flex-col items-center justify-center min-h-[76px] p-2 rounded-[18px] border-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-kat-dark/5 dark:bg-slate-800/80 border-kat-dark dark:border-kat-primary text-kat-dark dark:text-kat-primary font-black shadow-xs"
                          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-650"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8.5 h-8.5 rounded-[12px] mb-1 transition-all ${
                          isSelected
                            ? "bg-kat-dark/12 dark:bg-kat-teal/20 text-kat-dark dark:text-kat-teal"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <HugeiconsIcon icon={IconComponent} className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[12px] font-bold tracking-tight">
                        {catMap[cat] || cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Priority in side-by-side grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Quantity Counter */}
              <div className="flex flex-col gap-1">
                <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300">
                  {t("packing.quantityLabel")}
                </label>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-[12px] p-1 border border-slate-200/60 dark:border-slate-700/60 h-11">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-xs active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <HugeiconsIcon icon={MinusSignIcon} className="h-3 w-3" />
                  </button>
                  <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 w-8 text-center">
                    {form.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shadow-xs active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Priority Segments */}
              <div className="flex flex-col gap-1">
                <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300">
                  {t("packing.priorityLabel")}
                </label>
                <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-700/60 rounded-[12px] h-11 items-center">
                  {(["normal", "important", "required"] as const).map((prio) => {
                    const isSelected = form.priority === prio;
                    const labels = {
                      normal: t("packing.priorityNormal"),
                      important: t("packing.priorityImportant"),
                      required: t("packing.priorityRequired"),
                    };
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setForm({ ...form, priority: prio })}
                        className={`flex-1 py-1 rounded-[8px] text-[11.5px] font-bold transition-all h-full flex items-center justify-center ${
                          isSelected
                            ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/30 dark:border-slate-650"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {labels[prio]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-1">
              <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={UserCheck01Icon}
                  className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                />
                {t("packing.assigneeLabel")}
              </label>
              {members.length === 0 ? (
                <div className="rounded-[12px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-2.5 flex items-start gap-2.5">
                  <HugeiconsIcon
                    icon={UserIcon}
                    className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                      {t("packing.noMembersTitle")}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">
                      {t("packing.noMembersDesc")}
                    </p>
                  </div>
                </div>
              ) : (
                <Select
                  label=""
                  value={form.assignedTo}
                  onChange={(assignedTo) => setForm({ ...form, assignedTo })}
                  options={[
                    "",
                    ...(form.assignedTo && !members.some((m) => m.name === form.assignedTo)
                      ? [form.assignedTo]
                      : []),
                    ...members.map((m) => m.name),
                  ]}
                  placeholder={t("packing.companionSelect")}
                  buttonClassName="w-full flex items-center justify-between rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 px-3.5 h-11 text-[14px] font-semibold text-slate-800 dark:text-slate-200 outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-teal"
                />
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Note01Icon}
                  className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
                />
                {t("packing.noteLabel")}
              </label>
              <textarea
                className="w-full h-14 rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-teal resize-none placeholder-slate-400"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder={t("packing.notePlaceholder")}
              />
            </div>
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
          title={
            activeSubTab === "private"
              ? t("packing.deletePrivateTitle")
              : t("packing.proposeDeleteTitle")
          }
          description={
            activeSubTab === "private"
              ? t("packing.deletePrivateDesc")
              : t("packing.proposeDeleteDesc")
          }
          confirmLabel={
            activeSubTab === "private" ? t("packing.deleteAction") : t("packing.proposeDelete")
          }
          itemName={
            activeSubTab === "private"
              ? localPrivateItems.find((c) => String(c.id) === deleteTargetId)?.title
              : checklist.find((c) => String(c.id) === deleteTargetId)?.title
          }
        />
      </section>

      {/* Mobile Floating Action Button (FAB) when checklist items exist */}
      {canAdd && displayedChecklist.length > 0 && (
        <button
          type="button"
          onClick={startAdd}
          className="lg:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 text-kat-dark dark:text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200 cursor-pointer"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label={
            activeSubTab === "private" ? t("packing.addPrivate") : t("packing.proposeAdd")
          }
          title={activeSubTab === "private" ? t("packing.addPrivate") : t("packing.proposeAdd")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
