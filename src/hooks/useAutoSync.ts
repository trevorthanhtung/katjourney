import React, { useState, useEffect } from "react";
import { updateShareLink } from "../services/cloudShareService";
import {
  Trip,
  Member,
  EventItem,
  Expense,
  ChecklistItem,
  JournalEntry,
  BackupPlan,
  TravelDocument,
} from "../db";

export function useAutoSync({
  trip,
  isReadOnly,
  members,
  events,
  expenses,
  checklist,
  journals,
  backupPlans,
  travelDocuments,
}: {
  trip?: Trip;
  isReadOnly: boolean;
  members?: Member[];
  events?: EventItem[];
  expenses?: Expense[];
  checklist?: ChecklistItem[];
  journals?: JournalEntry[];
  backupPlans?: BackupPlan[];
  travelDocuments?: TravelDocument[];
}) {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const lastSyncedFingerprintRef = React.useRef<string>("");

  const currentFingerprint = React.useMemo(() => {
    if (!trip) return "";
    const parts = [
      trip.title,
      trip.location,
      trip.startDate,
      trip.endDate,
      trip.tripType,
      JSON.stringify(trip.dayRoadmaps || {}),
      trip.status,
      trip.shareIncludeExpenses,
      trip.shareIncludeJournals,
      trip.shareIncludeChecklist,
      trip.shareIncludeBackupPlans,
      trip.shareIncludeDocuments,
      trip.shareUsePinProtection,
      trip.sharePin,
      (members ?? []).map((m) => `${m.id}-${m.updatedAt || ""}`).join(","),
      (events ?? []).map((e) => `${e.id}-${e.updatedAt || ""}`).join(","),
      (trip.shareIncludeExpenses ?? true)
        ? (expenses ?? []).map((e) => `${e.id}-${e.updatedAt || ""}`).join(",")
        : "",
      (trip.shareIncludeChecklist ?? true)
        ? (checklist ?? []).map((c) => `${c.id}-${c.updatedAt || ""}`).join(",")
        : "",
      (trip.shareIncludeJournals ?? true)
        ? (journals ?? []).map((j) => `${j.id}-${j.updatedAt || ""}`).join(",")
        : "",
      (trip.shareIncludeBackupPlans ?? true)
        ? (backupPlans ?? []).map((b) => `${b.id}-${b.updatedAt || ""}`).join(",")
        : "",
      (trip.shareIncludeDocuments ?? false)
        ? (travelDocuments ?? []).map((d) => `${d.id}-${d.updatedAt || ""}`).join(",")
        : "",
    ];
    return parts.join("|");
  }, [trip, members, events, expenses, checklist, journals, backupPlans, travelDocuments]);

  useEffect(() => {
    if (!trip || !trip.shareToken || isReadOnly) {
      lastSyncedFingerprintRef.current = "";
      return;
    }

    if (!lastSyncedFingerprintRef.current) {
      lastSyncedFingerprintRef.current = currentFingerprint;
      return;
    }

    if (lastSyncedFingerprintRef.current === currentFingerprint) {
      return;
    }

    lastSyncedFingerprintRef.current = currentFingerprint;

    const timer = setTimeout(async () => {
      setIsAutoSyncing(true);
      try {
        console.log("[AutoSync] Syncing changes...");
        const options = {
          mode: "request_edit" as const,
          includeExpenses: trip.shareIncludeExpenses ?? true,
          includeJournals: trip.shareIncludeJournals ?? true,
          includeChecklist: trip.shareIncludeChecklist ?? true,
          includeBackupPlans: trip.shareIncludeBackupPlans ?? true,
          includeDocuments: trip.shareIncludeDocuments ?? false,
          sharePin: trip.sharePin,
        };
        await updateShareLink(trip.id!, trip.shareToken!, options);
        setLastSyncedAt(new Date());
        console.log("[AutoSync] Sync successful.");
      } catch (err) {
        console.error("[AutoSync] Background sync failed:", err);
      } finally {
        setIsAutoSyncing(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentFingerprint, trip, isReadOnly]);

  return { isAutoSyncing, lastSyncedAt };
}
