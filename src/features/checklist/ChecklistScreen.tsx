import React, { useState } from "react";
import { Check, Plus, Trash2, Luggage, Edit2, AlertCircle, User, X, Minus, Sparkles, FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, WalletCards, Sandwich, Package, BadgeCheck, CheckCircle2, ClipboardList, UserRoundCheck, StickyNote, Type } from "lucide-react";
import { ChecklistItem, db } from "../../db";
import { getChecklistStats } from "../../utils/helpers";
import { useLiveQuery } from "dexie-react-hooks";
import { TypedDeleteConfirmModal } from "../../components/ui";

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

export function ChecklistScreen({ checklist, tripId }: { checklist: ChecklistItem[]; tripId: number }) {
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

  // Determine status description text
  let statusText = "Chưa có món cần chuẩn bị.";
  if (checklist.length > 0) {
    if (stats.percent === 100) {
      statusText = "Tuyệt vời! Hành lý đã sẵn sàng.";
    } else {
      statusText = `Còn ${stats.total - stats.completed} món cần chuẩn bị.`;
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-2 sm:px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 pb-0 md:pb-8">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-black tracking-tight text-kat-text">Chuẩn bị hành lý</h2>
          <p className="mt-1 text-[15px] font-bold text-kat-muted">Chuẩn bị đủ những món cần mang theo cho chuyến đi.</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex h-[48px] items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 text-kat-text px-5 text-[14px] font-bold shadow-sm hover:bg-kat-primary/20 active:scale-98 transition-all duration-200 sm:self-center shrink-0"
        >
          <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
          Thêm món chuẩn bị
        </button>
      </div>

      {/* Smart Overview Card */}
      <section className="bg-kat-surface rounded-[28px] p-6 shadow-soft border border-kat-border relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          
          {/* Left: Progress Circle */}
          <div className="flex items-center gap-5 shrink-0 self-start md:self-center">
            <div className="relative inline-flex items-center justify-center" style={{ width: 96, height: 96 }}>
              <svg className="absolute -rotate-90 transform" width={96} height={96}>
                <circle
                  className="text-slate-100"
                  strokeWidth={9}
                  stroke="currentColor"
                  fill="transparent"
                  r={38}
                  cx={48}
                  cy={48}
                />
                <circle
                  className="text-kat-primary transition-all duration-1000 ease-out"
                  strokeWidth={9}
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 - (stats.percent / 100) * 238.76}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={38}
                  cx={48}
                  cy={48}
                />
              </svg>
              <span className="text-[20px] font-black text-kat-text">{stats.percent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-kat-primary shrink-0" />
              <div>
                <p className="text-[15px] font-black text-kat-text">Tiến độ chuẩn bị</p>
                <p className="text-[12px] font-bold text-kat-muted uppercase tracking-wider mt-0.5">Đã xong</p>
              </div>
            </div>
          </div>

          {/* Middle: Stats grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 max-w-sm w-full md:border-l md:border-r border-kat-border/60 md:px-8">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-kat-muted uppercase tracking-wider">Đã xếp</p>
                <p className="text-[22px] font-black text-kat-text mt-0.5">{stats.completed} / {stats.total} món</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ClipboardList className="h-5 w-5 text-[#FF6B6B] shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-kat-muted uppercase tracking-wider">Còn cần chuẩn bị</p>
                <p className="text-[22px] font-black text-kat-text mt-0.5">Còn {stats.total - stats.completed} món</p>
              </div>
            </div>
          </div>

          {/* Right: State Text & CTA */}
          <div className="flex flex-col items-center md:items-end justify-center shrink-0 w-full md:w-auto">
            <div className="text-center md:text-right">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-extrabold border ${
                stats.total === 0 
                  ? "bg-slate-100 text-slate-500 border-slate-200" 
                  : stats.percent === 100 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-kat-primary/10 text-kat-primary border-kat-primary/20"
              }`}>
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </section>

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
          
          {/* Action Zone */}
          <div className="flex justify-center">
            <button 
              onClick={openAddForm}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 text-kat-text px-6 text-[14px] font-bold hover:bg-kat-primary/20 active:scale-98 transition-all duration-200 shadow-sm"
            >
              <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
              Thêm món đầu tiên
            </button>
          </div>
          
          {/* Suggestion Zone */}
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
        </div>
      ) : (
        /* Checklist grouped by Categories (Grid on desktop, List on mobile) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {activeCategories.map((catName, catIdx) => {
            const items = groupedItems[catName];
            const catDone = items.filter(i => i.completed).length;
            const catTotal = items.length;

            return (
              <div 
                key={catName} 
                className={`bg-kat-surface rounded-[24px] border border-kat-border p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200 motion-card-enter motion-delay-${Math.min(catIdx + 1, 5)}`}
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
                  {items.map((item) => {
                    return (
                      <div 
                        key={item.id} 
                        className={`group flex items-start gap-3.5 p-3 rounded-2xl border transition-all duration-200 ${
                          item.completed 
                            ? "bg-slate-50/50 border-slate-200/50 opacity-65" 
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Checkbox button */}
                        <button
                          onClick={() => toggleComplete(item)}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 motion-press ${
                            item.completed
                              ? "bg-kat-primary/20 text-kat-primary border-transparent shadow-sm"
                              : "bg-slate-50 border border-slate-200/80 text-transparent hover:text-slate-300 hover:border-kat-primary/50 hover:bg-slate-100"
                          }`}
                          aria-label="Đánh dấu checklist"
                        >
                          <Check className="h-5.5 w-5.5 text-current" strokeWidth={3.5} />
                        </button>

                        {/* Title and details */}
                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className={`text-[15px] font-bold tracking-wide break-words transition-all ${
                              item.completed ? "text-slate-400 line-through font-medium" : "text-kat-text"
                            }`}>
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
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border ${
                                item.priority === "required" 
                                  ? "bg-rose-50 text-rose-700 border-rose-100" 
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {item.priority === "required" ? "Bắt buộc" : "Quan trọng"}
                              </span>
                            )}
                          </div>

                          {/* Notes and Assigned To */}
                          {(item.note || item.assignedTo) && (
                            <div className="mt-1 space-y-0.5 text-[12.5px] text-slate-500 font-semibold">
                              {item.note && <p className="italic text-slate-400 line-clamp-2">"{item.note}"</p>}
                              {item.assignedTo && (
                                <p className="flex items-center gap-1 text-[11px] text-kat-muted">
                                  <User className="h-3 w-3" />
                                  Chuẩn bị: <span className="text-[#030D2E]">{item.assignedTo}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditForm(item)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 hover:bg-[#00A59E]/10 hover:text-kat-primary hover:border-[#00A59E]/30 transition-all motion-press"
                            title="Sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all motion-press"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Suggestions Section */}
      {!isEmpty && (
        <section className="bg-kat-surface rounded-[24px] p-6 border border-kat-border/60 shadow-soft">
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-kat-text flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-kat-accent-yellow" />
              Gợi ý nhanh cho hành lý
            </h3>
            <p className="text-[12.5px] text-kat-muted font-semibold mt-0.5">Chọn nhanh những món thường cần trong chuyến đi.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_SUGGESTIONS.map((sug) => {
              const added = isAdded(sug.title);
              return (
                <button
                  key={sug.title}
                  disabled={added}
                  onClick={() => handleQuickAdd(sug.title, sug.category)}
                  className={`h-[38px] px-3.5 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 transition-all motion-press duration-200 ${
                    added
                      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-kat-border text-kat-text hover:border-kat-primary hover:bg-kat-primary/5 hover:text-kat-primary shadow-sm"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 motion-fadeIn" strokeWidth={3} />
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
        </section>
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
                <label className="text-[13px] font-bold text-kat-text flex items-center gap-1.5">
                  <UserRoundCheck className="h-4 w-4 text-slate-500" />
                  Người phụ trách
                </label>
                {members.length === 0 ? (
                  <div className="rounded-[16px] bg-[#FAF7F1] border border-kat-border/60 p-3 flex items-start gap-2.5">
                    <User className="h-4 w-4 text-kat-muted shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[12.5px] font-bold text-kat-text">Chưa có người đồng hành</h4>
                      <p className="text-[11.5px] text-kat-muted mt-0.5 font-bold">Thêm người đồng hành trong Không gian chuyến đi để phân công chuẩn bị hành lý.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full rounded-[14px] border border-kat-border bg-[#FAF7F1]/60 px-4 h-[46px] text-[14.5px] font-semibold text-kat-text outline-none transition-all focus:bg-white focus:ring-2 focus:ring-kat-primary appearance-none"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    >
                      <option value="">Chọn người đồng hành</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name} ({member.role || "Người đồng hành"})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-kat-muted text-[10px]">
                      ▼
                    </div>
                  </div>
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
                className="flex-[2] h-[50px] inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#00BFB7] text-[#030D2E] font-black hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
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
      {!isEmpty && (
        <button
          onClick={openAddForm}
          className="md:hidden fixed bottom-[96px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-kat-primary/10 border border-kat-primary/30 text-kat-primary shadow-floating motion-press hover:scale-105 duration-200"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          aria-label="Thêm món chuẩn bị"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <TypedDeleteConfirmModal
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
        <div className="fixed bottom-24 left-1/2 z-50 motion-toast-enter">
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
