import i18n from "../i18n";
import { useState, useEffect } from "react";
import { showToast } from "../components/ui/ToastManager";

const getNotificationSupport = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return "Notification" in window && "serviceWorker" in navigator && window.isSecureContext;
};

/** Wraps serviceWorker.ready with a timeout to avoid hanging in unsupported envs */
const getSWRegistration = (timeoutMs = 4000): Promise<ServiceWorkerRegistration | null> => {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]) as Promise<ServiceWorkerRegistration | null>;
};

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [fcmToken] = useState<string | null>(null);
  const [isFcmLoading] = useState(false);
  const [enabled, setEnabledState] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("kat_notifications_enabled") !== "false";
    }
    return true;
  });

  const setEnabled = (val: boolean) => {
    setEnabledState(val);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kat_notifications_enabled", val ? "true" : "false");
    }
  };

  const fetchFcmToken = async () => {
    // Cloud Messaging is removed. Return null.
    return null;
  };

  useEffect(() => {
    const supported = getNotificationSupport();
    setIsSupported(supported);

    if (!supported) {
      console.warn("Browser does not support Web Push Notification");
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!getNotificationSupport()) {
      setIsSupported(false);
      showToast(
        i18n.t("notifications.notSupported", "Notifications are not supported in this browser."),
        "error"
      );
      return "denied" as NotificationPermission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied" as NotificationPermission;
    }
  };

  const sendTestNotification = async () => {
    if (permission !== "granted") {
      showToast(
        i18n.t("notifications.permissionDenied", "Notification permission not granted!"),
        "error"
      );
      return;
    }
    if (!enabled) {
      showToast(
        i18n.t("notifications.disabledInSettings", "App notifications are disabled in settings!"),
        "error"
      );
      return;
    }

    try {
      const registration = await getSWRegistration();
      if (!registration) {
        showToast(
          i18n.t(
            "notifications.swNotReady",
            "Service Worker not ready — try on real Chrome/mobile."
          ),
          "error"
        );
        return;
      }
      await registration.showNotification("KAT Journey", {
        body: i18n.t("notifications.testSuccess", "Notifications working perfectly!"),
        icon: "/asset/icon-192.png",
        vibrate: [200, 100, 200],
        badge: "/asset/icon-192.png",
      } as any);
    } catch (error) {
      console.error("Error sending test notification:", error);
      showToast(
        i18n.t(
          "notifications.testFailed",
          "Error: Cannot send test notification via Service Worker."
        ),
        "error"
      );
    }
  };

  return {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported,
    enabled,
    setEnabled,
    fcmToken,
    isFcmLoading,
    fetchFcmToken,
  };
}
