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
import { useModalHistory } from "../../hooks/useModalHistory";

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
  useModalHistory(isOpen, onClose, "atlas");
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
      className="fixed inset-0 z-100 bg-slate-950 overflow-hidden flex flex-col font-sans bg-cover bg-center"
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
              {t("atlas.share.btn_share")}
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

      {/* HUD Overlay - 2027 Spatial UI */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none p-6 md:p-10 flex flex-col justify-end items-center h-full z-10 overflow-hidden">
        {/* Dynamic Island HUD */}
        <div className="pointer-events-auto relative z-20 flex flex-col items-center w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {!isStatsExpanded ? (
              <motion.button
                key="pill"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsStatsExpanded(true)}
                className="bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-6 py-3 rounded-full flex items-center gap-4 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-sky-500/20 via-pink-500/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>

                {visitedCountries.length > 0 && (
                  <div className="flex -space-x-2 mr-2">
                    {visitedCountries.slice(0, 3).map((id, idx) => {
                      const alpha2 = numericToAlpha2[id];
                      if (!alpha2) return null;
                      return (
                        <img
                          key={id}
                          src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`}
                          alt={alpha2}
                          className="w-6 h-6 rounded-full object-cover border border-white/30 shadow-xs relative"
                          style={{ zIndex: 3 - idx }}
                        />
                      );
                    })}
                    {visitedCountries.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[8px] font-bold text-white relative z-0">
                        +{visitedCountries.length - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-white font-medium tracking-wide">
                    {visitedCountries.length}{" "}
                    <span className="text-white/60 text-[10px] uppercase tracking-[0.2em]">
                      {t("dashboard.stats.countries")}
                    </span>
                  </span>
                  <div className="w-1 h-1 rounded-full bg-white/30"></div>
                  <span className="text-white font-medium tracking-wide">
                    {propsTotalTrips}{" "}
                    <span className="text-white/60 text-[10px] uppercase tracking-[0.2em]">
                      {t("atlas.stats.trips")}
                    </span>
                  </span>
                </div>

                <div className="ml-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 group-hover:bg-white/20 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="panel"
                initial={{ opacity: 0, y: 50, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-[1000px] mx-auto bg-[#0a0a0a]/60 backdrop-blur-2xl p-2 sm:p-3 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row gap-2 sm:gap-3 relative shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] items-stretch ring-1 ring-white/5"
              >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-linear-to-br from-sky-500/20 via-indigo-500/10 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <button
                  onClick={() => setIsStatsExpanded(false)}
                  className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-xl border border-white/10 transition-all z-30 shadow-2xl hover:scale-110 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Hero Card: Countries */}
                <div className="shrink-0 flex flex-col justify-between p-5 md:p-6 bg-white/2 border border-white/10 hover:border-white/20 hover:bg-white/4 rounded-4xl w-full md:w-[220px] relative overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300">
                  <div className="absolute inset-0 bg-linear-to-br from-sky-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>

                  <div className="relative z-10 flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
                        {t("dashboard.stats.countries")}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-sky-400/90 tracking-wider">
                      <span className="font-bold text-sky-300">
                        {((visitedCountries.length / 195) * 100).toFixed(1)}%
                      </span>{" "}
                      {t("dashboard.stats.world")}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between mt-6">
                    <span className="text-6xl sm:text-[72px] font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 tracking-tighter leading-[0.8] drop-shadow-md">
                      {visitedCountries.length}
                    </span>
                    {visitedCountries.length > 0 && (
                      <div className="flex -space-x-2 pb-1">
                        {visitedCountries.slice(0, 3).map((id, idx) => {
                          const alpha2 = numericToAlpha2[id];
                          if (!alpha2) return null;
                          return (
                            <img
                              key={id}
                              src={`https://flagcdn.com/w40/${alpha2.toLowerCase()}.png`}
                              alt={alpha2}
                              className="w-8 h-8 rounded-full object-cover border-[1.5px] border-[#1a1a1a] shadow-lg relative"
                              style={{ zIndex: 3 - idx }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Number Grid Cards (2x2 Bento) */}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 z-10 min-w-[200px]">
                  {[
                    { label: t("atlas.stats.trips"), value: propsTotalTrips },
                    { label: t("atlas.stats.places"), value: totalPlaces },
                    { label: t("atlas.stats.cities"), value: totalCities },
                    { label: t("atlas.stats.days"), value: totalDays },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center p-3 bg-white/2 hover:bg-white/4 border border-white/10 hover:border-white/20 rounded-3xl transition-all duration-300 group shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] h-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-linear-to-t from-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-3xl lg:text-[32px] font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/70 mb-1 tabular-nums group-hover:scale-110 group-hover:from-sky-100 group-hover:to-sky-300 transition-all duration-300 drop-shadow-md">
                        {stat.value}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 text-center leading-tight transition-colors">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Last Trip Card */}
                <div className="shrink-0 flex flex-col justify-between p-5 md:p-6 bg-white/2 border border-white/10 hover:border-white/20 hover:bg-white/4 rounded-4xl w-full md:w-[220px] relative overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300">
                  <div className="absolute inset-0 bg-linear-to-br from-sky-400/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative z-10 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-200/60 mb-1.5">
                      {t("atlas.stats.lastTrip")}
                    </span>
                    <span className="text-base md:text-lg font-bold text-white tracking-wide truncate max-w-full drop-shadow-md leading-tight">
                      {translatedLastTrip}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-end justify-between mt-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200/60 mb-2">
                      {t("atlas.stats.tripsIn")} {new Date().getFullYear()}
                    </span>
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-b from-sky-200 to-sky-500 tabular-nums drop-shadow-[0_0_20px_rgba(56,189,248,0.5)] leading-[0.8]">
                      {currentYearTrips}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className={`fixed pointer-events-none z-110 bg-[#030712]/70 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.4)] ring-1 ring-white/10 transform -translate-x-1/2 translate-y-[-120%] overflow-hidden ${tooltip.isVisited ? "p-5" : "px-4 py-2"}`}
          style={{ left: tooltipPos.x, top: tooltipPos.y, transition: "opacity 0.2s ease-out" }}
        >
          {/* Ambient background glows */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/30 rounded-full blur-2xl"></div>

          {tooltip.isVisited ? (
            <div className="flex flex-col items-center min-w-[160px] relative z-10">
              <span className="text-xl font-black text-white mb-4 tracking-widest drop-shadow-md">
                {translatedTooltipName}
              </span>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[32px] font-black text-transparent bg-clip-text bg-linear-to-b from-white to-cyan-300 tabular-nums leading-none mb-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    {tooltip.trips}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-100/60">
                    {t("atlas.stats.trips")}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[32px] font-black text-transparent bg-clip-text bg-linear-to-b from-white to-cyan-300 tabular-nums leading-none mb-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    {tooltip.places}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-100/60">
                    {t("atlas.stats.places")}
                  </span>
                </div>

                <div className="col-span-2 w-full h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent my-1"></div>

                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-cyan-100/40 mb-1">
                    {t("atlas.stats.first")}
                  </span>
                  <span className="text-xs font-black text-white/90 tabular-nums tracking-wider">
                    {tooltip.firstTrip}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-cyan-100/40 mb-1">
                    {t("atlas.stats.latest")}
                  </span>
                  <span className="text-xs font-black text-white/90 tabular-nums tracking-wider">
                    {tooltip.lastTrip}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
              <span className="text-sm font-bold text-white/80 tracking-widest uppercase">
                {translatedTooltipName}
              </span>
            </div>
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
