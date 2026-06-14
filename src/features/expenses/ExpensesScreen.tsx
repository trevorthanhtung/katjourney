import React, { useEffect, useState } from "react";
import { Plus, Trash2, WalletCards, Scale, UsersRound, UserRound, Calculator, ChartPie, ReceiptText, Route, Utensils, Hotel, Ticket, Tags, PencilLine, Info, UserCheck, ChevronRight, ShoppingBag, Gamepad2, Plane, Sparkles, CalendarDays } from "lucide-react";
import { db, Expense, Member, EventItem } from "../../db";
import { formatMoney, getSettlementSuggestions, sumBy, expenseCategories } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, ScreenTitle, Select, DatePicker, DeleteConfirmModal, classNames } from "../../components/ui";

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
    emptyText = "Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.";
  } else if (!expenses.length) {
    emptyText = "Chưa có khoản chi chung để cân đối chia tiền.";
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
          <Scale className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-[16px] font-extrabold text-[#030D2E]">Cân đối chia tiền</h3>
      </div>
      {settlements.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {settlements.map((s, idx) => (
            <div key={idx} className="flex flex-col justify-center bg-white border border-[#E8E1D8] shadow-sm rounded-2xl p-4 gap-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-center flex-1">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-1">
                    <UserRound className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-[#030D2E] text-[13px] truncate max-w-[80px]">{s.from}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-[1.5] px-2">
                  <span className="font-black text-rose-600 text-[14.5px] mb-1">{formatMoney(s.amount)}</span>
                  <div className="w-full h-[2px] bg-slate-200 relative flex items-center justify-center">
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-slate-200" />
                  </div>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 border border-emerald-100">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-kat-primary text-[13px] truncate max-w-[80px]">{s.to}</span>
                </div>
              </div>
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
  onDelete,
  idx = 0,
  isSwiped,
  onSwipe,
  isReadOnly
}: { 
  item: Expense; 
  onEdit: () => void; 
  onDelete: () => void;
  idx?: number;
  isSwiped: boolean;
  onSwipe: (swiped: boolean) => void;
  isReadOnly?: boolean;
}) {
  const isPersonal = item.splitType === "personal";
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Di chuyển":
        return <Route className="h-3.5 w-3.5" />;
      case "Vé máy bay":
        return <Plane className="h-3.5 w-3.5" />;
      case "Ăn uống":
        return <Utensils className="h-3.5 w-3.5" />;
      case "Lưu trú":
        return <Hotel className="h-3.5 w-3.5" />;
      case "Vé tham quan":
        return <Ticket className="h-3.5 w-3.5" />;
      case "Mua sắm":
        return <ShoppingBag className="h-3.5 w-3.5" />;
      case "Vui chơi & Giải trí":
        return <Gamepad2 className="h-3.5 w-3.5" />;
      case "Chuẩn bị hành lý":
        return <Sparkles className="h-3.5 w-3.5" />;
      default:
        return <Tags className="h-3.5 w-3.5" />;
    }
  };

  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isReadOnly) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isReadOnly) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      onSwipe(true);
    } else if (diff < -40) {
      onSwipe(false);
    }
  };
  
  return (
    <div className={`relative h-full overflow-hidden rounded-3xl motion-card-enter motion-delay-${Math.min(idx + 1, 5)}`}>
      {/* Background Action Buttons */}
      {!isReadOnly && (
        <div className="absolute inset-y-0 right-0 z-0 flex items-center justify-end gap-2 pr-4 pl-12 bg-slate-50/60 rounded-3xl border border-slate-100">
          <button 
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm border border-slate-200/50 focus:outline-none" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Chỉnh sửa"
          >
            <PencilLine className="h-5 w-5" />
          </button>
          <button 
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all shadow-sm border border-rose-100 focus:outline-none" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Xóa"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main Card Content Overlay */}
      <article 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (isReadOnly) return;
          e.stopPropagation();
          onSwipe(!isSwiped);
        }}
        className={classNames(
          "relative z-10 flex items-center justify-between gap-4 h-full rounded-3xl bg-[#FFFDF8] p-5 border border-[#E8E1D8] transition-all duration-200 hover:shadow-md cursor-pointer select-none",
          isSwiped ? "-translate-x-28 border-slate-300" : "translate-x-0"
        )}
      >
        <div className="min-w-0 flex-1">
          {/* Description */}
          <h4 className="text-base font-semibold text-[#030D2E] truncate">
            {item.description || "Khoản chi không tên"}
          </h4>

          {/* Category & Badge */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mt-1.5">
            <span className="inline-flex items-center gap-1 font-medium bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/20">
              {getCategoryIcon(item.category)}
              {item.category}
            </span>
            
            <span className={classNames(
              "inline-flex items-center rounded-md px-2 py-0.5 font-bold border",
              isPersonal 
                ? "bg-slate-50 text-slate-500 border-slate-200/80" 
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            )}>
              {isPersonal ? "Chi cá nhân" : "Chi chung"}
            </span>

            {/* Paid by / Owned by info */}
            <span className="font-medium">
              • {isPersonal ? (item.payer ? `Của: ${item.payer}` : "Cá nhân") : `Trả: ${item.payer || "Chưa chọn"}`}
            </span>
            
            {item.date && (
              <span className="font-medium px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-md">
                {new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="shrink-0 pl-2 text-right">
          <p className="font-bold text-[#030D2E] text-lg">
            {formatMoney(item.amount)}
          </p>
        </div>
      </article>
    </div>
  );
}

function ExpenseForm({ 
  tripId, 
  members, 
  expenses, 
  events,
  editing, 
  isOpen, 
  onClose,
  onSaved 
}: { 
  tripId: number; 
  members: Member[]; 
  expenses: Expense[]; 
  events: EventItem[];
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
    splitType: "shared" | "personal";
    date: string;
    eventId: string;
  }>({ 
    description: "", 
    amount: "", 
    payer: "", 
    category: categoryOptions[0], 
    customCategory: "", 
    splitType: "shared",
    date: new Date().toISOString().split('T')[0],
    eventId: ""
  });

  const [errors, setErrors] = useState<{ 
    amount?: string; 
    payer?: string; 
    customCategory?: string; 
  }>({});

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setShowAdvanced(false);
      if (editing) {
        const isCustom = !categoryOptions.includes(editing.category) || editing.category === "Khác...";
        setForm({
          description: editing.description,
          amount: String(editing.amount),
          payer: editing.payer || "",
          category: isCustom ? "Khác..." : editing.category,
          customCategory: isCustom && editing.category !== "Khác..." ? editing.category : "",
          splitType: editing.splitType ?? "shared",
          date: editing.date || new Date().toISOString().split('T')[0],
          eventId: editing.eventId ? String(editing.eventId) : ""
        });
        if (editing.date || editing.splitType === "personal" || editing.eventId) {
          setShowAdvanced(true);
        }
      } else {
        setForm({ 
          description: "", 
          amount: "", 
          payer: members[0]?.name ?? "", 
          category: categoryOptions[0], 
          customCategory: "", 
          splitType: "shared",
          date: new Date().toISOString().split('T')[0],
          eventId: ""
        });
      }
    }
  }, [editing, isOpen, members, categoryOptions]);

  const filteredEvents = React.useMemo(() => {
    if (!form.date) return [];
    return events.filter(e => e.date === form.date && !e.isDeleted);
  }, [events, form.date]);

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
      date: form.date || undefined,
      eventId: form.eventId ? form.eventId : undefined,
      updatedAt: new Date().toISOString(),
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

  const isSaveDisabled = !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  const headerAction = (
    <button
      type="button"
      onClick={save}
      disabled={isSaveDisabled}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#030D2E] hover:bg-[#030D2E]/90 text-white px-4 text-[13.5px] font-bold shadow-sm transition-all active:scale-[0.97] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
    >
      {editing ? "Lưu" : "Thêm"}
    </button>
  );

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa khoản chi" : "Thêm khoản chi"}
      headerAction={headerAction}
    >
      <div className="space-y-4">
        {/* Prominent Amount Input */}
        <div className="relative flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1">Số tiền (đ)</span>
          <div className="relative w-full max-w-[280px] flex items-center justify-center">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={form.amount ? new Intl.NumberFormat('vi-VN').format(Number(form.amount)) : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setForm({ ...form, amount: rawValue });
                setErrors({ ...errors, amount: "" });
              }}
              placeholder="0"
              className="w-full text-center text-3xl font-black text-[#030D2E] bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
            />
          </div>
          {errors.amount && (
            <p className="text-rose-500 text-[12.5px] font-bold mt-1.5">{errors.amount}</p>
          )}
        </div>

        {/* Date */}
        <DatePicker 
          label={
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              Ngày chi tiêu
            </span>
          } 
          value={form.date} 
          onChange={(date) => { setForm({ ...form, date, eventId: "" }) }} 
        />

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

        {/* Payer Select (Always Visible in Default Section) */}
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
            <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-4 text-[13px] text-amber-800 font-semibold flex gap-2">
              <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <span>Chuyến đi chưa có người đồng hành. Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.</span>
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

        {/* Accordion / Collapsible Panel */}
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

                {filteredEvents.length > 0 && (
                  <Select
                    label={
                      <span className="flex items-center gap-1.5">
                        <Route className="h-4 w-4 text-slate-500" />
                        Gắn vào lịch trình (Tùy chọn)
                      </span>
                    }
                    value={form.eventId}
                    onChange={(eventId) => setForm({ ...form, eventId })}
                    options={["", ...filteredEvents.map(e => String(e.id))]}
                    labels={{
                      "": "Không gắn (Chi phí chung)",
                      ...Object.fromEntries(filteredEvents.map(e => [String(e.id), e.title]))
                    }}
                  />
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
      </div>
    </BottomSheet>
  );
}

export function ExpensesScreen({
  expenses,
  members,
  events,
  totalExpense,
  perPerson,
  tripId,
  initialAddState,
  onClearInitialAddState,
  isReadOnly
}: {
  expenses: Expense[];
  members: Member[];
  events: EventItem[];
  totalExpense: number;
  perPerson: number;
  tripId: number;
  initialAddState?: { date: string; eventId: number };
  onClearInitialAddState?: () => void;
  isReadOnly?: boolean;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [swipedExpenseId, setSwipedExpenseId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (initialAddState && !isFormOpen && !editing) {
      setIsFormOpen(true);
      // We also need to pass the initialAddState to ExpenseForm somehow,
      // But ExpenseForm expects `editing: Expense | null`. 
      // We can pass a mock Expense to `editing` to pre-fill it.
      setEditing({
        id: undefined,
        tripId,
        amount: 0,
        payer: members[0]?.name || "",
        category: "Di chuyển", // Default category or something else
        description: "",
        date: initialAddState.date,
        eventId: String(initialAddState.eventId),
        splitType: "shared"
      } as unknown as Expense);
      onClearInitialAddState?.();
    }
  }, [initialAddState, isFormOpen, editing, members, tripId, onClearInitialAddState]);

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

  const executeDelete = async () => {
    if (!expenseToDelete?.id) return;
    await db.expenses.update(expenseToDelete.id, { isDeleted: true });
    setExpenseToDelete(null);
    showToast("Đã xóa khoản chi");
  };

  const isEmpty = expenses.length === 0;

  return (
    <div 
      className="mx-auto max-w-[1120px] px-1 md:px-0"
      onClick={() => setSwipedExpenseId(null)}
    >
      <div className="space-y-6 md:space-y-8 pb-0 md:pb-8">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Chi phí</h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500">Theo dõi chi tiêu, khoản đã trả và phần cần chia trong chuyến đi.</p>
          </div>
          {!isReadOnly && (
            <div>
              <button
                onClick={openNewForm}
                className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-[#030D2E] px-5 text-[14px] font-bold text-white shadow-sm hover:bg-[#030D2E]/90 motion-press h-[48px]"
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
                Thêm khoản chi
              </button>
            </div>
          )}
        </div>
        
        {/* Total Expense Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border-t-4 border-t-[#030D2E] border-x border-b border-[#E8E1D8] p-6 md:p-8 text-[#030D2E] shadow-soft">
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <ReceiptText className="h-4.5 w-4.5" />
                  <p className="text-[13px] font-bold uppercase tracking-wider">Tổng chi phí chuyến đi</p>
                </div>
                <p className="mt-1 break-words text-[36px] md:text-[44px] font-black leading-none tracking-tight text-[#030D2E]">{formatMoney(totalExpense)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Chi chung chuyến đi</p>
                    <p className="text-[18px] font-black text-[#00AFA8] mt-0.5">{formatMoney(totalSharedExpense)}</p>
                  </div>
                  <UsersRound className="h-5 w-5 text-[#00AFA8]/60 shrink-0 mt-0.5" />
                </div>
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Chi cá nhân</p>
                    <p className="text-[18px] font-black text-[#030D2E] mt-0.5">{formatMoney(totalPersonalExpense)}</p>
                  </div>
                  <UserRound className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                </div>
                <div className="bg-[#FFFDF8] border border-[#E8E1D8] rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Bình quân / người</p>
                    {members.length > 0 ? (
                      <p className="text-[18px] font-black text-[#030D2E] mt-0.5">{formatMoney(perPerson)}</p>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 mt-1.5 inline-block">Chưa có người đồng hành</span>
                    )}
                  </div>
                  <Calculator className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                </div>
              </div>
            </div>
            
            {/* Hộp nút thêm khoản chi trên Mobile */}
            {!isReadOnly && (
              <div className="shrink-0 flex md:hidden items-center justify-end w-full">
                <button 
                  onClick={openNewForm}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#030D2E] hover:bg-[#030D2E]/90 text-white px-6 py-3 text-[14px] font-bold shadow-sm motion-press h-[48px]"
                >
                  <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
                  Thêm khoản chi
                </button>
              </div>
            )}
          </div>
        </section>

        {!isEmpty && (
          <>
            {/* Breakdown Grid */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <ChartPie className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-[#030D2E]">Chi phí theo hạng mục</h3>
                </div>
                <BreakdownSection items={byCategory} total={totalExpense} emptyText="Chưa có danh mục chi phí." />
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <UsersRound className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-[#030D2E]">Chi phí theo người đồng hành</h3>
                </div>
                {members.length > 0 ? (
                  <BreakdownSection items={paidByMember} total={totalSharedExpense} emptyText="Thêm người đồng hành để thống kê." />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-[14px] font-semibold text-slate-500">Thêm người đồng hành để xem phần chi của từng người.</p>
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
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#030D2E]/5 text-[#030D2E]/70">
              <ReceiptText className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-[#030D2E]">Danh sách khoản chi</h3>
          </div>
          <div className={isEmpty ? "" : "grid gap-4 md:grid-cols-2"}>
            {isEmpty ? (
              <div className="rounded-[24px] bg-kat-surface p-8 border border-kat-border/60 shadow-soft flex flex-col items-center text-center animate-fadeIn max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                  <WalletCards className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-[17px] font-bold text-kat-text mb-1.5">Chưa có khoản chi nào</h3>
                <p className="text-[13.5px] font-medium text-kat-muted mb-0 max-w-xs">
                  Ghi lại chi phí ăn uống, di chuyển, vé tham quan để hệ thống tự động cân đối chia tiền sau chuyến đi.
                </p>
              </div>
            ) : (
              [...expenses]
                .sort((a, b) => {
                  const dateA = a.date ? new Date(a.date).getTime() : 0;
                  const dateB = b.date ? new Date(b.date).getTime() : 0;
                  return dateB - dateA;
                })
                .map((item, idx) => (
                <ExpenseCard
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setSwipedExpenseId(null);
                    openEditForm(item);
                  }}
                  onDelete={() => {
                    setSwipedExpenseId(null);
                    setExpenseToDelete(item);
                  }}
                  idx={idx}
                  isSwiped={swipedExpenseId === item.id}
                  onSwipe={(swiped) => setSwipedExpenseId(swiped ? item.id! : null)}
                  isReadOnly={isReadOnly}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={executeDelete}
        title="Xóa khoản chi này?"
        itemName={expenseToDelete?.description || expenseToDelete?.category}
        description="Khoản chi này sẽ bị xóa khỏi danh sách chi phí của chuyến đi. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa khoản chi"
      />

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
        events={events}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={showToast}
      />
    </div>
  );
}
