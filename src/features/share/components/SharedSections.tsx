import React, { useState, useEffect } from 'react';
import { 
  WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, Plus, Pencil, Trash2, MoreVertical,
  ReceiptText, UserCheck, Tags, ChevronRight, Scale, Info, Check, X,
  FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, Sandwich, Package, BadgeCheck, UserRoundCheck, StickyNote, Type, Minus, User
} from 'lucide-react';
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan, Member } from '../../../db';
import { formatMoney, expenseCategories } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { BottomSheet, Input, Select } from '../../../components/ui';

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

const CATEGORIES = ["Giấy tờ", "Quần áo", "Đồ cá nhân", "Thiết bị điện tử", "Thuốc & y tế", "Tiền & ví", "Đồ ăn nhẹ", "Khác"] as const;
const CATEGORY_ICONS: Record<string, any> = {
  "Giấy tờ": FileCheck2,
  "Quần áo": Shirt,
  "Đồ cá nhân": BriefcaseBusiness,
  "Thiết bị điện tử": PlugZap,
  "Thuốc & y tế": Pill,
  "Tiền & ví": WalletCards,
  "Đồ ăn nhẹ": Sandwich,
  "Khác": Package
};


export function SharedExpensesSection({ 
  token, 
  mode, 
  expenses, 
  changeRequests = [],
  members = []
}: { 
  token: string; 
  mode: string; 
  expenses: Expense[]; 
  changeRequests?: any[];
  members?: Member[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const categoryOptions = React.useMemo(() => {
    const defaultCats = expenseCategories.filter(c => c !== "Khác");
    const uniqueUsedCats = Array.from(new Set(expenses.map(e => e.category)))
      .filter(c => !defaultCats.includes(c) && c !== "Khác" && c !== "Khác...");
    return [...defaultCats, ...uniqueUsedCats, "Khác..."];
  }, [expenses]);

  const [form, setForm] = useState<{ 
    description: string; 
    amount: string; 
    payer: string; 
    category: string; 
    customCategory: string; 
    splitType: "shared" | "personal" 
  }>({ 
    description: "", 
    amount: "", 
    payer: "", 
    category: categoryOptions[0] || "Di chuyển", 
    customCategory: "", 
    splitType: "shared" 
  });

  const [errors, setErrors] = useState<{ 
    amount?: string; 
    payer?: string; 
    customCategory?: string; 
  }>({});

  const [showAdvanced, setShowAdvanced] = useState(false);

  const isRequestEdit = mode === 'request_edit';

  useEffect(() => {
    if (isFormOpen) {
      setErrors({});
      setShowAdvanced(false);
      if (editingId) {
        const item = expenses.find(e => String(e.id) === editingId);
        if (item) {
          const isCustom = !categoryOptions.includes(item.category) || item.category === "Khác...";
          setForm({
            description: item.description,
            amount: String(item.amount),
            payer: item.payer || "",
            category: isCustom ? "Khác..." : item.category,
            customCategory: isCustom && item.category !== "Khác..." ? item.category : "",
            splitType: item.splitType ?? "shared",
          });
          if (item.splitType === "personal" || isCustom || item.category !== categoryOptions[0]) {
            setShowAdvanced(true);
          }
        }
      } else {
        setForm({ 
          description: "", 
          amount: "", 
          payer: members[0]?.name ?? "", 
          category: categoryOptions[0] || "Di chuyển", 
          customCategory: "", 
          splitType: "shared" 
        });
      }
    }
  }, [editingId, isFormOpen, members, categoryOptions, expenses]);

  // Merge pending change requests into expenses list for visual diffs
  const mergedExpenses = React.useMemo(() => {
    const list = expenses.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'expenses' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'expenses' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }
      if (pendingDelete) {
        return {
          ...item,
          isPendingDelete: true,
          changeRequestId: changeRequests.find(r => r.section === 'expenses' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'expenses' && r.action === 'create');
    pendingCreates.forEach(r => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [expenses, changeRequests]);

  function startAdd() { setEditingId(null); setIsFormOpen(true); }
  function startEdit(item: Expense) { setEditingId(String(item.id)); setIsFormOpen(true); }

  async function handleSave() {
    const newErrors: typeof errors = {};
    const amountVal = Number(form.amount);
    
    if (!form.amount.trim() || Number.isNaN(amountVal) || amountVal <= 0) {
      newErrors.amount = "Vui lòng nhập số tiền lớn hơn 0.";
    }

    let finalCategory = form.category;
    if (form.category === "Khác...") {
      const trimmedCustom = form.customCategory.trim();
      if (!trimmedCustom) {
        newErrors.customCategory = "Vui lòng nhập tên danh mục.";
      } else {
        finalCategory = trimmedCustom.slice(0, 30);
      }
    }

    if (form.splitType === "shared" && members.length > 0 && !form.payer) {
      newErrors.payer = "Vui lòng chọn người trả.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = { 
      description: form.description.trim() || ("" + finalCategory), 
      amount: amountVal, 
      payer: form.splitType === "personal" ? (form.payer || "") : form.payer, 
      category: finalCategory, 
      splitType: form.splitType
    };

    try {
      if (!editingId) {
        await submitChangeRequest(token, { section: 'expenses', action: 'create', after: payload });
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } else {
        const before = expenses.find(e => String(e.id) === editingId);
        await submitChangeRequest(token, { section: 'expenses', action: 'update', targetId: editingId, before: before as any, after: payload });
        setEditingId(null);
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) { alert('Lỗi khi gửi đề xuất: ' + e.message); }
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn muốn đề xuất xóa chi phí này?')) {
      const before = expenses.find(e => String(e.id) === id);
      try {
        await submitChangeRequest(token, { section: 'expenses', action: 'delete', targetId: id, before: before as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi khi gửi đề xuất: ' + e.message); }
    }
  }

  const isSaveDisabled = !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-amber-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Chi phí chuyến đi</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100/50 mt-1">
        {mergedExpenses.map((e, idx) => {
          const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;
          return (
            <div 
              key={e.id} 
              className={classNames(
                "flex justify-between items-center py-3 px-4 transition-all rounded-xl", 
                idx % 2 === 0 ? "bg-slate-50/40" : "bg-transparent",
                e.isPendingCreate || e.isPendingUpdate ? "bg-sky-50/40 border border-sky-100/50 my-1 py-3.5" : "",
                e.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
              )}
            >
              <div className="flex flex-wrap items-baseline gap-2 min-w-0 flex-1">
                <span className={classNames(
                  "text-[14.5px] font-semibold text-slate-700 break-words",
                  e.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                )}>
                  {e.description}
                </span>
                
                {e.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
                {e.isPendingCreate && (
                  <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất mới
                  </span>
                )}
                {e.isPendingUpdate && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất sửa
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={classNames(
                  "text-[14.5px] font-bold text-[#030D2E]",
                  e.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                )}>
                  {formatMoney(e.amount)}
                </span>
                {isRequestEdit && !isPending && (
                  <div className="relative shrink-0">
                    <button 
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveMenuId(activeMenuId === String(e.id) ? null : String(e.id));
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none"
                      title="Tùy chọn đề xuất"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                    
                    {activeMenuId === String(e.id) && (
                      <>
                        <div 
                          className="fixed inset-0 z-35" 
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <div className="absolute right-0 mt-1 z-40 w-32 rounded-xl bg-white border border-slate-200/80 shadow-floating py-1.5 animate-fadeIn">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              startEdit(e);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Đề xuất sửa
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDelete(String(e.id));
                            }}
                            className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Đề xuất xóa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isRequestEdit && (
        <button 
          onClick={startAdd} 
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-kat-primary border-2 border-dashed border-slate-200 hover:border-kat-primary/40 hover:bg-slate-50/50 rounded-xl transition-all"
          title="Đề xuất thêm"
        >
          <Plus className="h-4 w-4" /> Đề xuất thêm
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Đề xuất sửa chi phí" : "Đề xuất thêm chi phí"}
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Amount Box */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/50">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block text-center mb-1">Số tiền (đ)</span>
            <div className="flex items-center justify-center">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  setErrors({ ...errors, amount: "" });
                }}
                className="w-full text-center text-3xl font-black text-[#030D2E] bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
              />
            </div>
            {errors.amount && (
              <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 text-center">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <ReceiptText className="h-4 w-4 text-slate-500" />
                Khoản chi
              </span>
            } 
            value={form.description} 
            onChange={(description) => setForm({ ...form, description })} 
            placeholder="VD: Taxi, ăn trưa, vé tham quan..." 
          />

          {/* Payer Select */}
          {form.splitType === "shared" ? (
            members.length > 0 ? (
              <div>
                <Select
                  label={
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-slate-500" />
                      Người đã trả *
                    </span>
                  }
                  value={form.payer}
                  onChange={(payer) => {
                    setForm({ ...form, payer });
                    setErrors({ ...errors, payer: "" });
                  }}
                  options={["", ...members.map((member) => member.name)]}
                  placeholder="Chọn người trả"
                />
                {errors.payer && (
                  <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1">{errors.payer}</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FAF7F1] border border-kat-border/60 p-4 text-[13px] text-kat-muted font-semibold flex gap-2">
                <Info className="h-5 w-5 shrink-0 text-slate-500 mt-0.5" />
                <span>Chuyến đi chưa có người đồng hành. Chọn "Cá nhân tự trả" hoặc đề xuất thêm người đồng hành.</span>
              </div>
            )
          ) : (
            members.length > 0 && (
              <div>
                <Select
                  label={
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-slate-500" />
                      Khoản chi này của ai?
                    </span>
                  }
                  value={form.payer}
                  onChange={(payer) => setForm({ ...form, payer })}
                  options={["", ...members.map((member) => member.name)]}
                  placeholder="Chọn người đồng hành (không bắt buộc)"
                />
              </div>
            )
          )}

          {/* Advanced Accordion */}
          <div className="pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 hover:text-[#030D2E] transition-colors focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <Tags className="h-4 w-4 text-slate-400" />
                Chi tiết nâng cao
              </span>
              <ChevronRight className={classNames("h-4 w-4 transition-transform duration-200 text-slate-400", showAdvanced ? "rotate-90" : "")} />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 animate-fadeIn">
                {/* Category */}
                <div className="grid grid-cols-1 gap-4">
                  <Select 
                    label={
                      <span className="flex items-center gap-1.5">
                        <Tags className="h-4 w-4 text-slate-500" />
                        Hạng mục
                      </span>
                    } 
                    value={form.category} 
                    onChange={(category) => {
                      setForm({ ...form, category, customCategory: "" });
                      setErrors({ ...errors, customCategory: "" });
                    }} 
                    options={categoryOptions} 
                  />
                  
                  {form.category === "Khác..." && (
                    <div className="animate-fadeIn">
                      <Input 
                        label={
                          <span className="flex items-center gap-1.5">
                            <Tags className="h-4 w-4 text-slate-500" />
                            Tên hạng mục tự nhập *
                          </span>
                        } 
                        value={form.customCategory} 
                        onChange={(customCategory) => {
                          setForm({ ...form, customCategory: customCategory.slice(0, 30) });
                          setErrors({ ...errors, customCategory: "" });
                        }} 
                        placeholder="VD: Quà lưu niệm, Thuê xe máy" 
                      />
                      {errors.customCategory && (
                        <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1">{errors.customCategory}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Segmented Control for Cost Calculation */}
                <div className="space-y-2">
                  <span className="text-[13.5px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-slate-500" />
                    Cách chia khoản chi
                  </span>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, splitType: "shared", payer: members[0]?.name ?? "" });
                        setErrors({ ...errors, payer: "" });
                      }}
                      className={classNames(
                        "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                        form.splitType === "shared"
                          ? "bg-white text-[#030D2E] shadow-sm border border-slate-200/10"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Chi chung nhóm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, splitType: "personal", payer: "" });
                        setErrors({ ...errors, payer: "" });
                      }}
                      className={classNames(
                        "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                        form.splitType === "personal"
                          ? "bg-white text-[#030D2E] shadow-sm border border-slate-200/10"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Cá nhân tự trả
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#00BFB7] font-black text-[#030D2E] hover:brightness-105 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
          >
            Gửi đề xuất
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}


export function SharedChecklistSection({ 
  token, 
  mode, 
  checklist, 
  changeRequests = [],
  members = []
}: { 
  token: string; 
  mode: string; 
  checklist: ChecklistItem[]; 
  changeRequests?: any[];
  members?: Member[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    title: '',
    category: 'Giấy tờ',
    quantity: 1,
    assignedTo: '',
    priority: 'normal' as 'normal' | 'important' | 'required',
    note: ''
  });
  const [showValidationError, setShowValidationError] = useState(false);
  
  const isRequestEdit = mode === 'request_edit';

  useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      if (editingId) {
        const item = checklist.find(c => String(c.id) === editingId);
        if (item) {
          setForm({
            title: item.title,
            category: item.category || 'Khác',
            quantity: item.quantity || 1,
            assignedTo: item.assignedTo || '',
            priority: item.priority || 'normal',
            note: item.note || ''
          });
        }
      } else {
        setForm({
          title: '',
          category: 'Giấy tờ',
          quantity: 1,
          assignedTo: '',
          priority: 'normal',
          note: ''
        });
      }
    }
  }, [editingId, isFormOpen, checklist]);

  function startAdd() { setEditingId(null); setIsFormOpen(true); }
  function startEdit(item: ChecklistItem) { setEditingId(String(item.id)); setIsFormOpen(true); }

  // Merge pending change requests into checklist for visual diffs
  const mergedChecklist = React.useMemo(() => {
    const list = checklist.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'checklist' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }
      if (pendingDelete) {
        return {
          ...item,
          isPendingDelete: true,
          changeRequestId: changeRequests.find(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'checklist' && r.action === 'create');
    pendingCreates.forEach(r => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [checklist, changeRequests]);

  async function handleToggle(item: ChecklistItem) {
    if (!isRequestEdit) return;
    try {
      await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: String(item.id), before: item as any, after: { completed: !item.completed } });
      alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }
    
    const payload = {
      title: form.title.trim(),
      category: form.category,
      quantity: form.quantity,
      assignedTo: form.assignedTo || undefined,
      priority: form.priority,
      note: form.note.trim() || undefined,
      section: 'Before Trip' as const,
      completed: false
    };

    try {
      if (!editingId) {
        await submitChangeRequest(token, { section: 'checklist', action: 'create', after: payload });
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } else {
        const before = checklist.find(c => String(c.id) === editingId);
        await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: editingId, before: before as any, after: payload });
        setEditingId(null);
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn muốn đề xuất xóa mục này?')) {
      const before = checklist.find(c => String(c.id) === id);
      try {
        await submitChangeRequest(token, { section: 'checklist', action: 'delete', targetId: id, before: before as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-purple-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Danh sách chuẩn bị</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100/50 mt-1">
        {mergedChecklist.map((c, idx) => {
          const isPending = c.isPendingCreate || c.isPendingUpdate || c.isPendingDelete;
          return (
            <div 
              key={c.id} 
              className={classNames(
                "flex justify-between items-center py-3 px-4 transition-all rounded-xl", 
                idx % 2 === 0 ? "bg-slate-50/40" : "bg-transparent",
                c.isPendingCreate || c.isPendingUpdate ? "bg-sky-50/40 border border-sky-100/50 my-1 py-3.5" : "",
                c.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
              )}
            >
              <label className="flex items-start gap-3 cursor-pointer group flex-1 min-w-0">
                <input 
                  type="checkbox" 
                  checked={c.completed} 
                  onChange={() => handleToggle(c)} 
                  disabled={!isRequestEdit || isPending} 
                  className="w-5 h-5 rounded-md border-slate-300 text-kat-primary mt-0.5 focus:ring-kat-primary" 
                />
                <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                  <span className={classNames(
                    "text-[14.5px] font-semibold break-words", 
                    c.completed ? 'text-slate-400 line-through' : 'text-slate-700',
                    c.isPendingDelete ? 'line-through text-slate-400 opacity-60' : ''
                  )}>
                    {c.title}
                  </span>
                  {c.isPendingDelete && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất xóa
                    </span>
                  )}
                  {c.isPendingCreate && (
                    <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất mới
                    </span>
                  )}
                  {c.isPendingUpdate && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất sửa
                    </span>
                  )}
                </div>
              </label>
              {isRequestEdit && !isPending && (
                <div className="relative shrink-0 ml-2">
                  <button 
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setActiveMenuId(activeMenuId === String(c.id) ? null : String(c.id));
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none"
                    title="Tùy chọn đề xuất"
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>
                  
                  {activeMenuId === String(c.id) && (
                    <>
                      <div 
                        className="fixed inset-0 z-35" 
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setActiveMenuId(null);
                        }}
                      />
                      <div className="absolute right-0 mt-1 z-40 w-32 rounded-xl bg-white border border-slate-200/80 shadow-floating py-1.5 animate-fadeIn">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            startEdit(c);
                          }}
                          className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Đề xuất sửa
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDelete(String(c.id));
                          }}
                          className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Đề xuất xóa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isRequestEdit && (
        <button 
          onClick={startAdd} 
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-kat-primary border-2 border-dashed border-slate-200 hover:border-kat-primary/40 hover:bg-slate-50/50 rounded-xl transition-all"
          title="Đề xuất thêm"
        >
          <Plus className="h-4 w-4" /> Đề xuất thêm
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Đề xuất sửa chuẩn bị" : "Đề xuất thêm chuẩn bị"}
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
              <Type className="h-4 w-4 text-slate-500" />
              Tên món cần mang *
            </label>
            <input
              className={`w-full rounded-[14px] border bg-slate-50 px-4 h-[50px] text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7] placeholder-slate-400 ${
                showValidationError ? "border-red-500 ring-2 ring-red-500" : "border-slate-200 focus:border-[#00BFB7]"
              }`}
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (e.target.value.trim()) setShowValidationError(false);
              }}
              placeholder="VD: Sạc dự phòng"
            />
            {showValidationError && (
              <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1 flex items-center gap-1">
                <span>Vui lòng nhập tên món cần mang.</span>
              </p>
            )}
          </div>

          {/* Category Selector (Grid of chips) */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-500" />
              Nhóm hành lý
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat] || Package;
                const isSelected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`flex flex-col items-center justify-center min-h-[76px] p-2 rounded-[18px] border transition-all duration-200 active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-[#00BFB7]/10 border-[#00BFB7]/35 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8.5 h-8.5 rounded-[12px] mb-1 transition-all ${
                      isSelected
                        ? "bg-[#00BFB7]/20 text-[#00BFB7]"
                        : "bg-slate-100 text-slate-500"
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
          <div className="flex items-center justify-between py-2 border-y border-slate-100">
            <div>
              <label className="text-[13px] font-bold text-slate-700">Số lượng</label>
              <p className="text-[11.5px] text-slate-500 font-bold">Số lượng cần mang theo</p>
            </div>
            <div className="flex items-center gap-3.5 bg-slate-50 rounded-[16px] p-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white text-slate-800 border border-slate-200/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
              <span className="text-[15px] font-black text-slate-800 w-8 text-center">{form.quantity}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-white text-slate-800 border border-slate-200/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
              <UserRoundCheck className="h-4 w-4 text-slate-500" />
              Người phụ trách
            </label>
            {members.length === 0 ? (
              <div className="rounded-[16px] bg-[#FAF7F1] border border-kat-border/60 p-3 flex items-start gap-2.5">
                <User className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[12.5px] font-bold text-slate-800">Chưa có người đồng hành</h4>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 font-bold">Người đồng hành chưa được chia sẻ để phân công hành lý.</p>
                </div>
              </div>
            ) : (
              <Select
                label=""
                value={form.assignedTo}
                onChange={(assignedTo) => setForm({ ...form, assignedTo })}
                options={["", ...members.map(m => m.name)]}
                placeholder="Chọn người đồng hành"
              />
            )}
          </div>

          {/* Priority Segments */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 block flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-slate-500" />
              Mức độ cần thiết
            </label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {(["normal", "important", "required"] as const).map((prio) => {
                const isSelected = form.priority === prio;
                const labels = { normal: "Thường", important: "Quan trọng", required: "Bắt buộc" };
                return (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setForm({ ...form, priority: prio })}
                    className={`flex-1 py-1.5 rounded-lg text-[12.5px] font-bold transition-all ${
                      isSelected
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200/30"
                        : "text-slate-500 hover:text-slate-800"
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
            <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
              <StickyNote className="h-4 w-4 text-slate-500" />
              Ghi chú
            </label>
            <textarea
              className="w-full h-[72px] rounded-[14px] border-0 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7] resize-none placeholder-slate-400"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="VD: Để trong balo nhỏ, nhớ sạc đầy..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#00BFB7] font-black text-[#030D2E] hover:brightness-105 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
          >
            Gửi đề xuất
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}


export function SharedJournalsSection({ 
  token, 
  mode, 
  journals, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  journals: JournalEntry[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedJournals = React.useMemo(() => {
    return journals.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [journals, changeRequests]);

  async function handleDelete(j: JournalEntry) {
    if (confirm('Bạn muốn đề xuất xóa nhật ký này?')) {
      try {
        await submitChangeRequest(token, { section: 'journals', action: 'delete', targetId: String(j.id), before: j as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <BookOpenText className="h-5 w-5 text-sky-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Nhật ký chuyến đi</h3>
      </div>
      <div className="space-y-4">
        {mergedJournals.map(j => (
          <div 
            key={j.id} 
            className={classNames(
              "rounded-xl p-4 border transition-all", 
              j.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-slate-50 border-slate-105"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className={classNames(
                  "text-[15px] font-bold text-slate-800",
                  j.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  {j.title}
                </h4>
                {j.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !j.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(j)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            <p className={classNames(
              "mt-2 text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap",
              j.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
            )}>
              {j.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedBackupPlansSection({ 
  token, 
  mode, 
  backupPlans, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  backupPlans: BackupPlan[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedBackupPlans = React.useMemo(() => {
    return backupPlans.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'backupPlans' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [backupPlans, changeRequests]);

  async function handleDelete(b: BackupPlan) {
    if (confirm('Bạn muốn đề xuất xóa phương án này?')) {
      try {
        await submitChangeRequest(token, { section: 'backupPlans', action: 'delete', targetId: String(b.id), before: b as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Phương án dự phòng</h3>
      </div>
      <div className="space-y-4">
        {mergedBackupPlans.map(b => (
          <div 
            key={b.id} 
            className={classNames(
              "rounded-xl p-4 border transition-all",
              b.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-orange-50/50 border-orange-100"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className={classNames(
                  "text-[14px] font-bold text-orange-800",
                  b.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  Tình huống: {b.title}
                </h4>
                {b.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !b.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(b)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            {b.reason && (
              <p className={classNames(
                "mt-1 text-[13.5px] text-orange-700/80 font-medium whitespace-pre-wrap",
                b.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
              )}>
                Giải pháp: {b.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedDocumentsSection({ 
  token, 
  mode, 
  documents, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  documents: TravelDocument[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedDocuments = React.useMemo(() => {
    return documents.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'travelDocuments' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [documents, changeRequests]);

  async function handleDelete(d: TravelDocument) {
    if (confirm('Bạn muốn đề xuất xóa tài liệu này?')) {
      try {
        await submitChangeRequest(token, { section: 'travelDocuments', action: 'delete', targetId: String(d.id), before: d as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <FileText className="h-5 w-5 text-rose-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Giấy tờ & đặt chỗ</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mergedDocuments.map(d => (
          <div 
            key={d.id} 
            className={classNames(
              "flex flex-col gap-1 rounded-xl p-3 border transition-all",
              d.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-slate-50 border-slate-200"
            )}
          >
             <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={classNames(
                  "text-[14px] font-bold text-slate-700",
                  d.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  {d.title}
                </span>
                {d.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !d.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(d)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            <span className={classNames(
              "text-[13px] text-slate-500",
              d.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
            )}>
              {d.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
