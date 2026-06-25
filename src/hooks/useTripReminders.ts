import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        text: t('reminders.pendingRequests', { count: pendingRequestsCount }),
        cta: t('reminders.viewRequests'),
        tab: 'share_requests' as any,
        isImportant: true
      });
    }

    // 1. Sắp đi (1-3 ngày)
    if (diffDays >= 1 && diffDays <= 3) {
      reminders.push({
        id: 'upcoming_trip',
        text: t('reminders.upcomingTrip'),
        cta: t('reminders.viewPrep'),
        tab: 'checklist',
        isImportant: true
      });
    }

    // 2. Đang đi
    if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
      reminders.push({
        id: 'ongoing_trip',
        text: t('reminders.ongoingTrip'),
        cta: t('reminders.viewTimeline'),
        tab: 'timeline',
        isImportant: true
      });
    }

    // 3. Checklist chưa xong
    const uncompletedChecklist = checklist.filter(c => !c.completed).length;
    if (uncompletedChecklist > 0) {
      reminders.push({
        id: 'checklist_pending',
        text: t('reminders.checklistPending', { count: uncompletedChecklist }),
        cta: t('reminders.viewPrep'),
        tab: 'checklist'
      });
    }

    // 4. Chưa có giấy tờ cho chuyến sắp đi
    if (diffDays > 0 && travelDocuments.length === 0) {
      reminders.push({
        id: 'missing_docs',
        text: t('reminders.missingDocs'),
        cta: t('reminders.viewDocs'),
        tab: 'documents'
      });
    }

    // 5. Chưa có phương án dự phòng cho lịch trình
    if (events.length > 0 && backupPlans.length === 0) {
      reminders.push({
        id: 'missing_backups',
        text: t('reminders.missingBackups'),
        cta: t('reminders.addBackup'),
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
  }, [trip?.startDate, trip?.endDate, checklist, travelDocuments, events, backupPlans, pendingRequestsCount, t]);
}
