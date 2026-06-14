import React, { useState, useEffect, useRef } from "react";
import { Check, Plus, Trash2, Luggage, Edit2, AlertCircle, User, X, Minus, Sparkles, FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, WalletCards, Sandwich, Package, BadgeCheck, CheckCircle2, ClipboardList, UserRoundCheck, StickyNote, Type, MoreHorizontal } from "lucide-react";
import { ChecklistItem, db } from "../../db";
import { getChecklistStats } from "../../utils/helpers";
import { useLiveQuery } from "dexie-react-hooks";
import { DeleteConfirmModal, Select } from "../../components/ui";

const CATEGORIES = [
  "Giấy tờ",
  "Quần áo",
  "Đồ cá nhân",
  "Thiết bị điện tử",
  "Thuốc & y tế",
  "Tiền & ví",
  "Đồ ăn nhẹ",
  "Khác"
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  "Giấy tờ": FileCheck2,
  "Quần áo": Shirt,
  "Đồ cá nhân": Sparkles,
  "Thiết bị điện tử": PlugZap,
  "Thuốc & y tế": Pill,
  "Tiền & ví": WalletCards,
  "Đồ ăn nhẹ": Sandwich,
  "Khác": Package
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Giấy tờ": { bg: "bg-blue-50/70", text: "text-blue-800", border: "border-blue-100" },
  "Quần áo": { bg: "bg-orange-50/70", text: "text-orange-800", border: "border-orange-100" },
  "Đồ cá nhân": { bg: "bg-teal-50/70", text: "text-teal-800", border: "border-teal-100" },
  "Thiết bị điện tử": { bg: "bg-purple-50/70", text: "text-purple-800", border: "border-purple-100" },
  "Thuốc & y tế": { bg: "bg-green-50/70", text: "text-green-700", border: "border-green-100" },
  "Tiền & ví": { bg: "bg-emerald-50/70", text: "text-emerald-800", border: "border-emerald-100" },
  "Đồ ăn nhẹ": { bg: "bg-amber-50/70", text: "text-amber-800", border: "border-amber-100" },
  "Khác": { bg: "bg-slate-100/70", text: "text-slate-700", border: "border-slate-200" }
};

const QUICK_SUGGESTIONS = [
  { label: "Giấy tờ", title: "Hộ chiếu & CCCD", category: "Giấy tờ" },
  { label: "Quần áo", title: "Quần áo dã ngoại", category: "Quần áo" },
  { label: "Sạc dự phòng", title: "Sạc dự phòng, cáp sạc", category: "Thiết bị điện tử" },
  { label: "Thuốc & y tế", title: "Thuốc hạ sốt, băng cá nhân", category: "Thuốc & y tế" },
  { label: "Đồ cá nhân", title: "Bàn chải & Kem đánh răng", category: "Đồ cá nhân" },
  { label: "Tiền & ví", title: "Tiền mặt & thẻ", category: "Tiền & ví" },
  { label: "Khăn / vệ sinh", title: "Khăn mặt & Bộ vệ sinh", category: "Đồ cá nhân" },
  { label: "Đồ ăn nhẹ", title: "Nước uống & bánh kẹo", category: "Đồ ăn nhẹ" }
];

function ChecklistItemRow({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
  isReadOnly
}: {
  item: ChecklistItem;
  onToggleComplete: (item: ChecklistItem) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
  isReadOnly?: boolean;
}) {
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
    <div
      className={`group flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-200 ${
        item.completed
          ? "bg-slate-50/50 border-slate-200/50 opacity-65"
          : "bg-white border-slate-200/80 hover:border-slate-300"
      }`}
    >
      {/* Checkbox button */}
      <button
        onClick={() => {
          if (isReadOnly) return;
          onToggleComplete(item);
        }}
        disabled={isReadOnly}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 motion-press ${
          item.completed
            ? "bg-[#00BFB7]/20 text-[#00BFB7] border-transparent shadow-sm"
            : "bg-slate-50 border border-slate-200/80 text-transparent hover:text-[#00BFB7] hover:border-[#00BFB7]/50 hover:bg-slate-100"
        }`}
        aria-label="Đánh dấu checklist"
      >
        <Check className="h-5.5 w-5.5 text-current" strokeWidth={3.5} />
      </button>

      {/* Title and details */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span
            className={`text-[15px] font-bold tracking-wide break-words transition-all ${
              item.completed ? "text-slate-400 line-through font-medium" : "text-slate-800"
            }`}
          >
            {item.title}
          </span>

          {/* Quantity Badge if > 1 */}
          {item.quantity && item.quantity > 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-extrabold border border-slate-200/60">
              x{item.quantity}
            </span>
          )}

          {/* Priority Badge */}
          {item.priority && item.priority !== "normal" && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border ${
                item.priority === "required"
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}
            >
              {item.priority === "required" ? "Bắt buộc" : "Quan trọng"}
            </span>
          )}
        </div>

        {/* Notes and Assigned To */}
        {(item.note || item.assignedTo) && (
          <div className="mt-1 space-y-0.5 text-[12.5px] text-slate-500 font-semibold">
            {item.note && <p className="italic text-slate-400 line-clamp-2">"{item.note}"</p>}
            {item.assignedTo && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <User className="h-3 w-3" />
                Chuẩn bị: <span className="text-[#030D2E]">{item.assignedTo}</span>
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
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00BFB7]/40"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Tùy chọn"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 bg-white p-1.5 shadow-lg animate-scaleIn text-left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onEdit(item);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-slate-500" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDelete(item);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChecklistScreen({ checklist, tripId, isReadOnly }: { checklist: ChecklistItem[]; tripId: number; isReadOnly?: boolean }) {
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Giấy tờ");
  const [quantity, setQuantity] = useState(1);
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "required">("normal");
  const [note, setNote] = useState("");
  const [section, setSection] = useState<import("../../db").ChecklistSection>("Before Trip");
  const [showValidationError, setShowValidationError] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Load members using LiveQuery
  const members = useLiveQuery(() => db.members.where("tripId").equals(tripId).toArray(), [tripId]) ?? [];

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
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      await db.checklist.update(editingId, itemData);
      showToastMessage(`Đã cập nhật: ${title.trim()}`);
    } else {
      await db.checklist.add({
        ...itemData,
        completed: false,
        createdAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    });

    showToastMessage(`Đã thêm nhanh "${sugTitle}"`);
  }

  // Delete item
  async function executeDeleteItem() {
    if (itemToDelete?.id) {
      await db.checklist.delete(itemToDelete.id);
      showToastMessage(`Đã xóa: ${itemToDelete.title}`);
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
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  checklist.forEach((item) => {
    const cat = item.category && CATEGORIES.includes(item.category) ? item.category : "Khác";
    groupedItems[cat].push(item);
  });

  const activeCategories = CATEGORIES.filter((cat) => groupedItems[cat].length > 0);
  const isAdded = (sugTitle: string) =>
    checklist.some((item) => item.title.toLowerCase().trim() === sugTitle.toLowerCase().trim());
  
  const allSuggestionsAdded = QUICK_SUGGESTIONS.every((sug) => isAdded(sug.title));

  // Determine status description text
  let statusText = "Chưa có món cần chuẩn bị.";
  if (checklist.length > 0) {
    if (stats.percent === 100) {
      statusText = "Tuyệt vời! Hành lý đã sẵn sàng.";
    } else {
      statusText = `Còn ${stats.total - stats.completed} món cần chuẩn bị.`;
    }
  }

  const renderCategoryCard = (catName: string, catIdx: number) => {
    const items = groupedItems[catName];
    const catDone = items.filter((i) => i.completed).length;
    const catTotal = items.length;

    return (
      <div
        key={catName}
        className={`bg-kat-surface rounded-[24px] border border-kat-border p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 motion-card-enter motion-delay-${Math.min(
          catIdx + 1,
          5
        )}`}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D8]/50">
          <div className="flex items-center gap-2.5">
            {(() => {
              const IconComponent = CATEGORY_ICONS[catName] || Package;
              return (
                <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-kat-primary/10 text-kat-primary">
                  <IconComponent className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              );
            })()}
            <h3 className="text-[16.5px] font-black text-kat-text">{catName}</h3>
          </div>
          <span className="text-[11.5px] font-black text-slate-500 px-2.5 py-0.5 rounded-full bg-[#030D2E]/05">
            {catDone} / {catTotal} món
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-3">
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
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1120px] px-2 sm:px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 pb-0 md:pb-8">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-black tracking-tight text-kat-text">Chuẩn bị hành lý</h2>
          <p className="mt-1 text-[15px] font-bold text-kat-muted">Chuẩn bị đủ những món cần mang theo cho chuyến đi.</p>
        </div>
      </div>

      {/* Optimized Progress Header Card */}
      <section className="bg-kat-surface rounded-[24px] p-5 shadow-soft border border-kat-border/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Progress Indicator (Left: chart, Right: text) */}
          <div className="flex items-center gap-4.5 w-full sm:w-auto">
            {/* Circle Progress Chart */}
            <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: 72, height: 72 }}>
              <svg className="absolute -rotate-90 transform" width={72} height={72}>
                <circle
                  className="text-slate-100"
                  strokeWidth={7}
                  stroke="currentColor"
                  fill="transparent"
                  r={29}
                  cx={36}
                  cy={36}
                />
                <circle
                  className="text-[#00BFB7] transition-all duration-1000 ease-out"
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
              <span className="text-[15px] font-black text-slate-800">{stats.percent}%</span>
            </div>
            
            {/* Text Hierarchy */}
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800 leading-snug">Tiến độ chuẩn bị</h3>
              <p className="text-[13.5px] font-medium text-slate-500 mt-0.5">
                Đã xếp {stats.completed} / {stats.total} món
              </p>
            </div>
          </div>

          {/* Desktop Add Button */}
          {!isReadOnly && (
            <div className="hidden md:block">
              <button 
                onClick={openAddForm}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#030D2E] text-white px-4 text-[13.5px] font-black shadow-sm hover:bg-[#030D2E]/90 active:scale-95 transition-all motion-press w-full sm:w-auto shrink-0"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
                <span>Thêm món</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Suggestions Horizontal Scroll Chips (Only if not empty) */}
      {!isEmpty && !isReadOnly && !allSuggestionsAdded && (
        <section className="bg-kat-surface rounded-[24px] p-4 border border-kat-border/60 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-[14.5px] font-black text-kat-text">Gợi ý nhanh cho hành lý</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 md:hidden">Cuộn ngang ›</span>
          </div>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-2 px-2 touch-pan-x scrollbar-none md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
            {QUICK_SUGGESTIONS.map((sug) => {
              const added = isAdded(sug.title);
              return (
                <button
                  key={sug.title}
                  disabled={added}
                  onClick={() => handleQuickAdd(sug.title, sug.category)}
                  className={`h-9 px-3.5 shrink-0 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                    added
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-kat-border text-slate-700 hover:border-kat-primary hover:bg-kat-primary/5 hover:text-kat-primary shadow-sm"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" strokeWidth={3} />
                      <span className="truncate">{sug.label} · Đã thêm</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 opacity-70 shrink-0" strokeWidth={3} />
                      <span className="truncate">{sug.label}</span>
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
        <div className="rounded-[24px] bg-kat-surface p-6 md:p-8 border border-kat-border/60 flex flex-col items-center text-center animate-fadeIn shadow-soft max-w-xl mx-auto space-y-6">
          {/* Header Zone */}
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-3.5 ring-4 ring-kat-primary/5">
              <Luggage className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-[17px] font-bold text-kat-text">Chưa có món đồ nào trong hành lý</h3>
            <p className="mt-1 text-[13.5px] text-kat-muted max-w-xs">
              Thêm giấy tờ, quần áo, thiết bị hoặc thuốc men để chuyến đi sẵn sàng hơn.
            </p>
          </div>
          
          {/* Suggestion Zone */}
          {!isReadOnly && !allSuggestionsAdded && (
            <div className="w-full pt-5 border-t border-kat-border/50">
              <p className="text-[12px] font-bold text-kat-text/80 uppercase tracking-wider mb-3.5 flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-kat-accent-yellow" />
                Gợi ý nhanh
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {QUICK_SUGGESTIONS.map((sug) => {
                  const added = isAdded(sug.title);
                  return (
                    <button
                      key={sug.title}
                      disabled={added}
                      onClick={() => handleQuickAdd(sug.title, sug.category)}
                      className={`h-[38px] px-3.5 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 duration-200 ${
                        added
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-kat-border text-kat-text hover:border-kat-primary hover:bg-kat-primary/5 hover:text-kat-primary shadow-sm"
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 animate-fadeIn" strokeWidth={3} />
                          <span>{sug.label} · Đã thêm</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 text-kat-primary" strokeWidth={2.5} />
                          <span>{sug.label}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Column 1 */}
          <div className="space-y-6">
            {activeCategories
              .filter((_, idx) => idx % 2 === 0)
              .map((catName, idx) => {
                const catIdx = idx * 2;
                return renderCategoryCard(catName, catIdx);
              })}
          </div>
          {/* Column 2 */}
          <div className="space-y-6">
            {activeCategories
              .filter((_, idx) => idx % 2 !== 0)
              .map((catName, idx) => {
                const catIdx = idx * 2 + 1;
                return renderCategoryCard(catName, catIdx);
              })}
          </div>
        </div>
      )}



      {/* Responsive Modal Form (Centered on Desktop, Bottom Sheet on Mobile) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm motion-modal-overlay" 
            onClick={() => setIsFormOpen(false)} 
          />
          
          {/* Modal Container */}
          <div className="relative z-10 flex w-full flex-col max-h-[90vh] md:max-h-[calc(100vh-48px)] rounded-t-[24px] md:rounded-[28px] bg-white pb-safe shadow-floating md:mx-auto md:w-full md:max-w-[560px] overflow-hidden motion-sheet-dialog md:motion-modal-dialog">
            {/* Mobile Drag Handle */}
            <div className="flex shrink-0 h-1.5 w-12 mx-auto mt-3 mb-1 rounded-full bg-slate-200 md:hidden" />
            
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#E8E1D8]/60 px-6 py-4">
              <div>
                <h3 className="text-[19px] md:text-[20px] font-black text-kat-text">
                  {editingId ? "Sửa món hành lý" : "Thêm món hành lý"}
                </h3>
              </div>
              <button 
                className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-[#030D2E]/05 text-slate-500 hover:bg-[#030D2E]/10 transition-colors" 
                onClick={() => setIsFormOpen(false)}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              
              {/* Item Name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-slate-500" />
                  Tên món cần mang *
                </label>
                <input
                  className={`w-full rounded-[14px] border bg-[#FAF7F1]/60 px-4 h-[46px] text-[14px] font-semibold text-kat-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-kat-primary ${
                    showValidationError ? "border-red-500 ring-1 ring-red-500 focus:ring-red-500 motion-error-shake" : "border-kat-border focus:border-kat-primary"
                  }`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setShowValidationError(false);
                  }}
                  placeholder="VD: Sạc dự phòng"
                />
                {showValidationError && (
                  <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1 flex items-center gap-1 motion-error-enter">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Vui lòng nhập tên món cần mang.</span>
                  </p>
                )}
              </div>

              {/* Category Segment Select (Grid of chips) */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-kat-text block flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-slate-500" />
                  Nhóm hành lý
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const IconComponent = CATEGORY_ICONS[cat] || Package;
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex flex-col items-center justify-center min-h-[76px] p-2 rounded-[18px] border transition-all duration-200 active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-kat-primary/10 border-kat-primary/35 text-kat-text"
                            : "bg-kat-surface border-kat-border text-kat-text/70 hover:bg-[#FAF7F1] hover:border-kat-border/80"
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8.5 h-8.5 rounded-[12px] mb-1 transition-all ${
                          isSelected
                            ? "bg-kat-primary/20 text-kat-primary"
                            : "bg-[#030D2E]/05 text-slate-500"
                        }`}>
                           <IconComponent className="w-4.5 h-4.5" strokeWidth={2.2} />
                        </div>
                        <span className="text-[12px] font-bold tracking-tight">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between py-2 border-y border-[#E8E1D8]/60">
                <div>
                  <label className="text-[13px] font-bold text-kat-text">Số lượng</label>
                  <p className="text-[11.5px] text-kat-muted font-bold">Số lượng cần mang theo</p>
                </div>
                <div className="flex items-center gap-3.5 bg-[#FAF7F1] rounded-[16px] p-1 border border-kat-border/60">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white text-kat-text border border-kat-border/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                  <span className="text-[15px] font-black text-kat-text w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white text-kat-text border border-kat-border/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Assigned To */}
              <div className="space-y-1.5">
                {members.length === 0 ? (
                  <>
                    <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                      <UserRoundCheck className="h-4 w-4 text-slate-500" />
                      Người phụ trách
                    </label>
                    <div className="rounded-[16px] bg-[#FAF7F1] border border-kat-border/60 p-3 flex items-start gap-2.5">
                      <User className="h-4 w-4 text-kat-muted shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[12.5px] font-bold text-kat-text">Chưa có người đồng hành</h4>
                        <p className="text-[11.5px] text-kat-muted mt-0.5 font-bold">Thêm người đồng hành trong Không gian chuyến đi để phân công chuẩn bị hành lý.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <Select
                    label={
                      <span className="flex items-center gap-1.5">
                        <UserRoundCheck className="h-4 w-4 text-slate-500" />
                        Người phụ trách
                      </span>
                    }
                    value={assignedTo}
                    onChange={setAssignedTo}
                    options={members.map((m) => m.name)}
                    labels={members.reduce((acc, m) => ({ ...acc, [m.name]: `${m.name} (${m.role || "Người đồng hành"})` }), {} as Record<string, string>)}
                    placeholder="Chọn người đồng hành"
                  />
                )}
              </div>

              {/* Priority Segments */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-kat-text block flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-slate-500" />
                  Mức độ cần thiết
                </label>
                <div className="flex p-1 bg-[#FAF7F1] border border-kat-border/50 rounded-xl">
                  {(["normal", "important", "required"] as const).map((prio) => {
                    const isSelected = priority === prio;
                    const labels = { normal: "Thường", important: "Quan trọng", required: "Bắt buộc" };
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setPriority(prio)}
                        className={`flex-1 py-1.5 rounded-lg text-[12.5px] font-bold transition-all ${
                          isSelected
                            ? "bg-white text-kat-text shadow-sm border border-kat-border/30"
                            : "text-slate-500 hover:text-kat-text"
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
                  <StickyNote className="h-4 w-4 text-slate-500" />
                  Ghi chú
                </label>
                <textarea
                  className="w-full h-[72px] rounded-[14px] border border-kat-border bg-[#FAF7F1]/60 px-4 py-3 text-[14px] font-semibold text-kat-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-kat-primary resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Để trong balo nhỏ, nhớ sạc đầy..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="shrink-0 border-t border-slate-100 px-6 py-4 bg-[#FFFDF8] sticky bottom-0 flex gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveItem}
                className="flex-[2] h-[50px] inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#030D2E] text-white font-black hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
                disabled={!title.trim()}
              >
                <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
                {editingId ? "Lưu thông tin" : "Thêm vào hành lý"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile only) */}
      {!isReadOnly && (
        <button
          onClick={openAddForm}
          className="md:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-2xl border border-white/40 text-[#030D2E] shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          aria-label="Thêm món chuẩn bị"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDeleteItem}
        title="Xóa món chuẩn bị này?"
        itemName={itemToDelete?.title}
        description="Món chuẩn bị này sẽ bị xóa khỏi danh sách của chuyến đi. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa món"
      />

      {/* Toast Notification popup */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 motion-toast-enter">
          <div className="bg-[#030D2E] text-white px-5 py-3 rounded-2xl shadow-floating flex items-center gap-3 border border-[#E8E1D8]/20">
            <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-kat-primary/20 text-kat-primary">
              <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
            </div>
            <span className="text-[14px] font-bold tracking-wide text-sand">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
