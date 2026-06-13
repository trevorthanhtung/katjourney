import Dexie, { Table } from "dexie";

export type ChecklistSection = "Before Trip" | "During Trip" | "After Trip";
export type JournalMood = "very_bad" | "bad" | "okay" | "good" | "great";
export type PackingTripType = "Biển" | "Núi" | "Thành phố" | "Camping" | "Gia đình";

export interface Trip {
  id?: number;
  title: string;
  location: string;
  tripType?: "dayTrip" | "multiDay";
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Member {
  id?: number;
  tripId: number;
  name: string;
  phone: string;
  role: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  isDeleted?: boolean;
}

export interface EventItem {
  id?: number;
  tripId: number;
  date: string;
  time: string;
  title: string;
  location: string;
  notes: string;
  mapLink: string;
  completed: boolean;
  type?: string;
}

export interface Expense {
  id?: number;
  tripId: number;
  amount: number;
  payer: string;
  category: string;
  description: string;
  splitType?: "shared" | "personal";
}

export interface ChecklistItem {
  id?: number;
  tripId: number;
  section: ChecklistSection;
  title: string;
  completed: boolean;
  category?: string;
  quantity?: number;
  assignedTo?: string;
  priority?: "normal" | "important" | "required";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id?: number;
  tripId: number;
  date: string;
  title: string;
  content: string;
  mood: JournalMood;
}

export interface PackingItem {
  id?: number;
  tripId: number;
  tripType: PackingTripType;
  title: string;
  completed: boolean;
}

export interface TravelDocument {
  id?: number;
  tripId: number;
  title: string;
  type?: "ticket" | "hotel" | "booking" | "contact" | "map" | "document" | "other";
  code?: string;
  date?: string;
  link?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BackupPlanType = "food" | "place" | "transport" | "hotel" | "indoor" | "weather" | "other";

export interface BackupPlan {
  id?: number;
  tripId: number;
  activityId?: number;
  date?: string;
  title: string;
  type?: BackupPlanType;
  reason?: string;
  location?: string;
  mapLink?: string;
  estimatedCost?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class KatJourneyDB extends Dexie {
  trips!: Table<Trip, number>;
  members!: Table<Member, number>;
  events!: Table<EventItem, number>;
  expenses!: Table<Expense, number>;
  checklist!: Table<ChecklistItem, number>;
  journals!: Table<JournalEntry, number>;
  packingItems!: Table<PackingItem, number>;
  travelDocuments!: Table<TravelDocument, number>;
  backupPlans!: Table<BackupPlan, number>;

  constructor() {
    super("katJourneyDB");
    this.version(1).stores({
      trips: "++id, title, startDate, endDate, createdAt",
      members: "++id, tripId, name",
      events: "++id, tripId, date, completed",
      expenses: "++id, tripId, category, payer",
      checklist: "++id, tripId, section, completed"
    });
    this.version(2).stores({
      trips: "++id, title, startDate, endDate, createdAt",
      members: "++id, tripId, name",
      events: "++id, tripId, date, completed",
      expenses: "++id, tripId, category, payer",
      checklist: "++id, tripId, section, completed",
      journals: "++id, tripId, date, mood",
      packingItems: "++id, tripId, tripType, completed"
    });
    this.version(3).stores({
      trips: "++id, title, startDate, endDate, createdAt",
      members: "++id, tripId, name",
      events: "++id, tripId, date, completed",
      expenses: "++id, tripId, category, payer",
      checklist: "++id, tripId, section, completed",
      journals: "++id, tripId, date, mood",
      packingItems: "++id, tripId, tripType, completed",
      travelDocuments: "++id, tripId, type"
    });
    this.version(4).stores({
      trips: "++id, title, startDate, endDate, createdAt",
      members: "++id, tripId, name",
      events: "++id, tripId, date, completed",
      expenses: "++id, tripId, category, payer",
      checklist: "++id, tripId, section, completed",
      journals: "++id, tripId, date, mood",
      packingItems: "++id, tripId, tripType, completed",
      travelDocuments: "++id, tripId, type",
      backupPlans: "++id, tripId, activityId, date"
    });
  }
}

export const db = new KatJourneyDB();

export async function deleteTripCascade(tripId: number) {
  await db.transaction(
    "rw",
    [
      db.trips,
      db.members,
      db.events,
      db.expenses,
      db.checklist,
      db.journals,
      db.packingItems,
      db.travelDocuments,
      db.backupPlans,
    ],
    async () => {
      await db.members.where("tripId").equals(tripId).delete();
      await db.events.where("tripId").equals(tripId).delete();
      await db.expenses.where("tripId").equals(tripId).delete();
      await db.checklist.where("tripId").equals(tripId).delete();
      await db.journals.where("tripId").equals(tripId).delete();
      await db.packingItems.where("tripId").equals(tripId).delete();
      await db.travelDocuments.where("tripId").equals(tripId).delete();
      await db.backupPlans.where("tripId").equals(tripId).delete();
      await db.trips.delete(tripId);
    }
  );
}
