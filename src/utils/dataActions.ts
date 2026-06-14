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
  // 1. Xóa tài khoản trên Firebase Auth nếu người dùng đã đăng nhập
  try {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("[DataActions] Deleting user account from Firebase Auth...", currentUser.uid);
      await currentUser.delete();
      console.log("[DataActions] Firebase account deleted successfully.");
    }
  } catch (error: any) {
    console.error("[DataActions] Firebase account deletion failed:", error);
    if (error.code === "auth/requires-recent-login") {
      throw new Error("requires-recent-login");
    }
    // Với các lỗi khác (ví dụ: lỗi mạng, Firebase chưa bật), chúng ta vẫn tiếp tục
    // xóa dữ liệu cục bộ để đảm bảo người dùng không bị kẹt.
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

  // 4. Đăng xuất Firebase (nếu có)
  try {
    const { getAuth, signOut } = await import("firebase/auth");
    const auth = getAuth();
    await signOut(auth);
  } catch (_) {
    // ignore nếu Firebase chưa init hoặc user chưa đăng nhập
  }

  // 5. Reload app
  window.location.reload();
}
