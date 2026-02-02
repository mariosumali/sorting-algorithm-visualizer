/**
 * Audio Engine for Sorting Visualizer
 * 
 * Web Audio API-based synthesizer for sonifying sort events.
 * Uses pitch mapping: value -> frequency (exponential scale)
 */

export interface AudioEngineConfig {
    minFreq: number;      // Minimum frequency (Hz)
    maxFreq: number;      // Maximum frequency (Hz)
    volume: number;       // Master volume (0-1)
    enabled: boolean;     // Master enable
    maxEventsPerSecond: number; // Rate limiting
}

const DEFAULT_CONFIG: AudioEngineConfig = {
    minFreq: 200,
    maxFreq: 1200,
    volume: 0.3,
    enabled: true,
    maxEventsPerSecond: 400,
};

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private config: AudioEngineConfig;
    private lastPlayTime = 0;
    private minInterval: number;
    private masterGain: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;

    constructor(config: Partial<AudioEngineConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.minInterval = 1000 / this.config.maxEventsPerSecond;
    }

    private async init() {
        if (this.ctx) return;

        this.ctx = new AudioContext();

        // Create master chain: oscillators -> compressor -> gain -> destination
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.1;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.config.volume;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
    }

    async resume() {
        if (!this.ctx) await this.init();
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    private valueToFreq(value: number): number {
        // Exponential mapping: f = fMin * (fMax/fMin)^value
        const { minFreq, maxFreq } = this.config;
        const clampedValue = Math.max(0, Math.min(1, value));
        return minFreq * Math.pow(maxFreq / minFreq, clampedValue);
    }

    private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.5) {
        if (!this.ctx || !this.compressor) return;

        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        const now = this.ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(gain, now + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(env);
        env.connect(this.compressor);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    playCompare(valueA: number, valueB: number) {
        if (!this.shouldPlay()) return;

        const freqA = this.valueToFreq(valueA);
        const freqB = this.valueToFreq(valueB);

        // Quick dual-tone blip
        this.playTone(freqA, 0.04, 'sine', 0.15);
        setTimeout(() => this.playTone(freqB, 0.04, 'sine', 0.15), 15);
    }

    playSwap(valueA: number, valueB: number) {
        if (!this.shouldPlay()) return;

        const freqA = this.valueToFreq(valueA);
        const freqB = this.valueToFreq(valueB);

        // Slightly louder, percussive
        this.playTone(freqA, 0.08, 'triangle', 0.25);
        setTimeout(() => this.playTone(freqB, 0.08, 'triangle', 0.25), 25);
    }

    playWrite(value: number) {
        if (!this.shouldPlay()) return;

        const freq = this.valueToFreq(value);
        this.playTone(freq, 0.06, 'sine', 0.2);
    }

    playPivot(value: number) {
        if (!this.shouldPlay()) return;

        const freq = this.valueToFreq(value);
        // Lower, sustained tone
        this.playTone(freq * 0.5, 0.15, 'sawtooth', 0.15);
    }

    private shouldPlay(): boolean {
        if (!this.config.enabled || !this.ctx) return false;

        const now = performance.now();
        if (now - this.lastPlayTime < this.minInterval) {
            return false; // Rate limiting
        }
        this.lastPlayTime = now;
        return true;
    }

    setVolume(volume: number) {
        this.config.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.config.volume;
        }
    }

    setEnabled(enabled: boolean) {
        this.config.enabled = enabled;
    }

    setMaxEventsPerSecond(rate: number) {
        this.config.maxEventsPerSecond = rate;
        this.minInterval = 1000 / rate;
    }

    destroy() {
        this.ctx?.close();
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
    }
}

// Singleton for global use
let audioEngine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
    if (!audioEngine) {
        audioEngine = new AudioEngine();
    }
    return audioEngine;
}
