import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { approveChangeRequest } from '../services/shareApprovalService';
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

  // Keep trip ref updated to prevent stale closures
  const tripRef = useRef(trip);
  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  useEffect(() => {
    if (!trip || !trip.shareToken) {
      setActiveToken(null);
      setPendingRequests([]);
      return;
    }

    let isCancelled = false;
    let channel: any = null;
    const token = trip.shareToken;

    const handleRequestsUpdate = async () => {
      if (isCancelled) return;
      
      const { data: list, error } = await supabase
        .from('change_requests')
        .select('*')
        .eq('share_token', token)
        .in('status', ['pending', 'auto_approved']);

      if (error || !list || isCancelled) return;

      const mappedReqs: AppChangeRequest[] = list.map((r: any) => ({
        id: r.id,
        status: r.status,
        section: r.section,
        action: r.action,
        targetId: r.target_id,
        before: r.before_data,
        after: r.after_data,
        requesterUid: r.requester_uid,
        requesterName: r.requester_name,
        createdAt: r.created_at,
        reviewedAt: r.reviewed_at,
        reviewedByUid: r.reviewed_by_uid
      }));

      // Auto-process auto_approved requests
      const autoReqs = mappedReqs.filter(r => r.status === 'auto_approved');
      autoReqs.forEach(async (req) => {
        if (processingReqs.has(req.id)) return;
        processingReqs.add(req.id);
        try {
          await approveChangeRequest(token, req.id);
        } catch (e) {
          console.error("Auto-approve failed:", e);
        } finally {
          setTimeout(() => {
            processingReqs.delete(req.id);
          }, 2000);
        }
      });

      // Only show pending in UI
      const pendingReqs = mappedReqs.filter(r => r.status === 'pending');
      pendingReqs.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      if (!isCancelled) {
        setPendingRequests(pendingReqs);
      }
    };

    async function initChangeRequestsListener() {
      try {
        // 1. Fetch parent share status
        const { data: shareData, error: shareError } = await supabase
          .from('public_shares')
          .select('token, revoked')
          .eq('token', token)
          .maybeSingle();

        if (shareError || !shareData || shareData.revoked) {
          if (!isCancelled) {
            setActiveToken(null);
            setPendingRequests([]);
          }
          return;
        }

        if (isCancelled) return;

        setActiveToken(shareData.token);
        
        // 2. Initial fetch and load
        await handleRequestsUpdate();

        // 3. Listen to realtime mutations on change requests and public shares
        console.log("[useShareChangeRequests] Subscribing to realtime channel for token:", token);
        channel = supabase.channel(`share-requests-${token}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'public_shares', filter: `token=eq.${token}` }, (payload) => {
            const row = payload.new as any;
            if (payload.eventType === 'DELETE' || !row || row.revoked) {
              if (!isCancelled) {
                setActiveToken(null);
                setPendingRequests([]);
              }
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'change_requests', filter: `share_token=eq.${token}` }, (payload) => {
            console.log("[useShareChangeRequests] Change request event triggered:", payload.eventType);
            handleRequestsUpdate();
          })
          .subscribe();

      } catch (err) {
        console.error("Lỗi khởi tạo listener yêu cầu chỉnh sửa:", err);
      }
    }

    initChangeRequestsListener();

    return () => {
      isCancelled = true;
      if (channel) {
        console.log("[useShareChangeRequests] Cleaning up realtime channel for token:", token);
        supabase.removeChannel(channel);
      }
    };
  }, [trip?.id, trip?.shareToken]);

  return { pendingRequests, activeToken };
}
