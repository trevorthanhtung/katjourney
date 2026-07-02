import React from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SystemUpdate01Icon, Download01Icon } from "@hugeicons/core-free-icons";

export function ReloadPrompt({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  const { t } = useTranslation();
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

  // Hỗ trợ kiểm thử thông báo qua URL query (?test_update=true hoặc ?test_offline=true)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test_update") === "true") {
      setNeedRefresh(true);
    }
    if (params.get("test_offline") === "true") {
      setOfflineReady(true);
    }
  }, [setNeedRefresh, setOfflineReady]);

  // Kiểm tra cập nhật định kỳ và khi người dùng quay lại ứng dụng
  React.useEffect(() => {
    if (!registration) return;

    // 1. Kiểm tra bản mới mỗi 60 phút
    const interval = setInterval(
      () => {
        registration.update().catch((err) => {
          console.error("Periodic update check failed:", err);
        });
      },
      60 * 60 * 1000
    );

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
    <div
      className={`fixed right-4 left-4 md:left-auto md:w-[400px] z-9999 animate-slideUp transition-all duration-300 ${hasBottomNav ? "bottom-24 lg:bottom-6" : "bottom-6"}`}
    >
      <div className="relative overflow-hidden backdrop-blur-2xl bg-white/90 dark:bg-[#0A0F1C]/90 border border-white/60 dark:border-white/10 shadow-[0_24px_50px_rgba(0,191,183,0.12)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.5)] rounded-[28px] p-6 flex flex-col gap-5 transition-all duration-300">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-linear-to-r from-transparent via-[#00BFB7]/40 to-transparent blur-[2px]" />
        
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] bg-linear-to-b from-[#00BFB7]/10 to-[#00BFB7]/5 border border-[#00BFB7]/20 dark:border-[#00BFB7]/30 shrink-0 shadow-inner group">
            <div className="absolute inset-0 rounded-[18px] bg-[#00BFB7]/10 animate-pulse blur-md" />
            <HugeiconsIcon
              icon={needRefresh ? SystemUpdate01Icon : Download01Icon}
              className="w-6 h-6 text-[#00BFB7] relative z-10 transition-transform duration-500 group-hover:rotate-180"
              strokeWidth={2}
            />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="font-display text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {needRefresh ? t("pwa.newVersion") : t("pwa.offlineReady")}
            </h4>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium pr-2">
              {needRefresh ? t("pwa.newVersionDesc") : t("pwa.offlineReadyDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={close}
            className="flex-1 px-4 py-3.5 text-[13.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-200 active:scale-[0.98] motion-press"
          >
            {t("pwa.later")}
          </button>
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 relative overflow-hidden px-5 py-3.5 text-[13.5px] font-bold text-white bg-kat-dark dark:bg-kat-primary rounded-2xl shadow-[0_8px_20px_rgba(2,6,23,0.12)] dark:shadow-[0_8px_20px_rgba(0,191,183,0.25)] hover:shadow-[0_12px_24px_rgba(2,6,23,0.2)] dark:hover:shadow-[0_12px_24px_rgba(0,191,183,0.35)] transition-all duration-300 active:scale-[0.98] group"
            >
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
              <span className="relative z-10 dark:text-slate-950">
                {t("pwa.updateNow")}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
