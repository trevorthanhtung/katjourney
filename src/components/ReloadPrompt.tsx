import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon, Cancel01Icon } from "@hugeicons/core-free-icons";

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registered successfully", r);
    },
    onRegisterError(error) {
      console.error("Service Worker registration failed", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-[9999] animate-slideUp">
      <div className="bg-kat-surface border border-kat-border shadow-floating rounded-[20px] p-4 md:p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-kat-primary-soft flex items-center justify-center text-kat-teal shrink-0">
            <HugeiconsIcon icon={RefreshIcon} className="w-5 h-5 animate-spin-slow text-kat-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-[15px] font-extrabold text-kat-dark leading-snug">
              {needRefresh ? "Có phiên bản mới!" : "Sẵn sàng chạy ngoại tuyến"}
            </h4>
            <p className="text-xs text-kat-muted mt-1 leading-relaxed">
              {needRefresh
                ? "Ứng dụng KAT Journey đã có bản cập nhật mới nhất. Bạn có muốn tải về và làm mới ứng dụng ngay không?"
                : "Ứng dụng đã được lưu ngoại tuyến thành công, bạn có thể truy cập mà không cần mạng."}
            </p>
          </div>
          <button
            onClick={close}
            className="text-kat-muted hover:text-kat-dark transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-kat-bg"
            aria-label="Đóng"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <button
            onClick={close}
            className="px-4 py-2 text-xs font-extrabold text-kat-muted hover:text-kat-dark hover:bg-kat-bg rounded-xl transition-all duration-200 active:scale-95"
          >
            Để sau
          </button>
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-4.5 py-2 text-xs font-extrabold text-white bg-kat-teal hover:bg-kat-primary-usable rounded-xl shadow-sm transition-all duration-200 active:scale-95"
            >
              Cập nhật ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
