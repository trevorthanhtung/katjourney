import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";

export type ToastType = 'success' | 'error';

export const showToast = (message: string, type: ToastType = 'success') => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
};

export const GlobalToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    let timeoutId: any;

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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99999] px-4 w-full max-w-[400px] pointer-events-none motion-toast-enter">
      <div 
        className={`flex items-center gap-3.5 p-3 pr-5 pl-3 rounded-2xl shadow-floating-premium border backdrop-blur-xl transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-white/85 dark:bg-[#111A33]/85 border-emerald-500/20 dark:border-emerald-400/20' 
            : 'bg-white/85 dark:bg-[#111A33]/85 border-rose-500/20 dark:border-rose-400/20'
        }`}
      >
        <div className={`flex shrink-0 items-center justify-center w-9 h-9 rounded-full ${
          toast.type === 'success'
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {toast.type === 'success' ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5" />
          ) : (
            <HugeiconsIcon icon={CancelCircleIcon} className="h-5 w-5" />
          )}
        </div>
        <p className="text-[14px] font-semibold leading-tight text-slate-800 dark:text-slate-200">{toast.message}</p>
      </div>
    </div>,
    document.body
  );
};
