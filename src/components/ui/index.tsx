import React from "react";
import { Plus, X } from "lucide-react";
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
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <input
        className="mt-1.5 w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200 transition-shadow focus:bg-white focus:ring-2 focus:ring-emerald-500"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <textarea
        className="mt-1.5 min-h-[120px] w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200 transition-shadow focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <select
        className="mt-1.5 w-full appearance-none rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200 transition-shadow focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
  onCancel
}: {
  onSave: () => void;
  saveLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onCancel && (
        <button
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-100 px-6 font-bold text-slate-700 transition-colors hover:bg-slate-200 active:bg-slate-300"
          type="button"
          onClick={onCancel}
        >
          Hủy
        </button>
      )}
      <button
        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 shadow-sm"
        type="button"
        onClick={onSave}
      >
        <Plus className="h-5 w-5" />
        {saveLabel}
      </button>
    </div>
  );
}

export function IconButton({ label, onClick, children, danger = false }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      className={classNames(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95",
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
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <p className="text-[15px] font-medium text-slate-500">{text}</p>
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

export function BottomSheet({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fadeIn bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="relative z-10 w-full animate-slideUp rounded-t-[32px] bg-white pb-safe shadow-floating sm:mx-auto sm:max-w-[640px]">
        <div className="flex h-1.5 w-12 mx-auto mt-3 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-[22px] font-bold text-slate-900">{title}</h3>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}

export function FAB({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      className={classNames(
        "fixed bottom-[100px] right-4 z-30 flex items-center justify-center rounded-full text-white shadow-floating transition-all duration-200 active:scale-95 lg:right-[calc(max(1rem,50vw-512px+1rem))] lg:hover:-translate-y-1 lg:hover:shadow-lg",
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
