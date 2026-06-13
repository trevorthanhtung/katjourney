import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

export const showToast = (message: string, type: ToastType = 'success') => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
};

export const GlobalToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleToast = (e: any) => {
      setToast(e.detail);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => {
      window.removeEventListener('app-toast', handleToast);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!toast) return null;

  return createPortal(
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-[400px] pointer-events-none motion-page-enter">
      <div 
        className={`flex items-center gap-2 p-3.5 px-5 rounded-2xl shadow-xl border ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20' 
            : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        <p className="text-[14px] font-bold leading-tight">{toast.message}</p>
      </div>
    </div>,
    document.body
  );
};
