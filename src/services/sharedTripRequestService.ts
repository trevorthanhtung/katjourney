import { ensureCloudShareReady } from './cloudShareService';
import { initFirebase, ensureAnonymousUser } from '../lib/firebase';

export type ChangeRequestSection = 'activities' | 'expenses' | 'checklist' | 'journals' | 'backupPlans' | 'travelDocuments';
export type ChangeRequestAction = 'create' | 'update' | 'delete';

export interface ChangeRequestPayload {
  section: ChangeRequestSection;
  action: ChangeRequestAction;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  requesterName?: string;
}

export async function submitChangeRequest(token: string, payload: ChangeRequestPayload): Promise<void> {
  await ensureCloudShareReady();
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const { doc, getDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  const shareRef = doc(db, 'publicShares', token);
  const shareSnap = await getDoc(shareRef);

  if (!shareSnap.exists()) {
    throw new Error('Link chia sẻ không tồn tại.');
  }

  const shareData = shareSnap.data();

  if (shareData.revoked) {
    throw new Error('Link chia sẻ đã bị thu hồi.');
  }

  if (shareData.mode !== 'request_edit' && shareData.mode !== 'edit') {
    throw new Error('Link này không cho phép gửi đề xuất chỉnh sửa.');
  }

  // Check section flags
  const sectionFlagMap: Record<ChangeRequestSection, string | null> = {
    activities: null, // Always included
    expenses: 'includeExpenses',
    checklist: 'includeChecklist',
    journals: 'includeJournals',
    backupPlans: 'includeBackupPlans',
    travelDocuments: 'includeDocuments'
  };

  const flagName = sectionFlagMap[payload.section];
  if (flagName && shareData[flagName] !== true) {
    throw new Error('Mục này không được phép chỉnh sửa.');
  }

  const changeRequestsRef = collection(shareRef, 'changeRequests');
  await addDoc(changeRequestsRef, {
    token,
    ...payload,
    requesterUid: user.uid,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}
