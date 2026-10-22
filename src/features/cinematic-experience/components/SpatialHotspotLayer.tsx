import React from 'react';
import { motion } from 'motion/react';
import type { Hotspot } from '../types/sequenceGraph';

interface Props {
  hotspots: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
}

/**
 * Interactive pulsing radar pins positioned over the media viewport.
 * Positions are fractions (0..1) of the container, scaled to percentages.
 */
export default function SpatialHotspotLayer({ hotspots, onHotspotClick }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {hotspots.map((hs) => (
        <motion.button
          key={hs.id}
          onClick={() => onHotspotClick(hs)}
          aria-label={hs.label}
          className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${hs.x * 100}%`, top: `${hs.y * 100}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {/* Radar pulse rings */}
          <span className="absolute inset-0 rounded-full border-2 border-amber-300/70 animate-ping" style={{ width: 44, height: 44, top: -22, left: -22 }} />
          <span className="absolute rounded-full border border-amber-200/40" style={{ width: 64, height: 64, top: -32, left: -32 }} />
          {/* Core pin */}
          <span className="relative block w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] ring-2 ring-white/80 group-hover:scale-125 transition-transform" />
          {/* Label */}
          <span className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/55 backdrop-blur-sm text-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200/20 opacity-0 group-hover:opacity-100 transition-opacity">
            {hs.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
