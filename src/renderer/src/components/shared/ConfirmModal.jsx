import React from "react";

// Dideklarasikan di luar komponen agar tidak ada self-reference saat assignment
const VARIANT_COLORS = {
  danger: {
    icon: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    btn: "bg-red-600 hover:bg-red-500 text-white",
  },
  warning: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    btn: "bg-amber-600 hover:bg-amber-500 text-white",
  },
  info: {
    icon: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    btn: "bg-indigo-600 hover:bg-indigo-500 text-white",
  },
};

/**
 * Modal konfirmasi — menggantikan native alert() / confirm().
 *
 * Props:
 *   open         – boolean
 *   title        – string
 *   message      – string | React node
 *   confirmLabel – string (default: "Ya, Lanjutkan")
 *   cancelLabel  – string (default: "Batal")
 *   variant      – "danger" | "warning" | "info" (default: "danger")
 *   onConfirm    – () => void
 *   onCancel     – () => void
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const colors = VARIANT_COLORS[variant] ?? VARIANT_COLORS.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div
          className={`flex items-start gap-4 p-4 rounded-xl border ${colors.bg} mb-4`}
        >
          <svg
            className={`w-5 h-5 shrink-0 mt-0.5 ${colors.icon}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className={`text-sm font-bold ${colors.icon}`}>{title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 border border-white/[0.08] rounded-xl transition-all hover:bg-white/[0.04]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-[0.98] ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
