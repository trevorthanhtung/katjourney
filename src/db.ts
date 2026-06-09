import Dexie, { Table } from "dexie";

export type ChecklistSection = "Before Trip" | "During Trip" | "After Trip";
export type JournalMood = "very_bad" | "bad" | "okay" | "good" | "great";
export type PackingTripType = "Biển" | "Núi" | "Thành phố" | "Camping" | "Gia đình";

export interface Trip {
  id?: number;
  title: string;
  location: string;
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

export class KatJourneyDB extends Dexie {
  trips!: Table<Trip, number>;
  members!: Table<Member, number>;
  events!: Table<EventItem, number>;
  expenses!: Table<Expense, number>;
  checklist!: Table<ChecklistItem, number>;
  journals!: Table<JournalEntry, number>;
  packingItems!: Table<PackingItem, number>;

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
  }
}

export const db = new KatJourneyDB();
