// LƯU Ý QUAN TRỌNG: KHÔNG import firebase trực tiếp ở top-level
// Việc import trực tiếp sẽ kéo SDK vào main bundle làm tăng size.
// Chỉ import động (dynamic import) khi thực sự cần dùng.

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { AppCheck } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only enable if we have at least the critical config
const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseEnabled = hasFirebaseConfig;

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;
let cachedAppCheck: AppCheck | null = null;

/**
 * Khởi tạo Firebase SDK (lazy-load).
 */
export async function initFirebase() {
  if (!firebaseEnabled) {
    throw new Error("Firebase config missing");
  }
  
  if (cachedApp && cachedAuth && cachedDb && cachedStorage) {
    return { app: cachedApp, auth: cachedAuth, db: cachedDb, storage: cachedStorage };
  }

  // Lazy load Firebase modules only when called
  const [
    { initializeApp, getApps },
    { getAuth },
    { getFirestore },
    { getStorage }
  ] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage")
  ]);

  const { setPersistence, browserLocalPersistence } = await import("firebase/auth");

  const apps = getApps();
  cachedApp = apps.length ? apps[0] : initializeApp(firebaseConfig);
  cachedAuth = getAuth(cachedApp);

  // Đảm bảo session được lưu vào localStorage để không bị đăng xuất khi reload
  await setPersistence(cachedAuth, browserLocalPersistence);

  cachedDb = getFirestore(cachedApp);
  cachedStorage = getStorage(cachedApp);

  // Khởi tạo App Check nếu có cấu hình site key
  const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (appCheckSiteKey && !cachedAppCheck) {
    // Để App Check debug hoạt động trên localhost, có thể bật dòng sau trong môi trường dev:
    // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");
    cachedAppCheck = initializeAppCheck(cachedApp, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  }

  return { app: cachedApp, auth: cachedAuth, db: cachedDb, storage: cachedStorage, appCheck: cachedAppCheck };
}

/**
 * Khởi tạo Auth và đảm bảo có session ẩn danh.
 */
export async function ensureAnonymousUser() {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Missing environment variables.");
  }

  const { auth } = await initFirebase();
  const { signInAnonymously } = await import("firebase/auth");

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}
