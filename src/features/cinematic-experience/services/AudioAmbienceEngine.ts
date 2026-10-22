/**
 * Procedural luxury audio engine — Web Audio API, zero external files.
 *
 * Generates three layered timbres in-browser:
 *  - warm-strings : detuned saw oscillators through a slow low-pass pad
 *  - crystal-chimes: high sine partials with fast decay, sparse scheduling
 *  - gold-bells    : FM bell (carrier + modulator) with metallic decay
 *
 * Autoplay policy: the AudioContext starts suspended and is resumed on the
 * first user gesture via resume().
 */
export type AmbientTone = 'warm-strings' | 'crystal-chimes' | 'gold-bells';

export class AudioAmbienceEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padNodes: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private schedulerId: number | null = null;
  private running = false;
  private currentTone: AmbientTone = 'warm-strings';
  private currentVolume = 0.6;
  private muted = true;

  get isRunning(): boolean {
    return this.running;
  }

  /** Call on first user gesture to satisfy autoplay policy. */
  resume(): void {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.applyGain();
  }

  setTone(tone: AmbientTone): void {
    this.currentTone = tone;
    if (this.running) this.restartPad();
  }

  /** Start (or restart) the ambient bed. */
  start(): void {
    this.ensureContext();
    if (!this.ctx || this.running) return;
    this.running = true;
    this.buildPad();
    this.scheduleChimes();
  }

  /** Stop and release all audio resources. */
  stop(): void {
    this.running = false;
    if (this.schedulerId !== null) {
      window.clearTimeout(this.schedulerId);
      this.schedulerId = null;
    }
    for (const o of this.padNodes) {
      try { o.stop(); } catch { /* already stopped */ }
    }
    this.padNodes = [];
    this.padFilter?.disconnect();
    this.padFilter = null;
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.master = null;
    }
  }

  private ensureContext(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  private applyGain(): void {
    if (!this.ctx || !this.master) return;
    const target = this.muted ? 0 : this.currentVolume * 0.5;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  private buildPad(): void {
    if (!this.ctx || !this.master) return;
    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 600;
    this.padFilter.Q.value = 0.7;
    this.padFilter.connect(this.master);

    const now = this.ctx.currentTime;
    // Root frequencies per tone family (A minor-ish voicing).
    const roots: Record<AmbientTone, number[]> = {
      'warm-strings': [110, 164.81, 220, 261.63],
      'crystal-chimes': [220, 329.63, 440, 523.25],
      'gold-bells': [130.81, 196, 261.63, 329.63],
    };
    const freqs = roots[this.currentTone];
    const gain = this.ctx.createGain();
    gain.gain.value = 0.05;

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = (i % 2 === 0 ? -6 : 6);
      const g = this.ctx!.createGain();
      g.gain.value = 0.35;
      osc.connect(g);
      g.connect(gain);
      osc.start(now);
      this.padNodes.push(osc);
    });
    gain.connect(this.padFilter);

    // Slow breathing LFO on the filter cutoff.
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(this.padFilter.frequency);
    lfo.start(now);
    this.padNodes.push(lfo);

    this.applyGain();
  }

  private restartPad(): void {
    for (const o of this.padNodes) {
      try { o.stop(); } catch { /* ignore */ }
    }
    this.padNodes = [];
    this.padFilter?.disconnect();
    this.padFilter = null;
    this.buildPad();
  }

  private scheduleChimes(): void {
    if (!this.ctx || !this.master) return;
    const playOne = () => {
      if (!this.running || !this.ctx) return;
      this.playChime();
      const next = 1800 + Math.random() * 3200;
      this.schedulerId = window.setTimeout(playOne, next);
    };
    this.schedulerId = window.setTimeout(playOne, 1200);
  }

  private playChime(): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const base = this.currentTone === 'crystal-chimes' ? 1567.98 : 880;
    const partials = this.currentTone === 'gold-bells' ? [1, 2.76, 5.4] : [1, 2.0, 3.0];

    partials.forEach((ratio, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * ratio;
      const g = this.ctx!.createGain();
      const peak = (0.12 / (i + 1)) * (this.currentTone === 'gold-bells' ? 1.4 : 1);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (1.2 + i * 0.5));
      osc.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }
}

/** Shared singleton for the whole experience. */
let instance: AudioAmbienceEngine | null = null;

export function getAudioEngine(): AudioAmbienceEngine {
  if (!instance) instance = new AudioAmbienceEngine();
  return instance;
}
