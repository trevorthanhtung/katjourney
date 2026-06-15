import { useState, useEffect } from 'react';
import { showToast } from '../components/ui/ToastManager';
import { initFirebase } from '../lib/firebase';

const getNotificationSupport = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    window.isSecureContext
  );
};

/** Wraps serviceWorker.ready with a timeout to avoid hanging in unsupported envs */
const getSWRegistration = (timeoutMs = 4000): Promise<ServiceWorkerRegistration | null> => {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]) as Promise<ServiceWorkerRegistration | null>;
};

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isFcmLoading, setIsFcmLoading] = useState(false);
  const [enabled, setEnabledState] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('kat_notifications_enabled') !== 'false';
    }
    return true;
  });

  const setEnabled = (val: boolean) => {
    setEnabledState(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kat_notifications_enabled', val ? 'true' : 'false');
    }
  };

  const fetchFcmToken = async () => {
    const supported = getNotificationSupport();
    if (!supported || Notification.permission !== 'granted') return null;

    setIsFcmLoading(true);
    try {
      const { app } = await initFirebase();
      const { getMessaging, getToken } = await import("firebase/messaging");
      const messaging = getMessaging(app);

      const registration = await getSWRegistration();
      if (!registration) {
        console.warn("Service Worker chưa sẵn sàng để lấy FCM Token.");
        setIsFcmLoading(false);
        return null;
      }

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      setFcmToken(token);
      console.log("FCM Token obtained successfully:", token);
      return token;
    } catch (error) {
      console.error("Lỗi khi lấy FCM Token:", error);
      return null;
    } finally {
      setIsFcmLoading(false);
    }
  };

  useEffect(() => {
    const supported = getNotificationSupport();
    setIsSupported(supported);

    if (!supported) {
      console.warn('Trình duyệt không hỗ trợ Web Push Notification');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  // Fetch token automatically when permission is granted and enabled
  useEffect(() => {
    if (isSupported && enabled && permission === 'granted') {
      fetchFcmToken();
    } else {
      setFcmToken(null);
    }
  }, [isSupported, enabled, permission]);

  // Listen for foreground FCM messages
  useEffect(() => {
    if (isSupported && enabled && permission === 'granted') {
      let unsubscribe: (() => void) | undefined;

      initFirebase().then(({ app }) => {
        import("firebase/messaging").then(({ getMessaging, onMessage }) => {
          const messaging = getMessaging(app);
          unsubscribe = onMessage(messaging, (payload) => {
            console.log("Nhận tin nhắn foreground:", payload);
            if (payload.notification) {
              showToast(
                `${payload.notification.title || 'KAT Journey'}: ${payload.notification.body || ''}`, 
                'success'
              );
            }
          });
        }).catch(err => {
          console.warn("Lỗi nạp thư viện firebase/messaging:", err);
        });
      }).catch(err => {
        console.warn("Firebase không khả dụng, bỏ qua đăng ký foreground message listener.", err);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isSupported, enabled, permission]);

  const requestPermission = async () => {
    if (!getNotificationSupport()) {
      setIsSupported(false);
      showToast('Trình duyệt hoặc môi trường hiện tại chưa hỗ trợ thông báo.', 'error');
      return 'denied' as NotificationPermission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setTimeout(fetchFcmToken, 500);
      }
      return result;
    } catch (error) {
      console.error('Lỗi khi xin quyền thông báo:', error);
      return 'denied' as NotificationPermission;
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      showToast('Chưa có quyền gửi thông báo!', 'error');
      return;
    }
    if (!enabled) {
      showToast('Thông báo ứng dụng hiện đang tắt trong cài đặt!', 'error');
      return;
    }

    try {
      const registration = await getSWRegistration();
      if (!registration) {
        showToast('Service Worker chưa sẵn sàng — hãy thử trên Chrome/mobile thật.', 'error');
        return;
      }
      await registration.showNotification('KAT Journey', {
        body: 'Thông báo hoạt động hoàn hảo!',
        icon: '/asset/icon-192.png',
        vibrate: [200, 100, 200],
        badge: '/asset/icon-192.png'
      } as any);
    } catch (error) {
      console.error('Lỗi khi gửi thông báo test:', error);
      showToast('Lỗi: Không thể gửi thông báo test qua Service Worker.', 'error');
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
    fetchFcmToken
  };
}
