import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trip, db } from "../../../db";
import { useLiveQuery } from "dexie-react-hooks";
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
];

interface HeroTripCardProps {
  trip: Trip;
  onOpenTrip: (id: number) => void;
}

export function HeroTripCard({ trip, onOpenTrip }: HeroTripCardProps) {
  const { t } = useTranslation();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Auto-cycle background images every 5 seconds
  useEffect(() => {
    // Preload the next image to prevent blank flashes
    const preloadImage = new Image();
    preloadImage.src = HERO_IMAGES[(currentImageIdx + 1) % HERO_IMAGES.length];

    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentImageIdx]);

  // Fetch real-time counts for this trip
  const memberCount = useLiveQuery(
    () => db.members.where("tripId").equals(trip.id!).count(),
    [trip.id],
    1
  );
  const eventCount = useLiveQuery(
    () => db.events.where("tripId").equals(trip.id!).count(),
    [trip.id],
    0
  );

  // Time logic
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  let statusTitle = t("dashboard.hero.upcoming", "UPCOMING");
  let statusValue = 0;
  let statusUnit = t("dashboard.hero.daysLeft", "DAYS LEFT");
  let isLive = false;

  if (now >= start && now <= end) {
    statusTitle = t("dashboard.hero.ongoing", "ONGOING");
    statusValue = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    statusUnit = t("dashboard.hero.daysLeft", "DAYS LEFT");
    isLive = true;
  } else if (now < start) {
    statusTitle = t("dashboard.hero.upcoming", "UPCOMING");
    statusValue = Math.ceil((start.getTime() - now.getTime()) / (1000 * 3600 * 24));
    statusUnit = t("dashboard.hero.daysLeft", "DAYS LEFT");
  }

  // Formatting dates
  const formatMonthDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { day: "-", month: "-" };
    return {
      day: d.getDate(),
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    };
  };

  const sDate = formatMonthDate(trip.startDate);
  const eDate = formatMonthDate(trip.endDate);

  return (
    <div
      onClick={() => onOpenTrip(trip.id!)}
      className="relative w-full h-[320px] sm:h-[400px] lg:h-[500px] rounded-[32px] overflow-hidden cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.12)] mb-8"
    >
      {/* Background Images Crossfade */}
      {HERO_IMAGES.map((src, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentImageIdx ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={src} alt="Terrain Background" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80 group-hover:from-black/50 transition-all duration-500"></div>

      {/* Top Left Badge */}
      <div className="absolute top-6 left-6 z-10">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md text-[11px] font-bold tracking-widest uppercase shadow-sm ${
            isLive
              ? "bg-black/40 border-yellow-500/30 text-yellow-400"
              : "bg-black/30 border-white/20 text-white"
          }`}
        >
          {isLive && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>}
          {isLive
            ? t("dashboard.hero.liveNow", "LIVE NOW")
            : t("dashboard.hero.upcoming", "UPCOMING")}
        </div>
      </div>

      {/* Center Title */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <h2 className="text-white text-5xl sm:text-7xl lg:text-[90px] font-[900] tracking-tighter text-center leading-none drop-shadow-2xl group-hover:scale-105 transition-transform duration-700">
          {trip.title}
        </h2>
      </div>

      {/* Bottom Glassmorphism Bar */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="bg-[#111111]/60 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 sm:p-5">
          <div className="flex flex-row items-center justify-between divide-x divide-white/10">
            {/* Buddies */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[9px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase mb-2">
                {t("dashboard.hero.buddies", "Buddies")}
              </span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50">
                  M
                </div>
                {memberCount > 1 && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50">
                    +{memberCount - 1}
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/70 mt-2 truncate w-full text-center px-1">
                {memberCount} {t("dashboard.hero.travelers", "Travelers")}
              </span>
            </div>

            {/* Trip Dates */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[9px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase mb-1">
                {t("dashboard.hero.tripDates", "Trip Dates")}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-4 text-white">
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-3xl font-black leading-none">{sDate.day}</span>
                  <span className="text-[9px] sm:text-[11px] font-bold text-white/70 uppercase">
                    {sDate.month}
                  </span>
                </div>
                <span className="text-white/30 text-sm sm:text-lg">→</span>
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-3xl font-black leading-none">{eDate.day}</span>
                  <span className="text-[9px] sm:text-[11px] font-bold text-white/70 uppercase">
                    {eDate.month}
                  </span>
                </div>
              </div>
            </div>

            {/* Ongoing / Status */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[9px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase mb-1 truncate px-1 w-full text-center">
                {statusTitle}
              </span>
              <span className="text-xl sm:text-3xl font-black text-white leading-none">
                {statusValue}
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold text-white/70 uppercase mt-1 truncate px-1 w-full text-center">
                {statusUnit}
              </span>
            </div>

            {/* Places */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[9px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase mb-2">
                {t("dashboard.hero.places", "Places")}
              </span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center text-white border-2 border-black/50 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=200&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-teal-500 flex items-center justify-center text-white border-2 border-black/50 overflow-hidden hidden sm:flex">
                  <img
                    src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=200&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50">
                  +{eventCount > 2 ? eventCount - 2 : 0}
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/70 mt-2 truncate px-1 w-full text-center">
                {eventCount} {t("dashboard.hero.destinations", "Destinations")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
