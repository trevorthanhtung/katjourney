import { supabase } from "../lib/supabase";
import { db } from "../db";
import { APP_VERSION } from "../utils/helpers";

export interface BackupInfo {
  updatedAt: string;
  appVersion: string;
}

/**
 * Deep-clones and removes `undefined` properties from an object/array,
 * which standard JSON/Postgres does not support.
 */
function sanitizeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

type SyncRecord = { id?: number; updatedAt?: string; isDeleted?: boolean; [key: string]: unknown };

function mergeCollections(
  localData: SyncRecord[],
  cloudData: SyncRecord[]
): { toAddOrUpdate: SyncRecord[] } {
  const localMap = new Map<number, SyncRecord>();
  localData.forEach(item => {
    if (item.id !== undefined) localMap.set(item.id, item);
  });

  const cloudMap = new Map<number, SyncRecord>();
  cloudData.forEach(item => {
    if (item.id !== undefined) cloudMap.set(item.id, item);
  });

  const toAddOrUpdate: SyncRecord[] = [];
  const allIds = new Set<number>([...localMap.keys(), ...cloudMap.keys()]);

  allIds.forEach(id => {
    const localRec = localMap.get(id);
    const cloudRec = cloudMap.get(id);

    if (!localRec && cloudRec) {
      // Only in cloud
      toAddOrUpdate.push(cloudRec);
    } else if (localRec && cloudRec) {
      // Conflict: compare updatedAt
      const localTime = new Date(localRec.updatedAt || 0).getTime();
      const cloudTime = new Date(cloudRec.updatedAt || 0).getTime();

      if (cloudTime > localTime) {
        toAddOrUpdate.push(cloudRec);
      }
    }
  });

  return { toAddOrUpdate };
}

/**
 * Backup all local Dexie data to Supabase.
 */
export async function backupToCloud(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    throw new Error("Vui lòng đăng nhập để thực hiện sao lưu.");
  }

  // 0. Garbage collect old tombstones (older than 30 days) from local Dexie database
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dbTables = [
      db.trips,
      db.members,
      db.events,
      db.expenses,
      db.checklist,
      db.journals,
      db.packingItems,
      db.travelDocuments,
      db.backupPlans
    ];
    for (const table of dbTables) {
      await table.filter(item => 
        item.isDeleted === true && 
        (item.updatedAt || "") < thirtyDaysAgo
      ).delete();
    }
    console.log("[GarbageCollection] Successfully purged tombstones older than 30 days.");
  } catch (gcErr) {
    console.error("[GarbageCollection] Failed to purge old tombstones:", gcErr);
  }

  // 1. Fetch all local data from Dexie
  const [
    trips,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans
  ] = await Promise.all([
    db.trips.toArray(),
    db.members.toArray(),
    db.events.toArray(),
    db.expenses.toArray(),
    db.checklist.toArray(),
    db.journals.toArray(),
    db.packingItems.toArray(),
    db.travelDocuments.toArray(),
    db.backupPlans.toArray()
  ]);

  // 2. Prepare the snapshot
  const backupTime = new Date().toISOString();
  const snapshot = {
    updatedAt: backupTime,
    appVersion: APP_VERSION, // matches version in package.json
    trips: sanitizeData(trips),
    members: sanitizeData(members),
    events: sanitizeData(events),
    expenses: sanitizeData(expenses),
    checklist: sanitizeData(checklist),
    journals: sanitizeData(journals),
    packingItems: sanitizeData(packingItems),
    travelDocuments: sanitizeData(travelDocuments),
    backupPlans: sanitizeData(backupPlans)
  };

  // 3. Save backup snapshot in Supabase
  const { error } = await supabase
    .from("user_backups")
    .upsert({
      user_id: user.id,
      data: snapshot,
      app_version: APP_VERSION,
      updated_at: backupTime
    });

  if (error) {
    throw new Error("Lỗi khi sao lưu dữ liệu lên Supabase: " + error.message);
  }

  // Update local timestamp so it matches the cloud backup timestamp exactly
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("kat_journey_local_updated_at", backupTime);
  }
}

/**
 * Fetch metadata of the latest backup from Supabase.
 */
export async function getLastBackupInfo(): Promise<BackupInfo | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_backups")
    .select("updated_at, app_version")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    updatedAt: data.updated_at || "",
    appVersion: data.app_version || "1.0.0"
  };
}

/**
 * Restore data from cloud using either 'merge' or 'replace' mode.
 */
export async function restoreFromCloud(mode: "merge" | "replace"): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    throw new Error("Vui lòng đăng nhập để thực hiện khôi phục.");
  }

  const { data, error } = await supabase
    .from("user_backups")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data || !data.data) {
    throw new Error("Không tìm thấy bản sao lưu nào trên Cloud.");
  }

  const snapshot = data.data as any;

  if (typeof localStorage !== "undefined") {
    localStorage.setItem("kat_sync_in_progress", "true");
  }

  try {
    if (mode === "replace") {
      // Overwrite local first-party source of truth
      await db.transaction("rw", [
        db.trips,
        db.members,
        db.events,
        db.expenses,
        db.checklist,
        db.journals,
        db.packingItems,
        db.travelDocuments,
        db.backupPlans
      ], async () => {
        // Clear tables
        await Promise.all([
          db.trips.clear(),
          db.members.clear(),
          db.events.clear(),
          db.expenses.clear(),
          db.checklist.clear(),
          db.journals.clear(),
          db.packingItems.clear(),
          db.travelDocuments.clear(),
          db.backupPlans.clear()
        ]);

        // Populate with backup data
        if (snapshot.trips && snapshot.trips.length > 0) await db.trips.bulkAdd(snapshot.trips);
        if (snapshot.members && snapshot.members.length > 0) await db.members.bulkAdd(snapshot.members);
        if (snapshot.events && snapshot.events.length > 0) await db.events.bulkAdd(snapshot.events);
        if (snapshot.expenses && snapshot.expenses.length > 0) await db.expenses.bulkAdd(snapshot.expenses);
        if (snapshot.checklist && snapshot.checklist.length > 0) await db.checklist.bulkAdd(snapshot.checklist);
        if (snapshot.journals && snapshot.journals.length > 0) await db.journals.bulkAdd(snapshot.journals);
        if (snapshot.packingItems && snapshot.packingItems.length > 0) await db.packingItems.bulkAdd(snapshot.packingItems);
        if (snapshot.travelDocuments && snapshot.travelDocuments.length > 0) await db.travelDocuments.bulkAdd(snapshot.travelDocuments);
        if (snapshot.backupPlans && snapshot.backupPlans.length > 0) await db.backupPlans.bulkAdd(snapshot.backupPlans);
      });
    } else if (mode === "merge") {
      // Collision-free row-by-row merge based on updatedAt (Last Write Wins)
      await db.transaction("rw", [
        db.trips,
        db.members,
        db.events,
        db.expenses,
        db.checklist,
        db.journals,
        db.packingItems,
        db.travelDocuments,
        db.backupPlans
      ], async () => {
        const tables = [
          { table: db.trips, data: snapshot.trips || [] },
          { table: db.members, data: snapshot.members || [] },
          { table: db.events, data: snapshot.events || [] },
          { table: db.expenses, data: snapshot.expenses || [] },
          { table: db.checklist, data: snapshot.checklist || [] },
          { table: db.journals, data: snapshot.journals || [] },
          { table: db.packingItems, data: snapshot.packingItems || [] },
          { table: db.travelDocuments, data: snapshot.travelDocuments || [] },
          { table: db.backupPlans, data: snapshot.backupPlans || [] }
        ];

        for (const t of tables) {
          const localData = await (t.table as unknown as { toArray(): Promise<SyncRecord[]> }).toArray();
          const { toAddOrUpdate } = mergeCollections(localData, t.data as SyncRecord[]);

          for (const item of toAddOrUpdate) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (t.table as any).put(item);
          }
        }
      });

      // Auto backup in background to update cloud with merged results
      try {
        console.log("[SmartMerge] Triggering post-merge background backup...");
        await backupToCloud();
        return; // Fix infinite sync loop: backupToCloud already updated kat_journey_local_updated_at, skip reverting it
      } catch (backupErr) {
        console.error("[SmartMerge] Post-merge backup failed:", backupErr);
      }
    }

    // After successful restore, update local metadata timestamp to match the cloud backup time
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kat_journey_local_updated_at", snapshot.updatedAt || new Date().toISOString());
    }
  } finally {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("kat_sync_in_progress");
    }
  }
}
