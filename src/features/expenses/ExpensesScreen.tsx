import React, { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { useLiveQuery } from "dexie-react-hooks";
import { getCurrencyLabel } from "../../constants/currencies";
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
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { db, Expense, Member, EventItem } from "../../db";
import {
  formatMoney,
  getSettlementSuggestions,
  sumBy,
  expenseCategories,
  getGroupUnits,
  getMemberShareForExpense,
} from "../../utils/helpers";
import {
  BottomSheet,
  FormActions,
  Input,
  ScreenTitle,
  Select,
  DatePicker,
  DeleteConfirmModal,
  classNames,
} from "../../components/ui";
import { useModalHistory } from "../../hooks/useModalHistory";
import { fetchExchangeRates, ExchangeRate, FALLBACK_RATES } from "../../services/currencyService";
import {
  getCurrentPosition,
  reverseGeocode,
  getCurrencyForCountry,
} from "../../services/locationService";

export function CategoryBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  let fillClass = colorClass;
  if (colorClass === "bg-kat-primary") {
    fillClass =
      "bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.2)]";
  } else if (colorClass === "bg-kat-primary/70") {
    fillClass = "bg-gradient-to-r from-teal-400/80 to-emerald-400/80";
  } else if (colorClass === "bg-kat-primary/40") {
    fillClass = "bg-gradient-to-r from-teal-400/50 to-emerald-400/50";
  } else {
    fillClass = "bg-slate-200 dark:bg-slate-700";
  }
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/10 dark:border-white/5">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${fillClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function BreakdownSection({
  items,
  total,
  emptyText,
  currency,
  type = "category",
}: {
  items: Record<string, number>;
  total: number;
  emptyText: string;
  currency?: string;
  type?: "category" | "member";
}) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = {
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    Khác: t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  };
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

  const memberColors = [
    "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30",
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30",
    "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30",
    "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30",
    "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30",
  ];

  const getCatIcon = (cat: string) => {
    switch (cat) {
      case "Di chuyển":
        return Route01Icon;
      case "Vé máy bay":
        return Airplane01Icon;
      case "Ăn uống":
        return Dish01Icon;
      case "Lưu trú":
        return HotelIcon;
      case "Vé tham quan":
        return Ticket01Icon;
      case "Mua sắm":
        return ShoppingBag01Icon;
      case "Vui chơi & Giải trí":
        return GameController01Icon;
      case "Chuẩn bị hành lý":
        return SparklesIcon;
      default:
        return Tag01Icon;
    }
  };

  return (
    <div className="space-y-1">
      {rows.map(([label, amount], index) => {
        const percent = total ? Math.round((amount / total) * 100) : 0;
        const colorClass =
          index === 0
            ? "bg-kat-primary"
            : index === 1
              ? "bg-kat-primary/70"
              : index === 2
                ? "bg-kat-primary/40"
                : "bg-slate-300 dark:bg-slate-600";

        const formattedAmount = formatMoney(amount, currency);
        const isZeroAmount = amount < 1; // Practically zero in VND/most display units when < 1

        return (
          <div
            key={label}
            className="group -mx-3 px-3 py-2 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200 hover:translate-x-1"
          >
            <div className="flex items-center justify-between text-[14px] font-bold">
              {type === "member" ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  {(() => {
                    const initials = label.trim().charAt(0).toUpperCase();
                    const charCodeSum = label
                      .split("")
                      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const colorClass = memberColors[charCodeSum % memberColors.length];
                    return (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm ${colorClass}`}
                      >
                        {initials}
                      </div>
                    );
                  })()}
                  <p className="text-slate-700 dark:text-slate-300 group-hover:text-kat-dark group-hover:dark:text-white transition-colors truncate">
                    {label}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/40 shadow-sm shrink-0">
                    <HugeiconsIcon icon={getCatIcon(label)} className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 group-hover:text-kat-dark group-hover:dark:text-white transition-colors truncate">
                    {catMap[label] || label}
                  </p>
                </div>
              )}
              <p
                className={classNames(
                  "transition-colors",
                  isZeroAmount
                    ? "text-slate-400 dark:text-slate-500 font-medium"
                    : "text-kat-dark dark:text-white font-bold"
                )}
              >
                {formattedAmount}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-3 pl-[38px]">
              <CategoryBar
                percent={percent}
                colorClass={isZeroAmount ? "bg-slate-200" : colorClass}
              />
              <span className="w-10 text-right text-[12px] font-black text-slate-400 dark:text-slate-500 group-hover:text-slate-600 group-hover:dark:text-slate-350 transition-colors">
                {percent}%
              </span>
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
  settlements,
  currency,
}: {
  members: Member[];
  expenses: Expense[];
  settlements: Array<{ from: string; to: string; amount: number }>;
  currency?: string;
}) {
  const { t } = useTranslation();
  let emptyText = t("expenses.settlementBalanced");
  if (!members.length) {
    emptyText = t("expenses.settlementAddCompanion");
  } else if (!expenses.length) {
    emptyText = t("expenses.settlementNoExpense");
  }

  const getMemberAvatar = (name: string) => {
    const initials = name.trim().charAt(0).toUpperCase();
    const colors = [
      "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30",
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30",
      "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30",
      "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30",
      "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30",
    ];
    const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[charCodeSum % colors.length];
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 shadow-sm mb-1 ${colorClass}`}
      >
        {initials}
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/50 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] mt-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
          <HugeiconsIcon icon={BalanceScaleIcon} className="h-4.5 w-4.5" />
        </span>
        <h3 className="text-[16px] font-extrabold text-kat-dark dark:text-white">
          {t("expenses.settlementTitle")}
        </h3>
      </div>
      {settlements.length ? (
        <div className="grid gap-3 sm:grid-cols-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200/50 dark:scrollbar-thumb-slate-800/50">
          {settlements.map((s, idx) => {
            const fromMember = members.find((m) => m.name === s.from);
            const toMember = members.find((m) => m.name === s.to);
            const fromGroup =
              fromMember?.isGroupLeader && fromMember.group ? fromMember.group : null;
            const toGroup = toMember?.isGroupLeader && toMember.group ? toMember.group : null;

            return (
              <div
                key={idx}
                className="flex flex-col justify-center bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-sm rounded-2xl p-4 gap-2 hover:shadow-md hover:border-slate-300/60 dark:hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-center flex-1">
                    {getMemberAvatar(s.from)}
                    <span className="font-bold text-kat-dark dark:text-slate-200 text-[13px] text-center px-1 break-words leading-tight">
                      {s.from}
                    </span>
                    {fromGroup && (
                      <span className="text-[10px] text-slate-400 font-medium text-center leading-tight mt-0.5">
                        {t("expenses.groupLabel", { group: fromGroup })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center flex-[1.5] px-2 shrink-0">
                    <span className="font-black text-rose-600 text-[14.5px] mb-1.5 whitespace-nowrap">
                      {formatMoney(s.amount, currency)}
                    </span>
                    <div className="w-full h-[2px] bg-slate-200 dark:bg-slate-700/80 relative flex items-center justify-center">
                      <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-slate-200 dark:border-l-slate-700/80" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    {getMemberAvatar(s.to)}
                    <span className="font-bold text-kat-primary text-[13px] text-center px-1 break-words leading-tight">
                      {s.to}
                    </span>
                    {toGroup && (
                      <span className="text-[10px] text-slate-400 font-medium text-center leading-tight mt-0.5">
                        {t("expenses.groupLabel", { group: toGroup })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200/60 dark:border-white/10 rounded-2xl bg-slate-50/30 dark:bg-slate-800/20">
          <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
            {emptyText}
          </p>
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
  isReadOnly,
  currency,
}: {
  item: Expense;
  onEdit: () => void;
  onDelete: () => void;
  idx?: number;
  isReadOnly?: boolean;
  currency?: string;
}) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = {
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    Khác: t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  };
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
    <article
      className={`motion-card-enter motion-delay-${Math.min(idx + 1, 5)} flex items-center justify-between gap-4 rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-200 hover:shadow-md`}
    >
      <div className="min-w-0 flex-1">
        {/* Description */}
        <h4 className="text-base font-semibold text-kat-dark dark:text-white truncate">
          {!item.description || item.description === item.category
            ? catMap[item.category] || item.category
            : item.description}
        </h4>

        {/* Category & Badge */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
          <span className="inline-flex items-center gap-1 font-medium bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/10">
            {getCategoryIcon(item.category)}
            {catMap[item.category] || item.category}
          </span>

          <span
            className={classNames(
              "inline-flex items-center rounded-md px-2 py-0.5 font-bold border",
              isPersonal
                ? "bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-white/10"
                : "bg-[#00BFB7]/10 dark:bg-[#00BFB7]/10 backdrop-blur-sm text-[#00BFB7] dark:text-[#00BFB7] border-[#00BFB7]/20 dark:border-[#00BFB7]/30"
            )}
          >
            {isPersonal
              ? t("expenses.splitPersonal")
              : item.splitMode === "perGroup"
                ? t("expenses.splitPerGroup")
                : t("expenses.splitShared")}
          </span>

          <span className="font-medium">
            •{" "}
            {isPersonal
              ? item.payer
                ? t("expenses.paidByOf", { name: item.payer })
                : t("expenses.personalLabel")
              : t(item.payer ? "expenses.paidByPay" : "expenses.paidByNone", {
                  name: item.payer || "",
                })}
            {item.splitType === "shared" &&
              item.splitAmong &&
              item.splitAmong.length > 0 &&
              ` ${t("expenses.forNPeople", { count: item.splitAmong.length })}`}
          </span>

          {item.date && (
            <span className="font-medium px-2 py-0.5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 rounded-md">
              {new Date(item.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 pl-2 text-right">
        <p className="font-bold text-kat-dark dark:text-white text-lg">
          {item.originalAmount && item.currency && item.currency !== (currency || "VND")
            ? formatMoney(item.originalAmount, item.currency)
            : formatMoney(item.amount, currency || "VND")}
        </p>
        {item.originalAmount && item.currency && item.currency !== (currency || "VND") && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            = {formatMoney(item.amount, currency || "VND")}
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
            title={t("expenses.options")}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-1.5 shadow-lg animate-scaleIn text-left">
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
                {t("expenses.edit")}
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
                {t("expenses.delete")}
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
  onShowToast,
  currency,
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
  currency?: string;
}) {
  const { t, i18n } = useTranslation();
  const catMap: Record<string, string> = React.useMemo(
    () => ({
      "Di chuyển": t("expenses.catTransport"),
      "Vé máy bay": t("expenses.catFlights"),
      "Ăn uống": t("expenses.catFood"),
      "Lưu trú": t("expenses.catAccommodation"),
      "Vé tham quan": t("expenses.catTickets"),
      "Mua sắm": t("expenses.catShopping"),
      "Vui chơi & Giải trí": t("expenses.catEntertainment"),
      "Chuẩn bị hành lý": t("expenses.catPreparation"),
      Khác: t("expenses.catOther"),
      "Khác...": t("expenses.catCustom"),
    }),
    [t]
  );

  const categoryOptions = React.useMemo(() => {
    const defaultCats = expenseCategories.filter((c) => c !== "Khác");
    const uniqueUsedCats = Array.from(new Set(expenses.map((e) => e.category))).filter(
      (c) => !defaultCats.includes(c) && c !== "Khác" && c !== "Khác..."
    );
    return [...defaultCats, ...uniqueUsedCats, "Khác..."];
  }, [expenses]);

  const categoryLabels = React.useMemo(() => {
    const labels: Record<string, string> = { ...catMap };
    categoryOptions.forEach((c) => {
      if (!labels[c]) labels[c] = c;
    });
    return labels;
  }, [categoryOptions, catMap]);

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(FALLBACK_RATES);

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
    date: new Date().toISOString().split("T")[0],
    eventId: "",
    currency: currency || "VND",
    exchangeRate: 1,
  });

  const [errors, setErrors] = useState<{
    amount?: string;
    payer?: string;
    customCategory?: string;
  }>({});

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const editingId = editing?.id;
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setShowAdvanced(false);
      if (editing) {
        const isCustom =
          !categoryOptions.includes(editing.category) || editing.category === "Khác...";
        setForm({
          description: editing.description,
          amount: String(editing.originalAmount || editing.amount),
          payer: editing.payer || "",
          category: isCustom ? "Khác..." : editing.category,
          customCategory: isCustom && editing.category !== "Khác..." ? editing.category : "",
          splitType: editing.splitType ?? "shared",
          splitMode: editing.splitMode ?? "perPerson",
          splitAmong: editing.splitAmong ?? [],
          date: editing.date || new Date().toISOString().split("T")[0],
          eventId: editing.eventId ? String(editing.eventId) : "",
          currency: editing.currency || currency || "VND",
          exchangeRate: editing.exchangeRate || 1,
        });
        if (
          editing.date ||
          editing.splitType === "personal" ||
          editing.splitMode === "perGroup" ||
          (editing.splitAmong && editing.splitAmong.length > 0) ||
          editing.eventId
        ) {
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
          date: new Date().toISOString().split("T")[0],
          eventId: "",
          currency: currency || "VND",
          exchangeRate: 1,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  // Auto-detect currency when creating a new expense
  useEffect(() => {
    if (isOpen && !editing && exchangeRates.length > 0) {
      db.trips.get(tripId).then((trip) => {
        if (!trip) return;

        // Fallback to GPS
        getCurrentPosition()
          .then(async (pos) => {
            try {
              const geo = await reverseGeocode(pos.latitude, pos.longitude);
              const suggestedCurrency = getCurrencyForCountry(geo.countryCode);
              if (suggestedCurrency && suggestedCurrency !== "VND") {
                const matchedRate = exchangeRates.find((r) => r.currencyCode === suggestedCurrency);
                if (matchedRate) {
                  setForm((prev) => ({
                    ...prev,
                    currency: suggestedCurrency,
                    exchangeRate: matchedRate.transfer,
                  }));
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
      .filter((e) => !e.isDeleted)
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
      newErrors.amount = t("expenses.errAmount");
    }

    const vndAmount =
      form.currency === (currency || "VND") ? amountVal : amountVal * form.exchangeRate;

    let finalCategory = form.category;
    if (form.category === "Khác...") {
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
      originalAmount: form.currency === (currency || "VND") ? undefined : amountVal,
      currency: form.currency === (currency || "VND") ? undefined : form.currency,
      exchangeRate: form.currency === (currency || "VND") ? undefined : form.exchangeRate,
      payer: form.splitType === "personal" ? form.payer || "" : form.payer,
      category: finalCategory,
      splitType: form.splitType,
      splitMode: form.splitType === "personal" ? "perPerson" : form.splitMode,
      splitAmong: form.splitType === "personal" ? [] : form.splitAmong,
      date: form.date || undefined,
      eventId: form.eventId ? form.eventId : undefined,
      updatedAt: new Date().toISOString(),
      tripId,
    };

    if (editing?.id) {
      await db.expenses.update(editing.id, payload);
      onSaved(t("expenses.toastUpdated"));
      onClose();
    } else {
      await db.expenses.add(payload);
      onSaved(t("expenses.toastAdded"));
      onClose();
    }
  }

  const isSaveDisabled =
    !form.amount.trim() || (form.splitType === "shared" && members.length > 0 && !form.payer);

  const headerAction = (
    <button
      type="button"
      onClick={save}
      disabled={isSaveDisabled}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 text-white dark:text-slate-950 px-4 text-[13.5px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] transition-all active:scale-[0.97] disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed"
    >
      {editing ? t("expenses.save") : t("expenses.add")}
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("expenses.editExpense") : t("expenses.addExpense")}
      headerAction={headerAction}
    >
      <div className="space-y-4">
        {/* Prominent Amount Input */}
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
                  {/* --- Base Currency Option --- */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, currency: currency || "VND", exchangeRate: 1 });
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press border ${
                      form.currency === (currency || "VND")
                        ? "bg-kat-primary/10 border-kat-primary/30 dark:bg-kat-primary/20 dark:border-kat-primary/40 text-kat-primary dark:text-kat-primary"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                    }`}
                  >
                    <span
                      className={`text-[15px] ${form.currency === (currency || "VND") ? "font-extrabold" : "font-semibold"}`}
                    >
                      {getCurrencyLabel(currency || "VND", i18n.language)}{" "}
                      {t("expenses.baseCurrency")}
                    </span>
                    {form.currency === (currency || "VND") && (
                      <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />
                    )}
                  </button>

                  {/* --- VND Option (if base is not VND) --- */}
                  {(currency || "VND") !== "VND" && (
                    <button
                      type="button"
                      onClick={() => {
                        const baseRate =
                          exchangeRates.find((x) => x.currencyCode === currency)?.transfer || 1;
                        setForm({ ...form, currency: "VND", exchangeRate: 1 / baseRate });
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press border ${
                        form.currency === "VND"
                          ? "bg-kat-primary/10 border-kat-primary/30 dark:bg-kat-primary/20 dark:border-kat-primary/40 text-kat-primary dark:text-kat-primary"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                      }`}
                    >
                      <span
                        className={`text-[15px] ${form.currency === "VND" ? "font-extrabold" : "font-semibold"}`}
                      >
                        {getCurrencyLabel("VND", i18n.language)}
                      </span>
                      {form.currency === "VND" && (
                        <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />
                      )}
                    </button>
                  )}

                  {/* --- Foreign Currencies Option --- */}
                  {exchangeRates
                    .filter((r) => r.currencyCode !== (currency || "VND"))
                    .map((r) => {
                      const isSelected = form.currency === r.currencyCode;
                      return (
                        <button
                          key={r.currencyCode}
                          type="button"
                          onClick={() => {
                            const baseRate =
                              currency !== "VND"
                                ? exchangeRates.find((x) => x.currencyCode === currency)
                                    ?.transfer || 1
                                : 1;
                            const toBaseExchangeRate = r.transfer / baseRate;
                            setForm({
                              ...form,
                              currency: r.currencyCode,
                              exchangeRate: toBaseExchangeRate,
                            });
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press border ${
                            isSelected
                              ? "bg-kat-primary/10 border-kat-primary/30 dark:bg-kat-primary/20 dark:border-kat-primary/40 text-kat-primary dark:text-kat-primary"
                              : "bg-slate-50 border-slate-100 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                          }`}
                        >
                          <span
                            className={`text-[15px] ${isSelected ? "font-extrabold" : "font-semibold"}`}
                          >
                            {getCurrencyLabel(r.currencyCode, i18n.language) ||
                              `${r.currencyCode} ${r.currencyName ? `(${r.currencyName})` : ""}`}
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
          <div className="relative w-full max-w-[280px] flex items-center justify-center">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              value={form.amount ? new Intl.NumberFormat("en-US").format(Number(form.amount)) : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setForm({ ...form, amount: rawValue });
                setErrors({ ...errors, amount: "" });
              }}
              placeholder="0"
              className="w-full text-center text-3xl font-black text-kat-dark dark:text-white bg-transparent border-none outline-none placeholder-slate-300 focus:ring-0"
            />
          </div>
          {form.currency !== (currency || "VND") && form.amount && (
            <div className="mt-3 flex flex-col items-center">
              <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
                ≈ {formatMoney(Number(form.amount) * form.exchangeRate, currency || "VND")}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-1">
                {t("expenses.exchangeRate", {
                  currency: form.currency,
                  rate: new Intl.NumberFormat("vi-VN").format(form.exchangeRate),
                })}
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
              {t("expenses.dateLabel")}
            </span>
          }
          value={form.date}
          onChange={(date) => {
            setForm({ ...form, date, eventId: "" });
          }}
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

        {/* Payer Select (Always Visible in Default Section) */}
        {form.splitType === "shared" ? (
          members.length > 0 ? (
            <div>
              <Select
                label={
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserCheckIcon} className="h-4 w-4 text-slate-500" />
                    {t("expenses.payerLabel")}
                  </span>
                }
                value={form.payer}
                onChange={(payer) => {
                  setForm({ ...form, payer });
                  setErrors({ ...errors, payer: "" });
                }}
                options={["", ...members.map((member) => member.name)]}
                placeholder={t("expenses.payerPlaceholder")}
              />
              {errors.payer && (
                <p className="text-rose-500 text-[12.5px] font-bold mt-1.5 pl-1">{errors.payer}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 text-[13px] text-amber-800 dark:text-amber-400 font-semibold flex gap-2">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="h-5 w-5 shrink-0 text-amber-600 mt-0.5"
              />
              <span>{t("expenses.noCompanionWarn")}</span>
            </div>
          )
        ) : (
          members.length > 0 && (
            <div>
              <Select
                label={
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserCheckIcon} className="h-4 w-4 text-slate-500" />
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

        {/* Accordion / Collapsible Panel */}
        <div className="pt-2 border-t border-slate-100/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-kat-dark dark:hover:text-slate-200 transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={PreferenceHorizontalIcon} className="h-4 w-4 text-slate-400" />
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

                {form.category === "Khác..." && (
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
                      "": t("expenses.noLink"),
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
                <span className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <HugeiconsIcon icon={BalanceScaleIcon} className="h-4 w-4 text-slate-500" />
                  {t("expenses.splitMethod")}
                </span>
                <SegmentedControl
                  options={[
                    { id: "shared", label: t("expenses.splitGroupLabel") },
                    { id: "personal", label: t("expenses.personalSelfLabel") },
                  ]}
                  value={form.splitType}
                  onChange={(val) => {
                    if (val === "shared") {
                      setForm({ ...form, splitType: "shared", payer: members[0]?.name ?? "" });
                      setErrors({ ...errors, payer: "" });
                    } else {
                      setForm({ ...form, splitType: "personal", payer: "" });
                      setErrors({ ...errors, payer: "" });
                    }
                  }}
                  layoutIdPrefix="expense-split-type"
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              {form.splitType === "shared" && members.length > 0 && (
                <>
                  <div className="pt-2">
                    {!showParticipants ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            {form.splitAmong.length === 0
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
                            {form.splitAmong.length === 0
                              ? t("expenses.participateAll")
                              : t("expenses.participateN", { count: form.splitAmong.length })}
                            )
                          </span>

                          <SegmentedControl
                            options={[
                              { id: "perPerson", label: t("expenses.perPerson") },
                              { id: "perGroup", label: t("expenses.perGroup") },
                            ]}
                            value={form.splitMode}
                            onChange={(val) => setForm({ ...form, splitMode: val as any })}
                            layoutIdPrefix="expense-split-mode"
                            className="p-0.5 rounded-lg text-[11px]"
                            pillClassName="rounded-md"
                            buttonClassName="py-1 px-2.5 rounded-md"
                          />
                        </div>

                        <div className="flex justify-between items-center mb-3">
                          <button
                            type="button"
                            onClick={() => setShowParticipants(false)}
                            className="text-[12px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {t("expenses.close")}
                          </button>
                          {form.splitAmong.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, splitAmong: [] })}
                              className="text-[12px] font-bold text-kat-teal hover:underline"
                            >
                              {t("expenses.reselectAll")}
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {form.splitMode === "perGroup"
                            ? getGroupUnits(members).map((unit) => {
                                const label = unit.isGroup ? unit.groupName : unit.memberNames[0];
                                const isSelected =
                                  form.splitAmong.length === 0 ||
                                  unit.memberNames.every((name) => form.splitAmong.includes(name));
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                      if (form.splitAmong.length === 0) {
                                        const allNames = members.map((m) => m.name);
                                        const next = allNames.filter(
                                          (n) => !unit.memberNames.includes(n)
                                        );
                                        setForm({ ...form, splitAmong: next });
                                      } else {
                                        if (isSelected) {
                                          const next = form.splitAmong.filter(
                                            (n) => !unit.memberNames.includes(n)
                                          );
                                          setForm({
                                            ...form,
                                            splitAmong: next.length === 0 ? [] : next,
                                          });
                                        } else {
                                          const next = Array.from(
                                            new Set([...form.splitAmong, ...unit.memberNames])
                                          );
                                          setForm({
                                            ...form,
                                            splitAmong: next.length === members.length ? [] : next,
                                          });
                                        }
                                      }
                                    }}
                                    className={classNames(
                                      "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                      isSelected || form.splitAmong.length === 0
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
                                  form.splitAmong.length === 0 || form.splitAmong.includes(m.name);
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      if (form.splitAmong.length === 0) {
                                        setForm({
                                          ...form,
                                          splitAmong: members
                                            .map((mem) => mem.name)
                                            .filter((n) => n !== m.name),
                                        });
                                      } else {
                                        if (form.splitAmong.includes(m.name)) {
                                          const next = form.splitAmong.filter((n) => n !== m.name);
                                          setForm({
                                            ...form,
                                            splitAmong: next.length === 0 ? [] : next,
                                          });
                                        } else {
                                          const next = [...form.splitAmong, m.name];
                                          setForm({
                                            ...form,
                                            splitAmong: next.length === members.length ? [] : next,
                                          });
                                        }
                                      }
                                    }}
                                    className={classNames(
                                      "rounded-full px-3 py-1.5 text-[12px] font-bold transition-all border",
                                      isSelected || form.splitAmong.length === 0
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
  isReadOnly,
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
  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);
  const baseCurrency = trip?.defaultCurrency || "VND";
  const catMap: Record<string, string> = React.useMemo(
    () => ({
      "Di chuyển": t("expenses.catTransport"),
      "Vé máy bay": t("expenses.catFlights"),
      "Ăn uống": t("expenses.catFood"),
      "Lưu trú": t("expenses.catAccommodation"),
      "Vé tham quan": t("expenses.catTickets"),
      "Mua sắm": t("expenses.catShopping"),
      "Vui chơi & Giải trí": t("expenses.catEntertainment"),
      "Chuẩn bị hành lý": t("expenses.catPreparation"),
      Khác: t("expenses.catOther"),
      "Khác...": t("expenses.catCustom"),
    }),
    [t]
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  useModalHistory(
    isFormOpen,
    () => {
      setIsFormOpen(false);
      setEditing(null);
    },
    "expense-form-modal"
  );

  useModalHistory(
    Boolean(expenseToDelete),
    () => setExpenseToDelete(null),
    "delete-expense-confirm"
  );
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
        splitType: "shared",
      } as unknown as Expense);
      onClearInitialAddState?.();
    }
  }, [initialAddState, isFormOpen, editing, members, tripId, onClearInitialAddState]);

  const byCategory = sumBy(
    expenses,
    (item) => item.category,
    (item) => Number(item.amount || 0)
  );
  const paidByMember = {
    ...Object.fromEntries(members.map((member) => [member.name, 0])),
    ...sumBy(
      expenses,
      (item) => item.payer,
      (item) => (item.splitType !== "personal" ? Number(item.amount || 0) : 0)
    ),
  };

  const sharedExpenses = expenses.filter((e) => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const totalPersonalExpense =
    expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) - totalSharedExpense;
  const settlements = getSettlementSuggestions(members, sharedExpenses);

  const groupUnits = React.useMemo(() => getGroupUnits(members), [members]);
  const hasGroups = groupUnits.some((u) => u.isGroup);
  const perGroup = groupUnits.length ? totalSharedExpense / groupUnits.length : 0;

  // Calculate exact share per member based on new algorithm
  const exactSharesByMember = React.useMemo(() => {
    const shares: Record<string, number> = {};
    members.forEach((m) => (shares[m.name] = 0));
    sharedExpenses.forEach((expense) => {
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
    <div className="mx-auto max-w-[1280px] px-1 md:px-0">
      <div className="space-y-6 md:space-y-8 pb-0 md:pb-8">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-white">
              {t("expenses.pageTitle")}
            </h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">
              {t("expenses.pageSubtitle")}
            </p>
          </div>
          {!isReadOnly && (
            <div>
              <button
                type="button"
                onClick={openNewForm}
                className="hidden md:flex items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 px-5 text-[14px] font-bold text-white dark:text-slate-950 shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                {t("expenses.addExpense")}
              </button>
            </div>
          )}
        </div>

        {/* Total Expense Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl border-t-4 border-t-[#030D2E] dark:border-t-kat-border/40 border-x border-b border-slate-200/60 dark:border-white/10 p-6 md:p-8 text-kat-dark dark:text-slate-100 shadow-soft">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <HugeiconsIcon icon={ReceiptTextIcon} className="h-4.5 w-4.5" />
                  <p className="text-[13px] font-bold uppercase tracking-wider">
                    {t("expenses.totalTrip")}
                  </p>
                </div>
                <p className="mt-1 break-words text-[36px] md:text-[44px] font-black leading-none tracking-tight text-kat-dark dark:text-white">
                  {formatMoney(totalExpense, baseCurrency)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t("expenses.sharedTrip")}
                    </p>
                    <p className="text-[18px] font-black text-[#00AFA8] dark:text-[#00BFB7] mt-0.5">
                      {formatMoney(totalSharedExpense, baseCurrency)}
                    </p>
                  </div>
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="h-5 w-5 text-[#00AFA8]/60 dark:text-[#00BFB7]/60 shrink-0 mt-0.5"
                  />
                </div>
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t("expenses.personalExpense")}
                    </p>
                    <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">
                      {formatMoney(totalPersonalExpense, baseCurrency)}
                    </p>
                  </div>
                  <HugeiconsIcon
                    icon={UserIcon}
                    className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                  />
                </div>
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {hasGroups ? t("expenses.avgPerGroup") : t("expenses.avgPerPerson")}
                    </p>
                    {members.length > 0 ? (
                      <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">
                        {formatMoney(hasGroups ? perGroup : perPerson, baseCurrency)}
                      </p>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-1.5 inline-block">
                        {t("expenses.noCompanion")}
                      </span>
                    )}
                  </div>
                  <HugeiconsIcon
                    icon={CalculatorIcon}
                    className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                  />
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
                  {t("expenses.addExpense")}
                </button>
              </div>
            )}
          </div>
        </section>

        {!isEmpty && (
          <>
            {/* Breakdown Grid */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/50 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-fadeIn flex flex-col">
                <div className="flex items-center gap-2 mb-5 shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <HugeiconsIcon icon={PieChartIcon} className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-kat-dark dark:text-white">
                    {t("expenses.byCategory")}
                  </h3>
                </div>
                <div className="max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200/50 dark:scrollbar-thumb-slate-800/50 flex-1">
                  <BreakdownSection
                    items={byCategory}
                    total={totalExpense}
                    emptyText={t("expenses.noCatYet")}
                    currency={baseCurrency}
                    type="category"
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/50 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-fadeIn flex flex-col">
                <div className="flex items-center gap-2 mb-5 shrink-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
                    <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="text-base font-extrabold text-kat-dark dark:text-white">
                    {t("expenses.sharePerMember")}
                  </h3>
                </div>
                <div className="max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200/50 dark:scrollbar-thumb-slate-800/50 flex-1">
                  {members.length > 0 ? (
                    <BreakdownSection
                      items={exactSharesByMember}
                      total={totalSharedExpense}
                      emptyText={t("expenses.addCompanionStats")}
                      currency={baseCurrency}
                      type="member"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("expenses.addCompanionShare")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Settlements */}
            <SettlementCard
              members={members}
              expenses={expenses}
              settlements={settlements}
              currency={baseCurrency}
            />
          </>
        )}

        {/* Expense List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-dark/5 text-kat-dark/70">
              <HugeiconsIcon icon={ReceiptTextIcon} className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-kat-dark">{t("expenses.expenseList")}</h3>
          </div>
          <div className={isEmpty ? "" : "grid gap-4 lg:grid-cols-2"}>
            {isEmpty ? (
              <div className="rounded-[24px] bg-kat-surface p-8 border border-kat-border/60 shadow-soft flex flex-col items-center text-center animate-fadeIn max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
                  <HugeiconsIcon icon={WalletCardsIcon} className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-[17px] font-bold text-kat-text mb-1.5">
                  {t("expenses.noExpenses")}
                </h3>
                <p className="text-[13.5px] font-medium text-kat-muted mb-0 max-w-xs">
                  {t("expenses.noExpensesDesc")}
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
                    currency={baseCurrency}
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
        title={t("expenses.deleteTitle")}
        itemName={
          expenseToDelete?.description === expenseToDelete?.category
            ? catMap[expenseToDelete?.category || ""] || expenseToDelete?.category
            : expenseToDelete?.description ||
              catMap[expenseToDelete?.category || ""] ||
              expenseToDelete?.category
        }
        description={t("expenses.deleteDesc")}
        confirmLabel={t("expenses.deleteConfirm")}
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
        currency={baseCurrency}
      />
    </div>
  );
}
