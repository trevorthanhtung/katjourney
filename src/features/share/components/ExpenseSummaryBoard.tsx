import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ReceiptTextIcon,
  UserGroupIcon,
  UserIcon,
  CalculatorIcon,
  Add01Icon,
  PieChartIcon,
} from "@hugeicons/core-free-icons";
import { BreakdownSection } from "../../expenses/ExpensesScreen";

interface ExpenseSummaryBoardProps {
  totalExpense: number;
  totalShared: number;
  totalPersonal: number;
  avgPerGroup: number;
  avgPerPerson: number;
  hasGroups: boolean;
  members: any[];
  isRequestEdit: boolean;
  isDirectEdit: boolean;
  startAdd: () => void;
  categoryBreakdown: Record<string, number>;
  exactSharesByMember: Record<string, number>;
  trip: any;
  t: (key: string, options?: any) => string;
  formatMoney: (value: number, currency?: string) => string;
}

export function ExpenseSummaryBoard({
  totalExpense,
  totalShared,
  totalPersonal,
  avgPerGroup,
  avgPerPerson,
  hasGroups,
  members,
  isRequestEdit,
  isDirectEdit,
  startAdd,
  categoryBreakdown,
  exactSharesByMember,
  trip,
  t,
  formatMoney,
}: ExpenseSummaryBoardProps) {
  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] bg-kat-surface border-t-4 border-t-kat-dark dark:border-t-kat-border/40 border-x border-b border-slate-200 dark:border-kat-border/40 p-6 md:p-8 text-kat-dark dark:text-slate-100 shadow-soft">
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
                {formatMoney(totalExpense)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("expenses.sharedTrip")}
                  </p>
                  <p className="text-[18px] font-black text-[#00AFA8] dark:text-[#00BFB7] mt-0.5">
                    {formatMoney(totalShared)}
                  </p>
                </div>
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  className="h-5 w-5 text-[#00AFA8]/60 dark:text-[#00BFB7]/60 shrink-0 mt-0.5"
                />
              </div>
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("expenses.personalExpense")}
                  </p>
                  <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">
                    {formatMoney(totalPersonal)}
                  </p>
                </div>
                <HugeiconsIcon
                  icon={UserIcon}
                  className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                />
              </div>
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {hasGroups ? t("expenses.avgPerGroup") : t("expenses.avgPerPerson")}
                  </p>
                  {members.length > 0 ? (
                    <p className="text-[18px] font-black text-kat-dark dark:text-slate-200 mt-0.5">
                      {formatMoney(hasGroups ? avgPerGroup : avgPerPerson)}
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

          {isRequestEdit && (
            <div className="shrink-0 flex md:hidden items-center justify-end w-full">
              <button
                type="button"
                onClick={startAdd}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary hover:bg-opacity-95 dark:hover:brightness-110 text-white dark:text-slate-950 px-6 py-3 text-[14px] font-bold shadow-sm dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] motion-press h-[48px]"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
                {isDirectEdit ? t("expenses.addExpense") : t("share.suggestAdd")}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <section className="rounded-3xl border border-slate-100 dark:border-kat-border/40 bg-kat-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400">
              <HugeiconsIcon icon={PieChartIcon} className="h-4 w-4" />
            </span>
            <h3 className="text-[14px] font-extrabold text-kat-dark dark:text-white">
              {t("expenses.byCategory")}
            </h3>
          </div>
          <BreakdownSection
            items={categoryBreakdown}
            total={totalExpense}
            emptyText={t("expenses.noExpenseAnalysis")}
            currency={trip.defaultCurrency || "VND"}
          />
        </section>

        <section className="rounded-3xl border border-slate-100 dark:border-kat-border/40 bg-kat-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-[14px] font-extrabold text-kat-dark dark:text-white">
              {t("expenses.sharePerMember")}
            </h3>
          </div>
          {members.length > 0 ? (
            <BreakdownSection
              items={exactSharesByMember}
              total={totalShared}
              emptyText={t("expenses.noSharedAnalysis")}
              currency={trip.defaultCurrency || "VND"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                {t("expenses.addCompanionShare")}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
