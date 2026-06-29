import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trip, db } from "../../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { getAvatarSvg } from "../../../utils/avatars";
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

  // Fetch real-time members for this trip
  const members = useLiveQuery(
    () => db.members.where("tripId").equals(trip.id!).toArray(),
    [trip.id],
    []
  );
  const memberCount = members.length;

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
              ? "bg-black/40 border-emerald-500/30 text-emerald-400"
              : "bg-black/30 border-amber-500/30 text-amber-400"
          }`}
        >
          {isLive ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
          {isLive
            ? t("dashboard.hero.liveNow", "LIVE NOW")
            : t("dashboard.hero.upcoming", "UPCOMING")}
        </div>
      </div>

      {/* Center Title */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <h2 className="text-white text-5xl sm:text-7xl lg:text-[90px] font-[900] tracking-tighter text-center leading-tight drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 py-4">
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
                {memberCount === 0 ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-white/50 border-2 border-black/50 overflow-hidden">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                ) : (
                  <>
                    {members.slice(0, 2).map((member, i) => {
                      const bgColors = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500"];
                      const colorClass = bgColors[i % bgColors.length];
                      return (
                        <div
                          key={member.id || i}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50 overflow-hidden`}
                        >
                          {member.avatar
                            ? getAvatarSvg(member.avatar, "w-full h-full")
                            : member.name.charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                    {memberCount > 2 && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50">
                        +{memberCount - 2}
                      </div>
                    )}
                  </>
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
                {eventCount === 0 ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-white/50 border-2 border-black/50 overflow-hidden p-1.5 shadow-inner">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-full h-full"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-black/50 overflow-hidden p-1 shadow-inner">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full drop-shadow-md"
                      >
                        <path
                          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                          fill="#93C5FD"
                        />
                        <path
                          d="M12 21C16.9706 21 21 16.9706 21 12C21 11.0256 20.8451 10.0874 20.5582 9.2063C19.7891 9.71536 18.882 10 17.9259 10C15.2289 10 13 7.8203 13 5.18519C13 4.22554 13.2926 3.33618 13.8055 2.58557C13.2268 2.39659 12.6225 2.2963 12 2.2963C6.63842 2.2963 2.2963 6.63842 2.2963 12C2.2963 17.3616 6.63842 21.7037 12 21.7037V21Z"
                          fill="#3B82F6"
                        />
                        <circle cx="8" cy="8" r="2" fill="#EFF6FF" />
                      </svg>
                    </div>
                    {eventCount > 1 && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-black/50 overflow-hidden hidden sm:flex p-1 shadow-inner">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full drop-shadow-md"
                        >
                          <path d="M2 20H22L12 4L2 20Z" fill="#A7F3D0" />
                          <path d="M12 4L22 20H12V4Z" fill="#10B981" />
                          <path d="M7 20H17L12 12L7 20Z" fill="#047857" />
                        </svg>
                      </div>
                    )}
                    {eventCount > 2 && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-2 border-black/50">
                        +{eventCount - 2}
                      </div>
                    )}
                  </>
                )}
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
