import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon, ChevronDownIcon } from "@hugeicons/core-free-icons";
import { getWeatherIcon, getWeatherText, getWeatherGradient } from "../../utils/weatherUI";
import { WeatherForecast } from "../../services/weatherService";
import {
  SunIcon,
  PartlyCloudyIcon,
  CloudyIcon,
  FogIcon,
  RainIcon,
  ThunderstormIcon,
  ThermometerIcon,
  HumidityIcon,
  WindIcon,
} from "../../components/ui/WeatherIcons";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { usePreferences } from "../../hooks/usePreferences";

interface WeatherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  forecast: WeatherForecast | null;
  currentLocationForecast?: WeatherForecast | null;
  currentLocationName?: string | null;
  destinations?: { name: string; latitude?: number; longitude?: number; countryCode?: string }[];
  selectedDestIndex?: number;
  onSelectDestIndex?: (index: number) => void;
}

export function WeatherDetailsModal({
  isOpen,
  onClose,
  destination,
  forecast,
  currentLocationForecast,
  currentLocationName,
  destinations,
  selectedDestIndex,
  onSelectDestIndex,
}: WeatherDetailsModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(isOpen);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { formatTemp, formatSpeed, speedLabel } = usePreferences();

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Let standard frame run before applying transition class
      requestAnimationFrame(() => {
        setAnimate(true);
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !forecast) return null;

  try {
    const currentCode = forecast.current?.weathercode ?? forecast.weathercode?.[0] ?? 0;
    const rawCurrentTemp =
      forecast.current?.temperature ??
      ((forecast.temperature_2m_max?.[0] ?? 0) + (forecast.temperature_2m_min?.[0] ?? 0)) / 2;
    const currentTemp = formatTemp(rawCurrentTemp);
    const apparentTemp = formatTemp(forecast.current?.apparent_temperature ?? rawCurrentTemp);
    const maxTemp = formatTemp(forecast.temperature_2m_max?.[0] ?? 0);
    const minTemp = formatTemp(forecast.temperature_2m_min?.[0] ?? 0);
    const humidity = forecast.current?.humidity ?? 70;
    const windspeed = forecast.current?.windspeed ?? 12;
    const uvIndex = forecast.uv_index_max?.[0] ?? 5;

    const bgGradient = getWeatherGradient(currentCode);
    const weatherText = getWeatherText(currentCode);

    // Generate falling rain drops array
    const isRainy =
      (currentCode >= 51 && currentCode <= 67) || (currentCode >= 80 && currentCode <= 82);
    const isStormy = currentCode >= 95 && currentCode <= 99;
    const isCloudy = currentCode === 2 || currentCode === 3;
    const isFoggy = currentCode === 45 || currentCode === 48;
    const isSunny = currentCode === 0 || currentCode === 1;

    // Render weather recommendations based on code
    function getTravelRecommendation(code: number) {
      if (code === 0 || code === 1) {
        return {
          title: t("weather.outdoorIdealTitle"),
          desc: t("weather.outdoorIdealDesc"),
          icon: <SunIcon className="w-7 h-7" />,
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-400",
          badgeBg: "bg-amber-500/20 text-amber-800 dark:text-amber-400",
        };
      }
      if (code === 2 || code === 3) {
        return {
          title: t("weather.coolPleasantTitle"),
          desc: t("weather.coolPleasantDesc"),
          icon: <PartlyCloudyIcon className="w-7 h-7" />,
          bg: "bg-sky-500/10 border-sky-500/20 text-sky-900 dark:text-sky-400",
          badgeBg: "bg-sky-500/20 text-sky-800 dark:text-sky-400",
        };
      }
      if (code === 45 || code === 48) {
        return {
          title: t("weather.foggyTitle"),
          desc: t("weather.foggyDesc"),
          icon: <FogIcon className="w-7 h-7" />,
          bg: "bg-slate-500/10 border-slate-500/20 text-slate-900 dark:text-slate-300",
          badgeBg: "bg-slate-500/20 text-slate-800 dark:text-slate-400",
        };
      }
      if (isRainy) {
        return {
          title: t("weather.rainyTitle"),
          desc: t("weather.rainyDesc"),
          icon: <RainIcon className="w-7 h-7" />,
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-300",
          badgeBg: "bg-blue-500/20 text-blue-800 dark:text-blue-400",
        };
      }
      if (isStormy) {
        return {
          title: t("weather.stormTitle"),
          desc: t("weather.stormDesc"),
          icon: <ThunderstormIcon className="w-7 h-7" />,
          bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-900 dark:text-indigo-300",
          badgeBg: "bg-indigo-500/20 text-indigo-800 dark:text-indigo-400",
        };
      }
      return {
        title: t("weather.normalTitle"),
        desc: t("weather.normalDesc"),
        icon: <ThermometerIcon className="w-7 h-7" />,
        bg: "bg-teal-500/10 border-teal-500/20 text-teal-900 dark:text-teal-300",
        badgeBg: "bg-teal-500/20 text-teal-800 dark:text-teal-400",
      };
    }

    const recommendation = getTravelRecommendation(currentCode);

    // Get UV Index Rating Text
    function getUvRating(uv: number) {
      if (uv <= 2)
        return {
          text: t("weather.uvLow"),
          color:
            "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
        };
      if (uv <= 5)
        return {
          text: t("weather.uvMedium"),
          color:
            "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
        };
      if (uv <= 7)
        return {
          text: "Cao",
          color:
            "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30",
        };
      if (uv <= 10)
        return {
          text: t("weather.uvVeryHigh"),
          color:
            "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
        };
      return {
        text: t("weather.uvExtreme"),
        color:
          "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 animate-pulse",
      };
    }

    const uvRating = getUvRating(uvIndex);

    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center p-0 md:p-4">
        {/* Dynamic Keyframes Injector */}
        <style>{`
          @keyframes sun-glow {
            0% { transform: scale(1) rotate(0deg); opacity: 0.1; }
            50% { transform: scale(1.15) rotate(180deg); opacity: 0.22; }
            100% { transform: scale(1) rotate(360deg); opacity: 0.1; }
          }
          @keyframes rain-fall {
            0% { transform: translateY(-120%) translateX(0) rotate(15deg); }
            100% { transform: translateY(120%) translateX(-30px) rotate(15deg); }
          }
          @keyframes drift-cloud-sm {
            0% { transform: translateX(-120%) scale(0.8); opacity: 0.05; }
            50% { opacity: 0.15; }
            100% { transform: translateX(120%) scale(0.8); opacity: 0.05; }
          }
          @keyframes storm-flash {
            0%, 94%, 96%, 98%, 100% { opacity: 0; }
            55%, 95%, 97% { opacity: 0.18; }
          }
          @keyframes float-dust {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .custom-scrollbar {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        `}</style>

        {/* Backdrop blur overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Modal Box */}
        <div
          className={`w-full md:max-w-lg bg-slate-50 dark:bg-kat-surface md:rounded-[32px] rounded-t-[36px] shadow-[0_-10px_40px_rgba(3,13,46,0.12)] md:shadow-[0_20px_60px_rgba(3,13,46,0.18)] relative transition-all duration-300 max-h-[92vh] md:max-h-[85vh] flex flex-col z-10 border border-slate-100/50 dark:border-kat-border/40 ${
            animate ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-10 opacity-0"
          }`}
        >
          {/* Dynamic Animated Weather Background Panel */}
          <div
            className="relative h-44 shrink-0 flex flex-col justify-end p-6 text-white z-20 md:rounded-t-[32px] rounded-t-[36px]"
            style={{ background: bgGradient }}
          >
            {/* Background wrapper for animations to prevent overflow */}
            <div className="absolute inset-0 overflow-hidden md:rounded-t-[32px] rounded-t-[36px] pointer-events-none">
              {/* Sunny animations */}
              {isSunny && (
                <div
                  className="absolute -right-10 -top-10 w-44 h-44 bg-white/20 rounded-full blur-2xl pointer-events-none"
                  style={{ animation: "sun-glow 10s infinite linear" }}
                />
              )}

              {/* Cloudy/Foggy animations */}
              {(isCloudy || isFoggy) && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute w-64 h-24 bg-white/10 rounded-full blur-xl -top-6"
                    style={{ animation: "drift-cloud-sm 20s infinite linear" }}
                  />
                  <div
                    className="absolute w-48 h-20 bg-white/5 rounded-full blur-lg top-10"
                    style={{
                      animation: "drift-cloud-sm 14s infinite linear",
                      animationDelay: "3s",
                    }}
                  />
                </div>
              )}

              {/* Rainy animations */}
              {(isRainy || isStormy) && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 15 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="absolute w-[1.5px] bg-white/30 rounded-full"
                      style={{
                        height: `${20 + Math.random() * 20}px`,
                        left: `${Math.random() * 100}%`,
                        top: `-40px`,
                        opacity: 0.15 + Math.random() * 0.2,
                        animation: `rain-fall ${0.6 + Math.random() * 0.5}s infinite linear`,
                        animationDelay: `${Math.random() * 1.5}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Storm flash background */}
              {isStormy && (
                <div
                  className="absolute inset-0 bg-white pointer-events-none"
                  style={{ animation: "storm-flash 6s infinite ease-out" }}
                />
              )}

              {/* Floating light dust (aesthetic particle) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute w-1 h-1 bg-white/20 rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animation: `float-dust ${3 + Math.random() * 3}s infinite ease-in-out`,
                      animationDelay: `${idx * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Header Actions */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 h-11 w-11 bg-black/20 hover:bg-black/35 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-sm z-50 cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-5.5 h-5.5" />
            </button>

            {/* Location details */}
            <div className="relative z-10 text-left drop-shadow-md">
              {destinations &&
              destinations.length > 1 &&
              onSelectDestIndex &&
              selectedDestIndex !== undefined ? (
                <div className="relative inline-block z-50">
                  <button
                    type="button"
                    onClick={() => setIsDestDropdownOpen(!isDestDropdownOpen)}
                    className={`flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-lg md:text-xl font-bold rounded-xl pl-4 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all ${isDestDropdownOpen ? "bg-white/30 shadow-inner" : ""}`}
                  >
                    <span className="truncate max-w-[200px] md:max-w-[300px]">
                      {destinations[selectedDestIndex]?.name || t("common.unknownLocation")}
                    </span>
                    <HugeiconsIcon
                      icon={ChevronDownIcon}
                      className={`h-5 w-5 opacity-70 transition-transform duration-200 ${isDestDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDestDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDestDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 min-w-[280px] max-w-[90vw] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                        {destinations.map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              onSelectDestIndex?.(idx);
                              setIsDestDropdownOpen(false);
                            }}
                            className={`text-left px-4 py-3 rounded-xl text-base font-semibold transition-colors flex items-center justify-between group ${
                              idx === selectedDestIndex
                                ? "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <span className="truncate max-w-[220px]">
                              {d.name || t("common.unknownLocation")}
                            </span>
                            {idx === selectedDestIndex && (
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={18}
                                className="text-sky-600 dark:text-sky-400 shrink-0 ml-2"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-1">
                  {destination}
                </h3>
              )}

              <div className="flex items-end justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold tracking-tighter drop-shadow-sm">
                    {currentTemp}°
                  </span>
                  <div className="flex flex-col mb-1">
                    <span className="text-white/80">
                      {getWeatherIcon(currentCode, "w-6 h-6 text-white")}
                    </span>
                    <span className="text-[12.5px] font-bold text-white uppercase tracking-wider mt-0.5">
                      {weatherText}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[12.5px] font-bold text-white/90">
                  <span>
                    {t("weather.high")}: {maxTemp}°
                  </span>
                  <span className="mx-1.5 opacity-60">|</span>
                  <span>
                    {t("weather.low")}: {minTemp}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 custom-scrollbar md:rounded-b-[32px]"
            style={{ paddingBottom: "max(40px, calc(var(--safe-bottom) + 24px))" }}
          >
            {/* Smart Suggestion Banner */}
            <div
              className={`p-4 rounded-[22px] border flex gap-3.5 backdrop-blur-md shadow-sm ${recommendation.bg} transition-all duration-300`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${recommendation.badgeBg} border border-black/5 shadow-inner`}
              >
                {recommendation.icon}
              </div>
              <div className="flex flex-col text-left justify-center">
                <h4 className="text-[14px] font-bold leading-tight mb-1">{recommendation.title}</h4>
                <p className="text-[12.5px] font-bold opacity-90 leading-relaxed">
                  {recommendation.desc}
                </p>
              </div>
            </div>

            {/* Dual Weather Comparison Card */}
            {currentLocationForecast &&
              (() => {
                const rawMyTemp =
                  currentLocationForecast.current?.temperature ??
                  ((currentLocationForecast.temperature_2m_max?.[0] ?? 0) +
                    (currentLocationForecast.temperature_2m_min?.[0] ?? 0)) /
                    2;
                const myTemp = formatTemp(rawMyTemp);
                const myCode =
                  currentLocationForecast.current?.weathercode ??
                  currentLocationForecast.weathercode?.[0] ??
                  0;
                const myHumidity = currentLocationForecast.current?.humidity ?? null;
                const myWind = currentLocationForecast.current?.windspeed ?? null;
                const diff = currentTemp - myTemp;
                const diffLabel =
                  diff === 0
                    ? t("weather.sameTemp")
                    : diff > 0
                      ? t("weather.tempDiffPositive", { diff: Math.round(diff) })
                      : t("weather.tempDiffNegative", { diff: Math.round(diff) });
                const diffColor =
                  diff >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : diff <= -4
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-slate-500 dark:text-slate-400";
                return (
                  <div className="space-y-2.5">
                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 text-left px-1">
                      {t("weather.compareLocation")}
                    </h4>
                    <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[24px] p-5 shadow-soft relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-16 h-16 bg-sky-500/[0.02] dark:bg-sky-500/[0.04] rounded-full blur-xl pointer-events-none" />
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* Current location column */}
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[30px] max-w-full">
                            {currentLocationName ?? t("weather.yourLocation")}
                          </span>
                          <div className="flex items-center justify-center h-9">
                            {getWeatherIcon(myCode, "w-8 h-8 drop-shadow-sm")}
                          </div>
                          <span className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter leading-none">
                            {myTemp}°
                          </span>
                          <div className="flex flex-col items-center gap-2 mt-1">
                            {myHumidity !== null && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-550 dark:text-slate-455 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40">
                                <HumidityIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                <span>{myHumidity}%</span>
                              </div>
                            )}
                            {myWind !== null && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-550 dark:text-slate-455 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40">
                                <WindIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {formatSpeed(myWind)} {speedLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle badge */}
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-tight text-center leading-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/60 shadow-sm ${diffColor}`}
                          >
                            {diffLabel}
                          </span>
                        </div>

                        {/* Destination column */}
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[30px] max-w-full">
                            {destination}
                          </span>
                          <div className="flex items-center justify-center h-9">
                            {getWeatherIcon(currentCode, "w-8 h-8 drop-shadow-sm")}
                          </div>
                          <span className="text-3xl font-bold text-slate-800 dark:text-white tracking-tighter leading-none">
                            {currentTemp}°
                          </span>
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-550 dark:text-slate-455 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40">
                              <HumidityIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>{humidity}%</span>
                            </div>
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-550 dark:text-slate-455 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40">
                              <WindIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {formatSpeed(windspeed)} {speedLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Hourly 24-Hour Forecast */}
            {forecast.hourly && (
              <div className="space-y-2.5">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 text-left px-1">
                  {t("weather.forecast24h")}
                </h4>

                <div className="flex overflow-x-auto gap-3 pb-2 pt-1 px-1 custom-scrollbar">
                  {forecast.hourly.time?.map((timeStr: string, idx: number) => {
                    const hour = new Date(timeStr).getHours();
                    const temp = formatTemp(forecast.hourly?.temperature?.[idx] ?? 0);
                    const code = forecast.hourly?.weathercode?.[idx] ?? 0;
                    const precip = forecast.hourly?.precipitation_probability?.[idx] ?? 0;

                    return (
                      <div
                        key={idx}
                        className="shrink-0 w-[68px] rounded-[20px] bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 py-4 flex flex-col items-center gap-2.5 shadow-soft hover:shadow-md transition-all duration-350 active:scale-[0.96] cursor-pointer"
                      >
                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-400">
                          {idx === 0 ? t("weather.now") : `${hour}:00`}
                        </span>

                        <div className="relative h-7 flex items-center justify-center drop-shadow-sm">
                          {getWeatherIcon(code, "w-6.5 h-6.5")}
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[14.5px] font-bold text-slate-800 dark:text-slate-200">
                            {temp}°
                          </span>
                          {precip > 15 ? (
                            <span className="text-[9.5px] font-bold text-sky-500 dark:text-sky-400 mt-0.5 leading-none">
                              {precip}%
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-transparent mt-0.5 leading-none select-none">
                              0%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weather Parameters Grid */}
            <div className="space-y-2.5">
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 text-left px-1">
                {t("weather.detailedIndex")}
              </h4>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Feel Temp Card */}
                <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[22px] p-4 flex flex-col text-left justify-between min-h-[105px] shadow-soft relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-550">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      {t("weather.feelsLike")}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 dark:bg-rose-500/25 text-rose-500 border border-rose-500/20 dark:border-rose-500/10 shadow-sm shrink-0">
                      <ThermometerIcon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end mt-auto min-h-0">
                    <span className="text-[22px] font-bold text-slate-800 dark:text-white leading-none">
                      {apparentTemp}°
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">
                      {apparentTemp === currentTemp
                        ? t("weather.sameAsActual")
                        : apparentTemp > currentTemp
                          ? t("weather.hotterThanActual")
                          : t("weather.coolerThanActual")}
                    </span>
                  </div>
                </div>

                {/* Humidity Card */}
                <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[22px] p-4 flex flex-col text-left justify-between min-h-[105px] shadow-soft relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-550">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      {t("weather.humidity")}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-500/25 text-sky-550 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/10 shadow-sm shrink-0">
                      <HumidityIcon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="flex flex-col mt-auto">
                    <span className="text-[22px] font-bold text-slate-800 dark:text-white leading-none">
                      {humidity}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 relative">
                      <div
                        className="absolute left-0 h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
                        style={{ width: `${humidity}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Wind speed Card */}
                <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[22px] p-4 flex flex-col text-left justify-between min-h-[105px] shadow-soft relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-550">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      {t("weather.windSpeed")}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 dark:bg-slate-500/25 text-slate-555 dark:text-slate-400 border border-slate-500/20 dark:border-slate-500/10 shadow-sm shrink-0">
                      <WindIcon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-[22px] font-bold text-slate-800 dark:text-white leading-none">
                      {formatSpeed(windspeed)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                      {speedLabel}
                    </span>
                  </div>
                </div>

                {/* UV index Card */}
                <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[22px] p-4 flex flex-col text-left justify-between min-h-[105px] shadow-soft relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-550">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      {t("weather.uvIndex")}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/25 text-amber-500 border border-amber-500/20 dark:border-amber-500/10 shadow-sm shrink-0">
                      <SunIcon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="flex flex-col mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[22px] font-bold text-slate-800 dark:text-white leading-none">
                        {uvIndex}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border leading-none tracking-wide ${uvRating.color}`}
                      >
                        {uvRating.text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  } catch (err: any) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-kat-surface p-6 rounded-2xl max-w-sm w-full text-center border border-slate-100 dark:border-kat-border/40">
          <div className="text-red-500 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            {t("weather.weatherErrorTitle")}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{err.message}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>,
      document.body
    );
  }
}
