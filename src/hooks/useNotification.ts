import { useState, useEffect } from 'react';
import { showToast } from '../components/ui/ToastManager';

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

  useEffect(() => {
    const supported = getNotificationSupport();
    setIsSupported(supported);

    if (!supported) {
      console.warn('Trình duyệt không hỗ trợ Web Push Notification');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!getNotificationSupport()) {
      setIsSupported(false);
      showToast('Trình duyệt hoặc môi trường hiện tại chưa hỗ trợ thông báo.', 'error');
      return 'denied' as NotificationPermission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
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
    isSupported
  };
}
