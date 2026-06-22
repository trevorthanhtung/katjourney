import { supabase } from '../lib/supabase';
import { db as localDb } from '../db';
import { decryptObject } from '../lib/crypto';

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
 * Ensures Supabase is initialized.
 */
export async function ensureCloudShareReady() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
}

/**
 * Creates a share link for a given trip.
 * Generates a public snapshot in Supabase under `public_shares` and sub-tables.
 */
export async function createShareLink(
  tripId: number,
  options: ShareOptions
): Promise<{ token: string; url: string }> {
  await ensureCloudShareReady();
  
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    throw new Error('Vui lòng đăng nhập/đăng ký khách trước khi chia sẻ.');
  }

  // 1. Fetch trip data from local Dexie and decrypt
  const tripRaw = await localDb.trips.get(tripId);
  if (!tripRaw) throw new Error('Không tìm thấy chuyến đi cục bộ.');
  const trip = decryptObject(tripRaw);

  const membersRaw = await localDb.members.where('tripId').equals(tripId).toArray();
  const members = membersRaw.map(m => decryptObject(m));

  const activitiesRaw = await localDb.events.where('tripId').equals(tripId).toArray();
  const activities = activitiesRaw.map(a => decryptObject(a));
  
  // Conditionally fetch optional data
  const expensesRaw = options.includeExpenses ? await localDb.expenses.where('tripId').equals(tripId).toArray() : [];
  const expenses = expensesRaw.map(e => decryptObject(e));

  const checklistRaw = options.includeChecklist ? await localDb.checklist.where('tripId').equals(tripId).toArray() : [];
  const checklist = checklistRaw.filter(c => !c.isPrivate).map(c => decryptObject(c));

  const journalsRaw = options.includeJournals ? await localDb.journals.where('tripId').equals(tripId).toArray() : [];
  const journals = journalsRaw.map(j => decryptObject(j));

  const backupPlansRaw = options.includeBackupPlans ? await localDb.backupPlans.where('tripId').equals(tripId).toArray() : [];
  const backupPlans = backupPlansRaw.map(b => decryptObject(b));

  const travelDocumentsRaw = options.includeDocuments ? await localDb.travelDocuments.where('tripId').equals(tripId).toArray() : [];
  const travelDocuments = travelDocumentsRaw.filter(d => !d.isPrivate).map(d => decryptObject(d));

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

  // 3. Parent public share row
  console.log("[CloudShare] Attempting to set parent document in Supabase...");
  const { error: parentError } = await supabase
    .from('public_shares')
    .insert({
      token,
      owner_uid: user.id,
      source_trip_id: String(tripId),
      mode: options.mode,
      revoked: false,
      include_expenses: options.includeExpenses,
      include_journals: options.includeJournals,
      include_checklist: options.includeChecklist,
      include_backup_plans: options.includeBackupPlans,
      include_documents: options.includeDocuments,
      share_pin: options.sharePin || null,
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

  if (parentError) {
    throw new Error('Không thể tạo liên kết chia sẻ trên Supabase: ' + parentError.message);
  }

  // 4. Update local trip with shareToken
  await localDb.trips.update(tripId, { shareToken: token });

  // 5. Bulk upload subcollection data
  const now = new Date().toISOString();
  const auditFields = { created_at: now, updated_at: now, created_by_uid: user.id, updated_by_uid: user.id };
  
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  const mapToTable = (list: any[]) => list.map(item => ({
    id: String(item.id),
    share_token: token,
    data: sanitize(item),
    ...auditFields
  }));

  const uploadChunks = async () => {
    if (members.length > 0) await supabase.from('share_members').insert(mapToTable(members));
    if (activities.length > 0) await supabase.from('share_activities').insert(mapToTable(activities));
    if (expenses.length > 0) await supabase.from('share_expenses').insert(mapToTable(expenses));
    if (checklist.length > 0) await supabase.from('share_checklist').insert(mapToTable(checklist));
    if (journals.length > 0) await supabase.from('share_journals').insert(mapToTable(journals));
    if (backupPlans.length > 0) await supabase.from('share_backup_plans').insert(mapToTable(backupPlans));
    if (travelDocuments.length > 0) await supabase.from('share_travel_documents').insert(mapToTable(travelDocuments));
  };

  console.log("[CloudShare] Uploading shared items...");
  await uploadChunks();
  console.log("[CloudShare] Upload completed successfully.");

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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Vui lòng đăng nhập.');

  // Validate owner
  const { data: shareData, error: fetchError } = await supabase
    .from('public_shares')
    .select('owner_uid')
    .eq('token', token)
    .maybeSingle();

  if (fetchError || !shareData || shareData.owner_uid !== user.id) {
    throw new Error('Bạn không có quyền cập nhật link chia sẻ này.');
  }

  // 1. Fetch trip data from local Dexie and decrypt
  const tripRaw = await localDb.trips.get(tripId);
  if (!tripRaw) throw new Error('Không tìm thấy chuyến đi cục bộ.');
  const trip = decryptObject(tripRaw);

  const membersRaw = await localDb.members.where('tripId').equals(tripId).toArray();
  const members = membersRaw.map(m => decryptObject(m));

  const activitiesRaw = await localDb.events.where('tripId').equals(tripId).toArray();
  const activities = activitiesRaw.map(a => decryptObject(a));
  
  // Conditionally fetch optional data
  const expensesRaw = options.includeExpenses ? await localDb.expenses.where('tripId').equals(tripId).toArray() : [];
  const expenses = expensesRaw.map(e => decryptObject(e));

  const checklistRaw = options.includeChecklist ? await localDb.checklist.where('tripId').equals(tripId).toArray() : [];
  const checklist = checklistRaw.filter(c => !c.isPrivate).map(c => decryptObject(c));

  const journalsRaw = options.includeJournals ? await localDb.journals.where('tripId').equals(tripId).toArray() : [];
  const journals = journalsRaw.map(j => decryptObject(j));

  const backupPlansRaw = options.includeBackupPlans ? await localDb.backupPlans.where('tripId').equals(tripId).toArray() : [];
  const backupPlans = backupPlansRaw.map(b => decryptObject(b));

  const travelDocumentsRaw = options.includeDocuments ? await localDb.travelDocuments.where('tripId').equals(tripId).toArray() : [];
  const travelDocuments = travelDocumentsRaw.filter(d => !d.isPrivate).map(d => decryptObject(d));

  console.log("[CloudShare] Attempting to update parent row...");
  const { error: parentUpdateError } = await supabase
    .from('public_shares')
    .update({
      mode: options.mode,
      updated_at: new Date().toISOString(),
      include_expenses: options.includeExpenses,
      include_journals: options.includeJournals,
      include_checklist: options.includeChecklist,
      include_backup_plans: options.includeBackupPlans,
      include_documents: options.includeDocuments,
      share_pin: options.sharePin || null,
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
    })
    .eq('token', token);

  if (parentUpdateError) {
    throw new Error('Lỗi cập nhật bảng public_shares: ' + parentUpdateError.message);
  }

  // 2. Clear old items
  console.log("[CloudShare] Clearing existing items in cloud...");
  await Promise.all([
    supabase.from('share_members').delete().eq('share_token', token),
    supabase.from('share_activities').delete().eq('share_token', token),
    supabase.from('share_expenses').delete().eq('share_token', token),
    supabase.from('share_checklist').delete().eq('share_token', token),
    supabase.from('share_journals').delete().eq('share_token', token),
    supabase.from('share_backup_plans').delete().eq('share_token', token),
    supabase.from('share_travel_documents').delete().eq('share_token', token)
  ]);

  // 3. Insert new items
  const now = new Date().toISOString();
  const auditFields = { created_at: now, updated_at: now, created_by_uid: user.id, updated_by_uid: user.id };
  
  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  const mapToTable = (list: any[]) => list.map(item => ({
    id: String(item.id),
    share_token: token,
    data: sanitize(item),
    ...auditFields
  }));

  const uploadChunks = async () => {
    if (members.length > 0) await supabase.from('share_members').insert(mapToTable(members));
    if (activities.length > 0) await supabase.from('share_activities').insert(mapToTable(activities));
    if (expenses.length > 0) await supabase.from('share_expenses').insert(mapToTable(expenses));
    if (checklist.length > 0) await supabase.from('share_checklist').insert(mapToTable(checklist));
    if (journals.length > 0) await supabase.from('share_journals').insert(mapToTable(journals));
    if (backupPlans.length > 0) await supabase.from('share_backup_plans').insert(mapToTable(backupPlans));
    if (travelDocuments.length > 0) await supabase.from('share_travel_documents').insert(mapToTable(travelDocuments));
  };

  console.log("[CloudShare] Uploading updated shared items...");
  await uploadChunks();
  console.log("[CloudShare] Subcollections updates committed successfully.");
}

/**
 * Revokes an existing share link by setting revoked = true.
 */
export async function revokeShareLink(tripId: number, token: string): Promise<void> {
  await ensureCloudShareReady();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { error } = await supabase
    .from('public_shares')
    .update({
      revoked: true,
      updated_at: new Date().toISOString()
    })
    .eq('token', token)
    .eq('owner_uid', user.id);

  if (!error) {
    // Clear local shareToken
    await localDb.trips.update(tripId, { shareToken: undefined });
  }
}

/**
 * Fetches a public share and its subcollections for read-only viewing.
 */
export async function getViewShareData(token: string) {
  await ensureCloudShareReady();
  
  const { data: shareData, error: shareError } = await supabase
    .from('public_shares')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  
  if (shareError || !shareData) {
    throw new Error('Link chia sẻ không tồn tại.');
  }
  
  if (shareData.revoked) {
    throw new Error('Link chia sẻ đã bị thu hồi bởi người tạo.');
  }
  
  // Fetch subcollections concurrently
  const [
    membersRes,
    activitiesRes,
    expensesRes,
    checklistRes,
    journalsRes,
    backupPlansRes,
    documentsRes
  ] = await Promise.all([
    supabase.from('share_members').select('data').eq('share_token', token),
    supabase.from('share_activities').select('data').eq('share_token', token),
    shareData.include_expenses ? supabase.from('share_expenses').select('data').eq('share_token', token) : { data: [] },
    shareData.include_checklist ? supabase.from('share_checklist').select('data').eq('share_token', token) : { data: [] },
    shareData.include_journals ? supabase.from('share_journals').select('data').eq('share_token', token) : { data: [] },
    shareData.include_backup_plans ? supabase.from('share_backup_plans').select('data').eq('share_token', token) : { data: [] },
    shareData.include_documents ? supabase.from('share_travel_documents').select('data').eq('share_token', token) : { data: [] },
  ]);

  return {
    ...shareData,
    includeExpenses: shareData.include_expenses,
    includeJournals: shareData.include_journals,
    includeChecklist: shareData.include_checklist,
    includeBackupPlans: shareData.include_backup_plans,
    includeDocuments: shareData.include_documents,
    ownerUid: shareData.owner_uid,
    sourceTripId: shareData.source_trip_id,
    sharePin: shareData.share_pin,
    members: membersRes.data?.map(d => d.data) || [],
    activities: activitiesRes.data?.map(d => d.data) || [],
    expenses: expensesRes.data?.map(d => d.data) || [],
    checklist: checklistRes.data?.map(d => d.data) || [],
    journals: journalsRes.data?.map(d => d.data) || [],
    backupPlans: backupPlansRes.data?.map(d => d.data) || [],
    travelDocuments: documentsRes.data?.map(d => d.data) || [],
  };
}
