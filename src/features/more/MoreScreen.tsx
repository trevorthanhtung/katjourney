import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../constants/currencies";
import { showToast } from "../../components/ui/ToastManager";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
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
  Location01Icon, Coins01Icon,
  LockIcon,
  Luggage01Icon,
  MapsIcon,
  MoreVerticalIcon,
  Note01Icon,
  PackageIcon,
  PencilEdit01Icon,
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
  ChevronDownIcon
} from "@hugeicons/core-free-icons";

function ShareSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-kat-primary focus:ring-offset-2 ${
        checked ? "bg-kat-primary" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
import { ChecklistItem, db, deleteTripCascade, EventItem, Expense, JournalEntry, Member, PackingItem, Trip, archiveTrip, unarchiveTrip } from "../../db";
import { getAvatarSvg, getRandomAvatarId } from "../../utils/avatars";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";
import { 
  checklistSections, 
  createTripExport, 
  formatDate, 
  formatMoney, 
  getWrappedStats, 
  moodLabels, 
  packingTripTypes, 
  safeFileName, 
  today, 
  TripData, 
  getChecklistStats,
  getTripTiming,
  APP_VERSION,
  downloadBlob
} from "../../utils/helpers";
import { normalizeVietnameseDisplayText } from "../../utils/helpers";
import { BottomSheet, FormActions, Input, ScreenTitle, Select, TypedDeleteConfirmModal, classNames } from "../../components/ui";
import { RolesHelpSheet } from "../../components/RolesHelpSheet";
import { JournalSection } from "../journal/JournalSection";
import { TravelDocumentsSection } from "./TravelDocumentsSection";
import { ChatBox } from "../share/components/ChatBox";
import { searchLocation, GeocodingResult } from "../../services/weatherService";
import { useModalHistory } from "../../hooks/useModalHistory";
import { getCurrencyForCountry } from "../../services/locationService";

// --- LocationInput Component ---
function LocationInput({
  value,
  onChange,
  onSelectResult,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectResult: (result: GeocodingResult) => void;
}) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setLoading(true);
    const results = await searchLocation(query);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setLoading(false);
  }, []);

  function handleChange(val: string) {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function handleSelect(result: GeocodingResult) {
    const display = normalizeVietnameseDisplayText([result.name, result.admin1, result.country].filter(Boolean).join(", "));
    onChange(display);
    onSelectResult(result);
    setSuggestions([]);
    setIsOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <HugeiconsIcon icon={Location01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kat-primary pointer-events-none" size={16} />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t("trips.exampleLocation")}
          className="w-full rounded-[14px] border border-slate-200 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/40 pl-10 pr-10 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-kat-primary focus:ring-2 focus:ring-kat-primary/20 dark:focus:bg-kat-surface focus:outline-none transition-all"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-kat-primary/30 border-t-kat-primary" />
          </div>
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={() => { onChange(""); setSuggestions([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-floating animate-fadeIn">
          {suggestions.map((result, idx) => {
            const name = normalizeVietnameseDisplayText(result.name);
            const sub = normalizeVietnameseDisplayText([result.admin1, result.country].filter(Boolean).join(", "));
            return (
              <li key={idx}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(result); }}
                  onTouchStart={(e) => { e.preventDefault(); handleSelect(result); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100/60 dark:border-slate-700/50 last:border-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kat-primary/10 dark:bg-kat-teal/20">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="text-kat-primary dark:text-kat-teal" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                    {sub && <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium truncate">{sub}</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
// --- End LocationInput ---

// --- CalendarRangePicker Component ---
const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function CalendarRangePicker({
  startDate,
  endDate,
  tripType,
  onChangeTripType,
  onChangeStart,
  onChangeEnd,
}: {
  startDate: string;
  endDate: string;
  tripType: "dayTrip" | "multiDay";
  onChangeTripType: (t: "dayTrip" | "multiDay") => void;
  onChangeStart: (d: string) => void;
  onChangeEnd: (d: string) => void;
}) {
  
  const { t } = useTranslation();
  const daysOfWeek = t("tripForm.daysOfWeek", { returnObjects: true }) as string[];
  const months = t("tripForm.months", { returnObjects: true }) as string[];
const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  const initialMonth = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = React.useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initialMonth.getMonth());
  // hoverDate for range preview (multiDay)
  const [hoverDate, setHoverDate] = React.useState<string | null>(null);
  // picking state: first click = start, second click = end
  const [pickingEnd, setPickingEnd] = React.useState(false);

  function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m+1, 0).getDate();
  }

  function getFirstDayOfWeek(y: number, m: number) {
    return new Date(y, m, 1).getDay(); // 0=Sun
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v-1); }
    else setViewMonth(v => v-1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v+1); }
    else setViewMonth(v => v+1);
  }

  function handleDayClick(iso: string) {
    if (tripType === "dayTrip") {
      onChangeStart(iso);
      onChangeEnd(iso);
      return;
    }
    // multiDay: 2-tap selection
    if (!pickingEnd) {
      onChangeStart(iso);
      onChangeEnd(iso);
      setPickingEnd(true);
    } else {
      if (iso < startDate) {
        onChangeStart(iso);
        onChangeEnd(startDate);
      } else {
        onChangeEnd(iso);
      }
      setPickingEnd(false);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const cells: (number|null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const effectiveEnd = tripType === "dayTrip" ? startDate : (pickingEnd && hoverDate ? (hoverDate < startDate ? startDate : hoverDate) : endDate);

  // Format display
  function fmtDisplay(iso: string) {
    if (!iso) return "--";
    const d = new Date(iso + "T00:00:00");
    return t('tripForm.dateFmt', { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() });
  }

  const monthLabel = `${months[viewMonth]} ${viewYear}`;

  return (
    <div className="w-full">
      {/* Trip type toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button type="button" onClick={() => { onChangeTripType("dayTrip"); setPickingEnd(false); }}
          className={classNames("flex flex-col items-start rounded-[14px] px-4 py-3 text-left transition-all min-h-[60px]",
            tripType === "dayTrip" ? "bg-[#00BFB7]/10 dark:bg-kat-teal/20 ring-2 ring-inset ring-kat-primary" : "bg-slate-50 dark:bg-slate-800/40 ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/60")}
        >
          <span className={classNames("text-[14px] font-bold", tripType === "dayTrip" ? "text-kat-primary dark:text-kat-teal" : "text-slate-700 dark:text-slate-350")}>{t("tripForm.dayTripBtn")}</span>
          <span className={classNames("text-[11px] font-medium mt-0.5", tripType === "dayTrip" ? "text-[#00BFB7]/80 dark:text-kat-teal/80" : "text-slate-400 dark:text-slate-500")}>{t("tripForm.dayTripDesc")}</span>
        </button>
        <button type="button" onClick={() => { onChangeTripType("multiDay"); setPickingEnd(false); }}
          className={classNames("flex flex-col items-start rounded-[14px] px-4 py-3 text-left transition-all min-h-[60px]",
            tripType === "multiDay" ? "bg-[#00BFB7]/10 dark:bg-kat-teal/20 ring-2 ring-inset ring-kat-primary" : "bg-slate-50 dark:bg-slate-800/40 ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/60")}
        >
          <span className={classNames("text-[14px] font-bold", tripType === "multiDay" ? "text-kat-primary dark:text-kat-teal" : "text-slate-700 dark:text-slate-350")}>{t("tripForm.multiDayBtn")}</span>
          <span className={classNames("text-[11px] font-medium mt-0.5", tripType === "multiDay" ? "text-[#00BFB7]/80 dark:text-kat-teal/80" : "text-slate-400 dark:text-slate-500")}>{t("tripForm.multiDayDesc")}</span>
        </button>
      </div>

      {/* Selected range display */}
      <div className="mb-4 px-1">
        {tripType === "dayTrip" ? (
          <p className="text-[18px] font-extrabold text-kat-text">{fmtDisplay(startDate)}</p>
        ) : (
          <p className="text-[18px] font-extrabold text-kat-text">
            {fmtDisplay(startDate)} <span className="text-kat-muted font-bold mx-1">—</span> {fmtDisplay(effectiveEnd)}
          </p>
        )}
        {tripType === "multiDay" && pickingEnd && (
          <p className="text-[12px] text-kat-primary dark:text-kat-teal font-semibold mt-0.5 animate-pulse">{t("tripForm.pickEndPrompt")}</p>
        )}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/40">
          <button type="button" onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-500 dark:text-slate-400">
            <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
          </button>
          <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{monthLabel}</span>
          <button type="button" onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-slate-500 dark:text-slate-400">
            <HugeiconsIcon icon={ChevronRightIcon} size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700/40">
          {daysOfWeek.map(d => (
            <div key={d} className="py-1.5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-1 pb-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-8" />;
            const iso = toISO(viewYear, viewMonth, day);
            const isStart = iso === startDate;
            const isEnd = tripType !== "dayTrip" && iso === effectiveEnd;
            const inRange = tripType !== "dayTrip" && startDate && effectiveEnd && iso > startDate && iso < effectiveEnd;
            const isToday = iso === todayDate.toISOString().split("T")[0];

            // Rounded cap logic for range bar
            const isStartCap = isStart && tripType !== "dayTrip" && startDate !== effectiveEnd;
            const isEndCap = isEnd && startDate !== effectiveEnd;
            const isSingleDay = isStart && isEnd;

            return (
              <div
                key={iso}
                className="relative h-8 flex items-center justify-center"
                onMouseEnter={() => tripType === "multiDay" && pickingEnd && setHoverDate(iso)}
                onMouseLeave={() => tripType === "multiDay" && pickingEnd && setHoverDate(null)}
              >
                {/* Range bar background */}
                {(inRange || isStartCap || isEndCap) && !isSingleDay && (
                  <div className={classNames(
                    "absolute inset-y-0.5 bg-[#00BFB7]/15 dark:bg-kat-teal/20",
                    isStartCap ? "left-1/2 right-0" : isEndCap ? "left-0 right-1/2" : "left-0 right-0"
                  )} />
                )}

                <button
                  type="button"
                  onClick={() => handleDayClick(iso)}
                  className={classNames(
                    "relative z-10 h-7 w-7 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all active:scale-95",
                    (isStart || isEnd) && !isSingleDay
                      ? "bg-kat-primary text-white dark:text-slate-950 font-bold shadow-sm"
                      : isSingleDay
                      ? "bg-kat-primary text-white dark:text-slate-950 font-bold shadow-sm"
                      : inRange
                      ? "text-kat-primary dark:text-kat-teal font-semibold hover:bg-[#00BFB7]/10 dark:hover:bg-kat-teal/20"
                      : isToday
                      ? "text-kat-primary dark:text-kat-teal font-bold ring-1 ring-[#00BFB7]/50 dark:ring-kat-teal/50 hover:bg-[#00BFB7]/10 dark:hover:bg-kat-teal/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80"
                  )}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// --- End CalendarRangePicker ---





function TripForm({ trip, isOpen, onClose, onSaved }: { trip?: Trip; isOpen: boolean; onClose: () => void; onSaved: (id: number) => void }) {
  
  const { t, i18n } = useTranslation();
const [form, setForm] = useState<{
    title: string;
    location: string;
    latitude?: number;
    longitude?: number;
    defaultCurrency?: string;
    tripType: "dayTrip" | "multiDay";
    startDate: string;
    endDate: string;
  }>({
    title: trip?.title ?? "",
    location: trip?.location ?? "",
    latitude: trip?.latitude,
    longitude: trip?.longitude,
    defaultCurrency: trip?.defaultCurrency,
    tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
    startDate: trip?.startDate ?? today,
    endDate: trip?.endDate ?? today
  });

  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: trip?.title ?? "",
        location: trip?.location ?? "",
        latitude: trip?.latitude,
        longitude: trip?.longitude,
        defaultCurrency: trip?.defaultCurrency,
        tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
        startDate: trip?.startDate ?? today,
        endDate: trip?.endDate ?? today
      });
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [trip, isOpen]);

  const titleError = !form.title.trim() ? t("tripForm.nameError") : "";
  const startDateError = !form.startDate ? t("tripForm.startDateError") : "";
  const endDateError = form.tripType === "multiDay" && !form.endDate ? t("tripForm.endDateError") : "";
  const dateCompareError = form.tripType === "multiDay" && form.endDate && form.startDate && form.endDate < form.startDate ? t("tripForm.dateCompareError") : "";
  const hasError = !!titleError || !!startDateError || !!endDateError || !!dateCompareError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const payload = { 
      ...form, 
      endDate: form.tripType === "dayTrip" ? form.startDate : form.endDate,
      createdAt: trip?.createdAt ?? new Date().toISOString() 
    };
    if (trip?.id) {
      await db.trips.update(trip.id, payload);
      onSaved(trip.id);
      onClose();
    } else {
      const id = await db.trips.add(payload);
      onSaved(id);
      onClose();
    }
  }

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={trip ? t("tripForm.editTitle") : t("tripForm.createTitle")}
      subtitle={trip ? undefined : t("tripForm.createSubtitle")}
      footer={
        <FormActions 
          onSave={save} 
          saveLabel={trip ? t("tripForm.saveBtn") : t("tripForm.createBtn")} 
          saveAriaLabel={trip ? t("tripForm.saveAria") : t("tripForm.createAria")}
          disabled={hasError}
          onCancel={onClose}
        />
      }
    >
      <div className="space-y-4 md:space-y-5">
        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={PencilEdit01Icon} size={16} className="text-slate-500" />
                {t("tripForm.nameLabel")}
              </span>
            } 
            value={form.title} 
            onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
            placeholder={t("tripForm.namePlaceholder")}
          />
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{titleError}</p>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={Location01Icon} size={16} className="text-slate-500" />
            {t("tripForm.locationLabel")}
          </span>
          <LocationInput
            value={form.location}
            onChange={(location) => setForm((f) => ({ ...f, location, latitude: undefined, longitude: undefined, defaultCurrency: undefined }))}
            onSelectResult={(result) => {
              const display = normalizeVietnameseDisplayText([result.name, result.admin1, result.country].filter(Boolean).join(", "));
              const currency = result.country_code ? getCurrencyForCountry(result.country_code) : undefined;
              setForm((f) => ({ ...f, location: display, latitude: result.latitude, longitude: result.longitude, defaultCurrency: currency || undefined }));
            }}
          />
          {form.latitude && form.longitude ? (
            <p className="mt-2.5 px-1 text-[11.5px] font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <HugeiconsIcon icon={CheckIcon} size={14} /> {t("tripForm.locationSuccess")}
            </p>
          ) : (
            <p className="mt-2.5 px-1 text-[11.5px] font-semibold text-slate-400 leading-relaxed">
              {t("tripForm.locationHelper")}
            </p>
          )}
        </div>
        

        {/* === CURRENCY SECTION === */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={Coins01Icon} size={16} className="text-slate-500" />
            {t("tripForm.currencyLabel")}
          </span>
          <Select
            value={form.defaultCurrency || "VND"}
            onChange={(val) => setForm(f => ({ ...f, defaultCurrency: val }))}
            options={CURRENCY_OPTIONS}
            labels={useMemo(() => {
              const labels: Record<string, string> = {};
              CURRENCY_OPTIONS.forEach(code => {
                labels[code] = `${getCurrencyLabel(code, i18n.language)} ${code === (trip?.defaultCurrency || 'VND') ? t('expenses.baseCurrency') : ''}`.trim();
              });
              return labels;
            }, [i18n.language, trip?.defaultCurrency, t])}
          />
        </div>

        {/* === DATE SECTION replaced with CalendarRangePicker === */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-slate-500" />
            {t("tripForm.timeLabel")}
          </span>
          <CalendarRangePicker
            startDate={form.startDate}
            endDate={form.endDate}
            tripType={form.tripType}
            onChangeTripType={(tripType) => setForm(f => ({ ...f, tripType }))}
            onChangeStart={(startDate) => setForm(f => ({ ...f, startDate }))}
            onChangeEnd={(endDate) => setForm(f => ({ ...f, endDate }))}
          />
          {(dirty || submitAttempted) && startDateError && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{startDateError}</p>
          )}
          {(dirty || submitAttempted) && (endDateError || dateCompareError) && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{endDateError || dateCompareError}</p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function MemberForm({ 
  tripId, 
  editing, 
  isOpen, 
  onClose,
  onShowToast
}: { 
  tripId: number; 
  editing: Member | null; 
  isOpen: boolean; 
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const PRESETS = [t("members.roleLeader"), t("members.roleBudget"), t("members.roleDriver"), t("members.roleNavigator"), t("members.roleCompanion")];
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["Người đồng hành"]);
  const [isRolesHelpOpen, setIsRolesHelpOpen] = useState(false);

  const togglePreset = (preset: string) => {
    setDirty(true);
    if (preset === "Người đồng hành") {
      setSelectedPresets(["Người đồng hành"]);
    } else {
      let next = selectedPresets.filter(p => p !== "Người đồng hành");
      if (next.includes(preset)) {
        next = next.filter(p => p !== preset);
      } else {
        next.push(preset);
      }
      if (next.length === 0) {
        next = ["Người đồng hành"];
      }
      setSelectedPresets(next);
    }
  };

  const [note, setNote] = useState("");
  const [gender, setGender] = useState<string>("male");
  const [group, setGroup] = useState("");
  const [isGroupLeader, setIsGroupLeader] = useState(false);
  
  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const liveMembers = useLiveQuery(() => db.members.where({ tripId }).toArray(), [tripId]) || [];
  const existingGroups = Array.from(new Set(liveMembers.map(m => m.group).filter(Boolean))) as string[];

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setName(editing.name ?? "");
        setPhone(editing.phone ?? "");
        setNote(editing.note ?? "");
        setGender(editing.gender ?? "male");
        setGroup(editing.group ?? "");
        setIsGroupLeader(editing.isGroupLeader ?? false);
        
        const currentRole = editing.role ?? "Người đồng hành";
        const loadedPresets = currentRole
          .split(",")
          .map(r => r.trim())
          .filter(r => PRESETS.includes(r));
        if (loadedPresets.length > 0) {
          setSelectedPresets(loadedPresets);
        } else {
          setSelectedPresets(["Người đồng hành"]);
        }
      } else {
        setName("");
        setPhone("");
        setSelectedPresets(["Người đồng hành"]);
        setNote("");
        setGender("male");
        setGroup("");
        setIsGroupLeader(false);
      }
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [editing, isOpen]);

  const nameError = !name.trim() ? "Vui lòng nhập tên thành viên." : "";
  
  const phoneClean = phone.trim();
  const isPhoneInvalid = phoneClean !== "" && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phoneClean);
  const phoneError = isPhoneInvalid ? t("members.phoneError") : "";
  
  const hasError = !!nameError || !!phoneError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const finalRole = selectedPresets.join(", ");
    
    // Generate avatar if not already present or if gender changed
    let finalAvatar = editing?.avatar;
    const existingMembers = await db.members.where({ tripId }).toArray();
    
    if (!editing?.id) {
      const existingAvatars = existingMembers.map(m => m.avatar).filter(Boolean) as string[];
      finalAvatar = getRandomAvatarId(gender, existingAvatars);
    } else if (editing && editing.gender !== gender) {
      const existingAvatars = existingMembers.filter(m => m.id !== editing.id).map(m => m.avatar).filter(Boolean) as string[];
      finalAvatar = getRandomAvatarId(gender, existingAvatars);
    }

    const payload = {
      tripId,
      name: name.trim(),
      phone: phone.trim(),
      role: finalRole,
      note: note.trim(),
      gender,
      avatar: finalAvatar,
      group: group.trim() || undefined,
      isGroupLeader: group.trim() ? isGroupLeader : undefined,
      updatedAt: new Date().toISOString()
    };

    if (editing?.id) {
      await db.members.update(editing.id, payload);
    } else {
      await db.members.add({
        ...payload,
        createdAt: new Date().toISOString()
      });
    }

    // Automatically unset other group leaders if this member is now the leader
    if (payload.group && payload.isGroupLeader) {
      const otherLeaders = existingMembers.filter(m => m.group === payload.group && m.isGroupLeader && m.id !== editing?.id);
      for (const leader of otherLeaders) {
        if (leader.id) {
          await db.members.update(leader.id, { isGroupLeader: false });
        }
      }
    }

    onShowToast?.(editing?.id ? "Đã cập nhật thành viên" : "Đã thêm thành viên");
    onClose();
  }

  const getPresetIcon = (preset: string) => {
    switch (preset) {
      case "Người đồng hành": return <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5" />;
      case "Trưởng nhóm": return <HugeiconsIcon icon={CrownIcon} className="h-3.5 w-3.5 text-amber-500" />;
      case "Quản lý chi phí": return <HugeiconsIcon icon={WalletCardsIcon} className="h-3.5 w-3.5 text-emerald-500" />;
      case "Tài xế": return <HugeiconsIcon icon={Car01Icon} className="h-3.5 w-3.5 text-blue-500" />;
      case "Dẫn đường": return <HugeiconsIcon icon={CompassIcon} className="h-3.5 w-3.5 text-sky-500" />;
      case "Phụ trách hành lý": return <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? t("members.formEditTitle") : t("members.formAddTitle")}
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[52px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.96] transition-all border border-transparent dark:border-slate-700 motion-press"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={hasError}
            onClick={save}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-6 font-black shadow-sm hover:bg-kat-dark/95 dark:hover:bg-kat-primary-light active:scale-[0.98] transition-all border border-transparent disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent disabled:cursor-not-allowed motion-press"
          >
            {editing ? (
              <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
            ) : (
              <HugeiconsIcon icon={UserAdd01Icon} className="h-5 w-5" />
            )}
            {editing ? t("members.btnSave") : t("members.btnAdd")}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-slate-500" />
                {t("members.nameLabel")}
              </span>
            } 
            value={name} 
            onChange={(val) => { setName(val); setDirty(true); }} 
            placeholder={t("members.namePlaceholder")} 
          />
          {(dirty || submitAttempted) && nameError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{nameError}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-slate-500" />
            {t("members.genderLabel")}
          </span>
          <div className="flex gap-2">
            {[
              { value: "male", label: t("members.genderMale") },
              { value: "female", label: t("members.genderFemale") },
              { value: "other", label: t("members.genderOther") }
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setGender(g.value);
                  setDirty(true);
                }}
                className={classNames(
                  "flex-1 rounded-2xl py-3 text-[14px] font-black transition-all duration-200 active:scale-95 border text-center justify-center flex items-center",
                  gender === g.value
                    ? "bg-kat-primary-soft dark:bg-kat-primary-soft/30 border-[#00BFB7] dark:border-kat-primary/50 text-kat-teal dark:text-kat-primary-usable shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-slate-500" />
                {t("members.groupLabel")}
              </span>
            } 
            value={group} 
            onChange={(val) => { setGroup(val); setDirty(true); }} 
            placeholder={t("members.groupPlaceholder")}
          />
          {existingGroups.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {existingGroups.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGroup(g); setDirty(true); }}
                  className={classNames(
                    "px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors border",
                    group === g
                      ? "bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          {(() => {
            const currentGroupMembers = liveMembers.filter(m => m.group === group.trim());
            const existingLeader = currentGroupMembers.find(m => m.isGroupLeader && m.id !== editing?.id);
            return group.trim() !== "" && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-bold text-slate-600 dark:text-slate-400">{t("members.isGroupLeader")}</span>
                  {existingLeader && (
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {isGroupLeader ? t("members.willReplace", { name: existingLeader.name }) : t("members.currentLeaderIs", { name: existingLeader.name })}
                    </span>
                  )}
                </div>
                <button
                type="button"
                onClick={() => { setIsGroupLeader(!isGroupLeader); setDirty(true); }}
                className={classNames(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isGroupLeader ? "bg-kat-teal" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                <span
                  className={classNames(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isGroupLeader ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            );
          })()}
        </div>

        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={CallIcon} className="h-4 w-4 text-slate-500" />
                {t("members.phone")}
              </span>
            } 
            type="tel"
            value={phone} 
            onChange={(val) => { setPhone(val); setDirty(true); }} 
            placeholder={t("members.phonePlaceholder")} 
          />
          {(dirty || submitAttempted) && phoneError ? (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{phoneError}</p>
          ) : (
            <p className="mt-1.5 px-1 text-[11.5px] font-bold text-kat-muted">{t("members.phoneHelp")}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-4 w-4 text-slate-500" />
              {t("roles.roleLabel")}
            </span>
            <button
              type="button"
              onClick={() => setIsRolesHelpOpen(true)}
              className="text-slate-400 hover:text-kat-teal transition-colors flex items-center gap-1 text-xs font-bold"
              title="Thông tin các vai trò"
            >
              <HugeiconsIcon icon={InformationCircleIcon} className="h-3.5 w-3.5" />
              <span>{t("members.viewRoles")}</span>
            </button>
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => togglePreset(preset)}
                className={classNames(
                  "rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-all duration-200 active:scale-95 border flex items-center gap-1.5",
                  selectedPresets.includes(preset)
                    ? "bg-kat-primary-soft dark:bg-kat-primary-soft/30 border-[#00BFB7] dark:border-kat-primary/50 text-kat-teal dark:text-kat-primary-usable"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {getPresetIcon(preset)}
                <span>{preset}</span>
              </button>
            ))}
          </div>

          <p className="mt-1.5 px-1 text-[11.5px] font-bold text-kat-muted">
            {t("members.roleHelpDesc")}
          </p>
        </div>

        <div className="pt-1">
          <label className="block">
            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <HugeiconsIcon icon={Note01Icon} className="h-4 w-4 text-slate-500" />
              {t("members.noteLabelShort")}
            </span>
            <textarea
              className="mt-1.5 min-h-[90px] w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/50 transition-shadow focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500"
              value={note}
              onChange={(event) => { setNote(event.target.value); setDirty(true); }}
              placeholder={t("members.notePlaceholderDetailed")}
            />
          </label>
        </div>
      </div>
      <RolesHelpSheet isOpen={isRolesHelpOpen} onClose={() => setIsRolesHelpOpen(false)} />
    </BottomSheet>
  );
}

function DeleteMemberConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  hasExpenses,
  hasChecklist
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  hasExpenses: boolean;
  hasChecklist: boolean;
}) {
  const { t } = useTranslation();
  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("members.deleteConfirmTitle")}
      itemName={memberName}
      warning={
        hasExpenses || hasChecklist
          ? t("members.deleteConfirmWarning")
          : undefined
      }
      description={
        <>
          Thành viên <span className="font-extrabold text-kat-dark">{memberName}</span> {t("members.deleteConfirmDesc1")}
        </>
      }
      confirmLabel={t("members.menuDelete")}
    />
  );
}

function DonateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"vn" | "intl">(i18n.language === "vi" ? "vn" : "intl");

  useEffect(() => {
    if (isOpen) {
      setTab(i18n.language === "vi" ? "vn" : "intl");
    }
  }, [i18n.language, isOpen]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("donateView.title")}>
      <div className="space-y-5 flex flex-col items-center text-center pb-4">
        {/* Coffee Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
          <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
        </div>
        
        {/* Texts */}
        <div className="space-y-2 max-w-md">
          <h4 className="text-[18px] font-black text-kat-dark">{t("donateView.title")}</h4>
          <p className="text-[14px] font-semibold leading-relaxed text-slate-500">
            {t("donateView.desc1")}
          </p>
          <p className="text-[12px] font-medium text-slate-400">
            {t("donateView.desc2")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-[85%] max-w-[280px] mb-2">
          <button
            onClick={() => setTab("vn")}
            className={classNames(
              "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
              tab === "vn" ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {t("donateView.tabVietQR", "VietQR")}
          </button>
          <button
            onClick={() => setTab("intl")}
            className={classNames(
              "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
              tab === "intl" ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {t("donateView.tabInternational", "International")}
          </button>
        </div>

        {/* Payment Methods */}
        {tab === "vn" ? (
          <>
            {/* QR Code Card */}
            <div className="w-[85%] max-w-[280px] p-4 bg-white border border-slate-200 rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
              <img 
                src="/donates.png" 
                alt="Donate QR Code" 
                className="w-full h-auto rounded-[16px] object-contain aspect-square" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="mt-3 text-[11px] font-extrabold text-kat-dark uppercase tracking-wider bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100">
                {t("donateView.scanQR")}
              </span>
            </div>

            {/* Save QR action */}
            <a 
              href="/donates.png" 
              download="kat-journey-donate-qr.png"
              className="text-[13px] font-bold text-kat-teal hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              {t("donateView.saveQR")}
            </a>
          </>
        ) : (
          <div className="w-full max-w-[280px] space-y-3 mt-2">
            <a 
              href="https://paypal.me/trevorthanhtung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full gap-2 py-3.5 px-4 rounded-[16px] bg-[#00457C] text-white font-extrabold text-[14px] transition-all hover:bg-[#005a9e] active:scale-[0.98] shadow-sm"
            >
              <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5" />
              {t("donateView.supportPayPal", "Support via PayPal")}
            </a>
            <p className="text-[12px] font-medium text-slate-400 mt-3">
              {t("donateView.thankYou", "(Thank you for your support!)")}
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-white border border-slate-200 text-kat-dark px-6 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
        >
          {t("common.close", "Đóng")}
        </button>
      </div>
    </BottomSheet>
  );
}

function WrappedSection({ data, setSection }: { data: TripData; setSection: (section: any) => void }) {
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const stats = getWrappedStats(data);
  const mood = stats.mostCommonMood ? moodLabels[stats.mostCommonMood] : undefined;

  // Derived Finance Data
  const sharedExpenses = data.expenses.filter(e => e.splitType !== "personal" && !e.isDeleted);
  const personalExpenses = data.expenses.filter(e => e.splitType === "personal" && !e.isDeleted);
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Storytelling Logic
  const sortedEvents = [...data.events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const sortedJournals = [...data.journals].sort((a, b) => a.date.localeCompare(b.date));
  
  let firstMomentText = "";
  if (sortedEvents.length > 0 && sortedJournals.length > 0) {
    if (sortedEvents[0].date <= sortedJournals[0].date) {
      firstMomentText = `${t('more.wrappedFirstMomentEvent1')} "${sortedEvents[0].title}" vào ngày ${formatDate(sortedEvents[0].date)}.`;
    } else {
      firstMomentText = `${t('more.wrappedFirstMomentJournal1')} ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
    }
  } else if (sortedEvents.length > 0) {
    firstMomentText = `${t('more.wrappedFirstMomentEvent1')} "${sortedEvents[0].title}" vào ngày ${formatDate(sortedEvents[0].date)}.`;
  } else if (sortedJournals.length > 0) {
    firstMomentText = `${t('more.wrappedFirstMomentJournal1')} ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
  }

  const eventsByDate = data.events.reduce<Record<string, import("../../db").EventItem[]>>((result, item) => {
    result[item.date] = [...(result[item.date] ?? []), item];
    return result;
  }, {});
  
  let maxEventsDate = "";
  let maxEventsCount = 0;
  Object.entries(eventsByDate).forEach(([date, evs]) => {
    if (evs.length > maxEventsCount) {
      maxEventsCount = evs.length;
      maxEventsDate = date;
    }
  });

  const uniqueLocations = Array.from(new Set(data.events.filter(e => e.location.trim() !== "").map(e => e.location.trim())));

  async function handleExportPdf() {
    setIsGeneratingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const { exportTripPdf } = await import("../../utils/exportPdf");
      await exportTripPdf(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0 space-y-6 md:space-y-8 pb-24">
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
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark">{t("more.featureWrapped")}</h2>
            </div>
            <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">{t("more.wrappedSubtitle")}</p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-5 text-[13.5px] font-bold hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-95 transition-all motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center disabled:opacity-50 disabled:cursor-not-allowed border border-transparent dark:border-kat-primary"
        >
          <HugeiconsIcon icon={FileDownloadIcon} className={classNames("h-4 w-4", !isGeneratingPdf && "animate-bounce")} />
          <span>{isGeneratingPdf ? t("more.wrappedExporting") : t("more.wrappedExportPdf")}</span>
        </button>
      </div>
      
      {/* Hero Recap Card */}
      <section className="relative overflow-hidden rounded-[32px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border p-8 text-kat-text shadow-soft">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5 border border-kat-primary/20">
            <HugeiconsIcon icon={CompassIcon} className="h-6 w-6" />
          </div>
          <h2 className="text-[30px] md:text-[36px] font-black leading-tight tracking-tight text-kat-dark">{data.trip.title}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
              <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-kat-primary" />
              {data.trip.location || t("more.noLocation")}
            </span>
            {data.trip.tripType === "dayTrip" || data.trip.startDate === data.trip.endDate ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-[#0081BE] dark:text-[#33A6DA]" />
                  {formatDate(data.trip.startDate)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-kat-primary-soft border border-kat-primary/15 px-3 py-1.5 text-[12.5px] font-extrabold text-kat-primary-usable">
                  <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                  {t("more.wrappedDayTrip")}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-[14px] font-bold text-slate-700 dark:text-slate-300">
                <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-[#0081BE] dark:text-[#33A6DA]" />
                {formatDate(data.trip.startDate)} – {formatDate(data.trip.endDate)}
              </span>
            )}
          </div>
        </div>
      </section>
 
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <HugeiconsIcon icon={Sun01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark leading-none block">{stats.totalDays}</span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedDays")}</span>
          </div>
        </div>
 
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-teal border border-kat-teal border-opacity-20">
            <HugeiconsIcon icon={Route01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark leading-none block">{stats.activityCount}</span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedEvents")}</span>
          </div>
        </div>
 
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark leading-none block">{stats.checklistPercent}%</span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedPacking")}</span>
          </div>
        </div>
 
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-teal border border-kat-teal border-opacity-20">
            <HugeiconsIcon icon={BookOpen01Icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-kat-dark leading-none block">{stats.journalCount}</span>
            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedJournals")}</span>
          </div>
        </div>
      </div>

      {/* Finance Recap */}
      <div className="rounded-[32px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border p-8 text-kat-text shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-[13px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <HugeiconsIcon icon={WalletCardsIcon} className="h-5 w-5 text-kat-primary" />
            {t("more.wrappedExpenseTitle")}
          </h3>
          
          {data.expenses.length > 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">{t("more.wrappedTotalExpense")}</p>
                <p className="mt-1 text-[36px] font-black text-kat-dark leading-none">{formatMoney(stats.totalExpense)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-700/50 pt-6 max-w-md">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{t("more.wrappedSharedExpense")}</p>
                  <p className="mt-1 text-[18px] font-black text-kat-primary-usable">{formatMoney(sharedTotal)}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{t("more.wrappedPersonalExpense")}</p>
                  <p className="mt-1 text-[18px] font-black text-kat-dark">{formatMoney(personalTotal)}</p>
                </div>
              </div>
              
              {data.members.length === 0 ? (
                <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-6">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/25 px-4 py-3.5 text-[13.5px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {t("more.wrappedNoMembersExpense")}
                  </div>
                </div>
              ) : (
                <>
                  {stats.topPayer && (
                    <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-6">
                      <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">{t("more.wrappedTopPayer")}</p>
                      <p className="mt-1 text-[14.5px] font-medium leading-relaxed text-slate-600 dark:text-slate-350">
                        <span className="font-extrabold text-kat-dark">{stats.topPayer.name}</span> {t("more.wrappedTopPayerDesc")} <span className="font-extrabold text-kat-primary-usable">{formatMoney(stats.topPayer.amount)}</span>.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl bg-slate-50/40 dark:bg-slate-800/10">
              <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-450">{t("more.wrappedNoExpenseData")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Memory / Mood Section */}
      <div className="rounded-[32px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-8 shadow-soft text-center flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-4 ring-4 ring-amber-500/5 dark:ring-amber-500/10">
          <HugeiconsIcon icon={SmilePlusIcon} className="h-6 w-6" />
        </div>
        <h3 className="text-[13px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">{t("more.wrappedMoodTitle")}</h3>
        {mood ? (
          <div className="mt-2 flex flex-col items-center animate-fadeIn">
            <p className="text-[28px] md:text-[32px] font-black text-kat-dark dark:text-white">{mood}</p>
            <p className="mt-2 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 text-center max-w-[280px] leading-relaxed">
              {t("more.wrappedMoodDesc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-2">
            <p className="text-[16px] font-extrabold text-kat-dark mb-1.5">{t("more.wrappedNoMoodData")}</p>
            <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 mb-5 max-w-sm">{t("more.wrappedNoMoodDesc")}</p>
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

      {/* Storytelling Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Moment */}
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={Camera01Icon} className="h-5 w-5 text-amber-500" />
            <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{t("more.wrappedFirstMoment")}</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
            {firstMomentText || "Chưa có dấu ấn đầu tiên. Hãy thêm hoạt động hoặc đăng bài viết để lưu lại khoảnh khắc mở đầu."}
          </p>
        </div>

        {/* Most Eventful Day */}
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={StarIcon} className="h-5 w-5 text-amber-500" />
            <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{t("more.wrappedBusiestDay")}</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
            {maxEventsDate ? (
              <>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">{formatDate(maxEventsDate)}</span> {t("more.wrappedBusiestDayDesc")} <span className="font-bold text-kat-dark">{maxEventsCount} {t("more.wrappedBusiestDayDesc2")}</span>
              </>
            ) : (
              t("more.wrappedNoBusiestDay")
            )}
          </p>
        </div>

        {/* Locations Visited */}
        <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={MapsIcon} className="h-5 w-5 text-kat-primary" />
            <h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{t("more.wrappedLocations")}</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 dark:text-slate-350 leading-relaxed">
            {uniqueLocations.length > 0 ? uniqueLocations.join(", ") : t("more.wrappedNoLocations")}
          </p>
        </div>
      </div>
    </div>
  );
}



function MiniStatCard({ 
  label, 
  value, 
  colorClass 
}: { 
  label: string; 
  value: string | number; 
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100/60 bg-white p-3.5 shadow-inner flex flex-col justify-center min-h-[72px] transition-all hover:scale-[1.01]">
      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
      <span className={classNames("text-[15.5px] font-black mt-1.5 truncate leading-tight", colorClass)}>
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  onClick,
  iconBgColor = "bg-kat-primary-soft dark:bg-kat-primary/10",
  iconTextColor = "text-kat-teal dark:text-kat-teal",
  className = "",
  titleClassName = "text-kat-dark dark:text-slate-200",
  rightElement,
  disabled
}: {
  icon: any;
  title: string;
  onClick?: () => void;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
  titleClassName?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5"></div>
      <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
        <div className={classNames(
          "flex shrink-0 h-11 w-11 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3",
          iconBgColor,
          iconTextColor
        )}>
          <HugeiconsIcon icon={Icon} className="h-5.5 w-5.5" />
        </div>
        <span className={classNames("text-[15px] font-bold truncate leading-tight transition-colors group-hover:text-kat-primary dark:group-hover:text-kat-teal", titleClassName)}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-2 relative z-10">
        {rightElement !== undefined ? (
          rightElement
        ) : (
          (onClick || disabled) && <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-1" />
        )}
      </div>
    </>
  );

  const wrapperClasses = classNames(
    "group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border p-4 shadow-sm transition-all focus:outline-none",
    disabled 
      ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60 cursor-not-allowed" 
      : "bg-white dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 hover:border-kat-primary/30 dark:hover:border-kat-primary/40 hover:shadow-md active:scale-[0.98]",
    className
  );

  if (onClick || disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={wrapperClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={classNames(
        "flex w-full items-center justify-between bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-4 py-3 rounded-2xl min-h-[56px] text-kat-dark dark:text-slate-200",
        className
      )}
    >
      {content}
    </div>
  );
}




function MemberCardRow({
  member,
  checklist,
  expenses,
  openEditMember,
  onDeleteMember,
  isReadOnly
}: {
  member: Member;
  checklist: ChecklistItem[];
  expenses: Expense[];
  openEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";
                
  // Helper computations
  const assignedTasksCount = checklist.filter(c => c.assignedTo === member.name).length;
  const memberExpenses = expenses.filter(e => e.payer === member.name && !e.isDeleted);
  const paidExpensesCount = memberExpenses.length;
  const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const roleLower = (member.role || "").trim().toLowerCase();
  const isLeader = roleLower.includes("trưởng nhóm") || roleLower.includes("trưởng đoàn") || roleLower.includes("leader");
  const isCost = roleLower.includes("quản lý chi phí");
  const isDriver = roleLower.includes("tài xế");
  const isGuide = roleLower.includes("dẫn đường");
  const isLuggage = roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");

  let cardBg = "bg-gradient-to-br from-slate-50/20 via-white to-white border-slate-200/60 dark:from-slate-800/10 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
  let borderAccent = "border-l-4 border-l-slate-400";

  if (isLeader) {
    cardBg = "bg-gradient-to-br from-amber-50/30 via-white to-white border-slate-200/60 dark:from-amber-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
    borderAccent = "border-l-4 border-l-amber-500";
  } else if (isCost) {
    cardBg = "bg-gradient-to-br from-emerald-50/30 via-white to-white border-slate-200/60 dark:from-emerald-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
    borderAccent = "border-l-4 border-l-emerald-500";
  } else if (isDriver) {
    cardBg = "bg-gradient-to-br from-blue-50/30 via-white to-white border-slate-200/60 dark:from-blue-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
    borderAccent = "border-l-4 border-l-blue-500";
  } else if (isGuide) {
    cardBg = "bg-gradient-to-br from-sky-50/30 via-white to-white border-slate-200/60 dark:from-sky-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
    borderAccent = "border-l-4 border-l-sky-500";
  } else if (isLuggage) {
    cardBg = "bg-gradient-to-br from-indigo-50/30 via-white to-white border-slate-200/60 dark:from-indigo-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
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
              <span key={idx} title={t("roles.roleLeader")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                <HugeiconsIcon icon={CrownIcon} className="w-4 h-4 text-amber-500" />
              </span>
            );
          }
          if (rLower.includes("quản lý chi phí")) {
            return (
              <span key={idx} title={t("roles.roleCostManager")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                <HugeiconsIcon icon={WalletCardsIcon} className="w-4 h-4 text-emerald-500" />
              </span>
            );
          }
          if (rLower.includes("tài xế")) {
            return (
              <span key={idx} title={t("roles.roleDriver")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                <HugeiconsIcon icon={Car01Icon} className="w-4 h-4 text-blue-500" />
              </span>
            );
          }
          if (rLower.includes("dẫn đường")) {
            return (
              <span key={idx} title={t("roles.roleNavigator")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                <HugeiconsIcon icon={CompassIcon} className="w-4 h-4 text-sky-500" />
              </span>
            );
          }
          if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
            return (
              <span key={idx} title={t("roles.roleLuggage")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                <HugeiconsIcon icon={Luggage01Icon} className="w-4 h-4 text-indigo-500" />
              </span>
            );
          }
          return (
            <span key={idx} title={t("roles.roleCompanion")} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
              <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-slate-400" />
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={classNames(
      "relative rounded-3xl border transition-all flex flex-col justify-between gap-4.5 p-5 shadow-[0_4px_15px_rgba(3,13,46,0.015)] hover:shadow-[0_8px_25px_rgba(3,13,46,0.04)] hover:scale-[1.005] duration-200",
      cardBg,
      borderAccent
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {member.avatar ? (
              getAvatarSvg(member.avatar, "w-full h-full")
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-slate-300 text-[18px] font-black">
                {initial}
              </div>
            )}
          </div>

          {/* Member details */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
              <h4 className="text-[16.5px] font-extrabold text-kat-dark truncate leading-tight min-w-0">{member.name}</h4>
              {renderRoleBadge(member.role || "Người đồng hành")}
            </div>
            {member.phone && (
              <p className="text-[13.5px] font-semibold text-slate-500">
                {t("members.phonePrefix")}<span className="text-kat-dark">{member.phone}</span>
              </p>
            )}
            {member.group && (
              <p className="text-[13.5px] font-semibold text-slate-500">
                {t("members.groupPrefix")}<span className={member.isGroupLeader ? "text-kat-dark dark:text-kat-primary-usable" : "text-slate-700 dark:text-slate-300"}>{member.group}</span>
              </p>
            )}
            {member.note && (
              <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 italic mt-1 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-700/30 break-words">
                "{member.note}"
              </p>
            )}
          </div>
        </div>

        {/* Dropdown Menu Trigger (min 44x44px target) */}
        {!isReadOnly && (
          <div className="relative shrink-0">
            <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Tùy chọn"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-1.5 shadow-lg text-left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    openEditMember(member);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  {t("members.menuEdit")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteMember(member);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                  {t("members.menuDelete")}
                </button>
              </div>
            </>
          )}
          </div>
        )}
      </div>

      {/* Mini Stats Row */}
      <div className="pt-3 border-t border-slate-100/60 dark:border-slate-700/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className={classNames(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
            assignedTasksCount === 0 
              ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/30 text-slate-400 dark:text-slate-500 font-semibold" 
              : "bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-400 font-bold"
          )}>
            <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 shrink-0" />
            {assignedTasksCount} {t("members.taskCount")}
          </span>
          <span className={classNames(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm border",
            totalSpent > 0
              ? "bg-kat-teal-soft/30 dark:bg-kat-teal-soft/10 text-kat-teal dark:text-kat-primary-usable border-kat-teal/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          )}>
            <HugeiconsIcon icon={WalletCardsIcon} className="h-3.5 w-3.5 shrink-0" />
            {t("members.paidPrefix")}{formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} ${t("members.paidTimes")})`}
          </span>
        </div>
      </div>
    </div>
  );
}

import { ensureAnonymousUser } from "../../services/authService";
import { supabaseEnabled, supabase } from "../../lib/supabase";
import { createShareLink, revokeShareLink, updateShareLink } from "../../services/cloudShareService";

export function MoreScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  journals,
  packingItems,
  travelDocuments,
  onTripDeleted,
  onTripSelected,
  onShowToast,
  section,
  setSection,
  onOpenInbox,
  onOpenSettings,
  isReadOnly,
  isAutoSyncing,
  lastSyncedAt
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  packingItems: PackingItem[];
  travelDocuments?: import("../../db").TravelDocument[];
  onTripDeleted: () => void;
  onTripSelected: (id: number) => void;
  onShowToast?: (msg: string) => void;
  section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents";
  setSection: (section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents") => void;
  onOpenInbox?: () => void;
  onOpenSettings?: (view?: "menu" | "auth" | "privacy" | "about" | "donate") => void;
  isReadOnly?: boolean;
  isAutoSyncing?: boolean;
  lastSyncedAt?: Date | null;
}) {
  const { t } = useTranslation();
  const [authName, setAuthName] = useState<string | null>(null);

  useEffect(() => {
    if (supabaseEnabled) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.user_metadata?.full_name) {
          setAuthName(data.user.user_metadata.full_name);
        }
      });
    }
  }, []);

  const [editingTrip, setEditingTrip] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Modal confirmations states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isUnarchiveConfirmOpen, setIsUnarchiveConfirmOpen] = useState(false);
  const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);

  // Delete Member Confirm Dialog states
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);

  // Cloud share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync hooks with history for closing modals on browser back action
  useModalHistory(editingTrip, () => setEditingTrip(false), "edit-trip-modal");
  useModalHistory(isMemberFormOpen, () => {
    setIsMemberFormOpen(false);
    setEditingMember(null);
  }, "member-form-modal");
  useModalHistory(isDataSectionOpen, () => setIsDataSectionOpen(false), "data-backup-modal");
  useModalHistory(isDonateOpen, () => setIsDonateOpen(false), "donate-modal");
  useModalHistory(isShareModalOpen, () => setIsShareModalOpen(false), "share-trip-modal");

  useModalHistory(isDeleteConfirmOpen, () => setIsDeleteConfirmOpen(false), "delete-trip-confirm");
  useModalHistory(isArchiveConfirmOpen, () => setIsArchiveConfirmOpen(false), "archive-trip-confirm");
  useModalHistory(isUnarchiveConfirmOpen, () => setIsUnarchiveConfirmOpen(false), "unarchive-trip-confirm");
  useModalHistory(isFactoryResetConfirmOpen, () => setIsFactoryResetConfirmOpen(false), "factory-reset-confirm");
  useModalHistory(isDeleteMemberConfirmOpen, () => {
    setIsDeleteMemberConfirmOpen(false);
    setMemberToDelete(null);
  }, "delete-member-confirm");
  const [shareLoading, setShareLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    includeExpenses: trip.shareIncludeExpenses ?? true,
    includeJournals: trip.shareIncludeJournals ?? true,
    includeChecklist: trip.shareIncludeChecklist ?? true,
    includeBackupPlans: trip.shareIncludeBackupPlans ?? true,
    includeDocuments: trip.shareIncludeDocuments ?? false,
    sharePin: trip.sharePin ?? "",
    usePinProtection: trip.shareUsePinProtection ?? false,
  });

  useEffect(() => {
    setShareOptions({
      includeExpenses: trip.shareIncludeExpenses ?? true,
      includeJournals: trip.shareIncludeJournals ?? true,
      includeChecklist: trip.shareIncludeChecklist ?? true,
      includeBackupPlans: trip.shareIncludeBackupPlans ?? true,
      includeDocuments: trip.shareIncludeDocuments ?? false,
      sharePin: trip.sharePin ?? "",
      usePinProtection: trip.shareUsePinProtection ?? false,
    });
  }, [
    trip.id,
    trip.shareIncludeExpenses,
    trip.shareIncludeJournals,
    trip.shareIncludeChecklist,
    trip.shareIncludeBackupPlans,
    trip.shareIncludeDocuments,
    trip.shareUsePinProtection,
    trip.sharePin
  ]);

  const [copiedLink, setCopiedLink] = useState(false);

  const activeShareLink = trip.shareToken ? {
    token: trip.shareToken,
    url: `${window.location.origin}/share/${trip.shareToken}`
  } : null;

  const tripData = { trip, members, events, expenses, checklist, journals, packingItems, travelDocuments };

  const sortedMembers = React.useMemo(() => {
    let list = [...members];
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase().trim();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.role && m.role.toLowerCase().includes(q))
      );
    }
    const isLeader = (m: Member) => {
      const roleLower = (m.role || "").trim().toLowerCase();
      return (
        roleLower === "trưởng nhóm" ||
        roleLower === "trưởng đoàn" ||
        roleLower === "người đại diện" ||
        roleLower === "leader"
      );
    };
    list.sort((a, b) => {
      const aHasGroup = !!a.group;
      const bHasGroup = !!b.group;
      
      if (aHasGroup && bHasGroup) {
        const groupComp = a.group!.localeCompare(b.group!);
        if (groupComp !== 0) return groupComp;
        
        if (a.isGroupLeader && !b.isGroupLeader) return -1;
        if (!a.isGroupLeader && b.isGroupLeader) return 1;
      }
      
      if (aHasGroup && !bHasGroup) return -1;
      if (!aHasGroup && bHasGroup) return 1;

      const aLeader = isLeader(a);
      const bLeader = isLeader(b);
      if (aLeader && !bLeader) return -1;
      if (!aLeader && bLeader) return 1;
      
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [members, memberSearchQuery]);
  async function handleShareTrip() {
    if (!supabaseEnabled) {
      showToast(t("toast.supabaseNotConfigured"), "error");
      return;
    }
    setShareLoading(true);
    try {
      await ensureAnonymousUser();
      setIsShareModalOpen(true);
    } catch (e: any) {
      showToast(t("toast.supabaseError", { message: e.message }), "error");
    } finally {
      setShareLoading(false);
    }
  }
  async function handleCreateLink() {
    try {
      setShareLoading(true);
      await createShareLink(trip.id!, { 
        ...shareOptions, 
        mode: "request_edit",
        sharePin: shareOptions.usePinProtection && shareOptions.sharePin.length === 4 ? shareOptions.sharePin : undefined
      });
      // Save sharing configuration to local Dexie so background sync knows about it!
      await db.trips.update(trip.id!, {
        shareIncludeExpenses: shareOptions.includeExpenses,
        shareIncludeJournals: shareOptions.includeJournals,
        shareIncludeChecklist: shareOptions.includeChecklist,
        shareIncludeBackupPlans: shareOptions.includeBackupPlans,
        shareIncludeDocuments: shareOptions.includeDocuments,
        shareUsePinProtection: shareOptions.usePinProtection,
        sharePin: shareOptions.usePinProtection && shareOptions.sharePin.length === 4 ? shareOptions.sharePin : undefined
      });
    } catch (e: any) {
      showToast(t("toast.shareLinkCreateError"), "error");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleSyncLink() {
    if (!activeShareLink) return;
    try {
      setSyncLoading(true);
      await updateShareLink(trip.id!, activeShareLink.token, {
        ...shareOptions,
        mode: "request_edit",
        sharePin: shareOptions.usePinProtection && shareOptions.sharePin.length === 4 ? shareOptions.sharePin : undefined
      });
      showToast(t("toast.syncSuccess"));
    } catch (e: any) {
      showToast(t("toast.syncError"), "error");
      console.error(e);
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleRevokeLink() {
    if (!activeShareLink) return;
    try {
      setShareLoading(true);
      await revokeShareLink(trip.id!, activeShareLink.token);
      showToast(t("toast.shareLinkDisabled"));
    } catch (e: any) {
      showToast(t("toast.shareLinkDisableError"), "error");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function executeDeleteMember() {
    if (!memberToDelete?.id) return;
    await db.members.delete(memberToDelete.id);
    onShowToast?.(t("members.toastDeletedMember"));
    setIsDeleteMemberConfirmOpen(false);
    setMemberToDelete(null);
  }

  async function executeDeleteTrip() {
    if (!trip.id) return;
    await deleteTripCascade(trip.id);
    onShowToast?.("Đã xóa chuyến đi khỏi thiết bị này.");
    onTripDeleted();
  }

  function exportTrip() {
    try {
      const payload = createTripExport(tripData);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${safeFileName(trip.title)}.katjourney`);
      onShowToast?.("Đã tạo bản sao lưu thành công");
    } catch {
      onShowToast?.("Đã xảy ra lỗi khi tạo sao lưu");
    }
  }



  async function factoryReset() {
    try {
      await db.delete();
      showToast(t("toast.deleteDataSuccess"));
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      showToast(t("toast.deleteDataError"), "error");
    }
  }

  function openNewMember() {
    setEditingMember(null);
    setIsMemberFormOpen(true);
  }

  function openEditMember(member: Member) {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  }

  const getTripDurationText = () => {
    const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
    if (isDayTrip) return t("more.wrappedDayTrip");
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return t("home.longTrip");
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      return t("home.duration", { days: diffDays, nights: diffNights });
    } catch {
      return t("home.longTrip");
    }
  };

  if (section === "journal") {
    return (
      <JournalSection 
        tripId={trip.id!} 
        journals={journals} 
        onShowToast={onShowToast} 
        onBack={() => setSection("overview")} 
        isReadOnly={isReadOnly} 
        renderChatBox={trip.shareToken ? () => {
          const leader = members?.find(m => m.role?.toLowerCase().includes("trưởng nhóm") || m.role?.toLowerCase().includes("leader"));
          
          let chatName = t("chat.tripCreator");
          let chatRole = t("chat.tripCreator");

          if (leader) {
            chatName = leader.name;
            chatRole = "Trưởng nhóm";
          } else if (authName) {
            chatName = authName;
            chatRole = t("chat.tripCreator");
          }

          return (
            <ChatBox 
              token={trip.shareToken!} 
              currentUser={{ 
                name: chatName, 
                role: chatRole,
                isGuest: false, 
                canEdit: true 
              }} 
              inline={true}
              isReadOnly={isReadOnly}
            />
          );
        } : undefined}
      />
    );
  }
  if (section === "wrapped") return <WrappedSection data={tripData} setSection={setSection} />;
  if (section === "documents") return <TravelDocumentsSection tripId={trip.id!} onBack={() => setSection("overview")} onShowToast={onShowToast} isReadOnly={isReadOnly} />;
  
  if (section === "members") {


    const membersWithTasks = members.filter(m => checklist.some(c => c.assignedTo === m.name)).length;
    const membersWithExpenses = members.filter(m => expenses.some(e => e.payer === m.name)).length;

    return (
      <div className="mx-auto max-w-[960px] space-y-6 pb-0 md:pb-8">
        {/* Header / Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSection("overview")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all shrink-0"
              title="Quay lại"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">{t("members.membersTitle")}</h2>
              <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">{t("members.membersSubtitle")}</p>
            </div>
          </div>
          {!isReadOnly && (
            <button 
              className="flex h-11 sm:h-12 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 transition-all hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-[0.98] shadow-sm w-full sm:w-auto shrink-0 border border-transparent dark:border-kat-primary px-5 text-[14px] font-black"
              onClick={openNewMember}
            >
              <HugeiconsIcon icon={UserAdd01Icon} className="w-4.5 h-4.5" />
              {t("members.addMember")}
            </button>
          )}
        </div>

        {/* Overview Card */}
        <div className="mb-6">
          {members.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-2">
                    <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark leading-none">{members.length}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t("members.statMembers")}</span>
                </div>
                
                <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                  <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mb-2">
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark leading-none">{membersWithTasks}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t("members.statTasks")}</span>
                </div>

                <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-2">
                    <HugeiconsIcon icon={WalletCardsIcon} className="w-5 h-5" />
                  </div>
                  <span className="text-[20px] font-black text-kat-dark leading-none">{membersWithExpenses}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t("members.statPaid")}</span>
                </div>

                <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                  <div className={classNames("h-10 w-10 rounded-full flex items-center justify-center mb-2", members.length >= 2 ? "bg-teal-50 dark:bg-teal-900/20 text-teal-500" : "bg-slate-50 dark:bg-slate-800 text-slate-400")}>
                    <HugeiconsIcon icon={members.length >= 2 ? CheckmarkCircle01Icon : AlertCircleIcon} className="w-5 h-5" />
                  </div>
                  <span className={classNames("text-[14px] font-black leading-none", members.length >= 2 ? "text-kat-dark" : "text-slate-400")}>
                    {members.length >= 2 ? t("members.statReady") : t("members.statNeedMore")}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t("members.statSplit")}</span>
                </div>
              </div>
              
              {members.length < 2 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[13px] font-semibold text-slate-500">
                  <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5 text-kat-teal shrink-0" />
                  <p>{t("members.emptyMembers")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-1 text-[14px] md:text-[15px] font-semibold text-slate-500 leading-relaxed">
              <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-kat-teal shrink-0 mt-0.5" />
              <span>{t("members.emptyMembers")}</span>
            </div>
          )}
        </div>

        {/* Member List Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h3 className="text-[17px] font-extrabold text-kat-dark">{t("members.memberListTitle")} {members.length > 0 && `(${members.length})`}</h3>
            {members.length > 0 && (
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder={t("members.searchMember")}
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200/60 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md py-2.5 pl-10 pr-10 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-350 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800/50 transition-all shadow-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                  <HugeiconsIcon icon={Search01Icon} className="h-4.5 w-4.5 text-slate-400" />
                </div>
                {memberSearchQuery && (
                  <button
                    onClick={() => setMemberSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {sortedMembers.length ? (
            (() => {
              const groups: { name: string; members: typeof sortedMembers }[] = [];
              const noGroup: typeof sortedMembers = [];
              
              sortedMembers.forEach(m => {
                if (m.group) {
                  let g = groups.find(x => x.name === m.group);
                  if (!g) {
                    g = { name: m.group, members: [] };
                    groups.push(g);
                  }
                  g.members.push(m);
                } else {
                  noGroup.push(m);
                }
              });

              return (
                <div className="flex flex-col gap-6">
                  {groups.map(g => (
                    <div key={g.name} className="animate-fadeIn">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5 text-kat-teal" />
                        <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{g.name}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {g.members.map((member) => (
                          <MemberCardRow
                            key={member.id}
                            member={member}
                            checklist={checklist}
                            expenses={expenses}
                            openEditMember={openEditMember}
                            isReadOnly={isReadOnly}
                            onDeleteMember={(m) => {
                              setMemberToDelete(m);
                              setIsDeleteMemberConfirmOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {noGroup.length > 0 && (
                    <div className={groups.length > 0 ? "animate-fadeIn" : "animate-fadeIn"}>
                      {groups.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-slate-400" />
                          <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{t("members.otherMembers")}</h3>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {noGroup.map((member) => (
                          <MemberCardRow
                            key={member.id}
                            member={member}
                            checklist={checklist}
                            expenses={expenses}
                            openEditMember={openEditMember}
                            isReadOnly={isReadOnly}
                            onDeleteMember={(m) => {
                              setMemberToDelete(m);
                              setIsDeleteMemberConfirmOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : members.length > 0 ? (
            <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-8 text-center shadow-soft max-w-md mx-auto my-6 animate-fadeIn">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto mb-4 ring-4 ring-slate-50 dark:ring-slate-900/30">
                <HugeiconsIcon icon={UserGroupIcon} className="h-6 w-6" />
              </div>
              <h3 className="text-[15px] font-extrabold text-kat-dark">Không tìm thấy kết quả</h3>
              <p className="mt-2 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("members.noSearchResults")} "{memberSearchQuery}"
              </p>
            </div>
          ) : (
            /* Empty State Layout */
            <div className="rounded-[24px] border border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface p-6 text-center shadow-soft max-w-md mx-auto my-6 animate-fadeIn">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mx-auto mb-4 ring-4 ring-kat-primary/5">
                <HugeiconsIcon icon={UserGroupIcon} className="h-6 w-6" />
              </div>
              <h3 className="text-[16px] font-bold text-kat-dark">Chưa có thành viên nào</h3>
              <p className="mt-2 text-[14.5px] font-semibold text-slate-500 leading-relaxed">
                Thêm thành viên để cùng chia chi phí, chuẩn bị hành lý và lưu lại vai trò trong chuyến đi.
              </p>
            </div>
          )}
        </section>

        <MemberForm
          tripId={trip.id!}
          editing={editingMember}
          isOpen={isMemberFormOpen}
          onClose={() => setIsMemberFormOpen(false)}
          onShowToast={onShowToast}
        />
        
        <DeleteMemberConfirmModal
          isOpen={isDeleteMemberConfirmOpen}
          onClose={() => {
            setIsDeleteMemberConfirmOpen(false);
            setMemberToDelete(null);
          }}
          onConfirm={executeDeleteMember}
          memberName={memberToDelete?.name ?? ""}
          hasExpenses={memberToDelete ? expenses.some(e => e.payer === memberToDelete.name) : false}
          hasChecklist={memberToDelete ? checklist.some(c => c.assignedTo === memberToDelete.name) : false}
        />
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="mx-auto max-w-[640px] space-y-6 pb-0 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">{t("more.workspaceTitle")}</h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">{t("more.workspaceDescNoTrip")}</p>
          </div>
          <button
            onClick={() => setSection("overview")}
            className="flex h-10 items-center justify-center rounded-full bg-[#EDEAE2] dark:bg-slate-800 border border-[#C8BDB0] dark:border-slate-700 px-4 text-[13.5px] font-bold text-kat-dark dark:text-slate-200 transition-all hover:bg-[#E2DDD3] dark:hover:bg-slate-700 active:scale-95 shadow-sm"
          >
            Quay lại
          </button>
        </div>

        {/* App settings items */}
        <div className="flex flex-col gap-2">

          {/* Privacy */}
          <button
            onClick={() => onOpenSettings?.("privacy")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                <HugeiconsIcon icon={LockIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">Quyền riêng tư</h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">Quản lý an toàn dữ liệu và quyền cá nhân</p>
              </div>
            </div>
            <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </button>

          {/* About */}
          <button
            onClick={() => onOpenSettings?.("about")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">Thông tin ứng dụng</h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">Khám phá thông tin và hành trình phát triển</p>
              </div>
            </div>
            <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </button>

          {/* Donate */}
          <button
            onClick={() => onOpenSettings?.("donate")}
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/80 transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">Ủng hộ tác giả</h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">Nếu bạn thấy app hữu ích, cảm ơn rất nhiều</p>
              </div>
            </div>
            <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </button>

          {/* Version */}
          <div className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <HugeiconsIcon icon={PackageIcon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-kat-dark dark:text-slate-200">Phiên bản</h4>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">Phiên bản hiện tại trên thiết bị</p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">{APP_VERSION}</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest px-1 pb-1">Vùng nguy hiểm</p>
          <ActionCard
            icon={Delete01Icon}
            title="Khôi phục cài đặt gốc"
            onClick={() => setIsFactoryResetConfirmOpen(true)}
            iconBgColor="bg-rose-50 dark:bg-rose-950/20"
            iconTextColor="text-rose-600 border-rose-100/60 dark:text-rose-450 dark:border-rose-900/30"
            titleClassName="text-rose-600 dark:text-rose-400 font-semibold"
            className="border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500/50"
          />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            {t("more.madeBy")}{" "}
            <a
              href="https://tranthanhtung-trevor.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>
      </div>
    );
  }

  const checklistPercent = getChecklistStats(checklist).percent;
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const tripDurationText = getTripDurationText();

  return (
    <div className="mx-auto max-w-[800px] px-2 md:px-0">
      <div className="flex flex-col gap-6 pb-0 md:pb-8">
        
        {/* Title Block */}
        <div>
          <h2 className="text-[32px] font-extrabold tracking-tight text-kat-dark dark:text-slate-200">{t("more.workspaceTitle")}</h2>
          <p className="mt-1 text-[15px] font-medium text-slate-500 dark:text-slate-400">
            {t("more.workspaceDesc")}
          </p>
        </div>

        {/* Hero chuyến đi compact hơn */}
        <section className="relative overflow-hidden rounded-[28px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-slate-800/80 p-5 md:p-6 text-kat-text shadow-soft">
          <div 
            className="absolute -right-6 -bottom-6 w-32 h-32 rotate-12 pointer-events-none z-0 flex items-center justify-center text-kat-primary"
            style={{ opacity: 0.04, color: "var(--kat-primary)" }}
          >
            <HugeiconsIcon icon={CompassIcon} size={128} />
          </div>
          
          <div className="relative z-10 flex flex-col gap-4">
            {/* Header info */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-450">{t("more.currentTrip")}</p>
              <h3 className="mt-1 break-words text-[24px] md:text-[28px] font-black leading-tight tracking-tight text-kat-dark dark:text-slate-200">
                {trip.title}
              </h3>
            </div>
            
            {/* Metadata tags */}
            <div className="flex flex-wrap gap-2 text-[12.5px] font-bold text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/35 px-3 py-1.5">
                <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {trip.location || t("more.noLocation")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/35 px-3 py-1.5">
                <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/35 px-3 py-1.5">
                <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                {tripDurationText}
              </span>
            </div>

            {/* Compact inline stats pills */}
            <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-kat-primary-soft dark:bg-kat-primary/10 border border-kat-primary/20 dark:border-kat-primary/30 px-3 py-1.5 text-[12.5px] font-extrabold text-kat-primary-usable dark:text-kat-primary">
                <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5" />
                {members.length} {t("more.membersCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0081BE]/8 dark:bg-[#0081BE]/10 border border-[#0081BE]/15 px-3 py-1.5 text-[12.5px] font-extrabold text-[#0081BE]">
                <HugeiconsIcon icon={Route01Icon} className="h-3.5 w-3.5" />
                {events.length} {t("more.eventsCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/8 dark:bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-450">
                <HugeiconsIcon icon={WalletCardsIcon} className="h-3.5 w-3.5" />
                {formatMoney(totalExpense)} {t("more.expensesCount")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F89B02]/8 dark:bg-[#F89B02]/10 border border-[#F89B02]/15 px-3 py-1.5 text-[12.5px] font-extrabold text-[#F89B02]">
                <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5" />
                {t("more.packingProgress")} {checklistPercent}%
              </span>
            </div>
          </div>
        </section>

        {/* Thao tác chính */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">{t("more.sectionFeatures")}</h3>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
            <ActionCard
              icon={MapsIcon}
              title={t("more.featureTripInfo")}
              onClick={() => setEditingTrip(true)}
              disabled={isReadOnly}
              iconBgColor="bg-sky-50 dark:bg-sky-950/20"
              iconTextColor="text-sky-600 border-sky-100 dark:text-sky-400 dark:border-sky-900/30"
            />
            <ActionCard
              icon={UserGroupIcon}
              title={t("more.featureMembers")}
              onClick={() => setSection("members")}
              iconBgColor="bg-amber-50 dark:bg-amber-950/20"
              iconTextColor="text-amber-600 border-amber-100 dark:text-amber-400 dark:border-amber-900/30"
            />
            <ActionCard
              icon={AwardIcon}
              title={t("more.featureWrapped")}
              onClick={() => setSection("wrapped")}
              iconBgColor="bg-indigo-50 dark:bg-indigo-950/20"
              iconTextColor="text-indigo-600 border-indigo-100 dark:text-indigo-400 dark:border-indigo-900/30"
            />
            <ActionCard
              icon={GlobeIcon}
              title={t("more.featureJournal")}
              onClick={() => setSection("journal")}
              iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
              iconTextColor="text-emerald-600 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30"
            />
            <ActionCard
              icon={Ticket01Icon}
              title={t("more.featureDocuments")}
              onClick={() => setSection("documents")}
              iconBgColor="bg-teal-50 dark:bg-teal-950/20"
              iconTextColor="text-teal-600 border-teal-100 dark:text-teal-400 dark:border-teal-900/30"
            />
            <ActionCard
              icon={Share01Icon}
              title={t("more.featureShare")}
              onClick={handleShareTrip}
              iconBgColor="bg-violet-50 dark:bg-violet-950/20"
              iconTextColor="text-violet-600 border-violet-100 dark:text-violet-400 dark:border-violet-900/30"
            />
          </div>
        </section>

        {/* Hệ thống */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">{t("more.sectionData")}</h3>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
            <div className="flex flex-col gap-2 md:col-span-2">
              <ActionCard
                icon={DatabaseBackupIcon}
                title={t("more.dataTripData")}
                onClick={() => setIsDataSectionOpen(!isDataSectionOpen)}
                iconBgColor="bg-blue-50 dark:bg-blue-950/20"
                iconTextColor="text-blue-600 border-blue-100 dark:text-blue-400 dark:border-blue-900/30"
                rightElement={
                  <HugeiconsIcon icon={ChevronRightIcon} 
                    className={classNames(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200", 
                      isDataSectionOpen ? "rotate-90" : ""
                    )} 
                  />
                }
              />
              
              {isDataSectionOpen && (
                <div className="flex flex-col gap-2.5 mt-1 animate-fadeIn sm:pl-8 pl-4">
                  <div className="relative">
                    {/* Decorative connection line */}
                    <div className="absolute -left-3 top-0 bottom-6 w-px bg-gradient-to-b from-blue-200 via-sky-200 to-transparent dark:from-blue-800 dark:via-sky-800 hidden sm:block"></div>
                    
                    <div className="flex flex-col gap-2.5">
                      <ActionCard
                        icon={Download01Icon}
                        title={t("more.dataBackup")}
                        onClick={exportTrip}
                        iconBgColor="bg-sky-50 dark:bg-sky-950/20"
                        iconTextColor="text-sky-600 border-sky-100 dark:text-sky-400 dark:border-sky-900/30"
                      />

                      <ActionCard
                        icon={File01Icon}
                        title={t("more.dataExportPdf")}
                        onClick={async () => {
                          const { exportTripPdf } = await import("../../utils/exportPdf");
                          exportTripPdf(tripData);
                        }}
                        iconBgColor="bg-rose-50 dark:bg-rose-950/20"
                        iconTextColor="text-rose-600 border-rose-100 dark:text-rose-450 dark:border-rose-900/30"
                      />
                      
                      <ActionCard
                        icon={Table01Icon}
                        title={t("more.dataExportExcel")}
                        onClick={async () => {
                          const { exportTripExcel } = await import("../../utils/exportExcel");
                          exportTripExcel(tripData).catch(console.error);
                        }}
                        iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
                        iconTextColor="text-emerald-600 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Vùng thao tác cẩn trọng */}
        <section className="space-y-3 pt-2">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-rose-500/80">{t("more.sectionDanger")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {!isReadOnly ? (
              <ActionCard
                icon={LockIcon}
                title={t("more.actionEndTrip")}
                onClick={() => setIsArchiveConfirmOpen(true)}
                iconBgColor="bg-slate-100 dark:bg-slate-800/40"
                iconTextColor="text-slate-600 border-slate-200/60 dark:text-slate-400 dark:border-slate-700/30"
                titleClassName="text-slate-700 dark:text-slate-300 font-semibold"
                className="border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-300 focus:ring-slate-500/50 md:col-span-2"
              />
            ) : (
              <ActionCard
                icon={CircleUnlock01Icon}
                title={t("more.actionRestoreTrip")}
                onClick={() => setIsUnarchiveConfirmOpen(true)}
                iconBgColor="bg-emerald-50 dark:bg-emerald-950/20"
                iconTextColor="text-emerald-600 border-emerald-100/60 dark:text-emerald-400 dark:border-emerald-900/30"
                titleClassName="text-emerald-700 dark:text-emerald-450 font-semibold"
                className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500/50 md:col-span-2"
              />
            )}
            <ActionCard
              icon={Delete01Icon}
              title={t("more.actionDeleteTrip")}
              onClick={() => setIsDeleteConfirmOpen(true)}
              iconBgColor="bg-rose-50 dark:bg-rose-950/20"
              iconTextColor="text-rose-600 border-rose-100/60 dark:text-rose-450 dark:border-rose-900/30"
              titleClassName="text-rose-600 dark:text-rose-400 font-semibold"
              className="border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500/50 md:col-span-2"
            />
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            {t("more.madeBy")}{" "}
            <a
              href="https://tranthanhtung-trevor.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>

      </div>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />

      <TripForm
        trip={trip}
        isOpen={editingTrip}
        onClose={() => setEditingTrip(false)}
        onSaved={onTripSelected}
      />

      <MemberForm
        tripId={trip.id!}
        editing={editingMember}
        isOpen={isMemberFormOpen}
        onClose={() => setIsMemberFormOpen(false)}
        onShowToast={onShowToast}
      />

      <DeleteMemberConfirmModal
        isOpen={isDeleteMemberConfirmOpen}
        onClose={() => {
          setIsDeleteMemberConfirmOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={executeDeleteMember}
        memberName={memberToDelete?.name ?? ""}
        hasExpenses={memberToDelete ? expenses.some(e => e.payer === memberToDelete.name) : false}
        hasChecklist={memberToDelete ? checklist.some(c => c.assignedTo === memberToDelete.name) : false}
      />

      <ConfirmDeleteTripDialog
        open={isDeleteConfirmOpen}
        tripName={trip.title}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleteConfirmOpen(false);
          await executeDeleteTrip();
        }}
      />

      <TypedDeleteConfirmModal
        isOpen={isFactoryResetConfirmOpen}
        onClose={() => setIsFactoryResetConfirmOpen(false)}
        onConfirm={async () => {
          setIsFactoryResetConfirmOpen(false);
          await factoryReset();
        }}
        title="Khôi phục cài đặt gốc?"
        description="Hành động này sẽ xóa toàn bộ dữ liệu KAT Journey trên thiết bị hiện tại, bao gồm chuyến đi, lịch trình, chi phí, bản tin hành trình và dữ liệu liên quan. Không thể hoàn tác."
        confirmLabel="Xóa toàn bộ dữ liệu"
      />

      <BottomSheet
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
        }}
        title={t("more.featureShare")}
        subtitle={t("share.shareSubtitle")}
      >
        <div className="space-y-5 px-1 pb-4">
          {!activeShareLink ? (
            <>
              {/* Option Rows */}
              <div className="space-y-2.5">
                {/* Row: Bao gồm chi phí */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeExpenses: !shareOptions.includeExpenses })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400">
                      <HugeiconsIcon icon={WalletCardsIcon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.includeExpenses")}</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeExpenses} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeExpenses: val })} 
                  />
                </div>

                {/* Row: Bao gồm bản tin */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeJournals: !shareOptions.includeJournals })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/20 text-violet-500 dark:text-violet-400">
                      <HugeiconsIcon icon={BookOpen01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.includeJournals")}</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeJournals} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeJournals: val })} 
                  />
                </div>

                {/* Row: Bao gồm danh sách chuẩn bị */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeChecklist: !shareOptions.includeChecklist })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.includeChecklist")}</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeChecklist} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeChecklist: val })} 
                  />
                </div>

                {/* Row: Bao gồm phương án dự phòng */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeBackupPlans: !shareOptions.includeBackupPlans })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-500 dark:text-sky-400">
                      <HugeiconsIcon icon={Alert01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.includeBackup")}</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeBackupPlans} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeBackupPlans: val })} 
                  />
                </div>

                {/* Row: Bao gồm giấy tờ & đặt chỗ */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeDocuments: !shareOptions.includeDocuments })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-150/60 dark:border-slate-700/50 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400">
                      <HugeiconsIcon icon={File01Icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.includeDocs")}</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeDocuments} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeDocuments: val })} 
                  />
                </div>

                {shareOptions.includeDocuments && (
                  <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-4 text-[13px] text-rose-800 dark:text-rose-400 font-semibold flex gap-2 animate-fadeIn dark:bg-rose-950/20 dark:border-rose-900/30">
                    <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <span>{t("share.docWarning")}</span>
                  </div>
                )}
              </div>

              {/* PIN Protection */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
                <div
                  onClick={() => setShareOptions(o => ({ ...o, usePinProtection: !o.usePinProtection, sharePin: "" }))}
                  className="flex min-h-[52px] items-center justify-between py-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
                      <HugeiconsIcon icon={LockIcon} className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <span className="text-[14.5px] font-bold text-slate-700 dark:text-slate-200">{t("share.pinProtect")}</span>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium">{t("share.pinDesc")}</p>
                    </div>
                  </div>
                  <ShareSwitch
                    checked={shareOptions.usePinProtection}
                    onChange={(val) => setShareOptions(o => ({ ...o, usePinProtection: val, sharePin: "" }))}
                  />
                </div>

                {shareOptions.usePinProtection && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50 animate-fadeIn">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mb-2.5">{t("share.enterPin")}</p>
                    <div className="flex gap-3 justify-center">
                      {[0,1,2,3].map((i) => (
                        <input
                          key={i}
                          id={`pin-digit-${i}`}
                          type="number"
                          inputMode="numeric"
                          maxLength={1}
                          value={shareOptions.sharePin[i] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(-1);
                            const arr = shareOptions.sharePin.padEnd(4, " ").split("");
                            arr[i] = val || " ";
                            const newPin = arr.join("").replace(/ +$/, "");
                            setShareOptions(o => ({ ...o, sharePin: newPin }));
                            if (val && i < 3) {
                              const next = document.getElementById(`pin-digit-${i+1}`);
                              (next as HTMLInputElement)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !shareOptions.sharePin[i] && i > 0) {
                              const prev = document.getElementById(`pin-digit-${i-1}`);
                              (prev as HTMLInputElement)?.focus();
                            }
                          }}
                          className="w-12 h-12 rounded-xl border-2 text-center text-[20px] font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-kat-dark focus:dark:border-kat-primary focus:ring-2 focus:ring-[#030D2E]/20 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ borderColor: shareOptions.sharePin[i] ? undefined : undefined }}
                        />
                      ))}
                    </div>
                    {shareOptions.sharePin.length === 4 && (
                      <p className="mt-2 text-center text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <HugeiconsIcon icon={CheckIcon} className="h-3 w-3" /> {t("share.pinReady")}
                      </p>
                    )}
                    {shareOptions.usePinProtection && shareOptions.sharePin.length < 4 && (
                      <p className="mt-2 text-center text-[12px] text-amber-500 dark:text-amber-400 font-semibold">{t("share.pinError")}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 py-3 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {t("share.close")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={shareLoading || (shareOptions.usePinProtection && shareOptions.sharePin.length < 4)}
                  className="flex-[2] rounded-xl bg-kat-dark dark:bg-kat-primary py-3 font-bold text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none border border-transparent dark:border-kat-primary"
                >
                  {shareLoading ? t("share.creatingLink") : t("share.createLink")}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              {/* Success layout */}
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 p-3.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[14px] font-bold text-emerald-800 dark:text-emerald-300">{t("share.linkCreated")}</span>
              </div>

              {/* Copy Link field inside an Input container with inline Copy button */}
              <div className="relative flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 px-3 py-2.5">
                <input
                  type="text"
                  readOnly
                  value={activeShareLink.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className={classNames(
                    "flex-1 bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 text-[13.5px] font-medium truncate cursor-text",
                    typeof navigator !== "undefined" && "share" in navigator ? "pr-20" : "pr-10"
                  )}
                />
                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeShareLink.url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm active:scale-95"
                    title="Sao chép link"
                  >
                    {copiedLink ? (
                      <HugeiconsIcon icon={CheckIcon} className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <HugeiconsIcon icon={CopyIcon} className="h-4 w-4" />
                    )}
                  </button>
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: "KAT Journey",
                            text: t("share.joinTrip", { trip: trip?.title || '' }),
                            url: activeShareLink.url
                          });
                        } catch (err) {
                          console.log("Share failed or cancelled", err);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-kat-dark dark:bg-kat-primary border border-kat-dark dark:border-kat-primary text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 transition-all shadow-sm active:scale-95"
                      title="Chia sẻ qua hệ thống"
                    >
                      <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status display */}
              <div className="text-[12px] font-semibold flex items-center gap-2 bg-slate-50 dark:bg-slate-800/20 border border-slate-150/50 dark:border-slate-700/30 rounded-xl py-2 px-3 animate-fadeIn text-slate-600 dark:text-slate-400">
                {isAutoSyncing ? (
                  <>
                    <HugeiconsIcon icon={Refresh01Icon} className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                    <span className="text-sky-700 dark:text-sky-300">{t("share.syncingChanges")}</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {t("share.autoSyncLast")} {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : t("share.justNow")}
                    </span>
                  </>
                )}
              </div>

              {/* Success actions */}
              <div className="flex gap-3 flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 py-3 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {t("share.close")}
                </button>
                <button
                  type="button"
                  onClick={handleSyncLink}
                  disabled={syncLoading}
                  className="flex-[2] rounded-xl bg-kat-dark/10 dark:bg-slate-800 border border-kat-dark/20 dark:border-slate-700 py-3 font-bold text-kat-dark dark:text-slate-200 hover:bg-kat-dark/20 dark:hover:bg-slate-700 active:scale-95 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none flex items-center justify-center gap-1.5"
                >
                  <HugeiconsIcon icon={Refresh01Icon} className={classNames("h-4 w-4", syncLoading && "animate-spin")} />
                  {syncLoading ? t("share.syncing") : t("share.syncData")}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeLink}
                  disabled={shareLoading}
                  className="flex-1 rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 py-3 font-bold active:scale-95 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {shareLoading ? t("share.turningOff") : t("share.turnOff")}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>





      <BottomSheet 
        isOpen={isArchiveConfirmOpen} 
        onClose={() => setIsArchiveConfirmOpen(false)} 
        title={t("more.archiveModalTitle")}
      >
        <div className="space-y-5">
          <div className="rounded-[20px] bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-5 text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <Trans i18nKey="more.archiveModalDesc" components={{ b: <b className="text-kat-dark" /> }} />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsArchiveConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t("common.cancel")}
            </button>
             <button
              type="button"
              onClick={async () => {
                setIsArchiveConfirmOpen(false);
                if (trip.id) {
                  await archiveTrip(trip.id);
                  onShowToast?.("Đã kết thúc chuyến đi và đưa vào kỷ niệm.");
                }
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary border border-kat-dark dark:border-kat-primary px-6 font-bold text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-98 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(3,13,46,0.4)] dark:shadow-[0_8px_24px_-8px_rgba(0,191,183,0.3)]"
            >
              <HugeiconsIcon icon={LockIcon} className="h-5 w-5 opacity-80" />
              {t("more.archiveModalConfirm")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Unarchive Confirm Modal */}
      <BottomSheet 
        isOpen={isUnarchiveConfirmOpen} 
        onClose={() => setIsUnarchiveConfirmOpen(false)} 
        title={t("more.unarchiveModalTitle")}
      >
        <div className="space-y-5">
          <div className="rounded-[20px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 text-[14px] text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed">
            <Trans i18nKey="more.unarchiveModalDesc" components={{ b: <b className="text-emerald-700 dark:text-emerald-300" /> }} />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsUnarchiveConfirmOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 px-6 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all duration-200"
            >
              {t("common.cancel")}
            </button>
             <button
              type="button"
              onClick={async () => {
                setIsUnarchiveConfirmOpen(false);
                if (trip.id) {
                  await unarchiveTrip(trip.id);
                  onShowToast?.("Đã mở khóa chuyến đi.");
                }
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 dark:bg-emerald-600 border border-emerald-500 dark:border-emerald-500 px-6 font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 active:scale-98 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(5,150,105,0.4)]"
            >
              <HugeiconsIcon icon={CircleUnlock01Icon} className="h-5 w-5 opacity-80" />
              {t("more.unarchiveModalConfirm")}
            </button>
          </div>
        </div>
      </BottomSheet>

    </div>
  );
}
export { TripForm };
