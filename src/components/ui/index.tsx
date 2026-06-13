import React from "react";
import { createPortal } from "react-dom";
import { Plus, X, Check, Trash2 } from "lucide-react";
import { classNames } from "../../utils/helpers";

export { classNames };

export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-xl font-bold text-slate-800">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">{label}</span>
      <input
        className="mt-1.5 w-full rounded-[14px] border-0 bg-slate-50 px-4 h-[50px] text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7] placeholder-slate-400"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Textarea({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: React.ReactNode; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string 
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">{label}</span>
      <textarea
        className="mt-1.5 min-h-[120px] w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7] placeholder-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  labels
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">{label}</span>
      <select
        className="mt-1.5 w-full appearance-none rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option ? labels?.[option] ?? option : placeholder ?? "Chưa chọn"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormActions({
  onSave,
  saveLabel,
  onCancel,
  disabled
}: {
  onSave: () => void;
  saveLabel: string;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2 w-full">
      {onCancel && (
        <button
          className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
          type="button"
          onClick={onCancel}
        >
          Hủy
        </button>
      )}
      <button
        className="inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#00BFB7] text-[#030D2E] px-6 font-black shadow-sm hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100"
        type="button"
        onClick={onSave}
        disabled={disabled}
      >
        <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
        {saveLabel}
      </button>
    </div>
  );
}

export function IconButton({ label, onClick, children, danger = false }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      className={classNames(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors motion-press",
        danger ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
      )}
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function EmptyCard({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] bg-kat-surface p-8 text-center border border-kat-border/60 shadow-soft max-w-md mx-auto">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold text-kat-text/80">{text}</p>
    </div>
  );
}

export function ScreenTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 px-1 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[32px] font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-[15px] font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</div>
      <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function ProgressBar({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={classNames("overflow-hidden rounded-full bg-slate-100", compact ? "mt-3 h-1.5" : "mt-4 h-2.5")}>
      <div className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 120, strokeWidth = 10, children }: { value: number; size?: number; strokeWidth?: number; children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90 transform" width={size} height={size}>
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children,
  footer,
  headerAction
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  subtitle?: React.ReactNode; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 motion-modal-overlay bg-slate-900/35 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet / Dialog */}
      <div className="relative z-10 flex w-full flex-col max-h-[90vh] md:max-h-[min(720px,calc(100vh-48px))] motion-sheet-dialog md:motion-modal-dialog rounded-t-[32px] md:rounded-[24px] bg-white pb-safe shadow-floating md:mx-auto md:w-full md:max-w-[600px] overflow-hidden">
        {/* Drag handle (mobile only) */}
        <div className="flex shrink-0 h-1.5 w-12 mx-auto mt-3 mb-1 rounded-full bg-slate-200 md:hidden" />
        
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 md:px-6 py-3.5 md:py-4 gap-3">
          <div className="pr-2 min-w-0 flex-1">
            <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 leading-snug truncate">{title}</h3>
            {subtitle && <div className="mt-1 text-[13.5px] text-slate-500 leading-relaxed">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button 
              className="flex shrink-0 h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none" 
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-5 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-none border-t border-slate-100 bg-[#FFFDF8] px-5 md:px-6 py-3.5 md:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function TypedDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmLabel = "Xóa",
  confirmationText = "XÓA",
  inputPlaceholder,
  itemName
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  warning?: React.ReactNode;
  confirmLabel?: string;
  confirmationText?: string;
  inputPlaceholder?: string;
  itemName?: string;
}) {
  const [typedText, setTypedText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const normalizedTypedText = typedText.trim().normalize("NFC").toUpperCase();
  const normalizedConfirmationText = confirmationText.trim().normalize("NFC").toUpperCase();
  const isConfirmed = normalizedTypedText === normalizedConfirmationText;

  React.useEffect(() => {
    if (isOpen) {
      setTypedText("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (!isConfirmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13.5px] text-rose-800 font-semibold leading-relaxed">
          {warning ?? description}
        </div>

        {warning && (
          <p className="text-[14px] font-semibold leading-relaxed text-slate-600">
            {description}
          </p>
        )}

        {itemName && (
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <p className="text-[12px] font-black uppercase tracking-wide text-slate-400">Mục sẽ xóa</p>
            <p className="mt-1 break-words text-[15px] font-extrabold text-[#030D2E]">{itemName}</p>
          </div>
        )}

        <label className="block space-y-2">
          <span className="text-[13.5px] font-bold text-slate-600 block">
            Nhập <span className="text-rose-500 font-black">{confirmationText}</span> để xác nhận thao tác này.
          </span>
          <input
            type="text"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            placeholder={inputPlaceholder ?? `Gõ ${confirmationText} để xác nhận`}
            className="w-full rounded-[14px] border border-slate-200/60 bg-slate-50 px-4 h-[50px] text-[15px] font-bold text-[#030D2E] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400"
          />
        </label>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleConfirm}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 disabled:bg-rose-200 disabled:border-rose-200 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100 motion-press"
          >
            <Trash2 className="h-5 w-5" />
            {isSubmitting ? "Đang xóa..." : confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmLabel = "Xóa"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  itemName?: string;
  confirmLabel?: string;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13.5px] text-rose-800 font-semibold leading-relaxed">
          {description}
        </div>

        {itemName && (
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <p className="text-[12px] font-black uppercase tracking-wide text-slate-400">Mục sẽ xóa</p>
            <p className="mt-1 break-words text-[15px] font-extrabold text-[#030D2E]">{itemName}</p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 motion-press"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-rose-600 border border-rose-700 px-6 font-bold text-white hover:bg-rose-700 disabled:bg-rose-200 disabled:border-rose-200 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100 motion-press"
          >
            <Trash2 className="h-5 w-5" />
            {isSubmitting ? "Đang xóa..." : confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}


export function FAB({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      className={classNames(
        "fixed bottom-[100px] right-4 z-30 flex items-center justify-center rounded-full text-white shadow-floating lg:right-[calc(max(1rem,50vw-512px+1rem))] motion-press lg:motion-hover-lift",
        className || "h-14 w-14 bg-sunset-600 hover:scale-105"
      )}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
