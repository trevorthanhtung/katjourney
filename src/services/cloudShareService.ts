import i18n from "../i18n";
import { supabase } from "../lib/supabase";
import { db as localDb } from "../db";
import { decryptObject } from "../lib/crypto";

export interface ShareOptions {
  mode: "view" | "edit" | "request_edit";
  includeExpenses: boolean;
  includeJournals: boolean;
  includeChecklist: boolean;
  includeBackupPlans: boolean;
  includeDocuments: boolean;
  sharePin?: string;
}

/**
 * Ensures Supabase is initialized.
 */
export async function ensureCloudShareReady() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
}

/**
 * Creates a share link for a given trip.
 * Generates a public snapshot in Supabase under `public_shares` and sub-tables.
 */
export async function createShareLink(
  tripId: number,
  options: ShareOptions
): Promise<{ token: string; url: string }> {
  await ensureCloudShareReady();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    throw new Error(i18n.t("share.errorLoginRequired", "Please sign in before sharing."));
  }

  // 1. Fetch trip data from local Dexie and decrypt
  const tripRaw = await localDb.trips.get(tripId);
  if (!tripRaw) throw new Error(i18n.t("share.errorTripNotFound", "Local trip not found."));
  const trip = decryptObject(tripRaw);

  const membersRaw = await localDb.members.where("tripId").equals(tripId).toArray();
  const members = membersRaw.map((m) => decryptObject(m));

  const activitiesRaw = await localDb.events.where("tripId").equals(tripId).toArray();
  const activities = activitiesRaw.map((a) => decryptObject(a));

  // Conditionally fetch optional data
  const expensesRaw = options.includeExpenses
    ? await localDb.expenses.where("tripId").equals(tripId).toArray()
    : [];
  const expenses = expensesRaw.map((e) => decryptObject(e));

  const checklistRaw = options.includeChecklist
    ? await localDb.checklist.where("tripId").equals(tripId).toArray()
    : [];
  const checklist = checklistRaw.filter((c) => !c.isPrivate).map((c) => decryptObject(c));

  const journalsRaw = options.includeJournals
    ? await localDb.journals.where("tripId").equals(tripId).toArray()
    : [];
  const journals = journalsRaw.map((j) => decryptObject(j));

  const backupPlansRaw = options.includeBackupPlans
    ? await localDb.backupPlans.where("tripId").equals(tripId).toArray()
    : [];
  const backupPlans = backupPlansRaw.map((b) => decryptObject(b));

  const travelDocumentsRaw = options.includeDocuments
    ? await localDb.travelDocuments.where("tripId").equals(tripId).toArray()
    : [];
  const travelDocuments = travelDocumentsRaw
    .filter((d) => !d.isPrivate)
    .map((d) => decryptObject(d));

  const randomUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // 2. Generate a secure token
  const token = randomUUID().replace(/-/g, "") + Math.random().toString(36).substring(2, 10);

  // 3. Parent public share row
  console.log("[CloudShare] Attempting to set parent document in Supabase...");
  const { error: parentError } = await supabase.from("public_shares").insert({
    token,
    owner_uid: user.id,
    source_trip_id: String(tripId),
    mode: options.mode,
    revoked: false,
    include_expenses: options.includeExpenses,
    include_journals: options.includeJournals,
    include_checklist: options.includeChecklist,
    include_backup_plans: options.includeBackupPlans,
    include_documents: options.includeDocuments,
    share_pin: options.sharePin || null,
    trip: {
      id: String(trip.id),
      name: trip.title,
      destination: trip.location,
      latitude: trip.latitude || null,
      longitude: trip.longitude || null,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tripType: trip.tripType || "multiDay",
      dayRoadmaps: trip.dayRoadmaps || null,
      status: trip.status || "active",
    },
  });

  if (parentError) {
    throw new Error(
      i18n.t("share.errorCreateLink", "Cannot create share link: ") + +parentError.message
    );
  }

  // 4. Update local trip with shareToken
  await localDb.trips.update(tripId, { shareToken: token });

  // 5. Bulk upload subcollection data
  const now = new Date().toISOString();
  const auditFields = {
    created_at: now,
    updated_at: now,
    created_by_uid: user.id,
    updated_by_uid: user.id,
  };

  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach((key) => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  const mapToTable = (list: any[]) =>
    list.map((item) => ({
      id: String(item.id),
      share_token: token,
      data: sanitize(item),
      ...auditFields,
    }));

  const uploadChunks = async () => {
    const promises = [];
    if (members.length > 0)
      promises.push(supabase.from("share_members").insert(mapToTable(members)));
    if (activities.length > 0)
      promises.push(supabase.from("share_activities").insert(mapToTable(activities)));
    if (expenses.length > 0)
      promises.push(supabase.from("share_expenses").insert(mapToTable(expenses)));
    if (checklist.length > 0)
      promises.push(supabase.from("share_checklist").insert(mapToTable(checklist)));
    if (journals.length > 0)
      promises.push(supabase.from("share_journals").insert(mapToTable(journals)));
    if (backupPlans.length > 0)
      promises.push(supabase.from("share_backup_plans").insert(mapToTable(backupPlans)));
    if (travelDocuments.length > 0)
      promises.push(supabase.from("share_travel_documents").insert(mapToTable(travelDocuments)));
    await Promise.all(promises);
  };

  console.log("[CloudShare] Uploading shared items...");
  await uploadChunks();
  console.log("[CloudShare] Upload completed successfully.");

  const url = `${window.location.origin}/share/${token}`;
  return { token, url };
}

/**
 * Updates an existing share link with current local data.
 */
export async function updateShareLink(
  tripId: number,
  token: string,
  options: ShareOptions
): Promise<void> {
  await ensureCloudShareReady();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  // Validate owner
  const { data: shareData, error: fetchError } = await supabase
    .from("public_shares")
    .select("owner_uid")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !shareData || shareData.owner_uid !== user.id) {
    throw new Error(
      i18n.t("share.errorNoPermission", "You don't have permission to update this share link.")
    );
  }

  // 1. Fetch trip data from local Dexie and decrypt
  const tripRaw = await localDb.trips.get(tripId);
  if (!tripRaw) throw new Error(i18n.t("share.errorTripNotFound", "Local trip not found."));
  const trip = decryptObject(tripRaw);

  const membersRaw = await localDb.members.where("tripId").equals(tripId).toArray();
  const members = membersRaw.map((m) => decryptObject(m));

  const activitiesRaw = await localDb.events.where("tripId").equals(tripId).toArray();
  const activities = activitiesRaw.map((a) => decryptObject(a));

  // Conditionally fetch optional data
  const expensesRaw = options.includeExpenses
    ? await localDb.expenses.where("tripId").equals(tripId).toArray()
    : [];
  const expenses = expensesRaw.map((e) => decryptObject(e));

  const checklistRaw = options.includeChecklist
    ? await localDb.checklist.where("tripId").equals(tripId).toArray()
    : [];
  const checklist = checklistRaw.filter((c) => !c.isPrivate).map((c) => decryptObject(c));

  const journalsRaw = options.includeJournals
    ? await localDb.journals.where("tripId").equals(tripId).toArray()
    : [];
  const journals = journalsRaw.map((j) => decryptObject(j));

  const backupPlansRaw = options.includeBackupPlans
    ? await localDb.backupPlans.where("tripId").equals(tripId).toArray()
    : [];
  const backupPlans = backupPlansRaw.map((b) => decryptObject(b));

  const travelDocumentsRaw = options.includeDocuments
    ? await localDb.travelDocuments.where("tripId").equals(tripId).toArray()
    : [];
  const travelDocuments = travelDocumentsRaw
    .filter((d) => !d.isPrivate)
    .map((d) => decryptObject(d));

  console.log("[CloudShare] Attempting to update parent row...");
  const { error: parentUpdateError } = await supabase
    .from("public_shares")
    .update({
      mode: options.mode,
      updated_at: new Date().toISOString(),
      include_expenses: options.includeExpenses,
      include_journals: options.includeJournals,
      include_checklist: options.includeChecklist,
      include_backup_plans: options.includeBackupPlans,
      include_documents: options.includeDocuments,
      share_pin: options.sharePin || null,
      trip: {
        id: String(trip.id),
        name: trip.title,
        destination: trip.location,
        latitude: trip.latitude || null,
        longitude: trip.longitude || null,
        startDate: trip.startDate,
        endDate: trip.endDate,
        tripType: trip.tripType || "multiDay",
        dayRoadmaps: trip.dayRoadmaps || null,
        status: trip.status || "active",
      },
    })
    .eq("token", token);

  if (parentUpdateError) {
    throw new Error(
      i18n.t("share.errorUpdatePublicShares", "Error updating public_shares: ") +
        +parentUpdateError.message
    );
  }

  // 2. Clear old items
  console.log("[CloudShare] Clearing existing items in cloud...");
  await Promise.all([
    supabase.from("share_members").delete().eq("share_token", token),
    supabase.from("share_activities").delete().eq("share_token", token),
    supabase.from("share_expenses").delete().eq("share_token", token),
    supabase.from("share_checklist").delete().eq("share_token", token),
    supabase.from("share_journals").delete().eq("share_token", token),
    supabase.from("share_backup_plans").delete().eq("share_token", token),
    supabase.from("share_travel_documents").delete().eq("share_token", token),
  ]);

  // 3. Insert new items
  const now = new Date().toISOString();
  const auditFields = {
    created_at: now,
    updated_at: now,
    created_by_uid: user.id,
    updated_by_uid: user.id,
  };

  const sanitize = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach((key) => {
      if (newObj[key] === undefined) {
        delete newObj[key];
      }
    });
    return newObj;
  };

  const mapToTable = (list: any[]) =>
    list.map((item) => ({
      id: String(item.id),
      share_token: token,
      data: sanitize(item),
      ...auditFields,
    }));

  const uploadChunks = async () => {
    const promises = [];
    if (members.length > 0)
      promises.push(supabase.from("share_members").insert(mapToTable(members)));
    if (activities.length > 0)
      promises.push(supabase.from("share_activities").insert(mapToTable(activities)));
    if (expenses.length > 0)
      promises.push(supabase.from("share_expenses").insert(mapToTable(expenses)));
    if (checklist.length > 0)
      promises.push(supabase.from("share_checklist").insert(mapToTable(checklist)));
    if (journals.length > 0)
      promises.push(supabase.from("share_journals").insert(mapToTable(journals)));
    if (backupPlans.length > 0)
      promises.push(supabase.from("share_backup_plans").insert(mapToTable(backupPlans)));
    if (travelDocuments.length > 0)
      promises.push(supabase.from("share_travel_documents").insert(mapToTable(travelDocuments)));
    await Promise.all(promises);
  };

  console.log("[CloudShare] Uploading updated shared items...");
  await uploadChunks();
  console.log("[CloudShare] Subcollections updates committed successfully.");
}

/**
 * Revokes an existing share link by setting revoked = true.
 */
export async function revokeShareLink(tripId: number, token: string): Promise<void> {
  await ensureCloudShareReady();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { error } = await supabase
    .from("public_shares")
    .update({
      revoked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("token", token)
    .eq("owner_uid", user.id);

  if (!error) {
    // Clear local shareToken
    await localDb.trips.update(tripId, { shareToken: undefined });
  }
}

// --- Consolidated from other services ---

export async function approveChangeRequest(token: string, requestId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  // 1. Validate Owner
  const { data: shareData, error: shareError } = await supabase
    .from("public_shares")
    .select("owner_uid, source_trip_id")
    .eq("token", token)
    .maybeSingle();

  if (shareError || !shareData) {
    throw new Error(i18n.t("share.errorLinkNotFound", "Share link does not exist."));
  }

  if (shareData.owner_uid !== user.id) {
    throw new Error(
      i18n.t(
        "share.errorNoPermission",
        "This device no longer has permission to manage this share link."
      )
    );
  }

  // 2. Claim change request atomically by updating its status
  const { data: requestData, error: requestError } = await supabase
    .from("change_requests")
    .update({
      status: "approved",
      reviewed_by_uid: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("share_token", token)
    .in("status", ["pending", "auto_approved"])
    .select("*")
    .maybeSingle();

  if (requestError || !requestData) {
    throw new Error(
      i18n.t("share.errorRequestNotFound", "Request does not exist or has already been processed.")
    );
  }

  const tripId = shareData.source_trip_id;
  const trip = await localDb.trips.get(Number(tripId));

  if (!trip) {
    throw new Error(
      i18n.t("share.errorOriginalTripNotFound", "Original trip not found on this device.")
    );
  }

  const section = requestData.section as ChangeRequestSection;
  const action = requestData.action as ChangeRequestAction;
  const targetId = requestData.target_id;
  const afterData = requestData.after_data;

  // 3. Apply to Dexie
  const dexieTableMap: Record<ChangeRequestSection, any> = {
    activities: localDb.events,
    expenses: localDb.expenses,
    checklist: localDb.checklist,
    journals: localDb.journals,
    backupPlans: localDb.backupPlans,
    travelDocuments: localDb.travelDocuments,
    members: localDb.members,
  };

  const localTable = dexieTableMap[section];
  let dexieId: number | string | undefined;

  try {
    if (action === "create") {
      const newItem = { ...afterData, tripId: Number(tripId) };
      delete newItem.id; // ensure ID is auto-generated by Dexie
      dexieId = await localTable.add(newItem);
    } else if (action === "update" && targetId) {
      dexieId = Number(targetId) || targetId;
      await localTable.update(dexieId, afterData);
    } else if (action === "delete" && targetId) {
      dexieId = Number(targetId) || targetId;
      await localTable.delete(dexieId);
    }
  } catch (err: any) {
    throw new Error(
      i18n.t("share.errorUpdateOriginal", "Error updating original data: ") + +err.message
    );
  }

  // 4. Apply to Supabase Public Snapshot
  try {
    const table = getTableName(section);
    const docId = action === "create" ? String(dexieId) : String(targetId);

    if (action === "create") {
      const now = new Date().toISOString();
      await supabase.from(table).insert({
        id: docId,
        share_token: token,
        data: { ...afterData, id: dexieId, tripId: 0 },
        created_at: now,
        updated_at: now,
        created_by_uid: user.id,
        updated_by_uid: user.id,
      });
    } else if (action === "update") {
      await supabase
        .from(table)
        .update({
          data: afterData,
          updated_at: new Date().toISOString(),
          updated_by_uid: user.id,
        })
        .eq("share_token", token)
        .eq("id", docId);
    } else if (action === "delete") {
      await supabase.from(table).delete().eq("share_token", token).eq("id", docId);
    }
  } catch (err: any) {
    throw new Error(
      i18n.t("share.errorSyncToSupabase", "Error syncing to Supabase: ") + +err.message
    );
  }
}

export async function rejectChangeRequest(token: string, requestId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  const { data: shareData, error: shareError } = await supabase
    .from("public_shares")
    .select("owner_uid")
    .eq("token", token)
    .maybeSingle();

  if (shareError || !shareData || shareData.owner_uid !== user.id) {
    throw new Error(
      i18n.t(
        "share.errorNoPermission",
        "This device no longer has permission to manage this share link."
      )
    );
  }

  const { error } = await supabase
    .from("change_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by_uid: user.id,
    })
    .eq("id", requestId)
    .eq("share_token", token);

  if (error) {
    throw new Error(i18n.t("share.errorRejectRequest", "Cannot reject request: ") + +error.message);
  }
}

function getTableName(collectionName: string): string {
  const map: Record<string, string> = {
    members: "share_members",
    activities: "share_activities",
    expenses: "share_expenses",
    checklist: "share_checklist",
    journals: "share_journals",
    backupPlans: "share_backup_plans",
    travelDocuments: "share_travel_documents",
  };
  return map[collectionName] || `share_${collectionName}`;
}

export async function addSharedDocument(
  token: string,
  collectionName: string,
  id: string,
  payload: any
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  const table = getTableName(collectionName);
  const now = new Date().toISOString();

  const { error } = await supabase.from(table).insert({
    id: String(id),
    share_token: token,
    data: payload,
    created_at: now,
    updated_at: now,
    created_by_uid: user.id,
    updated_by_uid: user.id,
  });

  if (error) {
    throw new Error(
      i18n.t("share.errorAddDocFailed", "Failed to add shared document: ") + error.message
    );
  }
}

export async function updateSharedDocument(
  token: string,
  collectionName: string,
  id: string,
  payload: any
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  const table = getTableName(collectionName);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from(table)
    .update({
      data: payload,
      updated_at: now,
      updated_by_uid: user.id,
    })
    .eq("share_token", token)
    .eq("id", String(id));

  if (error) {
    throw new Error(
      i18n.t("share.errorUpdateDocFailed", "Failed to update shared document: ") + error.message
    );
  }
}

export async function deleteSharedDocument(token: string, collectionName: string, id: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  const table = getTableName(collectionName);

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("share_token", token)
    .eq("id", String(id));

  if (error) {
    throw new Error(
      i18n.t("share.errorDeleteDocFailed", "Failed to delete shared document: ") + error.message
    );
  }
}

export async function updateSharedTripRoadmaps(token: string, dayRoadmaps: Record<string, string>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error(i18n.t("auth.errorLoginRequired", "Please sign in."));

  // Fetch current trip object
  const { data, error: selectError } = await supabase
    .from("public_shares")
    .select("trip")
    .eq("token", token)
    .maybeSingle();

  if (selectError || !data || !data.trip) {
    throw new Error(
      i18n.t("share.errorLoadSharedTrip", "Cannot load shared trip: ") +
        +(selectError?.message || "Data not found")
    );
  }

  const updatedTrip = { ...data.trip };
  updatedTrip.dayRoadmaps = dayRoadmaps;

  const { error: updateError } = await supabase
    .from("public_shares")
    .update({
      trip: updatedTrip,
      updated_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (updateError) {
    throw new Error(
      i18n.t("share.errorUpdateRoadmap", "Failed to update roadmap: ") + +updateError.message
    );
  }
}

export type ChangeRequestSection =
  | "activities"
  | "expenses"
  | "checklist"
  | "journals"
  | "backupPlans"
  | "travelDocuments"
  | "members";
export type ChangeRequestAction = "create" | "update" | "delete";

export interface ChangeRequestPayload {
  section: ChangeRequestSection;
  action: ChangeRequestAction;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  requesterName?: string;
  status?: "pending" | "auto_approved";
}

export async function submitChangeRequest(
  token: string,
  payload: ChangeRequestPayload
): Promise<void> {
  // Guest cần session (anonymous) để RLS cho phép INSERT change_request
  // (RLS mới yêu cầu JWT claim share_token phải khớp)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let user = session?.user;
  if (!user) {
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr || !anonData?.user) {
      throw new Error(
        i18n.t(
          "share.errorLoginOrOpenLink",
          "Please sign in or open a valid share link before submitting a request."
        )
      );
    }
    user = anonData.user;
  }

  // Bỏ qua bước kiểm tra public_shares ở client vì:
  // 1. RLS của bảng change_requests sẽ tự động chặn nếu user không có quyền (không có record trong share_access).
  // 2. UI đã tự động ẩn các mục không được phép chỉnh sửa.
  // Việc này giúp tránh lỗi không truy vấn được public_shares do thiếu RLS policy.

  function removeUndefined(obj: any): any {
    if (obj === undefined) return null;
    if (typeof obj !== "object" || obj === null) return obj;
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

  const { error: insertError } = await supabase.from("change_requests").insert({
    share_token: token,
    section: sanitizedPayload.section,
    action: sanitizedPayload.action,
    target_id: sanitizedPayload.targetId ? String(sanitizedPayload.targetId) : null,
    before_data: sanitizedPayload.before || null,
    after_data: sanitizedPayload.after || null,
    note: sanitizedPayload.note || null,
    requester_name: sanitizedPayload.requesterName || null,
    requester_uid: user.id,
    status: sanitizedPayload.status || "pending",
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(
      i18n.t("share.errorSubmitRequestFailed", "Failed to submit edit request: ") +
        +insertError.message
    );
  }
}
