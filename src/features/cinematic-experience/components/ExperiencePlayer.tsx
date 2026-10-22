import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, Volume2, VolumeX, Gem, ShoppingBag } from 'lucide-react';
import type { ExperienceGraph, GraphEdge, Hotspot, SequenceNode } from '../types/sequenceGraph';
import type { GoldProduct } from '../types/goldProduct';
import { compileGraph, indexOfSequence } from '../lib/runtime';
import { getAudioEngine } from '../services/AudioAmbienceEngine';
import { findDemoProduct } from '../data/demoCatalog';
import { BagStore } from '../services/BagStore';
import VideoExperienceManager, { useScrollSwipeNavigate } from './VideoExperienceManager';
import SpatialHotspotLayer from './SpatialHotspotLayer';
import HotspotDetailModal from './HotspotDetailModal';
import SpaceInfoOverlay from './SpaceInfoOverlay';
import NavigationTimeline from './NavigationTimeline';
import BoutiqueMapModal from './BoutiqueMapModal';
import VipAppointmentWizard from './VipAppointmentWizard';

interface TransitionState {
  edge: GraphEdge;
  forward: boolean;
  from: SequenceNode;
  to: SequenceNode;
}

interface Props {
  graph: ExperienceGraph;
  rawGoldPerGramToman: number;
  onDirectPurchase: (product: GoldProduct) => void;
  onFirstGesture?: () => void;
  header?: React.ReactNode;
}

/**
 * Shared cinematic player — sequence nodes + transition edges driven by
 * scroll/swipe. Timeline and map teleport jump without playing edge video.
 */
export default function ExperiencePlayer({
  graph,
  rawGoldPerGramToman,
  onDirectPurchase,
  onFirstGesture,
  header,
}: Props) {
  const view = useMemo(() => compileGraph(graph), [graph]);
  const audio = getAudioEngine();

  const [activeId, setActiveId] = useState<string | null>(view.entryNodeId);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [muted, setMuted] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [vipProductTitle, setVipProductTitle] = useState<string | undefined>(undefined);
  const [bagCount, setBagCount] = useState(BagStore.count());
  const [gestureDone, setGestureDone] = useState(false);

  // Keep active id in sync when the compiled graph changes.
  useEffect(() => {
    if (!activeId || !view.sequences.some((s) => s.id === activeId)) {
      setActiveId(view.entryNodeId);
    }
  }, [view, activeId]);

  const sequence = view.sequences.find((s) => s.id === activeId) ?? view.sequences[0] ?? null;
  const activeIndex = sequence ? indexOfSequence(view, sequence.id) : 0;

  useEffect(() => {
    const unsub = BagStore.subscribe(() => setBagCount(BagStore.count()));
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [audio]);

  const handleGesture = useCallback(() => {
    if (!gestureDone) {
      audio.resume();
      audio.start();
      audio.setMuted(muted);
      setGestureDone(true);
      onFirstGesture?.();
    }
  }, [gestureDone, muted, audio, onFirstGesture]);

  const toggleMute = useCallback(() => {
    audio.resume();
    audio.start();
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
  }, [muted, audio]);

  const beginTransition = useCallback(
    (dir: 'forward' | 'reverse') => {
      if (transition || !sequence) return;
      const nb = view.neighbors[sequence.id];
      const step = dir === 'forward' ? nb?.forward : nb?.reverse;
      if (!step) return;
      const to = view.sequences.find((s) => s.id === step.nodeId);
      if (!to) return;
      setTransition({
        edge: step.edge,
        forward: step.forward,
        from: sequence,
        to,
      });
    },
    [transition, sequence, view],
  );

  const onTransitionComplete = useCallback(() => {
    setTransition((t) => {
      if (t) setActiveId(t.to.id);
      return null;
    });
  }, []);

  useScrollSwipeNavigate(!transition && !mapOpen && !vipOpen && !selectedHotspot, () => beginTransition('forward'), () => beginTransition('reverse'));

  const teleport = useCallback((index: number) => {
    const next = view.sequences[index];
    if (!next || transition) return;
    setActiveId(next.id);
    setMapOpen(false);
  }, [view.sequences, transition]);

  const resolveProduct = useCallback((hotspot: Hotspot): GoldProduct | null => {
    return findDemoProduct(hotspot.productId) ?? null;
  }, []);

  const currentProduct = selectedHotspot ? resolveProduct(selectedHotspot) : null;
  const idle = !transition;

  return (
    <div
      dir="rtl"
      className="relative w-full h-screen bg-[#0a0d13] text-white overflow-hidden font-sans"
      onPointerDown={handleGesture}
    >
      <VideoExperienceManager
        sequence={sequence}
        transition={transition}
        onTransitionComplete={onTransitionComplete}
      />

      {header}

      {idle && sequence && (
        <SpatialHotspotLayer
          hotspots={sequence.hotspots}
          onHotspotClick={(hs) => setSelectedHotspot(hs)}
        />
      )}

      {sequence && (
        <SpaceInfoOverlay
          title={sequence.title}
          subtitle={sequence.subtitle}
          sceneIndex={activeIndex}
          sceneCount={view.sequences.length}
        />
      )}

      {view.sequences.length > 1 && (
        <NavigationTimeline
          scenes={view.sequences}
          activeIndex={activeIndex}
          onSelect={teleport}
        />
      )}

      {/* Hint */}
      {idle && view.sequences.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-[10px] font-bold text-amber-100/50 tracking-wide">
            اسکرول یا سوایپ برای حرکت بین تالارها
          </p>
        </div>
      )}

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setMapOpen(true)}
          aria-label="نقشه بوتیک"
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <MapIcon className="w-5 h-5" />
        </button>
        <button
          onClick={toggleMute}
          aria-label="صدا"
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 z-20 flex items-center gap-2">
        <button
          onClick={() => { setVipProductTitle(undefined); setVipOpen(true); }}
          className="flex items-center gap-2 bg-amber-400/90 hover:bg-amber-400 text-black px-4 py-2.5 rounded-full font-black text-xs shadow-lg transition-colors"
        >
          <Gem className="w-4 h-4" /> رزرو VIP و مشاوره
        </button>
        <button
          onClick={() => setVipOpen(true)}
          className="relative w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          aria-label="سبد خرید"
        >
          <ShoppingBag className="w-5 h-5" />
          {bagCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
              {bagCount}
            </span>
          )}
        </button>
      </div>

      <HotspotDetailModal
        product={currentProduct}
        rawGoldPerGramToman={rawGoldPerGramToman}
        onClose={() => setSelectedHotspot(null)}
        onAddToBag={(p) => { BagStore.add(p); setSelectedHotspot(null); }}
        onDirectPurchase={(p) => { onDirectPurchase(p); setSelectedHotspot(null); }}
        onBookVip={() => { setVipProductTitle(currentProduct?.title); setVipOpen(true); }}
      />
      <BoutiqueMapModal
        open={mapOpen}
        scenes={view.sequences}
        activeIndex={activeIndex}
        onClose={() => setMapOpen(false)}
        onTeleport={teleport}
      />
      <VipAppointmentWizard open={vipOpen} onClose={() => setVipOpen(false)} productTitle={vipProductTitle} />
    </div>
  );
}
