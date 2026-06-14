import { useState, useEffect } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      console.warn('Trình duyệt không hỗ trợ Web Push Notification');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ thông báo.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Lỗi khi xin quyền thông báo:', error);
      return 'denied';
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      alert('Chưa có quyền gửi thông báo!');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification('KAT Journey', {
          body: 'Thông báo hoạt động hoàn hảo! 🎉',
          icon: '/asset/icon-192.png',
          vibrate: [200, 100, 200],
          badge: '/asset/icon-192.png'
        } as any);
      } else {
        alert('Không tìm thấy Service Worker để gửi thông báo.');
      }
    } catch (error) {
      console.error('Lỗi khi gửi thông báo test:', error);
      alert('Lỗi: Không thể gửi thông báo test qua Service Worker.');
    }
  };

  return {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}
