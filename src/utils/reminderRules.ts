import i18n from "../i18n";
import { Trip, Member, EventItem, Expense, ChecklistItem, TravelDocument } from "../db";
import { today } from "./helpers";

export interface TripReminder {
  id: string;
  type: "info" | "warning" | "success" | "danger";
  title: string;
  description: string;
  actionLabel?: string;
  onClickSection?: "timeline" | "expenses" | "checklist" | "members" | "documents";
}

export function getTripReminders({
  trip,
  members,
  events,
  expenses,
  checklist,
  travelDocuments = []
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  travelDocuments?: TravelDocument[];
}): TripReminder[] {
  const reminders: TripReminder[] = [];
  
  if (!trip.startDate) return reminders;

  const start = new Date(`${trip.startDate}T00:00:00`).getTime();
  const now = new Date(`${today}T00:00:00`).getTime();
  const daysToStart = Math.ceil((start - now) / 86400000);

  // Rule 1: Checklist items incomplete (Show only if trip is upcoming or active)
  if (now <= new Date(`${trip.endDate}T00:00:00`).getTime()) {
    const uncompletedChecklist = checklist.filter(c => !c.completed).length;
    if (uncompletedChecklist > 0) {
      reminders.push({
        id: "checklist_incomplete",
        type: daysToStart <= 2 ? "danger" : "warning",
        title: i18n.t("home.checklistIncompleteTitle"),
        description: i18n.t("home.checklistIncompleteDesc", { count: uncompletedChecklist }),
        actionLabel: i18n.t("home.prepareNow"),
        onClickSection: "checklist"
      });
    } else if (checklist.length === 0) {
      reminders.push({
        id: "checklist_empty",
        type: "info",
        title: i18n.t("home.checklistEmptyTitle"),
        description: i18n.t("home.checklistEmptyDesc"),
        actionLabel: i18n.t("home.createList"),
        onClickSection: "checklist"
      });
    }
  }

  // Rule 2: Emergency documents or ID cards check
  const idDocs = travelDocuments.filter(d => 
    d.type === "document" || 
    d.title.toLowerCase().includes("hộ chiếu") || 
    d.title.toLowerCase().includes("passport") || 
    d.title.toLowerCase().includes("cccd") || 
    d.title.toLowerCase().includes("căn cước") || 
    d.title.toLowerCase().includes("giấy tờ")
  );
  if (idDocs.length === 0 && daysToStart >= 0) {
    reminders.push({
      id: "no_id_documents",
      type: "info",
      title: "Chưa lưu giấy tờ tùy thân",
      description: "Lưu bản sao Hộ chiếu, CCCD hoặc Vé xe/máy bay để tra cứu offline dễ dàng.",
      actionLabel: "Thêm giấy tờ",
      onClickSection: "documents"
    });
  }

  // Rule 4: Weather and charger checks (Starting within 3 days)
  if (daysToStart >= 0 && daysToStart <= 3) {
    reminders.push({
      id: "weather_check",
      type: "info",
      title: "Kiểm tra thời tiết",
      description: "Kiểm tra dự báo thời tiết trước khi xuất phát.",
    });
    
    if (daysToStart <= 1) {
      reminders.push({
        id: "charger_check",
        type: "warning",
        title: "Sạc đầy pin & thiết bị",
        description: "Sạc pin dự phòng, điện thoại và đóng gói bộ sạc vào hành lý xách tay.",
      });
    }
  }

  // Rule 5: Members & Shared expenses check
  if (members.length === 0 && daysToStart >= 0) {
    reminders.push({
      id: "no_members",
      type: "info",
      title: "Chuyến đi chưa có bạn đồng hành",
      description: "Thêm người đồng hành để cùng theo dõi chi phí và chia tiền.",
      actionLabel: "Thêm người đồng hành",
      onClickSection: "members"
    });
  } else if (members.length > 1 && expenses.length === 0 && daysToStart < 0) {
    // Already traveling but no expenses logged yet
    reminders.push({
      id: "shared_expenses_empty",
      type: "info",
      title: "Chưa ghi chép chi phí nhóm",
      description: "Ghi lại các khoản chi chung để app tính toán tự động quyết toán tiền cho cả nhóm.",
      actionLabel: "Ghi chi phí",
      onClickSection: "expenses"
    });
  }

  return reminders;
}
