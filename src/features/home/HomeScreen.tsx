import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { springInteraction } from "../../lib/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Briefcase01Icon,
  ReceiptTextIcon,
  Calendar01Icon,
  Location01Icon,
  Clock01Icon,
  ChevronRightIcon,
  BookOpen01Icon,
  Add01Icon,
  AlertCircleIcon,
  Award01Icon,
  FileDownloadIcon,
  GitBranchIcon,
  CircleIcon,
  CheckmarkCircle02Icon,
  Link02Icon,
  CloudRainWindIcon,
  ChevronDownIcon,
} from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { ChecklistItem, EventItem, Expense, Member, Trip, db, TravelDocument } from "../../db";
import {
  formatDate,
  formatMoney,
  getChecklistStats,
  getTripTiming,
  today,
} from "../../utils/helpers";
import { getTripReminders } from "../../utils/reminderRules";

import { useWeather } from "../../hooks/useWeather";
import { useCurrentLocationWeather } from "../../hooks/useCurrentLocationWeather";
import { usePackingTip } from "../../hooks/usePackingTip";
import { useModalHistory } from "../../hooks/useModalHistory";
import { getWeatherIcon, getWeatherGradient, getWeatherText } from "../../utils/weatherUI";
import { usePreferences } from "../../hooks/usePreferences";
import { WeatherDetailsModal } from "../timeline/WeatherDetailsModal";
import { getAvatarSvg } from "../../utils/avatars";

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springInteraction}
      className="flex flex-col items-center justify-center gap-2.5 rounded-[20px] bg-white dark:bg-slate-800 p-5 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 transition-[box-shadow,border-color] duration-200 ease-out hover:border-[#00BFB7]/30 hover:shadow-[0_8px_20px_rgba(0,191,183,0.06)] w-full group"
      onClick={onClick}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary-soft text-kat-primary transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{label}</span>
    </motion.button>
  );
}

export function HomeScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  travelDocuments = [],
  totalExpense,
  perPerson,
  onNavigateTab,
  onNavigateMore,
  onOpenInbox,
  isReadOnly = false,
  selectedDestIndex,
  onSelectDestIndex,
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  travelDocuments?: TravelDocument[];
  totalExpense: number;
  perPerson: number;
  onNavigateTab: (tab: "timeline" | "expenses" | "checklist") => void;
  onNavigateMore: (
    section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents"
  ) => void;
  onOpenInbox?: () => void;
  isReadOnly?: boolean;
  selectedDestIndex?: number;
  onSelectDestIndex?: (index: number) => void;
}) {
  const { t } = useTranslation();
  const journals =
    useLiveQuery(
      async () =>
        (await db.journals.where("tripId").equals(trip.id!).toArray()).filter((j) => !j.isDeleted),
      [trip.id]
    ) ?? [];
  const packingItems =
    useLiveQuery(
      async () =>
        (await db.packingItems.where("tripId").equals(trip.id!).toArray()).filter(
          (p) => !p.isDeleted
        ),
      [trip.id]
    ) ?? [];
  const backupPlans =
    useLiveQuery(
      async () =>
        (await db.backupPlans.where("tripId").equals(trip.id!).toArray()).filter(
          (b) => !b.isDeleted
        ),
      [trip.id]
    ) ?? [];

  const activeDestIndex = selectedDestIndex ?? 0;
  const activeDest = trip.destinations?.[activeDestIndex] || {
    name: trip.location,
    latitude: trip.latitude,
    longitude: trip.longitude,
    countryCode: trip.countryCode,
  };

  // Weather data
  const {
    forecast,
    loading: weatherLoading,
    error: weatherError,
  } = useWeather(activeDest.name, activeDest.latitude, activeDest.longitude, 1);
  const { forecast: myForecast, locationName: myLocationName } = useCurrentLocationWeather();
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const { formatTemp, temperatureUnit: unit } = usePreferences();
  useModalHistory(weatherModalOpen, () => setWeatherModalOpen(false), "weather-modal");

  // Packing tip based on GPS vs destination temp
  const packingTip = usePackingTip(forecast, myForecast);

  if (!trip) return null;
  const timing = getTripTiming(trip);
  const checklistStats = getChecklistStats(checklist);
  const nextEvent =
    events.find((item) => !item.completed && item.date >= today) ??
    events.find((item) => !item.completed) ??
    events[0];

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  let durationText = t("home.inDay", "Trong ngày");
  if (!isDayTrip) {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      durationText = t("home.duration", { days: diffDays, nights: diffNights });
    } catch {
      durationText = t("home.longTrip");
    }
  }

  const tripData = {
    trip,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
  };
  const status = timing.status;

  // Reusable helper to render visual Avatar Group + concise description for companions
  const renderCompanions = () => {
    if (members.length === 0) {
      return (
        <span className="font-semibold text-slate-400 dark:text-white/50">
          {t("home.noMembers")}
        </span>
      );
    }

    // First member's first name
    const firstMemberName = members[0].name.trim().split(" ").pop() || members[0].name;
    let text = "";
    if (members.length === 1) {
      text = firstMemberName;
    } else {
      text = t("home.andOthers", { name: firstMemberName, count: members.length - 1 });
    }

    // Get first 3 members for avatars
    const displayMembers = members.slice(0, 3);
    const remainingCount = members.length - displayMembers.length;

    const bgColors = [
      "bg-blue-100 text-blue-600",
      "bg-emerald-100 text-emerald-600",
      "bg-purple-100 text-purple-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
    ];

    return (
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 overflow-hidden">
          {displayMembers.map((member, i) => {
            const initials = member.name.charAt(0).toUpperCase();
            const colorClass = bgColors[i % bgColors.length];
            return (
              <div
                key={member.id || i}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B] overflow-hidden bg-slate-50 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                title={member.name}
              >
                {member.avatar ? (
                  getAvatarSvg(member.avatar, "w-full h-full")
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center text-[12px] font-bold ${colorClass}`}
                  >
                    {initials}
                  </div>
                )}
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B] bg-slate-100 dark:bg-white/10 text-[11px] font-extrabold text-slate-600 dark:text-white/90 backdrop-blur-md">
              +{remainingCount}
            </div>
          )}
        </div>
        <span className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-300">
          {text}
        </span>
      </div>
    );
  };

  // 1. Hero rendering helper
  const renderHero = () => {
    let badge = t("home.upcoming");
    let statusLabel = t("home.countdown");
    let statusValue = timing.label;
    let isPast = false;

    if (status === "active") {
      badge = t("home.ongoing");
    } else if (status === "past") {
      badge = t("home.ended");
    }

    const currentCode = forecast?.current?.weathercode;

    const fallbackGradient =
      status === "past"
        ? "linear-gradient(135deg, #2D1B4E 0%, #4A2C6E 50%, #6B3A8A 100%)" // Ended: deep purple
        : status === "active"
          ? "linear-gradient(135deg, #0F4C81 0%, #1565C0 55%, #1976D2 100%)" // Active: strong blue
          : "linear-gradient(135deg, #1A3A5C 0%, #1E4976 55%, #2460A7 100%)"; // Upcoming: deep navy

    const bgGradient =
      forecast && currentCode != null ? getWeatherGradient(currentCode) : fallbackGradient;

    return (
      <div
        className="mb-6 relative z-10 rounded-[32px] p-6 text-white shadow-[0_8px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.06)_inset] group hover:shadow-[0_16px_56px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:scale-[1.002] transition-all duration-500 ease-out motion-weather-bg"
        style={{ background: bgGradient }}
      >
        <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
          {/* Subtle World Map Watermark */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

          {/* Dynamic Weather Backdrops */}
          {forecast && currentCode != null && (
            <>
              {(currentCode === 0 || currentCode === 1) && <div className="weather-sunny-glow" />}
              {(currentCode === 2 ||
                currentCode === 3 ||
                currentCode === 45 ||
                currentCode === 48) && <div className="weather-cloudy-drift" />}
              {/* If it's rain/drizzle/snow */}
              {((currentCode >= 51 && currentCode <= 67) ||
                (currentCode >= 80 && currentCode <= 82) ||
                currentCode >= 95) && (
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <div className="absolute inset-0 bg-[linear-gradient(170deg,transparent_40%,rgba(255,255,255,0.15)_45%,rgba(255,255,255,0.15)_50%,transparent_55%)] bg-[size:40px_120px] animate-weather-sway" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-5">
          <div className="space-y-3 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.12] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-xl border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
              ●{" "}
              {status === "past"
                ? t("home.ended")
                : status === "active"
                  ? t("home.ongoing")
                  : t("home.upcoming")}
            </span>
            <h2 className="text-[24px] sm:text-[26px] font-black leading-tight tracking-tight drop-shadow-sm">
              {trip.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative inline-flex z-50">
                <button
                  type="button"
                  onClick={() => {
                    if (trip.destinations && trip.destinations.length > 1) {
                      setIsDestDropdownOpen(!isDestDropdownOpen);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border text-white/90 transition-all ${
                    trip.destinations && trip.destinations.length > 1 && isDestDropdownOpen
                      ? "bg-white/20 border-white/30 shadow-inner"
                      : "bg-white/10 border-white/10 hover:bg-white/15"
                  } ${trip.destinations && trip.destinations.length > 1 ? "cursor-pointer" : ""}`}
                >
                  <HugeiconsIcon icon={Location01Icon} size={13} className="text-white/70" />
                  {trip.destinations && trip.destinations.length > 1
                    ? t("trip.locationAndOthers", {
                        location: activeDest.name || trip.location,
                        count: trip.destinations.length - 1,
                        defaultValue: "{{location}} & {{count}} điểm khác",
                      })
                    : trip.location || t("home.planning")}

                  {trip.destinations &&
                    trip.destinations.length > 1 &&
                    onSelectDestIndex &&
                    selectedDestIndex !== undefined && (
                      <HugeiconsIcon
                        icon={ChevronDownIcon}
                        size={12}
                        className={`text-white/50 ml-0.5 transition-transform duration-200 ${isDestDropdownOpen ? "rotate-180" : ""}`}
                      />
                    )}
                </button>

                {isDestDropdownOpen &&
                  trip.destinations &&
                  trip.destinations.length > 1 &&
                  onSelectDestIndex &&
                  selectedDestIndex !== undefined && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDestDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 min-w-[240px] max-w-[85vw] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                        {trip.destinations.map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onSelectDestIndex(idx);
                              setIsDestDropdownOpen(false);
                            }}
                            className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between group ${
                              idx === selectedDestIndex
                                ? "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <span className="truncate max-w-[200px]">
                              {d.name || t("common.unknownLocation")}
                            </span>
                            {idx === selectedDestIndex && (
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={16}
                                className="text-sky-600 dark:text-sky-400 shrink-0 ml-2"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium border border-white/10 text-white/90">
                <HugeiconsIcon icon={Calendar01Icon} size={13} className="text-white/70" />
                {isDayTrip
                  ? formatDate(trip.startDate)
                  : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium border border-white/10 text-white/90">
                <HugeiconsIcon icon={Clock01Icon} size={13} className="text-white/70" />
                {durationText}
              </span>
              {trip.mediaLink && (
                <a
                  href={trip.mediaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[12px] font-bold backdrop-blur-md border border-sky-400/30 shadow-inner text-sky-100 hover:bg-sky-500/30 transition-colors"
                >
                  <HugeiconsIcon icon={Link02Icon} className="h-3 w-3" />
                  {t("home.originalPhotos", "Kho Ảnh Gốc")}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 w-full lg:w-[250px]">
            {/* Timing box with Progress Bar */}
            <div className="flex flex-col items-stretch justify-center rounded-2xl bg-white/[0.07] backdrop-blur-xl px-4 py-3 border border-white/[0.12] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_4px_24px_rgba(0,0,0,0.08)] flex-1 lg:flex-none lg:w-full text-center shrink-0 min-h-[64px]">
              <p className="text-[10px] font-semibold text-white/60 text-center">
                {status === "past" ? t("home.status") : t("home.journey")}
              </p>
              <p className="mt-1 text-[17px] sm:text-[19px] font-black text-white drop-shadow-sm tracking-tight leading-tight pb-[2px] text-center">
                {timing.label}
              </p>
              {status === "active" &&
                (() => {
                  let progressPercent = 0;
                  try {
                    const start = new Date(trip.startDate).getTime();
                    const end = new Date(trip.endDate).getTime();
                    const now = new Date().getTime();
                    if (end > start) {
                      progressPercent = Math.min(
                        100,
                        Math.max(0, ((now - start) / (end - start)) * 100)
                      );
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  return (
                    <div className="mt-2.5 w-full space-y-1 text-left z-10">
                      <div className="flex items-center justify-between text-[8px] font-bold text-white/70">
                        <span>{t("home.depart")}</span>
                        <span>{t("home.traveling")}</span>
                        <span>{t("home.end")}</span>
                      </div>
                      <div className="relative h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.06]">
                        <div
                          className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 shadow-[0_0_8px_rgba(110,231,183,0.5),0_0_20px_rgba(110,231,183,0.15)] transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 airplane-flight transition-all duration-500"
                          style={{ left: `calc(${progressPercent}% - 6px)` }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-2.5 h-2.5 fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] -rotate-45"
                          >
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[8.5px] text-right text-white/50 font-semibold leading-none">
                        {t("home.completedPercent", { percent: Math.round(progressPercent) })}
                      </p>
                    </div>
                  );
                })()}
              {status === "upcoming" &&
                (() => {
                  let diffDays = 0;
                  try {
                    const start = new Date(trip.startDate).getTime();
                    const now = new Date().getTime();
                    diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
                  } catch {}
                  const maxCountdown = 30; // Scale relative to 30 days
                  const progressPercent = Math.max(
                    10,
                    Math.min(100, (1 - diffDays / maxCountdown) * 100)
                  );
                  return (
                    <div className="mt-2 w-full space-y-1 text-left z-10">
                      <div className="relative h-1 w-full rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400/80 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Weather Widget */}
            {weatherLoading ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-3xl p-3 border border-white/20 animate-pulse flex-1 lg:flex-none lg:w-full">
                <div className="w-9 h-9 bg-white/20 rounded-xl shrink-0"></div>
                <div className="flex flex-col gap-2">
                  <div className="w-14 h-3 bg-white/20 rounded-full"></div>
                  <div className="w-10 h-3 bg-white/20 rounded-full"></div>
                </div>
              </div>
            ) : !trip.location?.trim() && !trip.latitude ? (
              <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md rounded-3xl p-3 border border-white/10 flex-1 lg:flex-none lg:w-full">
                <HugeiconsIcon icon={Location01Icon} className="w-5 h-5 text-white/40 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-white/80 font-bold text-[11px]">
                    {t("home.noDestination")}
                  </span>
                  <span className="text-white/50 text-[10px]">
                    {t("home.addDestinationWeather")}
                  </span>
                </div>
              </div>
            ) : !trip.latitude || !trip.longitude ? null : weatherError || !forecast ? (
              <div className="flex items-center gap-2.5 bg-red-500/20 backdrop-blur-md rounded-3xl p-3 border border-red-500/30 flex-1 lg:flex-none lg:w-full">
                <HugeiconsIcon
                  icon={CloudRainWindIcon}
                  className="w-5 h-5 text-white/60 shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-white font-bold text-[11px]">{t("home.weatherError")}</span>
                  <span className="text-white/70 text-[10px]">{t("home.connectionError")}</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setWeatherModalOpen(true)}
                className="flex flex-col items-stretch justify-center bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl p-3 gap-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_4px_24px_rgba(0,0,0,0.08)] hover:bg-white/[0.12] hover:scale-[1.015] active:scale-[0.985] transition-all duration-300 flex-1 lg:flex-none lg:w-full text-left cursor-pointer select-none"
              >
                {/* Weather Info Block */}
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 shrink">
                    <span className="text-3xl min-[360px]:text-4xl font-black text-white drop-shadow-sm tracking-tighter shrink-0">
                      {formatTemp(forecast.current?.temperature || 20)}°
                    </span>
                    <div className="flex flex-col ml-1 min-w-0 shrink">
                      <span className="mb-[-4px] flex items-center justify-center h-8 shrink-0">
                        {getWeatherIcon(
                          forecast.current?.weathercode || 0,
                          "w-7 h-7 drop-shadow-md"
                        )}
                      </span>
                      <span className="text-[10px] min-[360px]:text-[11px] font-extrabold text-white/95 uppercase tracking-normal mt-1 drop-shadow-sm truncate text-center">
                        {getWeatherText(forecast.current?.weathercode || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-white/30 mx-0.5 shrink-0" />
                  <div className="flex flex-col text-right whitespace-nowrap shrink-0">
                    <span className="text-[11px] min-[360px]:text-[11.5px] font-extrabold text-white/95">
                      {t("weather.high")}: {formatTemp(forecast.temperature_2m_max[0])}°
                    </span>
                    <span className="text-[11px] min-[360px]:text-[11.5px] font-bold text-white/70">
                      {t("weather.low")}: {formatTemp(forecast.temperature_2m_min[0])}°
                    </span>
                  </div>
                </div>

                {/* Divider - only visible when packingTip exists */}
                {packingTip && <div className="h-px bg-white/15 w-full my-0.5" />}

                {/* Packing Tip Block */}
                {packingTip && (
                  <div className="w-full flex items-center">
                    <p className="text-[12px] font-extrabold text-white/95 leading-normal whitespace-normal break-words">
                      {packingTip.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 3. Layout for completed trips
  const renderPastLayout = () => {
    return (
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">
        {/* Left Column: Nhìn lại chuyến đi */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-kat-dark px-1 motion-title-enter">
            {t("home.lookBackTrip")}
          </h3>

          <div className="space-y-3">
            {/* Tổng kết card — hero card, full width, accent bg */}
            <div className="rounded-3xl bg-amber-500 p-5 motion-card-enter motion-delay-1 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 opacity-10">
                <HugeiconsIcon icon={Award01Icon} className="h-28 w-28 -mr-4 -mb-4" />
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-amber-100/80 uppercase tracking-wider mb-1">
                  {t("home.memories")}
                </p>
                <h4 className="text-[17px] font-black text-white leading-snug">
                  {t("home.tripSummary")}
                </h4>
                <p className="text-[12.5px] font-medium text-amber-100/90 mt-1.5 leading-relaxed">
                  {t("home.summaryDesc", "Xem lại chi phí, hoạt động và những dấu ấn đáng nhớ.")}
                </p>
                <button
                  onClick={() => onNavigateMore("wrapped")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2 text-[13px] font-extrabold text-white transition-all motion-press"
                >
                  {t("home.viewSummary", "Xem tổng kết")} →
                </button>
              </div>
            </div>

            {/* Bản tin card — compact horizontal */}
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-4 motion-card-enter motion-delay-2 flex items-center gap-4 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                <HugeiconsIcon icon={BookOpen01Icon} className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-extrabold text-kat-dark">
                  {t("home.tripJournal")}
                </h4>
                <p className="text-[12.5px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                  {journals.length > 0
                    ? t("home.journalCount", { count: journals.length })
                    : t("home.noArticles")}
                </p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => onNavigateMore("journal")}
                  className="shrink-0 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3.5 py-2 text-[12.5px] font-bold transition-all motion-press border border-violet-100 dark:border-violet-900/20"
                >
                  {t("home.post", "Đăng")}
                </button>
              )}
            </div>

            {/* Báo cáo card — action-focused, two buttons prominent */}
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-5 motion-card-enter motion-delay-3 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <HugeiconsIcon icon={FileDownloadIcon} className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-[14px] font-extrabold text-kat-dark">
                  {t("home.exportReport")}
                </h4>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={async () => {
                    const { exportTripPdf } = await import("../../utils/exportPdf");
                    exportTripPdf(tripData);
                  }}
                  className="flex-1 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 dark:active:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold text-[13px] border border-slate-200/60 dark:border-slate-700/40 transition-all motion-press"
                >
                  PDF
                </button>
                <button
                  onClick={async () => {
                    const { exportTripExcel } = await import("../../utils/exportExcel");
                    exportTripExcel(tripData).catch(console.error);
                  }}
                  className="flex-1 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 dark:active:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold text-[13px] border border-slate-200/60 dark:border-slate-700/40 transition-all motion-press"
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Tổng quan hành trình */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-kat-dark px-1 motion-title-enter">
            {t("home.tripOverview")}
          </h3>

          <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-200/60 dark:border-white/10 motion-card-enter motion-delay-2">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
                  <HugeiconsIcon icon={UserGroupIcon} size={20} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">{t("home.members")}</p>
                  <div className="mt-1.5">{renderCompanions()}</div>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/20">
                  <HugeiconsIcon icon={Calendar01Icon} size={20} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">
                    {t("home.recordedSchedule")}
                  </p>
                  {events.length > 0 ? (
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-dark">
                      {t("home.recordedEvents", { count: events.length })}
                    </p>
                  ) : (
                    <div>
                      <p className="mt-0.5 text-[14px] font-semibold text-slate-400 dark:text-slate-500">
                        {t("home.noScheduleRecorded")}
                      </p>
                      {!isReadOnly && (
                        <button
                          onClick={() => onNavigateTab("timeline")}
                          className="mt-1.5 text-[12.5px] font-bold text-kat-primary hover:text-kat-primary-usable transition-all motion-press text-left"
                        >
                          {t("home.addSchedule", "Bổ sung lịch trình")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20">
                  <HugeiconsIcon icon={Briefcase01Icon} size={20} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">{t("home.packing")}</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-kat-dark">
                    {checklistStats.total > 0
                      ? t("home.checklistProgress", {
                          completed: checklistStats.completed,
                          total: checklistStats.total,
                        })
                      : t("home.noChecklistItems")}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20">
                  <HugeiconsIcon icon={ReceiptTextIcon} size={20} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] font-semibold text-kat-muted">{t("home.totalSpent")}</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-kat-dark">
                    {totalExpense > 0 ? formatMoney(totalExpense) : t("home.noCostYet")}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    );
  };

  // 4. Layout for upcoming trips
  const renderUpcomingLayout = () => {
    const reminders = getTripReminders({
      trip,
      members,
      events,
      expenses,
      checklist,
      travelDocuments,
    });

    return (
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">
        {/* Left Column: Hoạt động tiếp theo & Nhắc việc trước chuyến đi */}
        <div className="space-y-4 lg:space-y-6">
          {/* Hoạt động tiếp theo */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.nextActivity")}
            </h3>
            {nextEvent ? (
              <div
                className="flex items-center gap-4 rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-200/60 dark:border-white/10 transition-[box-shadow,transform,border-color] duration-200 hover:shadow-md cursor-pointer group motion-card-enter motion-delay-1 motion-press active:scale-[0.97]"
                onClick={() => onNavigateTab("timeline")}
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-kat-primary-soft text-kat-primary transition-colors group-hover:bg-[#00BFB7]/20">
                  <span className="text-[13px] font-extrabold uppercase leading-none">
                    {formatDate(nextEvent.date).split("/")[0]}
                  </span>
                  <span className="mt-1 text-[11px] font-bold leading-none opacity-90">
                    {t("home.month", { month: formatDate(nextEvent.date).split("/")[1] })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {nextEvent.time && (
                    <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-kat-yellow">
                      <HugeiconsIcon icon={Clock01Icon} size={14} />
                      {nextEvent.time}
                    </p>
                  )}
                  <h4 className="mt-1 truncate text-base font-extrabold text-kat-text">
                    {nextEvent.title}
                  </h4>
                  {nextEvent.location && (
                    <p className="mt-0.5 truncate text-[13.5px] text-slate-500 dark:text-slate-400">
                      {nextEvent.location}
                    </p>
                  )}
                </div>
                <HugeiconsIcon
                  icon={ChevronRightIcon}
                  size={20}
                  className="text-slate-300 dark:text-slate-500"
                />
              </div>
            ) : (
              <div className="rounded-[24px] bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-6 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col items-center text-center motion-card-enter motion-delay-1">
                <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("home.noScheduledActivity")}
                </p>
                {!isReadOnly && (
                  <button
                    onClick={() => onNavigateTab("timeline")}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 hover:bg-kat-dark/90 dark:hover:brightness-110 border border-transparent dark:border-kat-primary px-5 py-3 text-[13.5px] font-black transition-[transform,background-color] duration-150 shadow-[0_4px_14px_rgba(3,13,46,0.18)] dark:shadow-[0_4px_14px_rgba(0,191,183,0.25)] active:scale-[0.97] motion-press"
                  >
                    <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" strokeWidth={2.5} />
                    {t("home.addSchedule", "Thêm lịch trình")}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Nhắc việc trước chuyến đi */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.preTripReminders")}
            </h3>
            {reminders.length > 0 ? (
              <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] space-y-4 motion-card-enter motion-delay-2">
                <div className="grid grid-cols-1 gap-3.5">
                  {reminders.map((rem, idx) => (
                    <div
                      key={rem.id}
                      className="flex flex-col justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:border-amber-200/60 transition-all group"
                    >
                      <div>
                        <h4 className="text-[14px] font-extrabold text-slate-800 dark:text-slate-200 leading-snug flex items-start gap-2">
                          <HugeiconsIcon
                            icon={AlertCircleIcon}
                            className={`h-4.5 w-4.5 shrink-0 ${
                              rem.type === "danger" ? "text-rose-500" : "text-amber-500"
                            }`}
                          />
                          <span>{rem.title}</span>
                        </h4>
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-1 pl-6.5 leading-relaxed">
                          {rem.description}
                        </p>
                      </div>
                      {rem.actionLabel && rem.onClickSection && (
                        <button
                          onClick={() => {
                            if (
                              rem.onClickSection === "timeline" ||
                              rem.onClickSection === "expenses" ||
                              rem.onClickSection === "checklist"
                            ) {
                              onNavigateTab(rem.onClickSection);
                            } else if (rem.onClickSection) {
                              onNavigateMore(rem.onClickSection as "members" | "documents");
                            }
                          }}
                          className="mt-3 pl-6.5 self-start text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1 motion-press"
                        >
                          <span>{rem.actionLabel}</span>
                          <HugeiconsIcon
                            icon={ChevronRightIcon}
                            size={14}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-6 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col items-center text-center motion-card-enter motion-delay-2">
                <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("home.everythingReady")}
                </p>
                {!isReadOnly && (
                  <button
                    onClick={() => onNavigateTab("checklist")}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-kat-primary text-kat-dark dark:text-slate-900 hover:brightness-105 px-4 py-2.5 text-[13px] font-black transition-[transform,filter] duration-150 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] active:scale-[0.97] motion-press"
                  >
                    <HugeiconsIcon icon={Briefcase01Icon} size={16} />
                    {t("home.packLuggage", "Chuẩn bị hành lý")}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Tổng quan hành trình & Giấy tờ & đặt chỗ */}
        <div className="space-y-6">
          {/* Tổng quan hành trình */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.tripOverview")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-200/60 dark:border-white/10 motion-card-enter motion-delay-3">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
                    <HugeiconsIcon icon={UserGroupIcon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">{t("home.members")}</p>
                    <div className="mt-1.5">{renderCompanions()}</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20">
                    <HugeiconsIcon icon={Briefcase01Icon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">{t("home.packing")}</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {checklistStats.total > 0
                        ? t("home.checklistProgress", {
                            completed: checklistStats.completed,
                            total: checklistStats.total,
                          })
                        : t("home.noChecklistItems")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/20">
                    <HugeiconsIcon icon={Calendar01Icon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">
                      {t("home.nextSchedule")}
                    </p>
                    <p className="mt-0.5 truncate text-[15px] font-extrabold text-kat-text">
                      {nextEvent ? nextEvent.title : t("home.noActivity")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20">
                    <HugeiconsIcon icon={ReceiptTextIcon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">
                      {t("home.estimatedCost")}
                    </p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {totalExpense > 0 ? formatMoney(totalExpense) : t("home.noCostYet")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Giấy tờ & đặt chỗ */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.docsAndBookings")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-card-enter motion-delay-4">
              {travelDocuments.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                    {t("home.savedDocs", { count: travelDocuments.length })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(travelDocuments.map((d) => d.type || "other"))).map(
                      (type) => {
                        const label =
                          type === "ticket"
                            ? t("home.ticket")
                            : type === "hotel"
                              ? t("home.hotel")
                              : type === "booking"
                                ? t("home.bookingCode")
                                : type === "contact"
                                  ? t("home.contact")
                                  : type === "map"
                                    ? t("home.map")
                                    : t("home.other");
                        const count = travelDocuments.filter((d) => d.type === type).length;
                        return (
                          <span
                            key={type}
                            className="inline-flex items-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 px-2.5 py-1 text-[11.5px] font-bold text-slate-650 dark:text-slate-300"
                          >
                            {label} ({count})
                          </span>
                        );
                      }
                    )}
                  </div>
                  <button
                    onClick={() => onNavigateMore("documents")}
                    className="mt-2.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1.5 motion-press"
                  >
                    <span>{t("home.viewAllDocs")}</span>
                    <HugeiconsIcon icon={ChevronRightIcon} size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">
                    {t("home.noSavedDocs")}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => onNavigateMore("documents")}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/20 dark:border-slate-700/55 px-4 py-2.5 text-[13px] font-extrabold text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-press"
                    >
                      <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                      {t("home.addDoc", "Thêm giấy tờ")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  // 5. Layout for active trips
  const renderActiveLayout = () => {
    const todayEvents = events.filter((e) => e.date === today);
    const incompleteChecklist = checklist.filter((c) => !c.completed);
    const displayChecklist = [...checklist]
      .sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1; // incomplete first
      })
      .slice(0, 5);
    const idDocs = travelDocuments.filter(
      (d) =>
        d.type === "ticket" ||
        d.type === "booking" ||
        d.title.toLowerCase().includes("vé") ||
        d.title.toLowerCase().includes("đặt chỗ") ||
        d.title.toLowerCase().includes("hotel")
    );

    const todayBackupPlans = backupPlans.filter(
      (p) => p.date === today || (p.activityId && todayEvents.some((e) => e.id === p.activityId))
    );

    return (
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">
        {/* Left Column: Hôm nay focus & Giấy tờ quan trọng */}
        <div className="space-y-4 lg:space-y-6">
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.todaySchedule")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] space-y-4 motion-card-enter motion-delay-1">
              {/* Phương án dự phòng hôm nay */}
              {todayBackupPlans.length > 0 && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <HugeiconsIcon icon={GitBranchIcon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14.5px] font-extrabold text-kat-dark">
                      {t("home.todayBackupPlans")}
                    </h4>
                    <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("home.backupPlansCount", { count: todayBackupPlans.length })}
                    </p>
                    <button
                      onClick={() => onNavigateTab("timeline")}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/55 text-[12.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors motion-press"
                    >
                      {t("home.viewBackup", "Xem phương án")}
                      <HugeiconsIcon icon={ChevronRightIcon} size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Hoạt động hôm nay */}
              {todayEvents.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-100/80 dark:border-kat-border/40 bg-white/40 dark:bg-white/5 backdrop-blur-md text-center">
                  <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                    {t("home.noTodaySchedule")}
                  </p>
                  <button
                    onClick={() => onNavigateTab("timeline")}
                    className="mt-2.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors inline-flex items-center gap-1 motion-press"
                  >
                    <span>{t("home.viewFullSchedule")}</span>
                    <HugeiconsIcon icon={ChevronRightIcon} size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
                  {todayEvents
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                    .map((item, idx) => (
                      <button
                        key={item.id}
                        disabled={isReadOnly}
                        onClick={() =>
                          item.id &&
                          !isReadOnly &&
                          db.events.update(item.id, { completed: !item.completed })
                        }
                        className={`w-full min-h-[46px] flex items-center justify-between p-3 px-4 rounded-2xl border transition-all text-left group motion-press ${
                          item.completed
                            ? "bg-white/20 dark:bg-white/5 backdrop-blur-sm border-slate-100/60 dark:border-slate-700/40 text-slate-400/80 dark:text-slate-500"
                            : "bg-white/40 dark:bg-white/5 backdrop-blur-md border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50/60 dark:hover:bg-white/10 hover:border-[#00BFB7]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0">
                            {item.completed ? (
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50"
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={CircleIcon}
                                className="h-5.5 w-5.5 text-slate-300 group-hover:text-slate-400 transition-colors"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[13.5px] font-bold ${item.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}
                            >
                              {item.title}
                            </p>
                            {item.time && (
                              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                {item.time}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Giấy tờ cần kiểm tra */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.docsToCheck")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-card-enter motion-delay-2">
              {idDocs.length > 0 ? (
                <div className="space-y-3.5">
                  <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                    {t("home.quickLookup", "Tra cứu nhanh các thông tin vé hoặc đặt chỗ dưới đây:")}
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {idDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <h5 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200 truncate">
                            {doc.title}
                          </h5>
                          {doc.code && (
                            <p className="text-[11.5px] font-bold text-slate-400 mt-0.5">
                              {t("home.code", "Mã:")} {doc.code}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onNavigateMore("documents")}
                          className="shrink-0 text-[12.5px] font-extrabold text-kat-primary hover:text-kat-primary-usable transition-all motion-press"
                        >
                          {t("home.details", "Chi tiết")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13.5px] font-semibold text-slate-400 dark:text-slate-500">
                    {t("home.noDocsToCheck")}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => onNavigateMore("documents")}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/20 dark:border-slate-700/55 px-4 py-2.5 text-[13px] font-extrabold text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-press"
                    >
                      <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                      {t("documents.addBtn", "Add Document")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Tổng quan hành trình, Chuẩn bị còn thiếu & Lịch trình đã ghi */}
        <div className="space-y-6">
          {/* Tổng quan hành trình */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.tripOverview")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-slate-200/60 dark:border-white/10 motion-card-enter motion-delay-3">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
                    <HugeiconsIcon icon={UserGroupIcon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">{t("home.members")}</p>
                    <div className="mt-1.5">{renderCompanions()}</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20">
                    <HugeiconsIcon icon={Briefcase01Icon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">{t("home.packing")}</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {checklistStats.total > 0
                        ? t("home.checklistProgress", {
                            completed: checklistStats.completed,
                            total: checklistStats.total,
                          })
                        : t("home.noChecklistItems")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/20">
                    <HugeiconsIcon icon={Calendar01Icon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">
                      {t("home.nextActivity")}
                    </p>
                    <p className="mt-0.5 truncate text-[15px] font-extrabold text-kat-text">
                      {nextEvent ? nextEvent.title : t("home.noActivity")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20">
                    <HugeiconsIcon icon={ReceiptTextIcon} size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] font-semibold text-kat-muted">
                      {t("home.totalSpent")}
                    </p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-kat-text">
                      {totalExpense > 0 ? formatMoney(totalExpense) : t("home.noCostYet")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Chuẩn bị còn thiếu */}
          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.missingPacking")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-card-enter motion-delay-4">
              {checklist.length === 0 ? (
                <div className="p-4 rounded-2xl border border-slate-100/80 dark:border-kat-border/40 bg-white/40 dark:bg-white/5 backdrop-blur-md text-center">
                  <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                    {t("home.noChecklistItems")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
                  {displayChecklist.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.id && db.checklist.update(item.id, { completed: !item.completed })
                      }
                      className={`w-full min-h-[46px] flex items-center justify-between p-3 px-4 rounded-2xl border transition-all text-left group motion-press ${
                        item.completed
                          ? "bg-white/20 dark:bg-white/5 backdrop-blur-sm border-slate-100/60 dark:border-slate-700/40 text-slate-400/80 dark:text-slate-500"
                          : "bg-white/40 dark:bg-white/5 backdrop-blur-md border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50/60 dark:hover:bg-white/10 hover:border-[#00BFB7]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          {item.completed ? (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={CircleIcon}
                              className="h-5.5 w-5.5 text-slate-300 group-hover:text-slate-400 transition-colors"
                            />
                          )}
                        </div>
                        <span
                          className={`text-[13.5px] font-bold truncate ${item.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}
                        >
                          {item.title}
                        </span>
                      </div>
                    </button>
                  ))}
                  {incompleteChecklist.length > 5 && (
                    <button
                      onClick={() => onNavigateTab("checklist")}
                      className="w-full text-center py-2 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center justify-center gap-1"
                    >
                      <span>
                        {t("home.viewMoreMissing", { count: incompleteChecklist.length - 5 })}
                      </span>
                      <HugeiconsIcon icon={ChevronRightIcon} size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[17px] font-extrabold text-kat-text px-1 motion-title-enter">
              {t("home.recordedSchedule")}
            </h3>
            <div className="rounded-3xl bg-white/60 dark:bg-[#0A0F1C]/40 backdrop-blur-xl p-5 border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(3,13,46,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] motion-card-enter motion-delay-5">
              <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                {events.length > 0
                  ? t("home.activeEvents", { count: events.length })
                  : t("home.noEventsRecorded")}
              </p>
              <button
                onClick={() => onNavigateTab("timeline")}
                className="mt-3.5 text-[12.5px] font-black text-kat-primary hover:text-kat-primary-usable transition-colors flex items-center gap-1.5 motion-press"
              >
                <span>{t("home.viewDetailedSchedule")}</span>
                <HugeiconsIcon icon={ChevronRightIcon} size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 animate-fadeIn mx-auto w-full max-w-[1280px]">
        {renderHero()}

        {status === "past" && renderPastLayout()}
        {status === "active" && renderActiveLayout()}
        {status !== "past" && status !== "active" && renderUpcomingLayout()}
      </div>

      <WeatherDetailsModal
        isOpen={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        destination={trip.location || t("home.location")}
        forecast={forecast}
        currentLocationForecast={myForecast}
        currentLocationName={myLocationName}
        destinations={trip.destinations}
        selectedDestIndex={activeDestIndex}
        onSelectDestIndex={onSelectDestIndex}
      />
    </>
  );
}
