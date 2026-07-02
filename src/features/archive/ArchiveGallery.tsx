import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, CompassIcon } from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { Trip, db } from "../../db";
import { ArchiveTripCard } from "./ArchiveTripCard";

export function ArchiveGallery({
  onBack,
  onOpenTrip,
}: {
  onBack: () => void;
  onOpenTrip: (id: number) => void;
}) {
  const { t } = useTranslation();
  const archivedTrips =
    useLiveQuery(async () =>
      db.trips.filter((t) => !t.isDeleted && t.status === "archived").toArray()
    ) ?? [];

  const tripIds = archivedTrips.map((t) => t.id!);

  const allMembers =
    useLiveQuery(async () => {
      if (tripIds.length === 0) return [];
      return db.members
        .where("tripId")
        .anyOf(tripIds)
        .filter((m) => !m.isDeleted)
        .toArray();
    }, [tripIds.join(",")]) ?? [];

  const allExpenses =
    useLiveQuery(async () => {
      if (tripIds.length === 0) return [];
      return db.expenses
        .where("tripId")
        .anyOf(tripIds)
        .filter((e) => !e.isDeleted)
        .toArray();
    }, [tripIds.join(",")]) ?? [];

  const memberCounts = allMembers.reduce(
    (acc, m) => {
      acc[m.tripId] = (acc[m.tripId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const sortedTrips = [...archivedTrips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const tripsByYear: { [year: string]: Trip[] } = {};
  sortedTrips.forEach((trip) => {
    const year = trip.startDate ? trip.startDate.split("-")[0] : t("archive.unknownYear");
    if (!tripsByYear[year]) {
      tripsByYear[year] = [];
    }
    tripsByYear[year].push(trip);
  });

  const years = Object.keys(tripsByYear).sort((a, b) => b.localeCompare(a));

  // getTripDurationText and TripCard have been moved to the top level (outside ArchiveGallery) to prevent React unmounting/re-rendering animation bugs.

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 md:pt-4 md:pb-16 motion-page-enter">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label={t("archive.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-[#0A0F1C]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 hover:border-[#00BFB7]/40 dark:hover:border-[#00BFB7]/50 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,191,183,0.12)] transition-all duration-300 shadow-xs group motion-press"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            className="text-kat-dark dark:text-white group-hover:text-kat-primary transition-colors"
          />
        </button>
        <div>
          <h1 className="text-[24px] font-black bg-linear-to-r from-kat-dark to-kat-primary dark:from-white dark:to-teal-300 bg-clip-text text-transparent drop-shadow-xs">
            {t("archive.title")}
          </h1>
          <p className="text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
            {archivedTrips.length > 0
              ? t("archive.savedTrips", { count: archivedTrips.length })
              : t("archive.noTripsDesc")}
          </p>
        </div>
      </div>

      {archivedTrips.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #1A3A5C 0%, #2460A7 100%)",
              boxShadow: "0 8px 32px rgba(26,58,92,0.3)",
            }}
          >
            <HugeiconsIcon icon={CompassIcon} size={40} className="text-white" />
          </div>
          <h3 className="text-[20px] font-extrabold text-kat-dark">{t("archive.emptyTitle")}</h3>
          <p className="mt-2 text-[14px] font-semibold text-slate-500 max-w-xs leading-relaxed">
            {t("archive.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <div key={year} className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-[19px] font-black text-kat-dark tracking-tight">{year}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100/75 border border-slate-200/50 px-3 py-1 rounded-full">
                  {t("archive.tripCount", { count: tripsByYear[year].length })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {tripsByYear[year].map((trip, i) => (
                  <ArchiveTripCard
                    key={trip.id}
                    trip={trip}
                    index={i}
                    allExpenses={allExpenses}
                    memberCounts={memberCounts}
                    onOpenTrip={onOpenTrip}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
