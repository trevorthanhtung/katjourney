import React, { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, WalletCards, Check, X, Sparkles, Info } from "lucide-react";
import { db, Expense, Member } from "../../db";
import { formatMoney, getSettlementSuggestions, sumBy, expenseCategories } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, ScreenTitle, Select, classNames } from "../../components/ui";

function CategoryBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100/80">
      <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function BreakdownSection({ 
  items, 
  total, 
  emptyText 
}: { 
  items: Record<string, number>; 
  total: number; 
  emptyText: string 
}) {
  const rows = Object.entries(items)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-[14px] font-semibold text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(([label, amount], index) => {
        const percent = total ? Math.round((amount / total) * 100) : 0;
        const colorClass = index === 0 
          ? "bg-kat-primary" 
          : index === 1 
            ? "bg-kat-primary/70" 
            : index === 2 
              ? "bg-kat-primary/40" 
              : "bg-slate-300";
              
        return (
          <div key={label} className="group">
            <div className="flex items-center justify-between text-[14px] font-bold">
              <p className="text-slate-700 group-hover:text-[#030D2E] transition-colors">{label}</p>
              <p className="text-[#030D2E]">{formatMoney(amount)}</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <CategoryBar percent={percent} colorClass={colorClass} />
              <span className="w-10 text-right text-[12px] font-black text-slate-400 group-hover:text-slate-600 transition-colors">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettlementCard({ 
  members, 
  expenses, 
  settlements 
}: { 
  members: Member[]; 
  expenses: Expense[]; 
  settlements: Array<{ from: string; to: string; amount: number }> 
}) {
  let emptyText = "Mọi người đã cân bằng, không ai nợ ai.";
  if (!members.length) {
    emptyText = "Thêm thành viên để dùng tính năng chia tiền.";
  } else if (!expenses.length) {
    emptyText = "Chưa có khoản chi chung để chia tiền.";
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <h3 className="text-[16px] font-extrabold text-[#030D2E]">Ai trả cho ai?</h3>
      </div>
      {settlements.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {settlements.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-2xl bg-kat-primary/5 border border-kat-primary/10 p-4 transition-all hover:bg-kat-primary/10">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#030D2E]">
                <span>{item.from}</span>
                <span className="text-slate-400 font-normal">&rarr;</span>
                <span>{item.to}</span>
              </div>
              <span className="font-black text-sunset-600 text-[15px]">{formatMoney(item.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-[#FAF7F1]/30">
          <p className="text-[14px] font-semibold text-slate-500">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

function ExpenseCard({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: Expense; 
  onEdit: () => void; 
  onDelete: () => void 
}) {
  const isPersonal = item.splitType === "personal";
  
  return (
    <article className="flex items-center justify-between gap-4 rounded-3xl bg-[#FFFDF8] p-5 shadow-sm border border-[#E8E1D8] transition-all duration-300 hover:shadow-md hover:border-slate-300">
      <div className="min-w-0 flex-1">
        {/* Category & Badge */}
        <div className="flex items-center flex-wrap gap-2 text-[12px] font-bold text-slate-400">
          <span className="uppercase tracking-wider text-slate-500">{item.category}</span>
          
          <span className={classNames(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
            isPersonal 
              ? "bg-slate-100 text-slate-600 border-slate-200" 
              : "bg-kat-primary/10 text-kat-primary border-kat-primary/20"
          )}>
            {isPersonal ? "Tự trả riêng" : "Chi chung nhóm"}
          </span>
        </div>

        {/* Description */}
        <h4 className="mt-1.5 truncate text-[16px] font-extrabold text-[#030D2E]">
          {item.description || "Khoản chi không tên"}
        </h4>

        {/* Paid by / Owned by info */}
        {isPersonal ? (
          item.payer && (
            <p className="mt-1 text-[13.5px] font-semibold text-slate-500">
              Cá nhân: <span className="text-[#030D2E]">{item.payer}</span>
            </p>
          )
        ) : (
          <p className="mt-1 text-[13.5px] font-semibold text-slate-500">
            Người trả: <span className="text-[#030D2E]">{item.payer || "Chưa rõ"}</span>
          </p>
        )}
      </div>

      {/* Amount and Actions */}
      <div className="flex flex-col items-end gap-2.5 shrink-0 pl-2">
        <p className="font-black text-[#030D2E] text-[16px] md:text-[18px]">
          {formatMoney(item.amount)}
        </p>
        
        <div className="flex gap-1">
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors" 
            onClick={onEdit}
            title="Chỉnh sửa"
          >
            <Edit3 className="h-4.5 w-4.5" />
          </button>
          <button 
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" 
            onClick={onDelete}
            title="Xóa"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ExpenseForm({ 
  tripId, 
  members, 
  expenses, 
  editing, 
  isOpen, 
  onClose,
  onSaved 
}: { 
  tripId: number; 
  members: Member[]; 
  expenses: Expense[]; 
  editing: Expense | null; 
  isOpen: boolean; 
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
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
    category: categoryOptions[0], 
    customCategory: "", 
    splitType: "shared" 
  });

  const [errors, setErrors] = useState<{ 
    amount?: string; 
    payer?: string; 
    customCategory?: string; 
  }>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editing) {
        const isCustom = !categoryOptions.includes(editing.category) || editing.category === "Khác...";
        setForm({
          description: editing.description,
          amount: String(editing.amount),
          payer: editing.payer || "",
          category: isCustom ? "Khác..." : editing.category,
          customCategory: isCustom && editing.category !== "Khác..." ? editing.category : "",
          splitType: editing.splitType ?? "shared",
        });
      } else {
        setForm({ 
          description: "", 
          amount: "", 
          payer: members[0]?.name ?? "", 
          category: categoryOptions[0], 
          customCategory: "", 
          splitType: "shared" 
        });
      }
    }
  }, [editing, isOpen, members, categoryOptions]);

  async function save() {
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
      description: form.description.trim() || `${finalCategory}`, 
      amount: amountVal, 
      payer: form.splitType === "personal" ? (form.payer || "") : form.payer, 
      category: finalCategory, 
      splitType: form.splitType,
      tripId 
    };

    if (editing?.id) {
      await db.expenses.update(editing.id, payload);
      onSaved("Đã cập nhật khoản chi");
      onClose();
    } else {
      await db.expenses.add(payload);
      onSaved("Đã thêm khoản chi");
      onClose();
    }
  }

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa khoản chi" : "Thêm khoản chi"}
    >
      <div className="space-y-5">
        {/* Amount */}
        <div>
          <Input 
            label="Số tiền *" 
            type="number" 
            value={form.amount} 
            onChange={(amount) => {
              setForm({ ...form, amount });
              setErrors({ ...errors, amount: "" });
            }} 
            placeholder="VD: 500000" 
          />
          {errors.amount && (
            <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1">{errors.amount}</p>
          )}
        </div>

        {/* Description */}
        <Input 
          label="Mô tả" 
          value={form.description} 
          onChange={(description) => setForm({ ...form, description })} 
          placeholder="VD: Taxi, ăn trưa, vé tham quan..." 
        />

        {/* Category */}
        <div className="grid grid-cols-1 gap-4">
          <Select 
            label="Danh mục" 
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
                label="Tên danh mục tự nhập *" 
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
          <span className="text-sm font-semibold text-slate-600">Cách tính chi phí</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setForm({ ...form, splitType: "shared", payer: members[0]?.name ?? "" });
                setErrors({ ...errors, payer: "" });
              }}
              className={classNames(
                "flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all active:scale-95",
                form.splitType === "shared"
                  ? "border-kat-primary bg-kat-primary/5 text-kat-text"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500"
              )}
            >
              <span className="text-[14px] font-extrabold">Chi chung nhóm</span>
              <span className="text-[11px] opacity-80 leading-snug">Một người trả trước, cả nhóm chia lại.</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({ ...form, splitType: "personal", payer: "" });
                setErrors({ ...errors, payer: "" });
              }}
              className={classNames(
                "flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all active:scale-95",
                form.splitType === "personal"
                  ? "border-kat-primary bg-kat-primary/5 text-kat-text"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500"
              )}
            >
              <span className="text-[14px] font-extrabold">Tự trả riêng</span>
              <span className="text-[11px] opacity-80 leading-snug">Khoản cá nhân, không chia tiền.</span>
            </button>
          </div>
        </div>

        {/* Split Details Conditional Rendering */}
        {form.splitType === "shared" ? (
          members.length > 0 ? (
            <div>
              <Select
                label="Người trả *"
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
              <p className="text-[12.5px] text-slate-400 mt-1.5 pl-1">Người đã trả trước cho nhóm.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13px] text-amber-800 font-medium flex gap-2">
              <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <span>Chuyến đi chưa có thành viên. Hãy thêm thành viên trong Cài đặt để hệ thống tự động chia công nợ nhóm.</span>
            </div>
          )
        ) : (
          members.length > 0 && (
            <div>
              <Select
                label="Khoản này của ai?"
                value={form.payer}
                onChange={(payer) => setForm({ ...form, payer })}
                options={["", ...members.map((member) => member.name)]}
                placeholder="Chọn thành viên (không bắt buộc)"
              />
              <p className="text-[12.5px] text-slate-400 mt-1.5 pl-1">Dùng để thống kê chi tiêu cá nhân, không tính vào nợ nhóm.</p>
            </div>
          )
        )}

        {/* Actions */}
        <div className="pt-2">
          <FormActions 
            onSave={save} 
            saveLabel={editing ? "Lưu thay đổi" : "Thêm khoản chi"} 
            onCancel={onClose}
          />
        </div>
      </div>
    </BottomSheet>
  );
}

export function ExpensesScreen({
  expenses,
  members,
  totalExpense,
  perPerson,
  tripId
}: {
  expenses: Expense[];
  members: Member[];
  totalExpense: number;
  perPerson: number;
  tripId: number;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const byCategory = sumBy(expenses, (item) => item.category, (item) => Number(item.amount || 0));
  const paidByMember = {
    ...Object.fromEntries(members.map((member) => [member.name, 0])),
    ...sumBy(expenses, (item) => item.payer, (item) => (item.splitType !== "personal" ? Number(item.amount || 0) : 0))
  };
  
  const sharedExpenses = expenses.filter(e => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPersonalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) - totalSharedExpense;
  const settlements = getSettlementSuggestions(members, sharedExpenses);

  function openNewForm() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: Expense) {
    setEditing(item);
    setIsFormOpen(true);
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khoản chi này không?")) {
      await db.expenses.delete(id);
      showToast("Đã xóa khoản chi");
    }
  };

  const isEmpty = expenses.length === 0;

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      <div className="space-y-6 md:space-y-8 pb-8">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Chi phí</h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500">Theo dõi chi tiêu rõ ràng để chuyến đi nhẹ đầu hơn.</p>
          </div>
          <div>
            <button
              onClick={openNewForm}
              className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-5 text-[14px] font-bold text-kat-text shadow-sm hover:bg-kat-primary/20 active:scale-98 transition-all duration-200 h-[48px]"
            >
              <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
              Thêm khoản chi
            </button>
          </div>
        </div>
        
        {/* Total Expense Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border-t-4 border-t-[#030D2E] border-x border-b border-[#E8E1D8] p-6 md:p-8 text-[#030D2E] shadow-soft">
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-5">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Tổng chi tiêu chuyến đi</p>
                <p className="mt-1 break-words text-[36px] md:text-[44px] font-black leading-none tracking-tight text-[#030D2E]">{formatMoney(totalExpense)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Chi chung nhóm</p>
                  <p className="text-[18px] font-black text-[#00AFA8] mt-0.5">{formatMoney(totalSharedExpense)}</p>
                </div>
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Tự trả riêng</p>
                  <p className="text-[18px] font-black text-[#030D2E] mt-0.5">{formatMoney(totalPersonalExpense)}</p>
                </div>
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Trung bình / người</p>
                  {members.length > 0 ? (
                    <p className="text-[18px] font-black text-[#030D2E] mt-0.5">{formatMoney(perPerson)}</p>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 mt-1 inline-block">Chưa có thành viên</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex lg:flex-col items-center justify-end w-full lg:w-auto">
              <button 
                onClick={openNewForm}
                className="flex w-full lg:w-auto items-center justify-center gap-2 rounded-2xl bg-kat-primary hover:bg-kat-primary-usable text-[#030D2E] px-6 py-3 text-[14px] font-bold shadow-sm active:scale-[0.98] transition-all duration-200 h-[48px]"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
                Thêm khoản chi
              </button>
            </div>
          </div>
        </section>

        {!isEmpty && (
          <>
            {/* Breakdown Grid */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-base font-extrabold text-[#030D2E]">Chi tiêu theo mục</h3>
                <BreakdownSection items={byCategory} total={totalExpense} emptyText="Chưa có danh mục chi tiêu." />
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-base font-extrabold text-[#030D2E]">Chi tiêu theo người</h3>
                {members.length > 0 ? (
                  <BreakdownSection items={paidByMember} total={totalSharedExpense} emptyText="Thêm thành viên để thống kê." />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-[14px] font-semibold text-slate-500">Chưa có thành viên. Thêm thành viên để xem chi tiêu theo từng người.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Settlements */}
            <SettlementCard members={members} expenses={expenses} settlements={settlements} />
          </>
        )}

        {/* Expense List */}
        <section className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#030D2E]">Tất cả chi phí</h3>
          <div className={isEmpty ? "" : "grid gap-4 md:grid-cols-2"}>
            {isEmpty ? (
              <div className="rounded-[24px] bg-kat-surface p-8 border border-kat-border/60 shadow-soft flex flex-col items-center text-center animate-fadeIn max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                  <WalletCards className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-[17px] font-bold text-kat-text mb-1.5">Chưa có khoản chi nào</h3>
                <p className="text-[13.5px] font-medium text-kat-muted mb-6 max-w-xs">
                  Ghi lại chi phí ăn uống, di chuyển, vé tham quan để hệ thống tự động chia tiền sau chuyến đi.
                </p>
                <button 
                  onClick={openNewForm}
                  className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/10 px-5 text-[13.5px] font-bold text-kat-primary hover:bg-kat-primary/15 transition-all duration-200 active:scale-98 shadow-sm"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Thêm khoản chi
                </button>
              </div>
            ) : (
              expenses.map((item) => (
                <ExpenseCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditForm(item)}
                  onDelete={() => handleDelete(item.id!)}
                />
              ))
            )}
          </div>
        </section>
      </div>



      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#030D2E] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-[14px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      <ExpenseForm
        tripId={tripId}
        members={members}
        expenses={expenses}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={showToast}
      />
    </div>
  );
}
