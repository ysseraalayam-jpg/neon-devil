import {
  AUTO_RETRY_DELAY,
  DEATH_ANIM_DURATION,
  FIXED_DT,
  MAX_FRAME_DT,
} from './constants';
import { ArcadeAudio } from './audio';
import { getLevelById } from './levels';
import { ParticlePool } from './particles';
import {
  createInitialLevelRuntime,
  isDeathAnimComplete,
  stepSimulation,
} from './physics';
import { renderGameFrame } from './renderer';
import {
  loadProgress,
  loadSettings,
  recordDeath,
  recordLevelCompletion,
  saveProgress,
  saveSettings,
} from './storage';
import type {
  GameProgress,
  GameSettings,
  GameStatus,
  HudSnapshot,
  InputState,
  LevelRuntime,
} from './types';

export interface EngineCallbacks {
  onHudChange: (snapshot: HudSnapshot) => void;
  onProgressChange: (progress: GameProgress) => void;
  onSettingsChange: (settings: GameSettings) => void;
}

export type TouchControl = 'left' | 'right' | 'up' | 'down' | 'jump';

export class NeonDevilEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private status: GameStatus = 'title';
  private currentLevelId = 1;
  private runtime: LevelRuntime;
  private particles = new ParticlePool();
  private audio: ArcadeAudio;
  private progress: GameProgress;
  private settings: GameSettings;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private accumulator = 0;
  private globalTime = 0;
  private autoRetryTimer = 0;
  private lastHudSecond = -1;
  private lastHudPct = -1;
  private hasUserInteracted = false;

  private keysHeld = new Set<string>();
  private touchHeld = { left: false, right: false, up: false, down: false, jump: false };
  private prevJumpHeld = false;
  private jumpPressedPending = false;
  private jumpReleasedPending = false;

  private resizeObserver: ResizeObserver | null = null;
  private canvasWidth = 1280;
  private canvasHeight = 720;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D Canvas context unavailable');
    }
    this.ctx = context;
    this.callbacks = callbacks;

    this.progress = loadProgress();
    this.settings = loadSettings();
    this.audio = new ArcadeAudio(this.settings);
    this.runtime = createInitialLevelRuntime(getLevelById(this.currentLevelId));

    this.bindEvents();
    this.handleResize();
    this.syncBodyState();
    this.emitHud(true);
    this.callbacks.onProgressChange(this.progress);
    this.callbacks.onSettingsChange(this.settings);
  }

  startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const clampedDt = Math.min(Math.max(rawDt, 0), MAX_FRAME_DT);

      this.tick(clampedDt);
      this.render();

      this.rafId = window.requestAnimationFrame(loop);
    };
    this.rafId = window.requestAnimationFrame(loop);
  }

  dispose(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
    this.resizeObserver?.disconnect();
    this.audio.dispose();
  }

  getProgress(): GameProgress {
    return this.progress;
  }

  getSettings(): GameSettings {
    return this.settings;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  startLevel(levelId: number): void {
    const clampedId = Math.max(1, Math.min(levelId, this.progress.unlockedLevel));
    this.currentLevelId = clampedId;
    const levelDef = getLevelById(clampedId);
    this.runtime = createInitialLevelRuntime(levelDef);
    this.particles.clear();
    this.accumulator = 0;
    this.autoRetryTimer = 0;
    this.clearInputs();
    this.status = 'playing';
    this.audio.setTheme(levelDef.theme.id);
    if (this.hasUserInteracted) {
      this.audio.startMusic();
    }
    this.syncBodyState();
    this.emitHud(true);
  }

  restartLevel(): void {
    const levelDef = getLevelById(this.currentLevelId);
    this.runtime = createInitialLevelRuntime(levelDef);
    this.particles.clear();
    this.accumulator = 0;
    this.autoRetryTimer = 0;
    this.clearInputs();
    this.status = 'playing';
    this.audio.setTheme(levelDef.theme.id);
    if (this.hasUserInteracted) {
      this.audio.startMusic();
    }
    this.syncBodyState();
    this.emitHud(true);
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.clearInputs();
    this.audio.stopMusic();
    this.syncBodyState();
    this.emitHud(true);
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.clearInputs();
    this.status = 'playing';
    if (this.hasUserInteracted) {
      this.audio.startMusic();
    }
    this.syncBodyState();
    this.emitHud(true);
  }

  goToTitle(): void {
    this.status = 'title';
    this.clearInputs();
    this.audio.stopMusic();
    this.runtime = createInitialLevelRuntime(getLevelById(1));
    this.particles.clear();
    this.syncBodyState();
    this.emitHud(true);
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    saveSettings(this.settings);
    this.audio.applySettings(this.settings);
    if (this.hasUserInteracted && this.status === 'playing' && this.settings.musicEnabled && !this.settings.muted) {
      this.audio.startMusic();
    }
    this.callbacks.onSettingsChange(this.settings);
  }

  toggleMute(): void {
    this.updateSettings({ muted: !this.settings.muted });
  }

  setTouchInput(control: TouchControl, pressed: boolean): void {
    this.registerUserGesture();
    if (control === 'jump' || control === 'up') {
      const wasHeld = this.touchHeld.jump || this.touchHeld.up;
      if (pressed && !wasHeld) {
        this.jumpPressedPending = true;
      } else if (!pressed && wasHeld) {
        this.jumpReleasedPending = true;
      }
    }
    this.touchHeld[control] = pressed;
  }

  private clearInputs(): void {
    this.keysHeld.clear();
    this.touchHeld.left = false;
    this.touchHeld.right = false;
    this.touchHeld.up = false;
    this.touchHeld.down = false;
    this.touchHeld.jump = false;
    this.prevJumpHeld = false;
    this.jumpPressedPending = false;
    this.jumpReleasedPending = false;
  }

  private tick(dt: number): void {
    this.globalTime += dt;

    // Spawn ambient floating motes on title or gameplay
    if (this.status === 'title' || this.status === 'playing' || this.status === 'dying') {
      if (Math.random() < dt * 11) {
        const theme = this.runtime.level.theme;
        this.particles.spawn(
          'ambient',
          this.runtime.cameraX + Math.random() * 1280,
          Math.random() * 720,
          (Math.random() - 0.5) * 18,
          -14 - Math.random() * 24,
          1.8 + Math.random() * 2.5,
          1.8 + Math.random() * 1.4,
          Math.random() > 0.4 ? theme.particlePrimary : theme.particleSecondary,
        );
      }
    }

    if (this.status === 'title') {
      this.particles.update(dt);
      return;
    }

    if (this.status === 'paused' || this.status === 'victory') {
      return;
    }

    if (this.status === 'dead') {
      this.particles.update(dt);
      if (this.settings.autoRetry) {
        this.autoRetryTimer += dt;
        if (this.autoRetryTimer >= AUTO_RETRY_DELAY) {
          this.restartLevel();
        }
      }
      return;
    }

    // Playing or Dying (death shatter animation running)
    this.accumulator += dt;
    while (this.accumulator >= FIXED_DT) {
      this.accumulator -= FIXED_DT;
      this.fixedStep(FIXED_DT);
    }

    this.particles.update(dt);

    // Emit HUD only when discrete integer second or progress % changes
    if (this.status === 'playing') {
      const sec = Math.floor(this.runtime.elapsed);
      const span = Math.max(1, this.runtime.level.portal.x - this.runtime.level.spawn.x);
      const pct = Math.max(0, Math.min(100, Math.round(((this.runtime.player.x - this.runtime.level.spawn.x) / span) * 100)));
      if (sec !== this.lastHudSecond || pct !== this.lastHudPct) {
        this.lastHudSecond = sec;
        this.lastHudPct = pct;
        this.emitHud(false);
      }
    }
  }

  private fixedStep(dt: number): void {
    const input = this.consumeInputSnapshot();
    const events = stepSimulation(this.runtime, input, dt);
    const theme = this.runtime.level.theme;

    // Emit player trail / rocket exhaust particles
    const p = this.runtime.player;
    if (p.alive) {
      if (p.mode === 'rocket') {
        const exhaustInterval = p.thrusting ? 0.018 : 0.036;
        this.runtime.trailSpawnAccumulator += dt;
        if (this.runtime.trailSpawnAccumulator >= exhaustInterval) {
          this.runtime.trailSpawnAccumulator = 0;
          const tailX = p.facing >= 0 ? p.x - 4 : p.x + p.w + 4;
          const tailY = p.y + p.h * 0.5 + (Math.random() - 0.5) * 6;
          this.particles.spawn(
            'trail',
            tailX,
            tailY,
            -p.facing * (p.thrusting ? 185 : 95) - p.vx * 0.18,
            (Math.random() - 0.5) * 48 + (p.thrusting ? 35 : 0),
            p.thrusting ? 5.5 + Math.random() * 3.5 : 4 + Math.random() * 2,
            p.thrusting ? 0.26 : 0.18,
            Math.random() > 0.35 ? theme.particlePrimary : theme.particleSecondary,
          );
        }
      } else if (Math.abs(p.vx) > 45 || Math.abs(p.vy) > 45) {
        this.runtime.trailSpawnAccumulator += dt;
        if (this.runtime.trailSpawnAccumulator >= 0.032) {
          this.runtime.trailSpawnAccumulator = 0;
          const trailColor =
            theme.id === 'gold-black'
              ? Math.random() > 0.3
                ? '#FFD147'
                : '#F59E0B'
              : Math.random() > 0.25
                ? '#00D4FF'
                : '#E879F9';
          this.particles.spawn(
            'trail',
            p.x + p.w * 0.5 - p.facing * 6,
            p.y + p.h * 0.5 + (Math.random() - 0.5) * 8,
            -p.vx * 0.12,
            -p.vy * 0.08 + (Math.random() - 0.5) * 16,
            6 + Math.random() * 3,
            0.22,
            trailColor,
          );
        }
      }
    }

    for (const ev of events) {
      if (ev.type === 'jump') {
        this.audio.playJump();
        const jumpColor = theme.id === 'gold-black' ? '#FFD147' : '#00E5FF';
        this.particles.emitBurst(ev.x, ev.y, 6, jumpColor, 110, -40);
      } else if (ev.type === 'land') {
        this.audio.playLand();
        this.particles.emitBurst(ev.x, ev.y, 5, theme.particlePrimary, 95, -25);
      } else if (ev.type === 'trap_telegraph' || ev.type === 'trap_activate') {
        this.audio.playTrapActivate();
        this.particles.emitBurst(ev.x, ev.y, 7, theme.hazardStroke, 140, -50);
      } else if (ev.type === 'death') {
        this.audio.playDeath();
        const shardPrimary =
          p.mode === 'rocket'
            ? theme.particlePrimary
            : theme.id === 'gold-black'
              ? '#FFD147'
              : '#00E5FF';
        const shardSecondary =
          p.mode === 'rocket'
            ? theme.hazardStroke
            : theme.id === 'gold-black'
              ? '#FF5722'
              : '#E879F9';
        this.particles.emitDeathShards(ev.x, ev.y, shardPrimary, shardSecondary);
        this.status = 'dying';
        this.progress = recordDeath(this.progress, this.currentLevelId);
        saveProgress(this.progress);
        this.callbacks.onProgressChange(this.progress);
        this.emitHud(true);
      } else if (ev.type === 'victory') {
        this.audio.stopMusic();
        this.audio.playVictory();
        this.particles.emitBurst(ev.x, ev.y, 26, theme.portalPrimary, 260, -40);
        this.status = 'victory';
        this.progress = recordLevelCompletion(this.progress, this.currentLevelId, this.runtime.elapsed);
        saveProgress(this.progress);
        this.callbacks.onProgressChange(this.progress);
        this.syncBodyState();
        this.emitHud(true);
      }
    }

    if (this.status === 'dying' && isDeathAnimComplete(this.runtime)) {
      this.status = 'dead';
      this.autoRetryTimer = 0;
      this.syncBodyState();
      this.emitHud(true);
    }
  }

  private consumeInputSnapshot(): InputState {
    const left = this.keysHeld.has('ArrowLeft') || this.keysHeld.has('KeyA') || this.touchHeld.left;
    const right = this.keysHeld.has('ArrowRight') || this.keysHeld.has('KeyD') || this.touchHeld.right;
    const up =
      this.keysHeld.has('ArrowUp') ||
      this.keysHeld.has('KeyW') ||
      this.keysHeld.has('Space') ||
      this.touchHeld.up ||
      this.touchHeld.jump;
    const down = this.keysHeld.has('ArrowDown') || this.keysHeld.has('KeyS') || this.touchHeld.down;

    const jumpHeld = up;
    const jumpJustPressed = this.jumpPressedPending || (jumpHeld && !this.prevJumpHeld);
    const jumpJustReleased = this.jumpReleasedPending || (!jumpHeld && this.prevJumpHeld);

    this.prevJumpHeld = jumpHeld;
    this.jumpPressedPending = false;
    this.jumpReleasedPending = false;

    return {
      left,
      right,
      up,
      down,
      jumpHeld,
      jumpJustPressed,
      jumpJustReleased,
    };
  }

  private render(): void {
    renderGameFrame(
      this.ctx,
      this.canvasWidth,
      this.canvasHeight,
      this.runtime,
      this.particles,
      this.globalTime,
      this.status === 'title',
    );
  }

  private syncBodyState(): void {
    const body = document.body;
    if (!body) return;
    if (this.status === 'title') {
      body.dataset.state = 'title';
      delete body.dataset.outcome;
    } else if (this.status === 'playing' || this.status === 'dying') {
      body.dataset.state = 'playing';
      delete body.dataset.outcome;
    } else if (this.status === 'paused') {
      body.dataset.state = 'paused';
      delete body.dataset.outcome;
    } else {
      body.dataset.state = 'gameover';
      body.dataset.outcome = this.status === 'victory' ? 'victory' : 'death';
    }
  }

  private emitHud(force: boolean): void {
    if (!force && this.status !== 'playing') return;
    const level = this.runtime.level;
    const span = Math.max(1, level.portal.x - level.spawn.x);
    const rawPct = ((this.runtime.player.x - level.spawn.x) / span) * 100;
    const progressPct = Math.max(0, Math.min(100, Math.round(rawPct)));

    this.callbacks.onHudChange({
      status: this.status,
      mode: level.mode,
      levelId: level.id,
      levelName: level.name,
      levelSubtitle: level.subtitle,
      themeId: level.theme.id,
      deathsInLevel: this.progress.levelDeaths[level.id] ?? 0,
      totalDeaths: this.progress.totalDeaths,
      runTime: this.runtime.elapsed,
      progressPct,
      deathCause: this.runtime.deathCause || 'Destroyed',
      unlockedLevel: this.progress.unlockedLevel,
      bestTime: this.progress.bestTimes[level.id] ?? null,
    });
  }

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(300, Math.floor(rect.width));
    const h = Math.max(200, Math.floor(rect.height));

    this.canvasWidth = w;
    this.canvasHeight = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private registerUserGesture = (): void => {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      this.audio.unlock();
      if (this.status === 'playing' && this.settings.musicEnabled && !this.settings.muted) {
        this.audio.startMusic();
      }
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.registerUserGesture();

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
    }

    if (e.repeat) return;

    if (e.code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.status === 'playing') {
        this.pause();
      } else if (this.status === 'paused') {
        this.resume();
      }
      return;
    }

    if (e.code === 'KeyR') {
      if (this.status === 'playing' || this.status === 'dying' || this.status === 'dead' || this.status === 'paused') {
        this.restartLevel();
      }
      return;
    }

    if (this.status === 'dead' && (e.code === 'Space' || e.code === 'Enter')) {
      this.restartLevel();
      return;
    }

    this.keysHeld.add(e.code);
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.jumpPressedPending = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      const stillHoldingJump =
        this.keysHeld.has('Space') ||
        this.keysHeld.has('ArrowUp') ||
        this.keysHeld.has('KeyW') ||
        this.touchHeld.jump ||
        this.touchHeld.up;
      if (!stillHoldingJump) {
        this.jumpReleasedPending = true;
      }
    }
  };

  private onWindowBlur = (): void => {
    this.clearInputs();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearInputs();
    }
  };

  private bindEvents(): void {
    window.addEventListener('pointerdown', this.registerUserGesture, { passive: true });
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.canvas.parentElement);
    } else {
      window.addEventListener('resize', this.handleResize);
    }
  }

  private unbindEvents(): void {
    window.removeEventListener('pointerdown', this.registerUserGesture);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.handleResize);
  }
}

export { DEATH_ANIM_DURATION };
