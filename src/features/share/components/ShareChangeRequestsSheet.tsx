import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { AppChangeRequest } from '../../../hooks/useShareChangeRequests';
import { BottomSheet } from '../../../components/ui';
import { approveChangeRequest, rejectChangeRequest } from '../../../services/shareApprovalService';
import { showToast } from '../../../components/ui/ToastManager';
import { formatMoney } from '../../../utils/helpers';
import { Member } from '../../../db';
import { getAvatarSvg } from '../../../utils/avatars';

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

  async function handleReject(requestId: string) {
    if (!confirm("Bạn muốn từ chối đề xuất này?")) return;
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

  function renderChangeDetails(req: AppChangeRequest) {
    const { section, action, before, after } = req;
    
    let sectionName = section;
    if (section === 'activities') sectionName = 'Lịch trình';
    if (section === 'expenses') sectionName = 'Chi phí';
    if (section === 'checklist') sectionName = 'Chuẩn bị';
    if (section === 'journals') sectionName = 'Nhật ký';
    if (section === 'backupPlans') sectionName = 'Phương án dự phòng';
    if (section === 'travelDocuments') sectionName = 'Giấy tờ';

    let actionName = action === 'create' ? 'Thêm' : action === 'update' ? 'Sửa' : 'Xóa';
    
    let beforeText = '';
    let afterText = '';

    const formatObj = (o: any) => {
      if (!o) return '';
      if (o.title) return o.title;
      if (o.description && o.amount) return `${o.description} (${formatMoney(o.amount)})`;
      if (o.description) return o.description;
      return JSON.stringify(o);
    };

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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu chỉnh sửa"
      subtitle={requests.length > 0 ? `${requests.length} yêu cầu đang chờ duyệt.` : "Chưa có yêu cầu nào."}
    >
      <div className="px-1 pb-6 space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-slate-500">Chưa có yêu cầu chỉnh sửa nào.</p>
          </div>
        ) : (
          requests.map(req => {
            const requesterMember = members.find(m => 
              (req.requesterName || "").trim().toLowerCase() === m.name.trim().toLowerCase()
            );
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
  );
}
