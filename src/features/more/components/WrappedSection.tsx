import { db } from "../../../db";
import { moodLabels, formatDate, formatMoney } from "../../../utils/helpers";
import { exportTripPdf, exportItineraryPdf } from "../../../utils/exportPdf";
import { TripData, getWrappedStats } from "../../../utils/helpers";
import { classNames } from "../../../utils/helpers";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../../constants/currencies";
import { showToast } from "../../../components/ui/ToastManager";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AwardIcon,
  BookOpen01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Car01Icon,
  Camera01Icon,
  CallIcon,
  CircleUnlock01Icon,
  CheckIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock01Icon,
  Coffee01Icon,
  CompassIcon,
  CopyIcon,
  CrownIcon,
  DatabaseBackupIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  FileDownloadIcon,
  GlobeIcon,
  InformationCircleIcon,
  Location01Icon,
  Coins01Icon,
  LockIcon,
  Luggage01Icon,
  MapsIcon,
  MoreVerticalIcon,
  Note01Icon,
  PackageIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Route01Icon,
  Search01Icon,
  Share01Icon,
  SmilePlusIcon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
  Table01Icon,
  Ticket01Icon,
  UserIcon,
  UserAdd01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  ChevronDownIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

export function WrappedSection({
  data,
  setSection,
}: {
  data: TripData;
  setSection: (section: any) => void;
}) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const stats = getWrappedStats(data);
  const mood = stats.mostCommonMood ? t(`journal.mood_${stats.mostCommonMood}`) : undefined;

  // Derived Finance Data
  const sharedExpenses = data.expenses.filter((e) => e.splitType !== "personal" && !e.isDeleted);
  const personalExpenses = data.expenses.filter((e) => e.splitType === "personal" && !e.isDeleted);
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Storytelling Logic
  const sortedEvents = [...data.events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  );
  const sortedJournals = [...data.journals].sort((a, b) => a.date.localeCompare(b.date));

  let firstMomentText = "";
  if (sortedEvents.length > 0 && sortedJournals.length > 0) {
    if (sortedEvents[0].date <= sortedJournals[0].date) {
      firstMomentText = `${t("more.wrappedFirstMomentEvent1")} "${sortedEvents[0].title}" ${t("more.onDate", "vào ngày")} ${formatDate(sortedEvents[0].date)}.`;
    } else {
      firstMomentText = `${t("more.wrappedFirstMomentJournal1")} ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
    }
  } else if (sortedEvents.length > 0) {
    firstMomentText = `${t("more.wrappedFirstMomentEvent1")} "${sortedEvents[0].title}" ${t("more.onDate", "vào ngày")} ${formatDate(sortedEvents[0].date)}.`;
  } else if (sortedJournals.length > 0) {
    firstMomentText = `${t("more.wrappedFirstMomentJournal1")} ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
  }

  const eventsByDate = data.events.reduce<Record<string, import("../../../db").EventItem[]>>(
    (result, item) => {
      result[item.date] = [...(result[item.date] ?? []), item];
      return result;
    },
    {}
  );

  let maxEventsDate = "";
  let maxEventsCount = 0;
  Object.entries(eventsByDate).forEach(([date, evs]) => {
    if (evs.length > maxEventsCount) {
      maxEventsCount = evs.length;
      maxEventsDate = date;
    }
  });

  const uniqueLocations = Array.from(
    new Set(data.events.filter((e) => e.location.trim() !== "").map((e) => e.location.trim()))
  );

  async function handleExportPdf() {
    setIsGeneratingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const { exportTripPdf } = await import("../../../utils/exportPdf");
      await exportTripPdf(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-1 md:px-0 space-y-6 md:space-y-8 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSection("overview")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all shrink-0 motion-press"
            title="Quay lại"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark">
                {t("more.featureWrapped")}
              </h2>
            </div>
            <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">
              {t("more.wrappedSubtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-5 text-[13.5px] font-bold hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-95 transition-all motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center disabled:opacity-50 disabled:cursor-not-allowed border border-transparent dark:border-kat-primary"
        >
          <HugeiconsIcon
            icon={FileDownloadIcon}
            className={classNames("h-4 w-4", !isGeneratingPdf && "animate-bounce")}
          />
          <span>{isGeneratingPdf ? t("more.wrappedExporting") : t("more.wrappedExportPdf")}</span>
        </button>
      </div>

      {/* Bento Row 1: Hero Recap & Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {/* Hero Recap Card */}
          <section className="relative overflow-hidden rounded-[32px] bg-white/70 dark:bg-[#0E172A]/40 border border-slate-200/50 dark:border-white/5 p-8 text-kat-text shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex-1 flex flex-col justify-center">
            {/* Subtle ambient light behind the compass */}
            <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-kat-primary/5 dark:bg-kat-primary/10 blur-[40px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-kat-primary/20 to-teal-400/20 text-kat-primary mb-4 ring-4 ring-kat-primary/5 border border-kat-primary/20 shadow-sm">
                <HugeiconsIcon icon={CompassIcon} className="h-6 w-6" />
              </div>
              <h2 className="text-[30px] md:text-[36px] font-black leading-tight tracking-tight text-kat-dark dark:text-white">
                {data.trip.title}
              </h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
                  <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-kat-primary" />
                  {data.trip.location || t("more.noLocation")}
                </span>
                {data.trip.tripType === "dayTrip" || data.trip.startDate === data.trip.endDate ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        className="h-4 w-4 text-[#0081BE] dark:text-[#33A6DA]"
                      />
                      {formatDate(data.trip.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-kat-primary-soft border border-kat-primary/15 px-3 py-1.5 text-[12.5px] font-extrabold text-kat-primary-usable">
                      <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                      {t("more.wrappedDayTrip")}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="h-4 w-4 text-[#0081BE] dark:text-[#33A6DA]"
                    />
                    {formatDate(data.trip.startDate)} – {formatDate(data.trip.endDate)}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 flex flex-col">
          {/* Memory / Mood Section */}
          {(() => {
            const moodThemes: Record<
              string,
              { gradient: string; glow: string; iconColor: string }
            > = {
              great: {
                // Hào hứng
                gradient: "from-pink-500 via-rose-500 to-amber-500",
                glow: "bg-rose-500/5 dark:bg-rose-500/10",
                iconColor:
                  "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 ring-rose-500/5 dark:ring-rose-500/10",
              },
              good: {
                // Vui
                gradient: "from-amber-500 via-orange-500 to-rose-500",
                glow: "bg-amber-500/5 dark:bg-amber-500/10",
                iconColor:
                  "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 ring-amber-500/5 dark:ring-amber-500/10",
              },
              okay: {
                // Bình yên
                gradient: "from-emerald-400 via-teal-500 to-cyan-500",
                glow: "bg-teal-500/5 dark:bg-teal-500/10",
                iconColor:
                  "text-teal-500 bg-teal-500/10 dark:bg-teal-500/20 ring-teal-500/5 dark:ring-teal-500/10",
              },
              bad: {
                // Bất ngờ
                gradient: "from-indigo-400 via-purple-500 to-pink-500",
                glow: "bg-indigo-500/5 dark:bg-indigo-500/10",
                iconColor:
                  "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 ring-indigo-500/5 dark:ring-indigo-500/10",
              },
              very_bad: {
                // Mệt
                gradient: "from-slate-400 via-zinc-500 to-blue-500",
                glow: "bg-slate-500/5 dark:bg-slate-500/10",
                iconColor:
                  "text-slate-500 bg-slate-500/10 dark:bg-slate-500/20 ring-slate-500/5 dark:ring-slate-500/10",
              },
            };

            const activeMoodKey = stats.mostCommonMood || "good";
            const theme = moodThemes[activeMoodKey] || moodThemes.good;

            return (
              <div className="rounded-[32px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-center flex flex-col items-center justify-center relative overflow-hidden flex-1">
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${theme.glow} blur-[30px] pointer-events-none`}
                />
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full mb-4 ring-4 shrink-0 ${theme.iconColor}`}
                >
                  <HugeiconsIcon icon={SmilePlusIcon} className="h-6 w-6" />
                </div>
                <h3 className="text-[13px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2 shrink-0">
                  {t("more.wrappedMoodTitle")}
                </h3>
                {mood ? (
                  <div className="mt-2 flex flex-col items-center animate-fadeIn">
                    <p
                      className={`text-[32px] md:text-[36px] font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent drop-shadow-sm`}
                    >
                      {mood}
                    </p>
                    <p className="mt-2 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 text-center max-w-[280px] leading-relaxed">
                      {t("more.wrappedMoodDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center mt-2">
                    <p className="text-[16px] font-extrabold text-kat-dark mb-1.5">
                      {t("more.wrappedNoMoodData")}
                    </p>
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 mb-5 max-w-sm">
                      {t("more.wrappedNoMoodDesc")}
                    </p>
                    <button
                      onClick={() => setSection("journal")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary px-5 py-2.5 text-[14px] font-extrabold text-white dark:text-slate-950 hover:bg-kat-dark/95 dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] transition-all shadow-sm border border-transparent dark:border-kat-primary"
                    >
                      <HugeiconsIcon icon={BookOpen01Icon} className="h-4.5 w-4.5" />
                      {t("more.wrappedPostFirstJournal")}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 transition-all hover:scale-[1.015] hover:shadow-md duration-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <HugeiconsIcon icon={Sun01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark dark:text-white leading-none block">
              {stats.totalDays}
            </span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">
              {t("more.wrappedDays")}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 transition-all hover:scale-[1.015] hover:shadow-md duration-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-teal border border-kat-teal border-opacity-20">
            <HugeiconsIcon icon={Route01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark dark:text-white leading-none block">
              {stats.activityCount}
            </span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-455 mt-1 block">
              {t("more.wrappedEvents")}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 transition-all hover:scale-[1.015] hover:shadow-md duration-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark dark:text-white leading-none block">
              {stats.checklistPercent}%
            </span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-455 mt-1 block">
              {t("more.wrappedPacking")}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4 transition-all hover:scale-[1.015] hover:shadow-md duration-300">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-teal border border-kat-teal border-opacity-20">
            <HugeiconsIcon icon={BookOpen01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark dark:text-white leading-none block">
              {stats.journalCount}
            </span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-455 mt-1 block">
              {t("more.wrappedJournals")}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Row 3: Finance Recap & Storytelling Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          {/* Finance Recap */}
          <div className="rounded-[32px] bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-8 text-kat-text shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden flex-1 flex flex-col justify-center">
            {/* Decorative corner glow */}
            <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[40px] pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-[13px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <HugeiconsIcon icon={WalletCardsIcon} className="h-5 w-5 text-kat-primary" />
                {t("more.wrappedExpenseTitle")}
              </h3>

              {data.expenses.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">
                      {t("more.wrappedTotalExpense")}
                    </p>
                    <p className="mt-2 text-[42px] md:text-[48px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent leading-none tracking-tight">
                      {formatMoney(stats.totalExpense)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div className="bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/10 dark:border-emerald-500/5 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                        {t("more.wrappedSharedExpense")}
                      </p>
                      <p className="mt-2.5 text-[20px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        {formatMoney(sharedTotal)}
                      </p>
                    </div>
                    <div className="bg-slate-500/[0.04] dark:bg-slate-500/[0.06] border border-slate-500/10 dark:border-slate-500/5 rounded-2xl p-4 flex flex-col justify-center">
                      <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                        {t("more.wrappedPersonalExpense")}
                      </p>
                      <p className="mt-2.5 text-[20px] font-black text-slate-700 dark:text-slate-200 leading-none">
                        {formatMoney(personalTotal)}
                      </p>
                    </div>
                  </div>

                  {data.members.length === 0 ? (
                    <div className="max-w-xl">
                      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/25 px-4 py-3.5 text-[13.5px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        {t("more.wrappedNoMembersExpense")}
                      </div>
                    </div>
                  ) : (
                    <>
                      {stats.topPayer && (
                        <div className="max-w-xl">
                          <div className="rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.08] border border-amber-500/15 dark:border-amber-500/10 p-4 flex items-start gap-3.5 shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 shadow-inner">
                              <HugeiconsIcon icon={StarIcon} className="h-5.5 w-5.5" />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider leading-none">
                                {t("more.wrappedTopPayer")}
                              </p>
                              <p className="mt-2.5 text-[14px] font-medium leading-relaxed text-slate-600 dark:text-slate-350">
                                <span className="font-extrabold text-slate-800 dark:text-white">
                                  {stats.topPayer.name}
                                </span>{" "}
                                {t("more.wrappedTopPayerDesc")}{" "}
                                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                  {formatMoney(stats.topPayer.amount)}
                                </span>
                                .
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl bg-slate-50/40 dark:bg-slate-800/10">
                  <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-450">
                    {t("more.wrappedNoExpenseData")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* First Moment */}
          <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:scale-[1.015] hover:shadow-md duration-300 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <HugeiconsIcon icon={Camera01Icon} className="h-5 w-5 text-amber-500" />
              <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                {t("more.wrappedFirstMoment")}
              </h4>
            </div>
            <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
              {firstMomentText ||
                "Chưa có dấu ấn đầu tiên. Hãy thêm hoạt động hoặc đăng bài viết để lưu lại khoảnh khắc mở đầu."}
            </p>
          </div>

          {/* Most Eventful Day */}
          <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:scale-[1.015] hover:shadow-md duration-300 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <HugeiconsIcon icon={StarIcon} className="h-5 w-5 text-amber-500" />
              <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                {t("more.wrappedBusiestDay")}
              </h4>
            </div>
            <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
              {maxEventsDate ? (
                <>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {formatDate(maxEventsDate)}
                  </span>{" "}
                  {t("more.wrappedBusiestDayDesc")}{" "}
                  <span className="font-bold text-kat-dark">
                    {maxEventsCount} {t("more.wrappedBusiestDayDesc2")}
                  </span>
                </>
              ) : (
                t("more.wrappedNoBusiestDay")
              )}
            </p>
          </div>

          {/* Locations Visited */}
          <div className="rounded-[24px] border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0E172A]/40 backdrop-blur-md p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between transition-all hover:scale-[1.015] hover:shadow-md duration-300 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <HugeiconsIcon icon={MapsIcon} className="h-5 w-5 text-kat-primary" />
              <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                {t("more.wrappedLocations")}
              </h4>
            </div>
            <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
              {uniqueLocations.length > 0
                ? uniqueLocations.join(", ")
                : t("more.wrappedNoLocations")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
