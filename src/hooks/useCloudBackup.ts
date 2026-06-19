import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { backupToCloud, restoreFromCloud, getLastBackupInfo } from "../services/cloudBackupService";
import { initFirebase } from "../lib/firebase";

export function useCloudBackup() {
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncLoading, setIsSyncLoading] = useState(false);
  const [isAutoBackingUp, setIsAutoBackingUp] = useState(false);
  const [isAutoSyncingUI, setIsAutoSyncingUI] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [hasCloudVersion, setHasCloudVersion] = useState(false);

  const lastInteractionRef = useRef<number>(Date.now());

  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("kat_journey_auto_backup_enabled") === "true";
    }
    return false;
  });

  const setAutoBackupEnabled = (enabled: boolean) => {
    setAutoBackupEnabledState(enabled);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kat_journey_auto_backup_enabled", enabled ? "true" : "false");
    }
  };

  const fetchBackupInfo = useCallback(async () => {
    if (!user) {
      setLastBackupAt(null);
      setHasCloudVersion(false);
      return;
    }
    try {
      const info = await getLastBackupInfo();
      const cloudTimeStr = info ? info.updatedAt : null;
      setLastBackupAt(cloudTimeStr);

      // Compare cloud time with local time to see if cloud has newer changes
      if (cloudTimeStr && typeof localStorage !== "undefined") {
        const localTimeStr = localStorage.getItem("kat_journey_local_updated_at");
        const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;
        const cloudTime = new Date(cloudTimeStr).getTime();
        
        // If cloud is newer by more than 1 second (1000ms tolerance)
        setHasCloudVersion(cloudTime - localTime > 1000);
      } else {
        setHasCloudVersion(false);
      }
    } catch (error) {
      console.error("[useCloudBackup] Failed to get last backup info:", error);
    }
  }, [user]);

  // Fetch last backup timestamp on initialization or user changes
  useEffect(() => {
    fetchBackupInfo();
  }, [fetchBackupInfo]);

  const backupNow = async () => {
    if (!user) return;
    setIsBackingUp(true);
    try {
      await backupToCloud();
      await fetchBackupInfo();
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreNow = useCallback(async (mode: "merge" | "replace") => {
    if (!user) return;
    setIsRestoring(true);
    try {
      await restoreFromCloud(mode);
      await fetchBackupInfo();
    } finally {
      setIsRestoring(false);
    }
  }, [user, fetchBackupInfo]);

  // Keep refs up to date to prevent stale closures in the Firestore snapshot listener
  const restoreNowRef = useRef(restoreNow);
  const fetchBackupInfoRef = useRef(fetchBackupInfo);

  useEffect(() => {
    restoreNowRef.current = restoreNow;
    fetchBackupInfoRef.current = fetchBackupInfo;
  }, [restoreNow, fetchBackupInfo]);

  // Track window keyboard/mouse/touch interaction for idle detection
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener("keydown", handleInteraction, { passive: true });
    window.addEventListener("mousedown", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Real-time Cloud listener
  useEffect(() => {
    if (!user) {
      setHasCloudVersion(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isSubscribed = true;

    const setupListener = async () => {
      try {
        const { db: firestore } = await initFirebase();
        const { doc, onSnapshot } = await import("firebase/firestore");
        
        if (!isSubscribed) return;

        const docRef = doc(firestore, "users", user.uid, "backups", "latest");
        
        unsubscribe = onSnapshot(docRef, async (snapshot) => {
          if (!snapshot.exists()) {
            return;
          }
          
          // Respect the kat_sync_in_progress lock
          if (typeof localStorage !== "undefined" && localStorage.getItem("kat_sync_in_progress") === "true") {
            console.log("[RealtimeSync] Sync already in progress, skipping snapshot");
            return;
          }

          const data = snapshot.data();
          const cloudTimeStr = data?.updatedAt || null;
          if (!cloudTimeStr) return;

          // Compare with local timestamp
          const localTimeStr = typeof localStorage !== "undefined" ? localStorage.getItem("kat_journey_local_updated_at") : null;
          
          const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;
          const cloudTime = new Date(cloudTimeStr).getTime();

          // Loop Prevention (Ping-Pong check)
          if (cloudTime <= localTime) {
            console.log("[RealtimeSync] Cloud data is older or equal to local data. Skipping.");
            return;
          }

          console.log("[RealtimeSync] Detected new cloud data from another device! Cloud:", cloudTimeStr, "Local:", localTimeStr);
          
          // Set last backup time
          setLastBackupAt(cloudTimeStr);

          // Check if application is Idle
          const now = Date.now();
          const timeSinceLastLocalEdit = now - localTime;
          const timeSinceLastInteraction = now - lastInteractionRef.current;

          const isIdle = timeSinceLastLocalEdit >= 10000 && timeSinceLastInteraction >= 10000;

          if (isIdle) {
            // Auto Restore Ngầm
            console.log("[RealtimeSync] Device is IDLE. Auto restoring (merge) from Cloud...");
            setIsAutoSyncingUI(true);
            try {
              await restoreNowRef.current("merge");
              if ((window as any).showToastGlobal) {
                (window as any).showToastGlobal("Đã cập nhật dữ liệu mới từ thiết bị khác.");
              }
            } catch (err) {
              console.error("[RealtimeSync] Auto restore failed:", err);
            } finally {
              setIsAutoSyncingUI(false);
            }
          } else {
            // Active State: show warning banner
            console.log("[RealtimeSync] Device is ACTIVE. Showing cloud updates banner.");
            setHasCloudVersion(true);
            if ((window as any).showToastGlobal) {
              (window as any).showToastGlobal("Có dữ liệu mới từ thiết bị khác. Vui lòng bấm Đồng bộ để tải về.");
            }
          }
        }, (error) => {
          console.error("[RealtimeSync] Error listening to backups:", error);
        });
      } catch (error) {
        console.error("[RealtimeSync] Failed to initialize Firebase listener:", error);
      }
    };

    setupListener();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  /**
   * Smart Sync:
   * Compares local modification timestamp with cloud backup timestamp.
   * Returns a sync status code:
   * - "uploaded": local was newer, automatically backed up.
   * - "prompt_restore": cloud is newer, caller should prompt user.
   * - "up_to_date": timestamps match, data is up-to-date.
   */
  const syncData = async (): Promise<"uploaded" | "prompt_restore" | "up_to_date"> => {
    if (!user) throw new Error("Vui lòng đăng nhập trước khi đồng bộ.");
    
    setIsSyncLoading(true);
    try {
      // 1. Fetch latest metadata from Cloud
      const info = await getLastBackupInfo();
      const cloudTimeStr = info ? info.updatedAt : null;
      
      // 2. Get local metadata timestamp
      let localTimeStr = typeof localStorage !== "undefined" ? localStorage.getItem("kat_journey_local_updated_at") : null;
      
      // If local metadata is missing, set it to now
      if (!localTimeStr && typeof localStorage !== "undefined") {
        localTimeStr = new Date().toISOString();
        localStorage.setItem("kat_journey_local_updated_at", localTimeStr);
      }

      const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;
      const cloudTime = cloudTimeStr ? new Date(cloudTimeStr).getTime() : 0;

      // 3. Compare with a 1-second tolerance
      const diff = localTime - cloudTime;

      if (!cloudTimeStr || diff > 1000) {
        // Local is newer or no cloud backup exists -> Backup
        await backupNow();
        return "uploaded";
      } else if (diff < -1000) {
        // Cloud is newer -> Prompt restore
        setHasCloudVersion(true);
        return "prompt_restore";
      } else {
        // Up to date
        setHasCloudVersion(false);
        return "up_to_date";
      }
    } finally {
      setIsSyncLoading(false);
    }
  };

  // Background Auto-Backup Loop
  const autoBackupTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !autoBackupEnabled) {
      if (autoBackupTimerRef.current) {
        clearInterval(autoBackupTimerRef.current);
        autoBackupTimerRef.current = null;
      }
      setIsAutoBackingUp(false);
      return;
    }

    autoBackupTimerRef.current = setInterval(async () => {
      // Don't auto-save if offline, or already backing up/restoring/syncing
      if (!navigator.onLine || isBackingUp || isRestoring || isSyncLoading || isAutoBackingUp) {
        return;
      }

      if (typeof localStorage === "undefined") return;

      const localTimeStr = localStorage.getItem("kat_journey_local_updated_at");
      if (!localTimeStr) return;

      const localTime = new Date(localTimeStr).getTime();
      const backupTime = lastBackupAt ? new Date(lastBackupAt).getTime() : 0;

      // Check if local has newer changes than last backup time
      if (localTime - backupTime > 1000) {
        const timeSinceLastEdit = Date.now() - localTime;
        
        // Debounce: only auto backup if the user hasn't edited for at least 5 seconds
        if (timeSinceLastEdit >= 5000) {
          setIsAutoBackingUp(true);
          try {
            console.log("[AutoSync] Triggering background auto-backup...");
            await backupToCloud();
            await fetchBackupInfo();
          } catch (error) {
            console.error("[AutoSync] Background auto-backup failed:", error);
          } finally {
            setIsAutoBackingUp(false);
          }
        }
      }
    }, 2500);

    return () => {
      if (autoBackupTimerRef.current) {
        clearInterval(autoBackupTimerRef.current);
        autoBackupTimerRef.current = null;
      }
    };
  }, [user, autoBackupEnabled, lastBackupAt, isBackingUp, isRestoring, isSyncLoading, isAutoBackingUp, fetchBackupInfo]);

  // Trigger synchronization immediately when regaining internet connection
  useEffect(() => {
    const handleOnline = async () => {
      console.log("[AutoSync] Device back online! Initiating sync check...");
      if (user && autoBackupEnabled) {
        if ((window as any).showToastGlobal) {
          (window as any).showToastGlobal("Đã kết nối mạng trở lại. Đang đồng bộ...");
        }
        try {
          const syncResult = await syncData();
          if (syncResult === "uploaded") {
            if ((window as any).showToastGlobal) {
              (window as any).showToastGlobal("Đã tự động sao lưu dữ liệu mới lên Cloud.");
            }
          }
        } catch (err) {
          console.error("[AutoSync] Online sync failed:", err);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [user, autoBackupEnabled, syncData]);

  const isSyncing = isBackingUp || isRestoring || isSyncLoading || isAutoSyncingUI;

  return {
    isSyncing,
    isBackingUp,
    isRestoring,
    isAutoSyncingUI,
    isAutoBackingUp,
    lastBackupAt,
    autoBackupEnabled,
    hasCloudVersion,
    setHasCloudVersion,
    setAutoBackupEnabled,
    backupNow,
    restoreNow,
    syncData,
    refreshBackupInfo: fetchBackupInfo
  };
}
