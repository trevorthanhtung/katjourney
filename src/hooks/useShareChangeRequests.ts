import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { firebaseEnabled, initFirebase } from '../lib/firebase';
import { Trip } from '../db';

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

export function useShareChangeRequests(trip: Trip | undefined) {
  const [pendingRequests, setPendingRequests] = useState<AppChangeRequest[]>([]);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !trip || !trip.shareToken) {
      setActiveToken(null);
      setPendingRequests([]);
      return;
    }

    let unsubShare: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    initFirebase().then(({ db: firestoreDb }) => {
      const shareRef = doc(firestoreDb, 'publicShares', trip.shareToken!);
      
      unsubShare = onSnapshot(shareRef, (shareSnap) => {
        if (shareSnap.exists()) {
          const shareData = shareSnap.data();
          
          if (shareData.revoked) {
            setActiveToken(null);
            setPendingRequests([]);
            if (unsubRequests) unsubRequests();
            return;
          }

          const token = shareData.token || shareSnap.id;
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
  }, [trip?.id, trip?.shareToken]);

  return { pendingRequests, activeToken };
}
