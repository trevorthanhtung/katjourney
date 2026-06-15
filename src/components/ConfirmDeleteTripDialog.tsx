import React from "react";
import { TypedDeleteConfirmModal } from "./ui";

type ConfirmDeleteTripDialogProps = {
  open: boolean;
  tripName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDeleteTripDialog({
  open,
  tripName,
  onClose,
  onConfirm
}: ConfirmDeleteTripDialogProps) {
  return (
    <TypedDeleteConfirmModal
      isOpen={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa vĩnh viễn chuyến đi này?"
      description="Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của chuyến đi, bao gồm thành viên, lịch trình, chi phí, chuẩn bị, bản tin hành trình, giấy tờ và phương án dự phòng khỏi thiết bị này. Bạn không thể hoàn tác."
      warning={
        <span className="font-bold">
          Để xác nhận, vui lòng nhập chính xác chữ XÓA.
        </span>
      }
      confirmLabel="Xóa vĩnh viễn chuyến đi"
      confirmationText="XÓA"
      inputPlaceholder="Nhập XÓA"
      itemName={tripName}
    />
  );
}
