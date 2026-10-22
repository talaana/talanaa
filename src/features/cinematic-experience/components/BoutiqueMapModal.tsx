import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin } from 'lucide-react';
import type { SequenceNode } from '../types/sequenceGraph';

interface Props {
  open: boolean;
  scenes: SequenceNode[];
  activeIndex: number;
  onClose: () => void;
  onTeleport: (index: number) => void;
}

/** Architectural floor-plan atlas with the customer's location and teleport. */
export default function BoutiqueMapModal({ open, scenes, activeIndex, onClose, onTeleport }: Props) {
  return (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-lg bg-[#14100a] text-amber-50 rounded-3xl overflow-hidden border border-amber-200/10 shadow-2xl"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-amber-200/10">
              <h3 className="font-black text-amber-100">نقشه بوتیک</h3>
              <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Floor plan */}
            <div className="p-5">
              <div className="relative aspect-[4/3] rounded-2xl border border-amber-200/15 bg-gradient-to-br from-[#1e170d] to-[#0d0a06] overflow-hidden">
                {/* Hallway spine */}
                <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-1.5 bg-amber-200/10 rounded-full" />
                {/* Rooms positioned around the spine */}
                {scenes.map((s, i) => {
                  const cols = i % 2 === 0 ? 'right' : 'left';
                  const row = Math.floor(i / 2);
                  const top = 12 + row * 34;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { onTeleport(i); onClose(); }}
                      className={`absolute ${cols === 'right' ? 'right-[8%]' : 'left-[8%]'} flex flex-col items-center justify-center text-center px-2 py-2 rounded-xl border transition-all w-[38%]`}
                      style={{ top: `${top}%` }}
                    >
                      <span className={`absolute inset-0 rounded-xl border ${isActive ? 'border-amber-400/60 bg-amber-400/10' : 'border-amber-200/15 bg-black/20 hover:bg-black/40'}`} />
                      <span className={`relative z-10 text-[11px] font-black leading-tight ${isActive ? 'text-amber-300' : 'text-amber-100/70'}`}>
                        {s.title}
                      </span>
                      {isActive && (
                        <span className="relative z-10 flex items-center gap-1 text-[9px] font-black text-amber-400 mt-1">
                          <MapPin className="w-3 h-3" /> موقعیت شما
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-amber-200/50 font-bold mt-3 text-center">
                برای جابه‌جایی آنی بین تالارها، روی هر بخش کلیک کنید.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
