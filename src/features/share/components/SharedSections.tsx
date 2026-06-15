import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { createPortal } from 'react-dom';
import { 
  WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, Plus, Pencil, Trash2, MoreVertical, LifeBuoy,
  ReceiptText, UserCheck, Tags, ChevronRight, Scale, Info, Check, X, Clock,
  FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, Sandwich, Package, BadgeCheck, UserRoundCheck, StickyNote, Type, Minus, User, CalendarDays, Maximize2, Image as ImageIcon, Loader2, SmilePlus, NotebookPen, Save, Sparkles, Route, HelpCircle, Users, MessageCircle, Globe,
  Crown, UserRound, Luggage, Car, Calculator, ChartPie, UsersRound,
  Plane, Utensils, Hotel, Ticket, ShoppingBag, Gamepad2, Compass, ChevronDown
} from 'lucide-react';
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan, Member, EventItem } from '../../../db';
import { formatMoney, expenseCategories, formatDate, moodLabels, sumBy, getSettlementSuggestions } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { showToast } from '../../../components/ui/ToastManager';
import { uploadJournalImage } from '../../../services/storageService';
import { getIdentity } from '../../../services/identityService';
import { BottomSheet, Input, Select, Textarea, DatePicker, DeleteConfirmModal } from '../../../components/ui';
import { getAvatarSvg, getRandomAvatarId } from '../../../utils/avatars';
import { BreakdownSection, CategoryBar, SettlementCard } from '../../expenses/ExpensesScreen';
import { fetchExchangeRates, ExchangeRate } from '../../../services/currencyService';

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
  members = [],
  events = [],
  guestName
}: { 
  token: string; 
  mode: string; 
  expenses: Expense[]; 
  changeRequests?: any[];
  members?: Member[];
  events?: EventItem[];
  guestName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "Di chuyển":
        return {
          icon: Route,
          bg: "bg-blue-50 text-blue-600 border-blue-150/50"
        };
      case "Vé máy bay":
        return {
          icon: Plane,
          bg: "bg-indigo-50 text-indigo-600 border-indigo-150/50"
        };
      case "Ăn uống":
        return {
          icon: Utensils,
          bg: "bg-rose-50 text-rose-600 border-rose-150/50"
        };
      case "Lưu trú":
        return {
          icon: Hotel,
          bg: "bg-slate-100 text-[#030D2E] border-slate-200"
        };
      case "Vé tham quan":
        return {
          icon: Ticket,
          bg: "bg-amber-50 text-amber-600 border-amber-150/50"
        };
      case "Mua sắm":
        return {
          icon: ShoppingBag,
          bg: "bg-purple-50 text-purple-600 border-purple-150/50"
        };
      case "Vui chơi & Giải trí":
        return {
          icon: Gamepad2,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-150/50"
        };
      case "Chuẩn bị hành lý":
        return {
          icon: Sparkles,
          bg: "bg-sky-50 text-sky-600 border-sky-150/50"
        };
      default:
        return {
          icon: Tags,
          bg: "bg-slate-50 text-slate-500 border-slate-200/50"
        };
    }
  };

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenuId]);

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
    currency: string;
    exchangeRate: number;
  }>({ 
    description: "", 
    amount: "", 
    payer: "", 
    category: categoryOptions[0] || "Di chuyển", 
    customCategory: "", 
    splitType: "shared",
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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';

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
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            eventId: item.eventId ? String(item.eventId) : "",
            currency: item.currency || "VND",
            exchangeRate: item.exchangeRate || 1
          });
          if (item.splitType === "personal" || isCustom || item.category !== categoryOptions[0] || item.eventId) {
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
          splitType: "shared",
          date: new Date().toISOString().split('T')[0],
          eventId: "",
          currency: "VND",
          exchangeRate: 1
        });
      }
    }
  }, [editingId, isFormOpen, members, categoryOptions, expenses]);

  const filteredEvents = React.useMemo(() => {
    if (!form.date || !events) return [];
    return events.filter(e => e.date === form.date && !e.isDeleted);
  }, [events, form.date]);

  // Merge pending change requests into expenses list for visual diffs
  const mergedExpenses = React.useMemo(() => {
    const list = expenses.filter((e: any) => !e.isDeleted).map(item => {
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

    const pendingCreates = changeRequests.filter(r => r.section === 'expenses' && r.action === 'create' && r.status === 'pending');
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
      description: form.description.trim() || ("" + finalCategory), 
      amount: vndAmount, 
      payer: form.splitType === "personal" ? (form.payer || "") : form.payer, 
      category: finalCategory, 
      splitType: form.splitType,
      date: new Date(form.date).toISOString(),
      eventId: form.eventId ? Number(form.eventId) : undefined,
      currency: form.currency,
      exchangeRate: form.exchangeRate,
      originalAmount: form.currency !== "VND" ? amountVal : undefined
    };

    try {
      setIsSubmitting(true);
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.';
      if (!editingId) {
        await submitChangeRequest(token, { section: 'expenses', action: 'create', after: payload, status, requesterName: guestName });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const before = expenses.find(e => String(e.id) === editingId);
        await submitChangeRequest(token, { section: 'expenses', action: 'update', targetId: editingId, before: before as any, after: payload, status, requesterName: guestName });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) { 
      showToast((isDirectEdit ? 'Lỗi cập nhật: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); 
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = expenses.find(e => String(e.id) === id);
      await submitChangeRequest(token, { 
        section: 'expenses', 
        action: 'delete', 
        targetId: id, 
        before: before as any, 
        status: isDirectEdit ? 'auto_approved' : undefined,
        requesterName: guestName 
      });
      showToast(isDirectEdit ? 'Đã xóa trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast((isDirectEdit ? 'Lỗi xóa: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); }
  }

  const activeExpenses = mergedExpenses.filter(e => !e.isPendingDelete);
  
  const totalExpense = activeExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const sharedExpensesList = activeExpenses.filter((e) => e.splitType === "shared");
  const personalExpensesList = activeExpenses.filter((e) => e.splitType === "personal");

  const totalShared = sharedExpensesList.reduce((acc, cur) => acc + cur.amount, 0);
  const totalPersonal = personalExpensesList.reduce((acc, cur) => acc + cur.amount, 0);

  const activeMembers = members.length > 0 ? members.length : 1;
  const avgPerPerson = Math.round(totalShared / activeMembers);

  const categoryBreakdown = React.useMemo(() => {
    const acc: Record<string, number> = {};
    activeExpenses.forEach((e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    });
    return acc;
  }, [activeExpenses]);

  const payerBreakdown = React.useMemo(() => {
    const acc: Record<string, number> = {};
    activeExpenses.forEach((e) => {
      if (e.payer) acc[e.payer] = (acc[e.payer] || 0) + e.amount;
    });
    return acc;
  }, [activeExpenses]);

  const settlements = React.useMemo(() => {
    return getSettlementSuggestions(members, sharedExpensesList);
  }, [sharedExpensesList, members]);

  const isSaveDisabled = !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  return (
    <div className="space-y-6">
      {/* Dashboard Section */}
      <section className="rounded-3xl border border-[#030D2E]/10 bg-white p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <WalletCards className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Tổng chi phí chuyến đi</span>
          </div>
        </div>
        <div className="relative z-10 mt-1">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#030D2E] drop-shadow-sm">
            {formatMoney(totalExpense)}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 relative z-10">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-kat-primary flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5" />
              Chi chung
            </span>
            <span className="text-[17px] font-black text-[#030D2E]">{formatMoney(totalShared)}</span>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1.5">
              <UserRound className="w-3.5 h-3.5" />
              Chi cá nhân
            </span>
            <span className="text-[17px] font-black text-[#030D2E]">{formatMoney(totalPersonal)}</span>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100 hover:border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Bình quân / người
            </span>
            <span className="text-[17px] font-black text-[#030D2E]">{formatMoney(avgPerPerson)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 animate-fadeIn" style={{ animationDelay: '100ms' }}>
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <ChartPie className="h-4 w-4" />
            </span>
            <h3 className="text-[14px] font-extrabold text-[#030D2E]">Chi phí theo hạng mục</h3>
          </div>
          <BreakdownSection items={categoryBreakdown} total={totalExpense} emptyText="Chưa có khoản chi nào để phân tích." />
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <UsersRound className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-[14px] font-extrabold text-[#030D2E]">Chi phí theo người trả</h3>
          </div>
          <BreakdownSection items={payerBreakdown} total={totalExpense} emptyText="Chưa có khoản chi nào để phân tích." />
        </section>
      </div>

      <SettlementCard members={members} expenses={activeExpenses} settlements={settlements} />

      {/* Expenses List */}
      <section className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm mt-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-amber-500" />
            <h3 className="text-[16px] font-black text-[#030D2E]">Danh sách khoản chi</h3>
          </div>
        </div>
        {mergedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/35 rounded-2xl border border-dashed border-slate-200/80 my-2">
            <ReceiptText className="h-10 w-10 text-slate-350 mb-2.5 animate-pulse" />
            <p className="text-[13px] font-bold text-slate-400">Chưa có khoản chi nào trong danh sách</p>
            <p className="text-[11.5px] text-slate-400/80 mt-1 max-w-xs px-4">Đề xuất thêm chi phí để chia đều và quyết toán sau chuyến đi.</p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-3">
            {mergedExpenses.map((e, idx) => {
              const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;
              const catDetails = getCategoryDetails(e.category);
              const CatIcon = catDetails.icon;
              
              return (
                <div 
                  key={e.id} 
                  className={classNames(
                    "flex justify-between items-center p-3.5 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(3,13,46,0.03)] rounded-2xl transition-all duration-200 hover:-translate-y-0.5", 
                    e.isPendingCreate || e.isPendingUpdate ? "bg-sky-50/30 border-sky-100/50" : "",
                    e.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon container */}
                    <span className={classNames(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                      catDetails.bg
                    )}>
                      <CatIcon className="h-5 w-5" />
                    </span>

                    {/* Info text stack */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={classNames(
                          "text-[14px] font-bold text-[#030D2E] break-words line-clamp-1",
                          e.isPendingDelete ? "line-through text-slate-400/60" : ""
                        )}>
                          {e.description || e.category}
                        </span>

                        {/* Pending Request Badges */}
                        {e.isPendingDelete && (
                          <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang xóa...' : 'Đề xuất xóa'}
                          </span>
                        )}
                        {e.isPendingCreate && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất mới'}
                          </span>
                        )}
                        {e.isPendingUpdate && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất sửa'}
                          </span>
                        )}
                      </div>

                      {/* Subtitle Details Line */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-400">
                        {e.date && (
                          <span className="flex items-center gap-1 shrink-0">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                            {new Date(e.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        )}

                        {/* Payer info */}
                        {e.payer && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">
                              Trả bởi: <span className="text-slate-500 font-extrabold">{e.payer}</span>
                            </span>
                          </>
                        )}

                        {/* Split type badge */}
                        {e.splitType && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className={classNames(
                              "px-1.5 py-0.2 rounded-md text-[9.5px] font-extrabold border shrink-0",
                              e.splitType === "shared" 
                                ? "bg-indigo-50/50 border-indigo-100/60 text-indigo-600"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                            )}>
                              {e.splitType === "shared" ? "Chi chung" : "Cá nhân"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and edit menu */}
                  <div className="flex items-center gap-1.5 pl-3">
                    <span className={classNames(
                      "text-[15px] font-black text-[#030D2E] whitespace-nowrap",
                      e.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                    )}>
                      {formatMoney(e.amount)}
                    </span>
                    {isRequestEdit && !isPending && (
                      <div className="shrink-0">
                        <button 
                          onClick={(ev) => {
                            ev.stopPropagation();
                            const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                            if (activeMenuId === String(e.id)) {
                              setActiveMenuId(null);
                              setMenuPos(null);
                            } else {
                              setActiveMenuId(String(e.id));
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none cursor-pointer"
                          title="Tùy chọn đề xuất"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {activeMenuId && menuPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[998]" 
            onClick={() => {
              setActiveMenuId(null);
              setMenuPos(null);
            }}
          />
          <div 
            className="fixed z-[999] w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 animate-fadeIn"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                const item = expenses.find(x => String(x.id) === id);
                if (item) startEdit(item);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {isDirectEdit ? "Sửa chi phí" : "Đề xuất sửa"}
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              {isDirectEdit ? "Xóa chi phí" : "Đề xuất xóa"}
            </button>
          </div>
        </>,
        document.body
      )}
      {isRequestEdit && (
        <button 
          onClick={startAdd} 
          className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 text-[13px] font-bold text-[#030D2E] bg-white hover:bg-slate-50 border border-dashed border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-2xl transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          title={isDirectEdit ? "Thêm chi phí" : "Đề xuất thêm"}
        >
          <Plus className="h-4 w-4" /> {isDirectEdit ? "Thêm chi phí" : "Đề xuất thêm"}
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={isDirectEdit ? (editingId ? "Sửa chi phí" : "Thêm chi phí") : (editingId ? "Đề xuất sửa chi phí" : "Đề xuất thêm chi phí")}
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Amount Box */}
          <div className="relative flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Số tiền</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                  className="flex items-center gap-1.5 text-[12.5px] font-bold bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[#030D2E] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  {form.currency}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isCurrencyDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsCurrencyDropdownOpen(false)}
                    />
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-[80px] bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden animate-scaleUp origin-top">
                      <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, currency: "VND", exchangeRate: 1 });
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={classNames(
                            "px-3 py-2 text-[13px] font-bold text-center transition-colors hover:bg-slate-50",
                            form.currency === "VND" ? "text-kat-primary bg-kat-primary/5" : "text-slate-600"
                          )}
                        >
                          VND
                        </button>
                        {exchangeRates.map((r) => (
                          <button
                            key={r.currencyCode}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, currency: r.currencyCode, exchangeRate: r.transfer });
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={classNames(
                              "px-3 py-2 text-[13px] font-bold text-center transition-colors hover:bg-slate-50",
                              form.currency === r.currencyCode ? "text-kat-primary bg-kat-primary/5" : "text-slate-600"
                            )}
                          >
                            {r.currencyCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={form.amount ? new Intl.NumberFormat('en-US').format(Number(form.amount)) : ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, amount: rawValue });
                  setErrors({ ...errors, amount: "" });
                }}
                className="w-full text-center text-3xl font-black text-[#030D2E] bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
              />
            </div>
            {errors.amount && (
              <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 text-center">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <Input 
            type="date"
            label={
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Ngày chi tiêu
              </span>
            } 
            value={form.date} 
            onChange={(date) => setForm({ ...form, date })} 
          />

          {/* Description */}
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <ReceiptText className="h-4 w-4 text-slate-500" />
                Nội dung chi tiêu
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
                    if (errors.payer) setErrors({ ...errors, payer: undefined });
                  }}
                  options={["", ...(members || []).map(m => m.name)]}
                  placeholder="Chọn người trả"
                  />
                  {errors.payer && <p className="mt-1 text-[12px] font-bold text-rose-500 pl-1">{errors.payer}</p>}
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

          <button
            onClick={handleSave}
            disabled={isSaveDisabled || isSubmitting}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#030D2E] font-black text-white hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : isDirectEdit ? (editingId ? "Lưu khoản chi" : "Thêm khoản chi") : "Gửi đề xuất"}
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
        title={isDirectEdit ? "Xóa khoản chi?" : "Đề xuất xóa khoản chi?"}
        description={isDirectEdit ? "Bạn có chắc chắn muốn xóa khoản chi này? Hành động này không thể hoàn tác." : "Bạn đang gửi đề xuất xóa khoản chi này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}
        confirmLabel={isDirectEdit ? "Xóa" : "Đề xuất xóa"}
        itemName={expenses.find(e => String(e.id) === deleteTargetId)?.description}
      />
    </section>
    </div>
  );
}


export function SharedChecklistSection({ 
  tripId,
  token, 
  mode, 
  checklist, 
  changeRequests = [],
  members = [],
  guestName
}: { 
  tripId?: string | number;
  token: string; 
  mode: string; 
  checklist: ChecklistItem[]; 
  changeRequests?: any[];
  members?: Member[];
  guestName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'shared' | 'private'>('shared');

  const localPrivateItems = useLiveQuery(async () => {
    if (!tripId) return [];
    const targetTripId = typeof tripId === 'number' ? tripId : (isNaN(Number(tripId)) ? tripId : Number(tripId));
    try {
      const items = await db.checklist.where('tripId').equals(targetTripId).toArray();
      return items.filter(c => c.isPrivate && !c.isDeleted);
    } catch (e) {
      console.error("Error loading local private checklist items:", e);
      return [];
    }
  }, [tripId, activeSubTab]) ?? [];

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenuId]);

  const [form, setForm] = useState({ 
    title: '',
    category: 'Giấy tờ',
    quantity: 1,
    assignedTo: '',
    priority: 'normal' as 'normal' | 'important' | 'required',
    note: ''
  });
  const [showValidationError, setShowValidationError] = useState(false);
  
  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';
  const canModifyPrivate = activeSubTab === 'private';
  const canAdd = isRequestEdit || canModifyPrivate;
  const canToggle = isRequestEdit || canModifyPrivate;

  useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      if (editingId) {
        const item = activeSubTab === 'private'
          ? localPrivateItems.find(c => String(c.id) === editingId)
          : checklist.find(c => String(c.id) === editingId);
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
  }, [editingId, isFormOpen, checklist, localPrivateItems, activeSubTab]);

  function startAdd() { setEditingId(null); setIsFormOpen(true); }
  function startEdit(item: ChecklistItem) { setEditingId(String(item.id)); setIsFormOpen(true); }

  // Merge pending change requests into checklist for visual diffs
  const mergedChecklist = React.useMemo(() => {
    const list = checklist.filter((c: any) => !c.isDeleted).map(item => {
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

    const pendingCreates = changeRequests.filter(r => r.section === 'checklist' && r.action === 'create' && r.status === 'pending');
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

  const displayedChecklist = activeSubTab === 'private' ? localPrivateItems : mergedChecklist;

  async function handleToggle(item: ChecklistItem) {
    if (activeSubTab === 'private') {
      try {
        await db.checklist.update(Number(item.id), { completed: !item.completed });
      } catch (e: any) {
        showToast("Lỗi: " + e.message, "error");
      }
      return;
    }
    if (!isRequestEdit) return;
    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: String(item.id), before: item as any, after: { completed: !item.completed }, status, requesterName: guestName });
      showToast(isDirectEdit ? 'Đã cập nhật trạng thái!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }
    
    if (activeSubTab === 'private') {
      if (!tripId) {
        showToast("Lỗi: Không xác định được chuyến đi", "error");
        return;
      }
      const targetTripId = typeof tripId === 'number' ? tripId : (isNaN(Number(tripId)) ? tripId : Number(tripId));
      try {
        if (editingId) {
          await db.checklist.update(Number(editingId), {
            title: form.title.trim(),
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            updatedAt: new Date().toISOString()
          });
          showToast("Đã cập nhật chuẩn bị cá nhân!");
        } else {
          await db.checklist.add({
            tripId: targetTripId as any,
            section: 'Before Trip',
            title: form.title.trim(),
            completed: false,
            isPrivate: true,
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          showToast("Đã thêm chuẩn bị cá nhân!");
        }
        setIsFormOpen(false);
        setEditingId(null);
      } catch (e: any) {
        showToast("Lỗi khi lưu: " + e.message, "error");
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
      section: 'Before Trip' as const,
      completed: false
    };

    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.';
      if (!editingId) {
        await submitChangeRequest(token, { section: 'checklist', action: 'create', after: payload, status, requesterName: guestName });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const before = checklist.find(c => String(c.id) === editingId);
        await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: editingId, before: before as any, after: payload, status, requesterName: guestName });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) { showToast((isDirectEdit ? 'Lỗi cập nhật: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = checklist.find(c => String(c.id) === id);
      await submitChangeRequest(token, { 
        section: 'checklist', 
        action: 'delete', 
        targetId: id, 
        before: before as any, 
        status: isDirectEdit ? 'auto_approved' : undefined,
        requesterName: guestName 
      });
      showToast(isDirectEdit ? 'Đã xóa trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast((isDirectEdit ? 'Lỗi xóa: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-50 text-purple-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-[#030D2E]">Danh sách chuẩn bị</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
              Chuẩn bị hành lý và đồ dùng trước chuyến đi
            </p>
          </div>
        </div>
        {displayedChecklist.length > 0 && (
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100/50">
            Đã xong {displayedChecklist.filter(c => c.completed).length}/{displayedChecklist.length}
          </span>
        )}
      </div>

      {/* Switcher Tab Slider */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl mb-4 relative z-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('shared')}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer",
            activeSubTab === 'shared'
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          Chung
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('private')}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === 'private'
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          Cá nhân
          {localPrivateItems.length > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 text-[9.5px] font-black px-1 rounded-full bg-purple-650 text-white">
              {localPrivateItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-2.5 mt-2">
        {displayedChecklist.map((c) => {
          const isPending = c.isPendingCreate || c.isPendingUpdate || c.isPendingDelete;
          return (
            <div 
              key={c.id} 
              onClick={() => handleToggle(c)}
              className={classNames(
                "flex justify-between items-center p-3.5 transition-all rounded-2xl border", 
                canToggle ? "cursor-pointer" : "cursor-default",
                c.completed 
                  ? "bg-slate-50/50 border-slate-100/80 opacity-80" 
                  : "bg-white border-slate-100 hover:border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]",
                c.isPendingCreate || c.isPendingUpdate ? "bg-sky-50/40 border-sky-100/50" : "",
                c.isPendingDelete ? "bg-slate-50/30 border-rose-100 opacity-70 pointer-events-none" : ""
              )}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Interactive Checkbox */}
                {canToggle ? (
                  <div className="flex-shrink-0 mt-0.5">
                    {c.completed ? (
                      <div className="w-5.5 h-5.5 rounded-lg bg-purple-600 text-white flex items-center justify-center transition-all scale-100 shadow-sm shadow-purple-200">
                        <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg border-2 border-slate-300 hover:border-purple-500 bg-white transition-all scale-100" />
                    )}
                  </div>
                ) : (
                  <div className="flex-shrink-0 mt-0.5">
                    {c.completed ? (
                      <div className="w-5.5 h-5.5 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg border-2 border-slate-200 bg-slate-50" />
                    )}
                  </div>
                )}

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={classNames(
                      "text-[14px] font-bold break-words leading-tight", 
                      c.completed ? 'text-slate-400 line-through font-medium' : 'text-[#030D2E]',
                      c.isPendingDelete ? 'line-through text-slate-400 opacity-60 font-medium' : ''
                    )}>
                      {c.title}
                    </span>
                    {c.quantity && c.quantity > 1 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-extrabold text-slate-500">
                        x{c.quantity}
                      </span>
                    )}

                    {/* Pending Request Status Badges */}
                    {c.isPendingDelete && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang xóa...' : 'Đề xuất xóa'}
                      </span>
                    )}
                    {c.isPendingCreate && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất mới'}
                      </span>
                    )}
                    {c.isPendingUpdate && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất sửa'}
                      </span>
                    )}
                  </div>

                  {/* Metadata and Badges */}
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    {c.category && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        {(() => {
                          const CatIcon = CATEGORY_ICONS[c.category] || Package;
                          return <CatIcon className="h-3 w-3 text-slate-400" />;
                        })()}
                        {c.category}
                      </span>
                    )}

                    {c.assignedTo && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 75%, 95%)`,
                          color: `hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 70%, 35%)`,
                          border: `1px solid hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 70%, 90%)`
                        }}
                      >
                        <User className="h-2.5 w-2.5" />
                        {c.assignedTo}
                      </span>
                    )}

                    {c.priority && c.priority !== 'normal' && (
                      <span className={classNames(
                        "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide",
                        c.priority === 'required' ? "bg-rose-50 text-rose-600 border border-rose-100/50" : "bg-amber-50 text-amber-600 border border-amber-100/50"
                      )}>
                        {c.priority === 'required' ? 'Bắt buộc' : 'Quan trọng'}
                      </span>
                    )}
                  </div>

                  {/* Note */}
                  {c.note && (
                    <p className="text-[11.5px] text-slate-400 mt-1 pl-1.5 border-l-2 border-slate-200 italic font-medium">
                      {c.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              {((activeSubTab === 'private') || (isRequestEdit && !isPending)) && (
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
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all focus:outline-none"
                    title={activeSubTab === 'private' ? "Tùy chọn" : "Tùy chọn đề xuất"}
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {displayedChecklist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 my-2">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-3">
            <Luggage className="h-6 w-6" />
          </div>
          <h4 className="text-[14px] font-bold text-[#030D2E]">
            {activeSubTab === 'private' ? "Chưa có chuẩn bị cá nhân" : "Chưa có chuẩn bị nào"}
          </h4>
          <p className="text-[11.5px] text-slate-400 mt-1 font-bold max-w-[220px]">
            {activeSubTab === 'private' 
              ? "Thêm đồ dùng của riêng bạn (chỉ mình bạn thấy) tại đây"
              : "Hãy thêm các vật dụng cần thiết để chuẩn bị cho chuyến đi"}
          </p>
        </div>
      )}

      {activeMenuId && menuPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[998]" 
            onClick={() => {
              setActiveMenuId(null);
              setMenuPos(null);
            }}
          />
          <div 
            className="fixed z-[999] w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 animate-fadeIn"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                const item = activeSubTab === 'private' 
                  ? localPrivateItems.find(x => String(x.id) === id)
                  : checklist.find(x => String(x.id) === id);
                if (item) startEdit(item);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {activeSubTab === 'private' ? "Sửa" : (isDirectEdit ? "Sửa" : "Đề xuất sửa")}
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              {activeSubTab === 'private' ? "Xóa" : (isDirectEdit ? "Xóa" : "Đề xuất xóa")}
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Add Button */}
      {canAdd && (
        <button 
          onClick={startAdd} 
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 text-[13.5px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100/80 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-purple-100/30"
          title={activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : (isDirectEdit ? "Thêm chuẩn bị" : "Đề xuất thêm")}
        >
          <Plus className="h-4 w-4 stroke-[3]" /> 
          {activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : (isDirectEdit ? "Thêm chuẩn bị" : "Đề xuất thêm")}
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={activeSubTab === 'private' 
          ? (editingId ? "Sửa chuẩn bị cá nhân" : "Thêm chuẩn bị cá nhân")
          : (isDirectEdit ? (editingId ? "Sửa chuẩn bị" : "Thêm chuẩn bị") : (editingId ? "Đề xuất sửa chuẩn bị" : "Đề xuất thêm chuẩn bị"))}
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
                options={[
                  "", 
                  ...(form.assignedTo && !members.some(m => m.name === form.assignedTo) ? [form.assignedTo] : []),
                  ...members.map(m => m.name)
                ]}
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
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#030D2E] font-black text-white hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
          >
            {activeSubTab === 'private' 
              ? (editingId ? "Lưu thay đổi" : "Thêm vào hành lý") 
              : (isDirectEdit ? (editingId ? "Lưu thay đổi" : "Thêm chuẩn bị") : (editingId ? "Gửi đề xuất sửa" : "Gửi đề xuất thêm"))}
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
        title={activeSubTab === 'private' ? "Xóa mục chuẩn bị cá nhân?" : "Đề xuất xóa mục này?"}
        description={activeSubTab === 'private' ? "Hành động này sẽ xóa vĩnh viễn mục chuẩn bị cá nhân của bạn và không thể hoàn tác." : "Bạn đang gửi đề xuất xóa mục chuẩn bị này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}
        confirmLabel={activeSubTab === 'private' ? "Xóa" : "Đề xuất xóa"}
        itemName={
          activeSubTab === 'private' 
            ? localPrivateItems.find(c => String(c.id) === deleteTargetId)?.title
            : checklist.find(c => String(c.id) === deleteTargetId)?.title
        }
      />
    </section>
  );
}


const moodOptionList: Array<{ value: "good" | "okay" | "great" | "very_bad" | "bad"; label: string }> = [
  { value: "good", label: "Vui" },
  { value: "okay", label: "Bình yên" },
  { value: "great", label: "Hào hứng" },
  { value: "very_bad", label: "Mệt" },
  { value: "bad", label: "Bất ngờ" }
];

const moodBadgeClasses: Record<string, string> = {
  good: "bg-amber-50 text-amber-800 border-amber-200",
  okay: "bg-emerald-50 text-emerald-800 border-emerald-200",
  great: "bg-rose-50 text-rose-800 border-rose-200",
  very_bad: "bg-slate-100 text-slate-700 border-slate-300",
  bad: "bg-blue-50 text-blue-800 border-blue-200"
};

const moodColorClasses: Record<string, string> = {
  good: "bg-amber-500",
  okay: "bg-emerald-500",
  great: "bg-rose-500",
  very_bad: "bg-slate-400",
  bad: "bg-blue-500"
};

const promptSuggestions = [
  "Điều muốn nhớ nhất",
  "Món ăn đáng nhớ",
  "Người bạn đã gặp",
  "Khoảnh khắc vui",
  "Điều muốn nhớ mãi"
];

export function SharedJournalsSection({ 
  tripId,
  token, 
  mode, 
  journals, 
  changeRequests = [],
  guestName,
  members = [],
  renderChatBox
}: { 
  tripId: string | number;
  token: string; 
  mode: string; 
  journals: JournalEntry[]; 
  changeRequests?: any[];
  guestName?: string;
  members?: Member[];
  renderChatBox?: () => React.ReactNode;
}) {
  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<JournalEntry | null>(null);
  const [journalMode, setJournalMode] = React.useState<"posts" | "chat">("posts");

  const [activeReactionPopover, setActiveReactionPopover] = React.useState<string | number | null>(null);
  const resolvedGuestName = guestName || "Khách";

  async function handleToggleReaction(entry: JournalEntry, emoji: string) {
    const reactions = { ...(entry.reactions || {}) };
    const currentUsers = [...(reactions[emoji] || [])];
    
    if (currentUsers.includes(resolvedGuestName)) {
      reactions[emoji] = currentUsers.filter(u => u !== resolvedGuestName);
    } else {
      reactions[emoji] = [...currentUsers, resolvedGuestName];
    }
    
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
    
    try {
      await submitChangeRequest(token, {
        section: 'journals',
        action: 'update',
        targetId: String(entry.id),
        before: entry as any,
        after: { ...entry, reactions } as any,
        status: 'auto_approved',
        requesterName: resolvedGuestName
      });
    } catch (e: any) {
      showToast("Lỗi: " + e.message, "error");
    }
  }
  const [form, setForm] = React.useState({ 
    date: new Date().toISOString().split('T')[0], 
    title: "", 
    content: "", 
    mood: "good" as "good" | "okay" | "great" | "very_bad" | "bad", 
    imageUrl: "" 
  });
  const [uploading, setUploading] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadJournalImage(file, tripId); 
      setForm(prev => ({ ...prev, imageUrl: url }));
      setDirty(true);
    } catch (err) {
      showToast("Lỗi tải ảnh lên. Vui lòng thử lại.", "error");
    } finally {
      setUploading(false);
    }
  };

  const mergedJournals = React.useMemo(() => {
    const list = [...journals].filter((j: any) => !j.isDeleted);
    const creations = changeRequests.filter(r => r.section === 'journals' && r.action === 'create' && r.status === 'pending');
    creations.forEach(r => {
      list.push({ id: r.id, ...(r.after as any) });
    });

    // sort descending by postedAt (ISO timestamp) → ngày mới nhất + giờ mới nhất lên đầu
    list.sort((a, b) => {
      const ta = a.postedAt || `${a.date}T00:00:00`;
      const tb = b.postedAt || `${b.date}T00:00:00`;
      return tb.localeCompare(ta);
    });

    return list.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      const autoApprovedDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id) && r.status === 'auto_approved');
      
      if (autoApprovedDelete) return null;

      const latestUpdate = changeRequests.filter(r => r.section === 'journals' && r.action === 'update' && String(r.targetId) === String(item.id) && (r.status === 'pending' || r.status === 'auto_approved')).pop();
      const mergedItem = latestUpdate ? { ...item, ...latestUpdate.after } : item;
      return { ...mergedItem, isPendingDelete: pendingDelete };
    }).filter(Boolean) as any[];
  }, [journals, changeRequests]);

  const titleError = !form.title.trim() ? "Vui lòng nhập tiêu đề." : "";
  const contentError = !form.content.trim() ? "Vui lòng nhập nội dung bài viết." : "";
  const hasError = !!titleError || !!contentError;

  async function handleCreate() {
    setSubmitAttempted(true);
    if (hasError) return;
    try {
      const identity = getIdentity('any');
      const now = new Date().toISOString();
      const payload = {
        date: form.date,
        title: form.title.trim(),
        content: form.content.trim(),
        mood: form.mood,
        imageUrl: form.imageUrl || undefined,
        authorId: identity?.id || "guest",
        authorName: guestName || identity?.name || "Khách",
        postedAt: now,
      };
      await submitChangeRequest(token, { section: 'journals', action: 'create', after: payload, status: 'auto_approved', requesterName: guestName });
      setForm({ date: new Date().toISOString().split('T')[0], title: "", content: "", mood: "good", imageUrl: "" });
      setSubmitAttempted(false);
      setDirty(false);
      setIsFormOpen(false);
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  function handlePromptClick(prompt: string) {
    setForm(prev => ({
      ...prev,
      content: prev.content + (prev.content.trim() ? "\n\n" : "") + `- ${prompt}: `
    }));
    setDirty(true);
  }

  async function handleDelete(j: JournalEntry) {
    setDeleteTargetId(j);
  }

  async function executeDelete(j: JournalEntry) {
    try {
      const autoApprove = isDirectEdit || j.authorName === resolvedGuestName;
      await submitChangeRequest(token, { 
        section: 'journals', 
        action: 'delete', 
        targetId: String(j.id), 
        before: j as any, 
        requesterName: guestName,
        status: autoApprove ? 'auto_approved' : undefined
      });
      showToast(autoApprove ? 'Đã xóa bài viết.' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-sky-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Bản tin chuyến đi</h3>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        {renderChatBox ? (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:max-w-[320px] shadow-inner">
            <button
              onClick={() => setJournalMode("posts")}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-[12px] transition-all duration-200 flex items-center justify-center gap-2 ${
                journalMode === "posts" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Globe className="w-4 h-4" /> Bản tin
            </button>
            <button
              onClick={() => setJournalMode("chat")}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-[12px] transition-all duration-200 flex items-center justify-center gap-2 ${
                journalMode === "chat" ? "bg-white text-[#00BFB7] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MessageCircle className="w-4 h-4" /> Trò chuyện
            </button>
          </div>
        ) : (
          <div />
        )}

        {isRequestEdit && journalMode === "posts" && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#030D2E] text-white font-bold rounded-[14px] text-[13px] hover:bg-[#030D2E]/90 transition-all shadow-sm shrink-0 motion-press"
          >
            <Pencil className="h-4 w-4" /> Đăng bài viết
          </button>
        )}
      </div>

      {journalMode === "posts" ? (
        mergedJournals.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(
              mergedJournals.reduce<Record<string, any[]>>((result, entry) => {
                result[entry.date] = [...(result[entry.date] ?? []), entry];
                return result;
              }, {})
            )
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, entries]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <CalendarDays className="h-4.5 w-4.5 text-slate-400" />
                  <h3 className="text-[15px] font-extrabold text-[#030D2E]">{formatDate(date)}</h3>
                </div>
                
                <div className="columns-1 md:columns-2 gap-4">
                  {entries.map((j: any, idx) => {
                    const moodBadge = moodBadgeClasses[j.mood] || "bg-slate-50 text-slate-700 border-slate-200";
                    return (
                      <article 
                        key={j.id} 
                        className={classNames(
                          "break-inside-avoid mb-4 group rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] shadow-soft hover:shadow-md transition-all flex flex-col overflow-hidden",
                          j.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 pb-3">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              let authorMember = members.find(m => 
                                (j.authorName || "").trim().toLowerCase() === m.name.trim().toLowerCase()
                              );
                              if (!authorMember && (
                                (j.authorName || "").trim().toLowerCase() === "trưởng nhóm" ||
                                (j.authorName || "").trim().toLowerCase() === "trường nhóm"
                              )) {
                                authorMember = members.find(m => {
                                  const r = (m.role || "").toLowerCase();
                                  return r.includes("trưởng nhóm") || r.includes("trưởng đoàn") || r.includes("người đại diện");
                                });
                              }
                              let avatar = authorMember?.avatar;
                              if (!avatar) {
                                const authorName = j.authorName || "Trường nhóm";
                                let hash = 0;
                                for (let i = 0; i < authorName.length; i++) {
                                  hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
                                }
                                const genderChar = (authorName.toLowerCase().includes("nữ") || 
                                                    authorName.toLowerCase().includes("chị") || 
                                                    authorName.toLowerCase().includes("mẹ") || 
                                                    authorName.toLowerCase().includes("cô") || 
                                                    authorName.toLowerCase().includes("bà")) ? "f" : "m";
                                const num = (Math.abs(hash) % 10) + 1;
                                avatar = `${genderChar}${num}`;
                              }
                              return (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-black text-[15px]">
                                  {getAvatarSvg(avatar, "w-full h-full")}
                                </div>
                              );
                            })()}
                            <div className="flex flex-col">
                              <span className="text-[14px] font-extrabold text-slate-800">{j.authorName || "Trưởng nhóm"}</span>
                              {j.isPendingDelete ? (
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Đề xuất xóa</span>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border ${moodBadge}`}>
                                    {moodLabels[j.mood as keyof typeof moodLabels] || "Đáng nhớ"}
                                  </span>
                                  {j.postedAt && (
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {new Date(j.postedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isRequestEdit && !j.isPendingDelete && (isDirectEdit || j.authorName === resolvedGuestName) && (
                            <button 
                              onClick={() => handleDelete(j as JournalEntry)} 
                              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all motion-press"
                              title={isDirectEdit || j.authorName === resolvedGuestName ? "Xóa bài viết" : "Đề xuất xóa bài viết"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {j.imageUrl && (
                          <div className="w-full bg-[#F3F4F6] border-y border-slate-100/50 flex justify-center">
                            <img src={j.imageUrl} alt="Journal" className="w-full h-auto max-h-[500px] object-contain" />
                          </div>
                        )}

                        <div className="p-4 pt-3">
                          <h4 className="text-[17px] font-black text-[#030D2E] leading-snug break-words">
                            {j.title || "Bản tin chuyến đi"}
                          </h4>
                          <p className={classNames(
                            "mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-slate-600",
                            j.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                          )}>
                            {j.content}
                          </p>
                        </div>

                        {/* Reactions bar */}
                        <div className="px-4 pb-3.5 pt-2.5 border-t border-slate-100/60 flex flex-wrap items-center justify-between gap-2 bg-slate-50/20">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(j.reactions || {}).map(([emoji, usersVal]) => {
                              const users = usersVal as string[];
                              if (!users || users.length === 0) return null;
                              const hasReacted = users.includes(resolvedGuestName);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(j, emoji)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] border transition-all active:scale-95 ${
                                    hasReacted
                                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-700 font-bold"
                                      : "bg-slate-50/80 border-slate-205 text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title={users.join(", ")}
                                >
                                  <span className="text-[14px]">{emoji}</span>
                                  <span className="text-[11.5px] font-black">{users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Reaction Selector Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveReactionPopover(activeReactionPopover === j.id ? null : (j.id || null))}
                              className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-full border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-650 transition-colors text-[11.5px] font-bold"
                            >
                              <span>+ Thả cảm xúc</span>
                            </button>
                            
                            {activeReactionPopover === j.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveReactionPopover(null)} />
                                <div className="absolute right-0 bottom-full mb-2 z-50 flex gap-1 bg-white border border-slate-200/80 p-1 rounded-full shadow-floating animate-scaleIn">
                                  {["❤️", "👍", "😂", "😮", "😢"].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        handleToggleReaction(j, emoji);
                                        setActiveReactionPopover(null);
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-slate-50 active:scale-125 transition-transform rounded-full"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-slate-400 text-sm font-medium py-4">Chưa có bài viết nào.</p>
          </div>
        )
      ) : (
        <div className="mt-4">
          {renderChatBox?.()}
        </div>
      )}

      <BottomSheet 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
        }} 
        title="Đăng bài viết bản tin"
        footer={
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={hasError}
              onClick={handleCreate}
              className="flex-[2] inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#030D2E] text-white px-6 font-black hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
            >
              <Save className="h-4.5 w-4.5" strokeWidth={2.5} />
              Đăng bài viết
            </button>
          </div>
        }
      >
        <div className="space-y-4 md:space-y-5">
          {/* Date Field */}
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Ngày ghi lại
                </span>
              } 
              type="date" 
              value={form.date} 
              onChange={(date) => { setForm({ ...form, date }); setDirty(true); }} 
            />
          </div>
  
          {/* Title Field */}
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-slate-500" />
                  Tiêu đề bài viết *
                </span>
              } 
              value={form.title} 
              onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
              placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu" 
            />
            {(dirty || submitAttempted) && titleError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
            )}
          </div>
  
          {/* Mood Chips */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <SmilePlus className="h-4 w-4 text-slate-500" />
              Cảm xúc hôm nay
            </span>
            <div className="flex flex-wrap gap-2">
              {moodOptionList.map((opt) => {
                const isActive = form.mood === opt.value;
                const colorDot = moodColorClasses[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setForm({ ...form, mood: opt.value as any }); setDirty(true); }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold border transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-[#00BFB7]/10 border-[#00BFB7] text-[#030D2E]"
                        : "bg-[#FFFDF8] border-[#E8E1D8] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${colorDot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
  
          {/* Content Field */}
          <div>
            <Textarea 
              label={
                <span className="flex items-center gap-1.5">
                  <NotebookPen className="h-4 w-4 text-slate-500" />
                  Câu chuyện của bạn *
                </span>
              } 
              value={form.content} 
              onChange={(content) => { setForm({ ...form, content }); setDirty(true); }} 
              placeholder="Ghi lại cảm xúc, câu chuyện, món ăn ngon hoặc khoảnh khắc đáng nhớ..." 
            />
            {(dirty || submitAttempted) && contentError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{contentError}</p>
            )}
          </div>
  
          {/* Image Field */}
          <div>
            {form.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={form.imageUrl} alt="Uploaded" className="w-full aspect-[4/3] object-contain" />
                <button
                  onClick={() => { setForm({ ...form, imageUrl: "" }); setDirty(true); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] hover:bg-slate-100 hover:text-[#00BFB7] transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Đang tải ảnh...</>
                  ) : (
                    <><ImageIcon className="h-5 w-5" /> Đính kèm hình ảnh</>
                  )}
                </button>
              </div>
            )}
          </div>
  
          {/* Quick Prompts Section inside Modal */}
          <div className="pt-1">
            <span className="mb-2 block text-[12.5px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-slate-500" />
              Gợi ý viết nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-lg bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  + {prompt}
                </button>
              ))}
            </div>
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
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Xóa bài viết?"
            : "Đề xuất xóa bài viết?"
        }
        description={
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
            : "Bạn đang gửi đề xuất xóa bài viết này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."
        }
        confirmLabel={
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Xóa"
            : "Đề xuất xóa"
        }
        itemName={deleteTargetId?.title}
      />
    </section>
  );
}

export function SharedDocumentsSection({ 
  token, 
  mode, 
  documents, 
  changeRequests = [],
  guestName
}: { 
  token: string; 
  mode: string; 
  documents: TravelDocument[]; 
  changeRequests?: any[];
  guestName?: string;
}) {
  const isRequestEdit = mode === 'request_edit';
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<TravelDocument | null>(null);

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
    setDeleteTargetId(d);
  }

  async function executeDelete(d: TravelDocument) {
    try {
      await submitChangeRequest(token, { section: 'travelDocuments', action: 'delete', targetId: String(d.id), before: d as any, requesterName: guestName });
      showToast('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
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
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 transition-all active:scale-95 shadow-sm bg-white shrink-0"
                  title="Đề xuất xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className={classNames(
              "text-[13px] text-slate-500",
              d.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
            )}>
              {d.note}
            </span>
            
            {/* Attachment Image Display */}
            {d.attachmentUrl && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ảnh đính kèm</p>
                <div 
                  className={classNames(
                    "relative w-full rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-[#F8F9FA] flex justify-center items-center",
                    d.isPendingDelete ? "opacity-60 grayscale" : ""
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!d.isPendingDelete) setPreviewImage(d.attachmentUrl || null);
                  }}
                >
                  <img 
                    src={d.attachmentUrl} 
                    alt={d.title}
                    loading="lazy"
                    className="w-full h-auto max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {!d.isPendingDelete && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <img 
            src={previewImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              setPreviewImage(null); 
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await executeDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title="Đề xuất xóa tài liệu?"
        description="Bạn đang gửi đề xuất xóa tài liệu này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."
        confirmLabel="Đề xuất xóa"
        itemName={deleteTargetId?.title}
      />
    </section>
  );
}

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
  guestName
}: { 
  token: string; 
  mode: string; 
  members?: LocalMember[]; 
  checklist?: ChecklistItem[]; 
  expenses?: Expense[]; 
  changeRequests?: any[]; 
  guestName?: string; 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const [roleChangeMemberId, setRoleChangeMemberId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Người đồng hành']);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenuId]);

  const [form, setForm] = useState({
    name: '',
    role: 'Người đồng hành',
    gender: 'male'
  });
  const [showValidationError, setShowValidationError] = useState(false);

  const isRequestEdit = mode === 'request_edit';

  const mergedMembers = React.useMemo(() => {
    const list: LocalMember[] = members.filter((m: any) => !m.isDeleted).map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'members' && r.action === 'delete' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      const updateReq = changeRequests.find(r => r.section === 'members' && r.action === 'update' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      
      if (updateReq) {
        return {
          ...item,
          role: updateReq.after?.role as string,
          isPendingUpdate: true,
          isPendingDelete: pendingDelete
        };
      }
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'members' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach(r => {
      list.push({
        id: ("pending-create-" + r.id) as any,
        ...r.after,
        isPendingCreate: true
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

  async function handleRoleChangeSubmit() {
    if (!roleChangeMemberId) return;
    const member = members.find(m => String(m.id) === roleChangeMemberId);
    if (!member) return;

    const finalRole = selectedRoles.join(", ");
    if (!finalRole) {
      showToast('Vui lòng chọn vai trò mới.', 'error');
      return;
    }

    const payload = {
      section: 'members' as const,
      action: 'update' as const,
      targetId: String(member.id),
      before: {
        id: member.id,
        name: member.name,
        role: member.role || 'Người đồng hành',
        avatar: member.avatar
      },
      after: {
        id: member.id,
        name: member.name,
        role: finalRole,
        avatar: member.avatar
      },
      requesterName: guestName
    };

    try {
      await submitChangeRequest(token, payload);
      setRoleChangeMemberId(null);
      showToast('Đã gửi đề xuất thay đổi vai trò. Chủ nhóm sẽ duyệt.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  async function handleAdd() {
    setForm({ name: '', role: 'Người đồng hành', gender: 'male' });
    setShowValidationError(false);
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setShowValidationError(true);
      return;
    }

    const existingAvatars = mergedMembers.map(m => m.avatar).filter(Boolean) as string[];
    const randAvatar = getRandomAvatarId(form.gender, existingAvatars);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || 'Người đồng hành',
      avatar: randAvatar,
      isOwner: false
    };

    try {
      await submitChangeRequest(token, {
        section: 'members',
        action: 'create',
        after: payload,
        requesterName: guestName
      });
      setIsFormOpen(false);
      showToast('Đã gửi đề xuất thêm thành viên. Chủ nhóm sẽ duyệt.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = members.find(m => String(m.id) === id);
      await submitChangeRequest(token, {
        section: 'members',
        action: 'delete',
        targetId: id,
        before: before as any,
        requesterName: guestName
      });
      showToast('Đã gửi đề xuất xóa thành viên.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Thành viên</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mergedMembers.map((member) => {
          const isPending = member.isPendingCreate || member.isPendingDelete;
          const initial = member.name.trim().charAt(0).toUpperCase() || "?";
          
          // Helper computations
          const assignedTasksCount = checklist.filter(c => c.assignedTo === member.name).length;
          const memberExpenses = expenses.filter(e => e.payer === member.name);
          const paidExpensesCount = memberExpenses.length;
          const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
          const roleLower = (member.role || "").trim().toLowerCase();
          const isLeader = roleLower.includes("trưởng nhóm") || roleLower.includes("trưởng đoàn") || roleLower.includes("leader");
          const isCost = roleLower.includes("quản lý chi phí");
          const isDriver = roleLower.includes("tài xế");
          const isGuide = roleLower.includes("dẫn đường");
          const isLuggage = roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");
          
          let cardBg = "bg-gradient-to-br from-slate-50/20 via-white to-white border-slate-200/60";
          let borderAccent = "border-l-4 border-l-slate-400";
          
          if (member.isPendingCreate) {
            cardBg = "bg-gradient-to-br from-sky-55/40 via-white to-white border-sky-200/80";
            borderAccent = "border-l-4 border-l-sky-500";
          } else if (member.isPendingDelete) {
            cardBg = "bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200/80 opacity-80";
            borderAccent = "border-l-4 border-l-rose-450";
          } else if (isLeader) {
            cardBg = "bg-gradient-to-br from-amber-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-amber-500";
          } else if (isCost) {
            cardBg = "bg-gradient-to-br from-emerald-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-emerald-500";
          } else if (isDriver) {
            cardBg = "bg-gradient-to-br from-blue-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-blue-500";
          } else if (isGuide) {
            cardBg = "bg-gradient-to-br from-sky-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-sky-500";
          } else if (isLuggage) {
            cardBg = "bg-gradient-to-br from-indigo-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-indigo-500";
          }

          const renderRoleBadge = (roleStr: string) => {
            const roles = (roleStr || "Người đồng hành").split(",").map(r => r.trim()).filter(Boolean);
            if (roles.length === 0) roles.push("Người đồng hành");

            return (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {roles.map((r, idx) => {
                  const rLower = r.toLowerCase();
                  if (rLower.includes("trưởng nhóm") || rLower.includes("trưởng đoàn") || rLower.includes("leader")) {
                    return (
                      <span key={idx} title="Trưởng nhóm" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                      </span>
                    );
                  }
                  if (rLower.includes("quản lý chi phí")) {
                    return (
                      <span key={idx} title="Quản lý chi phí" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <WalletCards className="w-4 h-4 text-emerald-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("tài xế")) {
                    return (
                      <span key={idx} title="Tài xế" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <Car className="w-4 h-4 text-blue-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("dẫn đường")) {
                    return (
                      <span key={idx} title="Dẫn đường" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 text-sky-700 border border-sky-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <Compass className="w-4 h-4 text-sky-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
                    return (
                      <span key={idx} title="Hành lý" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <Luggage className="w-4 h-4 text-indigo-500" />
                      </span>
                    );
                  }
                  return (
                    <span key={idx} title="Bạn đồng hành" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                      <Users className="w-4 h-4 text-slate-400" />
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    {member.avatar ? (
                      getAvatarSvg(member.avatar, "w-full h-full")
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-600 text-[18px] font-black">
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Member details */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={classNames(
                          "text-[16.5px] font-extrabold text-[#030D2E] truncate leading-tight",
                          member.isPendingDelete ? "line-through text-slate-400" : ""
                        )}>
                          {member.name}
                        </h4>
                        {renderRoleBadge(member.role || "Người đồng hành")}
                      </div>
                      {member.isPendingCreate && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-pulse">
                          Đề xuất mới
                        </span>
                      )}
                      {member.isPendingUpdate && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none">
                          Đề xuất đổi vai trò
                        </span>
                      )}
                      {member.isPendingDelete && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none">
                          Đề xuất xóa
                        </span>
                      )}
                    </div>
                    {member.phone && (
                      <p className="text-[13.5px] font-semibold text-slate-500">
                        SĐT: <span className="text-[#030D2E]">{member.phone}</span>
                      </p>
                    )}
                    {member.note && (
                      <p className="text-[13px] font-medium text-slate-400 italic mt-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50 break-words">
                        "{member.note}"
                      </p>
                    )}
                  </div>
                </div>

                {isRequestEdit && !isPending && member.name === guestName && !(() => {
                  const r = (member.role || "").toLowerCase();
                  return r.includes("trưởng đoàn") || r.includes("trưởng nhóm") || r.includes("người đại diện") || r.includes("leader");
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
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00BFB7]/40"
                      title="Tùy chọn đề xuất"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mini Stats Row */}
              <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2 text-[12px]">
                  <span className={classNames(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                    assignedTasksCount === 0 
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 font-semibold" 
                      : "bg-sky-50/50 border-sky-100 text-sky-700 font-bold"
                  )}>
                    <Luggage className="h-3.5 w-3.5 shrink-0" />
                    {assignedTasksCount} việc
                  </span>
                  <span className={classNames(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                    totalSpent === 0 
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 font-semibold" 
                      : "bg-emerald-50/50 border-emerald-100 text-emerald-700 font-bold"
                  )}>
                    <WalletCards className="h-3.5 w-3.5 shrink-0" />
                    Đã chi: {formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} lần)`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed-position dropdown — renders above everything */}
      {activeMenuId && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => { setActiveMenuId(null); setMenuPos(null); }}
          />
          <div
            className="fixed z-[999] w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 animate-fadeIn"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                const mem = members.find(m => String(m.id) === id);
                if (mem) {
                  setRoleChangeMemberId(id);
                  const currentRole = mem.role || 'Người đồng hành';
                  const presets = ["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"];
                  const existingRoles = currentRole.split(',').map((r: string) => r.trim()).filter((r: string) => presets.includes(r));
                  setSelectedRoles(existingRoles.length > 0 ? existingRoles : ['Người đồng hành']);
                }
              }}
              className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              Đổi vai trò
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id);
              }}
              className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Đề xuất xóa
            </button>
          </div>
        </>,
        document.body
      )}

      {isRequestEdit && (
        <button 
          onClick={handleAdd} 
          className="flex h-12 w-full items-center justify-center gap-2 text-[14px] font-bold text-[#030D2E]/80 bg-[#FFFDF8] hover:bg-slate-50 border-2 border-dashed border-slate-200/80 hover:border-indigo-200 hover:text-indigo-700 rounded-2xl transition-all active:scale-[0.99] shadow-sm shadow-slate-100"
          title="Đề xuất thêm thành viên"
        >
          <Plus className="h-4.5 w-4.5" /> Đề xuất thêm thành viên
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Đề xuất thêm thành viên"
      >
        <div className="flex flex-col gap-5 py-2">
          <Input 
            label="Tên thành viên *" 
            value={form.name} 
            onChange={(name) => {
              setForm({ ...form, name });
              setShowValidationError(false);
            }} 
            placeholder="VD: Nguyễn Văn A" 
          />
          {showValidationError && (
            <p className="text-rose-500 text-[12.5px] font-bold -mt-3 pl-1">Vui lòng nhập tên thành viên.</p>
          )}

          <div className="space-y-2">
            <span className="text-[13.5px] font-semibold text-slate-600">Giới tính (để tạo ảnh đại diện ngẫu nhiên)</span>
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'male' })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                  form.gender === 'male' ? "bg-white text-[#030D2E] shadow-sm border" : "text-slate-500"
                )}
              >
                Nam
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'female' })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                  form.gender === 'female' ? "bg-white text-[#030D2E] shadow-sm border" : "text-slate-500"
                )}
              >
                Nữ
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#030D2E] font-black text-white hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all shadow-sm"
          >
            Gửi đề xuất thêm
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
        title="Đề xuất xóa thành viên?"
        description="Bạn đang gửi đề xuất xóa thành viên này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất."
        confirmLabel="Đề xuất xóa"
        itemName={members.find(m => String(m.id) === deleteTargetId)?.name}
      />

      <BottomSheet
        isOpen={roleChangeMemberId !== null}
        onClose={() => setRoleChangeMemberId(null)}
        title="Đề xuất đổi vai trò"
      >
        <div className="flex flex-col gap-5 py-2">
          <div className="space-y-1">
            <p className="text-[13.5px] font-bold text-slate-500">
              Thành viên: <span className="font-extrabold text-[#030D2E]">{members.find(m => String(m.id) === roleChangeMemberId)?.name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-bold text-slate-700 block">Chọn vai trò mới</span>
            <div className="grid grid-cols-2 gap-2">
              {["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"].map((r) => {
                const isSelected = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoles(prev => {
                      if (r === 'Người đồng hành') return ['Người đồng hành'];
                      if (prev.includes(r)) {
                        const filtered = prev.filter(x => x !== r);
                        return filtered.length === 0 ? ['Người đồng hành'] : filtered;
                      }
                      return prev.filter(x => x !== 'Người đồng hành').concat(r);
                    })}
                    className={classNames(
                      "py-2.5 px-3 text-left text-[12.5px] font-bold rounded-xl transition-all border",
                      isSelected 
                        ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRoleChangeSubmit}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-[#030D2E] font-black text-white hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all shadow-sm"
          >
            Gửi đề xuất đổi vai trò
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}


