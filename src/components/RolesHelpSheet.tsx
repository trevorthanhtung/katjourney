import React from "react";
import { BottomSheet } from "./ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CrownIcon,
  WalletCardsIcon,
  Car01Icon,
  CompassIcon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";

export function RolesHelpSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const roles = [
    {
      title: "Trưởng nhóm",
      icon: CrownIcon,
      colorClass: "bg-amber-50 text-amber-600 border-amber-200/50",
      description: "Người tạo chuyến đi và có toàn quyền quản trị tối cao.",
      permissions: [
        { label: "Sửa lịch trình trực tiếp", allowed: true },
        { label: "Quản lý chi phí trực tiếp", allowed: true }
      ]
    },
    {
      title: "Tài xế / Dẫn đường",
      icon: Car01Icon,
      icon2: CompassIcon,
      colorClass: "bg-blue-50 text-blue-600 border-blue-200/50",
      description: "Phụ trách di chuyển và định hướng lộ trình chính của đoàn.",
      permissions: [
        { label: "Sửa lịch trình trực tiếp", allowed: true },
        { label: "Đề xuất thêm chi phí", allowed: false }
      ]
    },
    {
      title: "Quản lý chi phí",
      icon: WalletCardsIcon,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
      description: "Quản lý quỹ chung, ghi chép và chia tiền chi tiêu.",
      permissions: [
        { label: "Quản lý chi phí trực tiếp", allowed: true },
        { label: "Đề xuất sửa lịch trình", allowed: false }
      ]
    },
    {
      title: "Người đồng hành",
      icon: UserGroupIcon,
      colorClass: "bg-slate-50 text-slate-600 border-slate-200/50",
      description: "Xem thông tin chuyến đi và gửi các ý kiến đề xuất.",
      permissions: [
        { label: "Đề xuất sửa lịch trình", allowed: false },
        { label: "Đề xuất thêm chi phí", allowed: false }
      ]
    }
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Thông tin các vai trò"
      subtitle="Mỗi thành viên có trách nhiệm khác nhau để cùng vận hành chuyến đi"
    >
      <div className="space-y-4 pb-4">
        {roles.map((role, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${role.colorClass} shadow-sm shrink-0 relative`}>
                <HugeiconsIcon icon={role.icon} className="h-4.5 w-4.5" />
                {role.icon2 && (
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                    <HugeiconsIcon icon={role.icon2} className="h-2.5 w-2.5 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14.5px] font-extrabold text-slate-800 leading-none">
                  {role.title}
                </h4>
                <p className="text-[12px] text-slate-500 font-medium mt-1.5 leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-100/50">
              {role.permissions.map((p, pIdx) => (
                <span
                  key={pIdx}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    p.allowed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      p.allowed ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
