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

  // 4. Đăng xuất Firebase (dynamic import để tránh tăng bundle size)
  try {
    const { getAuth, signOut } = await import("firebase/auth");
    const auth = getAuth();
    await signOut(auth);
  } catch (_) {
    // ignore nếu Firebase chưa init hoặc user chưa đăng nhập
  }

  // 5. Reload app → DB mới được tạo lại tự động
  window.location.reload();
}
