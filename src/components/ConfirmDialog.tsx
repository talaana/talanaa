import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Unified confirmation dialog.
 *
 * Desktop: centered modal with backdrop.
 * Mobile:  bottom sheet sliding up.
 *
 * Used for delete confirmations and irreversible actions.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  cancelLabel = 'انصراف',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDanger = variant === 'danger';
  const iconBg = isDanger ? 'bg-rose-100' : 'bg-amber-100';
  const iconColor = isDanger ? 'text-rose-600' : 'text-amber-600';
  const btnBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/30'
    : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30';

  const content = (
    <>
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-4`}>
        <AlertTriangle className={`w-7 h-7 ${iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="text-base font-black text-slate-800 text-center mb-1">{title}</h3>

      {/* Message */}
      {message && (
        <p className="text-xs text-slate-500 text-center leading-relaxed mb-6">{message}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-black hover:bg-slate-200 transition-all"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 ${btnBg} text-white py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              در حال حذف...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </>
  );

  return createPortal(
    <>
      {/* Desktop: centered modal */}
      <div className="hidden lg:flex fixed inset-0 z-[200] items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
          onClick={onCancel}
        />
        {/* Modal */}
        <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="lg:hidden fixed inset-0 z-[200]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
          onClick={onCancel}
        />
        {/* Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-6 animate-[slideUp_0.3s_ease-out]">
          {/* Handle */}
          <div className="flex justify-center -mt-2 mb-4">
            <div className="w-10 h-1.5 rounded-full bg-slate-300" />
          </div>
          {content}
          {/* Safe area */}
          <div className="h-4" />
        </div>
      </div>
    </>,
    document.body
  );
}
