import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { verifyAndAuthShare, clearShareClaim, ShareAuthError } from '../lib/shareAuth';

export function useSharedTrip(token: string, pin?: string | null, retryCount: number = 0) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let channel: any = null;

    async function setupSharedTrip() {
      try {
        setLoading(true);
        setErrorCode(null);
        setError(null);

        // 1. SERVER-SIDE VERIFY: kiểm tra token + PIN, tự động ghi nhận vào bảng share_access
        //    Sau bước này, RLS mới cho phép đọc data của token này dựa trên bảng share_access.
        let shareData: any;
        try {
          const verified = await verifyAndAuthShare(token, pin);
          // verified đã chứa metadata, dùng trực tiếp
          shareData = {
            token: verified.token,
            revoked: false,
            mode: verified.mode,
            include_expenses: verified.includeExpenses,
            include_journals: verified.includeJournals,
            include_checklist: verified.includeChecklist,
            include_backup_plans: verified.includeBackupPlans,
            include_documents: verified.includeDocuments,
            owner_uid: verified.ownerUid,
            source_trip_id: verified.sourceTripId,
            share_pin: verified.hasPin ? '***' : null,
            trip: verified.trip,
          };
        } catch (e: any) {
          if (e instanceof ShareAuthError) {
            setError(e.message);
            setErrorCode(e.code);
          } else {
            setError(e.message || 'Lỗi khi tải dữ liệu chia sẻ.');
          }
          setLoading(false);
          return;
        }

        if (isCancelled) return;

        // 2. Fetch subcollection rows concurrently
        const [
          membersRes,
          activitiesRes,
          expensesRes,
          checklistRes,
          journalsRes,
          backupPlansRes,
          documentsRes,
          requestsRes
        ] = await Promise.all([
          supabase.from('share_members').select('data').eq('share_token', token),
          supabase.from('share_activities').select('data').eq('share_token', token),
          shareData.include_expenses ? supabase.from('share_expenses').select('data').eq('share_token', token) : { data: [] },
          shareData.include_checklist ? supabase.from('share_checklist').select('data').eq('share_token', token) : { data: [] },
          shareData.include_journals ? supabase.from('share_journals').select('data').eq('share_token', token) : { data: [] },
          shareData.include_backup_plans ? supabase.from('share_backup_plans').select('data').eq('share_token', token) : { data: [] },
          shareData.include_documents ? supabase.from('share_travel_documents').select('data').eq('share_token', token) : { data: [] },
          supabase.from('change_requests').select('*').eq('share_token', token).in('status', ['pending', 'auto_approved'])
        ]);

        if (isCancelled) return;

        const sortedActivities = (activitiesRes.data?.map(d => d.data) || []).sort((a: any, b: any) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return (a.time || "").localeCompare(b.time || "");
        });

        // 3. Set the combined state matching the previous NoSQL format
        setData({
          token: shareData.token,
          revoked: shareData.revoked,
          mode: shareData.mode,
          includeExpenses: shareData.include_expenses,
          includeJournals: shareData.include_journals,
          includeChecklist: shareData.include_checklist,
          includeBackupPlans: shareData.include_backup_plans,
          includeDocuments: shareData.include_documents,
          ownerUid: shareData.owner_uid,
          sourceTripId: shareData.source_trip_id,
          sharePin: shareData.share_pin,
          trip: shareData.trip,
          members: membersRes.data?.map(d => d.data) || [],
          activities: sortedActivities,
          expenses: expensesRes.data?.map(d => d.data) || [],
          checklist: checklistRes.data?.map(d => d.data) || [],
          journals: journalsRes.data?.map(d => d.data) || [],
          backupPlans: backupPlansRes.data?.map(d => d.data) || [],
          travelDocuments: documentsRes.data?.map(d => d.data) || [],
          changeRequests: (requestsRes.data || []).map((r: any) => ({
            id: r.id,
            status: r.status,
            section: r.section,
            action: r.action,
            targetId: r.target_id,
            before: r.before_data,
            after: r.after_data,
            requesterUid: r.requester_uid,
            requesterName: r.requester_name,
            createdAt: r.created_at
          }))
        });

        setLoading(false);

        // Helper to merge list changes
        const handleSubTableEvent = (key: string, payload: any, sortFn?: (a: any, b: any) => number) => {
          const eventType = payload.eventType;
          const row = (eventType === 'DELETE' ? payload.old : payload.new) as any;
          if (!row) return;

          setData((prev: any) => {
            if (!prev) return prev;
            let list = prev[key] || [];
            const itemData = row.data;
            if (!itemData) {
              if (eventType === 'DELETE') {
                list = list.filter((item: any) => String(item.id) !== String(row.id));
              }
              return { ...prev, [key]: list };
            }

            const itemId = String(itemData.id);

            if (eventType === 'INSERT') {
              if (!list.some((item: any) => String(item.id) === itemId)) {
                list = [...list, itemData];
              }
            } else if (eventType === 'UPDATE') {
              list = list.map((item: any) => String(item.id) === itemId ? itemData : item);
            } else if (eventType === 'DELETE') {
              list = list.filter((item: any) => String(item.id) !== itemId);
            }

            if (sortFn) {
              list.sort(sortFn);
            }

            return { ...prev, [key]: list };
          });
        };

        // 4. Listen in realtime for database updates
        console.log("[useSharedTrip] Subscribing to realtime channel for token:", token);
        channel = supabase.channel(`shared-trip-${token}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'public_shares', filter: `token=eq.${token}` }, (payload) => {
            if (payload.eventType === 'DELETE' || (payload.new as any).revoked) {
              setError('Link chia sẻ đã bị thu hồi bởi người tạo.');
              return;
            }
            const updated = payload.new as any;
            setData((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                revoked: updated.revoked,
                mode: updated.mode,
                includeExpenses: updated.include_expenses,
                includeJournals: updated.include_journals,
                includeChecklist: updated.include_checklist,
                includeBackupPlans: updated.include_backup_plans,
                includeDocuments: updated.include_documents,
                ownerUid: updated.owner_uid,
                sourceTripId: updated.source_trip_id,
                sharePin: updated.share_pin,
                trip: updated.trip
              };
            });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_members', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('members', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_activities', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('activities', payload, (a: any, b: any) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return (a.time || "").localeCompare(b.time || "");
            });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_expenses', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('expenses', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_checklist', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('checklist', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_journals', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('journals', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_backup_plans', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('backupPlans', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'share_travel_documents', filter: `share_token=eq.${token}` }, (payload) => {
            handleSubTableEvent('travelDocuments', payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'change_requests', filter: `share_token=eq.${token}` }, (payload) => {
            const eventType = payload.eventType;
            const row = (eventType === 'DELETE' ? payload.old : payload.new) as any;
            if (!row) return;

            setData((prev: any) => {
              if (!prev) return prev;
              let list = prev.changeRequests || [];
              
              if (eventType === 'INSERT') {
                const mapped = {
                  id: row.id,
                  status: row.status,
                  section: row.section,
                  action: row.action,
                  targetId: row.target_id,
                  before: row.before_data,
                  after: row.after_data,
                  requesterUid: row.requester_uid,
                  requesterName: row.requester_name,
                  createdAt: row.created_at
                };
                if (!list.some((r: any) => r.id === mapped.id)) {
                  list = [...list, mapped];
                }
              } else if (eventType === 'UPDATE') {
                list = list.map((r: any) => r.id === row.id ? {
                  ...r,
                  status: row.status,
                  reviewedAt: row.reviewed_at,
                  reviewedByUid: row.reviewed_by_uid
                } : r);
              } else if (eventType === 'DELETE') {
                list = list.filter((r: any) => r.id !== row.id);
              }

              const filtered = list.filter((r: any) => r.status === 'pending' || r.status === 'auto_approved');
              return { ...prev, changeRequests: filtered };
            });
          })
          .subscribe();

      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Lỗi khi tải dữ liệu chia sẻ.");
          setLoading(false);
        }
      }
    }

    setupSharedTrip();

    return () => {
      isCancelled = true;
      if (channel) {
        console.log("[useSharedTrip] Cleaning up realtime channel for token:", token);
        supabase.removeChannel(channel);
      }
      // Xóa claim share_token khi rời trang share
      clearShareClaim();
    };
  }, [token, pin, retryCount]);

  return { data, error, errorCode, loading };
}
