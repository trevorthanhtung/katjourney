import { supabase } from './supabase';

/**
 * shareAuth.ts
 * ------------
 * Cấp quyền truy cập share link cho khách KHÔNG cần login Google.
 *
 * Quy trình:
 *   1. signInAnonymously()  — khách tự đăng nhập ẩn danh, có auth.uid()
 *   2. verify_share_access(token, pin)  — server kiểm tra token + PIN
 *   3. updateUser({ data: { share_token } })  — nhét token vào JWT (raw_user_meta_data)
 *   4. RLS đọc JWT claim → chỉ cho phép đọc đúng token đó
 *
 * Nhờ vậy:
 *   - Anonymous chưa verify → claim rỗng → RLS chặn → đọc 0 dòng
 *   - Anonymous đã verify đúng token → chỉ đọc được share đó
 *   - Realtime vẫn hoạt động vì RLS check theo JWT
 */

export interface VerifiedShare {
  ok: boolean;
  token: string;
  mode: 'view' | 'edit' | 'request_edit';
  ownerUid: string;
  sourceTripId: string;
  includeExpenses: boolean;
  includeJournals: boolean;
  includeChecklist: boolean;
  includeBackupPlans: boolean;
  includeDocuments: boolean;
  hasPin: boolean;
  trip: any;
}

export class ShareAuthError extends Error {
  code: 'not_found' | 'invalid_pin' | 'auth_failed' | 'unknown';
  constructor(code: ShareAuthError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'ShareAuthError';
  }
}

/**
 * Đảm bảo user có session (anonymous hoặc authenticated).
 * Nếu chưa có session → signInAnonymously.
 */
async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Đăng nhập ẩn danh (cần bật "Allow anonymous sign-ins" ở Supabase Dashboard)
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new ShareAuthError('auth_failed', 'Không thể tạo phiên khách: ' + error.message);
  }
  return data.session;
}

/**
 * Verify share link + set JWT claim cho session hiện tại.
 * Phải gọi TRƯỚC khi đọc bất kỳ share data nào.
 *
 * @returns metadata của share (mode, includes, trip)
 */
export async function verifyAndAuthShare(
  token: string,
  pin?: string | null
): Promise<VerifiedShare> {
  console.log("[verifyAndAuthShare] START", { token, pin });
  // 1. Đảm bảo có session (anonymous nếu chưa login)
  await ensureSession();

  // 2. Gọi RPC verify_share_access để server kiểm tra token + PIN
  console.log("[verifyAndAuthShare] Calling RPC with", { p_token: token, p_pin: pin ?? null });
  const { data, error } = await supabase.rpc('verify_share_access', {
    p_token: token,
    p_pin: pin ?? null,
  });
  console.log("[verifyAndAuthShare] RPC Response", { data, error });

  if (error) {
    throw new ShareAuthError('unknown', 'Lỗi server khi verify share: ' + error.message);
  }

  if (!data || data.error === 'share_not_found') {
    throw new ShareAuthError('not_found', 'Link chia sẻ không tồn tại hoặc đã bị thu hồi.');
  }
  if (data.error === 'invalid_pin') {
    throw new ShareAuthError('invalid_pin', 'Mã PIN không đúng.');
  }
  if (!data.ok) {
    throw new ShareAuthError('unknown', 'Không thể truy cập link chia sẻ.');
  }

  // 3. Nhét token vào JWT của user (raw_user_meta_data)
  //    RLS sẽ đọc claim này để cấp quyền SELECT đúng token.
  const { error: updErr } = await supabase.auth.updateUser({
    data: { share_token: token },
  });
  if (updErr) {
    throw new ShareAuthError('auth_failed', 'Không thể thiết lập quyền truy cập: ' + updErr.message);
  }

  let parsedTrip = data.trip;
  if (typeof data.trip === 'string') {
    try {
      parsedTrip = JSON.parse(data.trip);
    } catch (e) {
      console.error("Failed to parse trip JSON string:", e);
    }
  }

  return {
    ok: true,
    token: data.token,
    mode: data.mode,
    ownerUid: data.owner_uid,
    sourceTripId: data.source_trip_id,
    includeExpenses: data.include_expenses,
    includeJournals: data.include_journals,
    includeChecklist: data.include_checklist,
    includeBackupPlans: data.include_backup_plans,
    includeDocuments: data.include_documents,
    hasPin: data.has_pin,
    trip: parsedTrip,
  };
}

/**
 * Xóa claim share_token khi rời trang share (tránh leak session giữa các link).
 */
export async function clearShareClaim() {
  try {
    await supabase.auth.updateUser({ data: { share_token: null } });
  } catch {
    /* ignore — có thể user là anonymous không update được */
  }
}
