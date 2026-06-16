import React, { useState, useEffect } from "react";
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
  RouteIcon,
  HelpCircleIcon,
  ChevronRightIcon,
  MapsIcon
} from "@hugeicons/core-free-icons";
import { BackupPlan, BackupPlanType } from "../../../db";
import { DeleteConfirmModal } from "../../../components/ui";
import { getEmbedMapUrl } from "../../../utils/mapUtils";
import { useModalHistory } from "../../../hooks/useModalHistory";
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
  food: "Ăn uống",
  place: "Địa điểm thay thế",
  transport: "Di chuyển",
  hotel: "Lưu trú",
  indoor: "Trong nhà",
  weather: "Thời tiết xấu",
  other: "Khác"
};

const typeColors: Record<BackupPlanType, string> = {
  food: "text-amber-750 bg-amber-50/50 border-amber-100/70",
  place: "text-indigo-700 bg-indigo-50 border-indigo-200",
  transport: "text-blue-700 bg-blue-50/50 border-blue-100/70",
  hotel: "text-indigo-700 bg-indigo-50/50 border-indigo-100/70",
  indoor: "text-purple-700 bg-purple-50/50 border-purple-100/70",
  weather: "text-rose-700 bg-rose-50/50 border-rose-100/70",
  other: "text-slate-600 bg-slate-50/50 border-slate-200/70"
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
      showToast("Vui lòng nhập tên phương án", "error");
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
      mapLink: mapLink.trim() || undefined,
      estimatedCost: costValue,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.';

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
      showToast((isDirectEdit ? 'Lỗi cập nhật: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error');
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
        showToast(isDirectEdit ? 'Đã xóa trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) {
        showToast((isDirectEdit ? 'Lỗi xóa: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error');
      }
    }
    setIsDeleteConfirmOpen(false);
    setPlanToDelete(null);
  }

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-modal-overlay" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-floating overflow-hidden flex flex-col max-h-[90vh] motion-modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E1D8] bg-white sticky top-0 z-10 gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-extrabold text-[#030D2E] truncate">Phương án dự phòng</h3>
            <p className="text-[13px] font-semibold text-slate-500 truncate">
              {activityTitle ? `Cho hoạt động: ${activityTitle}` : "Kế hoạch B cho những tình huống phát sinh"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isFormOpen && plans.length > 0 && isRequestEdit && (
              <button
                onClick={handleOpenAdd}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3.5 text-[13px] font-extrabold hover:brightness-105 active:scale-95 transition-all shadow-sm focus:outline-none"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" strokeWidth={2.5} />
                <span>Thêm</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors motion-press focus:outline-none">
              <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isFormOpen ? (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Tên phương án *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Quán ăn gần khách sạn, điểm tham quan trong nhà..."
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-bold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Loại phương án</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(typeLabels) as BackupPlanType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors motion-press ${
                        type === t 
                          ? typeColors[t] + " border-opacity-100" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <HugeiconsIcon icon={HelpCircleIcon} className="w-4 h-4 text-slate-400" /> Dùng khi nào?
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="VD: Khi trời mưa, quán đóng cửa, quá đông..."
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="border-t border-[#E8E1D8] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full flex items-center justify-between text-[13.5px] font-extrabold text-slate-750 hover:text-[#030D2E] focus:outline-none transition-colors"
                >
                  <span>Thông tin bổ sung</span>
                  <HugeiconsIcon icon={ChevronRightIcon} className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${showAdditionalInfo ? "rotate-90" : ""}`} />
                </button>

                {showAdditionalInfo && (
                  <div className="space-y-4 mt-4 animate-fadeIn">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location01Icon} className="w-4 h-4 text-slate-400" /> Địa điểm
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="VD: Quán B gần khách sạn"
                        className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Link bản đồ</span>
                        {mapLink && (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                          >
                            Mở link kiểm tra &rarr;
                          </a>
                        )}
                      </label>
                      <input
                        type="url"
                        value={mapLink}
                        onChange={e => setMapLink(e.target.value)}
                        placeholder="VD: https://www.google.com/maps/dir/..."
                        className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Dollar01Icon} className="w-4 h-4 text-slate-400" /> Chi phí dự kiến
                      </label>
                      <input
                        type="number"
                        value={estimatedCost}
                        onChange={e => setEstimatedCost(e.target.value)}
                        placeholder="VD: 200000"
                        className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <HugeiconsIcon icon={AlignLeftIcon} className="w-4 h-4 text-slate-400" /> Ghi chú
                      </label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="VD: Gọi trước khi đến, nên đi taxi..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-slate-655 bg-slate-100 hover:bg-slate-200 transition-colors motion-press focus:outline-none"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors motion-press focus:outline-none"
                >
                  {isDirectEdit ? "Lưu phương án" : "Gửi đề xuất"}
                </button>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <HugeiconsIcon icon={RouteIcon} className="w-8 h-8" />
              </div>
              <h4 className="text-[16px] font-extrabold text-[#030D2E] mb-2">Chưa có phương án dự phòng</h4>
              <p className="text-[13.5px] font-semibold text-slate-500 mb-6 max-w-[260px]">
                Thêm một lựa chọn thay thế để chuyến đi linh hoạt hơn khi có thay đổi.
              </p>
              {isRequestEdit && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-[14.5px] font-bold hover:bg-indigo-700 transition-colors motion-press"
                >
                  <HugeiconsIcon icon={Add01Icon} className="w-5 h-5" />
                  <span>{isDirectEdit ? "Thêm phương án đầu tiên" : "Đề xuất phương án đầu tiên"}</span>
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
                      className={`p-4 rounded-2xl bg-white border transition-all ${
                        (plan.isPendingCreate || plan.isPendingUpdate) ? "bg-sky-50/40 border-sky-100/70" : ""
                      } ${
                        plan.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : ""
                      } ${
                        !isPending ? "border-[#E8E1D8] hover:border-indigo-200" : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between h-full">
                        {/* Top content */}
                        <div>
                          {/* Type Badge */}
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${typeColors[(plan.type as BackupPlanType) || "other"]}`}>
                              {typeLabels[(plan.type as BackupPlanType) || "other"]}
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
                          <h4 className={`text-[15.5px] font-extrabold text-[#030D2E] leading-snug ${plan.isPendingDelete ? 'line-through text-slate-400' : ''}`}>
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
                              <span className="text-amber-850">Khi:</span> {plan.reason}
                            </div>
                          )}

                          {/* Note */}
                          {plan.note && (
                            <p className="mt-2.5 text-[13px] font-medium text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 leading-relaxed">
                              {plan.note}
                            </p>
                          )}

                          {/* Google Maps Embed */}
                          {(plan.mapLink || plan.location) && (
                            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                              {getEmbedMapUrl(plan.mapLink || plan.location || "", plan.location) && (
                                <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-gray-800 bg-slate-100 relative min-h-[140px]">
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="text-[12px] font-medium animate-pulse">Đang tải bản đồ...</span>
                                  </div>
                                  <iframe
                                    title="Google Maps Embed"
                                    width="100%"
                                    height="140"
                                    className="border-0 dark:opacity-80 relative z-10"
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[12.5px] font-bold text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors" 
                                    href={plan.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location || "")}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {isRoute ? <HugeiconsIcon icon={RouteIcon} className="w-3.5 h-3.5" /> : <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />}
                                    {isRoute ? "Xem lộ trình di chuyển " : "Mở bằng ứng dụng Google Maps "}
                                    &rarr;
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Actions toolbar */}
                        {isRequestEdit && !isPending && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {plan.mapLink && !getEmbedMapUrl(plan.mapLink || plan.location || "") && (
                                <a
                                  href={plan.mapLink}
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
                                className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-slate-650 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all border border-slate-200/40 motion-press focus:outline-none"
                                title="Sửa phương án"
                              >
                                <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                                <span>{isDirectEdit ? "Sửa" : "Đề xuất sửa"}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPlanToDelete(plan);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-xl text-[12.5px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all border border-rose-200/40 motion-press focus:outline-none"
                                title="Xóa phương án"
                              >
                                <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                                <span>{isDirectEdit ? "Xóa" : "Đề xuất xóa"}</span>
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
        title={isDirectEdit ? "Xóa phương án dự phòng này?" : "Đề xuất xóa phương án dự phòng này?"}
        itemName={planToDelete?.title}
        description={isDirectEdit ? "Phương án này sẽ không còn xuất hiện trong chuyến đi. Sau khi xóa, không thể hoàn tác." : "Đề xuất xóa phương án này sẽ được gửi tới chủ chuyến đi để xét duyệt."}
        confirmLabel={isDirectEdit ? "Xóa" : "Đề xuất xóa"}
      />
    </div>,
    document.body
  );
}
