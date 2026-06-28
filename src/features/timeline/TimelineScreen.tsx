import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckIcon,
  Cancel01Icon,
  Location01Icon,
  Add01Icon,
  Calendar01Icon,
  Delete01Icon,
  Clock01Icon,
  Route01Icon,
  MapPinned,
  ChevronRightIcon,
  MapsIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  StickyNote01Icon,
  TextIcon,
  GitBranchIcon,
  Dish01Icon,
  Camera01Icon,
  HotelIcon,
  Coffee01Icon,
  ShoppingBag01Icon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";
import { db, EventItem, Trip, Expense } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  classNames,
  formatDate,
  formatMoney,
  getTripTiming,
  formatDateShort,
  daysBetween,
  today,
} from "../../utils/helpers";
import {
  BottomSheet,
  FormActions,
  Input,
  Textarea,
  Select,
  TimePicker,
  DeleteConfirmModal,
} from "../../components/ui";
import { BackupPlansSheet } from "./BackupPlansSheet";
import { TimelineCalendarView } from "./TimelineCalendarView";
import { getEmbedMapUrl, ensureAbsoluteUrl, getMapFilterClass } from "../../utils/mapUtils";
import { WeatherWidget } from "./WeatherWidget";
import { useModalHistory } from "../../hooks/useModalHistory";

// Define categories for PWA Travel 2027
const ACTIVITY_CATEGORIES_BASE = [
  {
    id: "transport",
    labelKey: "timeline.catTransport",
    icon: Route01Icon,
    bgColor:
      "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    activeBg:
      "bg-blue-100 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300",
  },
  {
    id: "dining",
    labelKey: "timeline.catDining",
    icon: Dish01Icon,
    bgColor:
      "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
    activeBg:
      "bg-rose-100 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500 text-rose-700 dark:text-rose-300",
  },
  {
    id: "sightseeing",
    labelKey: "timeline.catSightseeing",
    icon: Camera01Icon,
    bgColor:
      "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    activeBg:
      "bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-300",
  },
  {
    id: "accommodation",
    labelKey: "timeline.catAccommodation",
    icon: HotelIcon,
    bgColor:
      "bg-slate-100 dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200 dark:border-slate-700/50",
    activeBg:
      "bg-kat-dark/10 dark:bg-slate-800 border-kat-dark dark:border-slate-650 text-kat-dark dark:text-slate-200",
  },
  {
    id: "relaxation",
    labelKey: "timeline.catRelaxation",
    icon: Coffee01Icon,
    bgColor:
      "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    activeBg:
      "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "shopping",
    labelKey: "timeline.catShopping",
    icon: ShoppingBag01Icon,
    bgColor:
      "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
    activeBg:
      "bg-purple-100 dark:bg-purple-950/40 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-emerald-300",
  },
  {
    id: "other",
    labelKey: "timeline.catOther",
    icon: MoreHorizontalCircle01Icon,
    bgColor:
      "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/40",
    activeBg:
      "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-350",
  },
];

function getCategory(id?: string) {
  return (
    ACTIVITY_CATEGORIES_BASE.find((c) => c.id === id) ||
    ACTIVITY_CATEGORIES_BASE[ACTIVITY_CATEGORIES_BASE.length - 1]
  );
}

const ActivityCard = React.memo(function ActivityCard({
  item,
  onEdit,
  isToday,
  isUpcoming,
  idx = 0,
  backupCount,
  linkedExpenses,
  onOpenBackup,
  onDelete,
  onAddExpense,
}: {
  item: EventItem;
  onEdit: () => void;
  isToday: boolean;
  isUpcoming: boolean;
  idx?: number;
  backupCount?: number;
  linkedExpenses?: Expense[];
  onOpenBackup?: () => void;
  onDelete: () => void;
  onAddExpense?: () => void;
}) {
  const { t } = useTranslation();
  const category = getCategory(item.type);
  const CatIcon = category.icon;

  const toggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.events.update(item.id!, { completed: !item.completed });
  };

  return (
    <article
      className={`group relative flex gap-4 pl-1 mb-6 last:mb-2 motion-card-enter motion-delay-${Math.min(idx + 1, 5)}`}
    >
      {/* Timeline connector line */}
      <div className="absolute bottom-0 left-[21px] top-11 w-0.5 bg-slate-200/80 dark:bg-slate-800 group-last:bg-transparent" />

      {/* Activity type icon serving as timeline marker (min 44x44px target) */}
      <div className="relative z-10 flex shrink-0">
        <button
          onClick={toggleComplete}
          className={classNames(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-4 ring-[#F8FAFC] dark:ring-[#0A1124] transition-all duration-200 motion-press",
            item.completed
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : `${category.bgColor} border hover:scale-105`
          )}
          aria-label={item.completed ? t("timeline.markIncomplete") : t("timeline.markComplete")}
        >
          {item.completed ? (
            <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
          ) : (
            <HugeiconsIcon icon={CatIcon} className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Card Body */}
      <div
        onClick={onEdit}
        className="min-w-0 flex-1 rounded-2xl bg-white dark:bg-kat-surface p-4 shadow-sm border border-slate-100 dark:border-kat-border hover:shadow-md hover:border-slate-200 dark:hover:border-kat-border cursor-pointer transition-all duration-200 motion-press"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Header: Time and Category Badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {item.time ? (
                <span className="flex items-center gap-1 text-[13px] font-bold text-sunset-600 dark:text-sunset-400 bg-sunset-50 dark:bg-sunset-950/20 px-2.5 py-0.5 rounded-full border border-sunset-100 dark:border-sunset-900/30">
                  <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3 shrink-0" />
                  {item.time}
                </span>
              ) : (
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-full border border-slate-100/60 dark:border-slate-700/40">
                  {t("timeline.noTimeSet")}
                </span>
              )}

              <span
                className={classNames(
                  "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                  category.bgColor
                )}
              >
                {t(category.labelKey)}
              </span>
            </div>

            {/* Title */}
            <h3
              className={classNames(
                "text-[17px] font-extrabold text-kat-dark leading-tight",
                item.completed && "text-slate-400 line-through decoration-slate-300"
              )}
            >
              {item.title}
            </h3>

            {/* Location */}
            {item.location && (
              <p className="mt-2 flex items-start gap-1 text-[14px] font-medium text-slate-600">
                <HugeiconsIcon
                  icon={Location01Icon}
                  className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"
                />
                <span className="truncate">{item.location}</span>
              </p>
            )}

            {/* Notes */}
            {item.notes && (
              <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-kat-border/40 font-medium">
                {item.notes}
              </p>
            )}

            {/* Google Maps link & Embed */}
            {(item.mapLink || item.location) && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                {getEmbedMapUrl(item.mapLink || item.location || "", item.location) && (
                  <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 relative min-h-[160px]">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <span className="text-[12px] font-medium animate-pulse">
                        {t("timeline.loadingMap")}
                      </span>
                    </div>
                    <iframe
                      title="Google Maps Embed"
                      width="100%"
                      height="160"
                      className={`border-0 relative z-10 ${getMapFilterClass(item.time)}`}
                      loading="lazy"
                      allowFullScreen
                      src={getEmbedMapUrl(item.mapLink || item.location || "", item.location)}
                    ></iframe>
                  </div>
                )}
                {(() => {
                  const isRoute =
                    item.mapLink &&
                    (item.mapLink.includes("/maps/dir/") || item.mapLink.includes("maps/dir"));
                  return (
                    <a
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                      href={
                        ensureAbsoluteUrl(item.mapLink) ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {isRoute ? (
                        <HugeiconsIcon icon={Route01Icon} className="w-3.5 h-3.5" />
                      ) : (
                        <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />
                      )}
                      {isRoute ? t("timeline.viewRoute") + " " : t("timeline.openGoogleMaps") + " "}
                      &rarr;
                    </a>
                  );
                })()}
              </div>
            )}

            {/* Backup Plans Badge */}
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBackup?.();
                }}
                className={classNames(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-colors motion-press",
                  backupCount && backupCount > 0
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-kat-border/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <HugeiconsIcon icon={GitBranchIcon} className="w-3.5 h-3.5" />
                {backupCount && backupCount > 0
                  ? t("timeline.backupPlansCount", { count: backupCount })
                  : t("timeline.addBackupPlan")}
              </button>
            </div>

            {/* Expenses Linked */}
            {((linkedExpenses && linkedExpenses.length > 0) || onAddExpense) && (
              <div
                className="mt-4 border-t border-slate-100 dark:border-kat-border/40 pt-3 flex flex-wrap items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {linkedExpenses?.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[12px] rounded-lg border border-rose-200 dark:border-rose-900/30 shadow-sm"
                  >
                    <span className="font-extrabold">{formatMoney(exp.amount)}</span>
                    <span className="text-rose-600 dark:text-rose-400/80 truncate max-w-[120px] font-medium">
                      - {exp.description || exp.category}
                    </span>
                  </div>
                ))}
                {onAddExpense && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddExpense();
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-[12px] font-bold transition-colors"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                    {t("timeline.addExpense")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

function DayHeader({
  day,
  index,
  isToday,
  totalExpense = 0,
  mapUrl,
}: {
  day: string;
  index: number;
  isToday: boolean;
  totalExpense?: number;
  mapUrl?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      id={`day-section-${day}`}
      className="scroll-mt-[110px] md:scroll-mt-[120px] sticky top-[var(--sticky-header-offset,60px)] md:top-[var(--sticky-header-offset-md,68px)] transition-[top] duration-300 ease-in-out z-20 -mx-4 mb-4 flex items-center justify-between bg-slate-50/95 dark:bg-slate-900/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/60"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-dark dark:bg-slate-800 text-white dark:text-slate-200 font-black text-[14px] shadow-sm shrink-0">
          {index + 1}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[16px] font-extrabold text-kat-dark dark:text-slate-200">
              {t("timeline.dayN", { n: index + 1 })}
            </h4>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-[11px] font-extrabold tracking-wide transition-all active:scale-95 shadow-sm"
                title={t("timeline.openRouteMap")}
              >
                <HugeiconsIcon
                  icon={Location01Icon}
                  className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
                />
                <span>{t("timeline.map")}</span>
              </a>
            )}
          </div>
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
            {formatDate(day)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {totalExpense > 0 && (
          <span className="text-[12.5px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border px-2.5 py-1 rounded-lg shadow-sm">
            {t("timeline.spent", { amount: formatMoney(totalExpense) })}
          </span>
        )}
        {isToday && (
          <span className="rounded-full bg-sunset-100 dark:bg-sunset-950/20 px-3 py-1 text-[10.5px] font-black uppercase tracking-widest text-sunset-700 dark:text-sunset-400 border border-transparent dark:border-sunset-900/30 shadow-inner">
            {t("timeline.today")}
          </span>
        )}
      </div>
    </div>
  );
}

function EventForm({
  tripId,
  tripDays,
  editing,
  isOpen,
  onClose,
  defaultDate,
  onSaved,
  onDelete,
}: {
  tripId: number;
  tripDays: string[];
  editing: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSaved?: (date: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    time: "",
    title: "",
    location: "",
    notes: "",
    mapLink: "",
    type: "other",
    date: "",
  });

  // Tránh reset form khi đang nhập mà parent component render lại
  const editingId = editing?.id;
  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? {
              time: editing.time || "",
              title: editing.title || "",
              location: editing.location || "",
              notes: editing.notes || "",
              mapLink: editing.mapLink || "",
              type: editing.type || "other",
              date: editing.date || tripDays[0] || today,
            }
          : {
              time: "",
              title: "",
              location: "",
              notes: "",
              mapLink: "",
              type: "other",
              date: defaultDate || (tripDays.includes(today) ? today : tripDays[0] || today),
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  async function save() {
    if (!form.title.trim()) return;
    const cleanForm = {
      ...form,
      mapLink: form.mapLink ? ensureAbsoluteUrl(form.mapLink) : "",
    };
    if (editing?.id) {
      await db.events.update(editing.id, {
        ...cleanForm,
        completed: editing.completed,
      });
      onSaved?.(form.date);
      onClose();
    } else {
      await db.events.add({
        ...cleanForm,
        tripId,
        completed: false,
      });
      onSaved?.(form.date);
      onClose();
    }
  }

  const dateLabels = tripDays.reduce(
    (acc, date, idx) => {
      acc[date] = t("timeline.dayNDate", { n: idx + 1, date: formatDate(date) });
      return acc;
    },
    {} as Record<string, string>
  );

  const selectedDateIdx = tripDays.indexOf(form.date);
  const helperText =
    selectedDateIdx !== -1
      ? t("timeline.activityWillBeAdded", { n: selectedDateIdx + 1, date: formatDate(form.date) })
      : "";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("timeline.editActivity") : t("timeline.addActivity")}
      footer={
        <div className="flex items-center gap-2.5 w-full">
          {editing && (
            <button
              type="button"
              onClick={onDelete}
              title={t("timeline.deleteThisActivity")}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 transition-all hover:bg-rose-100/50 dark:hover:bg-rose-900/30 active:scale-[0.96] motion-press"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-[52px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.96] transition-all border border-transparent dark:border-slate-700 motion-press"
          >
            {t("timeline.cancel")}
          </button>

          <button
            type="button"
            onClick={save}
            disabled={!form.title.trim()}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-6 font-black shadow-sm hover:bg-kat-dark/95 dark:hover:bg-kat-primary-light active:scale-[0.98] transition-all border border-transparent disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent disabled:cursor-not-allowed motion-press"
          >
            <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
            {editing ? t("timeline.saveChanges") : t("timeline.addActivity")}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title Input */}
        <Input
          label={
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={TextIcon} className="h-4 w-4 text-slate-500" />
              {t("timeline.titleLabel")}
            </span>
          }
          value={form.title}
          onChange={(title) => setForm({ ...form, title })}
          placeholder={t("timeline.titlePlaceholder")}
        />

        {/* Category Selector Grid */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">{t("timeline.activityType")}</span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {ACTIVITY_CATEGORIES_BASE.map((cat) => {
              const Icon = cat.icon;
              const isSelected = form.type === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: cat.id })}
                  className={classNames(
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center h-[64px] motion-press",
                    isSelected
                      ? cat.activeBg
                      : "border-slate-200 dark:border-kat-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400"
                  )}
                >
                  <HugeiconsIcon icon={Icon} className="h-5 w-5" />
                  <span className="text-[10px] font-bold leading-none">{t(cat.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            {tripDays.length > 0 ? (
              <Select
                label={
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                    {t("timeline.selectDate")}
                  </span>
                }
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                options={tripDays}
                labels={dateLabels}
              />
            ) : (
              <Input
                label={
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                    {t("timeline.dateLabel")}
                  </span>
                }
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
              />
            )}
            {helperText && (
              <p className="px-1 text-[12px] font-semibold text-slate-500">{helperText}</p>
            )}
          </div>

          <TimePicker
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4 text-slate-500" />
                {t("timeline.timeLabel")}
              </span>
            }
            value={form.time}
            onChange={(time) => setForm({ ...form, time })}
          />
        </div>

        {/* Location and Map link */}
        <div className="flex flex-col gap-4">
          <Input
            label={
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-500" />
                  {t("timeline.location")}
                </span>
                <span className="text-xs font-normal text-slate-400">
                  {t("timeline.locationHelper")}
                </span>
              </span>
            }
            value={form.location}
            onChange={(location) => setForm({ ...form, location })}
            placeholder={t("timeline.locationPlaceholder")}
          />
          <Input
            label={
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={MapsIcon} className="h-4 w-4 text-slate-500" />
                  Link Google Maps
                </span>
                <span className="text-xs font-normal text-slate-400">
                  {t("timeline.pasteMapLink")}
                </span>
              </span>
            }
            value={form.mapLink}
            onChange={(mapLink) => setForm({ ...form, mapLink })}
            placeholder="https://maps.google.com/..."
          />
          {form.mapLink && (
            <div className="mt-1 flex justify-end">
              <a
                href={ensureAbsoluteUrl(form.mapLink)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />
                {t("timeline.checkLink")} &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Notes */}
        <Textarea
          label={
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={StickyNote01Icon} className="h-4 w-4 text-slate-500" />
              {t("timeline.notesLabel")}
            </span>
          }
          value={form.notes}
          onChange={(notes) => setForm({ ...form, notes })}
          placeholder={t("timeline.notesPlaceholder")}
        />
      </div>
    </BottomSheet>
  );
}

export function TimelineScreen({
  trip,
  events,
  expenses = [],
  selectedDestIndex,
  onSelectDestIndex,
  onAddExpense,
  isReadOnly,
}: {
  trip: Trip;
  events: EventItem[];
  expenses?: Expense[];
  selectedDestIndex?: number;
  onSelectDestIndex?: (index: number) => void;
  onAddExpense?: (date: string, eventId: number) => void;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const tripDays = daysBetween(trip.startDate, trip.endDate);
  const eventDays = Array.from(new Set(events.map((e) => e.date)));
  const days = Array.from(new Set([...tripDays, ...eventDays]))
    .filter(Boolean)
    .sort();
  const tripIsActive = today >= trip.startDate && today <= trip.endDate;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<string>("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  const [isBackupPlansOpen, setIsBackupPlansOpen] = useState(false);
  const [backupPlanCtx, setBackupPlanCtx] = useState<{ activityId?: number; date?: string }>({});

  const [selectedRoadmapDay, setSelectedRoadmapDay] = useState<string>("");
  const [isRoadmapFormOpen, setIsRoadmapFormOpen] = useState(false);
  const [isRoadmapDayPickerOpen, setIsRoadmapDayPickerOpen] = useState(false);
  const [roadmapEditDay, setRoadmapEditDay] = useState<string>("");
  const [roadmapInputLink, setRoadmapInputLink] = useState("");

  useEffect(() => {
    if (days.length > 0 && !selectedRoadmapDay) {
      setSelectedRoadmapDay(days[0]);
    }
  }, [days, selectedRoadmapDay]);

  const handleSaveRoadmap = async () => {
    if (!roadmapEditDay) return;
    try {
      const currentRoadmaps = { ...(trip.dayRoadmaps || {}) };
      if (roadmapInputLink.trim()) {
        currentRoadmaps[roadmapEditDay] = ensureAbsoluteUrl(roadmapInputLink.trim());
      } else {
        delete currentRoadmaps[roadmapEditDay];
      }
      await db.trips.update(trip.id!, { dayRoadmaps: currentRoadmaps });
      if (trip.shareToken) {
        try {
          const { updateSharedTripRoadmaps } = await import("../../services/sharedTripEditService");
          await updateSharedTripRoadmaps(trip.shareToken, currentRoadmaps);
        } catch (shareErr) {
          console.error("Lỗi khi đồng bộ lộ trình lên cloud:", shareErr);
        }
      }
      setIsRoadmapFormOpen(false);
    } catch (err) {
      console.error("Lỗi khi lưu lộ trình:", err);
      alert(t("timeline.saveError"));
    }
  };

  useModalHistory(
    isFormOpen,
    () => {
      setIsFormOpen(false);
      setEditing(null);
    },
    "activity-form-modal"
  );

  useModalHistory(
    isBackupPlansOpen,
    () => {
      setIsBackupPlansOpen(false);
      setBackupPlanCtx({});
    },
    "backup-plans-modal"
  );

  useModalHistory(
    isDeleteConfirmOpen,
    () => {
      setIsDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
    "delete-event-confirm"
  );

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const backupPlans =
    useLiveQuery(
      async () =>
        (await db.backupPlans.where("tripId").equals(trip.id!).toArray()).filter(
          (p) => !p.isDeleted
        ),
      [trip.id]
    ) ?? [];
  const isScrollingRef = useRef(false);

  // Default selected day calculations on mount or trip bounds change
  useEffect(() => {
    const isTodayInTrip = days.includes(today);

    if (isTodayInTrip) {
      setTimeout(() => {
        const element = document.getElementById(`day-section-${today}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, [trip.startDate, trip.endDate]);

  const scrollToDay = (day: string) => {
    const element = document.getElementById(`day-section-${day}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  function openNewForm(defaultDateVal?: string) {
    setEditing(null);
    if (defaultDateVal) {
      setFormDefaultDate(defaultDateVal);
    } else {
      setFormDefaultDate(tripDays.includes(today) ? today : tripDays[0] || today);
    }
    setIsFormOpen(true);
  }

  function openEditForm(item: EventItem) {
    setEditing(item);
    setIsFormOpen(true);
  }

  function initiateDelete(item: EventItem) {
    setEventToDelete(item);
    setIsDeleteConfirmOpen(true);
  }

  async function executeDelete() {
    if (!eventToDelete?.id) return;
    await db.events.update(eventToDelete.id, { isDeleted: true });
    setIsDeleteConfirmOpen(false);
    setEventToDelete(null);
    setIsFormOpen(false);
  }

  const handleEventSaved = (date: string) => {
    if (date) {
      setTimeout(() => scrollToDay(date), 100);
    }
  };

  const undatedEvents = events.filter((e) => !e.date);

  const renderTimeline = () => {
    const activeDays = days;

    return (
      <div id="timeline-top" className="space-y-8 motion-page-enter">
        {activeDays.map((day) => {
          const index = days.indexOf(day);
          const dayEvents = events
            .filter((item) => item.date === day)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          const isToday = tripIsActive && day === today;

          if (dayEvents.length === 0) {
            // Smart Collapse: Slim Row (max height 48px, keeps vertical line connection)
            return (
              <div
                key={day}
                id={`day-section-${day}`}
                className="scroll-mt-[180px] relative flex items-center justify-between h-[48px] pl-1 py-1 group"
              >
                {/* Vertical line through marker */}
                <div className="absolute bottom-0 left-[21px] top-0 w-0.5 bg-slate-200/80 dark:bg-slate-800 group-last:bg-transparent" />

                <div className="flex items-center gap-3.5 relative z-10">
                  {/* Circle marker */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold border border-slate-200 dark:border-slate-700/50 text-[12px]">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-kat-dark">
                      {t("timeline.dayN", { n: index + 1 })}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ({formatDateShort(day)})
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-sunset-50 dark:bg-sunset-950/20 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-widest text-sunset-600 dark:text-sunset-400 border border-sunset-100 dark:border-sunset-900/30">
                        {t("timeline.today")}
                      </span>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => openNewForm(day)}
                    className="relative z-10 text-[13px] font-bold text-kat-teal hover:brightness-95 transition-colors pr-2 flex items-center gap-1 motion-press"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                    {t("timeline.addBtn")}
                  </button>
                )}
              </div>
            );
          }

          // Non-empty days: DayHeader + ActivityCards
          const dayExpenses = expenses.filter((exp) => exp.date === day);
          const totalDayExpense = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

          return (
            <div key={day} className="space-y-4">
              <DayHeader
                day={day}
                index={index}
                isToday={isToday}
                totalExpense={totalDayExpense}
                mapUrl={trip.dayRoadmaps?.[day]}
              />
              <div className="px-1">
                {dayEvents.map((item, idx) => (
                  <ActivityCard
                    key={item.id}
                    item={item}
                    onEdit={() => openEditForm(item)}
                    onDelete={() => initiateDelete(item)}
                    isToday={isToday}
                    isUpcoming={day > today}
                    idx={idx}
                    backupCount={backupPlans.filter((p) => p.activityId === item.id).length}
                    onOpenBackup={() => {
                      setBackupPlanCtx({ activityId: item.id, date: day });
                      setIsBackupPlansOpen(true);
                    }}
                    linkedExpenses={expenses.filter(
                      (exp) => String(exp.eventId) === String(item.id)
                    )}
                    onAddExpense={onAddExpense ? () => onAddExpense(day, item.id!) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Undated fallback events */}
        {undatedEvents.length > 0 && (
          <div key="undated" className="space-y-4">
            <div
              id="day-section-undated"
              className="scroll-mt-[110px] md:scroll-mt-[120px] sticky top-[var(--sticky-header-offset,60px)] md:top-[var(--sticky-header-offset-md,68px)] transition-[top] duration-300 ease-in-out z-20 -mx-4 mb-4 flex items-center justify-between bg-slate-50/95 dark:bg-slate-900/95 px-4 py-3 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 dark:bg-slate-800 text-white dark:text-slate-400 font-black text-[14px] shadow-sm shrink-0">
                  ?
                </div>
                <div>
                  <h4 className="text-[16px] font-extrabold text-kat-dark dark:text-slate-200">
                    {t("timeline.unscheduled")}
                  </h4>
                  <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                    {t("timeline.unscheduledDesc")}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-1">
              {undatedEvents.map((item, idx) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditForm(item)}
                  onDelete={() => initiateDelete(item)}
                  isToday={false}
                  isUpcoming={false}
                  idx={idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[32px] font-black tracking-tight text-kat-dark">
            {t("timeline.pageTitle")}
          </h2>
          <p className="mt-1 text-[15px] font-bold text-slate-500 dark:text-slate-400">
            {t("timeline.pageSubtitle")}
          </p>
        </div>

        <div className="flex items-center justify-center w-full sm:w-auto gap-3">
          <div className="flex bg-[#E2E8F0]/40 dark:bg-slate-800/40 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all motion-press border",
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-kat-text shadow-sm border-slate-200/10 dark:border-slate-700/55"
                  : "text-slate-500 dark:text-slate-400 hover:text-kat-dark dark:hover:text-kat-text border-transparent"
              )}
            >
              {t("timeline.listView")}
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={classNames(
                "flex items-center justify-center w-9 h-8 rounded-lg transition-all motion-press border",
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-kat-text shadow-sm border-slate-200/10 dark:border-slate-700/55"
                  : "text-slate-500 dark:text-slate-400 hover:text-kat-dark dark:hover:text-kat-text border-transparent"
              )}
              aria-label={t("timeline.listView")}
            >
              <HugeiconsIcon icon={Calendar01Icon} className="h-4.5 w-4.5" />
            </button>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => openNewForm()}
              className="hidden md:flex items-center justify-center gap-1.5 rounded-xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-4 py-2 text-[13.5px] font-extrabold shadow-[0_4px_14px_rgba(3,13,46,0.18)] dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-95 transition-all h-10 border border-transparent dark:border-kat-primary motion-press"
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
              {t("timeline.addTimeline")}
            </button>
          )}
        </div>
      </div>

      {/* Global Add FAB (Mobile only) */}
      {!isReadOnly && (
        <button
          onClick={() => openNewForm()}
          className="md:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-2xl border border-white/40 text-kat-dark shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label={t("timeline.addTimeline")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start pb-0 md:pb-8">
        {/* Left Column: Timeline list */}
        <div className="space-y-8">
          {events.length === 0 && viewMode === "list" ? (
            /* Compact Empty Timeline Card */
            <div id="timeline-top">
              <DayHeader
                day={trip.startDate}
                index={0}
                isToday={tripIsActive && trip.startDate === today}
                mapUrl={trip.dayRoadmaps?.[trip.startDate]}
              />
              <div className="px-1 relative flex gap-4 pl-1">
                {/* Circle marker */}
                <div className="relative z-10 flex shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold border border-slate-200/50 dark:border-slate-700/50">
                    1
                  </div>
                </div>

                {/* Compact Card */}
                <div className="min-w-0 flex-1 rounded-[24px] bg-kat-surface p-6 border border-slate-200 dark:border-kat-border shadow-soft animate-fadeIn flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary-soft text-kat-primary mb-4 ring-4 ring-[#00BFB7]/10">
                    <HugeiconsIcon icon={Location01Icon} className="h-6 w-6" />
                  </div>
                  <h4 className="text-[15px] font-bold text-kat-text">
                    {t("timeline.emptyTitle")}
                  </h4>
                  <p className="mt-1 text-[13.5px] text-kat-muted font-medium max-w-sm">
                    {t("timeline.emptyDesc")}
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === "calendar" ? (
            <TimelineCalendarView
              events={events}
              trip={trip}
              onOpenNewForm={openNewForm}
              renderActivityCard={(item, idx) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditForm(item)}
                  onDelete={() => initiateDelete(item)}
                  isToday={item.date === today}
                  isUpcoming={(item.date || "") > today}
                  idx={idx}
                  backupCount={backupPlans.filter((p) => p.activityId === item.id).length}
                  onOpenBackup={() => {
                    setBackupPlanCtx({ activityId: item.id, date: item.date });
                    setIsBackupPlansOpen(true);
                  }}
                  linkedExpenses={expenses.filter((exp) => String(exp.eventId) === String(item.id))}
                  onAddExpense={
                    onAddExpense && item.date ? () => onAddExpense(item.date!, item.id!) : undefined
                  }
                />
              )}
            />
          ) : (
            renderTimeline()
          )}
        </div>

        {/* Right Column: Dynamic smart widgets */}
        <div className="space-y-6">
          {/* Mini Trip Context Card */}
          <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 shadow-sm border border-slate-100 dark:border-kat-border space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kat-primary-soft text-kat-primary">
                <HugeiconsIcon icon={Route01Icon} className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-kat-dark">{t("timeline.tripInfo")}</h4>
            </div>

            <div className="space-y-3 text-[14px] font-medium text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-400" />
                  {t("timeline.location")}
                </span>
                <span className="font-bold text-kat-dark">
                  {trip.location || t("common.unknownLocation")}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                  {t("timeline.time")}
                </span>
                <span className="font-bold text-kat-dark">
                  {trip.startDate === trip.endDate
                    ? formatDate(trip.startDate)
                    : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-slate-400" />
                  {t("timeline.scheduleItems")}
                </span>
                <span className="font-bold text-kat-dark">
                  {t("timeline.itemsCount", { count: events.length })}
                </span>
              </div>
            </div>
          </div>

          <WeatherWidget
            trip={trip}
            selectedDestIndex={selectedDestIndex}
            onSelectDestIndex={onSelectDestIndex}
            days={Math.max(3, tripDays.length + 1)}
          />

          {/* General Backup Widget */}
          <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 shadow-sm border border-slate-100 dark:border-kat-border space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                  <HugeiconsIcon icon={GitBranchIcon} className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-[15px] font-extrabold text-kat-dark dark:text-slate-200">
                    {t("timeline.generalBackup")}
                  </h4>
                  <p className="text-[11px] text-slate-500/80 dark:text-slate-400 font-medium">
                    {t("timeline.generalBackupDesc", "Áp dụng cho toàn bộ chuyến đi")}
                  </p>
                </div>
              </div>

              {backupPlans.filter((p) => !p.activityId && !p.date).length > 0 && (
                <button
                  onClick={() => {
                    setBackupPlanCtx({});
                    setIsBackupPlansOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-bold text-[12px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer motion-press"
                >
                  Xem ({backupPlans.filter((p) => !p.activityId && !p.date).length})
                </button>
              )}
            </div>

            {backupPlans.filter((p) => !p.activityId && !p.date).length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                {backupPlans
                  .filter((p) => !p.activityId && !p.date)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="text-[13px] font-semibold text-kat-dark dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl px-3 py-2.5 border border-slate-100/50 dark:border-slate-700/40 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{plan.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBackupPlanCtx({});
                          setIsBackupPlansOpen(true);
                        }}
                        className="text-[11px] font-bold text-kat-teal hover:underline whitespace-nowrap"
                      >
                        {t("common.details", "Chi tiết")} &rarr;
                      </button>
                    </div>
                  ))}
              </div>
            ) : null}

            {!isReadOnly && (
              <button
                onClick={() => {
                  setBackupPlanCtx({});
                  setIsBackupPlansOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-400 font-bold text-[13px] hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors motion-press"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                {t("timeline.addTripBackupPlan", "Thêm phương án")}
              </button>
            )}
          </div>

          {/* Roadmap Widget */}
          {days.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-kat-surface p-5 shadow-sm border border-slate-100 dark:border-kat-border space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={Route01Icon} className="h-4 w-4" />
                </span>
                <h4 className="text-[15px] font-extrabold text-kat-dark">
                  {t("timeline.travelRoute")}
                </h4>
              </div>

              {/* Day selector custom pill */}
              {days.length > 1 && (
                <div className="pt-1 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsRoadmapDayPickerOpen(true)}
                    className="w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-100/60 dark:border-emerald-900/30 transition-all hover:border-emerald-200 hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[14px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10.5px] font-bold text-emerald-600/70 dark:text-emerald-400/80 uppercase tracking-wide mb-0.5">
                          {t("timeline.viewingDay")}
                        </div>
                        <div className="text-[14.5px] font-extrabold text-kat-dark dark:text-slate-100">
                          {selectedRoadmapDay
                            ? t("timeline.dayNDate", {
                                n: days.indexOf(selectedRoadmapDay) + 1,
                                date: formatDateShort(selectedRoadmapDay),
                              })
                            : t("timeline.selectDay")}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm transition-transform group-hover:scale-105">
                      <HugeiconsIcon icon={ChevronDownIcon} className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}

              {/* Roadmap details for selected day */}
              {(() => {
                const dayIndex = days.indexOf(selectedRoadmapDay);
                const dateLabel = selectedRoadmapDay ? formatDateShort(selectedRoadmapDay) : "";
                const manualMapUrl = trip.dayRoadmaps?.[selectedRoadmapDay] || "";
                // Fallback: lấy mapLink từ activity "Di chuyển" trong ngày này
                const dayActivities = events.filter((e) => e.date === selectedRoadmapDay);
                const travelActivity = dayActivities.find(
                  (e) =>
                    e.mapLink &&
                    (e.type === "transport" || e.type === "Di chuyển" || e.type === "travel")
                );
                const fallbackActivity = !travelActivity
                  ? dayActivities.find((e) => e.mapLink)
                  : null;
                const autoMapUrl = (travelActivity || fallbackActivity)?.mapLink || "";
                const mapUrl = manualMapUrl || autoMapUrl;
                const isAuto = !manualMapUrl && !!autoMapUrl;
                const isRoute =
                  mapUrl && (mapUrl.includes("/maps/dir/") || mapUrl.includes("maps/dir"));

                return (
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-kat-border/40 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400">
                      <span>{t("timeline.dayNDate", { n: dayIndex + 1, date: dateLabel })}</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setRoadmapInputLink(mapUrl);
                            setRoadmapEditDay(selectedRoadmapDay);
                            setIsRoadmapFormOpen(true);
                          }}
                          className="text-kat-teal hover:opacity-85 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {mapUrl && (
                            <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                          )}
                          {mapUrl ? t("timeline.editBtn") : t("timeline.addBtn")}
                        </button>
                      )}
                    </div>

                    {mapUrl ? (
                      <div className="space-y-2.5">
                        <p className="text-[13px] font-medium text-slate-600 dark:text-slate-350 flex items-center gap-1.5 flex-wrap">
                          {isRoute ? t("timeline.hasRouteLink") : t("timeline.hasMapLink")}
                          {isAuto && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30 text-[10.5px] font-bold text-sky-500 dark:text-sky-400">
                              {t("timeline.fromTimeline")}
                            </span>
                          )}
                        </p>
                        <a
                          href={ensureAbsoluteUrl(mapUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[13.5px] shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                        >
                          <HugeiconsIcon icon={Route01Icon} className="w-4 h-4" />
                          {t("timeline.openRoute")} &rarr;
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[12.5px] font-semibold text-slate-400">
                          {t("timeline.noRouteForDay")}
                        </p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoadmapInputLink("");
                              setRoadmapEditDay(selectedRoadmapDay);
                              setIsRoadmapFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border hover:bg-slate-50 dark:hover:bg-kat-surface/80 text-[12px] font-bold text-slate-600 dark:text-slate-350 shadow-sm transition-all cursor-pointer"
                          >
                            <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
                            {t("timeline.attachRouteLink")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Gợi ý hành trình has been replaced by the redesigned WeatherWidget above */}
        </div>
      </div>

      <EventForm
        tripId={trip.id!}
        tripDays={tripDays}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultDate={formDefaultDate}
        onSaved={handleEventSaved}
        onDelete={() => initiateDelete(editing!)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={executeDelete}
        title={t("timeline.deleteActivityTitle")}
        itemName={eventToDelete?.title}
        description={t("timeline.deleteActivityDesc")}
        confirmLabel={t("timeline.deleteActivityConfirm")}
      />

      <BackupPlansSheet
        tripId={trip.id!}
        activityId={backupPlanCtx.activityId}
        date={backupPlanCtx.date}
        isOpen={isBackupPlansOpen}
        onClose={() => setIsBackupPlansOpen(false)}
      />

      {/* Roadmap Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapFormOpen}
        onClose={() => setIsRoadmapFormOpen(false)}
        title={t("timeline.roadmapEditTitle", { n: days.indexOf(roadmapEditDay) + 1 })}
      >
        <div className="space-y-5 pb-4">
          {/* Instruction card */}
          <div className="flex items-start gap-3 bg-kat-primary-soft dark:bg-[#00BFB7]/10 backdrop-blur-md border border-kat-teal border-opacity-20 dark:border-[#00BFB7]/30 rounded-2xl px-4 py-3">
            <HugeiconsIcon icon={Route01Icon} className="h-5 w-5 text-kat-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-kat-dark dark:text-white/90">
                {t("timeline.pasteGoogleMapsLink")}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                {t("timeline.pasteGoogleMapsHelper")}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <HugeiconsIcon icon={Route01Icon} className="h-4 w-4 text-kat-teal" />
            </div>
            <input
              type="url"
              value={roadmapInputLink}
              onChange={(e) => setRoadmapInputLink(e.target.value)}
              placeholder="https://www.google.com/maps/dir/..."
              className="w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md border-0 ring-1 ring-inset ring-slate-200/60 dark:ring-white/10 rounded-2xl text-[14px] font-semibold text-kat-dark dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#00BFB7] transition-all duration-200"
            />
          </div>

          {/* Test link button – only show when there's input */}
          {roadmapInputLink.trim() && (
            <a
              href={ensureAbsoluteUrl(roadmapInputLink)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#00BFB7]/5 dark:bg-[#00BFB7]/10 backdrop-blur-md border border-[#00BFB7]/20 dark:border-[#00BFB7]/30 text-[13.5px] font-bold text-[#00BFB7] dark:text-[#00BFB7] hover:bg-[#00BFB7]/15 dark:hover:bg-[#00BFB7]/20 transition-colors"
            >
              <HugeiconsIcon icon={MapsIcon} className="w-4 h-4" />
              {t("timeline.checkLink")} &rarr;
            </a>
          )}

          <FormActions
            onCancel={() => setIsRoadmapFormOpen(false)}
            onSave={handleSaveRoadmap}
            saveLabel={t("timeline.saveRoute")}
          />
        </div>
      </BottomSheet>

      {/* Custom Roadmap Day Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isRoadmapDayPickerOpen}
        onClose={() => setIsRoadmapDayPickerOpen(false)}
        title={t("timeline.selectRouteDay")}
      >
        <div className="space-y-2 pb-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
          {days.map((day, idx) => {
            const isSelected = selectedRoadmapDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedRoadmapDay(day);
                  setIsRoadmapDayPickerOpen(false);
                }}
                className={classNames(
                  "w-full flex items-center justify-between p-4 rounded-[16px] transition-all duration-200 active:scale-[0.98]",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-800/40 shadow-sm"
                    : "bg-white hover:bg-slate-50 dark:bg-kat-surface hover:dark:bg-slate-800/40 border border-slate-100 hover:border-slate-200 dark:border-kat-border/40 hover:dark:border-kat-border/70"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={classNames(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <div
                      className={classNames(
                        "text-[15px] font-extrabold",
                        isSelected ? "text-emerald-900 dark:text-emerald-300" : "text-kat-dark"
                      )}
                    >
                      {t("timeline.dayN", { n: idx + 1 })}
                    </div>
                    <div className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(day)}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={CheckIcon}
                      className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
