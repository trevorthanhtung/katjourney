import { firebaseEnabled, initFirebase, ensureAnonymousUser } from '../lib/firebase';
import { db as localDb } from '../db';
import { doc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';

export interface ShareOptions {
  includeExpenses: boolean;
  includeJournals: boolean;
  includeChecklist: boolean;
  includeBackupPlans: boolean;
  includeDocuments: boolean;
}

/**
 * Ensures Firebase is ready and configured before attempting cloud actions.
 */
export async function ensureCloudShareReady() {
  if (!firebaseEnabled) {
    throw new Error('Firebase chưa được cấu hình. Vui lòng kiểm tra cài đặt.');
  }
  await initFirebase();
}

/**
 * Helper to split Firestore writes into batches of max 450 operations.
 */
async function commitBatchedWritesInChunks(dbInstance: any, writes: { ref: any; data: any }[]) {
  const CHUNK_SIZE = 450;
  for (let i = 0; i < writes.length; i += CHUNK_SIZE) {
    const chunk = writes.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(dbInstance);
    chunk.forEach((write) => {
      batch.set(write.ref, write.data);
    });
    await batch.commit();
  }
}

/**
 * Creates a view-only share link for a given trip.
 * Generates a public snapshot in Firestore under `publicShares/{token}`.
 */
export async function createViewShareLink(
  tripId: number,
  options: ShareOptions
): Promise<{ token: string; url: string }> {
  await ensureCloudShareReady();
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();

  // 1. Fetch trip data from local Dexie
  const trip = await localDb.trips.get(tripId);
  if (!trip) throw new Error('Không tìm thấy chuyến đi cục bộ.');

  const members = await localDb.members.where('tripId').equals(tripId).toArray();
  const activities = await localDb.events.where('tripId').equals(tripId).toArray();
  
  // Conditionally fetch optional data
  const expenses = options.includeExpenses ? await localDb.expenses.where('tripId').equals(tripId).toArray() : [];
  const checklist = options.includeChecklist ? await localDb.checklist.where('tripId').equals(tripId).toArray() : [];
  const journals = options.includeJournals ? await localDb.journals.where('tripId').equals(tripId).toArray() : [];
  const backupPlans = options.includeBackupPlans ? await localDb.backupPlans.where('tripId').equals(tripId).toArray() : [];
  const travelDocuments = options.includeDocuments ? await localDb.travelDocuments.where('tripId').equals(tripId).toArray() : [];

  // 2. Generate a secure token
  const token = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2, 10);

  const writes: { ref: any; data: any }[] = [];
  const shareRef = doc(db, 'publicShares', token);

  // 3. Parent public share document
  writes.push({
    ref: shareRef,
    data: {
      token,
      ownerUid: user.uid,
      sourceTripId: String(tripId),
      mode: 'view',
      revoked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      includeExpenses: options.includeExpenses,
      includeJournals: options.includeJournals,
      includeChecklist: options.includeChecklist,
      includeBackupPlans: options.includeBackupPlans,
      includeDocuments: options.includeDocuments,
      trip: {
        id: String(trip.id),
        name: trip.title,
        destination: trip.location,
        startDate: trip.startDate,
        endDate: trip.endDate,
      }
    }
  });

  // 4. Subcollections
  members.forEach(m => writes.push({ ref: doc(shareRef, 'members', String(m.id)), data: m }));
  activities.forEach(a => writes.push({ ref: doc(shareRef, 'activities', String(a.id)), data: a }));
  expenses.forEach(e => writes.push({ ref: doc(shareRef, 'expenses', String(e.id)), data: e }));
  checklist.forEach(c => writes.push({ ref: doc(shareRef, 'checklist', String(c.id)), data: c }));
  journals.forEach(j => writes.push({ ref: doc(shareRef, 'journals', String(j.id)), data: j }));
  backupPlans.forEach(b => writes.push({ ref: doc(shareRef, 'backupPlans', String(b.id)), data: b }));
  travelDocuments.forEach(d => writes.push({ ref: doc(shareRef, 'travelDocuments', String(d.id)), data: d }));

  // 5. Commit chunks
  await commitBatchedWritesInChunks(db, writes);

  const url = `${window.location.origin}/share/${token}`;
  return { token, url };
}

/**
 * Revokes an existing share link by setting revoked = true.
 */
export async function revokeShareLink(token: string): Promise<void> {
  await ensureCloudShareReady();
  const { db } = await initFirebase();
  const shareRef = doc(db, 'publicShares', token);
  
  await updateDoc(shareRef, {
    revoked: true,
    updatedAt: serverTimestamp()
  });
}

/**
 * Fetches a public share and its subcollections for read-only viewing.
 */
export async function getViewShareData(token: string) {
  await ensureCloudShareReady();
  await ensureAnonymousUser();
  const { db } = await initFirebase();
  
  // Use dynamic import so we don't increase initial bundle size
  const { getDoc, collection, getDocs } = await import('firebase/firestore');
  
  const shareRef = doc(db, 'publicShares', token);
  const shareSnap = await getDoc(shareRef);
  
  if (!shareSnap.exists()) {
    throw new Error('Link chia sẻ không tồn tại.');
  }
  
  const data = shareSnap.data();
  if (data.revoked) {
    throw new Error('Link chia sẻ đã bị thu hồi bởi người tạo.');
  }
  
  // Fetch subcollections concurrently
  const [
    membersSnap,
    activitiesSnap,
    expensesSnap,
    checklistSnap,
    journalsSnap,
    backupPlansSnap,
    documentsSnap
  ] = await Promise.all([
    getDocs(collection(shareRef, 'members')),
    getDocs(collection(shareRef, 'activities')),
    data.includeExpenses ? getDocs(collection(shareRef, 'expenses')) : { docs: [] },
    data.includeChecklist ? getDocs(collection(shareRef, 'checklist')) : { docs: [] },
    data.includeJournals ? getDocs(collection(shareRef, 'journals')) : { docs: [] },
    data.includeBackupPlans ? getDocs(collection(shareRef, 'backupPlans')) : { docs: [] },
    data.includeDocuments ? getDocs(collection(shareRef, 'travelDocuments')) : { docs: [] },
  ]);

  return {
    ...data,
    members: membersSnap.docs.map(d => d.data()),
    activities: activitiesSnap.docs.map(d => d.data()),
    expenses: expensesSnap.docs.map(d => d.data()),
    checklist: checklistSnap.docs.map(d => d.data()),
    journals: journalsSnap.docs.map(d => d.data()),
    backupPlans: backupPlansSnap.docs.map(d => d.data()),
    travelDocuments: documentsSnap.docs.map(d => d.data()),
  };
}
