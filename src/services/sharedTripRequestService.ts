import { supabase } from '../lib/supabase';

export type ChangeRequestSection = 'activities' | 'expenses' | 'checklist' | 'journals' | 'backupPlans' | 'travelDocuments' | 'members';
export type ChangeRequestAction = 'create' | 'update' | 'delete';

export interface ChangeRequestPayload {
  section: ChangeRequestSection;
  action: ChangeRequestAction;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  requesterName?: string;
  status?: 'pending' | 'auto_approved';
}

export async function submitChangeRequest(token: string, payload: ChangeRequestPayload): Promise<void> {
  // Guest cần session (anonymous) để RLS cho phép INSERT change_request
  // (RLS mới yêu cầu JWT claim share_token phải khớp)
  const { data: { session } } = await supabase.auth.getSession();
  let user = session?.user;
  if (!user) {
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr || !anonData?.user) {
      throw new Error("Vui lòng đăng nhập hoặc mở link chia sẻ hợp lệ trước khi gửi yêu cầu.");
    }
    user = anonData.user;
  }

  // Verify share bằng RPC server-side (thay vì select trực tiếp)
  const { data: verifyData, error: verifyError } = await supabase.rpc('verify_share_access', {
    p_token: token,
    p_pin: null,
  });

  if (verifyError || !verifyData || !verifyData.ok) {
    throw new Error('Link chia sẻ không tồn tại hoặc đã bị thu hồi.');
  }

  if (verifyData.mode !== 'request_edit' && verifyData.mode !== 'edit') {
    throw new Error('Link này không cho phép gửi đề xuất chỉnh sửa.');
  }

  // Check section flags
  const sectionFlagMap: Record<ChangeRequestSection, string | null> = {
    activities: null,
    expenses: 'include_expenses',
    checklist: 'include_checklist',
    journals: 'include_journals',
    backupPlans: 'include_backup_plans',
    travelDocuments: 'include_documents',
    members: null
  };

  const flagName = sectionFlagMap[payload.section];
  if (flagName && verifyData[flagName] !== true) {
    throw new Error('Mục này không được phép chỉnh sửa.');
  }

  function removeUndefined(obj: any): any {
    if (obj === undefined) return null;
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefined);
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = removeUndefined(obj[key]);
      }
    }
    return newObj;
  }

  const sanitizedPayload = removeUndefined(payload);

  const { error: insertError } = await supabase
    .from('change_requests')
    .insert({
      share_token: token,
      section: sanitizedPayload.section,
      action: sanitizedPayload.action,
      target_id: sanitizedPayload.targetId ? String(sanitizedPayload.targetId) : null,
      before_data: sanitizedPayload.before || null,
      after_data: sanitizedPayload.after || null,
      note: sanitizedPayload.note || null,
      requester_name: sanitizedPayload.requesterName || null,
      requester_uid: user.id,
      status: sanitizedPayload.status || 'pending',
      created_at: new Date().toISOString()
    });

  if (insertError) {
    throw new Error("Gửi yêu cầu chỉnh sửa thất bại: " + insertError.message);
  }
}
