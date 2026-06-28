import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useTripData(
  selectedTripId: number | null,
  isCreatingTrip: boolean,
  isManagingTrips: boolean,
  isViewingArchive: boolean
) {
  const tripsRaw = useLiveQuery(async () =>
    (await db.trips.toArray()).filter((t) => !t.isDeleted && t.status !== "archived")
  );
  const allTripsRaw = useLiveQuery(async () =>
    (await db.trips.toArray()).filter((t) => !t.isDeleted)
  );
  const tripsLoading = tripsRaw === undefined || allTripsRaw === undefined;
  const trips = tripsRaw ?? [];

  const tripId =
    isCreatingTrip || isManagingTrips || isViewingArchive
      ? null
      : (selectedTripId ?? trips[0]?.id ?? null);

  const trip = useLiveQuery(async () => {
    if (!tripId) return undefined;
    const t = await db.trips.get(tripId);
    return t && !t.isDeleted ? t : undefined;
  }, [tripId]);

  const isReadOnly = trip?.status === "archived";

  const members = useLiveQuery(
    async () =>
      tripId
        ? (await db.members.where("tripId").equals(tripId).toArray()).filter((m) => !m.isDeleted)
        : [],
    [tripId]
  );
  const events = useLiveQuery(
    async () =>
      tripId
        ? (await db.events.where("tripId").equals(tripId).toArray()).filter((e) => !e.isDeleted)
        : [],
    [tripId]
  );
  const expenses = useLiveQuery(
    async () =>
      tripId
        ? (await db.expenses.where("tripId").equals(tripId).toArray()).filter((e) => !e.isDeleted)
        : [],
    [tripId]
  );
  const checklist = useLiveQuery(
    async () =>
      tripId
        ? (await db.checklist.where("tripId").equals(tripId).toArray()).filter((c) => !c.isDeleted)
        : [],
    [tripId]
  );
  const journals = useLiveQuery(
    async () =>
      tripId
        ? (await db.journals.where("tripId").equals(tripId).toArray()).filter((j) => !j.isDeleted)
        : [],
    [tripId]
  );
  const packingItems = useLiveQuery(
    async () =>
      tripId
        ? (await db.packingItems.where("tripId").equals(tripId).toArray()).filter(
            (p) => !p.isDeleted
          )
        : [],
    [tripId]
  );
  const travelDocuments = useLiveQuery(
    async () =>
      tripId
        ? (await db.travelDocuments.where("tripId").equals(tripId).toArray()).filter(
            (d) => !d.isDeleted
          )
        : [],
    [tripId]
  );
  const backupPlans = useLiveQuery(
    async () =>
      tripId
        ? (await db.backupPlans.where("tripId").equals(tripId).toArray()).filter(
            (b) => !b.isDeleted
          )
        : [],
    [tripId]
  );

  const tripDataLoading =
    tripId !== null &&
    (trip === undefined ||
      members === undefined ||
      events === undefined ||
      expenses === undefined ||
      checklist === undefined ||
      journals === undefined ||
      packingItems === undefined ||
      travelDocuments === undefined ||
      backupPlans === undefined);

  return {
    tripsRaw,
    allTripsRaw,
    tripsLoading,
    trips,
    tripId,
    trip,
    isReadOnly,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans,
    tripDataLoading,
  };
}
