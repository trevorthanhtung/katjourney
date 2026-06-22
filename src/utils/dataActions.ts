import { db } from "../db";

/**
 * Xóa toàn bộ PWA cache (service worker caches).
 * Dữ liệu Dexie (trips, expenses...) KHÔNG bị ảnh hưởng.
 */
export async function clearTemporaryFiles(): Promise<void> {
  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }
  // Xóa session storage (không phải localStorage để giữ theme/lang)
  sessionStorage.clear();
}

/**
 * Xóa tài khoản: xóa tài khoản trên Firebase Auth, xóa toàn bộ dữ liệu cục bộ và reload.
 * ⚠️ KHÔNG THỂ HOÀN TÁC.
 */
export async function executeDeleteAccount(): Promise<void> {
  // 1. Xóa tài khoản trên Auth nếu người dùng đã đăng nhập
  try {
    const { deleteCurrentUser } = await import("../services/authService");
    await deleteCurrentUser();
    console.log("[DataActions] Account deleted successfully.");
  } catch (error: any) {
    console.error("[DataActions] Account deletion failed:", error);
    if (error.message?.includes("requires-recent-login")) {
      throw new Error("requires-recent-login");
    }
  }

  // 2. Xóa toàn bộ dữ liệu Dexie
  try {
    await db.delete();
  } catch (_) {
    // ignore nếu DB không tồn tại
  }

  // 3. Xóa localStorage (theme, lang, v.v.)
  localStorage.clear();

  // 4. Xóa PWA cache
  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  // 5. Reload app → DB mới được tạo lại tự động
  window.location.reload();
}

/**
 * Factory Reset: xóa TOÀN BỘ dữ liệu, đăng xuất và reload.
 * ⚠️ KHÔNG THỂ HOÀN TÁC.
 */
export async function executeFactoryReset(): Promise<void> {
  try {
    // 1. Xóa toàn bộ dữ liệu Dexie
    await db.delete();
  } catch (_) {
    // ignore nếu DB không tồn tại
  }

  // 2. Xóa localStorage (theme, lang, v.v.)
  localStorage.clear();

  // 3. Xóa PWA cache
  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  }

  // 4. Đăng xuất Auth (nếu có)
  try {
    const { signOutUser } = await import("../services/authService");
    await signOutUser();
  } catch (_) {
    // ignore nếu chưa init hoặc user chưa đăng nhập
  }

  // 5. Reload app
  window.location.reload();
}
