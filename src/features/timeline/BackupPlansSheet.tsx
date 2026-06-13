import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Pencil, Trash2, MapPin, DollarSign, AlignLeft, Route, HelpCircle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, BackupPlan, BackupPlanType } from "../../db";
import { TypedDeleteConfirmModal } from "../../components/ui";

interface BackupPlansSheetProps {
  tripId: number;
  activityId?: number;
  date?: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
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
  food: "text-amber-600 bg-amber-50 border-amber-200",
  place: "text-kat-primary bg-kat-primary-light border-kat-primary/30",
  transport: "text-blue-600 bg-blue-50 border-blue-200",
  hotel: "text-indigo-600 bg-indigo-50 border-indigo-200",
  indoor: "text-purple-600 bg-purple-50 border-purple-200",
  weather: "text-rose-600 bg-rose-50 border-rose-200",
  other: "text-slate-600 bg-slate-50 border-slate-200"
};

export function BackupPlansSheet({ tripId, activityId, date, isOpen, onClose, onShowToast }: BackupPlansSheetProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BackupPlan | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<BackupPlan | null>(null);

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
    return query.toArray().then(all => all.filter(p => p.activityId === activityId && p.date === date));
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
  }

  function handleOpenAdd() {
    resetForm();
    setEditingPlan(null);
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
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      onShowToast?.("Vui lòng nhập tên phương án");
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
      mapLink: mapLink.trim(),
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      note: note.trim(),
      updatedAt: new Date().toISOString()
    };

    if (editingPlan?.id) {
      await db.backupPlans.update(editingPlan.id, payload);
      onShowToast?.("Đã cập nhật phương án");
    } else {
      payload.createdAt = new Date().toISOString();
      await db.backupPlans.add(payload);
      onShowToast?.("Đã lưu phương án dự phòng");
    }

    setIsFormOpen(false);
    resetForm();
  }

  async function handleDeleteConfirm() {
    if (planToDelete?.id) {
      await db.backupPlans.delete(planToDelete.id);
      onShowToast?.("Đã xóa phương án");
    }
    setIsDeleteConfirmOpen(false);
    setPlanToDelete(null);
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm motion-modal-overlay" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-floating overflow-hidden flex flex-col max-h-[90vh] motion-modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E1D8] bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#030D2E]">Phương án dự phòng</h3>
            <p className="text-[13px] font-semibold text-slate-500">Kế hoạch B cho những tình huống phát sinh</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors motion-press">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isFormOpen ? (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Tên phương án *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="VD: Quán ăn gần khách sạn, điểm tham quan trong nhà..."
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-bold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:font-semibold placeholder:text-slate-400"
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
                  <HelpCircle className="w-4 h-4 text-slate-400" /> Dùng khi nào?
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="VD: Khi trời mưa, quán đóng cửa, quá đông..."
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" /> Địa điểm
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="VD: Quán B gần khách sạn"
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Link Google Maps</label>
                <input
                  type="url"
                  value={mapLink}
                  onChange={e => setMapLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-400" /> Chi phí dự kiến
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  placeholder="VD: 200000"
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <AlignLeft className="w-4 h-4 text-slate-400" /> Ghi chú
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="VD: Gọi trước khi đến, nên đi taxi..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-[#E8E1D8] rounded-xl text-[14.5px] font-semibold text-[#030D2E] focus:outline-none focus:border-kat-primary focus:ring-1 focus:ring-kat-primary/30 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors motion-press"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl text-[14.5px] font-bold text-white bg-kat-primary hover:bg-kat-primary-usable transition-colors motion-press"
                >
                  Lưu phương án
                </button>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-kat-primary-light flex items-center justify-center text-kat-primary mb-4">
                <Route className="w-8 h-8" />
              </div>
              <h4 className="text-[16px] font-extrabold text-[#030D2E] mb-2">Chưa có phương án dự phòng</h4>
              <p className="text-[13.5px] font-semibold text-slate-500 mb-6 max-w-[260px]">
                Thêm một lựa chọn thay thế để chuyến đi linh hoạt hơn khi có thay đổi.
              </p>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-6 py-3.5 bg-kat-primary text-white rounded-xl text-[14.5px] font-bold hover:bg-kat-primary-usable transition-colors motion-press"
              >
                <Plus className="w-5 h-5" />
                Thêm phương án đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleOpenAdd}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-kat-primary-light/50 border border-kat-primary/20 text-kat-primary rounded-xl text-[14.5px] font-bold hover:bg-kat-primary-light transition-colors motion-press"
              >
                <Plus className="w-5 h-5" />
                Thêm phương án dự phòng
              </button>

              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.id} className="p-4 rounded-2xl bg-white border border-[#E8E1D8] hover:border-kat-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeColors[plan.type || "other"]}`}>
                            {typeLabels[plan.type || "other"]}
                          </span>
                          {plan.reason && (
                            <span className="text-[12px] font-bold text-slate-500 truncate">
                              Khi: {plan.reason}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[15px] font-extrabold text-[#030D2E]">{plan.title}</h4>
                        
                        {plan.location && (
                          <div className="flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{plan.location}</span>
                          </div>
                        )}
                        
                        {plan.estimatedCost ? (
                          <div className="flex items-center gap-1.5 mt-1 text-[13px] font-semibold text-slate-600">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{plan.estimatedCost.toLocaleString("vi-VN")} ₫</span>
                          </div>
                        ) : null}

                        {plan.note && (
                          <p className="mt-2 text-[13px] font-medium text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {plan.note}
                          </p>
                        )}

                        {plan.mapLink && (
                          <a
                            href={plan.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex mt-2 text-[13px] font-bold text-kat-primary hover:underline"
                          >
                            Xem bản đồ
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          className="p-2 rounded-lg text-slate-400 hover:text-kat-primary hover:bg-kat-primary-light transition-colors motion-press"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPlanToDelete(plan);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors motion-press"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TypedDeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Xóa phương án dự phòng này?"
        itemName={planToDelete?.title}
        description="Phương án này sẽ không còn xuất hiện trong chuyến đi. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa phương án"
      />
    </div>,
    document.body
  );
}
