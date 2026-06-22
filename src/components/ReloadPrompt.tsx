import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon, Cancel01Icon } from "@hugeicons/core-free-icons";

export function ReloadPrompt() {
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registered successfully", r);
      if (r) {
        setRegistration(r);
      }
    },
    onRegisterError(error) {
      console.error("Service Worker registration failed", error);
    },
  });

  // Tự động ẩn thông báo "Sẵn sàng chạy ngoại tuyến" sau 5 giây để không làm phiền người dùng
  React.useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  // Kiểm tra cập nhật định kỳ và khi người dùng quay lại ứng dụng
  React.useEffect(() => {
    if (!registration) return;

    // 1. Kiểm tra bản mới mỗi 60 phút
    const interval = setInterval(() => {
      registration.update().catch((err) => {
        console.error("Periodic update check failed:", err);
      });
    }, 60 * 60 * 1000);

    // 2. Kiểm tra bản mới khi người dùng quay trở lại tab app (focus)
    const handleFocus = () => {
      registration.update().catch((err) => {
        console.error("Update check on focus failed:", err);
      });
    };

    // 3. Kiểm tra bản mới khi thiết bị kết nối mạng trở lại
    const handleOnline = () => {
      registration.update().catch((err) => {
        console.error("Update check on online failed:", err);
      });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [registration]);

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
