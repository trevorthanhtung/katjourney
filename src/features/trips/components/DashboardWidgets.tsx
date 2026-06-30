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

  const cardBaseClass =
    "flex flex-col relative overflow-hidden bg-white/70 dark:bg-[#0A0F1C]/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_48px_rgba(3,13,46,0.08)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] hover:border-slate-300 dark:hover:border-white/20 hover:bg-white/90 dark:hover:bg-[#0A0F1C]/90 transition-all duration-500 min-h-[170px] group";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* ATLAS CARD */}
      <div
        onClick={onAtlasClick}
        className={`${cardBaseClass} ${onAtlasClick ? "cursor-pointer motion-press" : ""}`}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 flex items-center justify-center text-rose-500 border border-rose-200/50 dark:border-rose-500/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <HugeiconsIcon icon={EarthIcon} size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300">
                {visitedAlpha2s.length}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 195</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
              Atlas: {t("dashboard.stats.countries", "Quốc gia")}
            </span>
          </div>

          <div className="mt-4 flex -space-x-1.5 overflow-hidden h-6 items-center">
            {visitedAlpha2s.length === 0 && (
              <span className="text-[11px] font-semibold text-slate-400 italic">
                {t("dashboard.stats.none", "Chưa có")}
              </span>
            )}
            {visitedAlpha2s.slice(0, 5).map((alpha2, idx) => (
              <img
                key={alpha2}
                src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`}
                alt={alpha2}
                className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-[#0A0F1C] shrink-0 shadow-sm relative"
                style={{ zIndex: 5 - idx }}
                title={alpha2}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TOTAL TRIPS CARD */}
      <div className={cardBaseClass}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/5 flex items-center justify-center text-indigo-500 border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <HugeiconsIcon icon={Route01Icon} size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300">
                {totalTrips}
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
              {t("dashboard.stats.totalTrips", "Tổng chuyến đi")}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t("dashboard.stats.scheduled", "Đã lên lịch")}
            </span>
          </div>
        </div>
      </div>

      {/* DAYS TRAVELED CARD */}
      <div className={cardBaseClass}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/5 flex items-center justify-center text-orange-500 border border-orange-200/50 dark:border-orange-500/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <HugeiconsIcon icon={Calendar01Icon} size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300">
                {totalDays}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {t("dashboard.stats.daysLabel", "ngày")}
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
              {t("dashboard.stats.daysTraveled", "Ngày vi vu")}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t("dashboard.stats.onAllJourneys", "Trên mọi hành trình")}
            </span>
          </div>
        </div>
      </div>

      {/* DESTINATIONS CARD */}
      <div className={cardBaseClass}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5 flex items-center justify-center text-emerald-500 border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <HugeiconsIcon icon={MapsLocation01Icon} size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">
                {trips.reduce((acc, t) => acc + (t.destinations?.length || 1), 0)}
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
              {t("dashboard.stats.destinations", "Điểm đến")}
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t("dashboard.stats.explored", "Đã khám phá")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimezonesWidget() {
  const { t, i18n } = useTranslation();
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

  const getRelativeOffset = (tz: string) => {
    try {
      const date = new Date();
      const tzString = date.toLocaleString("en-US", { timeZone: tz });
      const localString = date.toLocaleString("en-US");
      const tzDate = new Date(tzString);
      const localDate = new Date(localString);
      const diffHrs = Math.round((tzDate.getTime() - localDate.getTime()) / 3600000);
      if (diffHrs === 0) return "Local time";
      const sign = diffHrs > 0 ? "+" : "";
      return `${sign}${diffHrs}h`;
    } catch (e) {
      return "";
    }
  };

  const getRelativeOffsetLabel = (tz: string) => {
    const offset = getRelativeOffset(tz);
    if (offset === "Local time") {
      return t("dashboard.widgets.localTime", "Local time");
    }
    return offset ? `${offset}` : "";
  };

  const getRelativeTimeLabel = (tz: string) => {
    try {
      const date = new Date();
      const tzString = date.toLocaleString("en-US", { timeZone: tz });
      const localString = date.toLocaleString("en-US");
      const tzDate = new Date(tzString);
      const localDate = new Date(localString);

      const diffHrs = Math.round((tzDate.getTime() - localDate.getTime()) / 3600000);
      if (diffHrs === 0) {
        return t("dashboard.widgets.sameTimezone", "Cùng múi giờ");
      }

      const tzDay = new Date(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate());
      const localDay = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
      const diffDays = Math.round((tzDay.getTime() - localDay.getTime()) / (1000 * 60 * 60 * 24));

      let dayLabel = "";
      if (diffDays === -1) {
        dayLabel = t("dashboard.widgets.yesterday", "Hôm qua");
      } else if (diffDays === 1) {
        dayLabel = t("dashboard.widgets.tomorrow", "Ngày mai");
      } else if (diffDays === 0) {
        dayLabel = t("dashboard.widgets.today", "Hôm nay");
      }

      const hrsValue = Math.abs(diffHrs);
      const aheadStr = t("dashboard.widgets.ahead", "nhanh hơn");
      const behindStr = t("dashboard.widgets.behind", "chậm hơn");
      const isEnglish = i18n.language?.startsWith("en");

      const timeLabel =
        diffHrs > 0
          ? isEnglish
            ? `${hrsValue}h ${aheadStr}`
            : `${aheadStr} ${hrsValue}h`
          : isEnglish
            ? `${hrsValue}h ${behindStr}`
            : `${behindStr} ${hrsValue}h`;

      return dayLabel ? `${dayLabel}, ${timeLabel}` : timeLabel;
    } catch (e) {
      return "";
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
      <div className="relative overflow-hidden w-full rounded-[28px] border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md p-6 shadow-soft transition-all duration-300">
        <div className="flex items-center justify-between mb-5.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 shadow-sm">
              <HugeiconsIcon icon={Clock01Icon} size={15} />
            </div>
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-405">
              {t("dashboard.widgets.timezones", "Timezones")}
            </span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-[#00BFB7] dark:hover:text-[#00BFB7] hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <HugeiconsIcon icon={EarthIcon} size={17} />
          </button>
        </div>

        <div className="flex flex-col">
          {timezones.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-4 font-bold">
              {t("dashboard.widgets.noTimezonesSelected", "No timezones selected")}
            </div>
          ) : (
            <>
              {/* Highlighted First Timezone */}
              <div className="flex items-center justify-between group relative p-4.5 rounded-[20px] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 dark:border-indigo-500/10 shadow-inner">
                <div className="min-w-0 flex-1">
                  <div className="text-[22px] font-black text-slate-850 dark:text-slate-100 tracking-tight leading-tight truncate">
                    {tzName(timezones[0])}
                  </div>
                  <div className="text-[12px] font-bold text-slate-450 dark:text-slate-500 mt-2.5 flex items-center flex-wrap gap-2 leading-none">
                    <span className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 tracking-wide uppercase shrink-0">
                      {getRelativeTimeLabel(timezones[0])}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-850" />
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {tzOffsetString(timezones[0])}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 pl-3">
                  <span className="text-[24px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
                    {tzTime(time, timezones[0])}
                  </span>
                  <button
                    onClick={() => removeTimezone(0)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-500/10 rounded-full shrink-0 cursor-pointer"
                    title={t("common.remove", "Remove")}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={15} />
                  </button>
                </div>
              </div>

              {timezones.length > 1 && <div className="h-3" />}

              {/* Other Timezones List */}
              <div className="space-y-2.5">
                {timezones.slice(1).map((tz, index) => {
                  const actualIndex = index + 1;
                  return (
                    <div
                      key={tz}
                      className="flex items-center justify-between group relative p-3.5 rounded-[18px] bg-white/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/[0.02] hover:border-slate-300/50 dark:hover:border-white/10 transition-all duration-300 shadow-soft"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-[14.5px] font-extrabold text-slate-700 dark:text-slate-200 truncate">
                          {tzName(tz)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center flex-wrap gap-2 leading-none">
                          <span className="font-mono">{tzOffsetString(tz)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <span className="text-slate-450 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-[6px] text-[10px]">
                            {getRelativeTimeLabel(tz)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[15.5px] font-extrabold text-slate-650 dark:text-slate-300 font-mono">
                          {tzTime(time, tz)}
                        </span>
                        <button
                          onClick={() => removeTimezone(actualIndex)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-500/10 rounded-full shrink-0 cursor-pointer"
                          title={t("common.remove", "Remove")}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
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
