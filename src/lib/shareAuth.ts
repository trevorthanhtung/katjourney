import i18n from "../i18n";
import { supabase } from "./supabase";

/**
 * shareAuth.ts
 * ------------
 * Cấp quyền truy cập share link cho khách KHÔNG cần login Google.
 *
 * Quy trình mới (Sử dụng bảng share_access server-trusted):
 *   1. signInAnonymously()  — khách tự đăng nhập ẩn danh, có auth.uid()
 *   2. verify_share_access(token, pin)  — server kiểm tra token + PIN và tự động insert vào bảng share_access
 *   3. RLS đọc bảng share_access thay vì JWT claim → chỉ cho phép đọc đúng token đó
 *
 * Nhờ vậy:
 *   - Tránh việc Anonymous tự update user_metadata để bypass PIN
 *   - Anonymous chưa verify → không có record trong share_access → RLS chặn
 *   - Anonymous đã verify đúng token → có record trong share_access → đọc được share đó
 */

export interface VerifiedShare {
  ok: boolean;
  token: string;
  mode: "view" | "edit" | "request_edit";
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
  code: "not_found" | "invalid_pin" | "auth_failed" | "unknown";
  constructor(code: ShareAuthError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ShareAuthError";
  }
}

/**
 * Đảm bảo user có session (anonymous hoặc authenticated).
 * Nếu chưa có session → signInAnonymously.
 */
async function ensureSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session;

  // Đăng nhập ẩn danh (cần bật "Allow anonymous sign-ins" ở Supabase Dashboard)
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new ShareAuthError(
      "auth_failed",
      i18n.t("share.errorCreateSession", "Cannot create guest session: ") + error.message
    );
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
  const { data, error } = await supabase.rpc("verify_share_access", {
    p_token: token,
    p_pin: pin ?? null,
  });
  console.log("[verifyAndAuthShare] RPC Response", { data, error });

  if (error) {
    throw new ShareAuthError(
      "unknown",
      i18n.t("share.errorServerVerify", "Server error verifying share: ") + error.message
    );
  }

  if (!data || data.error === "share_not_found") {
    throw new ShareAuthError(
      "not_found",
      i18n.t("share.errorLinkNotFoundOrRevoked", "Share link does not exist or has been revoked.")
    );
  }
  if (data.error === "invalid_pin") {
    throw new ShareAuthError("invalid_pin", i18n.t("share.errorInvalidPin", "Invalid PIN code."));
  }
  if (!data.ok) {
    throw new ShareAuthError(
      "unknown",
      i18n.t("share.errorCannotAccess", "Cannot access share link.")
    );
  }

  // 3. (MỚI) Quyền truy cập giờ đã được cấp trên server (bằng cách insert vào bảng share_access)
  // Không còn gọi supabase.auth.updateUser({ data: { share_token } }) từ client nữa
  // để tránh lỗ hổng Anonymous tự update user_metadata (Bypass PIN).

  let parsedTrip = data.trip;
  if (typeof data.trip === "string") {
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
 * clearShareClaim: Hiện tại không cần dùng vì không lưu trong JWT nữa.
 * Nếu cần thu hồi quyền ngay lập tức khi rời trang, bạn có thể gọi 1 RPC xóa record trong share_access.
 */
export async function clearShareClaim() {
  // Không còn lưu trong user_metadata nên không cần update.
  // Nếu muốn, có thể gọi RPC để xóa access record:
  // await supabase.rpc('remove_share_access', { p_token: token });
}
