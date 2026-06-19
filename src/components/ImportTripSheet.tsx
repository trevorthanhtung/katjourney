import React, { useState, useEffect } from "react";
import { BottomSheet } from "./ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Airplane01Icon,
  ChevronRightIcon
} from "@hugeicons/core-free-icons";
import { useModalHistory } from "../hooks/useModalHistory";

interface ImportTripSheetProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function ImportTripSheet({ isOpen, onClose, showToast }: ImportTripSheetProps) {
  const [sharedLinkInput, setSharedLinkInput] = useState("");
  const [recentSharedTrips, setRecentSharedTrips] = useState<{ token: string; title: string; date: string; timestamp: number }[]>([]);

  useModalHistory(isOpen, onClose, "import-modal");

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("kat_recent_shared_trips");
      if (saved) {
        try {
          setRecentSharedTrips(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  const parseToken = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (trimmed.includes("/share/")) {
      const parts = trimmed.split("/share/");
      if (parts.length > 1) {
        return parts[1].split("/")[0].split("?")[0];
      }
    }
    return trimmed;
  };

  const handleImport = () => {
    const token = parseToken(sharedLinkInput);
    if (token) {
      window.location.href = "/share/" + token;
    } else {
      showToast("Liên kết không hợp lệ. Vui lòng thử lại!");
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSharedLinkInput("");
      }}
      title="Xem chuyến đi được chia sẻ"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="shared-link-input" className="text-sm font-semibold text-slate-605 block">
            Nhập liên kết chia sẻ chuyến đi
          </label>
          <div className="flex gap-2.5">
            <input
              id="shared-link-input"
              type="text"
              name="shared-link"
              value={sharedLinkInput}
              onChange={(e) => setSharedLinkInput(e.target.value)}
              placeholder="Dán link chuyến đi được chia sẻ…"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 h-[50px] text-[15px] font-bold text-[#030D2E] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#00BFB7] focus:border-transparent placeholder:text-slate-400"
            />
            <button
              onClick={handleImport}
              className="inline-flex h-[50px] shrink-0 items-center justify-center rounded-[14px] bg-[#030D2E] hover:bg-[#0a1a5c] text-white px-6 font-black active:scale-[0.98] transition-all duration-200"
            >
              Xem ngay
            </button>
          </div>
        </div>

        {recentSharedTrips.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-[12px] font-black uppercase tracking-wider text-slate-400">
              Lịch sử xem gần đây
            </h4>
            <div className="space-y-2">
              {recentSharedTrips.map((trip) => (
                <div
                  key={trip.token}
                  onClick={() => {
                    window.location.href = "/share/" + trip.token;
                  }}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-[#00BFB7]/20 cursor-pointer active:scale-[0.99] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00BFB7]/10 text-[#00BFB7]">
                      <HugeiconsIcon icon={Airplane01Icon} className="h-5 w-5 -rotate-45" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[14.5px] font-extrabold text-[#030D2E] truncate group-hover:text-[#00BFB7] transition-colors">
                        {trip.title}
                      </p>
                      <p className="text-[12px] font-semibold text-slate-400 mt-0.5">
                        Khởi hành: {trip.date}
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={ChevronRightIcon} className="h-5 w-5 text-slate-400 group-hover:text-[#00BFB7] group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
