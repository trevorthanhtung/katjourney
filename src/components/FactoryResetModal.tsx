import React from "react";
import { executeFactoryReset } from "../utils/dataActions";
import { TypedDeleteConfirmModal } from "./ui";

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FactoryResetModal({ isOpen, onClose }: FactoryResetModalProps) {
  const handleReset = async () => {
    try {
      await executeFactoryReset();
    } catch (err) {
      console.error("Factory reset failed:", err);
    }
  };

  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleReset}
      title="Khôi phục cài đặt gốc?"
      warning={
        <span className="font-bold text-red-600">
          Để xác nhận, vui lòng nhập chính xác chữ XÓA.
        </span>
      }
      description={
        <div className="space-y-3">
          <p>
            Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu trên thiết bị này. Bạn không thể hoàn tác.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-650 text-[13px]">
            <li>Toàn bộ chuyến đi và lịch trình</li>
            <li>Tất cả chi phí và nhật ký hành trình</li>
            <li>Dữ liệu gói đồ và checklist</li>
            <li>Thông tin tài khoản khách hiện tại</li>
          </ul>
        </div>
      }
      confirmLabel="Xác nhận khôi phục"
      confirmationText="XÓA"
      inputPlaceholder="Nhập XÓA"
      itemName="Toàn bộ dữ liệu ứng dụng"
    />
  );
}
