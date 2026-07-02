import React, { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  Calendar01Icon,
  Wallet01Icon,
  CheckmarkCircle01Icon,
  BookOpen01Icon,
  UserGroupIcon,
  File01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Location01Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { useTripData } from "../../hooks/useTripData";
import {
  db,
  EventItem,
  Expense,
  ChecklistItem,
  JournalEntry,
  Member,
  TravelDocument,
} from "../../db";
import { normalizeSearchText, formatDate, formatMoney } from "../../utils/helpers";

interface SearchModalProps {
  tripId: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: "timeline" | "expenses" | "checklist" | "more") => void;
  onNavigateMore: (
    section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents"
  ) => void;
}

export function TripSearchModal({
  tripId,
  isOpen,
  onClose,
  onNavigateTab,
  onNavigateMore,
}: SearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    trip,
    events: rawEvents,
    expenses: rawExpenses,
    checklist: rawChecklist,
    journals: rawJournals,
    members: rawMembers,
    travelDocuments,
    backupPlans: rawBackupPlans,
  } = useTripData(tripId, false, false, false);

  const events = rawEvents ?? [];
  const expenses = rawExpenses ?? [];
  const checklist = rawChecklist ?? [];
  const journals = rawJournals ?? [];
  const members = rawMembers ?? [];
  const travelDocs = travelDocuments ?? [];
  const backupPlans = rawBackupPlans ?? [];

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQ = normalizeSearchText(query);
  const isSearching = normalizedQ.length > 0;

  // Filter logic
  const matchedEvents = isSearching
    ? events.filter(
        (e) =>
          normalizeSearchText(e.title).includes(normalizedQ) ||
          normalizeSearchText(e.location || "").includes(normalizedQ) ||
          normalizeSearchText(e.notes || "").includes(normalizedQ)
      )
    : [];

  const matchedExpenses = isSearching
    ? expenses.filter(
        (e) =>
          normalizeSearchText(e.description || "").includes(normalizedQ) ||
          normalizeSearchText(e.payer || "").includes(normalizedQ) ||
          normalizeSearchText(e.category || "").includes(normalizedQ)
      )
    : [];

  const matchedChecklist = isSearching
    ? checklist.filter(
        (c) =>
          normalizeSearchText(c.title).includes(normalizedQ) ||
          normalizeSearchText(c.assignedTo || "").includes(normalizedQ) ||
          normalizeSearchText(c.note || "").includes(normalizedQ)
      )
    : [];

  const matchedJournals = isSearching
    ? journals.filter(
        (j) =>
          normalizeSearchText(j.title || "").includes(normalizedQ) ||
          normalizeSearchText(j.content || "").includes(normalizedQ)
      )
    : [];

  const matchedMembers = isSearching
    ? members.filter(
        (m) =>
          normalizeSearchText(m.name).includes(normalizedQ) ||
          normalizeSearchText(m.role || "").includes(normalizedQ) ||
          normalizeSearchText(m.phone || "").includes(normalizedQ) ||
          normalizeSearchText(m.note || "").includes(normalizedQ)
      )
    : [];

  const matchedDocs = isSearching
    ? travelDocs.filter(
        (d) =>
          normalizeSearchText(d.title).includes(normalizedQ) ||
          normalizeSearchText(d.code || "").includes(normalizedQ) ||
          normalizeSearchText(d.note || "").includes(normalizedQ) ||
          normalizeSearchText(d.link || "").includes(normalizedQ)
      )
    : [];

  const matchedBackupPlans = isSearching
    ? backupPlans.filter(
        (p) =>
          normalizeSearchText(p.title).includes(normalizedQ) ||
          normalizeSearchText(p.reason || "").includes(normalizedQ) ||
          normalizeSearchText(p.location || "").includes(normalizedQ) ||
          normalizeSearchText(p.note || "").includes(normalizedQ)
      )
    : [];

  const totalResults =
    matchedEvents.length +
    matchedExpenses.length +
    matchedChecklist.length +
    matchedJournals.length +
    matchedMembers.length +
    matchedDocs.length +
    matchedBackupPlans.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-10 pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md motion-modal-overlay"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-floating rounded-3xl overflow-hidden motion-modal-dialog">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <HugeiconsIcon
            icon={Search01Icon}
            className="h-5.5 w-5.5 text-slate-400 dark:text-slate-500 shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-[16px] font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none border-none bg-transparent"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-350 transition-colors motion-press"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[14px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 shrink-0 transition-colors"
          >
            {t("search.close")}
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {!isSearching ? (
            <div className="flex flex-col py-2">
              <div className="flex flex-col items-center justify-center py-6 text-center mb-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 mb-4 border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">
                  <HugeiconsIcon icon={Search01Icon} className="h-6 w-6 relative z-10" />
                  <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 blur-md scale-110"></div>
                </div>
                <p className="text-[15px] font-extrabold text-slate-700 dark:text-slate-200">
                  {t("search.emptyTitle")}
                </p>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                  {t("search.emptySubtitle")}
                </p>
              </div>

              <div className="px-2">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                  Gợi ý tìm kiếm
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { label: t("search.timeline") || "Lịch trình", icon: Calendar01Icon },
                    { label: t("search.expenses") || "Chi phí", icon: Wallet01Icon },
                    { label: "Hành lý", icon: CheckmarkCircle01Icon },
                    { label: "Giấy tờ", icon: File01Icon },
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(suggestion.label)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-white transition-all active:scale-[0.97]"
                    >
                      <HugeiconsIcon
                        icon={suggestion.icon}
                        className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500"
                      />
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[14px] font-extrabold text-slate-600 dark:text-slate-300">
                {t("search.noResults")}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                {t("search.noResultsHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. Lịch trình */}
              {matchedEvents.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={Calendar01Icon} className="w-3.5 h-3.5" />{" "}
                    {t("search.timeline")} ({matchedEvents.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedEvents.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateTab("timeline");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12.5px] font-semibold text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon
                                icon={Clock01Icon}
                                className="w-3 h-3 text-slate-300 dark:text-slate-600"
                              />{" "}
                              {formatDate(item.date)} {item.time ? `• ${item.time}` : ""}
                            </span>
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon
                                  icon={Location01Icon}
                                  className="w-3 h-3 text-slate-300 dark:text-slate-600"
                                />{" "}
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phương án dự phòng */}
              {matchedBackupPlans.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={GitBranchIcon} className="w-3.5 h-3.5" /> Phương án dự
                    phòng ({matchedBackupPlans.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedBackupPlans.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateTab("timeline");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10.5px] font-bold text-kat-primary dark:text-kat-primary-usable bg-kat-primary-light dark:bg-kat-primary-soft/30 px-2 py-0.5 rounded-md border border-kat-primary/20 dark:border-kat-primary/30">
                              {t(`backupPlans.type.${item.type}`)}
                            </span>
                          </div>
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12.5px] font-semibold text-slate-400 dark:text-slate-500">
                            {item.reason && (
                              <span className="flex items-center gap-1">
                                {t("search.when")}: {item.reason}
                              </span>
                            )}
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon
                                  icon={Location01Icon}
                                  className="w-3 h-3 text-slate-300 dark:text-slate-600"
                                />{" "}
                                {item.location}
                              </span>
                            )}
                            {item.date && (
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon
                                  icon={Calendar01Icon}
                                  className="w-3 h-3 text-slate-300 dark:text-slate-600"
                                />{" "}
                                {formatDate(item.date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Chi phí */}
              {matchedExpenses.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={Wallet01Icon} className="w-3.5 h-3.5" />{" "}
                    {t("search.expenses")} ({matchedExpenses.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedExpenses.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateTab("expenses");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.description || t("search.expenseDefault")}
                          </p>
                          <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                            {t("search.payer")}:{" "}
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {item.payer}
                            </span>{" "}
                            • {t("search.category")}:{" "}
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {item.category}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14.5px] font-black text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 px-2.5 py-0.5 rounded-full">
                            {formatMoney(item.amount, trip?.defaultCurrency || "VND")}
                          </span>
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Chuẩn bị / Checklist */}
              {matchedChecklist.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-3.5 h-3.5" />{" "}
                    {t("search.checklist")} ({matchedChecklist.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedChecklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateTab("checklist");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.title}
                          </p>
                          <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                            {t("search.status")}:{" "}
                            <span
                              className={
                                item.completed
                                  ? "text-emerald-500 font-bold"
                                  : "text-amber-500 font-bold"
                              }
                            >
                              {item.completed ? t("search.prepared") : t("search.notPrepared")}
                            </span>
                            {item.assignedTo && (
                              <span>
                                {" "}
                                • {t("search.assignee")}:{" "}
                                <span className="font-bold text-slate-600 dark:text-slate-300">
                                  {item.assignedTo}
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Giấy tờ & Đặt chỗ */}
              {matchedDocs.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={File01Icon} className="w-3.5 h-3.5" />{" "}
                    {t("search.documents")} ({matchedDocs.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedDocs.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateMore("documents");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.title}
                          </p>
                          <p className="text-[12.5px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                            {item.code ? (
                              <span>
                                {t("search.code")}:{" "}
                                <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                  {item.code}
                                </span>
                              </span>
                            ) : (
                              t("search.noCode")
                            )}
                          </p>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Bản tin */}
              {matchedJournals.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={BookOpen01Icon} className="w-3.5 h-3.5" />{" "}
                    {t("search.journals")} ({matchedJournals.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedJournals.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateMore("journal");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.title || t("search.journalDefault")}
                          </p>
                          <p className="text-[12.5px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-1">
                            {item.content}
                          </p>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Thành viên */}
              {matchedMembers.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-1.5 px-1.5 mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <HugeiconsIcon icon={UserGroupIcon} className="w-3.5 h-3.5" />{" "}
                    {t("search.members")} ({matchedMembers.length})
                  </h5>
                  <div className="space-y-2">
                    {matchedMembers.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateMore("members");
                          onClose();
                        }}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-kat-primary/30 hover:bg-slate-50/35 dark:hover:bg-slate-800/40 cursor-pointer transition-all motion-press"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[14.5px] font-extrabold text-kat-dark truncate">
                            {item.name}
                          </p>
                          <p className="text-[12.5px] font-semibold text-slate-500 mt-1">
                            {t("search.role")}:{" "}
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {item.role || t("search.companion")}
                            </span>
                            {item.phone && (
                              <span>
                                {" "}
                                • {t("search.phone")}:{" "}
                                <span className="font-bold text-slate-600 dark:text-slate-300">
                                  {item.phone}
                                </span>
                              </span>
                            )}
                          </p>
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-kat-primary group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
