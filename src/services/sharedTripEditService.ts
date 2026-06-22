import { supabase } from '../lib/supabase';

function getTableName(collectionName: string): string {
  const map: Record<string, string> = {
    members: 'share_members',
    activities: 'share_activities',
    expenses: 'share_expenses',
    checklist: 'share_checklist',
    journals: 'share_journals',
    backupPlans: 'share_backup_plans',
    travelDocuments: 'share_travel_documents'
  };
  return map[collectionName] || `share_${collectionName}`;
}

export async function addSharedDocument(token: string, collectionName: string, id: string, payload: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error("Vui lòng đăng nhập.");
  
  const table = getTableName(collectionName);
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from(table)
    .insert({
      id: String(id),
      share_token: token,
      data: payload,
      created_at: now,
      updated_at: now,
      created_by_uid: user.id,
      updated_by_uid: user.id
    });
    
  if (error) {
    throw new Error(`Thêm tài liệu chia sẻ thất bại: ${error.message}`);
  }
}

export async function updateSharedDocument(token: string, collectionName: string, id: string, payload: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error("Vui lòng đăng nhập.");
  
  const table = getTableName(collectionName);
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from(table)
    .update({
      data: payload,
      updated_at: now,
      updated_by_uid: user.id
    })
    .eq('share_token', token)
    .eq('id', String(id));
    
  if (error) {
    throw new Error(`Cập nhật tài liệu chia sẻ thất bại: ${error.message}`);
  }
}

export async function deleteSharedDocument(token: string, collectionName: string, id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error("Vui lòng đăng nhập.");
  
  const table = getTableName(collectionName);
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('share_token', token)
    .eq('id', String(id));
    
  if (error) {
    throw new Error(`Xóa tài liệu chia sẻ thất bại: ${error.message}`);
  }
}

export async function updateSharedTripRoadmaps(token: string, dayRoadmaps: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Vui lòng đăng nhập.");

  // Fetch current trip object
  const { data, error: selectError } = await supabase
    .from('public_shares')
    .select('trip')
    .eq('token', token)
    .maybeSingle();

  if (selectError || !data || !data.trip) {
    throw new Error("Không thể tải thông tin chuyến đi chia sẻ: " + (selectError?.message || "Không tìm thấy dữ liệu"));
  }

  const updatedTrip = { ...data.trip };
  updatedTrip.dayRoadmaps = dayRoadmaps;

  const { error: updateError } = await supabase
    .from('public_shares')
    .update({
      trip: updatedTrip,
      updated_at: new Date().toISOString()
    })
    .eq('token', token);

  if (updateError) {
    throw new Error("Cập nhật sơ đồ lộ trình thất bại: " + updateError.message);
  }
}
