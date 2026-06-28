import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

import Globe from "react-globe.gl";
import { useAtlasStats } from "./useAtlasStats";
import { numericToAlpha2 } from "../../lib/countryCodes";
import { motion, AnimatePresence } from "framer-motion";
import { ShareMapModal } from "./ShareMapModal";

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface AtlasScreenProps {
  isOpen: boolean;
  onClose: () => void;
  totalTrips: number;
  totalDays: number;
}

export function AtlasScreen({
  isOpen,
  onClose,
  totalTrips: propsTotalTrips,
  totalDays,
}: AtlasScreenProps) {
  const { t, i18n } = useTranslation();
  const globeRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isSharingMap, setIsSharingMap] = useState(false);

  useEffect(() => {
    function handleResize() {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [tooltip, setTooltip] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const tripsRaw = useLiveQuery(() => db.trips.toArray(), []);
  const trips = useMemo(() => (tripsRaw || []).filter((t) => !t.isDeleted), [tripsRaw]);

  const {
    geographies,
    countryStats,
    visitedCountries,
    totalCities,
    totalPlaces,
    lastTripName,
    lastTripId,
    currentYearTrips,
  } = useAtlasStats(trips);

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: "region" });
    } catch {
      return null;
    }
  }, [i18n.language]);

  // Translate country names dynamically based on i18n language
  const translatedLastTrip = useMemo(() => {
    if (!lastTripId) return lastTripName;
    const alpha2 = numericToAlpha2[lastTripId];
    if (!alpha2 || !regionNames) return lastTripName;
    return regionNames.of(alpha2) || lastTripName;
  }, [lastTripId, lastTripName, regionNames]);

  const translatedTooltipName = useMemo(() => {
    if (!tooltip) return "";
    if (!tooltip.id || !regionNames) return tooltip.name;
    const alpha2 = numericToAlpha2[tooltip.id];
    if (!alpha2) return tooltip.name;
    return regionNames.of(alpha2) || tooltip.name;
  }, [tooltip, regionNames]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [globeRef.current]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-[#020617] overflow-hidden flex flex-col font-sans bg-cover bg-center"
      style={{ backgroundImage: 'url("//unpkg.com/three-globe/example/img/night-sky.png")' }}
    >
      {/* 2027 Spatial Nebula Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-fuchsia-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      >
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          polygonsData={geographies}
          polygonAltitude={(d) => (visitedCountries.includes((d as any).id) ? 0.01 : 0.005)}
          polygonCapColor={(d) =>
            visitedCountries.includes((d as any).id) ? "rgba(0, 0, 0, 0)" : "rgba(15, 23, 42, 0.95)"
          }
          polygonSideColor={(d) =>
            visitedCountries.includes((d as any).id) ? "rgba(0, 0, 0, 0)" : "rgba(15, 23, 42, 0.95)"
          }
          polygonStrokeColor={(d) =>
            visitedCountries.includes((d as any).id)
              ? "rgba(34, 211, 238, 0.8)"
              : "rgba(255, 255, 255, 0.05)"
          }
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.15}
          onPolygonHover={(geo: any) => {
            if (geo) {
              const country = countryStats[geo.id];
              if (country) {
                setTooltip({ ...country, isVisited: true, id: geo.id });
              } else {
                setTooltip({ name: geo.properties.name, isVisited: false, id: geo.id });
              }
            } else {
              setTooltip(null);
            }
          }}
          polygonsTransitionDuration={500}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-6 md:p-10 flex justify-between items-start pointer-events-none z-10">
        <button
          onClick={onClose}
          className="pointer-events-auto group w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white backdrop-blur-xl border border-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => setIsSharingMap(true)}
            className="pointer-events-auto group flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white backdrop-blur-xl border border-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-4 h-12 gap-2"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="text-sm font-semibold hidden sm:block">
              {t("atlas.share.btn_share", "Chia sẻ")}
            </span>
          </button>

          <div className="flex items-center gap-2 md:gap-3 drop-shadow-md">
            <img
              src="/asset/logo.png"
              alt="KAT Journey Logo"
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-lg border border-white/10 object-cover"
            />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight hidden sm:block">
              KAT Journey
            </h2>
          </div>
        </div>
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 md:p-8 flex flex-col justify-end items-start h-full">
        {/* Flags Card */}
        {visitedCountries.length > 0 && (
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 mb-4 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                {t("atlas.stats.flagsCollected", "Flags collected")}
              </div>
              <div className="bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                {((visitedCountries.length / 195) * 100).toFixed(1)}%{" "}
                {t("atlas.stats.ofWorld", "thế giới")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
              {visitedCountries.map((id) => {
                const alpha2 = numericToAlpha2[id];
                if (!alpha2) return null;
                return (
                  <div
                    key={id}
                    className="text-3xl drop-shadow-sm hover:scale-125 transition-transform cursor-help"
                    title={countryStats[id]?.name}
                  >
                    {getFlagEmoji(alpha2)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Stats Bar */}
        <div className="pointer-events-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 w-full max-w-4xl flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          {/* Countries Count */}
          <div className="flex items-center gap-3">
            <span className="text-5xl sm:text-6xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
              {visitedCountries.length}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-tight">
                {t("dashboard.stats.countries", "Quốc gia")}
              </span>
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">
                {((visitedCountries.length / 195) * 100).toFixed(1)}%{" "}
                {t("atlas.stats.ofWorld", "thế giới")}
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-px h-12 bg-slate-200 dark:bg-slate-700"></div>

          {/* Main Stats */}
          <div className="flex flex-1 justify-between max-w-sm">
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">
                {propsTotalTrips}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("atlas.stats.trips", "Trips")}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">
                {totalPlaces}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("atlas.stats.places", "Places")}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">
                {totalCities}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("atlas.stats.cities", "Cities")}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">
                {totalDays}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("atlas.stats.days", "Days")}
              </span>
            </div>
          </div>

          {/* Secondary Stats Group */}
          <div className="hidden lg:flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 py-3 px-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-0.5">
                {t("atlas.stats.lastTrip", "Last Trip")}
              </span>
              <span className="text-[13px] font-black tracking-tight text-slate-800 dark:text-white">
                {translatedLastTrip}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {currentYearTrips}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 leading-tight w-16">
                {t("atlas.stats.tripsIn", "Trips in")} {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className={`fixed pointer-events-none z-[110] bg-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl border border-white/20 transform -translate-x-1/2 -translate-y-[120%] ${tooltip.isVisited ? "p-5" : "px-4 py-2"}`}
          style={{ left: tooltipPos.x, top: tooltipPos.y, transition: "opacity 0.2s ease-out" }}
        >
          {tooltip.isVisited ? (
            <div className="flex flex-col items-center min-w-[140px]">
              <div className="absolute -top-10 bg-sky-500/20 w-20 h-20 blur-2xl rounded-full"></div>
              <span className="text-lg font-medium text-white mb-3 tracking-wide relative z-10">
                {translatedTooltipName}
              </span>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full relative z-10">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-light text-white tabular-nums">
                    {tooltip.trips}
                  </span>
                  <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/50">
                    {t("atlas.stats.trips", "Trips")}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-light text-white tabular-nums">
                    {tooltip.places}
                  </span>
                  <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/50">
                    {t("atlas.stats.places", "Places")}
                  </span>
                </div>

                <div className="col-span-2 w-full h-px bg-white/10 my-1"></div>

                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/50 mb-0.5">
                    {t("atlas.stats.first", "First")}
                  </span>
                  <span className="text-xs font-medium text-white/90 tabular-nums">
                    {tooltip.firstTrip}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/50 mb-0.5">
                    {t("atlas.stats.latest", "Latest")}
                  </span>
                  <span className="text-xs font-medium text-white/90 tabular-nums">
                    {tooltip.lastTrip}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm font-medium text-white/70 tracking-wide">
              {translatedTooltipName}
            </span>
          )}
        </div>
      )}

      {isSharingMap && (
        <ShareMapModal
          onClose={() => setIsSharingMap(false)}
          geographies={geographies}
          visitedCountries={visitedCountries}
          totalTrips={propsTotalTrips}
        />
      )}
    </div>,
    document.body
  );
}
