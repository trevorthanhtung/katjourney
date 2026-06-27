import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Add01Icon, PencilEdit01Icon, Delete01Icon, Location01Icon, DollarSignIcon, AlignLeftIcon, Route01Icon, HelpCircleIcon, ChevronRightIcon, MapsIcon } from "@hugeicons/core-free-icons";
import { useLiveQuery } from "dexie-react-hooks";
import { db, BackupPlan, BackupPlanType } from "../../db";
import { DeleteConfirmModal } from "../../components/ui";
import { getEmbedMapUrl, ensureAbsoluteUrl, getMapFilterClass } from "../../utils/mapUtils";
import { useModalHistory } from "../../hooks/useModalHistory";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";


interface BackupPlansSheetProps {
  tripId: number;
  activityId?: number;
  date?: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const typeLabels: Record<BackupPlanType, string> = {
  food: "backup.catFood",
  place: "backup.catPlace",
  transport: "backup.catTransport",
  hotel: "backup.catHotel",
  indoor: "backup.catIndoor",
  weather: "backup.catWeather",
  other: "backup.catOther"
};

const typeColors: Record<BackupPlanType, string> = {
  food: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
  place: "text-kat-teal dark:text-kat-primary bg-kat-primary-soft dark:bg-kat-primary-soft border-[#00BFB7]/30 dark:border-[#00BFB7]/20",
  transport: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
  hotel: "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/30",
  indoor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
  weather: "text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30",
  other: "text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40"
};

export function BackupPlansSheet({ tripId, activityId, date, isOpen, onClose, onShowToast }: BackupPlansSheetProps) {
  const { t } = useTranslation();
  useBodyScrollLock(isOpen);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BackupPlan | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<BackupPlan | null>(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  useModalHistory(isFormOpen, () => {
    setIsFormOpen(false);
    setEditingPlan(null);
  }, "backup-plan-form");

  useModalHistory(isDeleteConfirmOpen, () => setIsDeleteConfirmOpen(false), "delete-backup-plan-confirm");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BackupPlanType>("place");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [note, setNote] = useState("");

  const plans = useLiveQuery(() => {
    let query = db.backupPlans.where("tripId").equals(tripId);
    return query.toArray().then(all => all.filter(p => !p.isDeleted && p.activityId === activityId && p.date === date));
  }, [tripId, activityId, date]) ?? [];

  useEffect(() => {
    if (!isOpen) {
      setIsFormOpen(false);
      setEditingPlan(null);
      resetForm();
    }
  }, [isOpen]);

  function resetForm() {
    setTitle("");
    setType("place");
    setReason("");
    setLocation("");
    setMapLink("");
    setEstimatedCost("");
    setNote("");
    setShowAdditionalInfo(false);
  }

  function handleOpenAdd() {
    resetForm();
    setEditingPlan(null);
    setShowAdditionalInfo(false);
    setIsFormOpen(true);
  }

  function handleOpenEdit(plan: BackupPlan) {
    setEditingPlan(plan);
    setTitle(plan.title);
    setType(plan.type || "other");
    setReason(plan.reason || "");
    setLocation(plan.location || "");
    setMapLink(plan.mapLink || "");
    setEstimatedCost(plan.estimatedCost ? String(plan.estimatedCost) : "");
    setNote(plan.note || "");
    
    // Auto-expand additional info if any fields are present
    const hasAdditional = !!(plan.location || plan.mapLink || plan.estimatedCost || plan.note);
    setShowAdditionalInfo(hasAdditional);
    
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      onShowToast?.(t("backup.toastEnterName"));
      return;
    }

    const payload: BackupPlan = {
      tripId,
      activityId,
      date,
      title: title.trim(),
      type,
      reason: reason.trim(),
      location: location.trim(),
      mapLink: mapLink.trim() ? ensureAbsoluteUrl(mapLink.trim()) : "",
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      note: note.trim(),
      updatedAt: new Date().toISOString()
    };

    if (editingPlan?.id) {
      await db.backupPlans.update(editingPlan.id, payload);
      onShowToast?.(t("backup.toastUpdated"));
    } else {
      payload.createdAt = new Date().toISOString();
      await db.backupPlans.add(payload);
      onShowToast?.(t("backup.toastSaved"));
    }

    setIsFormOpen(false);
    resetForm();
  }

  async function handleDeleteConfirm() {
    if (planToDelete?.id) {
      await db.backupPlans.update(planToDelete.id, { isDeleted: true });
      onShowToast?.(t("backup.toastDeleted"));
    }
    setIsDeleteConfirmOpen(false);
    setPlanToDelete(null);
  }



  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-modal-overlay" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-kat-surface rounded-t-3xl sm:rounded-3xl shadow-floating overflow-hidden flex flex-col max-h-[90vh] motion-modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-kat-border bg-white dark:bg-kat-surface sticky top-0 z-10 gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-extrabold text-kat-dark dark:text-slate-100 truncate">{t("backup.title")}</h3>
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 truncate">{t("backup.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isFormOpen && plans.length > 0 && (
              <button
                onClick={handleOpenAdd}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 text-[13px] font-extrabold hover:brightness-105 active:scale-95 transition-all shadow-sm focus:outline-none"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                <span>{t("backup.add")}</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
              title={t("backup.close")}
              aria-label={t("backup.close")}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isFormOpen ? (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("backup.nameLabel")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t("backup.namePlaceholder")}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-bold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("backup.typeLabel")}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(typeLabels) as BackupPlanType[]).map(typ => (
                    <button
                      key={typ}
                      onClick={() => setType(typ)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors motion-press ${
                        type === typ 
                          ? typeColors[typ] + " border-opacity-100" 
                          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {t(typeLabels[typ])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <HugeiconsIcon icon={HelpCircleIcon} className="w-4 h-4 text-slate-400" /> {t("backup.whenToUse")}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t("backup.whenPlaceholder")}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-semibold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-kat-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full flex items-center justify-between text-[13.5px] font-extrabold text-slate-700 dark:text-slate-200 hover:text-kat-dark dark:hover:text-white focus:outline-none transition-colors"
                >
                  <span>{t("backup.additionalInfo")}</span>
                  <HugeiconsIcon icon={ChevronRightIcon} className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${showAdditionalInfo ? "rotate-90" : ""}`} />
                </button>

                {showAdditionalInfo && (
                  <div className="space-y-4 mt-4 animate-fadeIn">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location01Icon} className="w-4 h-4 text-slate-400" /> {t("backup.location")}
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder={t("backup.locationPlaceholder")}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-semibold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Link Google Maps</span>
                        {mapLink && (
                          <a
                            href={ensureAbsoluteUrl(mapLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-655 dark:text-emerald-400 hover:text-emerald-700 font-bold hover:underline"
                          >
                            {t("backup.checkLink")} &rarr;
                          </a>
                        )}
                      </label>
                      <input
                        type="url"
                        value={mapLink}
                        onChange={e => setMapLink(e.target.value)}
                        placeholder="VD: https://www.google.com/maps/dir/..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-semibold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={DollarSignIcon} className="w-4 h-4 text-slate-400" /> {t("backup.estimatedCost")}
                      </label>
                      <input
                        type="number"
                        value={estimatedCost}
                        onChange={e => setEstimatedCost(e.target.value)}
                        placeholder="VD: 200000"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-semibold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={AlignLeftIcon} className="w-4 h-4 text-slate-400" /> {t("backup.notes")}
                      </label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={t("backup.notesPlaceholder")}
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-kat-border rounded-xl text-[14.5px] font-semibold text-kat-dark dark:text-slate-100 focus:outline-none focus:border-kat-teal focus:ring-1 focus:ring-[#00BFB7]/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors motion-press focus:outline-none"
                >
                  {t("backup.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 hover:brightness-105 transition-all motion-press focus:outline-none"
                >
                  {t("backup.savePlan")}
                </button>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00BFB7]/15 dark:bg-emerald-950/20 flex items-center justify-center text-kat-teal mb-4">
                <HugeiconsIcon icon={Route01Icon} className="w-8 h-8" />
              </div>
              <h4 className="text-[16px] font-extrabold text-kat-dark dark:text-slate-100 mb-2">{t("backup.emptyTitle")}</h4>
              <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 mb-6 max-w-[260px]">
                {t("backup.emptyDesc")}
              </p>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[14.5px] font-bold hover:brightness-105 transition-all motion-press"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                {t("backup.addFirst")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-kat-border hover:border-[#00BFB7]/30 dark:hover:border-[#00BFB7]/50 transition-all">
                    <div className="flex flex-col justify-between h-full">
                      {/* Top content */}
                      <div>
                        {/* Type Badge */}
                        <div className="mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${typeColors[plan.type || "other"]}`}>
                            {t(typeLabels[plan.type || "other"])}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-[15.5px] font-extrabold text-kat-dark dark:text-slate-100 leading-snug">{plan.title}</h4>

                        {/* Location */}
                        {plan.location && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                            <HugeiconsIcon icon={Location01Icon} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{plan.location}</span>
                          </div>
                        )}

                        {/* Cost */}
                        {plan.estimatedCost ? (
                          <div className="flex items-center gap-1.5 mt-1 text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                            <HugeiconsIcon icon={DollarSignIcon} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{plan.estimatedCost.toLocaleString("vi-VN")} ₫</span>
                          </div>
                        ) : null}

                        {/* Activation condition callout */}
                        {plan.reason && (
                          <div className="mt-2.5 text-[13px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/60 dark:border-amber-900/30 px-3 py-1.5 rounded-xl leading-relaxed">
                            <span className="text-amber-600 dark:text-amber-500">Khi:</span> {plan.reason}
                          </div>
                        )}

                        {/* Note */}
                        {plan.note && (
                          <p className="mt-2.5 text-[13px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-700/30 leading-relaxed">
                            {plan.note}
                          </p>
                        )}

                        {/* Google Maps Embed */}
                        {(plan.mapLink || plan.location) && (
                          <div className="mt-3 space-y-2">
                            {getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location) && (
                              <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-kat-border shadow-sm bg-slate-100 dark:bg-slate-800 relative min-h-[140px]">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                  <span className="text-[12px] font-medium animate-pulse">{t("backup.loadingMap")}</span>
                                </div>
                                <iframe
                                  title="Google Maps Embed"
                                  width="100%"
                                  height="140"
                                  className={`border-0 relative z-10 ${getMapFilterClass()}`}
                                  loading="lazy"
                                  allowFullScreen
                                  src={getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location)}
                                ></iframe>
                              </div>
                            )}
                            {(() => {
                              const isRoute = plan.mapLink && (plan.mapLink.includes("/maps/dir/") || plan.mapLink.includes("maps/dir"));
                              return (
                                <a 
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors" 
                                  href={ensureAbsoluteUrl(plan.mapLink) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location || "")}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {isRoute ? <HugeiconsIcon icon={Route01Icon} className="w-3.5 h-3.5" /> : <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />}
                                  {isRoute ? t("backup.viewRoute") + " " : t("backup.openGoogleMaps") + " "}
                                  &rarr;
                                </a>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Actions toolbar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {plan.mapLink && !getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location) && (
                            <a
                              href={ensureAbsoluteUrl(plan.mapLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[12.5px] font-black text-kat-teal hover:text-[#00a89f] transition-colors hover:underline truncate"
                            >
                              {t("backup.viewMap")}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-slate-650 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 active:scale-95 transition-all border border-slate-200/40 dark:border-slate-700/50 motion-press focus:outline-none"
                            title={t("backup.editPlan")}
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                            <span>{t("backup.edit")}</span>
                          </button>
                          <button
                            onClick={() => {
                              setPlanToDelete(plan);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-95 transition-all border border-rose-200/40 dark:border-rose-900/30 motion-press focus:outline-none"
                            title={t("backup.deletePlan")}
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                            <span>{t("backup.delete")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t("backup.deleteTitle")}
        itemName={planToDelete?.title}
        description={t("backup.deleteDesc")}
        confirmLabel={t("backup.deleteConfirm")}
      />
    </div>,
    document.body
  );
}

