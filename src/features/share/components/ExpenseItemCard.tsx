import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { classNames } from "../../../utils/helpers";

interface ExpenseItemCardProps {
  expense: any;
  idx?: number;
  isRequestEdit: boolean;
  changeRequests: any[];
  t: (key: string, options?: any) => string;
  catMap: Record<string, string>;
  getCategoryDetails: (category: string) => { icon: any; bg: string };
  formatMoney: (value: number, currency?: string) => string;
  activeMenuId: string | null;
  onMenuClick: (id: string, rect: DOMRect) => void;
}

export function ExpenseItemCard({
  expense: e,
  idx,
  isRequestEdit,
  changeRequests,
  t,
  catMap,
  getCategoryDetails,
  formatMoney,
  activeMenuId,
  onMenuClick,
}: ExpenseItemCardProps) {
  const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;
  const catDetails = getCategoryDetails(e.category);
  const CatIcon = catDetails.icon;

  return (
    <div
      key={e.id || idx}
      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span
          className={classNames(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors",
            catDetails.bg
          )}
        >
          <HugeiconsIcon icon={CatIcon} className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={classNames(
                "text-[14px] font-bold text-kat-dark dark:text-slate-200 break-words line-clamp-1",
                e.isPendingDelete ? "line-through text-slate-400/60 dark:text-slate-600/60" : ""
              )}
            >
              {!e.description || e.description === e.category
                ? catMap[e.category] || e.category
                : e.description}
            </span>

            {e.isPendingDelete && (
              <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(e.changeRequestId))?.status ===
                "auto_approved"
                  ? t("expenses.deletingSugg")
                  : t("expenses.suggestDelete")}
              </span>
            )}
            {e.isPendingCreate && (
              <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(e.changeRequestId))?.status ===
                "auto_approved"
                  ? t("expenses.savingNew")
                  : t("expenses.suggestNew")}
              </span>
            )}
            {e.isPendingUpdate && (
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(e.changeRequestId))?.status ===
                "auto_approved"
                  ? t("expenses.savingNew")
                  : t("expenses.suggestEdit")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {e.date && (
              <span className="flex items-center gap-1 shrink-0">
                <HugeiconsIcon
                  icon={Calendar01Icon}
                  className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600"
                />
                {new Date(e.date).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            )}

            {e.payer && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {t("expenses.paidBy")}{" "}
                  <span className="text-slate-500 dark:text-slate-400 font-extrabold">
                    {e.payer}
                  </span>
                </span>
              </>
            )}

            {e.splitType && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span
                  className={classNames(
                    "px-1.5 py-0.2 rounded-md text-[9.5px] font-extrabold border shrink-0",
                    e.splitType === "shared"
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/60 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {e.splitType === "personal"
                    ? t("expenses.personalLabel")
                    : e.splitMode === "perGroup"
                      ? t("expenses.splitPerGroup")
                      : t("expenses.splitShared")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-3">
        <span
          className={classNames(
            "text-[15px] font-black text-kat-dark dark:text-white whitespace-nowrap",
            e.isPendingDelete ? "line-through text-slate-400 dark:text-slate-600 opacity-60" : ""
          )}
        >
          {formatMoney(e.amount)}
        </span>
        {isRequestEdit && !isPending && (
          <div className="shrink-0">
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                onMenuClick(String(e.id), rect);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-90 transition-all focus:outline-none cursor-pointer"
              title={t("expenses.suggestOption")}
            >
              <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
