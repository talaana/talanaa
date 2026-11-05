import React from 'react';
import type { SequenceNode } from '../types/sequenceGraph';

interface Props {
  scenes: SequenceNode[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Bottom timeline — clickable scene nodes for direct navigation. */
export default function NavigationTimeline({ scenes, activeIndex, onSelect }: Props) {
  return (
    <div dir="rtl" className="absolute bottom-5 right-0 left-0 z-20 flex justify-center px-4">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            aria-label={s.title}
            title={s.title}
            className="group relative flex flex-col items-center"
          >
            <span
              className={`block rounded-full transition-all ${
                i === activeIndex
                  ? 'w-9 h-2.5 bg-amber-400'
                  : 'w-2.5 h-2.5 bg-white/30 group-hover:bg-white/60'
              }`}
            />
            {i === activeIndex && (
              <span className="hidden sm:block absolute -top-7 whitespace-nowrap text-[10px] font-black text-amber-100 bg-black/60 px-2 py-0.5 rounded-md">
                {s.title}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
