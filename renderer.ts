import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './constants';
import type { ParticlePool } from './particles';
import type { HazardRuntime, LevelRuntime, PlatformRuntime, PlayerState, ThemeId } from './types';

let cachedBgTheme: ThemeId | null = null;
let cachedBgGrad: CanvasGradient | null = null;
let cachedVigGrad: CanvasGradient | null = null;
let cachedGlowTheme: ThemeId | null = null;
let cachedGlowSprite: HTMLCanvasElement | null = null;

function getGlowSprite(themeId: ThemeId, color: string): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedGlowSprite && cachedGlowTheme === themeId) return cachedGlowSprite;
  cachedGlowTheme = themeId;
  const off = document.createElement('canvas');
  off.width = 256;
  off.height = 256;
  const octx = off.getContext('2d');
  if (octx) {
    const grad = octx.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    octx.fillStyle = grad;
    octx.fillRect(0, 0, 256, 256);
  }
  cachedGlowSprite = off;
  return off;
}

export function renderGameFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  runtime: LevelRuntime,
  particles: ParticlePool,
  globalTime: number,
  isTitlePreview: boolean,
): void {
  const theme = runtime.level.theme;

  // Clear outer canvas with deep void matching theme
  ctx.save();
  ctx.fillStyle = theme.bgTop;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Compute uniform fit scaling for 1280x720 logical playfield
  const scale = Math.min(canvasWidth / LOGICAL_WIDTH, canvasHeight / LOGICAL_HEIGHT);
  const drawW = LOGICAL_WIDTH * scale;
  const drawH = LOGICAL_HEIGHT * scale;
  const offsetX = (canvasWidth - drawW) * 0.5;
  const offsetY = (canvasHeight - drawH) * 0.5;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Clip to logical playfield
  ctx.beginPath();
  ctx.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.clip();

  // Camera shake from trauma^2
  const shakeMag = runtime.trauma * runtime.trauma * 12;
  const shakeX = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;
  const shakeY = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;

  // Background gradient (cached per theme)
  if (!cachedBgGrad || cachedBgTheme !== theme.id) {
    cachedBgTheme = theme.id;
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    g.addColorStop(0, theme.bgTop);
    g.addColorStop(1, theme.bgBottom);
    cachedBgGrad = g;
  }
  ctx.fillStyle = cachedBgGrad;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const camX = isTitlePreview
    ? Math.sin(globalTime * 0.18) * 140 + 180
    : runtime.cameraX + shakeX;
  const camY = shakeY;

  ctx.save();
  ctx.translate(0, camY);

  // Parallax atmospheric layer (distinct per level theme)
  renderAtmosphere(ctx, runtime, camX, globalTime);

  // World-space decorations
  renderDecorations(ctx, runtime, camX, globalTime);

  // Moving platform tracks (behind platforms)
  renderPlatformTracks(ctx, runtime.platforms, camX, theme.platformStroke);

  // Moving laser rails (behind lasers)
  renderLaserTracks(ctx, runtime.hazards, camX, theme.hazardStroke);

  // Platforms
  for (const plat of runtime.platforms) {
    renderPlatform(ctx, plat, camX, runtime);
  }

  // Exit portal
  renderPortal(ctx, runtime, camX, globalTime);

  // Hazards (spikes, hidden trap telegraphs, falling spikes, lasers, rotors)
  for (const h of runtime.hazards) {
    renderHazard(ctx, h, camX, runtime, globalTime);
  }

  // Particles
  particles.render(ctx, camX, LOGICAL_WIDTH);

  // Player character (Cube or Rocket)
  if (runtime.player.alive) {
    if (runtime.player.mode === 'rocket') {
      renderRocketPlayer(ctx, runtime.player, camX, globalTime, theme.id);
    } else {
      renderCubePlayer(ctx, runtime.player, camX, globalTime);
    }
  }

  ctx.restore();

  // Subtle top/bottom edge vignette (cached)
  if (!cachedVigGrad) {
    const vig = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    vig.addColorStop(0, 'rgba(0,0,0,0.28)');
    vig.addColorStop(0.14, 'rgba(0,0,0,0)');
    vig.addColorStop(0.86, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.42)');
    cachedVigGrad = vig;
  }
  ctx.fillStyle = cachedVigGrad;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.restore();
}

function renderAtmosphere(
  ctx: CanvasRenderingContext2D,
  runtime: LevelRuntime,
  camX: number,
  globalTime: number,
): void {
  const theme = runtime.level.theme;
  const gridStep = 64;
  const parallaxOffset = -(camX * 0.28) % gridStep;

  ctx.save();
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = parallaxOffset; x < LOGICAL_WIDTH; x += gridStep) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, LOGICAL_HEIGHT);
  }
  for (let y = 0; y < LOGICAL_HEIGHT; y += gridStep) {
    ctx.moveTo(0, y);
    ctx.lineTo(LOGICAL_WIDTH, y);
  }
  ctx.stroke();

  if (theme.id === 'blue-mauve') {
    const sprite = getGlowSprite(theme.id, theme.ambientGlow);
    if (sprite) {
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 420 - camX * 0.16 + globalTime * 10) % (LOGICAL_WIDTH + 300)) - 150;
        const by = 180 + Math.sin(globalTime * 0.5 + i * 1.7) * 65 + (i % 2) * 140;
        ctx.drawImage(sprite, bx - 210, by - 210, 420, 420);
      }
    }
  } else if (theme.id === 'neon-green') {
    ctx.strokeStyle = 'rgba(34, 255, 102, 0.16)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const rx = ((i * 97 - camX * 0.22) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH;
      const speed = 90 + (i % 4) * 35;
      const ry = ((globalTime * speed + i * 113) % (LOGICAL_HEIGHT + 120)) - 80;
      const len = 36 + (i % 3) * 22;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry + len);
      ctx.stroke();
    }
  } else if (theme.id === 'cyan-rocket') {
    const sprite = getGlowSprite(theme.id, theme.ambientGlow);
    if (sprite) {
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 520 - camX * 0.18 + globalTime * 18) % (LOGICAL_WIDTH + 360)) - 180;
        const by = 200 + Math.sin(globalTime * 0.7 + i * 2.1) * 90 + (i % 2) * 160;
        ctx.drawImage(sprite, bx - 220, by - 220, 440, 440);
      }
    }
    // Horizontal futuristic flight speedlines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const speed = 180 + (i % 5) * 45;
      const sx = LOGICAL_WIDTH - (((globalTime * speed + camX * 0.35 + i * 149) % (LOGICAL_WIDTH + 220)) - 80);
      const sy = 90 + ((i * 41) % (LOGICAL_HEIGHT - 180));
      const len = 48 + (i % 4) * 26;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();
    }
  } else if (theme.id === 'red-rocket') {
    const sprite = getGlowSprite(theme.id, theme.ambientGlow);
    if (sprite) {
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 440 - camX * 0.2 + globalTime * 24) % (LOGICAL_WIDTH + 340)) - 170;
        const by = 170 + Math.cos(globalTime * 0.9 + i * 1.4) * 100 + (i % 2) * 180;
        ctx.drawImage(sprite, bx - 220, by - 220, 440, 440);
      }
    }
    // High-speed crimson reactor streak lines
    ctx.strokeStyle = 'rgba(255, 95, 43, 0.22)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 20; i++) {
      const speed = 260 + (i % 4) * 65;
      const sx = LOGICAL_WIDTH - (((globalTime * speed + camX * 0.4 + i * 131) % (LOGICAL_WIDTH + 240)) - 90);
      const sy = 76 + ((i * 33) % (LOGICAL_HEIGHT - 152));
      const len = 56 + (i % 3) * 32;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();
    }
  } else if (theme.id === 'gold-black') {
    const sprite = getGlowSprite(theme.id, theme.ambientGlow);
    if (sprite) {
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 430 - camX * 0.14 + globalTime * 9) % (LOGICAL_WIDTH + 300)) - 150;
        const by = 190 + Math.sin(globalTime * 0.45 + i * 1.9) * 70 + (i % 2) * 145;
        ctx.drawImage(sprite, bx - 210, by - 210, 420, 420);
      }
    }
    // Rising golden sanctuary dust rays
    ctx.fillStyle = 'rgba(255, 209, 71, 0.22)';
    for (let i = 0; i < 20; i++) {
      const gx = ((i * 89 - camX * 0.2) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH;
      const gy = LOGICAL_HEIGHT - (((globalTime * (36 + (i % 4) * 14) + i * 83) % (LOGICAL_HEIGHT + 80)) - 40);
      const r = 1.4 + (i % 3) * 0.8;
      ctx.fillRect(gx, gy, r, r * 2.5);
    }
  }
  ctx.restore();
}

function renderDecorations(
  ctx: CanvasRenderingContext2D,
  runtime: LevelRuntime,
  camX: number,
  globalTime: number,
): void {
  const theme = runtime.level.theme;
  ctx.save();
  ctx.strokeStyle = theme.decorColor;
  ctx.lineWidth = 1.5;

  for (const d of runtime.level.decorations) {
    const sx = d.x - camX * 0.68;
    if (sx < -160 || sx > LOGICAL_WIDTH + 160) continue;
    const bob = Math.sin(globalTime * 1.4 + d.phase) * 8;
    const y = d.y + bob;

    ctx.save();
    ctx.translate(sx, y);
    if (d.kind === 'diamond') {
      ctx.rotate(Math.PI / 4 + globalTime * 0.15);
      ctx.strokeRect(-d.size * 0.5, -d.size * 0.5, d.size, d.size);
      ctx.strokeRect(-d.size * 0.28, -d.size * 0.28, d.size * 0.56, d.size * 0.56);
    } else if (d.kind === 'ring') {
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.34, globalTime * 0.5, globalTime * 0.5 + Math.PI * 1.2);
      ctx.stroke();
    } else if (d.kind === 'chevron') {
      ctx.beginPath();
      ctx.moveTo(-d.size * 0.5, d.size * 0.25);
      ctx.lineTo(0, -d.size * 0.25);
      ctx.lineTo(d.size * 0.5, d.size * 0.25);
      ctx.stroke();
    } else {
      ctx.strokeRect(-d.size * 0.18, -d.size * 0.7, d.size * 0.36, d.size * 1.4);
    }
    ctx.restore();
  }
  ctx.restore();
}

function renderPlatformTracks(
  ctx: CanvasRenderingContext2D,
  platforms: PlatformRuntime[],
  camX: number,
  strokeColor: string,
): void {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);

  for (const p of platforms) {
    if (p.kind !== 'moving') continue;
    const range = p.moveRange ?? 140;
    const axis = p.moveAxis ?? 'x';
    const x1 = p.x + p.w * 0.5 - camX;
    const y1 = p.y + p.h * 0.5;
    const x2 = axis === 'x' ? x1 + range : x1;
    const y2 = axis === 'y' ? y1 + range : y1;

    if (Math.max(x1, x2) < -50 || Math.min(x1, x2) > LOGICAL_WIDTH + 50) continue;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderLaserTracks(
  ctx: CanvasRenderingContext2D,
  hazards: HazardRuntime[],
  camX: number,
  strokeColor: string,
): void {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);

  for (const h of hazards) {
    if (h.kind !== 'moving_laser') continue;
    const rawRange = h.moveRange ?? 180;
    const axis = h.moveAxis ?? 'y';
    const x1 = h.x + h.w * 0.5 - camX;
    const y1 = h.y + h.h * 0.5;
    const x2 = axis === 'x' ? x1 + rawRange : x1;
    const y2 = axis === 'y' ? y1 + rawRange : y1;
    if (Math.max(x1, x2) < -50 || Math.min(x1, x2) > LOGICAL_WIDTH + 50) continue;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderPlatform(
  ctx: CanvasRenderingContext2D,
  plat: PlatformRuntime,
  camX: number,
  runtime: LevelRuntime,
): void {
  if (!plat.active && plat.kind !== 'disappearing') return;
  const theme = runtime.level.theme;
  const x = plat.currentX + plat.shakeOffset - camX;
  const y = plat.currentY;
  if (x + plat.w < -40 || x > LOGICAL_WIDTH + 40) return;

  ctx.save();

  // Ghost outline when disappearing platform is temporarily gone
  if (!plat.active && plat.kind === 'disappearing') {
    ctx.strokeStyle = theme.platformStroke;
    ctx.globalAlpha = 0.18;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, plat.w, plat.h);
    ctx.restore();
    return;
  }

  ctx.globalAlpha = plat.alpha;
  ctx.fillStyle = theme.platformFill;
  ctx.fillRect(x, y, plat.w, plat.h);

  // Subtle interior structural detail
  ctx.fillStyle = theme.platformSubtle;
  ctx.fillRect(x + 3, y + 3, Math.max(0, plat.w - 6), Math.min(6, Math.max(0, plat.h - 6)));

  // Fast multi-pass neon edge glow (outer soft bloom + crisp inner core)
  const isBreaking =
    plat.triggered && (plat.kind === 'collapsing' || plat.kind === 'retracting' || plat.kind === 'fake');
  const edgeColor = isBreaking ? theme.hazardStroke : theme.platformStroke;
  ctx.strokeStyle = edgeColor;
  ctx.globalAlpha = plat.alpha * 0.24;
  ctx.lineWidth = 7;
  ctx.strokeRect(x, y, plat.w, plat.h);

  ctx.globalAlpha = plat.alpha;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, plat.w, plat.h);

  // Visual cue for special platform types ('fake' looks solid until triggered!)
  if (plat.kind === 'disappearing') {
    ctx.strokeStyle = theme.platformStroke;
    ctx.globalAlpha = plat.alpha * 0.6;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const mid = x + plat.w * 0.5;
    ctx.moveTo(mid - 14, y + 5);
    ctx.lineTo(mid - 4, y + plat.h - 5);
    ctx.moveTo(mid + 6, y + 5);
    ctx.lineTo(mid + 14, y + plat.h - 5);
    ctx.stroke();
  } else if (plat.kind === 'collapsing' || plat.kind === 'retracting' || (plat.kind === 'fake' && plat.triggered)) {
    ctx.strokeStyle = plat.triggered ? theme.hazardStroke : theme.decorColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + plat.h * 0.5);
    ctx.lineTo(x + plat.w * 0.35, y + plat.h * 0.3);
    ctx.lineTo(x + plat.w * 0.65, y + plat.h * 0.72);
    ctx.lineTo(x + plat.w - 10, y + plat.h * 0.45);
    ctx.stroke();
  } else if (plat.kind === 'moving') {
    ctx.fillStyle = theme.platformStroke;
    ctx.fillRect(x + plat.w * 0.5 - 12, y + plat.h * 0.5 - 2, 24, 4);
  }

  ctx.restore();
}

function renderHazard(
  ctx: CanvasRenderingContext2D,
  h: HazardRuntime,
  camX: number,
  runtime: LevelRuntime,
  globalTime: number,
): void {
  const theme = runtime.level.theme;
  const x = h.currentX - camX;
  const y = h.currentY;

  if (h.kind === 'rotor') {
    const radius = h.radius ?? 90;
    if (x + radius < -60 || x - radius > LOGICAL_WIDTH + 60) return;

    const bladeCount = h.bladeCount ?? 2;
    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < bladeCount; i++) {
      const a = h.angle + (i * Math.PI * 2) / bladeCount;
      const bx = Math.cos(a) * radius;
      const by = Math.sin(a) * radius;

      // Outer laser blade glow
      ctx.strokeStyle = theme.hazardStroke;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Main blade body
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Hot inner filament
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bx * 0.96, by * 0.96);
      ctx.stroke();

      // Blade tip cap
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Armored rotating central hub
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.hazardFill;
    ctx.strokeStyle = theme.hazardStroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(h.angle * 1.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, -1.5, 10, 3);
    ctx.fillRect(-1.5, -5, 3, 10);

    ctx.restore();
    return;
  }

  if (x + h.w < -60 || x > LOGICAL_WIDTH + 60) return;

  if (h.kind === 'moving_laser' || h.kind === 'pulse_laser') {
    const vertical = h.h >= h.w;
    const cx = x + h.w * 0.5;
    const cy = y + h.h * 0.5;

    ctx.save();

    if (h.laserTelegraph && !h.laserActive) {
      const pulse = 0.4 + Math.sin(globalTime * 42) * 0.35;
      ctx.strokeStyle = theme.hazardStroke;
      ctx.globalAlpha = pulse;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(cx, y + 6);
        ctx.lineTo(cx, y + h.h - 6);
      } else {
        ctx.moveTo(x + 6, cy);
        ctx.lineTo(x + h.w - 6, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (h.laserActive) {
      const flicker = 0.88 + Math.sin(globalTime * 50) * 0.12;
      // Wide outer bloom
      ctx.strokeStyle = theme.hazardStroke;
      ctx.globalAlpha = 0.26 * flicker;
      ctx.lineWidth = 14;
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(cx, y + 4);
        ctx.lineTo(cx, y + h.h - 4);
      } else {
        ctx.moveTo(x + 4, cy);
        ctx.lineTo(x + h.w - 4, cy);
      }
      ctx.stroke();

      // Main neon beam
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 6;
      ctx.stroke();

      // White plasma core
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Emitter caps on both ends
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.hazardFill;
    ctx.strokeStyle = h.laserActive ? theme.hazardStroke : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    if (vertical) {
      ctx.fillRect(cx - 8, y, 16, 8);
      ctx.strokeRect(cx - 8, y, 16, 8);
      ctx.fillRect(cx - 8, y + h.h - 8, 16, 8);
      ctx.strokeRect(cx - 8, y + h.h - 8, 16, 8);
    } else {
      ctx.fillRect(x, cy - 8, 8, 16);
      ctx.strokeRect(x, cy - 8, 8, 16);
      ctx.fillRect(x + h.w - 8, cy - 8, 8, 16);
      ctx.strokeRect(x + h.w - 8, cy - 8, 8, 16);
    }

    ctx.restore();
    return;
  }

  ctx.save();

  // Hidden spike telegraph / subtle floor seam before trigger
  if (h.kind === 'hidden_spike' && !h.deployed) {
    if (h.triggered) {
      const pulse = 0.55 + Math.sin(globalTime * 40) * 0.45;
      ctx.fillStyle = theme.hazardStroke;
      ctx.globalAlpha = pulse * 0.3;
      ctx.fillRect(x, y + h.h - 8, h.w, 8);
      ctx.globalAlpha = pulse;
      ctx.fillRect(x + 2, y + h.h - 4, h.w - 4, 4);
    } else {
      ctx.fillStyle = theme.hazardStroke;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(x + 4, y + h.h - 2, h.w - 8, 2);
    }
    ctx.restore();
    return;
  }

  // Falling spike warning laser rail when triggered before drop
  if (h.kind === 'falling_spike' && h.triggered && !h.deployed) {
    ctx.strokeStyle = theme.hazardStroke;
    ctx.globalAlpha = 0.55 + Math.sin(globalTime * 45) * 0.35;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + h.w * 0.5, y + h.h);
    ctx.lineTo(x + h.w * 0.5, y + (h.fallDistance ?? 200));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw triangle teeth
  const toothCount = Math.max(1, Math.round(h.w / 18));
  const toothW = h.w / toothCount;
  const progress = h.kind === 'hidden_spike' ? h.deployProgress : 1;

  ctx.fillStyle = theme.hazardFill;
  ctx.strokeStyle = theme.hazardStroke;

  ctx.beginPath();
  for (let i = 0; i < toothCount; i++) {
    const tx = x + i * toothW;
    if (h.direction === 'up') {
      const baseY = y + h.h;
      const tipY = baseY - h.h * progress;
      ctx.moveTo(tx, baseY);
      ctx.lineTo(tx + toothW * 0.5, tipY);
      ctx.lineTo(tx + toothW, baseY);
    } else if (h.direction === 'down') {
      const baseY = y;
      const tipY = y + h.h * progress;
      ctx.moveTo(tx, baseY);
      ctx.lineTo(tx + toothW * 0.5, tipY);
      ctx.lineTo(tx + toothW, baseY);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner bright tip highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < toothCount; i++) {
    const cx = x + (i + 0.5) * toothW;
    const tipY = h.direction === 'up' ? y + h.h - h.h * progress + 5 : y + h.h * progress - 5;
    ctx.fillRect(cx - 1, tipY - 1, 2, 3);
  }

  ctx.restore();
}

function renderPortal(
  ctx: CanvasRenderingContext2D,
  runtime: LevelRuntime,
  camX: number,
  globalTime: number,
): void {
  const portal = runtime.level.portal;
  const theme = runtime.level.theme;
  const cx = portal.x + portal.w * 0.5 - camX;
  const cy = portal.y + portal.h * 0.5;
  if (cx < -100 || cx > LOGICAL_WIDTH + 100) return;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer aura
  const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 56);
  aura.addColorStop(0, theme.portalSecondary);
  aura.addColorStop(0.55, theme.portalPrimary);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35 + Math.sin(globalTime * 4) * 0.08;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating diamond/ellipse frame with layered neon bloom
  ctx.strokeStyle = theme.portalPrimary;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, portal.w * 0.48, portal.h * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, portal.w * 0.48, portal.h * 0.48, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner spinning vortex ring
  ctx.rotate(globalTime * 2.8);
  ctx.strokeStyle = theme.portalSecondary;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, portal.w * 0.32, 0, Math.PI * 1.45);
  ctx.stroke();

  ctx.rotate(-globalTime * 5.1);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, portal.w * 0.16, 0, Math.PI * 1.15);
  ctx.stroke();

  ctx.restore();
}

function renderCubePlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  camX: number,
  globalTime: number,
): void {
  const cx = player.x + player.w * 0.5 - camX;
  const bottomY = player.y + player.h;

  ctx.save();
  // Anchor squash-and-stretch cleanly to the bottom-center of the cube
  ctx.translate(cx, bottomY);
  ctx.scale(player.scaleX, player.scaleY);
  ctx.translate(0, -player.h * 0.5);

  const halfW = player.w * 0.5;
  const halfH = player.h * 0.5;

  // Electric blue outer bloom + cube shell
  const pulse = 0.24 + Math.sin(globalTime * 5) * 0.06;
  ctx.fillStyle = '#07122B';
  ctx.fillRect(-halfW, -halfH, player.w, player.h);

  ctx.save();
  ctx.strokeStyle = '#00D4FF';
  ctx.globalAlpha = pulse;
  ctx.lineWidth = 8;
  ctx.strokeRect(-halfW, -halfH, player.w, player.h);
  ctx.restore();

  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-halfW, -halfH, player.w, player.h);

  // Subtle inner frame line
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-halfW + 3.5, -halfH + 3.5, player.w - 7, player.h - 7);

  // Mauve glowing eyes shifting gently in look direction
  const gazeX = player.lookX * 2.8;
  const gazeY = player.lookY * 2.0;

  const eyeW = 4.6;
  const eyeH = 6.2;
  const leftEyeX = -6.8 + gazeX;
  const rightEyeX = 2.2 + gazeX;
  const eyeY = -3.4 + gazeY;

  ctx.fillStyle = 'rgba(232, 121, 249, 0.32)';
  ctx.fillRect(leftEyeX - 2, eyeY - 2, eyeW + 4, eyeH + 4);
  ctx.fillRect(rightEyeX - 2, eyeY - 2, eyeW + 4, eyeH + 4);

  ctx.fillStyle = '#E879F9';
  ctx.fillRect(leftEyeX, eyeY, eyeW, eyeH);
  ctx.fillRect(rightEyeX, eyeY, eyeW, eyeH);

  // Crisp bright eye cores
  ctx.fillStyle = '#FDF4FF';
  ctx.fillRect(leftEyeX + 1.2, eyeY + 1.2, 2.2, 2.5);
  ctx.fillRect(rightEyeX + 1.2, eyeY + 1.2, 2.2, 2.5);

  ctx.restore();
}

function renderRocketPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  camX: number,
  globalTime: number,
  themeId: ThemeId,
): void {
  const cx = player.x + player.w * 0.5 - camX;
  const cy = player.y + player.h * 0.5;
  const isRed = themeId === 'red-rocket';

  const hullFill = isRed ? '#24060A' : '#05162E';
  const primaryStroke = isRed ? '#FF453A' : '#00E5FF';
  const secondaryStroke = isRed ? '#FF9500' : '#60A5FA';
  const canopyFill = isRed ? '#FFE4B5' : '#BAE6FD';
  const flameOuter = isRed ? '#FF453A' : '#00D4FF';
  const flameInner = isRed ? '#FFD60A' : '#E0F7FF';

  const halfW = player.w * 0.5;
  const halfH = player.h * 0.5;
  const pitch = player.pitchAngle ?? 0;

  ctx.save();
  ctx.translate(cx, cy);
  if (player.facing < 0) {
    ctx.scale(-1, 1);
    ctx.rotate(-pitch);
  } else {
    ctx.rotate(pitch);
  }

  // Animated engine thruster flame
  const thrustBoost = player.thrusting ? 1.45 : 0.72;
  const speedRatio = Math.min(1.25, 0.55 + Math.abs(player.vx) / 360);
  const flameLen = (11 + Math.sin(globalTime * 55) * 4.5) * thrustBoost * speedRatio;

  ctx.fillStyle = flameOuter;
  ctx.globalAlpha = player.thrusting ? 0.85 : 0.55;
  ctx.beginPath();
  ctx.moveTo(-halfW + 1, -5.5);
  ctx.lineTo(-halfW - flameLen, 0);
  ctx.lineTo(-halfW + 1, 5.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flameInner;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(-halfW + 1, -2.6);
  ctx.lineTo(-halfW - flameLen * 0.58, 0);
  ctx.lineTo(-halfW + 1, 2.6);
  ctx.closePath();
  ctx.fill();

  // Rear swept stabilizer fins
  ctx.globalAlpha = 1;
  ctx.fillStyle = hullFill;
  ctx.strokeStyle = secondaryStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfW + 9, -halfH + 4);
  ctx.lineTo(-halfW - 2, -halfH - 3);
  ctx.lineTo(-halfW + 2, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-halfW + 9, halfH - 4);
  ctx.lineTo(-halfW - 2, halfH + 3);
  ctx.lineTo(-halfW + 2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sleek aerodynamic fuselage path
  ctx.beginPath();
  ctx.moveTo(halfW, 0); // Sharp nose cone
  ctx.lineTo(halfW - 10, -halfH + 2);
  ctx.lineTo(-halfW + 4, -halfH + 3);
  ctx.lineTo(-halfW + 2, halfH - 3);
  ctx.lineTo(halfW - 10, halfH - 2);
  ctx.closePath();

  ctx.fillStyle = hullFill;
  ctx.fill();

  // Soft outer neon hull bloom
  ctx.save();
  ctx.strokeStyle = primaryStroke;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();

  // Crisp hull outline
  ctx.strokeStyle = primaryStroke;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Glowing canopy visor
  ctx.fillStyle = canopyFill;
  ctx.beginPath();
  ctx.ellipse(3.5, 0, 5.5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
