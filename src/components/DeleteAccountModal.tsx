import React, { useState } from "react";
import { executeDeleteAccount } from "../utils/dataActions";
import { TypedDeleteConfirmModal } from "./ui";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    setErrorMsg(null);
    try {
      await executeDeleteAccount();
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      if (err.message === "requires-recent-login") {
        setErrorMsg("Hành động này yêu cầu đăng nhập gần đây. Vui lòng đăng xuất và đăng nhập lại bằng Google để xác thực trước khi thực hiện xóa tài khoản.");
      } else {
        setErrorMsg("Đã xảy ra lỗi khi xóa tài khoản. Vui lòng thử lại sau.");
      }
      throw err;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Xóa tài khoản của bạn?"
      warning={
        <span className="font-bold text-red-600">
          Để xác nhận, vui lòng nhập chính xác chữ XÓA.
        </span>
      }
      description={
        <div className="space-y-4">
          <p className="text-[14px] text-slate-700">
            Hành động này sẽ xóa vĩnh viễn tài khoản của bạn trên hệ thống Cloud và toàn bộ dữ liệu lưu trữ cục bộ. Bạn không thể hoàn tác.
          </p>
          <div className="bg-slate-100 p-3.5 rounded-xl text-left">
            <p className="font-bold text-slate-700 text-[13px] mb-1">Dữ liệu sẽ bị xóa:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-650 text-[12.5px]">
              <li>Tài khoản đăng nhập trên hệ thống</li>
              <li>Toàn bộ chuyến đi và lịch trình đã lưu</li>
              <li>Tất cả chi phí, bản tin hành trình</li>
              <li>Danh sách chuẩn bị hành lý & giấy tờ</li>
            </ul>
          </div>
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-800 font-bold leading-relaxed flex items-start gap-2 text-left animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      }
      confirmLabel="Xác nhận xóa tài khoản"
      confirmationText="XÓA"
      inputPlaceholder="Nhập XÓA để xác nhận"
      itemName="Tài khoản và toàn bộ dữ liệu KAT Journey"
    />
  );
}
