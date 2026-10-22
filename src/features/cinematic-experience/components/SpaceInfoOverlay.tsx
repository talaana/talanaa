import React from 'react';
import { motion } from 'motion/react';

interface Props {
  title: string;
  subtitle?: string;
  sceneIndex: number;
  sceneCount: number;
}

/** Overlay showing the current hall name and position within the journey. */
export default function SpaceInfoOverlay({ title, subtitle, sceneIndex, sceneCount }: Props) {
  return (
    <motion.div
      key={title}
      dir="rtl"
      className="absolute bottom-16 right-4 sm:right-8 z-20 max-w-[320px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 text-[10px] font-black text-amber-300/80 mb-1.5">
        <span className="w-6 h-px bg-amber-300/50" />
        <span>تالار {sceneIndex + 1} از {sceneCount}</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-amber-100/70 font-bold mt-1">{subtitle}</p>}
    </motion.div>
  );
}
