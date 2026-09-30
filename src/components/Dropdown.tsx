import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Unified dropdown component.
 *
 * Desktop: floating popover (portal — never clipped by overflow).
 * Mobile:  bottom sheet sliding up from the bottom.
 *
 * RTL-aware — all text is right-aligned.
 */
export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'انتخاب کنید',
  className = '',
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;
  const isPlaceholder = !selected;

  // ── Popover position (desktop) ───────────────────────
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (open) {
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
      return () => {
        window.removeEventListener('resize', updatePos);
        window.removeEventListener('scroll', updatePos, true);
      };
    }
  }, [open, updatePos]);

  // ── Close on outside click ──────────────────────────
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (
      triggerRef.current?.contains(target) ||
      menuRef.current?.contains(target)
    ) return;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      // Use a microtask so the opening click doesn't immediately close it
      requestAnimationFrame(() => {
        document.addEventListener('mousedown', handleClickOutside);
      });
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  // ── Close on Escape ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // ── Keyboard navigation ─────────────────────────────
  const [focusedIdx, setFocusedIdx] = useState(-1);
  useEffect(() => { if (!open) setFocusedIdx(-1); }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); onChange(options[focusedIdx].value); setOpen(false); }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setOpen(false);
  };

  // ── Portal overlay ──────────────────────────────────
  const menuPortal = open && createPortal(
    <>
      {/* Desktop popover */}
      <div className="hidden lg:block" ref={menuRef}>
        <div
          className="fixed z-[200] bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden animate-[fadeIn_0.15s_ease-out]"
          style={pos ? { top: pos.top, left: pos.left, width: pos.width } : { top: 0, left: 0 }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIdx;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value); }}
                onMouseEnter={() => setFocusedIdx(idx)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-right transition-colors
                  ${isSelected ? 'text-amber-700 bg-amber-50 font-bold' : isFocused ? 'text-slate-800 bg-slate-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden fixed inset-0 z-[200]">
        <div
          className="absolute inset-0 bg-black/30 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setOpen(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col animate-[slideUp_0.3s_ease-out]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-slate-300" />
          </div>
          {/* Header */}
          <div className="px-6 py-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 text-center">{placeholder}</h3>
          </div>
          {/* Options */}
          <div className="overflow-y-auto py-2 px-2" ref={menuRef}>
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isFocused = idx === focusedIdx;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm text-right transition-colors
                    ${isSelected ? 'text-amber-700 bg-amber-50 font-bold' : isFocused ? 'text-slate-800 bg-slate-50' : 'text-slate-600 active:bg-slate-50'}`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="h-4" />
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      {/* ─── Trigger button ──────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={`group w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right transition-all
          hover:border-amber-400 hover:bg-white
          focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? 'border-amber-500 bg-white ring-2 ring-amber-500/20' : ''}
          ${className}`}
      >
        <span className={`truncate flex-1 ${isPlaceholder ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>
          {displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180 text-amber-600' : 'group-hover:text-slate-600'}`} />
      </button>

      {menuPortal}
    </>
  );
}
