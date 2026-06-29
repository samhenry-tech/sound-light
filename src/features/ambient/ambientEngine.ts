/**
 * Procedural ambient-bed generator built on the Web Audio API — rain, wind,
 * fire, and ocean synthesized from filtered noise with slow LFO movement. No
 * audio assets, layered *under* the music so a location keeps its atmosphere
 * while the musical vibe changes.
 */
import type { AmbientKind } from '@/stores/settingsStore';

type NoiseColor = 'white' | 'brown';

interface KindConfig {
  noise: NoiseColor;
  filterType: BiquadFilterType;
  frequency: number;
  q: number;
  /** LFO rate (Hz) and how it modulates the target. */
  lfoRate: number;
  lfoTarget: 'frequency' | 'gain';
  lfoDepth: number;
  baseGain: number;
}

const CONFIGS: Record<AmbientKind, KindConfig> = {
  rain: {
    noise: 'white',
    filterType: 'highpass',
    frequency: 1100,
    q: 0.4,
    lfoRate: 0.6,
    lfoTarget: 'gain',
    lfoDepth: 0.08,
    baseGain: 0.7,
  },
  wind: {
    noise: 'brown',
    filterType: 'lowpass',
    frequency: 520,
    q: 0.6,
    lfoRate: 0.08,
    lfoTarget: 'frequency',
    lfoDepth: 280,
    baseGain: 1,
  },
  fire: {
    noise: 'brown',
    filterType: 'lowpass',
    frequency: 980,
    q: 0.5,
    lfoRate: 0.9,
    lfoTarget: 'gain',
    lfoDepth: 0.18,
    baseGain: 0.85,
  },
  ocean: {
    noise: 'brown',
    filterType: 'lowpass',
    frequency: 640,
    q: 0.5,
    lfoRate: 0.06,
    lfoTarget: 'gain',
    lfoDepth: 0.4,
    baseGain: 0.95,
  },
};

const FADE_S = 0.8;

function fillNoise(buffer: AudioBuffer, color: NoiseColor): void {
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private master: GainNode | null = null;
  private volume = 0.4;
  private kind: AmbientKind | null = null;

  private buffers = new Map<NoiseColor, AudioBuffer>();

  private ensureCtx(): AudioContext {
    this.ctx ??= new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    return this.ctx;
  }

  private buffer(ctx: AudioContext, color: NoiseColor): AudioBuffer {
    let buf = this.buffers.get(color);
    if (!buf) {
      buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      fillNoise(buf, color);
      this.buffers.set(color, buf);
    }
    return buf;
  }

  get current(): AmbientKind | null {
    return this.kind;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.ctx && this.kind) {
      const target = this.volume * CONFIGS[this.kind].baseGain;
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
  }

  async start(kind: AmbientKind): Promise<void> {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    this.stopNodes();
    this.kind = kind;
    const cfg = CONFIGS[kind];

    const source = ctx.createBufferSource();
    source.buffer = this.buffer(ctx, cfg.noise);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = cfg.filterType;
    filter.frequency.value = cfg.frequency;
    filter.Q.value = cfg.q;

    const master = ctx.createGain();
    master.gain.value = 0;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = cfg.lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = cfg.lfoDepth;
    lfo.connect(lfoGain);
    if (cfg.lfoTarget === 'frequency') lfoGain.connect(filter.frequency);
    else lfoGain.connect(master.gain);

    source.connect(filter).connect(master).connect(ctx.destination);
    source.start();
    lfo.start();

    const target = this.volume * cfg.baseGain;
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + FADE_S);

    this.source = source;
    this.lfo = lfo;
    this.master = master;
  }

  private stopNodes(): void {
    this.source?.stop();
    this.lfo?.stop();
    this.source?.disconnect();
    this.lfo?.disconnect();
    this.master?.disconnect();
    this.source = null;
    this.lfo = null;
    this.master = null;
  }

  stop(): void {
    if (this.ctx && this.master) {
      // Quick fade to avoid a click, then tear down.
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      const source = this.source;
      const lfo = this.lfo;
      window.setTimeout(() => {
        source?.stop();
        lfo?.stop();
        source?.disconnect();
        lfo?.disconnect();
      }, 300);
      this.source = null;
      this.lfo = null;
      this.master = null;
    }
    this.kind = null;
  }

  destroy(): void {
    this.stopNodes();
    void this.ctx?.close();
    this.ctx = null;
  }
}
