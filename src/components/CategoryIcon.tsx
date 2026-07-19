import React from 'react';

interface CategoryIconProps {
  id: string;
  className?: string;
}

export default function CategoryIcon({ id, className = "w-6 h-6" }: CategoryIconProps) {
  switch (id) {
    case 'ring':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Diamond on top */}
          <path d="M12 2L9 5h6l-3-3z" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
          <path d="M9 5l3 3 3-3" strokeLinejoin="round" />
          {/* Ring shank */}
          <circle cx="12" cy="14" r="6" />
          {/* Inner sparkle */}
          <path d="M12 11v6M9 14h6" strokeWidth="1.2" strokeDasharray="1 1" />
        </svg>
      );
    case 'necklace':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Chain loops */}
          <path d="M4 6c0 8 16 8 16 0" strokeLinecap="round" />
          <path d="M6 8c0 6 12 6 12 0" strokeLinecap="round" />
          {/* Pendant */}
          <path d="M12 11l-2.5 3h5L12 11z" fill="currentColor" fillOpacity="0.3" strokeLinejoin="round" />
          <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'bracelet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Circular bangle skewed */}
          <ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-15 12 12)" />
          {/* Little beads on bangle */}
          <circle cx="6" cy="10" r="1" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <circle cx="18" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="15" r="1.2" fill="currentColor" />
          <circle cx="9" cy="15" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'earring':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Left earring */}
          <path d="M7 6v6" strokeLinecap="round" />
          <path d="M5 12h4l-2 3.5 2 3.5H5l2-3.5-2-3.5z" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
          {/* Right earring */}
          <path d="M17 6v6" strokeLinecap="round" />
          <path d="M15 12h4l-2 3.5 2 3.5h-4l2-3.5-2-3.5z" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
        </svg>
      );
    case 'service':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Royal jewelry crown */}
          <path d="M2 18h20v2H2v-2z" fill="currentColor" fillOpacity="0.1" />
          <path d="M4 18L2 9l5 4 5-9 5 9 5-4-2 9H4z" strokeLinejoin="round" />
          {/* Jewels on tips */}
          <circle cx="2" cy="9" r="1" fill="currentColor" />
          <circle cx="7" cy="13" r="1" fill="currentColor" />
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="17" cy="13" r="1" fill="currentColor" />
          <circle cx="22" cy="9" r="1" fill="currentColor" />
        </svg>
      );
    case 'bar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Gold bullion bar */}
          <path d="M5 17L3 7h18l-2 10H5z" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
          <path d="M6 15l-1.2-6h14.4l-1.2 6H6z" strokeLinejoin="round" />
          {/* Standard stamp details */}
          <path d="M9 11h6M10 13h4" strokeWidth="1.2" />
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Rounded Gold Coin */}
          <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
          <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
          {/* Embedded sun/shamsa pattern */}
          <path d="M12 9v6M9 12h6" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'secondhand':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Elegant recycle loops */}
          <path d="M17 2l3 3-3 3M20 5H10a6 6 0 00-6 6v1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 22l-3-3 3-3M4 19h10a6 6 0 006-6v-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'custom':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          {/* Drafting tool / design hammer */}
          <path d="M12 22V10M17 5H7M7 3h10v2H7V3z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
          <circle cx="12" cy="10" r="1.5" fill="currentColor" />
          <path d="M12 14c-2 0-4 1.5-4 3.5V22h8v-4.5c0-2-2-3.5-2-3.5z" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}
