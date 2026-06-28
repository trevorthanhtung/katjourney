import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
// @ts-ignore
import { geoContains } from "d3-geo";
// @ts-ignore
import { feature } from "topojson-client";

import { numericToAlpha2 } from "../../lib/countryCodes";
import { useAtlasStats } from "./useAtlasStats";
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
  const { t } = useTranslation();

  const trips = useLiveQuery(() => db.trips.filter((t) => !t.isDeleted).toArray()) || [];

  const {
    geographies,
    countryStats,
    visitedCountries,
    totalCities,
    totalPlaces,
    lastTripName,
    currentYearTrips,
  } = useAtlasStats(trips as any);

  // To avoid rendering issues during animation, only render map if open
  const [shouldRender, setShouldRender] = useState(false);

  const [tooltip, setTooltip] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else setTimeout(() => setShouldRender(false), 300); // Wait for fade out
  }, [isOpen]);

  if (!shouldRender && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-slate-900 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onMouseMove={(e) => {
        if (tooltip) {
          setTooltipPos({ x: e.clientX, y: e.clientY });
        }
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-10 pointer-events-none">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors pointer-events-auto group"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            className="text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white"
          />
        </button>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="h-10 px-5 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <span className="font-black text-slate-800 dark:text-white tracking-widest text-sm">
              ATLAS
            </span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#f4f7f9] dark:bg-[#0f172a] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 159.154943,
            center: [0, 0],
          }}
          width={1000}
          height={1000}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          className="drop-shadow-md"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={(pos: any) => setPosition(pos)}
            maxZoom={8}
            translateExtent={[
              [-3500, 0],
              [4500, 1000],
            ]}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }: any) =>
                [-4000, -3000, -2000, -1000, 0, 1000, 2000, 3000, 4000].map((offsetX) => (
                  <g key={`map-layer-${offsetX}`} transform={`translate(${offsetX}, 0)`}>
                    {geographies.map((geo: any) => {
                      const isVisited = visitedCountries.includes(geo.id);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            const country = countryStats[geo.id];
                            if (country) {
                              setTooltip({ ...country, isVisited: true });
                            } else {
                              setTooltip({ name: geo.properties.name, isVisited: false });
                            }
                          }}
                          onMouseLeave={() => {
                            setTooltip(null);
                          }}
                          fill={isVisited ? "#ec4899" : "currentColor"}
                          stroke="currentColor"
                          strokeWidth={0.75}
                          style={{
                            default: { outline: "none", transition: "all 250ms" },
                            hover: {
                              fill: isVisited ? "#db2777" : "rgba(148, 163, 184, 0.5)",
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: { outline: "none" },
                          }}
                          className={`text-[#e2e8f0] dark:text-slate-800 stroke-white dark:stroke-slate-900 ${
                            isVisited ? "" : "hover:text-slate-300 dark:hover:text-slate-700"
                          }`}
                        />
                      );
                    })}
                  </g>
                ))
              }
            </Geographies>

            {/* Vietnam's Islands (Hoàng Sa & Trường Sa) */}
            <Marker coordinates={[112.0, 16.5]}>
              <circle r={1} fill="#ec4899" stroke="none" />
            </Marker>

            <Marker coordinates={[114.0, 10.0]}>
              <circle r={1} fill="#ec4899" stroke="none" />
            </Marker>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Google Maps Style Zoom Controls */}
      <div className="absolute right-6 bottom-36 flex flex-col shadow-lg rounded-xl overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/50">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl pointer-events-none">
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
                  {lastTripName}
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
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className={`fixed pointer-events-none z-[110] bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-700/50 transform -translate-x-1/2 -translate-y-[120%] ${tooltip.isVisited ? "p-4" : "px-4 py-2"}`}
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transition: "opacity 0.15s ease-out",
          }}
        >
          <div
            className={`text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider ${tooltip.isVisited ? "mb-3" : ""}`}
          >
            {tooltip.name}
          </div>
          {tooltip.isVisited && (
            <>
              <div className="flex gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-800 dark:text-white">
                    {tooltip.trips}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {tooltip.trips > 1
                      ? t("atlas.tooltip.trips", "Trips")
                      : t("atlas.tooltip.trip", "Trip")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-800 dark:text-white">
                    {tooltip.places}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {t("atlas.tooltip.places", "Places")}
                  </span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {t("atlas.tooltip.firstTrip", "First Trip")}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {tooltip.firstTrip}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {t("atlas.tooltip.lastTrip", "Last Trip")}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {tooltip.lastTrip}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
