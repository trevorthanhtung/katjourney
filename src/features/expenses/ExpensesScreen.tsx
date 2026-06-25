import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  WalletCardsIcon,
  BalanceScaleIcon,
  UserGroupIcon,
  UserIcon,
  CalculatorIcon,
  PieChartIcon,
  ReceiptTextIcon,
  Route01Icon,
  Dish01Icon,
  HotelIcon,
  Ticket01Icon,
  Tag01Icon,
  TagsIcon,
  PencilEdit01Icon,
  InformationCircleIcon,
  UserCheckIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShoppingBag01Icon,
  GameController01Icon,
  Airplane01Icon,
  SparklesIcon,
  Calendar01Icon,
  PreferenceHorizontalIcon,
  MoreHorizontalIcon
} from "@hugeicons/core-free-icons";
import { db, Expense, Member, EventItem } from "../../db";
import { formatMoney, getSettlementSuggestions, sumBy, expenseCategories, getGroupUnits, getMemberShareForExpense } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, ScreenTitle, Select, DatePicker, DeleteConfirmModal, classNames } from "../../components/ui";
import { useModalHistory } from "../../hooks/useModalHistory";
import { fetchExchangeRates, ExchangeRate } from "../../services/currencyService";
import { getCurrentPosition, reverseGeocode, getCurrencyForCountry } from "../../services/locationService";

export function CategoryBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100/80 dark:bg-slate-800/60">
      <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function BreakdownSection({ 
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
        <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{emptyText}</p>
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
              : "bg-slate-300 dark:bg-slate-600";
              
        return (
          <div key={label} className="group">
            <div className="flex items-center justify-between text-[14px] font-bold">
              <p className="text-slate-700 dark:text-slate-300 group-hover:text-kat-dark group-hover:dark:text-white transition-colors">{label}</p>
              <p className="text-kat-dark dark:text-white">{formatMoney(amount)}</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <CategoryBar percent={percent} colorClass={colorClass} />
              <span className="w-10 text-right text-[12px] font-black text-slate-400 dark:text-slate-500 group-hover:text-slate-600 group-hover:dark:text-slate-350 transition-colors">{percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SettlementCard({ 
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
    <section className="rounded-3xl border border-slate-100 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-sm mt-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
          <HugeiconsIcon icon={BalanceScaleIcon} className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-[16px] font-extrabold text-kat-dark dark:text-white">Cân đối chia tiền</h3>
      </div>
      {settlements.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {settlements.map((s, idx) => {
            const fromMember = members.find(m => m.name === s.from);
            const toMember = members.find(m => m.name === s.to);
            const fromGroup = fromMember?.isGroupLeader && fromMember.group ? fromMember.group : null;
            const toGroup = toMember?.isGroupLeader && toMember.group ? toMember.group : null;
            
            return (
              <div key={idx} className="flex flex-col justify-center bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-2xl p-4 gap-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-center flex-1">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-1">
                      <HugeiconsIcon icon={UserIcon} className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-kat-dark dark:text-slate-200 text-[13px] text-center px-1 break-words leading-tight">{s.from}</span>
                    {fromGroup && <span className="text-[10px] text-slate-400 font-medium text-center leading-tight mt-0.5">(ĐD nhóm {fromGroup})</span>}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center flex-[1.5] px-2 shrink-0">
                    <span className="font-black text-rose-600 text-[14.5px] mb-1 whitespace-nowrap">{formatMoney(s.amount)}</span>
                    <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-700 relative flex items-center justify-center">
                      <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-slate-200 dark:border-l-slate-700" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 border border-emerald-100 dark:border-emerald-900/30">
                      <HugeiconsIcon icon={UserCheckIcon} className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-kat-primary text-[13px] text-center px-1 break-words leading-tight">{s.to}</span>
                    {toGroup && <span className="text-[10px] text-slate-400 font-medium text-center leading-tight mt-0.5">(ĐD nhóm {toGroup})</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-kat-border/40 rounded-2xl bg-slate-50/30 dark:bg-slate-800/20">
          <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

const ExpenseCard = React.memo(function ExpenseCard({ 
  item, 
  onEdit, 
  onDelete,
  idx = 0,
  isReadOnly
}: { 
  item: Expense; 
  onEdit: () => void; 
  onDelete: () => void;
  idx?: number;
  isReadOnly?: boolean;
}) {
  const isPersonal = item.splitType === "personal";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Di chuyển":
        return <HugeiconsIcon icon={Route01Icon} className="h-3.5 w-3.5" />;
      case "Vé máy bay":
        return <HugeiconsIcon icon={Airplane01Icon} className="h-3.5 w-3.5" />;
      case "Ăn uống":
        return <HugeiconsIcon icon={Dish01Icon} className="h-3.5 w-3.5" />;
      case "Lưu trú":
        return <HugeiconsIcon icon={HotelIcon} className="h-3.5 w-3.5" />;
      case "Vé tham quan":
        return <HugeiconsIcon icon={Ticket01Icon} className="h-3.5 w-3.5" />;
      case "Mua sắm":
        return <HugeiconsIcon icon={ShoppingBag01Icon} className="h-3.5 w-3.5" />;
      case "Vui chơi & Giải trí":
        return <HugeiconsIcon icon={GameController01Icon} className="h-3.5 w-3.5" />;
      case "Chuẩn bị hành lý":
        return <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5" />;
      default:
        return <HugeiconsIcon icon={Tag01Icon} className="h-3.5 w-3.5" />;
    }
  };

  return (
    <article className={`motion-card-enter motion-delay-${Math.min(idx + 1, 5)} flex items-center justify-between gap-4 rounded-3xl bg-white dark:bg-kat-surface p-5 border border-slate-200 dark:border-kat-border/40 shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="min-w-0 flex-1">
        {/* Description */}
        <h4 className="text-base font-semibold text-kat-dark dark:text-white truncate">
          {item.description || "Khoản chi không tên"}
        </h4>

        {/* Category & Badge */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          <span className="inline-flex items-center gap-1 font-medium bg-slate-100/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/20 dark:border-slate-700/60">
            {getCategoryIcon(item.category)}
            {item.category}
          </span>
          
          <span className={classNames(
            "inline-flex items-center rounded-md px-2 py-0.5 font-bold border",
            isPersonal 
              ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60" 
              : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/30"
          )}>
            {isPersonal ? "Chi cá nhân" : item.splitMode === "perGroup" ? "Chi theo nhóm" : "Chi chung"}
          </span>

          <span className="font-medium">
            • {isPersonal ? (item.payer ? `Của: ${item.payer}` : "Cá nhân") : `Trả: ${item.payer || "Chưa chọn"}`}
            {item.splitType === "shared" && item.splitAmong && item.splitAmong.length > 0 && ` (cho ${item.splitAmong.length} người)`}
          </span>
          
          {item.date && (
            <span className="font-medium px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-md">
              {new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 pl-2 text-right">
        <p className="font-bold text-kat-dark dark:text-white text-lg">
          {formatMoney(item.amount)}
        </p>
        {item.originalAmount && item.currency && item.currency !== "VND" && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {new Intl.NumberFormat('en-US').format(item.originalAmount)} {item.currency}
          </p>
        )}
      </div>

      {/* ... menu */}
      {!isReadOnly && (
        <div className="relative shrink-0 self-center" ref={menuRef}>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800/40 transition-colors focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Tùy chọn"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 dark:border-kat-border bg-white dark:bg-kat-surface p-1.5 shadow-lg animate-scaleIn text-left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 transition-colors"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 text-slate-500" />
                Sửa
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
              >
                <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                Xóa
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
});

function ExpenseForm({ 
  tripId, 
  members, 
  expenses, 
  events,
  editing, 
  isOpen, 
  onClose,
  onSaved,
  onShowToast
}: { 
  tripId: number; 
  members: Member[]; 
  expenses: Expense[]; 
  events: EventItem[];
  editing: Expense | null; 
  isOpen: boolean; 
  onClose: () => void;
  onSaved: (msg: string) => void;
  onShowToast?: (msg: string) => void;
}) {
  const categoryOptions = React.useMemo(() => {
    const defaultCats = expenseCategories.filter(c => c !== "Khác");
    const uniqueUsedCats = Array.from(new Set(expenses.map(e => e.category)))
      .filter(c => !defaultCats.includes(c) && c !== "Khác" && c !== "Khác...");
    return [...defaultCats, ...uniqueUsedCats, "Khác..."];
  }, [expenses]);

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  
  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  const [form, setForm] = useState<{ 
    description: string; 
    amount: string; 
    payer: string; 
    category: string; 
    customCategory: string; 
    splitType: "shared" | "personal";
    splitMode: "perPerson" | "perGroup";
    splitAmong: string[];
    date: string;
    eventId: string;
    currency: string;
    exchangeRate: number;
  }>({ 
    description: "", 
    amount: "", 
    payer: "", 
    category: categoryOptions[0], 
    customCategory: "", 
    splitType: "shared",
    splitMode: "perPerson",
    splitAmong: [],
    date: new Date().toISOString().split('T')[0],
    eventId: "",
    currency: "VND",
    exchangeRate: 1
  });

  const [errors, setErrors] = useState<{ 
    amount?: string; 
    payer?: string; 
    customCategory?: string; 
  }>({});

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const editingId = editing?.id;
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setShowAdvanced(false);
      if (editing) {
        const isCustom = !categoryOptions.includes(editing.category) || editing.category === "Khác...";
        setForm({
          description: editing.description,
          amount: String(editing.originalAmount || editing.amount),
          payer: editing.payer || "",
          category: isCustom ? "Khác..." : editing.category,
          customCategory: isCustom && editing.category !== "Khác..." ? editing.category : "",
          splitType: editing.splitType ?? "shared",
          splitMode: editing.splitMode ?? "perPerson",
          splitAmong: editing.splitAmong ?? [],
          date: editing.date || new Date().toISOString().split('T')[0],
          eventId: editing.eventId ? String(editing.eventId) : "",
          currency: editing.currency || "VND",
          exchangeRate: editing.exchangeRate || 1
        });
        if (editing.date || editing.splitType === "personal" || editing.splitMode === "perGroup" || (editing.splitAmong && editing.splitAmong.length > 0) || editing.eventId) {
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
          splitMode: "perPerson",
          splitAmong: [],
          date: new Date().toISOString().split('T')[0],
          eventId: "",
          currency: "VND",
          exchangeRate: 1
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  // Auto-detect currency when creating a new expense
  useEffect(() => {
    if (isOpen && !editing && exchangeRates.length > 0) {
      db.trips.get(tripId).then(trip => {
        if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {
          const matchedRate = exchangeRates.find(r => r.currencyCode === trip.defaultCurrency);
          if (matchedRate) {
            setForm(prev => ({ ...prev, currency: trip.defaultCurrency!, exchangeRate: matchedRate.transfer }));
            return; // Skip GPS if defaultCurrency is available
          }
        }
        
        // Fallback to GPS
        getCurrentPosition()
          .then(async (pos) => {
            try {
              const geo = await reverseGeocode(pos.latitude, pos.longitude);
              const suggestedCurrency = getCurrencyForCountry(geo.countryCode);
              if (suggestedCurrency && suggestedCurrency !== "VND") {
                const matchedRate = exchangeRates.find(r => r.currencyCode === suggestedCurrency);
                if (matchedRate) {
                  setForm(prev => ({ ...prev, currency: suggestedCurrency, exchangeRate: matchedRate.transfer }));
                }
              }
            } catch (e) {
              // Ignore geocode errors
            }
          })
          .catch(() => {
            // Ignore GPS errors (permissions, offline)
          });
      });
    }
  }, [isOpen, editing, exchangeRates, tripId]);

  const filteredEvents = React.useMemo(() => {
    return [...events]
      .filter(e => !e.isDeleted)
      .sort((a, b) => {
        const dateComp = (a.date || "").localeCompare(b.date || "");
        if (dateComp !== 0) return dateComp;
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [events]);

  async function save() {
    const newErrors: typeof errors = {};
    const amountVal = Number(form.amount);
    
    if (!form.amount.trim() || Number.isNaN(amountVal) || amountVal <= 0) {
      newErrors.amount = "Vui lòng nhập số tiền lớn hơn 0.";
    }

    const vndAmount = form.currency === "VND" ? amountVal : Math.round(amountVal * form.exchangeRate);

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
      amount: vndAmount,
      originalAmount: form.currency === "VND" ? undefined : amountVal,
      currency: form.currency === "VND" ? undefined : form.currency,
      exchangeRate: form.currency === "VND" ? undefined : form.exchangeRate,
      payer: form.splitType === "personal" ? (form.payer || "") : form.payer, 
      category: finalCategory, 
      splitType: form.splitType,
      splitMode: form.splitType === "personal" ? "perPerson" : form.splitMode,
      splitAmong: form.splitType === "personal" ? [] : form.splitAmong,
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
      className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 text-white dark:text-slate-950 px-4 text-[13.5px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] transition-all active:scale-[0.97] disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed"
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
        <div className="relative flex flex-col items-center justify-center py-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Số tiền</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(true)}
                className="flex items-center gap-1.5 text-[12.5px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 text-kat-dark dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                {form.currency}
                <HugeiconsIcon icon={ChevronDownIcon} className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <BottomSheet
                isOpen={isCurrencyDropdownOpen}
                onClose={() => setIsCurrencyDropdownOpen(false)}
                title="Chọn ngoại tệ"
              >
                <div className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-none pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, currency: "VND", exchangeRate: 1 });
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                      form.currency === "VND"
                        ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                    }`}
                  >
                    <span className={`text-[15px] ${form.currency === "VND" ? 'font-extrabold' : 'font-semibold'}`}>
                      VND (Việt Nam Đồng)
                    </span>
                    {form.currency === "VND" && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                  </button>
                  {exchangeRates.map((r) => {
                    const isSelected = form.currency === r.currencyCode;
                    return (
                      <button
                        key={r.currencyCode}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, currency: r.currencyCode, exchangeRate: r.transfer });
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                          isSelected
                            ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                        }`}
                      >
                        <span className={`text-[15px] ${isSelected ? 'font-extrabold' : 'font-semibold'}`}>
                          {r.currencyCode} {r.currencyName ? `(${r.currencyName})` : ""}
                        </span>
                        {isSelected && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                      </button>
                    );
                  })}
                </div>
              </BottomSheet>
            </div>
          </div>
          <div className="relative w-full max-w-[280px] flex items-center justify-center">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={form.amount ? new Intl.NumberFormat('en-US').format(Number(form.amount)) : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setForm({ ...form, amount: rawValue });
                setErrors({ ...errors, amount: "" });
              }}
              placeholder="0"
              className="w-full text-center text-3xl font-black text-kat-dark dark:text-white bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
            />
          </div>
          {form.currency !== "VND" && form.amount && (
            <div className="mt-3 flex flex-col items-center">
              <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
                ≈ {formatMoney(Math.round(Number(form.amount) * form.exchangeRate))}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-1">
                Tỷ giá: 1 {form.currency} = {new Intl.NumberFormat('vi-VN').format(form.exchangeRate)} đ
              </span>
            </div>
          )}
          {errors.amount && (
            <p className="text-rose-500 text-[12.5px] font-bold mt-1.5">{errors.amount}</p>
          )}
        </div>

        {/* Date */}
        <DatePicker 
          label={
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
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
              <HugeiconsIcon icon={ReceiptTextIcon} className="h-4 w-4 text-slate-500" />
              Nội dung chi tiêu
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
                    <HugeiconsIcon icon={UserCheckIcon} className="h-4 w-4 text-slate-500" />
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
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 text-[13px] text-amber-800 dark:text-amber-400 font-semibold flex gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <span>Chuyến đi chưa có người đồng hành. Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.</span>
            </div>
          )
        ) : (
          members.length > 0 && (
            <div>
              <Select
                label={
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserCheckIcon} className="h-4 w-4 text-slate-500" />
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
        <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-kat-dark dark:hover:text-slate-200 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={PreferenceHorizontalIcon} className="h-4 w-4 text-slate-400" />
              Chi tiết nâng cao
            </span>
            <HugeiconsIcon icon={ChevronRightIcon} className={classNames("h-4 w-4 transition-transform duration-200 text-slate-400", showAdvanced ? "rotate-90" : "")} />
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4 animate-fadeIn">
              {/* Category */}
              <div className="grid grid-cols-1 gap-4">
                <Select 
                  label={
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={TagsIcon} className="h-4 w-4 text-slate-500" />
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
                          <HugeiconsIcon icon={TagsIcon} className="h-4 w-4 text-slate-500" />
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
                        <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-slate-500" />
                        Gắn vào lịch trình (Tùy chọn)
                      </span>
                    }
                    value={form.eventId}
                    onChange={(eventId) => setForm({ ...form, eventId })}
                    options={["", ...filteredEvents.map(e => String(e.id))]}
                    labels={{
                      "": "Không gắn (Chi phí chung)",
                      ...Object.fromEntries(filteredEvents.map(e => {
                        const dateParts = (e.date || "").split('-');
                        const shortDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : (e.date || "");
                        const datePrefix = shortDate ? `(${shortDate}) ` : "";
                        return [String(e.id), `${datePrefix}${e.title}`];
                      }))
                    }}
                  />
                )}
              </div>

              {/* Segmented Control for Cost Calculation */}
              <div className="space-y-2">
                <span className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <HugeiconsIcon icon={BalanceScaleIcon} className="h-4 w-4 text-slate-500" />
                  Cách chia khoản chi
                </span>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, splitType: "shared", payer: members[0]?.name ?? "" });
                      setErrors({ ...errors, payer: "" });
                    }}
                    className={classNames(
                      "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                      form.splitType === "shared"
                        ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm border border-slate-200/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                        ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm border border-slate-200/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    Cá nhân tự trả
                  </button>
                </div>
              </div>

              {form.splitType === "shared" && members.length > 0 && (
                <>
                  <div className="space-y-2 pt-2">
                    <span className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-slate-500" />
                      Đối tượng chia
                    </span>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, splitMode: "perPerson" })}
                        className={classNames(
                          "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                          form.splitMode === "perPerson"
                            ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        )}
                      >
                        Chia theo người
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, splitMode: "perGroup" })}
                        className={classNames(
                          "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                          form.splitMode === "perGroup"
                            ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm border border-slate-200/10"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        )}
                      >
                        Chia theo gia đình
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <HugeiconsIcon icon={UserCheckIcon} className="h-4 w-4 text-slate-500" />
                      Tham gia ({form.splitAmong.length === 0 ? "Tất cả" : `${form.splitAmong.length} người`})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, splitAmong: [] })}
                        className={classNames(
                          "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                          form.splitAmong.length === 0
                            ? "bg-kat-dark text-white border-transparent"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        Tất cả
                      </button>
                      
                      {form.splitMode === "perGroup" ? (
                        getGroupUnits(members).map(unit => {
                          const label = unit.isGroup ? unit.groupName : unit.memberNames[0];
                          const isSelected = form.splitAmong.length === 0 || unit.memberNames.every(name => form.splitAmong.includes(name));
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                if (form.splitAmong.length === 0) {
                                  const allNames = members.map(m => m.name);
                                  const next = allNames.filter(n => !unit.memberNames.includes(n));
                                  setForm({ ...form, splitAmong: next });
                                } else {
                                  if (isSelected) {
                                    const next = form.splitAmong.filter(n => !unit.memberNames.includes(n));
                                    setForm({ ...form, splitAmong: next.length === 0 ? [] : next });
                                  } else {
                                    const next = Array.from(new Set([...form.splitAmong, ...unit.memberNames]));
                                    setForm({ ...form, splitAmong: next.length === members.length ? [] : next });
                                  }
                                }
                              }}
                              className={classNames(
                                "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                isSelected || form.splitAmong.length === 0
                                  ? "bg-kat-dark/10 dark:bg-kat-primary/20 text-kat-dark dark:text-kat-primary border-kat-dark/20 dark:border-kat-primary/30"
                                  : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-kat-dark/30"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })
                      ) : (
                        members.map(m => {
                          const isSelected = form.splitAmong.length === 0 || form.splitAmong.includes(m.name);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                if (form.splitAmong.length === 0) {
                                  setForm({ ...form, splitAmong: members.map(mem => mem.name).filter(n => n !== m.name) });
                                } else {
                                  if (form.splitAmong.includes(m.name)) {
                                    const next = form.splitAmong.filter(n => n !== m.name);
                                    setForm({ ...form, splitAmong: next.length === 0 ? [] : next });
                                  } else {
                                    const next = [...form.splitAmong, m.name];
                                    setForm({ ...form, splitAmong: next.length === members.length ? [] : next });
                                  }
                                }
                              }}
                              className={classNames(
                                "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                isSelected || form.splitAmong.length === 0
                                  ? "bg-kat-dark/10 dark:bg-kat-primary/20 text-kat-dark dark:text-kat-primary border-kat-dark/20 dark:border-kat-primary/30"
                                  : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-kat-dark/30"
                              )}
                            >
                              {m.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
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
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  useModalHistory(isFormOpen, () => {
    setIsFormOpen(false);
    setEditing(null);
  }, "expense-form-modal");

  useModalHistory(Boolean(expenseToDelete), () => setExpenseToDelete(null), "delete-expense-confirm");
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

  const groupUnits = React.useMemo(() => getGroupUnits(members), [members]);
  const hasGroups = groupUnits.some(u => u.isGroup);
  const perGroup = groupUnits.length ? totalSharedExpense / groupUnits.length : 0;
  
  // Calculate exact share per member based on new algorithm
  const exactSharesByMember = React.useMemo(() => {
    const shares: Record<string, number> = {};
    members.forEach(m => shares[m.name] = 0);
    sharedExpenses.forEach(expense => {
      const expenseShares = getMemberShareForExpense(expense, members);
      for (const [name, amount] of Object.entries(expenseShares)) {
        if (shares[name] !== undefined) shares[name] += amount;
      }
    });
    return shares;
  }, [sharedExpenses, members]);

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
    showToast(t("toast.expenseDeleted"));
  };

  const isEmpty = expenses.length === 0;

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      <div className="space-y-6 md:space-y-8 pb-0 md:pb-8">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-white">Chi phí</h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">Theo dõi chi tiêu, khoản đã trả và phần cần chia trong chuyến đi.</p>
          </div>
          {!isReadOnly && (
            <div>
              <button
                type="button"
                onClick={openNewForm}
                className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 px-5 text-[14px] font-bold text-white dark:text-slate-950 shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                Thêm khoản chi
              </button>
            </div>
          )}
        </div>
        
        {/* Total Expense Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-white dark:bg-kat-surface border-t-4 border-t-[#030D2E] dark:border-t-kat-border/40 border-x border-b border-slate-200 dark:border-kat-border/40 p-6 md:p-8 text-kat-dark dark:text-slate-100 shadow-soft">
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <HugeiconsIcon icon={ReceiptTextIcon} className="h-4.5 w-4.5" />
                  <p className="text-[13px] font-bold uppercase tracking-wider">Tổng chi phí chuyến đi</p>
                </div>
                <p className="mt-1 break-words text-[36px] md:text-[44px] font-black leading-none tracking-tight text-kat-dark dark:text-white">{formatMoney(totalExpense)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Chi chung chuyến đi</p>
                    <p className="text-[18px] font-black text-[#00AFA8] dark:text-[#00BFB7] mt-0.5">{formatMoney(totalSharedExpense)}</p>
                  </div>
                  <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-[#00AFA8]/60 dark:text-[#00BFB7]/60 shrink-0 mt-0.5" />
                </div>
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Chi cá nhân</p>
                    <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">{formatMoney(totalPersonalExpense)}</p>
                  </div>
                  <HugeiconsIcon icon={UserIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                </div>
                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {hasGroups ? "Bình quân / nhóm" : "Bình quân / người"}
                    </p>
                    {members.length > 0 ? (
                      <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">{formatMoney(hasGroups ? perGroup : perPerson)}</p>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-1.5 inline-block">Chưa có người đồng hành</span>
                    )}
                  </div>
                  <HugeiconsIcon icon={CalculatorIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                </div>
              </div>
            </div>
            
            {/* Hộp nút thêm khoản chi trên Mobile */}
            {!isReadOnly && (
              <div className="shrink-0 flex md:hidden items-center justify-end w-full">
                <button 
                  type="button"
                  onClick={openNewForm}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 text-white dark:text-slate-950 px-6 py-3 text-[14px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
                >
                  <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                  Thêm khoản chi
                </button>
              </div>
            )}
          </div>
        </section>

        {!isEmpty && (
          <>
            {/* Breakdown Grid */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <HugeiconsIcon icon={PieChartIcon} className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-kat-dark dark:text-white">Chi phí theo hạng mục</h3>
                </div>
                <BreakdownSection items={byCategory} total={totalExpense} emptyText="Chưa có danh mục chi phí." />
              </div>
              <div className="rounded-3xl border border-slate-100 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-kat-dark dark:text-white">Phần cần góp của từng người/nhóm</h3>
                </div>
                {members.length > 0 ? (
                  <BreakdownSection items={exactSharesByMember} total={totalSharedExpense} emptyText="Thêm người đồng hành để thống kê." />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">Thêm người đồng hành để xem phần chi của từng người.</p>
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-dark/5 text-kat-dark/70">
              <HugeiconsIcon icon={ReceiptTextIcon} className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-kat-dark">Danh sách khoản chi</h3>
          </div>
          <div className={isEmpty ? "" : "grid gap-4 lg:grid-cols-2"}>
            {isEmpty ? (
              <div className="rounded-[24px] bg-kat-surface p-8 border border-kat-border/60 shadow-soft flex flex-col items-center text-center animate-fadeIn max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                  <HugeiconsIcon icon={WalletCardsIcon} className="h-5.5 w-5.5" />
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
                  onEdit={() => openEditForm(item)}
                  onDelete={() => setExpenseToDelete(item)}
                  idx={idx}
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
          <div className="bg-kat-dark dark:bg-slate-800 text-white dark:text-slate-200 px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-transparent dark:border-slate-700/50">
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
        onShowToast={showToast}
      />
    </div>
  );
}
