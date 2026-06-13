import { ChecklistItem, Expense, JournalEntry, JournalMood, Member, PackingItem, PackingTripType, Trip } from "../db";

export const checklistSections: import("../db").ChecklistSection[] = ["Before Trip", "During Trip", "After Trip"];
export const sectionLabels: Record<import("../db").ChecklistSection, string> = {
  "Before Trip": "Trước chuyến đi",
  "During Trip": "Trong chuyến đi",
  "After Trip": "Sau chuyến đi"
};
export const expenseCategories = [
  "Di chuyển",
  "Vé máy bay",
  "Ăn uống",
  "Lưu trú",
  "Vé tham quan",
  "Mua sắm",
  "Vui chơi & Giải trí",
  "Chuẩn bị hành lý",
  "Khác"
];
export const moods: JournalMood[] = ["very_bad", "bad", "okay", "good", "great"];
export const moodLabels: Record<JournalMood, string> = {
  very_bad: "Mệt",
  bad: "Bất ngờ",
  okay: "Bình yên",
  good: "Vui",
  great: "Hào hứng"
};
export const packingTripTypes: PackingTripType[] = ["Biển", "Núi", "Thành phố", "Camping", "Gia đình"];
export const packingSuggestions: Record<PackingTripType, string[]> = {
  Biển: ["Đồ bơi", "Kem chống nắng", "Kính mát", "Dép đi biển", "Túi chống nước", "Khăn tắm nhanh khô"],
  Núi: ["Áo khoác nhẹ", "Giày trekking", "Bình nước", "Thuốc chống côn trùng", "Đèn pin", "Băng cá nhân"],
  "Thành phố": ["Giày đi bộ", "Sạc dự phòng", "Túi đeo chéo", "Ô gấp", "Thẻ/tiền mặt", "Danh sách quán muốn thử"],
  Camping: ["Lều", "Túi ngủ", "Đèn pin", "Bếp dã ngoại", "Dao đa năng", "Túi rác"],
  "Gia đình": ["Giấy tờ tùy thân", "Thuốc cơ bản", "Đồ ăn nhẹ", "Khăn giấy ướt", "Đồ chơi nhỏ", "Bộ sạc chung"]
};

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const today = toDateInputValue(new Date());

export function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(value)
    .replace(/\s+/g, "")
    .replace(/[đĐVNDvnd]/g, "₫");
}

export function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${value}T00:00:00`)
  );
}

export function daysBetween(startDate: string, endDate: string) {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(toDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function getTripTiming(trip: Trip) {
  const start = new Date(`${trip.startDate}T00:00:00`).getTime();
  const end = new Date(`${trip.endDate}T00:00:00`).getTime();
  const now = new Date(`${today}T00:00:00`).getTime();
  const daysToStart = Math.ceil((start - now) / 86400000);

  if (Number.isNaN(start) || Number.isNaN(end)) return { label: "Chưa rõ ngày", status: "unknown" };
  if (now < start) return { label: `Còn ${daysToStart} ngày nữa`, status: "upcoming" };
  
  const totalDays = Math.ceil((end - start) / 86400000) + 1;
  
  if (now >= start && now <= end) {
    if (now === start) {
      return { label: "Hôm nay là ngày đi", status: "active" };
    }
    const currentDay = Math.ceil((now - start) / 86400000) + 1;
    return { label: `Ngày ${currentDay} / ${totalDays}`, status: "active" };
  }
  
  const daysSinceEnd = Math.ceil((now - end) / 86400000);
  return { label: `Đã kết thúc ${daysSinceEnd} ngày trước`, status: "past" };
}

export function getChecklistStats(checklist: ChecklistItem[]) {
  const completed = checklist.filter((item) => item.completed).length;
  const total = checklist.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function getPackingStats(packingItems: PackingItem[]) {
  const completed = packingItems.filter((item) => item.completed).length;
  const total = packingItems.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export function sumBy<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number) {
  return items.reduce<Record<string, number>>((result, item) => {
    const key = keyFn(item) || "Chưa chọn";
    result[key] = (result[key] ?? 0) + valueFn(item);
    return result;
  }, {});
}

export function roundVnd(value: number) {
  return Math.round(value / 1000) * 1000;
}

export function getSettlementSuggestions(members: Member[], expenses: Expense[]) {
  if (!members.length || !expenses.length) return [];
  const sharedExpenses = expenses.filter((e) => e.splitType !== "personal");
  const total = sharedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const share = total / members.length;
  const paidByMember = sumBy(sharedExpenses, (item) => item.payer, (item) => Number(item.amount || 0));
  
  const balances = members.map((member) => ({
    name: member.name,
    balance: (paidByMember[member.name] ?? 0) - share
  }));
  
  const debtors = balances
    .filter((item) => item.balance < -1)
    .map((item) => ({ name: item.name, amount: Math.abs(item.balance) }))
    .sort((a, b) => b.amount - a.amount);
    
  const creditors = balances
    .filter((item) => item.balance > 1)
    .map((item) => ({ name: item.name, amount: item.balance }))
    .sort((a, b) => b.amount - a.amount);
    
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
    if (amount > 1) {
      const roundedAmount = roundVnd(amount);
      if (roundedAmount > 0) {
        suggestions.push({ from: debtors[debtorIndex].name, to: creditors[creditorIndex].name, amount: roundedAmount });
      }
    }
    debtors[debtorIndex].amount -= amount;
    creditors[creditorIndex].amount -= amount;
    if (debtors[debtorIndex].amount < 1) debtorIndex += 1;
    if (creditors[creditorIndex].amount < 1) creditorIndex += 1;
  }

  return suggestions;
}

export interface TripData {
  trip: Trip;
  members: Member[];
  events: import("../db").EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  packingItems: PackingItem[];
  travelDocuments?: import("../db").TravelDocument[];
  backupPlans?: import("../db").BackupPlan[];
}

export function getWrappedStats({ trip, members, events, expenses, checklist, journals, packingItems }: TripData) {
  const totalDays = daysBetween(trip.startDate, trip.endDate).length || 1;
  const checklistStats = getChecklistStats(checklist);
  const packingStats = getPackingStats(packingItems);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidByMember = sumBy(expenses, (item) => item.payer, (item) => Number(item.amount || 0));
  const topPayerEntry = Object.entries(paidByMember).sort((a, b) => b[1] - a[1])[0];
  const moodCounts = journals.reduce<Record<JournalMood, number>>((result, item) => {
    result[item.mood] = (result[item.mood] ?? 0) + 1;
    return result;
  }, {} as Record<JournalMood, number>);
  const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0] as
    | [JournalMood, number]
    | undefined;

  return {
    totalDays,
    activityCount: events.length,
    checklistPercent: checklistStats.percent,
    totalExpense,
    averageCost: members.length ? totalExpense / members.length : totalExpense,
    topPayer: topPayerEntry ? { name: topPayerEntry[0], amount: topPayerEntry[1] } : undefined,
    journalCount: journals.length,
    mostCommonMood: topMoodEntry ? topMoodEntry[0] : undefined,
    packingPercent: packingStats.percent
  };
}

export interface TripExport {
  app: "KAT Journey";
  version: 1;
  appVersion?: string;
  exportedAt: string;
  trip: Trip;
  members: Member[];
  events: import("../db").EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals?: JournalEntry[];
  packingItems?: PackingItem[];
  travelDocuments?: import("../db").TravelDocument[];
  backupPlans?: import("../db").BackupPlan[];
}

export function createTripExport({ trip, members, events, expenses, checklist, journals, packingItems, travelDocuments, backupPlans }: TripData): TripExport {
  return {
    app: "KAT Journey",
    version: 1,
    appVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    trip,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans
  };
}

export function safeFileName(value: string, fallback = "kat-trip") {
  if (!value) return fallback;
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || fallback;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function groupedByDate<T extends { date: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((result, item) => {
    result[item.date] = [...(result[item.date] ?? []), item];
    return result;
  }, {});
}

export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
