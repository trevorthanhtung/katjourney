import { useMemo } from 'react';
import { ChecklistItem, EventItem, Trip, BackupPlan, TravelDocument } from '../db';

export interface TripReminder {
  id: string;
  text: string;
  cta: string;
  tab: 'timeline' | 'expenses' | 'checklist' | 'documents' | 'journal' | 'wrapped';
  isImportant?: boolean;
}

interface UseTripRemindersProps {
  trip?: Trip | null;
  checklist: ChecklistItem[];
  travelDocuments: TravelDocument[];
  events: EventItem[];
  backupPlans: BackupPlan[];
  pendingRequestsCount?: number;
}

export function useTripReminders({ trip, checklist, travelDocuments, events, backupPlans, pendingRequestsCount }: UseTripRemindersProps) {
  return useMemo(() => {
    const reminders: TripReminder[] = [];
    
    if (!trip || !trip.startDate || !trip.endDate) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(trip.endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 0. Pending share requests (Highest priority)
    if (pendingRequestsCount && pendingRequestsCount > 0) {
      reminders.push({
        id: 'share_requests',
        text: `Có ${pendingRequestsCount} yêu cầu chỉnh sửa đang chờ duyệt.`,
        cta: 'Xem yêu cầu',
        tab: 'share_requests' as any,
        isImportant: true
      });
    }

    // 1. Sắp đi (1-3 ngày)
    if (diffDays >= 1 && diffDays <= 3) {
      reminders.push({
        id: 'upcoming_trip',
        text: 'Chuyến đi sắp bắt đầu. Kiểm tra lại giấy tờ và hành lý.',
        cta: 'Xem chuẩn bị',
        tab: 'checklist',
        isImportant: true
      });
    }

    // 2. Đang đi
    if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
      reminders.push({
        id: 'ongoing_trip',
        text: 'Hôm nay là một ngày trong chuyến đi. Kiểm tra lịch trình và phương án dự phòng.',
        cta: 'Xem lịch trình',
        tab: 'timeline',
        isImportant: true
      });
    }

    // 3. Checklist chưa xong
    const uncompletedChecklist = checklist.filter(c => !c.completed).length;
    if (uncompletedChecklist > 0) {
      reminders.push({
        id: 'checklist_pending',
        text: `Bạn còn ${uncompletedChecklist} việc chuẩn bị chưa hoàn thành.`,
        cta: 'Xem chuẩn bị',
        tab: 'checklist'
      });
    }

    // 4. Chưa có giấy tờ cho chuyến sắp đi
    if (diffDays > 0 && travelDocuments.length === 0) {
      reminders.push({
        id: 'missing_docs',
        text: 'Chưa có giấy tờ hoặc thông tin đặt chỗ nào cho chuyến đi này.',
        cta: 'Xem giấy tờ',
        tab: 'documents'
      });
    }

    // 5. Chưa có phương án dự phòng cho lịch trình
    if (events.length > 0 && backupPlans.length === 0) {
      reminders.push({
        id: 'missing_backups',
        text: 'Bạn có thể thêm phương án dự phòng cho các hoạt động quan trọng.',
        cta: 'Thêm dự phòng',
        tab: 'timeline'
      });
    }

    // Ưu tiên important lên đầu
    reminders.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return 0;
    });

    return reminders.slice(0, 4);
  }, [trip?.startDate, trip?.endDate, checklist, travelDocuments, events, backupPlans, pendingRequestsCount]);
}
