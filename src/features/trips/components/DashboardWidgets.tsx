import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDistanceUnit } from "../../../hooks/useDistanceUnit";
import tzdbZones from "./timezones.json";
import {
  EarthIcon,
  Route01Icon,
  Calendar01Icon,
  MapsLocation01Icon,
  Exchange01Icon,
  Clock01Icon,
  RefreshIcon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { BottomSheet } from "../../../components/ui";
import { Trip } from "../../../db";
import { useAtlasStats } from "../../atlas/useAtlasStats";

interface GamificationStatsProps {
  trips: Trip[];
  onAtlasClick?: () => void;
}

export function GamificationStats({ trips, onAtlasClick }: GamificationStatsProps) {
  const { t } = useTranslation();
  const { distanceLabel } = useDistanceUnit();
  const { visitedAlpha2s } = useAtlasStats(trips);

  const totalTrips = trips.length;
  const totalDays = trips.reduce((acc, t) => {
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return acc;
    return acc + Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
  }, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <div
        onClick={onAtlasClick}
        className={`flex flex-col relative overflow-hidden bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 min-h-[120px] group ${onAtlasClick ? "cursor-pointer active:scale-[0.98]" : ""}`}
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 dark:bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 group-hover:scale-150 transition-all duration-700"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Atlas: {t("dashboard.stats.countries", "Quốc gia")}
          </span>
          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-500/20">
            <HugeiconsIcon icon={EarthIcon} size={16} />
          </div>
        </div>
        <div className="mt-auto relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              {visitedAlpha2s.length}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              {t("dashboard.stats.of195", "của 195")}
            </span>
          </div>
          <div className="flex -space-x-1.5 mt-2 overflow-hidden h-6 items-center">
            {visitedAlpha2s.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                {t("dashboard.stats.none", "Chưa có")}
              </span>
            )}
            {visitedAlpha2s.slice(0, 5).map((alpha2) => (
              <img
                key={alpha2}
                src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`}
                alt={alpha2}
                className="w-5 h-5 rounded-full object-cover border-2 border-white dark:border-kat-surface shrink-0 shadow-sm"
                title={alpha2}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col relative overflow-hidden bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 min-h-[120px] group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:scale-150 transition-all duration-700"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("dashboard.stats.totalTrips", "Tổng chuyến đi")}
          </span>
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20">
            <HugeiconsIcon icon={Route01Icon} size={16} />
          </div>
        </div>
        <div className="mt-auto relative z-10">
          <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {totalTrips}
          </div>
          <div className="text-[12px] font-semibold text-slate-400 mt-1">
            {t("dashboard.stats.scheduled", "Đã lên lịch")}
          </div>
        </div>
      </div>

      <div className="flex flex-col relative overflow-hidden bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 min-h-[120px] group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:scale-150 transition-all duration-700"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("dashboard.stats.daysTraveled", "Ngày vi vu")}
          </span>
          <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-100 dark:border-orange-500/20">
            <HugeiconsIcon icon={Calendar01Icon} size={16} />
          </div>
        </div>
        <div className="mt-auto relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              {totalDays}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              {t("dashboard.stats.daysLabel", "ngày")}
            </span>
          </div>
          <div className="text-[12px] font-semibold text-slate-400 mt-1">
            {t("dashboard.stats.onAllJourneys", "Trên mọi hành trình")}
          </div>
        </div>
      </div>

      <div className="flex flex-col relative overflow-hidden bg-white dark:bg-kat-surface border border-slate-100 dark:border-kat-border rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 min-h-[120px] group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:scale-150 transition-all duration-700"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("dashboard.stats.destinations", "Điểm đến")}
          </span>
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
            <HugeiconsIcon icon={MapsLocation01Icon} size={16} />
          </div>
        </div>
        <div className="mt-auto relative z-10">
          <div className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {trips.reduce((acc, t) => acc + (t.destinations?.length || 1), 0)}
          </div>
          <div className="text-[12px] font-semibold text-slate-400 mt-1">
            {t("dashboard.stats.explored", "Đã khám phá")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimezonesWidget() {
  const { t } = useTranslation();
  const [time, setTime] = useState(new Date());
  const [timezones, setTimezones] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Default timezones if none selected
  const DEFAULT_TIMEZONES = ["Asia/Ho_Chi_Minh", "Asia/Tokyo", "Europe/London"];

  useEffect(() => {
    const saved = localStorage.getItem("kat_journey_timezones");
    if (saved) {
      try {
        setTimezones(JSON.parse(saved));
      } catch (e) {
        setTimezones(DEFAULT_TIMEZONES);
      }
    } else {
      setTimezones(DEFAULT_TIMEZONES);
    }
  }, []);

  useEffect(() => {
    if (timezones.length > 0) {
      localStorage.setItem("kat_journey_timezones", JSON.stringify(timezones));
    }
  }, [timezones]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tzOffsetString = (tz: string) => {
    try {
      const date = new Date();
      const tzString = date.toLocaleString("en-US", { timeZone: tz });
      const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
      const tzDate = new Date(tzString);
      const utcDate = new Date(utcString);
      const diffHrs = (tzDate.getTime() - utcDate.getTime()) / 3600000;
      const sign = diffHrs >= 0 ? "+" : "";
      return `GMT${sign}${diffHrs}`;
    } catch (e) {
      return "GMT";
    }
  };

  const tzTime = (date: Date, tz: string) => {
    try {
      return date.toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "--:--";
    }
  };

  const tzName = (tz: string) => {
    return tz.split("/").pop()?.replace(/_/g, " ") || tz;
  };

  // Search logic

  const removeAccents = (str: string) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const POPULAR_TIMEZONES = [
    "Asia/Ho_Chi_Minh",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/Paris",
    "Asia/Dubai",
    "America/Los_Angeles",
    "Asia/Singapore",
    "Asia/Hong_Kong",
  ];

  const filteredTimezones = (tzdbZones as any[])
    .filter((tzObj) => {
      if (timezones.includes(tzObj.name)) return false;

      if (!searchQuery.trim()) {
        return POPULAR_TIMEZONES.includes(tzObj.name);
      }

      const q = removeAccents(searchQuery);
      return (
        removeAccents(tzObj.name).includes(q) ||
        removeAccents(tzObj.countryName).includes(q) ||
        removeAccents(tzObj.alternativeName).includes(q) ||
        tzObj.mainCities.some((city: string) => removeAccents(city).includes(q))
      );
    })
    .sort((a, b) => {
      // If no search query, sort by our defined popular order
      if (!searchQuery.trim()) {
        return POPULAR_TIMEZONES.indexOf(a.name) - POPULAR_TIMEZONES.indexOf(b.name);
      }
      return 0; // Default sort for search results
    });

  const addTimezone = (tz: string) => {
    setTimezones([...timezones, tz]);
    setIsAdding(false);
    setSearchQuery("");
  };

  const removeTimezone = (indexToRemove: number) => {
    setTimezones(timezones.filter((_, i) => i !== indexToRemove));
  };

  return (
    <>
      <div className="bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-400">
            <HugeiconsIcon icon={Clock01Icon} size={16} />
            <span className="text-[12px] font-black uppercase tracking-wider">
              {t("dashboard.widgets.timezones", "Timezones")}
            </span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="text-slate-400 hover:text-kat-primary transition-colors"
          >
            <HugeiconsIcon icon={EarthIcon} size={18} />
          </button>
        </div>

        <div className="flex flex-col">
          {timezones.length === 0 ? (
            <div className="text-center text-slate-400 text-[13px] py-4">
              {t("dashboard.widgets.noTimezonesSelected", "No timezones selected")}
            </div>
          ) : (
            <>
              {/* Highlighted First Timezone */}
              <div className="flex flex-col group relative">
                <div className="text-[24px] font-bold text-kat-text dark:text-slate-100 tracking-tight leading-tight">
                  {tzName(timezones[0])}
                </div>
                <div className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {tzTime(time, timezones[0])}
                </div>
                <button
                  onClick={() => removeTimezone(0)}
                  className="absolute top-1 right-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-2"
                  title={t("common.remove", "Remove")}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              {timezones.length > 1 && (
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60 my-5"></div>
              )}

              {/* Other Timezones List */}
              <div className="space-y-4">
                {timezones.slice(1).map((tz, index) => {
                  const actualIndex = index + 1;
                  return (
                    <div key={tz} className="flex items-center justify-between group relative">
                      <div className="text-[15px] font-semibold text-kat-text dark:text-slate-200">
                        {tzName(tz)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[15px] font-medium text-slate-500 dark:text-slate-400 group-hover:opacity-0 transition-opacity">
                          {tzTime(time, tz)}
                        </div>
                        <button
                          onClick={() => removeTimezone(actualIndex)}
                          className="absolute right-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 bg-white dark:bg-kat-surface"
                          title={t("common.remove", "Remove")}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timezone Selection Bottom Sheet */}
      <BottomSheet
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={t("dashboard.widgets.timezones", "Timezones")}
      >
        <div className="flex flex-col h-[70vh] sm:h-[60vh]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <HugeiconsIcon icon={Search01Icon} size={16} />
              </div>
              <input
                type="text"
                autoFocus
                placeholder={t("dashboard.widgets.searchTimezone", "Search timezone...")}
                className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-transparent focus:border-kat-primary/30 rounded-xl pl-10 pr-4 py-3 text-[14px] text-slate-800 dark:text-slate-200 outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto p-2 flex-1 pb-safe">
            {filteredTimezones.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-[14px]">
                {t("dashboard.widgets.noTimezonesFound", "No timezones found")}
              </div>
            ) : (
              filteredTimezones.map((tzObj) => {
                const tz = tzObj.name;
                return (
                  <button
                    key={tz}
                    onClick={() => addTimezone(tz)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-[14px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-medium text-kat-text dark:text-slate-200 truncate">
                        {tzObj.mainCities.length > 0 ? tzObj.mainCities.join(", ") : tzName(tz)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {tzObj.countryName} • {tz}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                      {tzOffsetString(tz)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
