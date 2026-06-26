import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Add01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  Location01Icon,
  Dollar01Icon,
  AlignLeftIcon,
  Route01Icon,
  HelpCircleIcon,
  ChevronRightIcon,
  MapsIcon
} from "@hugeicons/core-free-icons";
import { BackupPlan, BackupPlanType } from "../../../db";
import { DeleteConfirmModal } from "../../../components/ui";
import { getEmbedMapUrl, ensureAbsoluteUrl, getMapFilterClass } from "../../../utils/mapUtils";
import { useModalHistory } from "../../../hooks/useModalHistory";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

import { submitChangeRequest } from "../../../services/sharedTripRequestService";
import { showToast } from "../../../components/ui/ToastManager";

interface SharedBackupPlansSheetProps {
  token: string;
  tripId: number;
  activityId?: number | string;
  activityTitle?: string;
  date?: string;
  isOpen: boolean;
  onClose: () => void;
  backupPlans: BackupPlan[];
  changeRequests: any[];
  mode: string;
  guestName: string;
}

const typeLabels: Record<BackupPlanType, string> = {
  food: "share.typeFood",
  place: "share.typePlace",
  transport: "share.typeTransport",
  hotel: "share.typeHotel",
  indoor: "share.typeIndoor",
  weather: "share.typeBadWeather",
  other: "share.typeOther"
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

export function SharedBackupPlansSheet({
  token,
  tripId,
  activityId,
  activityTitle,
  date,
  isOpen,
  onClose,
  backupPlans,
  changeRequests,
  mode,
  guestName
}: SharedBackupPlansSheetProps) {
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
  }, "shared-backup-plan-form");

  useModalHistory(isOpen, onClose, "shared-backup-plans-modal");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BackupPlanType>("place");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [note, setNote] = useState("");

  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';

  const plans = React.useMemo(() => {
    // Filter backup plans for this activity
    const list = backupPlans.map(item => {
      const pendingDelete = changeRequests.some(
        r => r.section === 'backupPlans' && r.action === 'delete' && String(r.targetId) === String(item.id)
      );
      const updateReq = changeRequests.find(
        r => r.section === 'backupPlans' && r.action === 'update' && String(r.targetId) === String(item.id)
      );

      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }

      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });

    const pendingCreates = changeRequests.filter(
      r => r.section === 'backupPlans' && r.action === 'create'
    );
    pendingCreates.forEach(r => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list.filter(p => {
      const matchActivity = !activityId ? (!p.activityId && !p.date) : (String(p.activityId) === String(activityId));
      return matchActivity && !p.isDeleted;
    });
  }, [backupPlans, changeRequests, activityId]);

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

    const hasAdditional = !!(plan.location || plan.mapLink || plan.estimatedCost || plan.note);
    setShowAdditionalInfo(hasAdditional);

    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      showToast(t("toast.backupRequireName"), "error");
      return;
    }

    const costValue = estimatedCost.trim() ? Number(estimatedCost.replace(/\D/g, '')) : undefined;
    const payload = {
      tripId,
      activityId,
      date,
      title: title.trim(),
      type,
      reason: reason.trim() || undefined,
      location: location.trim() || undefined,
      mapLink: mapLink.trim() ? ensureAbsoluteUrl(mapLink.trim()) : undefined,
      estimatedCost: costValue,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? t("share.updatedDirectly") : t("share.proposalSent");

      if (!editingPlan) {
        await submitChangeRequest(token, {
          section: 'backupPlans',
          action: 'create',
          after: { ...payload, createdAt: new Date().toISOString() },
          status,
          requesterName: guestName
        });
      } else {
        const before = backupPlans.find(b => String(b.id) === String(editingPlan.id));
        await submitChangeRequest(token, {
          section: 'backupPlans',
          action: 'update',
          targetId: String(editingPlan.id),
          before: before as any,
          after: payload,
          status,
          requesterName: guestName
        });
      }

      setIsFormOpen(false);
      resetForm();
      showToast(successMessage);
    } catch (e: any) {
      showToast(isDirectEdit ? t("toast.updateError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error');
    }
  }

  async function handleDeleteConfirm() {
    if (planToDelete?.id) {
      try {
        await submitChangeRequest(token, {
          section: 'backupPlans',
          action: 'delete',
          targetId: String(planToDelete.id),
          before: planToDelete as any,
          status: isDirectEdit ? 'auto_approved' : undefined,
          requesterName: guestName
        });
        showToast(isDirectEdit ? t("toast.directDelete") : t("toast.requestSent"));
      } catch (e: any) {
        showToast(isDirectEdit ? t("toast.deleteError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error');
      }
    }
    setIsDeleteConfirmOpen(false);
    setPlanToDelete(null);
  }



  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-modal-overlay" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-kat-surface rounded-t-3xl sm:rounded-3xl shadow-floating dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] motion-modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-kat-surface sticky top-0 z-10 gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-extrabold text-kat-dark truncate">{t("share.backupPlanTitle")}</h3>
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {activityTitle ? `{t("share.forActivity")}: ${activityTitle}` : t("share.backupPlanSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isFormOpen && plans.length > 0 && isRequestEdit && (
              <button
                onClick={handleOpenAdd}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3.5 text-[13px] font-extrabold hover:brightness-105 active:scale-95 transition-all shadow-sm focus:outline-none"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" strokeWidth={2.5} />
                <span>{t("share.add")}</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
              title={t("share.close")}
              aria-label={t("share.close")}
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
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5">{t("share.planName")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t("share.planNamePlaceholder")}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-bold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500 dark:placeholder:text-slate-505"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5">{t("share.planType")}</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(typeLabels) as BackupPlanType[]).map(typeKey => (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setType(typeKey)}
                      className={`px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-all ${
                        type === typeKey
                          ? typeColors[typeKey] + " border-opacity-100"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t(typeLabels[typeKey])}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5 flex items-center gap-1.5">
                  <HugeiconsIcon icon={HelpCircleIcon} className="w-4 h-4 text-slate-400" /> {t("share.whenToUse")}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t("share.whenToUsePlaceholder")}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-semibold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full flex items-center justify-between text-[13.5px] font-extrabold text-slate-700 dark:text-slate-300 hover:text-kat-dark dark:hover:text-white focus:outline-none transition-colors"
                >
                  <span>{t("share.additionalInfo")}</span>
                  <HugeiconsIcon icon={ChevronRightIcon} className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${showAdditionalInfo ? "rotate-90" : ""}`} />
                </button>

                {showAdditionalInfo && (
                  <div className="space-y-4 mt-4 animate-fadeIn">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location01Icon} className="w-4 h-4 text-slate-400" /> {t("share.location")}
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder={t("share.locationPlaceholder")}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-semibold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5 flex items-center justify-between">
                        <span>{t("share.googleMapsLink")}</span>
                        {mapLink && (
                          <a
                            href={ensureAbsoluteUrl(mapLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                          >
                            {t("share.openLinkTest")} &rarr;
                          </a>
                        )}
                      </label>
                      <input
                        type="url"
                        value={mapLink}
                        onChange={e => setMapLink(e.target.value)}
                        placeholder={t("share.googleMapsPlaceholder")}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-semibold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Dollar01Icon} className="w-4 h-4 text-slate-400" /> {t("share.estimatedCost")}
                      </label>
                      <input
                        type="number"
                        value={estimatedCost}
                        onChange={e => setEstimatedCost(e.target.value)}
                        placeholder={t("share.estimatedCostPlaceholder")}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-semibold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-350 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={AlignLeftIcon} className="w-4 h-4 text-slate-400" /> {t("share.notes")}
                      </label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={t("share.notesPlaceholder")}
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[14.5px] font-semibold text-kat-dark focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:placeholder:text-slate-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-slate-655 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors motion-press focus:outline-none"
                >
                  {t("share.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-white dark:text-slate-950 bg-indigo-600 dark:bg-kat-primary hover:bg-indigo-700 dark:hover:brightness-110 transition-colors motion-press focus:outline-none"
                >
                  {isDirectEdit ? t("share.savePlan") : t("share.sendProposal")}
                </button>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <HugeiconsIcon icon={Route01Icon} className="w-8 h-8" />
              </div>
              <h4 className="text-[16px] font-extrabold text-kat-dark mb-2">{t("share.noBackupPlanTitle")}</h4>
              <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 mb-6 max-w-[260px]">
                {t("share.noBackupPlanDesc")}
              </p>
              {isRequestEdit && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 dark:bg-kat-primary text-white dark:text-slate-950 rounded-xl text-[14.5px] font-bold hover:bg-indigo-700 dark:hover:brightness-110 transition-colors motion-press"
                >
                  <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                  <span>{isDirectEdit ? t("share.addFirstPlan") : t("share.proposeFirstPlan")}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {plans.map(plan => {
                  const isPending = plan.isPendingCreate || plan.isPendingUpdate || plan.isPendingDelete;
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl bg-white dark:bg-kat-surface border transition-all ${
                        (plan.isPendingCreate || plan.isPendingUpdate) ? "bg-sky-50/40 dark:bg-sky-950/10 border-sky-100/70 dark:border-sky-900/30" : ""
                      } ${
                        plan.isPendingDelete ? "border-rose-100 dark:border-rose-950/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-70" : ""
                      } ${
                        !isPending ? "border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50" : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between h-full">
                        {/* Top content */}
                        <div>
                          {/* Type Badge */}
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${typeColors[(plan.type as BackupPlanType) || "other"]}`}>
                              {t(typeLabels[(plan.type as BackupPlanType) || "other"])}
                            </span>
                            
                            {plan.isPendingCreate && (
                              <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 select-none animate-fadeIn">
                                Đề xuất mới
                              </span>
                            )}
                            {plan.isPendingUpdate && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 select-none animate-fadeIn">
                                Đề xuất sửa
                              </span>
                            )}
                            {plan.isPendingDelete && (
                              <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                                Đề xuất xóa
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className={`text-[15.5px] font-extrabold text-kat-dark leading-snug ${plan.isPendingDelete ? 'line-through text-slate-400' : ''}`}>
                            {plan.title}
                          </h4>

                          {/* Location */}
                          {plan.location && (
                            <div className={`flex items-center gap-1.5 mt-1.5 text-[13.5px] font-semibold text-slate-500 ${plan.isPendingDelete ? 'line-through' : ''}`}>
                              <HugeiconsIcon icon={Location01Icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{plan.location}</span>
                            </div>
                          )}

                          {/* Cost */}
                          {plan.estimatedCost ? (
                            <div className="flex items-center gap-1.5 mt-1 text-[13.5px] font-semibold text-slate-500">
                              <HugeiconsIcon icon={Dollar01Icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{plan.estimatedCost.toLocaleString("vi-VN")} ₫</span>
                            </div>
                          ) : null}

                          {/* Activation condition callout */}
                          {plan.reason && (
                            <div className="mt-2.5 text-[13px] font-bold text-amber-700 bg-amber-50/50 border border-amber-100/60 px-3 py-1.5 rounded-xl leading-relaxed">
                              <span className="text-amber-600">Khi:</span> {plan.reason}
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
                            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                              {getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location) && (
                                <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 relative min-h-[140px]">
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="text-[12px] font-medium animate-pulse">{t("share.loadingMap")}</span>
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
                                    {isRoute ? t("share.viewTravelRoute") + " " : t("share.openWithGoogleMaps") + " "}
                                    &rarr;
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Actions toolbar */}
                        {isRequestEdit && !isPending && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {plan.mapLink && !getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location) && (
                                <a
                                  href={ensureAbsoluteUrl(plan.mapLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[12.5px] font-black text-indigo-600 hover:text-indigo-700 transition-colors hover:underline truncate"
                                >
                                  Xem bản đồ
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleOpenEdit(plan)}
                                className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-slate-650 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white active:scale-95 transition-all border border-slate-200/40 dark:border-slate-700/50 motion-press focus:outline-none"
                                title={t("share.editPlan")}
                              >
                                <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                                <span>{isDirectEdit ? t("share.edit") : t("share.editProposal")}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPlanToDelete(plan);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-95 transition-all border border-rose-200/40 dark:border-rose-900/30 motion-press focus:outline-none"
                                title={t("share.deletePlan")}
                              >
                                <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                                <span>{isDirectEdit ? t("share.delete") : t("share.deleteProposal")}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={isDirectEdit ? t("share.deletePlanConfirmTitle") : t("share.proposeDeletePlanTitle")}
        itemName={planToDelete?.title}
        description={isDirectEdit ? t("share.deletePlanConfirmDesc") : t("share.proposeDeletePlanDesc")}
        confirmLabel={isDirectEdit ? t("share.delete") : t("share.deleteProposal")}
      />
    </div>,
    document.body
  );
}
