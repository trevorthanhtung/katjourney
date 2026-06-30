import { normalizeVietnameseDisplayText } from "../../utils/helpers";
import { searchLocation, GeocodingResult } from "../../services/weatherService";
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

export function LocationInput({
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
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
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
    const display = normalizeVietnameseDisplayText(
      [result.name, result.admin1, result.country].filter(Boolean).join(", ")
    );
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
        <HugeiconsIcon
          icon={Location01Icon}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kat-primary pointer-events-none z-10"
          size={16}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t("trips.exampleLocation")}
          className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#0A0F1C]/40 backdrop-blur-md pl-10 pr-10 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-kat-primary focus:ring-2 focus:ring-kat-primary/20 dark:focus:bg-white/5 focus:outline-none transition-all"
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
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl shadow-floating animate-fadeIn">
          {suggestions.map((result, idx) => {
            const name = normalizeVietnameseDisplayText(result.name);
            const sub = normalizeVietnameseDisplayText(
              [result.admin1, result.country].filter(Boolean).join(", ")
            );
            return (
              <li key={idx}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100/60 dark:border-white/5 last:border-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kat-primary/10 dark:bg-kat-teal/20">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={14}
                      className="text-kat-primary dark:text-kat-teal"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {name}
                    </p>
                    {sub && (
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium truncate">
                        {sub}
                      </p>
                    )}
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
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
