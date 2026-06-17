import React, { useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { AppChangeRequest } from '../../../hooks/useShareChangeRequests';
import { BottomSheet } from '../../../components/ui';
import { approveChangeRequest, rejectChangeRequest } from '../../../services/shareApprovalService';
import { showToast } from '../../../components/ui/ToastManager';
import { formatMoney } from '../../../utils/helpers';
import { Member } from '../../../db';
import { getAvatarSvg } from '../../../utils/avatars';
import { useModalHistory } from '../../../hooks/useModalHistory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  requests: AppChangeRequest[];
  members?: Member[];
}

export function ShareChangeRequestsSheet({ isOpen, onClose, token, requests, members = [] }: Props) {
  const [isApproving, setIsApproving] = useState<string | null>(null);

  async function handleApprove(requestId: string) {
    try {
      setIsApproving(requestId);
      await approveChangeRequest(token, requestId);
      showToast("Đã áp dụng thay đổi vào chuyến đi.", "success");
    } catch (e: any) {
      showToast("Lỗi khi duyệt: " + e.message, "error");
      console.error(e);
    } finally {
      setIsApproving(null);
    }
  }

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [isConfirmApproveAllOpen, setIsConfirmApproveAllOpen] = useState(false);
  const [isConfirmRejectAllOpen, setIsConfirmRejectAllOpen] = useState(false);

  useModalHistory(rejectId !== null, () => setRejectId(null), "reject-request-confirm");
  useModalHistory(isConfirmApproveAllOpen, () => setIsConfirmApproveAllOpen(false), "approve-all-confirm");
  useModalHistory(isConfirmRejectAllOpen, () => setIsConfirmRejectAllOpen(false), "reject-all-confirm");

  function handleReject(requestId: string) {
    setRejectId(requestId);
  }

  async function confirmReject(requestId: string) {
    setRejectId(null);
    try {
      setIsApproving(requestId);
      await rejectChangeRequest(token, requestId);
      showToast("Đã từ chối yêu cầu chỉnh sửa.", "success");
    } catch (e: any) {
      showToast("Lỗi khi từ chối: " + e.message, "error");
      console.error(e);
    } finally {
      setIsApproving(null);
    }
  }

  async function confirmApproveAll() {
    setIsConfirmApproveAllOpen(false);
    setIsApproving('all');
    let successCount = 0;
    let failCount = 0;
    
    for (const req of requests) {
      try {
        await approveChangeRequest(token, req.id);
        successCount++;
      } catch (e) {
        console.error(`Lỗi khi duyệt yêu cầu ${req.id}:`, e);
        failCount++;
      }
    }
    
    setIsApproving(null);
    if (failCount === 0) {
      showToast(`Đã áp dụng thành công tất cả ${successCount} thay đổi vào chuyến đi.`, "success");
    } else {
      showToast(`Đã áp dụng ${successCount} thay đổi. Thất bại ${failCount} yêu cầu.`, "error");
    }
  }

  async function confirmRejectAll() {
    setIsConfirmRejectAllOpen(false);
    setIsApproving('all');
    let successCount = 0;
    let failCount = 0;
    
    for (const req of requests) {
      try {
        await rejectChangeRequest(token, req.id);
        successCount++;
      } catch (e) {
        console.error(`Lỗi khi từ chối yêu cầu ${req.id}:`, e);
        failCount++;
      }
    }
    
    setIsApproving(null);
    if (failCount === 0) {
      showToast(`Đã từ chối tất cả ${successCount} yêu cầu chỉnh sửa.`, "success");
    } else {
      showToast(`Đã từ chối ${successCount} yêu cầu. Thất bại ${failCount} yêu cầu.`, "error");
    }
  }

  function renderChangeDetails(req: AppChangeRequest) {
    const { section, action, before, after } = req;
    
    let sectionName = section;
    if (section === 'activities') sectionName = 'Lịch trình';
    if (section === 'expenses') sectionName = 'Chi phí';
    if (section === 'checklist') sectionName = 'Chuẩn bị';
    if (section === 'journals') sectionName = 'Bản tin';
    if (section === 'backupPlans') sectionName = 'Phương án dự phòng';
    if (section === 'travelDocuments') sectionName = 'Giấy tờ';
    if (section === 'members') sectionName = 'Thành viên';

    let actionName = action === 'create' ? 'Thêm' : action === 'update' ? 'Sửa' : 'Xóa';
    
    let beforeText = '';
    let afterText = '';

    const formatObj = (o: any) => {
      if (!o) return '';
      if (o.title) return o.title;
      if (o.text) return o.text;
      if (o.name && o.role) return `${o.name} (${o.role})`;
      if (o.name) return o.name;
      if (o.description && o.amount) return `${o.description} (${formatMoney(o.amount)})`;
      if (o.description) return o.description;
      // Xử lý field "completed" đơn lẻ (checklist)
      if ('completed' in o && Object.keys(o).length === 1) {
        return o.completed ? 'Hoàn thành' : 'Chưa hoàn thành';
      }
      // Fallback: lọc bỏ các giá trị null/undefined, hiển thị gọn
      const entries = Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) return '';
      if (entries.length === 1) {
        const [k, v] = entries[0];
        if (typeof v === 'boolean') return v ? `${k}: Có` : `${k}: Không`;
        return String(v);
      }
      return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
    };

    if (section === 'members' && action === 'update') {
      const memberName = (before as any)?.name || (after as any)?.name || 'Thành viên';
      const oldRole = (before as any)?.role || 'Người đồng hành';
      const newRole = (after as any)?.role || 'Người đồng hành';
      return (
        <div className="mt-2 space-y-1">
          <p className="text-[13px] font-bold text-slate-700">Mục: {sectionName} • Đổi vai trò</p>
          <div className="text-[13px] mt-1 font-medium text-slate-800">
            Xin đổi vai trò cho <span className="font-bold">{memberName}</span>:
            <div className="flex items-center gap-2 mt-1 pl-2 border-l-2 border-slate-200">
              <span className="text-slate-400 line-through">{oldRole}</span>
              <span className="text-slate-400">→</span>
              <span className="text-[#00BFB7] font-bold">{newRole}</span>
            </div>
          </div>
        </div>
      );
    }

    if (action === 'create') {
      afterText = formatObj(after);
    } else if (action === 'update') {
      beforeText = formatObj(before);
      afterText = formatObj(after);
    } else if (action === 'delete') {
      beforeText = formatObj(before);
    }

    return (
      <div className="mt-2 space-y-1">
        <p className="text-[13px] font-bold text-slate-700">Mục: {sectionName} • {actionName}</p>
        {action === 'update' && (
          <div className="flex items-center gap-2 text-[13px] mt-1">
            <span className="text-slate-400 line-through">{beforeText}</span>
            <span className="text-slate-400">→</span>
            <span className="text-sky-600 font-medium">{afterText}</span>
          </div>
        )}
        {action === 'create' && (
          <p className="text-[13px] text-emerald-600 font-medium mt-1">+ {afterText}</p>
        )}
        {action === 'delete' && (
          <p className="text-[13px] text-rose-500 line-through mt-1">- {beforeText}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Yêu cầu chỉnh sửa"
        subtitle={requests.length > 0 ? `${requests.length} yêu cầu đang chờ duyệt.` : "Chưa có yêu cầu nào."}
        footer={
          requests.length > 1 ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmRejectAllOpen(true)}
                disabled={isApproving !== null}
                className="flex-1 rounded-[16px] bg-slate-100 py-3.5 text-[13.5px] font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isApproving === 'all' ? 'Đang xử lý...' : 'Từ chối tất cả'}
              </button>
              <button
                onClick={() => setIsConfirmApproveAllOpen(true)}
                disabled={isApproving !== null}
                className="flex-1 rounded-[16px] bg-kat-primary py-3.5 text-[13.5px] font-bold text-white hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_16px_rgba(0,191,183,0.25)]"
              >
                {isApproving === 'all' ? 'Đang xử lý...' : 'Đồng ý tất cả'}
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="px-1 pb-6 space-y-4">

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-slate-500">Chưa có yêu cầu chỉnh sửa nào.</p>
            </div>
          ) : (
            requests.map(req => {
              let requesterMember = members.find(m => 
                (req.requesterName || "").trim().toLowerCase() === m.name.trim().toLowerCase()
              );
              if (!requesterMember && (
                (req.requesterName || "").trim().toLowerCase() === "trưởng nhóm" ||
                (req.requesterName || "").trim().toLowerCase() === "trường nhóm"
              )) {
                requesterMember = members.find(m => 
                  m.role === "Trưởng nhóm" || 
                  m.role === "Trưởng đoàn" || 
                  m.role === "Người đại diện"
                );
              }
              let avatar = requesterMember?.avatar;
              if (!avatar) {
                const requesterName = req.requesterName || "Người được chia sẻ";
                let hash = 0;
                for (let i = 0; i < requesterName.length; i++) {
                  hash = requesterName.charCodeAt(i) + ((hash << 5) - hash);
                }
                const genderChar = (requesterName.toLowerCase().includes("nữ") || 
                                    requesterName.toLowerCase().includes("chị") || 
                                    requesterName.toLowerCase().includes("mẹ") || 
                                    requesterName.toLowerCase().includes("cô") || 
                                    requesterName.toLowerCase().includes("bà")) ? "f" : "m";
                const num = (Math.abs(hash) % 10) + 1;
                avatar = `${genderChar}${num}`;
              }

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200/50">
                        {getAvatarSvg(avatar, "w-full h-full")}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{req.requesterName || "Người được chia sẻ"}</p>
                        <p className="text-[11px] font-medium text-slate-400">
                          {req.createdAt ? new Date(req.createdAt.toMillis()).toLocaleString() : 'Vừa xong'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    {renderChangeDetails(req)}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={isApproving !== null}
                      className="flex-1 rounded-xl bg-slate-100 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      {isApproving === req.id ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isApproving !== null}
                      className="flex-1 rounded-xl bg-kat-primary py-2 text-[13px] font-bold text-white hover:brightness-105 transition-colors disabled:opacity-50"
                    >
                      {isApproving === req.id ? 'Đang xử lý...' : 'Đồng ý áp dụng'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={rejectId !== null}
        onClose={() => setRejectId(null)}
        title="Từ chối đề xuất?"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13.5px] text-rose-800 font-semibold leading-relaxed">
            Bạn có chắc chắn muốn từ chối đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng các chỉnh sửa của thành viên vào chuyến đi của bạn.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setRejectId(null)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (rejectId) {
                  confirmReject(rejectId);
                }
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 transition-all active:scale-[0.98] motion-press"
            >
              Từ chối đề xuất
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isConfirmApproveAllOpen}
        onClose={() => setIsConfirmApproveAllOpen(false)}
        title="Đồng ý tất cả?"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-[13.5px] text-emerald-800 font-semibold leading-relaxed">
            Bạn có chắc chắn muốn đồng ý áp dụng tất cả {requests.length} yêu cầu chỉnh sửa này vào chuyến đi của bạn?
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmApproveAllOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmApproveAll}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-kat-primary border border-emerald-450 px-6 font-bold text-white hover:brightness-105 transition-all active:scale-[0.98] motion-press"
            >
              Đồng ý tất cả
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isConfirmRejectAllOpen}
        onClose={() => setIsConfirmRejectAllOpen(false)}
        title="Từ chối tất cả?"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13.5px] text-rose-800 font-semibold leading-relaxed">
            Bạn có chắc chắn muốn từ chối tất cả {requests.length} đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng bất kỳ thay đổi nào vào chuyến đi của bạn.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmRejectAllOpen(false)}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmRejectAll}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 transition-all active:scale-[0.98] motion-press"
            >
              Từ chối tất cả
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
