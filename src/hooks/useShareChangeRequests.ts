import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { approveChangeRequest } from '../services/shareApprovalService';
import { firebaseEnabled, initFirebase } from '../lib/firebase';
import { Trip } from '../db';

const processingReqs = new Set<string>();

export interface AppChangeRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
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
            where('status', 'in', ['pending', 'auto_approved'])
          );
          
          unsubRequests = onSnapshot(qRequests, (reqSnap) => {
            const allReqs = reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppChangeRequest));
            
            // Auto-process auto_approved requests
            const autoReqs = allReqs.filter(r => r.status === 'auto_approved');
            autoReqs.forEach(async (req) => {
              if (processingReqs.has(req.id)) return;
              processingReqs.add(req.id);
              try {
                await approveChangeRequest(token, req.id);
              } catch (e) {
                console.error("Auto-approve failed:", e);
              } finally {
                // We keep it in the set for a little while to prevent race conditions
                // if the snapshot fires again before the update is fully committed
                setTimeout(() => {
                  processingReqs.delete(req.id);
                }, 2000);
              }
            });

            // Only show pending in UI
            const pendingReqs = allReqs.filter(r => r.status === 'pending');
            pendingReqs.sort((a, b) => {
              const timeA = a.createdAt?.toMillis?.() || 0;
              const timeB = b.createdAt?.toMillis?.() || 0;
              return timeB - timeA;
            });
            setPendingRequests(pendingReqs);
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
