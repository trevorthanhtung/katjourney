import { useState, useEffect } from 'react';
import { ensureCloudShareReady } from '../services/cloudShareService';
import { initFirebase, ensureAnonymousUser } from '../lib/firebase';

export function useSharedTrip(token: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubParent: (() => void) | null = null;
    let unsubActivities: (() => void) | null = null;
    let unsubExpenses: (() => void) | null = null;
    let unsubChecklist: (() => void) | null = null;
    let unsubJournals: (() => void) | null = null;
    let unsubBackupPlans: (() => void) | null = null;
    let unsubDocuments: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;
    let unsubRequests: (() => void) | null = null;

    async function setupListeners() {
      try {
        await ensureCloudShareReady();
        await ensureAnonymousUser();
        const { db } = await initFirebase();
        const { doc, collection, onSnapshot, query, where } = await import('firebase/firestore');

        const shareRef = doc(db, 'publicShares', token);

        unsubParent = onSnapshot(shareRef, (docSnap) => {
          if (!docSnap.exists()) {
            setError('Link chia sẻ không tồn tại.');
            setLoading(false);
            return;
          }

          const shareData = docSnap.data();
          if (shareData.revoked) {
            setError('Link chia sẻ đã bị thu hồi bởi người tạo.');
            setLoading(false);
            return;
          }

          setData((prev: any) => ({ ...prev, ...shareData, trip: shareData.trip }));

          // Setup subcollection listeners if not already set up
          if (!unsubMembers) {
            unsubMembers = onSnapshot(collection(shareRef, 'members'), (snap) => {
              setData((prev: any) => ({ ...prev, members: snap.docs.map(d => d.data()) }));
            });
          }
          if (!unsubActivities) {
            unsubActivities = onSnapshot(collection(shareRef, 'activities'), (snap) => {
              const acts = snap.docs.map(d => d.data());
              acts.sort((a: any, b: any) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.time || "").localeCompare(b.time || "");
              });
              setData((prev: any) => ({ ...prev, activities: acts }));
            });
          }
          
          if (shareData.includeExpenses && !unsubExpenses) {
            unsubExpenses = onSnapshot(collection(shareRef, 'expenses'), (snap) => {
              setData((prev: any) => ({ ...prev, expenses: snap.docs.map(d => d.data()) }));
            });
          }
          if (shareData.includeChecklist && !unsubChecklist) {
            unsubChecklist = onSnapshot(collection(shareRef, 'checklist'), (snap) => {
              setData((prev: any) => ({ ...prev, checklist: snap.docs.map(d => d.data()) }));
            });
          }
          if (shareData.includeJournals && !unsubJournals) {
            unsubJournals = onSnapshot(collection(shareRef, 'journals'), (snap) => {
              setData((prev: any) => ({ ...prev, journals: snap.docs.map(d => d.data()) }));
            });
          }
          if (shareData.includeBackupPlans && !unsubBackupPlans) {
            unsubBackupPlans = onSnapshot(collection(shareRef, 'backupPlans'), (snap) => {
              setData((prev: any) => ({ ...prev, backupPlans: snap.docs.map(d => d.data()) }));
            });
          }
          if (shareData.includeDocuments && !unsubDocuments) {
            unsubDocuments = onSnapshot(collection(shareRef, 'travelDocuments'), (snap) => {
              setData((prev: any) => ({ ...prev, travelDocuments: snap.docs.map(d => d.data()) }));
            });
          }

          if (!unsubRequests) {
            const q = query(collection(shareRef, 'changeRequests'), where('status', '==', 'pending'));
            unsubRequests = onSnapshot(q, (snap) => {
              setData((prev: any) => ({ ...prev, changeRequests: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
            });
          }
          
          setLoading(false);
        }, (err) => {
          setError(err.message);
          setLoading(false);
        });

      } catch (err: any) {
        setError(err.message || "Lỗi khi tải dữ liệu chia sẻ.");
        setLoading(false);
      }
    }

    setupListeners();

    return () => {
      if (unsubParent) unsubParent();
      if (unsubActivities) unsubActivities();
      if (unsubExpenses) unsubExpenses();
      if (unsubChecklist) unsubChecklist();
      if (unsubJournals) unsubJournals();
      if (unsubBackupPlans) unsubBackupPlans();
      if (unsubDocuments) unsubDocuments();
      if (unsubMembers) unsubMembers();
      if (unsubRequests) unsubRequests();
    };
  }, [token]);

  return { data, error, loading };
}
