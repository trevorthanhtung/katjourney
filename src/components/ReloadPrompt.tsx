import React from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SystemUpdate01Icon, Download01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

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
    <div className={`fixed right-4 left-4 md:left-auto md:w-[380px] z-[9999] animate-slideUp transition-all duration-300 ${hasBottomNav ? "bottom-24 lg:bottom-6" : "bottom-6"}`}>
      <div className="backdrop-blur-xl bg-white/95 dark:bg-[#111A33]/90 border border-slate-200/50 dark:border-slate-800/60 shadow-[0_20px_50px_rgba(3,13,46,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] rounded-[24px] p-5 flex flex-col gap-4.5 transition-all duration-300">
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 dark:border-teal-500/30 text-kat-teal shrink-0 shadow-inner">
            <div className="absolute inset-0 rounded-2xl bg-kat-teal/5 animate-pulse" />
            <HugeiconsIcon icon={needRefresh ? SystemUpdate01Icon : Download01Icon} className="w-5.5 h-5.5 text-kat-teal relative z-10 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-[16px] font-black text-kat-dark dark:text-white tracking-tight leading-snug">
              {needRefresh ? t("pwa.newVersion") : t("pwa.offlineReady")}
            </h4>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
              {needRefresh
                ? t("pwa.newVersionDesc")
                : t("pwa.offlineReadyDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <button
            onClick={close}
            className="px-4 py-2.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 border border-slate-200/30 dark:border-slate-700/30 rounded-xl transition-all duration-200 active:scale-[0.97] hover:scale-[1.01]"
          >
            {t("pwa.later")}
          </button>
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md shadow-teal-500/10 hover:shadow-teal-500/25 hover:shadow-lg transition-all duration-200 active:scale-[0.97] hover:scale-[1.01]"
            >
              {t("pwa.updateNow")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
