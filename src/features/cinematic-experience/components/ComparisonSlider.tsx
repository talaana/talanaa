import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MoveHorizontal } from 'lucide-react';
export interface ComparisonPair {
  leftLabel: string;
  rightLabel: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

interface Props {
  open: boolean;
  comparison: ComparisonPair | null;
  onClose: () => void;
}

/**
 * Interactive split-slider comparing two metal finishes (e.g. 18K yellow vs
 * rose gold). Draggable divider; graceful without imagery (metallic gradients).
 */
export default function ComparisonSlider({ open, comparison, onClose }: Props) {
  const [split, setSplit] = useState(50);

  const move = (clientX: number, rect: DOMRect) => {
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(4, Math.min(96, pct)));
  };

  return (
    <AnimatePresence>
      {open && comparison && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#14100a] text-amber-50 rounded-3xl overflow-hidden border border-amber-200/10 shadow-2xl"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-amber-200/10">
              <h3 className="font-black text-amber-100">مقایسه فلزات</h3>
              <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100"><X className="w-5 h-5" /></button>
            </div>

            <div
              className="relative aspect-video select-none overflow-hidden cursor-ew-resize"
              onPointerDown={(e) => {
                const el = e.currentTarget;
                const move2 = (ev: PointerEvent) => move(ev.clientX, el.getBoundingClientRect());
                const up = () => {
                  window.removeEventListener('pointermove', move2);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move2);
                window.addEventListener('pointerup', up);
                move(e.clientX, el.getBoundingClientRect());
              }}
            >
              {/* Right (base) pane */}
              <div className="absolute inset-0" style={{ background: metalGradient('#d4af37', '#8a6d1f') }} />
              {/* Left (overlay) pane clipped to split */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)`, background: metalGradient('#e8b4b8', '#9c6b6b') }} />
              {/* Divider */}
              <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${split}%` }}>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <MoveHorizontal className="w-4 h-4" />
                </span>
              </div>
              {/* Labels */}
              <span className="absolute top-3 left-3 text-[11px] font-black bg-black/50 px-2.5 py-1 rounded-full">{comparison.rightLabel}</span>
              <span className="absolute top-3 right-3 text-[11px] font-black bg-black/50 px-2.5 py-1 rounded-full">{comparison.leftLabel}</span>
            </div>

            <div className="flex items-center justify-between p-4 text-[11px] font-bold text-amber-200/60">
              <span>{comparison.leftLabel}</span>
              <span className="text-amber-300">برای مقایسه بکشید</span>
              <span>{comparison.rightLabel}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function metalGradient(from: string, to: string): string {
  return `linear-gradient(135deg, ${from} 0%, ${to} 60%, ${from} 100%)`;
}
