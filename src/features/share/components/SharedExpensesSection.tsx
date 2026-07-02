import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CheckmarkCircle02Icon,
  BookOpen01Icon,
  File01Icon,
  AlertCircleIcon,
  Add01Icon,
  PenTool01Icon,
  Delete01Icon,
  MoreVerticalIcon,
  ReceiptTextIcon,
  UserCheck01Icon,
  Tag01Icon,
  TagsIcon,
  PreferenceHorizontalIcon,
  Route01Icon,
  ChevronRightIcon,
  BalanceScaleIcon,
  InformationCircleIcon,
  CheckIcon,
  Cancel01Icon,
  Clock01Icon,
  FileCheckIcon,
  ShirtIcon,
  Briefcase01Icon,
  PlugIcon,
  PillIcon,
  Bread01Icon,
  PackageIcon,
  BadgeCheckIcon,
  StickyNoteIcon,
  TextFontIcon,
  MinusSignIcon,
  UserIcon,
  Calendar01Icon,
  Maximize01Icon,
  Image01Icon,
  Loading01Icon,
  SmileIcon,
  NotebookIcon,
  SaveIcon,
  SparklesIcon,
  RouteIcon,
  HelpCircleIcon,
  UserGroupIcon,
  BubbleChatIcon,
  GlobeIcon,
  CrownIcon,
  Luggage01Icon,
  Car01Icon,
  CalculatorIcon,
  PieChartIcon,
  Search01Icon,
  Airplane01Icon,
  KitchenUtensilsIcon,
  HotelIcon,
  Ticket01Icon,
  ShoppingBag01Icon,
  Gamepad2Icon,
  CompassIcon,
  ChevronDownIcon,
  Location01Icon,
  LocationOfflineIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import {
  Expense,
  ChecklistItem,
  JournalEntry,
  TravelDocument,
  BackupPlan,
  Member,
  EventItem,
} from "../../../db";
import {
  formatMoney,
  expenseCategories,
  formatDate,
  moodLabels,
  sumBy,
  getSettlementSuggestions,
  getGroupUnits,
  getMemberShareForExpense,
} from "../../../utils/helpers";
import { submitChangeRequest } from "../../../services/cloudShareService";
import { showToast } from "../../../components/ui/ToastManager";
import { processLocalImage } from "../../../services/storageService";
import { getIdentity } from "../../../utils/identityCache";
import {
  getCurrentPosition,
  reverseGeocode,
  getCurrencyForCountry,
} from "../../../services/locationService";
import {
  BottomSheet,
  Input,
  Select,
  Textarea,
  DatePicker,
  DeleteConfirmModal,
} from "../../../components/ui";
import { getAvatarSvg, getRandomAvatarId } from "../../../utils/avatars";
import { BreakdownSection, CategoryBar, SettlementCard } from "../../expenses/ExpensesScreen";
import { fetchExchangeRates, ExchangeRate } from "../../../services/currencyService";
import { ExpenseItemCard } from "./ExpenseItemCard";
import { ExpenseSummaryBoard } from "./ExpenseSummaryBoard";

const classNames = (...classes: any[]) => classes.filter(Boolean).join(" ");

const CATEGORIES = [
  "documents",
  "clothing",
  "personal",
  "electronics",
  "medical",
  "money",
  "snacks",
  "other",
] as const;
const CATEGORY_ICONS: Record<string, any> = {
  documents: FileCheckIcon,
  clothing: ShirtIcon,
  personal: Briefcase01Icon,
  electronics: PlugIcon,
  medical: PillIcon,
  money: Wallet01Icon,
  snacks: Bread01Icon,
  other: PackageIcon,
};

export function SharedExpensesSection({
  trip,
  token,
  mode,
  expenses,
  changeRequests = [],
  members = [],
  events = [],
  guestName,
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
      case "transport":
        return {
          icon: RouteIcon,
          bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-150/50 dark:border-blue-900/30",
        };
      case "flight":
        return {
          icon: Airplane01Icon,
          bg: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-150/50 dark:border-indigo-900/30",
        };
      case "food":
        return {
          icon: KitchenUtensilsIcon,
          bg: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-150/50 dark:border-rose-900/30",
        };
      case "accommodation":
        return {
          icon: HotelIcon,
          bg: "bg-slate-100 dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200 dark:border-slate-700/50",
        };
      case "tickets":
        return {
          icon: Ticket01Icon,
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-150/50 dark:border-amber-900/30",
        };
      case "shopping":
        return {
          icon: ShoppingBag01Icon,
          bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-150/50 dark:border-purple-900/30",
        };
      case "entertainment":
        return {
          icon: Gamepad2Icon,
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-150/50 dark:border-emerald-900/30",
        };
      case "packing":
        return {
          icon: SparklesIcon,
          bg: "bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-150/50 dark:border-sky-900/30",
        };
      default:
        return {
          icon: Tag01Icon,
          bg: "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50",
        };
    }
  };

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeMenuId]);

  const categoryOptions = React.useMemo(() => {
    const defaultCats = expenseCategories.filter((c) => c !== "other");
    const uniqueUsedCats = Array.from(new Set(expenses.map((e) => e.category))).filter(
      (c) => !defaultCats.includes(c) && c !== "other" && c !== "other..."
    );
    return [...defaultCats, ...uniqueUsedCats, "other..."];
  }, [expenses]);

  const catMap: Record<string, string> = React.useMemo(
    () => ({
      transport: t("expenses.catTransport"),
      flight: t("expenses.catFlights"),
      food: t("expenses.catFood"),
      accommodation: t("expenses.catAccommodation"),
      tickets: t("expenses.catTickets"),
      shopping: t("expenses.catShopping"),
      entertainment: t("expenses.catEntertainment"),
      packing: t("expenses.catPreparation"),
      other: t("expenses.catOther"),
      "other...": t("expenses.catCustom"),
    }),
    [t]
  );

  const categoryLabels = React.useMemo(() => {
    const labels: Record<string, string> = { ...catMap };
    categoryOptions.forEach((c) => {
      if (!labels[c]) labels[c] = c;
    });
    return labels;
  }, [categoryOptions, catMap]);

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
    category: categoryOptions[0] || "transport",
    customCategory: "",
    splitType: "shared",
    splitMode: "perPerson",
    splitAmong: [],
    date: new Date().toISOString().split("T")[0],
    eventId: "",
    currency: "VND",
    exchangeRate: 1,
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

  const isRequestEdit = mode === "request_edit" || mode === "edit";
  const isDirectEdit = mode === "edit";

  const fetchLocationForExpense = React.useCallback(
    async (rates: ExchangeRate[]) => {
      // 1. Try explicit defaultCurrency
      if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {
        const matchedRate = rates.find((r) => r.currencyCode === trip.defaultCurrency);
        if (matchedRate) {
          setForm((prev) => ({
            ...prev,
            currency: trip.defaultCurrency!,
            exchangeRate: matchedRate.transfer,
          }));
          return; // Skip GPS if defaultCurrency is available
        }
      }

      // 2. Fallback to parsing destination name (if trip was shared before defaultCurrency was added)
      if (trip?.destination) {
        const destStr = String(trip.destination).toLowerCase();
        let guessedCurrency = null;
        if (destStr.includes("nhật bản") || destStr.includes("japan") || destStr.includes("tokyo"))
          guessedCurrency = "JPY";
        else if (
          destStr.includes("hàn quốc") ||
          destStr.includes("korea") ||
          destStr.includes("seoul")
        )
          guessedCurrency = "KRW";
        else if (
          destStr.includes("thái lan") ||
          destStr.includes("thailand") ||
          destStr.includes("bangkok")
        )
          guessedCurrency = "THB";
        else if (destStr.includes("singapore")) guessedCurrency = "SGD";
        else if (destStr.includes("trung quốc") || destStr.includes("china"))
          guessedCurrency = "CNY";
        else if (destStr.includes("đài loan") || destStr.includes("taiwan"))
          guessedCurrency = "TWD";
        else if (destStr.includes("mỹ") || destStr.includes("usa") || destStr.includes("hoa kỳ"))
          guessedCurrency = "USD";
        else if (destStr.includes("anh") || destStr.includes("uk") || destStr.includes("london"))
          guessedCurrency = "GBP";
        else if (
          destStr.includes("châu âu") ||
          destStr.includes("pháp") ||
          destStr.includes("đức") ||
          destStr.includes("ý")
        )
          guessedCurrency = "EUR";

        if (guessedCurrency) {
          const matchedRate = rates.find((r) => r.currencyCode === guessedCurrency);
          if (matchedRate) {
            setForm((prev) => ({
              ...prev,
              currency: guessedCurrency,
              exchangeRate: matchedRate.transfer,
            }));
            return;
          }
        }
      }

      // 3. Fallback to GPS
      try {
        const pos = await getCurrentPosition();
        const geo = await reverseGeocode(pos.latitude, pos.longitude);
        const suggestedCurrency = getCurrencyForCountry(geo.countryCode);

        setForm((prev) => {
          let newForm = { ...prev };
          if (suggestedCurrency && suggestedCurrency !== "VND") {
            const matchedRate = rates.find((r) => r.currencyCode === suggestedCurrency);
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
    },
    [trip]
  );

  useEffect(() => {
    if (isFormOpen) {
      setErrors({});
      setShowAdvanced(false);
      if (editingId) {
        const item = expenses.find((e) => String(e.id) === editingId);
        if (item) {
          const isCustom = !categoryOptions.includes(item.category) || item.category === "other...";
          setForm({
            description: item.description,
            amount: String(item.amount),
            payer: item.payer || "",
            category: isCustom ? "other..." : item.category,
            customCategory: isCustom && item.category !== "other..." ? item.category : "",
            splitType: item.splitType ?? "shared",
            splitMode: item.splitMode ?? "perPerson",
            splitAmong: item.splitAmong ?? [],
            date: item.date
              ? new Date(item.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            eventId: item.eventId ? String(item.eventId) : "",
            currency: item.currency || "VND",
            exchangeRate: item.exchangeRate || 1,
          });
          if (
            item.splitType === "personal" ||
            isCustom ||
            item.category !== categoryOptions[0] ||
            item.splitMode === "perGroup" ||
            (item.splitAmong && item.splitAmong.length > 0) ||
            item.eventId
          ) {
            setShowAdvanced(true);
          }
        }
      } else {
        setForm({
          description: "",
          amount: "",
          payer: members[0]?.name ?? "",
          category: categoryOptions[0] || "transport",
          customCategory: "",
          splitType: "shared",
          splitMode: "perPerson",
          splitAmong: [],
          date: new Date().toISOString().split("T")[0],
          eventId: "",
          currency: "VND",
          exchangeRate: 1,
        });
        fetchLocationForExpense(exchangeRates);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, isFormOpen]);

  const filteredEvents = React.useMemo(() => {
    return [...events]
      .filter((e) => !e.isDeleted)
      .sort((a, b) => {
        const dateComp = (a.date || "").localeCompare(b.date || "");
        if (dateComp !== 0) return dateComp;
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [events]);

  // Merge pending change requests into expenses list for visual diffs
  const mergedExpenses = React.useMemo(() => {
    const list = expenses
      .filter((e: any) => !e.isDeleted)
      .map((item) => {
        const pendingDelete = changeRequests.some(
          (r) =>
            r.section === "expenses" &&
            r.action === "delete" &&
            String(r.targetId) === String(item.id)
        );
        const updateReq = changeRequests.find(
          (r) =>
            r.section === "expenses" &&
            r.action === "update" &&
            String(r.targetId) === String(item.id)
        );

        if (updateReq) {
          return {
            ...item,
            ...updateReq.after,
            isPendingUpdate: true,
            changeRequestId: updateReq.id,
          };
        }
        if (pendingDelete) {
          return {
            ...item,
            isPendingDelete: true,
            changeRequestId: changeRequests.find(
              (r) =>
                r.section === "expenses" &&
                r.action === "delete" &&
                String(r.targetId) === String(item.id)
            )?.id,
          };
        }
        return item;
      });

    const pendingCreates = changeRequests.filter(
      (r) => r.section === "expenses" && r.action === "create" && r.status === "pending"
    );
    pendingCreates.forEach((r) => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id,
      } as any);
    });

    return list;
  }, [expenses, changeRequests]);

  function startAdd() {
    setEditingId(null);
    setIsFormOpen(true);
  }
  function startEdit(item: Expense) {
    setEditingId(String(item.id));
    setIsFormOpen(true);
  }

  async function handleSave() {
    const newErrors: typeof errors = {};
    const amountVal = Number(form.amount);

    if (!form.amount.trim() || Number.isNaN(amountVal) || amountVal <= 0) {
      newErrors.amount = t("expenses.errAmount");
    }

    const vndAmount =
      form.currency === "VND" ? amountVal : Math.round(amountVal * form.exchangeRate);

    let finalCategory = form.category;
    if (form.category === "other...") {
      const trimmedCustom = form.customCategory.trim();
      if (!trimmedCustom) {
        newErrors.customCategory = t("expenses.errCategory");
      } else {
        finalCategory = trimmedCustom.slice(0, 30);
      }
    }

    if (form.splitType === "shared" && members.length > 0 && !form.payer) {
      newErrors.payer = t("expenses.errPayer");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      description: form.description.trim(),
      amount: vndAmount,
      payer: form.splitType === "personal" ? form.payer || "" : form.payer,
      category: finalCategory,
      splitType: form.splitType,
      splitMode: form.splitType === "personal" ? "perPerson" : form.splitMode,
      splitAmong: form.splitType === "personal" ? [] : form.splitAmong,
      date: new Date(form.date).toISOString(),
      eventId: form.eventId ? Number(form.eventId) : undefined,
      currency: form.currency,
      exchangeRate: form.exchangeRate,
      originalAmount: form.currency !== "VND" ? amountVal : undefined,
    };

    try {
      setIsSubmitting(true);
      const status = isDirectEdit ? "auto_approved" : undefined;
      const successMessage = isDirectEdit ? t("share.updatedDirectly") : t("share.suggestSent");
      if (!editingId) {
        await submitChangeRequest(token, {
          section: "expenses",
          action: "create",
          after: payload,
          status,
          requesterName: guestName,
        });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const before = expenses.find((e) => String(e.id) === editingId);
        await submitChangeRequest(token, {
          section: "expenses",
          action: "update",
          targetId: editingId,
          before: before as any,
          after: payload,
          status,
          requesterName: guestName,
        });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) {
      showToast(
        isDirectEdit
          ? t("toast.updateError", { message: e.message })
          : t("toast.submitRequestError", { message: e.message }),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = expenses.find((e) => String(e.id) === id);
      await submitChangeRequest(token, {
        section: "expenses",
        action: "delete",
        targetId: id,
        before: before as any,
        status: isDirectEdit ? "auto_approved" : undefined,
        requesterName: guestName,
      });
      showToast(isDirectEdit ? t("toast.directDelete") : t("toast.requestSent"));
    } catch (e: any) {
      showToast(
        isDirectEdit
          ? t("toast.deleteError", { message: e.message })
          : t("toast.submitRequestError", { message: e.message }),
        "error"
      );
    }
  }

  const activeExpenses = mergedExpenses.filter((e) => !e.isPendingDelete);

  const totalExpense = activeExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const sharedExpensesList = activeExpenses.filter((e) => e.splitType === "shared");
  const personalExpensesList = activeExpenses.filter((e) => e.splitType === "personal");

  const totalShared = sharedExpensesList.reduce((acc, cur) => acc + cur.amount, 0);
  const totalPersonal = personalExpensesList.reduce((acc, cur) => acc + cur.amount, 0);

  const activeMembers = members.length > 0 ? members.length : 1;
  const avgPerPerson = Math.round(totalShared / activeMembers);

  const groupUnits = React.useMemo(() => getGroupUnits(members), [members]);
  const hasGroups = groupUnits.some((u) => u.isGroup);
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
    members.forEach((m) => (shares[m.name] = 0));
    sharedExpensesList.forEach((expense) => {
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

  const isSaveDisabled =
    !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  return (
    <div className="space-y-6">
      {/* Header Section (Adopted from Main View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[32px] font-extrabold text-kat-dark dark:text-white tracking-tight">
            {t("expenses.pageTitle")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] mt-1">
            {t("expenses.pageSubtitle")}
          </p>
        </div>
        {isRequestEdit && (
          <div>
            <button
              type="button"
              onClick={startAdd}
              className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 text-white dark:text-slate-950 px-5 text-[14px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
              {isDirectEdit ? t("expenses.addExpense") : t("share.suggestAdd")}
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Section */}
      <ExpenseSummaryBoard
        totalExpense={totalExpense}
        totalShared={totalShared}
        totalPersonal={totalPersonal}
        avgPerGroup={avgPerGroup}
        avgPerPerson={avgPerPerson}
        hasGroups={hasGroups}
        members={members}
        isRequestEdit={isRequestEdit}
        isDirectEdit={isDirectEdit}
        startAdd={startAdd}
        categoryBreakdown={categoryBreakdown}
        exactSharesByMember={exactSharesByMember}
        trip={trip}
        t={t}
        formatMoney={formatMoney}
      />

      <SettlementCard
        members={members}
        expenses={activeExpenses}
        settlements={settlements}
        currency={trip.defaultCurrency || "VND"}
      />

      {/* Expenses List */}
      <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden mt-6 animate-fadeIn">
        {/* Ambient background glow */}
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-amber-500/[0.03] dark:bg-amber-500/[0.05] blur-[30px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 shadow-inner">
              <HugeiconsIcon icon={ReceiptTextIcon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-200">
                {t("expenses.expenseList")}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {t("share.expensesDesc", "Quản lý chi tiêu chung, chi tiêu cá nhân và thanh toán")}
              </p>
            </div>
          </div>
        </div>
        {mergedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/35 dark:bg-slate-800/10 border border-dashed border-slate-200/80 dark:border-slate-700/40 my-2">
            <HugeiconsIcon
              icon={ReceiptTextIcon}
              className="h-10 w-10 text-slate-350 dark:text-slate-600 mb-2.5 animate-pulse"
            />
            <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500">
              {t("expenses.noExpenseList")}
            </p>
            <p className="text-[11.5px] text-slate-400/80 dark:text-slate-500/80 mt-1 max-w-xs px-4">
              {t("expenses.sharedSuggest")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-3">
            {mergedExpenses.map((e, idx) => {
              const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;

              return (
                <ExpenseItemCard
                  key={e.id || idx}
                  expense={e}
                  idx={idx}
                  isRequestEdit={isRequestEdit}
                  changeRequests={changeRequests}
                  t={t}
                  catMap={catMap}
                  getCategoryDetails={getCategoryDetails}
                  formatMoney={formatMoney}
                  activeMenuId={activeMenuId}
                  onMenuClick={(id, rect) => {
                    if (activeMenuId === id) {
                      setActiveMenuId(null);
                      setMenuPos(null);
                    } else {
                      setActiveMenuId(id);
                      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                    }
                  }}
                />
              );
            })}
          </div>
        )}

        {activeMenuId &&
          menuPos &&
          createPortal(
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
                    const item = expenses.find((x) => String(x.id) === id);
                    if (item) startEdit(item);
                  }}
                  className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {isDirectEdit ? t("expenses.editExpense") : t("share.suggestEdit")}
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
                  {isDirectEdit ? t("expenses.deleteConfirm") : t("share.suggestDelete")}
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
          title={
            isDirectEdit
              ? editingId
                ? t("expenses.editExpense")
                : t("expenses.addExpense")
              : editingId
                ? t("share.suggestEditExpenseTitle")
                : t("share.suggestAddExpenseTitle")
          }
          headerAction={
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaveDisabled || isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 text-white dark:text-slate-950 px-4 text-[13.5px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] transition-all active:scale-[0.97] disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting
                ? t("expenses.savingNew")
                : isDirectEdit
                  ? editingId
                    ? t("expenses.save")
                    : t("expenses.add")
                  : t("share.suggestLabel")}
            </button>
          }
        >
          <div className="flex flex-col gap-5 py-2">
            {/* Amount Box */}
            <div className="relative flex flex-col items-center justify-center py-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  {t("expenses.amount")}
                </span>
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
                    title={t("expenses.selectCurrency")}
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
                        <span
                          className={`text-[15px] ${form.currency === "VND" ? "font-extrabold" : "font-semibold"}`}
                        >
                          {t("expenses.vnd")}
                        </span>
                        {form.currency === "VND" && (
                          <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />
                        )}
                      </button>
                      {exchangeRates.map((r) => {
                        const isSelected = form.currency === r.currencyCode;
                        return (
                          <button
                            key={r.currencyCode}
                            type="button"
                            onClick={() => {
                              setForm({
                                ...form,
                                currency: r.currencyCode,
                                exchangeRate: r.transfer,
                              });
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                              isSelected
                                ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                            }`}
                          >
                            <span
                              className={`text-[15px] ${isSelected ? "font-extrabold" : "font-semibold"}`}
                            >
                              {r.currencyCode} {r.currencyName ? `(${r.currencyName})` : ""}
                            </span>
                            {isSelected && (
                              <HugeiconsIcon
                                icon={CheckIcon}
                                size={20}
                                className="text-kat-primary"
                              />
                            )}
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
                  value={
                    form.amount ? new Intl.NumberFormat("en-US").format(Number(form.amount)) : ""
                  }
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, amount: rawValue });
                    setErrors({ ...errors, amount: "" });
                  }}
                  className="w-full text-center text-3xl font-black text-kat-dark dark:text-white bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
                />
              </div>
              {errors.amount && (
                <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 text-center">
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Date */}
            <DatePicker
              label={
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                  {t("expenses.dateLabel")}
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
                  {t("expenses.descLabel")}
                </span>
              }
              value={form.description}
              onChange={(description) => setForm({ ...form, description })}
              placeholder={t("expenses.descPlaceholder")}
            />

            {/* Payer Select */}
            {form.splitType === "shared" ? (
              members.length > 0 ? (
                <div>
                  <Select
                    label={
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={UserCheck01Icon} className="h-4 w-4 text-slate-500" />
                        {t("expenses.payerLabel")}
                      </span>
                    }
                    value={form.payer}
                    onChange={(payer) => {
                      setForm({ ...form, payer });
                      if (errors.payer) setErrors({ ...errors, payer: undefined });
                    }}
                    options={["", ...(members || []).map((m) => m.name)]}
                    placeholder={t("expenses.payerPlaceholder")}
                  />
                  {errors.payer && (
                    <p className="mt-1 text-[12px] font-bold text-rose-500 pl-1">{errors.payer}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 text-[13px] text-amber-800 dark:text-amber-400 font-semibold flex gap-2">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    className="h-5 w-5 shrink-0 text-amber-600 mt-0.5"
                  />
                  <span>{t("expenses.noCompanionShared")}</span>
                </div>
              )
            ) : (
              members.length > 0 && (
                <div>
                  <Select
                    label={
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={UserCheck01Icon} className="h-4 w-4 text-slate-500" />
                        {t("expenses.personalOwner")}
                      </span>
                    }
                    value={form.payer}
                    onChange={(payer) => setForm({ ...form, payer })}
                    options={["", ...members.map((member) => member.name)]}
                    placeholder={t("expenses.personalPlaceholder")}
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
                  <HugeiconsIcon
                    icon={PreferenceHorizontalIcon}
                    className="h-4 w-4 text-slate-400"
                  />
                  {t("expenses.advanced")}
                </span>
                <HugeiconsIcon
                  icon={ChevronRightIcon}
                  className={classNames(
                    "h-4 w-4 transition-transform duration-200 text-slate-400",
                    showAdvanced ? "rotate-90" : ""
                  )}
                />
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 animate-fadeIn">
                  {/* Category */}
                  <div className="grid grid-cols-1 gap-4">
                    <Select
                      label={
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={TagsIcon} className="h-4 w-4 text-slate-500" />
                          {t("expenses.categoryLabel")}
                        </span>
                      }
                      value={form.category}
                      onChange={(category) => {
                        setForm({ ...form, category, customCategory: "" });
                        setErrors({ ...errors, customCategory: "" });
                      }}
                      options={categoryOptions}
                      labels={categoryLabels}
                    />

                    {form.category === "other..." && (
                      <div className="animate-fadeIn">
                        <Input
                          label={
                            <span className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={TagsIcon} className="h-4 w-4 text-slate-500" />
                              {t("expenses.customCatLabel")}
                            </span>
                          }
                          value={form.customCategory}
                          onChange={(customCategory) => {
                            setForm({ ...form, customCategory: customCategory.slice(0, 30) });
                            setErrors({ ...errors, customCategory: "" });
                          }}
                          placeholder={t("expenses.customCatPlaceholder")}
                        />
                        {errors.customCategory && (
                          <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1">
                            {errors.customCategory}
                          </p>
                        )}
                      </div>
                    )}
                    {filteredEvents.length > 0 && (
                      <Select
                        label={
                          <span className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-slate-500" />
                            {t("expenses.linkTimeline")}
                          </span>
                        }
                        value={form.eventId}
                        onChange={(eventId) => setForm({ ...form, eventId })}
                        options={["", ...filteredEvents.map((e) => String(e.id))]}
                        labels={{
                          "": "Không gắn (Chi phí chung)",
                          ...Object.fromEntries(
                            filteredEvents.map((e) => {
                              const dateParts = (e.date || "").split("-");
                              const shortDate =
                                dateParts.length === 3
                                  ? `${dateParts[2]}/${dateParts[1]}`
                                  : e.date || "";
                              const datePrefix = shortDate ? `(${shortDate}) ` : "";
                              return [String(e.id), `${datePrefix}${e.title}`];
                            })
                          ),
                        }}
                      />
                    )}
                  </div>

                  {/* Segmented Control for Cost Calculation */}
                  <div className="space-y-2">
                    <span className="text-[13.5px] font-semibold text-slate-600 flex items-center gap-1.5">
                      <HugeiconsIcon icon={BalanceScaleIcon} className="h-4 w-4 text-slate-500" />
                      {t("expenses.splitMethod")}
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
                        {t("expenses.splitGroupLabel")}
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
                        {t("expenses.personalSelfLabel")}
                      </button>
                    </div>
                    {form.splitType === "shared" && (
                      <div className="mt-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                        {!showParticipants ? (
                          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                {!form.splitAmong || form.splitAmong.length === 0
                                  ? t("expenses.allPeople")
                                  : t("expenses.nParticipants", { count: form.splitAmong.length })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowParticipants(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-[12px] font-bold text-kat-teal border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              {t("expenses.edit")}
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-kat-teal/20 bg-teal-50/30 dark:bg-teal-900/10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                {t("expenses.participate")} (
                                {!form.splitAmong || form.splitAmong.length === 0
                                  ? t("expenses.participateAll")
                                  : t("expenses.participateN", { count: form.splitAmong.length })}
                                )
                              </span>

                              <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => setForm((f) => ({ ...f, splitMode: "perPerson" }))}
                                  className={classNames(
                                    "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                    form.splitMode === "perPerson"
                                      ? "bg-white dark:bg-slate-600 text-kat-dark dark:text-white shadow-sm"
                                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  )}
                                >
                                  {t("expenses.perPerson")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm((f) => ({ ...f, splitMode: "perGroup" }))}
                                  className={classNames(
                                    "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                                    form.splitMode === "perGroup"
                                      ? "bg-white dark:bg-slate-600 text-kat-dark dark:text-white shadow-sm"
                                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  )}
                                >
                                  {t("expenses.perGroup")}
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <button
                                type="button"
                                onClick={() => setShowParticipants(false)}
                                className="text-[12px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                {t("expenses.close")}
                              </button>
                              {(!form.splitAmong || form.splitAmong.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => setForm((f) => ({ ...f, splitAmong: [] }))}
                                  className="text-[12px] font-bold text-kat-teal hover:underline"
                                >
                                  {t("expenses.reselectAll")}
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {form.splitMode === "perGroup"
                                ? getGroupUnits(members).map((unit) => {
                                    const label = unit.isGroup
                                      ? unit.groupName
                                      : unit.memberNames[0];
                                    const isSelected =
                                      !form.splitAmong ||
                                      form.splitAmong.length === 0 ||
                                      unit.memberNames.every((name) =>
                                        form.splitAmong.includes(name)
                                      );
                                    return (
                                      <button
                                        key={label}
                                        type="button"
                                        onClick={() => {
                                          setForm((f) => {
                                            const current = f.splitAmong || [];
                                            if (current.length === 0) {
                                              const allNames = members.map((m) => m.name);
                                              const next = allNames.filter(
                                                (n) => !unit.memberNames.includes(n)
                                              );
                                              return { ...f, splitAmong: next };
                                            } else {
                                              if (isSelected) {
                                                const next = current.filter(
                                                  (n) => !unit.memberNames.includes(n)
                                                );
                                                return {
                                                  ...f,
                                                  splitAmong: next.length === 0 ? [] : next,
                                                };
                                              } else {
                                                const next = Array.from(
                                                  new Set([...current, ...unit.memberNames])
                                                );
                                                return {
                                                  ...f,
                                                  splitAmong:
                                                    next.length === members.length ? [] : next,
                                                };
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
                                : members.map((m) => {
                                    const isSelected =
                                      !form.splitAmong ||
                                      form.splitAmong.length === 0 ||
                                      form.splitAmong.includes(m.name);
                                    return (
                                      <button
                                        key={m.name}
                                        type="button"
                                        onClick={() => {
                                          setForm((f) => {
                                            const current = f.splitAmong || [];
                                            if (current.length === 0) {
                                              const allNames = members.map((mem) => mem.name);
                                              const next = allNames.filter((n) => n !== m.name);
                                              return { ...f, splitAmong: next };
                                            } else {
                                              if (isSelected) {
                                                const next = current.filter((n) => n !== m.name);
                                                return {
                                                  ...f,
                                                  splitAmong: next.length === 0 ? [] : next,
                                                };
                                              } else {
                                                const next = [...current, m.name];
                                                return {
                                                  ...f,
                                                  splitAmong:
                                                    next.length === members.length ? [] : next,
                                                };
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
                                  })}
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
          title={isDirectEdit ? t("expenses.deleteTitle") : t("share.suggestDeleteExpenseTitle")}
          description={
            isDirectEdit ? t("expenses.deleteDesc") : t("share.suggestDeleteExpenseDesc")
          }
          confirmLabel={isDirectEdit ? t("expenses.delete") : t("share.suggestDelete")}
          itemName={(() => {
            const e = expenses.find((e) => String(e.id) === deleteTargetId);
            return e
              ? !e.description || e.description === e.category
                ? catMap[e.category] || e.category
                : e.description
              : "";
          })()}
        />
      </section>

      {/* Mobile Floating Action Button (FAB) */}
      {isRequestEdit && (
        <button
          type="button"
          onClick={startAdd}
          className="lg:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 text-kat-dark dark:text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200 cursor-pointer"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label={isDirectEdit ? t("expenses.addExpense") : t("share.suggestAdd")}
          title={isDirectEdit ? t("expenses.addExpense") : t("share.suggestAdd")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
