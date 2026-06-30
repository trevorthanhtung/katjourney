import { db } from "../db";
import { today, checklistSections, packingTripTypes } from "./helpers";

export async function exportDataToFile(): Promise<void> {
  const [
    trips,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans,
  ] = await Promise.all([
    db.trips.toArray(),
    db.members.toArray(),
    db.events.toArray(),
    db.expenses.toArray(),
    db.checklist.toArray(),
    db.journals.toArray(),
    db.packingItems.toArray(),
    db.travelDocuments.toArray(),
    db.backupPlans.toArray(),
  ]);

  const backupData = {
    app: "KAT Journey",
    type: "full_backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    trips,
    members,
    events,
    expenses,
    checklist,
    journals,
    packingItems,
    travelDocuments,
    backupPlans,
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const dateStr = new Date().toISOString().slice(0, 10);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kat-journey-backup-${dateStr}.katjourney`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importDataFromFile(parsed: any): Promise<number | undefined> {
  if (parsed.type === "full_backup") {
    await db.transaction(
      "rw",
      [
        db.trips,
        db.members,
        db.events,
        db.expenses,
        db.checklist,
        db.journals,
        db.packingItems,
        db.travelDocuments,
        db.backupPlans,
      ],
      async () => {
        await db.trips.clear();
        await db.members.clear();
        await db.events.clear();
        await db.expenses.clear();
        await db.checklist.clear();
        await db.journals.clear();
        await db.packingItems.clear();
        await db.travelDocuments.clear();
        await db.backupPlans.clear();

        if (parsed.trips?.length) await db.trips.bulkAdd(parsed.trips);
        if (parsed.members?.length) await db.members.bulkAdd(parsed.members);
        if (parsed.events?.length) await db.events.bulkAdd(parsed.events);
        if (parsed.expenses?.length) await db.expenses.bulkAdd(parsed.expenses);
        if (parsed.checklist?.length) await db.checklist.bulkAdd(parsed.checklist);
        if (parsed.journals?.length) await db.journals.bulkAdd(parsed.journals);
        if (parsed.packingItems?.length) await db.packingItems.bulkAdd(parsed.packingItems);
        if (parsed.travelDocuments?.length)
          await db.travelDocuments.bulkAdd(parsed.travelDocuments);
        if (parsed.backupPlans?.length) await db.backupPlans.bulkAdd(parsed.backupPlans);
      }
    );
    return undefined; // Full backup doesn't return a specific new trip ID
  }

  if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
    throw new Error("Invalid KAT Journey file format.");
  }

  const newTripId = await db.transaction(
    "rw",
    [
      db.trips,
      db.members,
      db.events,
      db.expenses,
      db.checklist,
      db.journals,
      db.packingItems,
      db.travelDocuments,
      db.backupPlans,
    ],
    async () => {
      const t = parsed.trip;
      const id = await db.trips.add({
        title: t.title,
        location: t.location ?? t.destination ?? "",
        tripType: t.tripType,
        startDate: t.startDate || today,
        endDate: t.endDate || t.startDate || today,
        latitude: t.latitude,
        longitude: t.longitude,
        defaultCurrency: t.defaultCurrency,
        mediaLink: t.mediaLink,
        dayRoadmaps: t.dayRoadmaps,
        shareToken: t.shareToken,
        sharePin: t.sharePin,
        shareIncludeExpenses: t.shareIncludeExpenses,
        shareIncludeJournals: t.shareIncludeJournals,
        shareIncludeChecklist: t.shareIncludeChecklist,
        shareIncludeBackupPlans: t.shareIncludeBackupPlans,
        shareIncludeDocuments: t.shareIncludeDocuments,
        shareUsePinProtection: t.shareUsePinProtection,
        status: t.status === "archived" ? "archived" : "active",
        createdAt: new Date().toISOString(),
      });

      const importedMembers = (parsed.members ?? []).map((m: any) => ({
        tripId: id,
        name: m.name ?? "",
        phone: m.phone ?? "",
        role: m.role ?? "",
        note: m.note ?? "",
        gender: m.gender,
        avatar: m.avatar,
        isDeleted: m.isDeleted,
      }));
      const importedEvents = (parsed.events ?? []).map((e: any) => ({
        tripId: id,
        date: e.date || today,
        time: e.time ?? "",
        title: e.title ?? "",
        location: e.location ?? "",
        notes: e.notes ?? "",
        mapLink: e.mapLink ?? "",
        completed: Boolean(e.completed),
        assignee: e.assignee,
        type: e.type,
        isDeleted: e.isDeleted,
      }));
      const importedExpenses = (parsed.expenses ?? []).map((ex: any) => ({
        tripId: id,
        amount: Number(ex.amount || 0),
        payer: ex.payer ?? "",
        category: ex.category ?? "other",
        description: ex.description ?? "",
        splitType: ex.splitType ?? "shared",
        date: ex.date,
        eventId: ex.eventId,
        originalAmount: ex.originalAmount !== undefined ? Number(ex.originalAmount) : undefined,
        currency: ex.currency,
        exchangeRate: ex.exchangeRate !== undefined ? Number(ex.exchangeRate) : undefined,
        isDeleted: ex.isDeleted,
      }));
      const importedChecklist = (parsed.checklist ?? []).map((c: any) => ({
        tripId: id,
        section: checklistSections.includes(c.section) ? c.section : "Before Trip",
        title: c.title ?? "",
        completed: Boolean(c.completed),
        category: c.category,
        quantity: c.quantity,
        assignedTo: c.assignedTo,
        priority: ["normal", "important", "required"].includes(c.priority) ? c.priority : "normal",
        note: c.note,
        isPrivate: c.isPrivate !== undefined ? Boolean(c.isPrivate) : undefined,
        isDeleted: c.isDeleted,
      }));
      const importedJournals = (parsed.journals ?? []).map((j: any) => ({
        tripId: id,
        date: j.date || today,
        title: j.title ?? "",
        content: j.content ?? "",
        mood: ["very_bad", "bad", "okay", "good", "great"].includes(j.mood) ? j.mood : "okay",
        authorName: j.authorName,
        imageUrl: j.imageUrl,
        postedAt: j.postedAt,
        reactions: j.reactions,
        authorId: j.authorId,
        locationName: j.locationName,
        latitude: j.latitude !== undefined ? Number(j.latitude) : undefined,
        longitude: j.longitude !== undefined ? Number(j.longitude) : undefined,
        isDeleted: j.isDeleted,
      }));
      const importedPackingItems = (parsed.packingItems ?? []).map((p: any) => ({
        tripId: id,
        tripType: packingTripTypes.includes(p.tripType) ? p.tripType : "city",
        title: p.title ?? "",
        completed: Boolean(p.completed),
        isDeleted: p.isDeleted,
      }));
      const importedDocuments = (parsed.travelDocuments ?? []).map((d: any) => ({
        tripId: id,
        title: d.title ?? "",
        type: d.type ?? "other",
        code: d.code ?? "",
        date: d.date ?? "",
        link: d.link ?? "",
        attachmentUrl: d.attachmentUrl,
        isPrivate: d.isPrivate !== undefined ? Boolean(d.isPrivate) : undefined,
        note: d.note ?? "",
        isDeleted: d.isDeleted,
      }));
      const importedBackupPlans = (parsed.backupPlans ?? []).map((b: any) => ({
        tripId: id,
        title: b.title ?? "",
        type: b.type ?? "other",
        reason: b.reason ?? "",
        location: b.location ?? "",
        mapLink: b.mapLink ?? "",
        estimatedCost: b.estimatedCost !== undefined ? Number(b.estimatedCost) : undefined,
        note: b.note ?? "",
        activityId: b.activityId,
        date: b.date,
        isDeleted: b.isDeleted,
      }));

      if (importedMembers.length) await db.members.bulkAdd(importedMembers);
      if (importedEvents.length) await db.events.bulkAdd(importedEvents);
      if (importedExpenses.length) await db.expenses.bulkAdd(importedExpenses);
      if (importedChecklist.length) await db.checklist.bulkAdd(importedChecklist);
      if (importedJournals.length) await db.journals.bulkAdd(importedJournals);
      if (importedPackingItems.length) await db.packingItems.bulkAdd(importedPackingItems);
      if (importedDocuments.length) await db.travelDocuments.bulkAdd(importedDocuments);
      if (importedBackupPlans.length) await db.backupPlans.bulkAdd(importedBackupPlans);
      return id;
    }
  );

  return newTripId;
}
