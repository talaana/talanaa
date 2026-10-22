import React, { useCallback, useEffect, useRef } from 'react';
import type { GraphEdge, SequenceNode } from '../types/sequenceGraph';
import { resolveTransitionVideo } from '../lib/runtime';

interface TransitionRequest {
  edge: GraphEdge;
  forward: boolean;
  from: SequenceNode;
  to: SequenceNode;
}

interface Props {
  sequence: SequenceNode | null;
  transition: TransitionRequest | null;
  onTransitionComplete: () => void;
  onMediaReady?: () => void;
}

/**
 * Dual-video ping-pong:
 *  - primary loops the idle sequence
 *  - secondary plays the transition clip (or crossfades to the destination)
 */
export default function VideoExperienceManager({
  sequence,
  transition,
  onTransitionComplete,
  onMediaReady,
}: Props) {
  const primaryRef = useRef<HTMLVideoElement>(null);
  const secondaryRef = useRef<HTMLVideoElement>(null);
  const completeRef = useRef(onTransitionComplete);
  completeRef.current = onTransitionComplete;

  // Idle sequence loop on primary.
  useEffect(() => {
    if (transition || !sequence) return;
    const el = primaryRef.current;
    const url = sequence.videoUrl;
    if (!el || !url) return;
    if (el.getAttribute('src') !== url) {
      el.setAttribute('src', url);
      el.load();
    }
    el.loop = true;
    el.muted = true;
    void el.play().catch(() => undefined);
  }, [sequence?.id, sequence?.videoUrl, transition]);

  // Play transition on secondary, then hand off.
  useEffect(() => {
    if (!transition) return;

    const edge = transition.edge;
    const videoUrl = resolveTransitionVideo(edge, transition.forward);
    const duration = Math.max(edge.durationMs || 900, 400);
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const primary = primaryRef.current;
      const dest = transition.to.videoUrl;
      if (primary && dest) {
        primary.setAttribute('src', dest);
        primary.load();
        primary.loop = true;
        primary.muted = true;
        void primary.play().catch(() => undefined);
      } else if (primary && !dest) {
        primary.removeAttribute('src');
        primary.load();
      }
      if (secondaryRef.current) {
        secondaryRef.current.pause();
        secondaryRef.current.style.opacity = '0';
      }
      completeRef.current();
    };

    const secondary = secondaryRef.current;
    if (videoUrl && secondary) {
      secondary.style.opacity = '0';
      secondary.setAttribute('src', videoUrl);
      secondary.load();
      secondary.loop = false;
      secondary.muted = true;
      const onEnded = () => finish();
      secondary.addEventListener('ended', onEnded);
      const reveal = () => {
        secondary.style.opacity = '1';
      };
      secondary.addEventListener('playing', reveal, { once: true });
      void secondary.play().catch(() => window.setTimeout(finish, duration));
      const safety = window.setTimeout(finish, Math.max(duration, 15000));
      return () => {
        secondary.removeEventListener('ended', onEnded);
        window.clearTimeout(safety);
      };
    }

    // Crossfade fallback — fade secondary to destination (or canvas via opacity).
    if (secondary) {
      const dest = transition.to.videoUrl;
      if (dest) {
        secondary.setAttribute('src', dest);
        secondary.load();
        secondary.loop = true;
        secondary.muted = true;
        void secondary.play().catch(() => undefined);
      }
      secondary.style.opacity = '1';
    }
    const t = window.setTimeout(finish, duration);
    return () => window.clearTimeout(t);
  }, [transition]);

  const showCanvas = !sequence?.videoUrl && !transition;
  const showPrimary = Boolean(sequence?.videoUrl) || (transition?.from.videoUrl && !resolveTransitionVideo(transition.edge, transition.forward));

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0d13]">
      <video
        ref={primaryRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: transition && resolveTransitionVideo(transition.edge, transition.forward) ? 0.35 : showPrimary || sequence?.videoUrl ? 1 : 0 }}
        poster={sequence?.posterUrl}
        muted
        playsInline
        preload="auto"
        onCanPlay={onMediaReady}
      />
      <video
        ref={secondaryRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: 0 }}
        muted
        playsInline
        preload="auto"
      />
      {(showCanvas || (!sequence?.videoUrl && !transition?.to.videoUrl)) && (
        <div className="absolute inset-0">
          <GoldDustCanvas onReady={onMediaReady} />
        </div>
      )}
    </div>
  );
}

function GoldDustCanvas({ onReady }: { onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number; phase: number }> = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((w * h) / 14000);
      particles = Array.from({ length: Math.min(count, 160) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35,
        r: 0.6 + Math.random() * 1.8,
        a: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, '#3a2c12');
      g.addColorStop(0.45, '#1c160a');
      g.addColorStop(1, '#090806');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, 'rgba(212,175,55,0.10)');
      sheen.addColorStop(0.5, 'rgba(212,175,55,0.02)');
      sheen.addColorStop(1, 'rgba(212,175,55,0.12)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        const tw = 0.5 + 0.5 * Math.sin(t / 400 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,196,106,${(p.a * tw).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);
    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

/** Wheel + vertical swipe with threshold and cooldown. */
export function useScrollSwipeNavigate(
  enabled: boolean,
  onForward: () => void,
  onReverse: () => void,
) {
  const coolUntil = useRef(0);
  const touchY = useRef<number | null>(null);

  const tryNavigate = useCallback(
    (dir: 'forward' | 'reverse') => {
      const now = Date.now();
      if (now < coolUntil.current) return;
      coolUntil.current = now + 900;
      if (dir === 'forward') onForward();
      else onReverse();
    },
    [onForward, onReverse],
  );

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 28) return;
      e.preventDefault();
      tryNavigate(e.deltaY > 0 ? 'forward' : 'reverse');
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY.current == null) return;
      const y = e.changedTouches[0]?.clientY;
      if (y == null) return;
      const dy = touchY.current - y;
      touchY.current = null;
      if (Math.abs(dy) < 56) return;
      tryNavigate(dy > 0 ? 'forward' : 'reverse');
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, tryNavigate]);
}
