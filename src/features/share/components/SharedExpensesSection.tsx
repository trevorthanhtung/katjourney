import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon, CheckmarkCircle02Icon, BookOpen01Icon, File01Icon, AlertCircleIcon, Add01Icon, PenTool01Icon, Delete01Icon, MoreVerticalIcon,
  ReceiptTextIcon, UserCheck01Icon, Tag01Icon, TagsIcon, PreferenceHorizontalIcon, Route01Icon, ChevronRightIcon, BalanceScaleIcon, InformationCircleIcon, CheckIcon, Cancel01Icon, Clock01Icon,
  FileCheckIcon, ShirtIcon, Briefcase01Icon, PlugIcon, PillIcon, Bread01Icon, PackageIcon, BadgeCheckIcon, StickyNoteIcon, TextFontIcon, MinusSignIcon, UserIcon, Calendar01Icon, Maximize01Icon, Image01Icon, Loading01Icon, SmileIcon, NotebookIcon, SaveIcon, SparklesIcon, RouteIcon, HelpCircleIcon, UserGroupIcon, BubbleChatIcon, GlobeIcon,
  CrownIcon, Luggage01Icon, Car01Icon, CalculatorIcon, PieChartIcon, Search01Icon,
  Airplane01Icon, KitchenUtensilsIcon, HotelIcon, Ticket01Icon, ShoppingBag01Icon, Gamepad2Icon, CompassIcon, ChevronDownIcon, Location01Icon, LocationOfflineIcon, PencilEdit01Icon
} from "@hugeicons/core-free-icons";
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan, Member, EventItem } from '../../../db';
import { formatMoney, expenseCategories, formatDate, moodLabels, sumBy, getSettlementSuggestions, getGroupUnits, getMemberShareForExpense } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { showToast } from '../../../components/ui/ToastManager';
import { uploadJournalImage, uploadDocumentImage } from '../../../services/storageService';
import { getIdentity } from '../../../services/identityService';
import { getCurrentPosition, reverseGeocode, getCurrencyForCountry } from '../../../services/locationService';
import { BottomSheet, Input, Select, Textarea, DatePicker, DeleteConfirmModal } from '../../../components/ui';
import { getAvatarSvg, getRandomAvatarId } from '../../../utils/avatars';
import { BreakdownSection, CategoryBar, SettlementCard } from '../../expenses/ExpensesScreen';
import { fetchExchangeRates, ExchangeRate } from '../../../services/currencyService';

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

const CATEGORIES = ["Giấy tờ", "Quần áo", "Đồ cá nhân", "Thiết bị điện tử", "Thuốc & y tế", "Tiền & ví", "Đồ ăn nhẹ", "Khác"] as const;
const CATEGORY_ICONS: Record<string, any> = {
  "Giấy tờ": FileCheckIcon,
  "Quần áo": ShirtIcon,
  "Đồ cá nhân": Briefcase01Icon,
  "Thiết bị điện tử": PlugIcon,
  "Thuốc & y tế": PillIcon,
  "Tiền & ví": Wallet01Icon,
  "Đồ ăn nhẹ": Bread01Icon,
  "Khác": PackageIcon
};


export function SharedExpensesSection({ 
  trip,
  token, 
  mode, 
  expenses, 
  changeRequests = [],
  members = [],
  events = [],
  guestName
}: { 
  trip?: any;
  token: string; 
  mode: string; 
  expenses: Expense[]; 
  changeRequests?: any[];
  members?: Member[];
  events?: EventItem[];
  guestName?: string;
}) {
  const { t } = useTranslation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case "Di chuyển":
        return {
          icon: RouteIcon,
          bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-150/50 dark:border-blue-900/30"
        };
      case "Vé máy bay":
        return {
          icon: Airplane01Icon,
          bg: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-150/50 dark:border-indigo-900/30"
        };
      case "Ăn uống":
        return {
          icon: KitchenUtensilsIcon,
          bg: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-150/50 dark:border-rose-900/30"
        };
      case "Lưu trú":
        return {
          icon: HotelIcon,
          bg: "bg-slate-100 dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200 dark:border-slate-700/50"
        };
      case "Vé tham quan":
        return {
          icon: Ticket01Icon,
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-150/50 dark:border-amber-900/30"
        };
      case "Mua sắm":
        return {
          icon: ShoppingBag01Icon,
          bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-150/50 dark:border-purple-900/30"
        };
      case "Vui chơi & Giải trí":
        return {
          icon: Gamepad2Icon,
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-150/50 dark:border-emerald-900/30"
        };
      case "Chuẩn bị hành lý":
        return {
          icon: SparklesIcon,
          bg: "bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-150/50 dark:border-sky-900/30"
        };
      default:
        return {
          icon: Tag01Icon,
          bg: "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50"
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
    category: categoryOptions[0] || "Di chuyển", 
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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';

  const fetchLocationForExpense = React.useCallback(async (rates: ExchangeRate[]) => {
    // 1. Try explicit defaultCurrency
    if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {
      const matchedRate = rates.find(r => r.currencyCode === trip.defaultCurrency);
      if (matchedRate) {
        setForm(prev => ({ ...prev, currency: trip.defaultCurrency!, exchangeRate: matchedRate.transfer }));
        return; // Skip GPS if defaultCurrency is available
      }
    }
    
    // 2. Fallback to parsing destination name (if trip was shared before defaultCurrency was added)
    if (trip?.destination) {
      const destStr = String(trip.destination).toLowerCase();
      let guessedCurrency = null;
      if (destStr.includes("nhật bản") || destStr.includes("japan") || destStr.includes("tokyo")) guessedCurrency = "JPY";
      else if (destStr.includes("hàn quốc") || destStr.includes("korea") || destStr.includes("seoul")) guessedCurrency = "KRW";
      else if (destStr.includes("thái lan") || destStr.includes("thailand") || destStr.includes("bangkok")) guessedCurrency = "THB";
      else if (destStr.includes("singapore")) guessedCurrency = "SGD";
      else if (destStr.includes("trung quốc") || destStr.includes("china")) guessedCurrency = "CNY";
      else if (destStr.includes("đài loan") || destStr.includes("taiwan")) guessedCurrency = "TWD";
      else if (destStr.includes("mỹ") || destStr.includes("usa") || destStr.includes("hoa kỳ")) guessedCurrency = "USD";
      else if (destStr.includes("anh") || destStr.includes("uk") || destStr.includes("london")) guessedCurrency = "GBP";
      else if (destStr.includes("châu âu") || destStr.includes("pháp") || destStr.includes("đức") || destStr.includes("ý")) guessedCurrency = "EUR";

      if (guessedCurrency) {
        const matchedRate = rates.find(r => r.currencyCode === guessedCurrency);
        if (matchedRate) {
          setForm(prev => ({ ...prev, currency: guessedCurrency, exchangeRate: matchedRate.transfer }));
          return;
        }
      }
    }
    
    // 3. Fallback to GPS
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      const suggestedCurrency = getCurrencyForCountry(geo.countryCode);
      
      setForm(prev => {
        let newForm = { ...prev };
        if (suggestedCurrency && suggestedCurrency !== "VND") {
          const matchedRate = rates.find(r => r.currencyCode === suggestedCurrency);
          if (matchedRate) {
            newForm.currency = suggestedCurrency;
            newForm.exchangeRate = matchedRate.transfer;
          }
        }
        return newForm;
      });
    } catch (err: any) {
      // Silently ignore GPS fetch errors as it's just for currency suggestion
    }
  }, [trip]);

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
            splitMode: item.splitMode ?? "perPerson",
            splitAmong: item.splitAmong ?? [],
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            eventId: item.eventId ? String(item.eventId) : "",
            currency: item.currency || "VND",
            exchangeRate: item.exchangeRate || 1
          });
          if (item.splitType === "personal" || isCustom || item.category !== categoryOptions[0] || item.splitMode === "perGroup" || (item.splitAmong && item.splitAmong.length > 0) || item.eventId) {
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
          splitMode: "perPerson",
          splitAmong: [],
          date: new Date().toISOString().split('T')[0],
          eventId: "",
          currency: "VND",
          exchangeRate: 1
        });
        fetchLocationForExpense(exchangeRates);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, isFormOpen]);

  const filteredEvents = React.useMemo(() => {
    return [...events]
      .filter(e => !e.isDeleted)
      .sort((a, b) => {
        const dateComp = (a.date || "").localeCompare(b.date || "");
        if (dateComp !== 0) return dateComp;
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [events]);

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
      splitMode: form.splitType === "personal" ? "perPerson" : form.splitMode,
      splitAmong: form.splitType === "personal" ? [] : form.splitAmong,
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
      showToast(isDirectEdit ? t("toast.updateError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error'); 
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
      showToast(isDirectEdit ? t("toast.directDelete") : t("toast.requestSent"));
    } catch (e: any) { showToast(isDirectEdit ? t("toast.deleteError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error'); }
  }

  const activeExpenses = mergedExpenses.filter(e => !e.isPendingDelete);
  
  const totalExpense = activeExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const sharedExpensesList = activeExpenses.filter((e) => e.splitType === "shared");
  const personalExpensesList = activeExpenses.filter((e) => e.splitType === "personal");

  const totalShared = sharedExpensesList.reduce((acc, cur) => acc + cur.amount, 0);
  const totalPersonal = personalExpensesList.reduce((acc, cur) => acc + cur.amount, 0);

  const activeMembers = members.length > 0 ? members.length : 1;
  const avgPerPerson = Math.round(totalShared / activeMembers);

  const groupUnits = React.useMemo(() => getGroupUnits(members), [members]);
  const hasGroups = groupUnits.some(u => u.isGroup);
  const avgPerGroup = groupUnits.length ? Math.round(totalShared / groupUnits.length) : 0;

  const categoryBreakdown = React.useMemo(() => {
    const acc: Record<string, number> = {};
    activeExpenses.forEach((e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
    });
    return acc;
  }, [activeExpenses]);

  const exactSharesByMember = React.useMemo(() => {
    const shares: Record<string, number> = {};
    members.forEach(m => shares[m.name] = 0);
    sharedExpensesList.forEach(expense => {
      const expenseShares = getMemberShareForExpense(expense, members);
      for (const [name, amount] of Object.entries(expenseShares)) {
        if (shares[name] !== undefined) shares[name] += amount;
      }
    });
    return shares;
  }, [sharedExpensesList, members]);

  const settlements = React.useMemo(() => {
    return getSettlementSuggestions(members, sharedExpensesList);
  }, [sharedExpensesList, members]);

  const isSaveDisabled = !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  return (
    <div className="space-y-6">
      {/* Header Section (Adopted from Main View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[32px] font-extrabold text-kat-dark dark:text-white tracking-tight">Chi phí</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] mt-1">Theo dõi chi tiêu, khoản đã trả và phân chia trong chuyến đi.</p>
        </div>
        {isRequestEdit && (
          <div>
            <button 
              type="button"
              onClick={startAdd}
              className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 text-white dark:text-slate-950 px-5 text-[14px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
              {isDirectEdit ? "Thêm khoản chi" : "Đề xuất thêm"}
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-kat-surface border-t-4 border-t-kat-dark dark:border-t-kat-border/40 border-x border-b border-slate-200 dark:border-kat-border/40 p-6 md:p-8 text-kat-dark dark:text-slate-100 shadow-soft">
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
                  <p className="text-[18px] font-black text-[#00AFA8] dark:text-[#00BFB7] mt-0.5">{formatMoney(totalShared)}</p>
                </div>
                <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-[#00AFA8]/60 dark:text-[#00BFB7]/60 shrink-0 mt-0.5" />
              </div>
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Chi cá nhân</p>
                  <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">{formatMoney(totalPersonal)}</p>
                </div>
                <HugeiconsIcon icon={UserIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              </div>
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {hasGroups ? "Bình quân / nhóm" : "Bình quân / người"}
                  </p>
                  {members.length > 0 ? (
                    <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">{formatMoney(hasGroups ? avgPerGroup : avgPerPerson)}</p>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-1.5 inline-block">Chưa có người đồng hành</span>
                  )}
                </div>
                <HugeiconsIcon icon={CalculatorIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          {isRequestEdit && (
            <div className="shrink-0 flex md:hidden items-center justify-end w-full">
              <button 
                type="button"
                onClick={startAdd}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 text-white dark:text-slate-950 px-6 py-3 text-[14px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                {isDirectEdit ? "Thêm khoản chi" : "Đề xuất thêm"}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 animate-fadeIn" style={{ animationDelay: '100ms' }}>
        <section className="rounded-3xl border border-slate-100 dark:border-kat-border/40 bg-kat-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400">
              <HugeiconsIcon icon={PieChartIcon} className="h-4 w-4" />
            </span>
            <h3 className="text-[14px] font-extrabold text-kat-dark dark:text-white">Chi phí theo hạng mục</h3>
          </div>
          <BreakdownSection items={categoryBreakdown} total={totalExpense} emptyText="Chưa có khoản chi nào để phân tích." />
        </section>

        <section className="rounded-3xl border border-slate-100 dark:border-kat-border/40 bg-kat-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-[14px] font-extrabold text-kat-dark dark:text-white">Phần cần góp của từng người/nhóm</h3>
          </div>
          {members.length > 0 ? (
            <BreakdownSection items={exactSharesByMember} total={totalShared} emptyText="Chưa có khoản chi chung để phân tích." />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">Thêm người đồng hành để xem phần chi của từng người.</p>
            </div>
          )}
        </section>
      </div>

      <SettlementCard members={members} expenses={activeExpenses} settlements={settlements} />

      {/* Expenses List */}
      <section className="bg-kat-surface rounded-3xl border border-slate-200/60 dark:border-kat-border/40 p-5 shadow-sm mt-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ReceiptTextIcon} className="h-5 w-5 text-amber-500" />
            <h3 className="text-[16px] font-black text-kat-dark dark:text-white">Danh sách khoản chi</h3>
          </div>
        </div>
        {mergedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/35 dark:bg-slate-800/10 border border-dashed border-slate-200/80 dark:border-slate-700/40 my-2">
            <HugeiconsIcon icon={ReceiptTextIcon} className="h-10 w-10 text-slate-350 dark:text-slate-600 mb-2.5 animate-pulse" />
            <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500">Chưa có khoản chi nào trong danh sách</p>
            <p className="text-[11.5px] text-slate-400/80 dark:text-slate-500/80 mt-1 max-w-xs px-4">Đề xuất thêm chi phí để chia đều và quyết toán sau chuyến đi.</p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-3">
            {mergedExpenses.map((e, idx) => {
              const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;
              const catDetails = getCategoryDetails(e.category);
              const CatIcon = catDetails.icon;

              return (
                <div key={e.id || idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Icon container */}
                    <span className={classNames(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                      catDetails.bg
                    )}>
                      <HugeiconsIcon icon={CatIcon} className="h-5 w-5" />
                    </span>

                    {/* Info text stack */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={classNames(
                          "text-[14px] font-bold text-kat-dark dark:text-slate-200 break-words line-clamp-1",
                          e.isPendingDelete ? "line-through text-slate-400/60 dark:text-slate-600/60" : ""
                        )}>
                          {e.description || e.category}
                        </span>

                        {/* Pending Request Badges */}
                        {e.isPendingDelete && (
                          <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang xóa...' : 'Đề xuất xóa'}
                          </span>
                        )}
                        {e.isPendingCreate && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất mới'}
                          </span>
                        )}
                        {e.isPendingUpdate && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none animate-fadeIn">
                            {changeRequests.find(r => String(r.id) === String(e.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất sửa'}
                          </span>
                        )}
                      </div>

                      {/* Subtitle Details Line */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        {e.date && (
                          <span className="flex items-center gap-1 shrink-0">
                            <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                            {new Date(e.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        )}

                        {/* Payer info */}
                        {e.payer && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">
                              Trả bởi: <span className="text-slate-500 dark:text-slate-400 font-extrabold">{e.payer}</span>
                            </span>
                          </>
                        )}

                        {/* Split type badge */}
                        {e.splitType && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className={classNames(
                              "px-1.5 py-0.2 rounded-md text-[9.5px] font-extrabold border shrink-0",
                              e.splitType === "shared" 
                                ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/60 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400"
                            )}>
                              {e.splitType === "personal" ? "Cá nhân" : e.splitMode === "perGroup" ? "Chi theo nhóm" : "Chi chung"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and edit menu */}
                  <div className="flex items-center gap-1.5 pl-3">
                    <span className={classNames(
                      "text-[15px] font-black text-kat-dark dark:text-white whitespace-nowrap",
                      e.isPendingDelete ? "line-through text-slate-400 dark:text-slate-600 opacity-60" : ""
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-90 transition-all focus:outline-none cursor-pointer"
                          title="Tùy chọn đề xuất"
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
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
            className="fixed z-[999] w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 animate-fadeIn"
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
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              {isDirectEdit ? "Xóa chi phí" : "Đề xuất xóa"}
            </button>
          </div>
        </>,
        document.body
      )}


      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={isDirectEdit ? (editingId ? "Sửa chi phí" : "Thêm chi phí") : (editingId ? "Đề xuất sửa chi phí" : "Đề xuất thêm chi phí")}
        headerAction={
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled || isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 text-white dark:text-slate-950 px-4 text-[13.5px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] transition-all active:scale-[0.97] disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Đang lưu..." : isDirectEdit ? (editingId ? "Lưu" : "Thêm") : "Đề xuất"}
          </button>
        }
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Amount Box */}
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
                className="w-full text-center text-3xl font-black text-kat-dark dark:text-white bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
              />
            </div>
            {errors.amount && (
              <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 text-center">{errors.amount}</p>
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
            onChange={(date) => setForm({ ...form, date })} 
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

          {/* Payer Select */}
          {form.splitType === "shared" ? (
            members.length > 0 ? (
              <div>
                <Select
                  label={
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={UserCheck01Icon} className="h-4 w-4 text-slate-500" />
                      Người thanh toán
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
              <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 text-[13px] text-amber-800 dark:text-amber-400 font-semibold flex gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <span>Chuyến đi chưa có người đồng hành. Chọn "Cá nhân tự trả" hoặc đề xuất thêm người đồng hành.</span>
              </div>
            )
          ) : (
            members.length > 0 && (
              <div>
                <Select
                  label={
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={UserCheck01Icon} className="h-4 w-4 text-slate-500" />
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
              className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 hover:text-kat-dark transition-colors focus:outline-none"
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
                  <span className="text-[13.5px] font-semibold text-slate-600 flex items-center gap-1.5">
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
                  {form.splitType === "shared" && (
                    <div className="mt-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                      {!showParticipants ? (
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                              {!form.splitAmong || form.splitAmong.length === 0 ? "Tất cả mọi người" : `${form.splitAmong.length} người tham gia`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowParticipants(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-[12px] font-bold text-kat-teal border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Sửa
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-kat-teal/20 bg-teal-50/30 dark:bg-teal-900/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              Tham gia ({!form.splitAmong || form.splitAmong.length === 0 ? "Tất cả" : `${form.splitAmong.length} người`})
                            </span>
                            
                            <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, splitMode: "perPerson" }))}
                                className={classNames(
                                  "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                  form.splitMode === "perPerson" ? "bg-white dark:bg-slate-600 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                              >
                                Cá nhân
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, splitMode: "perGroup" }))}
                                className={classNames(
                                  "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                  form.splitMode === "perGroup" ? "bg-white dark:bg-slate-600 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                              >
                                Gia đình
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <button
                              type="button"
                              onClick={() => setShowParticipants(false)}
                              className="text-[12px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Đóng
                            </button>
                            {(!form.splitAmong || form.splitAmong.length > 0) && (
                              <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, splitAmong: [] }))}
                                className="text-[12px] font-bold text-kat-teal hover:underline"
                              >
                                Chọn lại tất cả
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {form.splitMode === "perGroup" ? (
                              getGroupUnits(members).map(unit => {
                                const label = unit.isGroup ? unit.groupName : unit.memberNames[0];
                                const isSelected = !form.splitAmong || form.splitAmong.length === 0 || unit.memberNames.every(name => form.splitAmong.includes(name));
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                      setForm(f => {
                                        const current = f.splitAmong || [];
                                        if (current.length === 0) {
                                          const allNames = members.map(m => m.name);
                                          const next = allNames.filter(n => !unit.memberNames.includes(n));
                                          return { ...f, splitAmong: next };
                                        } else {
                                          if (isSelected) {
                                            const next = current.filter(n => !unit.memberNames.includes(n));
                                            return { ...f, splitAmong: next.length === 0 ? [] : next };
                                          } else {
                                            const next = Array.from(new Set([...current, ...unit.memberNames]));
                                            return { ...f, splitAmong: next.length === members.length ? [] : next };
                                          }
                                        }
                                      });
                                    }}
                                    className={classNames(
                                      "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                      isSelected
                                        ? "bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30"
                                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-500/30"
                                    )}
                                  >
                                    {label}
                                  </button>
                                );
                              })
                            ) : (
                              members.map(m => {
                                const isSelected = !form.splitAmong || form.splitAmong.length === 0 || form.splitAmong.includes(m.name);
                                return (
                                  <button
                                    key={m.name}
                                    type="button"
                                    onClick={() => {
                                      setForm(f => {
                                        const current = f.splitAmong || [];
                                        if (current.length === 0) {
                                          const allNames = members.map(mem => mem.name);
                                          const next = allNames.filter(n => n !== m.name);
                                          return { ...f, splitAmong: next };
                                        } else {
                                          if (isSelected) {
                                            const next = current.filter(n => n !== m.name);
                                            return { ...f, splitAmong: next.length === 0 ? [] : next };
                                          } else {
                                            const next = [...current, m.name];
                                            return { ...f, splitAmong: next.length === members.length ? [] : next };
                                          }
                                        }
                                      });
                                    }}
                                    className={classNames(
                                      "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                      isSelected
                                        ? "bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30"
                                        : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-500/30"
                                    )}
                                  >
                                    {m.name}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
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
        title={isDirectEdit ? "Xóa khoản chi?" : "Đề xuất xóa khoản chi?"}
        description={isDirectEdit ? "Bạn có chắc chắn muốn xóa khoản chi này? Hành động này không thể hoàn tác." : "Bạn đang gửi đề xuất xóa khoản chi này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}
        confirmLabel={isDirectEdit ? "Xóa" : "Đề xuất xóa"}
        itemName={expenses.find(e => String(e.id) === deleteTargetId)?.description}
      />
      </section>
    </div>
  );
}

