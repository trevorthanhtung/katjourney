import { firebaseEnabled, initFirebase, ensureAnonymousUser } from '../lib/firebase';
import { db as localDb } from '../db';

export interface ShareOptions {
  mode: "view" | "edit" | "request_edit";
  includeExpenses: boolean;
  includeJournals: boolean;
  includeChecklist: boolean;
  includeBackupPlans: boolean;
  includeDocuments: boolean;
  sharePin?: string;
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
  const { writeBatch } = await import('firebase/firestore');
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
 * Creates a share link for a given trip.
 * Generates a public snapshot in Firestore under `publicShares/{token}`.
 */
export async function createShareLink(
  tripId: number,
  options: ShareOptions
): Promise<{ token: string; url: string }> {
  await ensureCloudShareReady();
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

  // 1. Fetch trip data from local Dexie
  const trip = await localDb.trips.get(tripId);
  if (!trip) throw new Error('Không tìm thấy chuyến đi cục bộ.');

  const members = await localDb.members.where('tripId').equals(tripId).toArray();
  const activities = await localDb.events.where('tripId').equals(tripId).toArray();
  
  // Conditionally fetch optional data
  const expenses = options.includeExpenses ? await localDb.expenses.where('tripId').equals(tripId).toArray() : [];
  const checklistRaw = options.includeChecklist ? await localDb.checklist.where('tripId').equals(tripId).toArray() : [];
  const checklist = checklistRaw.filter(c => !c.isPrivate);
  const journals = options.includeJournals ? await localDb.journals.where('tripId').equals(tripId).toArray() : [];
  const backupPlans = options.includeBackupPlans ? await localDb.backupPlans.where('tripId').equals(tripId).toArray() : [];
  const travelDocumentsRaw = options.includeDocuments ? await localDb.travelDocuments.where('tripId').equals(tripId).toArray() : [];
  const travelDocuments = travelDocumentsRaw.filter(d => !d.isPrivate);

  const randomUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

  // 2. Generate a secure token
  const token = randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2, 10);
  const shareRef = doc(db, 'publicShares', token);

  // 3. Parent public share document (Write this first so rules using get() pass)
  console.log("[CloudShare] Attempting to set parent document...");
  await setDoc(shareRef, {
    token,
    ownerUid: user.uid,
    sourceTripId: String(tripId),
    mode: options.mode,
    revoked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    includeExpenses: options.includeExpenses,
    includeJournals: options.includeJournals,
    includeChecklist: options.includeChecklist,
    includeBackupPlans: options.includeBackupPlans,
    includeDocuments: options.includeDocuments,
    sharePin: options.sharePin || null,
    trip: {
      id: String(trip.id),
      name: trip.title,
      destination: trip.location,
      latitude: trip.latitude || null,
      longitude: trip.longitude || null,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tripType: trip.tripType || "multiDay",
      dayRoadmaps: trip.dayRoadmaps || null,
      status: trip.status || "active",
    }
  });

  // 4. Update local trip with shareToken
  await localDb.trips.update(tripId, { shareToken: token });

  console.log("[CloudShare] Done creating link:", token);

  const writes: { ref: any; data: any }[] = [];

  // 4. Subcollections
  // We append createdAt, updatedAt, createdByUid, updatedByUid for audit trails in Phase 3A
  const timestamp = serverTimestamp();
  const auditFields = { createdAt: timestamp, updatedAt: timestamp, createdByUid: user.uid, updatedByUid: user.uid };
  
  // Helper to remove undefined values which Firestore rejects
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  members.forEach(m => writes.push({ ref: doc(shareRef, 'members', String(m.id)), data: { ...sanitize(m), ...auditFields } }));
  activities.forEach(a => writes.push({ ref: doc(shareRef, 'activities', String(a.id)), data: { ...sanitize(a), ...auditFields } }));
  expenses.forEach(e => writes.push({ ref: doc(shareRef, 'expenses', String(e.id)), data: { ...sanitize(e), ...auditFields } }));
  checklist.forEach(c => writes.push({ ref: doc(shareRef, 'checklist', String(c.id)), data: { ...sanitize(c), ...auditFields } }));
  journals.forEach(j => writes.push({ ref: doc(shareRef, 'journals', String(j.id)), data: { ...sanitize(j), ...auditFields } }));
  backupPlans.forEach(b => writes.push({ ref: doc(shareRef, 'backupPlans', String(b.id)), data: { ...sanitize(b), ...auditFields } }));
  travelDocuments.forEach(d => writes.push({ ref: doc(shareRef, 'travelDocuments', String(d.id)), data: { ...sanitize(d), ...auditFields } }));

  // 5. Commit chunks
  console.log("[CloudShare] Attempting to commit subcollections...");
  await commitBatchedWritesInChunks(db, writes);
  console.log("[CloudShare] Subcollections committed successfully.");

  const url = `${window.location.origin}/share/${token}`;
  return { token, url };
}

/**
 * Updates an existing share link with current local data.
 */
export async function updateShareLink(
  tripId: number,
  token: string,
  options: ShareOptions
): Promise<void> {
  await ensureCloudShareReady();
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

  const shareRef = doc(db, 'publicShares', token);
  const snap = await getDoc(shareRef);
  
  if (!snap.exists() || snap.data().ownerUid !== user.uid) {
    throw new Error('Bạn không có quyền cập nhật link chia sẻ này.');
  }

  // 1. Fetch trip data from local Dexie
  const trip = await localDb.trips.get(tripId);
  if (!trip) throw new Error('Không tìm thấy chuyến đi cục bộ.');

  const members = await localDb.members.where('tripId').equals(tripId).toArray();
  const activities = await localDb.events.where('tripId').equals(tripId).toArray();
  
  // Conditionally fetch optional data
  const expenses = options.includeExpenses ? await localDb.expenses.where('tripId').equals(tripId).toArray() : [];
  const checklistRaw = options.includeChecklist ? await localDb.checklist.where('tripId').equals(tripId).toArray() : [];
  const checklist = checklistRaw.filter(c => !c.isPrivate);
  const journals = options.includeJournals ? await localDb.journals.where('tripId').equals(tripId).toArray() : [];
  const backupPlans = options.includeBackupPlans ? await localDb.backupPlans.where('tripId').equals(tripId).toArray() : [];
  const travelDocumentsRaw = options.includeDocuments ? await localDb.travelDocuments.where('tripId').equals(tripId).toArray() : [];
  const travelDocuments = travelDocumentsRaw.filter(d => !d.isPrivate);

  console.log("[CloudShare] Attempting to update parent document...");
  await updateDoc(shareRef, {
    mode: options.mode,
    updatedAt: serverTimestamp(),
    includeExpenses: options.includeExpenses,
    includeJournals: options.includeJournals,
    includeChecklist: options.includeChecklist,
    includeBackupPlans: options.includeBackupPlans,
    includeDocuments: options.includeDocuments,
    sharePin: options.sharePin || null,
    trip: {
      id: String(trip.id),
      name: trip.title,
      destination: trip.location,
      latitude: trip.latitude || null,
      longitude: trip.longitude || null,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tripType: trip.tripType || "multiDay",
      dayRoadmaps: trip.dayRoadmaps || null,
      status: trip.status || "active",
    }
  });

  const writes: { ref: any; data: any }[] = [];
  const timestamp = serverTimestamp();
  const auditFields = { updatedAt: timestamp, updatedByUid: user.uid };
  
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  members.forEach(m => writes.push({ ref: doc(shareRef, 'members', String(m.id)), data: { ...sanitize(m), ...auditFields } }));
  activities.forEach(a => writes.push({ ref: doc(shareRef, 'activities', String(a.id)), data: { ...sanitize(a), ...auditFields } }));
  expenses.forEach(e => writes.push({ ref: doc(shareRef, 'expenses', String(e.id)), data: { ...sanitize(e), ...auditFields } }));
  checklist.forEach(c => writes.push({ ref: doc(shareRef, 'checklist', String(c.id)), data: { ...sanitize(c), ...auditFields } }));
  journals.forEach(j => writes.push({ ref: doc(shareRef, 'journals', String(j.id)), data: { ...sanitize(j), ...auditFields } }));
  backupPlans.forEach(b => writes.push({ ref: doc(shareRef, 'backupPlans', String(b.id)), data: { ...sanitize(b), ...auditFields } }));
  travelDocuments.forEach(d => writes.push({ ref: doc(shareRef, 'travelDocuments', String(d.id)), data: { ...sanitize(d), ...auditFields } }));

  console.log("[CloudShare] Attempting to commit subcollections updates...");
  await commitBatchedWritesInChunks(db, writes);
  console.log("[CloudShare] Subcollections updates committed successfully.");
}

/**
 * Revokes an existing share link by setting revoked = true.
 */
export async function revokeShareLink(tripId: number, token: string): Promise<void> {
  await ensureCloudShareReady();
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

  const shareRef = doc(db, 'publicShares', token);
  const snap = await getDoc(shareRef);
  
  if (snap.exists() && snap.data().ownerUid === user.uid) {
    await updateDoc(shareRef, {
      revoked: true,
      updatedAt: serverTimestamp()
    });
  }

  // Clear local shareToken
  await localDb.trips.update(tripId, { shareToken: undefined });
}

/**
 * Fetches a public share and its subcollections for read-only viewing.
 */
export async function getViewShareData(token: string) {
  await ensureCloudShareReady();
  await ensureAnonymousUser();
  const { db } = await initFirebase();
  
  // Use dynamic import so we don't increase initial bundle size
  const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
  
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
