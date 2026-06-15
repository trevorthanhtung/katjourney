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
  latitude?: number;
  longitude?: number;
  createdAt: string;
  shareToken?: string;
  sharePin?: string;
  mediaLink?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  status?: 'active' | 'archived';
  dayRoadmaps?: Record<string, string>;
}

export interface Member {
  id?: number;
  tripId: number;
  name: string;
  phone: string;
  role: string;
  note?: string;
  gender?: "male" | "female" | "other" | string;
  avatar?: string;
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
  assignee?: string;
  type?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Expense {
  id?: number;
  tripId: number;
  amount: number;
  payer: string;
  category: string;
  description: string;
  splitType?: "shared" | "personal";
  date?: string;
  eventId?: string | number;
  updatedAt?: string;
  isDeleted?: boolean;
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
  isDeleted?: boolean;
}

export interface JournalEntry {
  id?: number;
  tripId: number;
  date: string;
  title: string;
  content: string;
  mood: JournalMood;
  authorId?: string;
  authorName?: string;
  imageUrl?: string;
  postedAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  reactions?: Record<string, string[]>;
}

export interface PackingItem {
  id?: number;
  tripId: number;
  tripType: PackingTripType;
  title: string;
  completed: boolean;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface TravelDocument {
  id?: number;
  tripId: number;
  title: string;
  type?: "ticket" | "hotel" | "booking" | "contact" | "map" | "document" | "other";
  code?: string;
  date?: string;
  link?: string;
  attachmentUrl?: string;
  note?: string;
  isPrivate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
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
  isDeleted?: boolean;
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
    this.version(5).stores({
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
    this.version(6).stores({
      trips: "++id, title, startDate, endDate, createdAt",
      members: "++id, tripId, name",
      events: "++id, tripId, date, completed",
      expenses: "++id, tripId, category, payer",
      checklist: "++id, tripId, section, completed",
      journals: "++id, tripId, date, mood",
      packingItems: "++id, tripId, tripType, completed",
      travelDocuments: "++id, tripId, type",
      backupPlans: "++id, tripId, activityId, date"
    }).upgrade(async (tx) => {
      await tx.table("expenses").toCollection().modify(expense => {
        if (!expense.date) {
          expense.date = expense.updatedAt || expense.createdAt || new Date().toISOString();
        }
      });
    });
  }
}

export const db = new KatJourneyDB();

export async function deleteTripCascade(tripId: number) {
  const now = new Date().toISOString();
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
      const tables = [
        db.members,
        db.events,
        db.expenses,
        db.checklist,
        db.journals,
        db.packingItems,
        db.travelDocuments,
        db.backupPlans
      ];
      
      for (const table of tables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table as any).where("tripId").equals(tripId).modify({
          isDeleted: true,
          updatedAt: now
        });
      }
      
      await db.trips.update(tripId, {
        isDeleted: true,
        updatedAt: now
      });
    }
  );
}

export async function archiveTrip(tripId: number) {
  const now = new Date().toISOString();
  await db.trips.update(tripId, {
    status: 'archived',
    updatedAt: now
  });
}

export async function unarchiveTrip(tripId: number) {
  const now = new Date().toISOString();
  await db.trips.update(tripId, {
    status: 'active',
    updatedAt: now
  });
}

// --- GLOBAL MUTATION TRACKING FOR CLOUD SYNC ---
export function updateLocalTimestamp() {
  if (typeof localStorage !== "undefined") {
    if (localStorage.getItem("kat_sync_in_progress") === "true") return;
    localStorage.setItem("kat_journey_local_updated_at", new Date().toISOString());
  }
}

// Bind hooks to all tables in db to detect mutations
const tablesToTrack = [
  db.trips,
  db.members,
  db.events,
  db.expenses,
  db.checklist,
  db.journals,
  db.packingItems,
  db.travelDocuments,
  db.backupPlans
];

tablesToTrack.forEach(table => {
  table.hook("creating", (primKey, obj) => {
    updateLocalTimestamp();
    obj.updatedAt = new Date().toISOString();
    if (obj.isDeleted === undefined) {
      obj.isDeleted = false;
    }
  });
  table.hook("updating", (modifications) => {
    updateLocalTimestamp();
    return { ...modifications, updatedAt: new Date().toISOString() };
  });
  table.hook("deleting", () => {
    updateLocalTimestamp();
  });
});
