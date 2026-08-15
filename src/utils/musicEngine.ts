/**
 * Procedural Generative Ambient Lo-Fi & Focus Synthesizer Engine
 * Generates soft, calming, warm chord progressions using pure Web Audio API synthesis.
 */

export type SoundscapeType = 'lofi' | 'ambient' | 'rain';

class MusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.20; // gentle quiet default
  private masterGain: GainNode | null = null;
  private currentSoundscape: SoundscapeType = 'lofi';
  private timerId: number | null = null;
  private rainNode: AudioNode | null = null;
  private listeners: Set<() => void> = new Set();

  private chordProgressions = {
    lofi: [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
      [146.83, 220.00, 261.63, 349.23], // Dm7 (D3, A3, C4, F4)
      [196.00, 246.94, 293.66, 349.23, 440.00], // G9 (G3, B3, D4, F4, A4)
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [164.81, 207.65, 246.94, 329.63], // Em7 (E3, G#3/G3, B3, E4)
    ],
    ambient: [
      [130.81, 196.00, 261.63, 392.00], // C3, G3, C4, G4
      [146.83, 220.00, 293.66, 440.00], // D3, A3, D4, A4
      [174.61, 261.63, 349.23, 523.25], // F3, C4, F4, C5
      [110.00, 164.81, 220.00, 329.63], // A2, E3, A3, E4
    ],
    rain: [
      [261.63, 392.00, 523.25], // Soft bell tones amidst rain
      [329.63, 493.88, 659.25],
      [220.00, 329.63, 440.00],
      [174.61, 261.63, 349.23],
    ],
  };

  private stepIndex: number = 0;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSoundscape(): SoundscapeType {
    return this.currentSoundscape;
  }

  public setSoundscape(type: SoundscapeType) {
    this.currentSoundscape = type;
    if (this.isPlaying) {
      this.stop();
      this.start();
    } else {
      this.notify();
    }
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.isPlaying = true;
    this.stepIndex = 0;

    if (this.currentSoundscape === 'rain') {
      this.startRainGenerator();
    }

    this.playNextChord();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rainNode) {
      try {
        (this.rainNode as unknown as { stop?: () => void }).stop?.();
        this.rainNode.disconnect();
      } catch {}
      this.rainNode = null;
    }
    this.notify();
  }

  private startRainGenerator() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 1.5; // pinkish noise
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;

      const rainGain = this.ctx.createGain();
      rainGain.gain.value = 0.15;

      noiseSource.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.masterGain);

      noiseSource.start();
      this.rainNode = noiseSource;
    } catch {}
  }

  private playNextChord() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const chords = this.chordProgressions[this.currentSoundscape] || this.chordProgressions.lofi;
    const chord = chords[this.stepIndex % chords.length];
    this.stepIndex++;

    const now = this.ctx.currentTime;
    const duration = this.currentSoundscape === 'ambient' ? 5.5 : this.currentSoundscape === 'rain' ? 4.5 : 3.8;

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Warm sound shaping
      osc.type = this.currentSoundscape === 'ambient' ? 'sine' : 'triangle';
      // Gentle micro-detuning
      const detune = (idx - chord.length / 2) * 4;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.currentSoundscape === 'ambient' ? 650 : 1100, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + duration);

      const noteStart = now + idx * 0.04; // slight arpeggio feel
      const attack = this.currentSoundscape === 'ambient' ? 1.4 : 0.4;
      const release = this.currentSoundscape === 'ambient' ? 2.5 : 1.8;

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.08 / chord.length, noteStart + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration + release);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + duration + release);
    });

    const nextDelay = (duration - 0.5) * 1000;
    this.timerId = window.setTimeout(() => {
      if (this.isPlaying) {
        this.playNextChord();
      }
    }, nextDelay);
  }
}

export const musicEngine = new MusicEngine();
