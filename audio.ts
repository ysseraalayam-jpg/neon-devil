import type { GameSettings, ThemeId } from './types';

/**
 * Procedural Web Audio API sound & dark-synth arcade music engine.
 * Never autoplays before explicit user interaction.
 */
export class ArcadeAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private settings: GameSettings;
  private unlocked = false;
  private musicRunning = false;
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private activeTheme: ThemeId = 'blue-mauve';
  private lastScheduledCtxTime = -1;

  constructor(initialSettings: GameSettings) {
    this.settings = { ...initialSettings };
  }

  unlock(): void {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.unlocked = true;
      this.applySettings(this.settings);
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    } catch {
      // AudioContext unavailable in restricted headless environments
    }
  }

  applySettings(next: GameSettings): void {
    this.settings = { ...next };
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = next.muted ? 0 : next.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.02);
    this.musicGain.gain.setTargetAtTime(next.musicEnabled ? 0.24 : 0, now, 0.03);
    this.sfxGain.gain.setTargetAtTime(next.sfxEnabled ? 0.55 : 0, now, 0.02);

    if (!next.musicEnabled || next.muted) {
      this.stopMusic();
    }
  }

  setTheme(theme: ThemeId): void {
    this.activeTheme = theme;
  }

  startMusic(): void {
    if (!this.unlocked || !this.ctx || !this.settings.musicEnabled || this.settings.muted) return;
    if (this.musicRunning) return;
    this.musicRunning = true;
    this.scheduleNextBeat();
  }

  stopMusic(): void {
    this.musicRunning = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleNextBeat(): void {
    if (!this.musicRunning || !this.ctx || !this.musicGain) return;
    if (!this.settings.musicEnabled || this.settings.muted) {
      this.stopMusic();
      return;
    }

    let bpm = 132;
    let bassPattern = [65.41, 65.41, 77.78, 65.41, 87.31, 77.78, 58.27, 65.41];
    let leadPattern = [261.63, 0, 311.13, 392.0, 0, 349.23, 311.13, 466.16];

    if (this.activeTheme === 'neon-green') {
      bpm = 144;
      bassPattern = [55, 55, 65.41, 55, 73.42, 65.41, 49, 55];
      leadPattern = [220, 0, 261.63, 329.63, 0, 293.66, 261.63, 392.0];
    } else if (this.activeTheme === 'cyan-rocket') {
      bpm = 148;
      bassPattern = [82.41, 82.41, 98.0, 82.41, 110.0, 98.0, 73.42, 82.41];
      leadPattern = [329.63, 392.0, 0, 493.88, 440.0, 0, 392.0, 587.33];
    } else if (this.activeTheme === 'red-rocket') {
      bpm = 158;
      bassPattern = [92.5, 92.5, 98.0, 92.5, 110.0, 98.0, 82.41, 92.5];
      leadPattern = [369.99, 0, 392.0, 440.0, 493.88, 0, 554.37, 392.0];
    } else if (this.activeTheme === 'gold-black') {
      bpm = 138;
      bassPattern = [73.42, 73.42, 87.31, 73.42, 98.0, 87.31, 65.41, 73.42];
      leadPattern = [293.66, 0, 349.23, 440.0, 0, 392.0, 349.23, 523.25];
    }

    const stepMs = (60 / bpm / 2) * 1000;
    const now = this.ctx.currentTime;

    if (this.ctx.state === 'running' && now > this.lastScheduledCtxTime) {
      this.lastScheduledCtxTime = now;

      const idx = this.stepIndex % 8;
      const bassFreq = bassPattern[idx];
      const leadFreq = leadPattern[idx];

      this.playSynthNote(bassFreq, now, 0.14, 'sawtooth', 0.22, this.musicGain, 380);
      if (leadFreq > 0 && (this.stepIndex % 16 >= 4 || this.stepIndex % 2 === 0)) {
        this.playSynthNote(leadFreq, now, 0.11, 'triangle', 0.12, this.musicGain, 1600);
      }

      this.stepIndex = (this.stepIndex + 1) % 32;
    }

    this.musicTimer = window.setTimeout(() => this.scheduleNextBeat(), stepMs);
  }

  private playSynthNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    dest: AudioNode,
    cutoff: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private canPlaySfx(): boolean {
    return Boolean(
      this.unlocked &&
        this.ctx &&
        this.ctx.state === 'running' &&
        this.sfxGain &&
        this.settings.sfxEnabled &&
        !this.settings.muted,
    );
  }

  playJump(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.08;

    osc.type = 'square';
    osc.frequency.setValueAtTime(240 * pitchJitter, now);
    osc.frequency.exponentialRampToValueAtTime(580 * pitchJitter, now + 0.11);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playLand(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playTrapActivate(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.09);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playDeath(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.34);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.37);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'square';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.linearRampToValueAtTime(62, now + 0.18);
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.21);
  }

  playVictory(): void {
    if (!this.canPlaySfx() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.075;
      if (this.sfxGain) {
        this.playSynthNote(freq, t, 0.26, 'triangle', 0.22, this.sfxGain, 3200);
      }
    });
  }

  dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
