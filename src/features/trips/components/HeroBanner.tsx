import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Location01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  Edit02Icon,
  Link01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Trip } from "../../../db";
import { getTripTiming, formatDate, formatMoneyCompact } from "../../../utils/helpers";

interface HeroBannerProps {
  trip: Trip;
  memberCount: number;
  totalExpense: number;
  onOpenTrip: (id: number) => void;
}

export function HeroBanner({ trip, memberCount, totalExpense, onOpenTrip }: HeroBannerProps) {
  const { t } = useTranslation();
  const timing = getTripTiming(trip);

  // Calculate days left or days traveled
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const today = new Date();

  let daysDiff = 0;
  let daysLabel = "";

  if (timing.status === "upcoming") {
    daysDiff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    daysLabel = "DAYS LEFT";
  } else if (timing.status === "active") {
    daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    daysLabel = "DAY";
  } else {
    daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    daysLabel = "DAYS TOTAL";
  }

  // Generate a random-looking gradient based on trip ID
  const gradients = [
    "from-emerald-500/80 to-teal-900/90",
    "from-blue-500/80 to-indigo-900/90",
    "from-orange-500/80 to-red-900/90",
    "from-fuchsia-500/80 to-purple-900/90",
    "from-cyan-500/80 to-blue-900/90",
  ];
  const gradientClass = gradients[(trip.id || 0) % gradients.length];

  // High quality travel image placeholder
  const bgImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop";

  return (
    <div
      onClick={() => onOpenTrip(trip.id!)}
      className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] rounded-[32px] overflow-hidden group cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Gradient Overlay for text readability */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${gradientClass} mix-blend-multiply opacity-60`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Top Bar: LIVE NOW & Action buttons */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div>
          {timing.status === "active" && (
            <div className="inline-flex items-center gap-1.5 bg-yellow-400/90 backdrop-blur-md text-yellow-950 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-100 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              LIVE NOW
            </div>
          )}
          {timing.status === "upcoming" && (
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              UPCOMING
            </div>
          )}
        </div>

        {/* Actions (Mock for now, normally stop propagation) */}
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-colors">
            <HugeiconsIcon icon={Edit02Icon} size={16} />
          </button>
          <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-colors">
            <HugeiconsIcon icon={Link01Icon} size={16} />
          </button>
        </div>
      </div>

      {/* Main Content (Title) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none mt-8">
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white text-center tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] px-6">
          {trip.title}
        </h2>
      </div>

      {/* Bottom Glass Bar: Stats */}
      <div className="absolute bottom-6 left-6 right-6 h-auto min-h-[80px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] p-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 z-10 shadow-xl overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Block 1: Buddies */}
        <div className="flex flex-col items-center flex-1 min-w-[80px]">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">
            BUDDIES
          </div>
          <div className="flex -space-x-2">
            {[...Array(Math.min(memberCount, 3))].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-kat-primary border-2 border-white/20 flex items-center justify-center text-white text-[12px] font-bold shadow-md"
              >
                <HugeiconsIcon icon={UserGroupIcon} size={14} />
              </div>
            ))}
            {memberCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-white text-[11px] font-bold shadow-md">
                +{memberCount - 3}
              </div>
            )}
            {memberCount === 1 && (
              <div className="text-[14px] font-black text-white drop-shadow-md ml-3">Solo</div>
            )}
          </div>
        </div>

        <div className="w-px h-10 bg-white/20 hidden lg:block" />

        {/* Block 2: Dates */}
        <div className="flex flex-col items-center flex-1 min-w-[120px]">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">
            TRIP DATES
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black leading-none drop-shadow-md">
                {formatDate(trip.startDate).split("/")[0]}
              </div>
              <div className="text-[10px] font-bold uppercase mt-0.5">
                Thg {formatDate(trip.startDate).split("/")[1]}
              </div>
            </div>
            <div className="w-4 h-px bg-white/40" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black leading-none drop-shadow-md">
                {formatDate(trip.endDate).split("/")[0]}
              </div>
              <div className="text-[10px] font-bold uppercase mt-0.5">
                Thg {formatDate(trip.endDate).split("/")[1]}
              </div>
            </div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/20 hidden lg:block" />

        {/* Block 3: Ongoing / Days Left */}
        <div className="flex flex-col items-center flex-1 min-w-[100px]">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">
            {timing.status === "upcoming" ? "STARTING IN" : "TIMELINE"}
          </div>
          <div className="text-center text-white">
            <div className="text-xl sm:text-2xl font-black leading-none drop-shadow-md">
              {daysDiff > 0 ? daysDiff : 1}
            </div>
            <div className="text-[10px] font-bold uppercase mt-0.5">{daysLabel}</div>
          </div>
        </div>

        <div className="w-px h-10 bg-white/20 hidden lg:block" />

        {/* Block 4: Expense / Places */}
        <div className="flex flex-col items-center flex-1 min-w-[100px]">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1">
            EXPENSES
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <HugeiconsIcon icon={WalletCardsIcon} size={16} />
            </div>
            <div className="text-[14px] sm:text-[16px] font-black drop-shadow-md truncate max-w-[80px]">
              {totalExpense > 0
                ? formatMoneyCompact(totalExpense, trip.defaultCurrency || "VND")
                : "0"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
