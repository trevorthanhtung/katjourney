import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { listContainerVariants, listItemVariants, springInteraction } from "../../lib/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckIcon,
  Add01Icon,
  Delete01Icon,
  Luggage01Icon,
  PencilEdit01Icon,
  AlertCircleIcon,
  UserIcon,
  Cancel01Icon,
  MinusSignIcon,
  SparklesIcon,
  FileCheckIcon,
  TShirtIcon,
  Plug01Icon,
  PillIcon,
  WalletCardsIcon,
  Bread01Icon,
  PackageIcon,
  CheckmarkBadge01Icon,
  UserCheckIcon,
  Note01Icon,
  TextIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { ChecklistItem, db } from "../../db";
import { getChecklistStats } from "../../utils/helpers";
import { useLiveQuery } from "dexie-react-hooks";
import { DeleteConfirmModal, Select } from "../../components/ui";
import { useModalHistory } from "../../hooks/useModalHistory";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

const categoryI18nMap: Record<string, string> = {
  "Giấy tờ": "packing.catDocuments",
  "Quần áo": "packing.catClothing",
  "Đồ cá nhân": "packing.catPersonal",
  "Thiết bị điện tử": "packing.catElectronics",
  "Thuốc & y tế": "packing.catMedical",
  "Tiền & ví": "packing.catMoney",
  "Đồ ăn nhẹ": "packing.catSnacks",
  Khác: "packing.catOther",
};

const CATEGORIES = [
  "Giấy tờ",
  "Quần áo",
  "Đồ cá nhân",
  "Thiết bị điện tử",
  "Thuốc & y tế",
  "Tiền & ví",
  "Đồ ăn nhẹ",
  "Khác",
];

const CATEGORY_ICONS: Record<string, any> = {
  "Giấy tờ": FileCheckIcon,
  "Quần áo": TShirtIcon,
  "Đồ cá nhân": SparklesIcon,
  "Thiết bị điện tử": Plug01Icon,
  "Thuốc & y tế": PillIcon,
  "Tiền & ví": WalletCardsIcon,
  "Đồ ăn nhẹ": Bread01Icon,
  Khác: PackageIcon,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Giấy tờ": { bg: "bg-blue-50/70", text: "text-blue-800", border: "border-blue-100" },
  "Quần áo": { bg: "bg-orange-50/70", text: "text-orange-800", border: "border-orange-100" },
  "Đồ cá nhân": { bg: "bg-teal-50/70", text: "text-teal-800", border: "border-teal-100" },
  "Thiết bị điện tử": {
    bg: "bg-purple-50/70",
    text: "text-purple-800",
    border: "border-purple-100",
  },
  "Thuốc & y tế": { bg: "bg-green-50/70", text: "text-green-700", border: "border-green-100" },
  "Tiền & ví": { bg: "bg-emerald-50/70", text: "text-emerald-800", border: "border-emerald-100" },
  "Đồ ăn nhẹ": { bg: "bg-amber-50/70", text: "text-amber-800", border: "border-amber-100" },
  Khác: { bg: "bg-slate-100/70", text: "text-slate-700", border: "border-slate-200" },
};

const QUICK_SUGGESTIONS = [
  { labelKey: "packing.catDocuments", titleKey: "packing.sugPassport", category: "Giấy tờ" },
  { labelKey: "packing.catClothing", titleKey: "packing.sugClothes", category: "Quần áo" },
  {
    labelKey: "packing.catElectronics",
    titleKey: "packing.sugPowerBank",
    category: "Thiết bị điện tử",
  },
  { labelKey: "packing.catMedical", titleKey: "packing.sugMeds", category: "Thuốc & y tế" },
  { labelKey: "packing.catPersonal", titleKey: "packing.sugToothbrush", category: "Đồ cá nhân" },
  { labelKey: "packing.catMoney", titleKey: "packing.sugMoney", category: "Tiền & ví" },
  { labelKey: "packing.catPersonal", titleKey: "packing.sugTowel", category: "Đồ cá nhân" },
  { labelKey: "packing.catSnacks", titleKey: "packing.sugSnacks", category: "Đồ ăn nhẹ" },
];

function ChecklistItemRow({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
  isReadOnly,
}: {
  item: ChecklistItem;
  onToggleComplete: (item: ChecklistItem) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = React.useMemo(
    () => ({
      "Giấy tờ": t("packing.catDocuments"),
      "Quần áo": t("packing.catClothing"),
      "Đồ cá nhân": t("packing.catPersonal"),
      "Thiết bị điện tử": t("packing.catElectronics"),
      "Thuốc & y tế": t("packing.catMedical"),
      "Tiền & ví": t("packing.catMoney"),
      "Đồ ăn nhẹ": t("packing.catSnacks"),
      Khác: t("packing.catOther"),
    }),
    [t]
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={springInteraction}
      className={`group flex items-start gap-3.5 p-3.5 rounded-[20px] border transition-all duration-200 ${
        item.completed
          ? "bg-slate-50/40 dark:bg-slate-900/20 border-slate-150 dark:border-white/5 opacity-70"
          : "bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm border-slate-200/55 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
      }`}
    >
      {/* Checkbox button */}
      <button
        onClick={() => {
          if (isReadOnly) return;
          onToggleComplete(item);
        }}
        disabled={isReadOnly}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200 border ${
          item.completed
            ? "bg-emerald-550/15 text-emerald-600 border-transparent dark:text-emerald-400 shadow-sm"
            : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-transparent hover:text-kat-teal hover:border-kat-teal/40 hover:bg-white dark:hover:bg-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] hover:scale-105 active:scale-95"
        }`}
        aria-label={t("packing.toggleChecklist")}
      >
        <HugeiconsIcon icon={CheckIcon} className="h-5 w-5 text-current" />
      </button>

      {/* Title and details */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span
            className={`text-[15px] font-bold tracking-wide break-words transition-all ${
              item.completed
                ? "text-slate-400 dark:text-slate-400/80 line-through font-medium"
                : "text-slate-900 dark:text-slate-200"
            }`}
          >
            {item.title}
          </span>

          {/* Quantity Badge if > 1 */}
          {item.quantity && item.quantity > 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-extrabold border border-slate-200/60 dark:border-slate-700/60">
              x{item.quantity}
            </span>
          )}

          {/* Priority Badge */}
          {item.priority && item.priority !== "normal" && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border ${
                item.priority === "required"
                  ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-100 dark:border-rose-900/30"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/30"
              }`}
            >
              {item.priority === "required"
                ? t("packing.priorityRequired")
                : t("packing.priorityImportant")}
            </span>
          )}

          {/* Private Badge */}
          {item.isPrivate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 text-[10px] font-black border border-purple-100/50 dark:border-purple-900/30">
              Cá nhân
            </span>
          )}
        </div>

        {/* Notes and Assigned To */}
        {(item.note || item.assignedTo) && (
          <div className="mt-1 space-y-0.5 text-[12.5px] text-slate-500 dark:text-slate-400 font-semibold">
            {item.note && (
              <p className="italic text-slate-400 dark:text-slate-500 line-clamp-2 border-l border-slate-200 dark:border-slate-700 pl-2 mt-1">
                "{item.note}"
              </p>
            )}
            {item.assignedTo && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                <HugeiconsIcon icon={UserIcon} className="h-3 w-3" />
                Chuẩn bị:{" "}
                <span className="text-kat-dark dark:text-slate-300">{item.assignedTo}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action menu trigger (min 44x44px target zone) */}
      {!isReadOnly && (
        <div className="relative shrink-0 self-center" ref={menuRef}>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title={t("packing.options")}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-lg animate-scaleIn text-left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onEdit(item);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
              >
                <HugeiconsIcon
                  icon={PencilEdit01Icon}
                  className="h-4 w-4 text-slate-500 dark:text-slate-400"
                />
                {t("packing.edit")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete(item);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
              >
                <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                {t("packing.deleteAction")}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function ChecklistScreen({
  checklist,
  tripId,
  isReadOnly,
}: {
  checklist: ChecklistItem[];
  tripId: number;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = React.useMemo(
    () => ({
      "Giấy tờ": t("packing.catDocuments"),
      "Quần áo": t("packing.catClothing"),
      "Đồ cá nhân": t("packing.catPersonal"),
      "Thiết bị điện tử": t("packing.catElectronics"),
      "Thuốc & y tế": t("packing.catMedical"),
      "Tiền & ví": t("packing.catMoney"),
      "Đồ ăn nhẹ": t("packing.catSnacks"),
      Khác: t("packing.catOther"),
    }),
    [t]
  );
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);

  useBodyScrollLock(isFormOpen);

  useModalHistory(
    isFormOpen,
    () => {
      setIsFormOpen(false);
      setEditingId(null);
    },
    "checklist-form-modal"
  );

  useModalHistory(Boolean(itemToDelete), () => setItemToDelete(null), "delete-checklist-confirm");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Giấy tờ");
  const [quantity, setQuantity] = useState(1);
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "required">("normal");
  const [note, setNote] = useState("");
  const [section, setSection] = useState<import("../../db").ChecklistSection>("Before Trip");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Load members using LiveQuery
  const members =
    useLiveQuery(() => db.members.where("tripId").equals(tripId).toArray(), [tripId]) ?? [];

  const stats = getChecklistStats(checklist);
  const isEmpty = checklist.length === 0;

  // Show Toast helper
  function showToastMessage(message: string, type: "success" | "info" = "success") {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  // Open Form for Add
  function openAddForm() {
    setEditingId(null);
    setTitle("");
    setCategory("Giấy tờ");
    setQuantity(1);
    setAssignedTo("");
    setPriority("normal");
    setNote("");
    setSection("Before Trip");
    setIsPrivate(false);
    setShowValidationError(false);
    setIsFormOpen(true);
  }

  // Open Form for Edit
  function openEditForm(item: ChecklistItem) {
    setEditingId(item.id!);
    setTitle(item.title);
    setCategory(item.category || "Khác");
    setQuantity(item.quantity || 1);
    setAssignedTo(item.assignedTo || "");
    setPriority(item.priority || "normal");
    setNote(item.note || "");
    setSection(item.section || "Before Trip");
    setIsPrivate(item.isPrivate || false);
    setShowValidationError(false);
    setIsFormOpen(true);
  }

  // Save Item (Add or Update)
  async function saveItem() {
    if (!title.trim()) {
      setShowValidationError(true);
      return;
    }

    const itemData = {
      tripId,
      title: title.trim(),
      section,
      category,
      quantity,
      assignedTo: assignedTo || undefined,
      priority,
      note: note.trim() || undefined,
      isPrivate,
      createdBy: "owner",
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      await db.checklist.update(editingId, itemData);
      showToastMessage(`Đã cập nhật: ${title.trim()}`);
    } else {
      await db.checklist.add({
        ...itemData,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      showToastMessage(`Đã thêm: ${title.trim()}`);
    }

    setIsFormOpen(false);
  }

  // Quick Add Suggestion
  async function handleQuickAdd(sugTitle: string, sugCategory: string) {
    const isDuplicate = checklist.some(
      (item) => item.title.toLowerCase().trim() === sugTitle.toLowerCase().trim()
    );

    if (isDuplicate) {
      showToastMessage(`"${sugTitle}" đã có trong danh sách`, "info");
      return;
    }

    await db.checklist.add({
      tripId,
      title: sugTitle,
      section: "Before Trip",
      completed: false,
      category: sugCategory,
      quantity: 1,
      priority: "normal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    showToastMessage(`Đã thêm nhanh "${sugTitle}"`);
  }

  // Delete item
  async function executeDeleteItem() {
    if (itemToDelete?.id) {
      await db.checklist.delete(itemToDelete.id);
      showToastMessage(`${t("packing.toastDeleted")} ${itemToDelete.title}`);
      setItemToDelete(null);
    }
  }

  // Toggle item complete status
  async function toggleComplete(item: ChecklistItem) {
    if (item.id) {
      const nextCompleted = !item.completed;
      await db.checklist.update(item.id, { completed: nextCompleted });
      showToastMessage(
        nextCompleted ? `Đã chuẩn bị: ${item.title}` : `Chưa chuẩn bị: ${item.title}`
      );
    }
  }

  // Group items by category (default fallback is "Khác")
  const groupedItems = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = [];
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  checklist.forEach((item) => {
    const cat = item.category && CATEGORIES.includes(item.category) ? item.category : "Khác";
    groupedItems[cat].push(item);
  });

  const activeCategories = CATEGORIES.filter((cat) => groupedItems[cat].length > 0);
  const isAdded = (sugTitle: string) =>
    checklist.some((item) => item.title.toLowerCase().trim() === sugTitle.toLowerCase().trim());

  const allSuggestionsAdded = QUICK_SUGGESTIONS.every((sug) => isAdded(t(sug.titleKey)));

  // Determine status description text
  let statusText = t("packing.statusEmpty");
  if (checklist.length > 0) {
    if (stats.percent === 100) {
      statusText = t("packing.progressPerfect");
    } else {
      statusText = t("packing.statusRemaining", { remaining: stats.total - stats.completed });
    }
  }

  const renderCategoryCard = (catName: string, catIdx: number) => {
    const items = groupedItems[catName];
    const catDone = items.filter((i) => i.completed).length;
    const catTotal = items.length;

    return (
      <div
        key={catName}
        className={`bg-white/70 dark:bg-slate-900/30 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 motion-card-enter motion-delay-${Math.min(
          catIdx + 1,
          5
        )}`}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            {(() => {
              const IconComponent = CATEGORY_ICONS[catName] || PackageIcon;
              const theme = CATEGORY_COLORS[catName] || CATEGORY_COLORS["Khác"];
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
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <AnimatePresence>
            {items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggleComplete={toggleComplete}
                onEdit={openEditForm}
                onDelete={setItemToDelete}
                isReadOnly={isReadOnly}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-2 sm:px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 pb-0 md:pb-8">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-black tracking-tight text-kat-text">
            {t("packing.pageTitle")}
          </h2>
          <p className="mt-1 text-[15px] font-bold text-kat-muted">{t("packing.pageSubtitle")}</p>
        </div>
      </div>

      {/* Optimized Progress Header Card */}
      <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] p-5 shadow-soft border border-slate-200/50 dark:border-white/5 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-kat-primary/5 dark:bg-kat-primary/10 blur-[35px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress Indicator (Left: chart, Right: text) */}
          <div className="flex items-center gap-4.5 w-full sm:w-auto">
            {/* Circle Progress Chart */}
            <div
              className="relative inline-flex items-center justify-center shrink-0"
              style={{ width: 72, height: 72 }}
            >
              <svg className="absolute -rotate-90 transform" width={72} height={72}>
                <circle
                  className="text-slate-100 dark:text-slate-800/80"
                  strokeWidth={7}
                  stroke="currentColor"
                  fill="transparent"
                  r={29}
                  cx={36}
                  cy={36}
                />
                <circle
                  className="text-kat-teal transition-all duration-1000 ease-out"
                  strokeWidth={7}
                  strokeDasharray={182.21}
                  strokeDashoffset={182.21 - (stats.percent / 100) * 182.21}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={29}
                  cx={36}
                  cy={36}
                />
              </svg>
              <span className="text-[15px] font-black text-slate-800 dark:text-slate-200">
                {stats.percent}%
              </span>
            </div>

            {/* Text Hierarchy */}
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {t("packing.progressTitle")}
              </h3>
              <p className="text-[13.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t("packing.progressStatus", { completed: stats.completed, total: stats.total })}
              </p>
            </div>
          </div>

          {/* Desktop Add Button */}
          {!isReadOnly && (
            <div className="hidden md:block">
              <button
                onClick={openAddForm}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 border border-transparent dark:border-kat-primary px-4 text-[13.5px] font-black shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-95 transition-all motion-press w-full sm:w-auto shrink-0"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                <span>{t("packing.addItem")}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Suggestions Horizontal Scroll Chips (Only if not empty) */}
      {!isEmpty && !isReadOnly && !allSuggestionsAdded && (
        <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] p-4 border border-slate-200/50 dark:border-white/5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={SparklesIcon} className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-[14.5px] font-black text-kat-text">
                {t("packing.quickSuggestionsTitle")}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 md:hidden">
              {t("packing.scrollRight")}
            </span>
          </div>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-2 px-2 touch-pan-x scrollbar-none md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
            {QUICK_SUGGESTIONS.map((sug) => {
              const added = isAdded(t(sug.titleKey));
              const sugColorMap: Record<string, string> = {
                "Giấy tờ":
                  "bg-blue-500/[0.04] dark:bg-blue-500/[0.08] text-blue-700 dark:text-blue-400 border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10",
                "Quần áo":
                  "bg-orange-500/[0.04] dark:bg-orange-500/[0.08] text-orange-700 dark:text-orange-400 border-orange-500/10 hover:border-orange-500/30 hover:bg-orange-500/10",
                "Đồ cá nhân":
                  "bg-teal-500/[0.04] dark:bg-teal-500/[0.08] text-teal-700 dark:text-teal-400 border-teal-500/10 hover:border-teal-500/30 hover:bg-teal-500/10",
                "Thiết bị điện tử":
                  "bg-purple-500/[0.04] dark:bg-purple-500/[0.08] text-purple-700 dark:text-purple-400 border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-500/10",
                "Thuốc & y tế":
                  "bg-green-500/[0.04] dark:bg-green-500/[0.08] text-green-700 dark:text-green-400 border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10",
                "Tiền & ví":
                  "bg-emerald-500/[0.04] dark:bg-[#10B981]/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10",
                "Đồ ăn nhẹ":
                  "bg-amber-500/[0.04] dark:bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/10",
                Khác: "bg-slate-500/[0.04] dark:bg-slate-500/[0.08] text-slate-700 dark:text-slate-400 border-slate-500/10 hover:border-slate-500/30 hover:bg-slate-500/10",
              };
              const sugColor = sugColorMap[sug.category] || sugColorMap["Khác"];

              return (
                <button
                  key={t(sug.titleKey)}
                  disabled={added}
                  onClick={() => handleQuickAdd(t(sug.titleKey), sug.category)}
                  className={`h-9 px-3.5 shrink-0 rounded-xl border text-[12px] font-extrabold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                    added
                      ? "bg-slate-100/50 dark:bg-slate-800/10 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-655 cursor-not-allowed"
                      : `${sugColor} shadow-sm hover:scale-[1.025]`
                  }`}
                >
                  {added ? (
                    <>
                      <HugeiconsIcon
                        icon={CheckIcon}
                        className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                      />
                      <span className="truncate">
                        {t(sug.labelKey)} · {t("packing.addedStatus")}
                      </span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5 opacity-70 shrink-0" />
                      <span className="truncate">{t(sug.labelKey)}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Checklist Body */}
      {isEmpty ? (
        /* Empty State */
        <div className="rounded-[28px] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 border border-slate-200/50 dark:border-white/5 flex flex-col items-center text-center animate-fadeIn shadow-soft max-w-xl mx-auto space-y-6 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -left-16 -top-16 w-32 h-32 rounded-full bg-kat-teal/5 dark:bg-kat-teal/10 blur-[30px] pointer-events-none" />

          {/* Header Zone */}
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-kat-primary/10 text-kat-primary mb-3.5 border border-kat-primary/20 shadow-inner">
              <HugeiconsIcon icon={Luggage01Icon} className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-[17px] font-black text-slate-800 dark:text-slate-200">
              {t("packing.emptyStateTitle")}
            </h3>
            <p className="mt-1 text-[13.5px] font-medium text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {t("packing.emptyStateDesc")}
            </p>
          </div>

          {/* Suggestion Zone */}
          {!isReadOnly && !allSuggestionsAdded && (
            <div className="w-full pt-5 border-t border-slate-100 dark:border-white/5">
              <p className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3.5 flex items-center justify-center gap-1.5">
                <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5 text-amber-500" />
                {t("packing.quickSuggestions")}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {QUICK_SUGGESTIONS.map((sug) => {
                  const added = isAdded(t(sug.titleKey));
                  const sugColorMap: Record<string, string> = {
                    "Giấy tờ":
                      "bg-blue-500/[0.04] dark:bg-blue-500/[0.08] text-blue-700 dark:text-blue-400 border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10",
                    "Quần áo":
                      "bg-orange-500/[0.04] dark:bg-orange-500/[0.08] text-orange-700 dark:text-orange-400 border-orange-500/10 hover:border-orange-500/30 hover:bg-orange-500/10",
                    "Đồ cá nhân":
                      "bg-teal-500/[0.04] dark:bg-teal-500/[0.08] text-teal-700 dark:text-teal-400 border-teal-500/10 hover:border-teal-500/30 hover:bg-teal-500/10",
                    "Thiết bị điện tử":
                      "bg-purple-500/[0.04] dark:bg-purple-500/[0.08] text-purple-700 dark:text-purple-400 border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-500/10",
                    "Thuốc & y tế":
                      "bg-green-500/[0.04] dark:bg-green-500/[0.08] text-green-700 dark:text-green-400 border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10",
                    "Tiền & ví":
                      "bg-emerald-500/[0.04] dark:bg-[#10B981]/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/10",
                    "Đồ ăn nhẹ":
                      "bg-amber-500/[0.04] dark:bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/10",
                    Khác: "bg-slate-500/[0.04] dark:bg-slate-500/[0.08] text-slate-700 dark:text-slate-400 border-slate-500/10 hover:border-slate-500/30 hover:bg-slate-500/10",
                  };
                  const sugColor = sugColorMap[sug.category] || sugColorMap["Khác"];

                  return (
                    <button
                      key={t(sug.titleKey)}
                      disabled={added}
                      onClick={() => handleQuickAdd(t(sug.titleKey), sug.category)}
                      className={`h-[38px] px-3.5 rounded-xl border text-[12px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                        added
                          ? "bg-slate-100/50 dark:bg-slate-800/10 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-655 cursor-not-allowed"
                          : `${sugColor} shadow-sm hover:scale-[1.025]`
                      }`}
                    >
                      {added ? (
                        <>
                          <HugeiconsIcon
                            icon={CheckIcon}
                            className="h-3.5 w-3.5 text-emerald-600 animate-fadeIn"
                          />
                          <span>
                            {t(sug.labelKey)} · {t("packing.addedStatus")}
                          </span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Add01Icon}
                            className="h-3.5 w-3.5 opacity-70 shrink-0"
                          />
                          <span>{t(sug.labelKey)}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Checklist grouped by Categories (Grid on desktop, List on mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
      )}

      {/* Responsive Modal Form (Centered on Desktop, Bottom Sheet on Mobile) */}
      {isFormOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-6">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm motion-modal-overlay"
              onClick={() => setIsFormOpen(false)}
            />

            {/* Modal Container */}
            <div className="relative z-10 flex w-full flex-col max-h-[90vh] md:max-h-[calc(100vh-48px)] rounded-t-[24px] md:rounded-[28px] bg-white dark:bg-kat-surface border dark:border-slate-800 pb-safe shadow-floating md:mx-auto md:w-full md:max-w-[560px] overflow-hidden motion-sheet-dialog md:motion-modal-dialog">
              {/* Mobile Drag Handle */}
              <div className="flex shrink-0 h-1.5 w-12 mx-auto mt-3 mb-1 rounded-full bg-slate-200 dark:bg-slate-700 md:hidden" />

              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/60 dark:border-slate-800 px-6 py-4">
                <div>
                  <h3 className="text-[19px] md:text-[20px] font-black text-kat-text">
                    {editingId ? t("packing.editTitle") : t("packing.addTitle")}
                  </h3>
                </div>
                <button
                  className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-kat-dark/05 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-kat-dark/10 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setIsFormOpen(false)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={TextIcon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    {t("packing.itemNameLabel")}
                  </label>
                  <input
                    className={`w-full rounded-[14px] border bg-slate-50/60 dark:bg-slate-800/50 px-4 h-[46px] text-[14px] font-semibold text-kat-text outline-none transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-primary/50 ${
                      showValidationError
                        ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 motion-error-shake"
                        : "border-kat-border dark:border-slate-700 focus:border-kat-primary"
                    }`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (e.target.value.trim()) setShowValidationError(false);
                    }}
                    placeholder={t("packing.namePlaceholder")}
                  />
                  {showValidationError && (
                    <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1 flex items-center gap-1 motion-error-enter">
                      <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5" />
                      <span>{t("packing.itemNameError")}</span>
                    </p>
                  )}
                </div>

                {/* Category Segment Select (Grid of chips) */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-kat-text block flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={PackageIcon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    Nhóm hành lý
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const IconComponent = CATEGORY_ICONS[cat] || PackageIcon;
                      const isSelected = category === cat;
                      return (
                        <button
                          key={catMap[cat] || cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`flex flex-col items-center justify-center min-h-[76px] p-2 rounded-[18px] border-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-kat-dark/5 dark:bg-slate-800/80 border-kat-dark dark:border-kat-primary text-kat-dark dark:text-kat-primary font-black shadow-sm"
                              : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-650"
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

                {/* Quantity Counter */}
                <div className="flex items-center justify-between py-2 border-y border-slate-200/60 dark:border-slate-800">
                  <div>
                    <label className="text-[13px] font-bold text-kat-text">
                      {t("packing.quantityLabel")}
                    </label>
                    <p className="text-[11.5px] text-kat-muted font-bold">
                      {t("packing.quantityDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-[16px] p-1 border border-kat-border/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white dark:bg-slate-800 text-kat-text dark:text-slate-200 border border-kat-border/60 dark:border-slate-700 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <HugeiconsIcon icon={MinusSignIcon} className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[15px] font-black text-kat-text w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white dark:bg-slate-800 text-kat-text dark:text-slate-200 border border-kat-border/60 dark:border-slate-700 shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Assigned To */}
                <div className="space-y-1.5">
                  {members.length === 0 ? (
                    <>
                      <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={UserCheckIcon}
                          className="h-4 w-4 text-slate-500 dark:text-slate-400"
                        />
                        {t("packing.assigneeLabel")}
                      </label>
                      <div className="rounded-[16px] bg-slate-50 dark:bg-slate-800/30 border border-kat-border/60 dark:border-slate-800 p-3 flex items-start gap-2.5">
                        <HugeiconsIcon
                          icon={UserIcon}
                          className="h-4 w-4 text-kat-muted shrink-0 mt-0.5"
                        />
                        <div>
                          <h4 className="text-[12.5px] font-bold text-kat-text">
                            {t("packing.noMembersTitle")}
                          </h4>
                          <p className="text-[11.5px] text-kat-muted mt-0.5 font-bold">
                            {t("packing.noMembersDesc")}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Select
                      label={
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={UserCheckIcon}
                            className="h-4 w-4 text-slate-500 dark:text-slate-400"
                          />
                          {t("packing.assigneeLabel")}
                        </span>
                      }
                      value={assignedTo}
                      onChange={setAssignedTo}
                      options={[
                        "",
                        ...(assignedTo && !members.some((m) => m.name === assignedTo)
                          ? [assignedTo]
                          : []),
                        ...members.map((m) => m.name),
                      ]}
                      labels={members.reduce(
                        (acc, m) => ({
                          ...acc,
                          [m.name]: `${m.name} (${m.role || t("members.roleCompanion")})`,
                        }),
                        {} as Record<string, string>
                      )}
                      placeholder={t("packing.companionSelect")}
                      buttonClassName="w-full flex items-center justify-between rounded-[12px] border border-kat-border dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 px-3.5 h-11 text-[14px] font-semibold text-kat-text outline-none transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-primary"
                    />
                  )}
                </div>

                {/* Priority Segments */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-kat-text block flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    {t("packing.priorityLabel")}
                  </label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 border border-kat-border/50 dark:border-slate-800 rounded-xl">
                    {(["normal", "important", "required"] as const).map((prio) => {
                      const isSelected = priority === prio;
                      const labels = {
                        normal: t("packing.priorityNormal"),
                        important: t("packing.priorityImportant"),
                        required: t("packing.priorityRequired"),
                      };
                      return (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setPriority(prio)}
                          className={`flex-1 py-1.5 rounded-lg text-[12.5px] font-bold transition-all ${
                            isSelected
                              ? "bg-white dark:bg-slate-700 text-kat-text dark:text-slate-100 shadow-sm border border-kat-border/30 dark:border-slate-650"
                              : "text-slate-500 dark:text-slate-400 hover:text-kat-text dark:hover:text-slate-200"
                          }`}
                        >
                          {labels[prio]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Note01Icon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    {t("packing.noteLabel")}
                  </label>
                  <textarea
                    className="w-full h-[72px] rounded-[14px] border border-kat-border dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 px-4 py-3 text-[14px] font-semibold text-kat-text outline-none transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-kat-primary/50 resize-none"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("packing.notePlaceholder")}
                  />
                </div>

                {/* Private Toggle Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-slate-800/30 border border-kat-border/60 dark:border-slate-800 rounded-[18px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-[12px] bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                      <HugeiconsIcon icon={Luggage01Icon} className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 block">
                        {t("packing.privateItem")}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                        {t("packing.privateItemDesc")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPrivate ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPrivate ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-kat-surface sticky bottom-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
                >
                  {t("packing.cancel")}
                </button>
                <button
                  type="button"
                  onClick={saveItem}
                  className="flex-[2] h-[50px] inline-flex items-center justify-center gap-2 rounded-[16px] bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 font-black hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-kat-dark disabled:active:scale-100 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:opacity-100 shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] border border-transparent dark:border-kat-primary dark:disabled:border-transparent"
                  disabled={!title.trim()}
                >
                  <HugeiconsIcon icon={CheckIcon} className="h-4.5 w-4.5" />
                  {editingId ? t("packing.saveItem") : t("packing.addItemConfirm")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Floating Action Button (Mobile only) */}
      {!isReadOnly && (
        <button
          onClick={openAddForm}
          className="md:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 text-kat-dark dark:text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200"
          style={{ bottom: "calc(6rem + var(--safe-bottom))" }}
          aria-label={t("packing.addItem")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDeleteItem}
        title={t("packing.deleteTitle")}
        itemName={itemToDelete?.title}
        description={t("packing.deleteDesc")}
        confirmLabel={t("packing.deleteConfirm")}
      />

      {/* Toast Notification popup */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 motion-toast-enter">
          <div className="bg-kat-dark dark:bg-slate-800 text-white dark:text-slate-200 px-5 py-3 rounded-2xl shadow-floating flex items-center gap-3 border border-slate-200/20 dark:border-slate-700/50">
            <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-kat-primary/20 text-kat-primary">
              <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5" />
            </div>
            <span className="text-[14px] font-bold tracking-wide text-sand dark:text-slate-200">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
