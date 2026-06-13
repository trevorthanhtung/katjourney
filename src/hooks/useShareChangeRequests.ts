import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseEnabled, initFirebase } from '../lib/firebase';

export interface AppChangeRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  section: string;
  action: 'create' | 'update' | 'delete';
  targetId?: string;
  before?: any;
  after?: any;
  requesterUid: string;
  requesterName?: string;
  createdAt: any;
  reviewedAt?: any;
  reviewedByUid?: string;
}

export function useShareChangeRequests(tripId: string) {
  const [pendingRequests, setPendingRequests] = useState<AppChangeRequest[]>([]);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !tripId) return;

    let unsubShare: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    initFirebase().then(({ db: firestoreDb }) => {
      const qShare = query(collection(firestoreDb, 'publicShares'), where('sourceTripId', '==', tripId));
      
      unsubShare = onSnapshot(qShare, (snap) => {
        if (!snap.empty) {
          const shareDoc = snap.docs[0];
          const shareData = shareDoc.data();
          
          if (shareData.revoked) {
            setActiveToken(null);
            setPendingRequests([]);
            if (unsubRequests) unsubRequests();
            return;
          }

          const token = shareData.token || shareDoc.id;
          setActiveToken(token);

          if (unsubRequests) unsubRequests(); // cleanup previous
          const qRequests = query(
            collection(firestoreDb, 'publicShares', token, 'changeRequests'),
            where('status', '==', 'pending')
          );
          
          unsubRequests = onSnapshot(qRequests, (reqSnap) => {
            const reqs = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppChangeRequest));
            reqs.sort((a, b) => {
              const timeA = a.createdAt?.toMillis?.() || 0;
              const timeB = b.createdAt?.toMillis?.() || 0;
              return timeB - timeA;
            });
            setPendingRequests(reqs);
          });

        } else {
          setActiveToken(null);
          setPendingRequests([]);
          if (unsubRequests) unsubRequests();
        }
      });
    });

    return () => {
      if (unsubShare) unsubShare();
      if (unsubRequests) unsubRequests();
    };
  }, [tripId]);

  return { pendingRequests, activeToken };
}
