import React, { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, WalletCards } from "lucide-react";
import { db, Expense, Member } from "../../db";
import { formatMoney, getSettlementSuggestions, sumBy, expenseCategories } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, IconButton, Input, ScreenTitle, Select, classNames } from "../../components/ui";

function CategoryBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function BreakdownSection({ items, total, emptyText }: { items: Record<string, number>; total: number; emptyText: string }) {
  const rows = Object.entries(items).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="text-[14px] text-slate-500">{emptyText}</p>;

  return (
    <div className="space-y-4">
      {rows.map(([label, amount], index) => {
        const percent = total ? Math.round((amount / total) * 100) : 0;
        const colorClass = index === 0 ? "bg-emerald-500" : index === 1 ? "bg-emerald-400" : index === 2 ? "bg-emerald-300" : "bg-slate-300";
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-[14px]">
              <p className="font-semibold text-slate-700">{label}</p>
              <p className="font-bold text-slate-900">{formatMoney(amount)}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <CategoryBar percent={percent} colorClass={colorClass} />
              <span className="w-10 text-right text-[12px] font-bold text-slate-400">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettlementCard({ members, expenses, settlements }: { members: Member[]; expenses: Expense[]; settlements: Array<{ from: string; to: string; amount: number }> }) {
  let emptyText = "Mọi người đã cân bằng, không ai nợ ai.";
  if (!members.length) emptyText = "Thêm thành viên ở phần Cài đặt để dùng tính năng chia tiền.";
  else if (!expenses.length) emptyText = "Chưa có chi phí nào cần chia.";

  return (
    <section className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-soft mt-4">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Ai trả cho ai?</h3>
      {settlements.length ? (
        <div className="space-y-2">
          {settlements.map((item) => (
            <div key={`${item.from}-${item.to}-${item.amount}`} className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2 text-[15px]">
                <span className="font-bold text-slate-900">{item.from}</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="font-bold text-slate-900">{item.to}</span>
              </div>
              <span className="font-bold text-sunset-600">{formatMoney(item.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCard text={emptyText} />
      )}
    </section>
  );
}

function ExpenseForm({ tripId, members, expenses, editing, isOpen, onClose }: { tripId: number; members: Member[]; expenses: Expense[]; editing: Expense | null; isOpen: boolean; onClose: () => void }) {
  const categoryOptions = React.useMemo(() => {
    const defaultCats = expenseCategories.filter(c => c !== "Khác");
    const uniqueUsedCats = Array.from(new Set(expenses.map(e => e.category))).filter(c => !defaultCats.includes(c) && c !== "Khác" && c !== "Khác...");
    return [...defaultCats, ...uniqueUsedCats, "Khác..."];
  }, [expenses]);

  const [form, setForm] = useState<{ description: string, amount: string, payer: string, category: string, customCategory: string, splitType: "shared" | "personal" }>({ description: "", amount: "", payer: "", category: categoryOptions[0], customCategory: "", splitType: "shared" });

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        const isCustom = !categoryOptions.includes(editing.category) || editing.category === "Khác...";
        setForm({
          description: editing.description,
          amount: String(editing.amount),
          payer: editing.payer,
          category: isCustom ? "Khác..." : editing.category,
          customCategory: isCustom && editing.category !== "Khác..." ? editing.category : "",
          splitType: editing.splitType ?? "shared",
        });
      } else {
        setForm({ description: "", amount: "", payer: members[0]?.name ?? "", category: categoryOptions[0], customCategory: "", splitType: "shared" });
      }
    }
  }, [editing, isOpen, members, categoryOptions]);

  async function save() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    let finalCategory = form.category;
    if (form.category === "Khác...") {
      finalCategory = form.customCategory.trim().slice(0, 30);
      if (!finalCategory) return;
    }

    const payload = { 
      description: form.description, 
      amount, 
      payer: form.payer, 
      category: finalCategory, 
      splitType: form.splitType,
      tripId 
    };

    if (editing?.id) {
      await db.expenses.update(editing.id, payload);
      onClose();
    } else {
      await db.expenses.add(payload);
      onClose();
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editing ? "Sửa khoản chi" : "Thêm khoản chi"}>
      <div className="space-y-4">
        <Input label="Số tiền" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} placeholder="VD: 500000" />
        <Input label="Mô tả" value={form.description} onChange={(description) => setForm({ ...form, description })} placeholder="Mục đích chi tiêu" />
        <Select label="Danh mục" value={form.category} onChange={(category) => setForm({ ...form, category })} options={categoryOptions} />
        {form.category === "Khác..." && (
          <div className="animate-fadeIn">
            <Input 
              label="Tên danh mục" 
              value={form.customCategory} 
              onChange={(customCategory) => setForm({ ...form, customCategory: customCategory.slice(0, 30) })} 
              placeholder="VD: Quà lưu niệm, Thuê xe máy" 
            />
          </div>
        )}
        <Select
          label="Cách tính chi phí"
          value={form.splitType}
          onChange={(splitType) => setForm({ ...form, splitType: splitType as "shared" | "personal" })}
          options={["shared", "personal"]}
          labels={{ shared: "Chi chung nhóm", personal: "Tự trả riêng" }}
        />
        <Select
          label={form.splitType === "personal" ? "Thành viên" : "Người trả"}
          value={form.payer}
          onChange={(payer) => setForm({ ...form, payer })}
          options={["", ...members.map((member) => member.name)]}
          placeholder={form.splitType === "personal" ? "Chọn thành viên" : "Chọn người trả"}
        />
        <div className="pt-2">
          <FormActions onSave={save} saveLabel={editing ? "Lưu thay đổi" : "Thêm chi phí"} />
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

  const byCategory = sumBy(expenses, (item) => item.category, (item) => Number(item.amount || 0));
  const paidByMember = {
    ...Object.fromEntries(members.map((member) => [member.name, 0])),
    ...sumBy(expenses, (item) => item.payer, (item) => Number(item.amount || 0))
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

  const isEmpty = expenses.length === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-6 pb-8">
        <ScreenTitle title="Chi phí" subtitle="Tính toán rành mạch, chơi vui vẻ." />
        
        {/* Total Expense Hero */}
        <section className="rounded-[32px] bg-slate-900 p-8 text-white shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex-1">
              <p className="text-[14px] font-medium text-slate-400">Tổng chi phí</p>
              <p className="mt-1 break-words text-[40px] font-bold leading-none tracking-tight">{formatMoney(totalExpense)}</p>
              
              <div className="mt-3 flex gap-4">
                <div>
                  <p className="text-[12px] font-medium text-slate-400">Chi chung</p>
                  <p className="text-[15px] font-bold text-emerald-300">{formatMoney(totalSharedExpense)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-slate-400">Tự trả riêng</p>
                  <p className="text-[15px] font-bold text-slate-300">{formatMoney(totalPersonalExpense)}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-[14px] font-medium text-slate-400">Trung bình mỗi người (từ chi chung)</p>
                <p className="mt-1 break-words text-xl font-bold">{formatMoney(perPerson)}</p>
              </div>
            </div>
            
            <button 
              onClick={openNewForm}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:bg-emerald-400 active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              {isEmpty ? "Thêm khoản chi đầu tiên" : "Thêm khoản chi"}
            </button>
          </div>
        </section>

        {!isEmpty && (
          <>
            {/* Breakdown */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-base font-bold text-slate-900">Chi tiêu theo mục</h3>
                <BreakdownSection items={byCategory} total={totalExpense} emptyText="Chưa có chi tiêu." />
              </div>
              <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-base font-bold text-slate-900">Chi tiêu theo người</h3>
                <BreakdownSection items={paidByMember} total={totalExpense} emptyText="Thêm thành viên để thống kê." />
              </div>
            </section>

            {/* Settlements */}
            <SettlementCard members={members} expenses={expenses} settlements={settlements} />
          </>
        )}

        {/* Expense List */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Tất cả chi phí</h3>
          <div className={isEmpty ? "" : "grid gap-3 md:grid-cols-2"}>
            {isEmpty ? (
              <div className="rounded-[32px] bg-white px-6 py-12 shadow-sm border border-slate-100 flex flex-col items-center text-center animate-fadeIn">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 ring-8 ring-emerald-50/50">
                  <WalletCards className="h-10 w-10" />
                </div>
                <p className="text-[18px] font-bold text-slate-900 mb-2">Chưa có khoản chi nào.</p>
                <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-sm">
                  Ghi lại chi phí ăn uống, di chuyển, vé tham quan hoặc mua sắm để dễ chia tiền sau chuyến đi.
                </p>
                <button 
                  onClick={openNewForm}
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-emerald-700 active:scale-95 w-full sm:w-auto"
                >
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                  Ghi lại khoản chi
                </button>
              </div>
            ) : (
              expenses.map((item) => (
                <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-slate-400 flex items-center flex-wrap gap-2">
                      {item.category}
                      <span className={classNames(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                        item.splitType === "personal" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.splitType === "personal" ? `Tự trả • ${item.payer || "Chưa rõ"}` : "Chi chung"}
                      </span>
                    </p>
                    <h4 className="mt-1 truncate text-[16px] font-bold text-slate-900">{item.description || "Khoản chi không tên"}</h4>
                    {item.splitType !== "personal" && (
                      <p className="mt-0.5 text-[14px] font-medium text-slate-500">{item.payer || "Chưa rõ người trả"}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <p className="font-bold text-emerald-700">{formatMoney(item.amount)}</p>
                    <div className="flex gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors" onClick={() => openEditForm(item)}>
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => db.expenses.delete(item.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {!isEmpty && (
        <FAB 
          icon={<Plus className="h-7 w-7" strokeWidth={2.5} />} 
          label="Thêm chi phí" 
          onClick={openNewForm} 
          className="md:hidden h-14 w-14 sm:h-16 sm:w-16 bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
        />
      )}

      <ExpenseForm
        tripId={tripId}
        members={members}
        expenses={expenses}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
