export type ParticleKind = 'trail' | 'burst' | 'ambient' | 'shard' | 'portal';

export interface ParticleSlot {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  rotation: number;
  vRot: number;
  gravity: number;
}

const POOL_SIZE = 320;

export class ParticlePool {
  private readonly pool: ParticleSlot[];
  private cursor = 0;

  constructor() {
    this.pool = Array.from({ length: POOL_SIZE }, () => ({
      active: false,
      kind: 'trail',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      life: 0,
      maxLife: 1,
      color: '#00D4FF',
      rotation: 0,
      vRot: 0,
      gravity: 0,
    }));
  }

  clear(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool[i].active = false;
    }
    this.cursor = 0;
  }

  spawn(
    kind: ParticleKind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string,
    gravity = 0,
    vRot = 0,
  ): void {
    const slot = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    slot.active = true;
    slot.kind = kind;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.size = size;
    slot.life = maxLife;
    slot.maxLife = maxLife;
    slot.color = color;
    slot.rotation = Math.random() * Math.PI * 2;
    slot.vRot = vRot;
    slot.gravity = gravity;
  }

  emitDeathShards(x: number, y: number, primary: string, secondary: string): void {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = 130 + Math.random() * 310;
      const color = i % 3 === 0 ? secondary : primary;
      this.spawn(
        'shard',
        x + (Math.random() - 0.5) * 14,
        y + (Math.random() - 0.5) * 14,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 90,
        4 + Math.random() * 6,
        0.38 + Math.random() * 0.25,
        color,
        920,
        (Math.random() - 0.5) * 12,
      );
    }
  }

  emitBurst(x: number, y: number, count: number, color: string, speedMax = 190, upward = -60): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * speedMax;
      this.spawn(
        'burst',
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + upward,
        2.5 + Math.random() * 3.5,
        0.22 + Math.random() * 0.26,
        color,
        420,
      );
    }
  }

  update(dt: number): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, viewWidth: number): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      const sx = p.x - cameraX;
      if (sx < -40 || sx > viewWidth + 40) continue;

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = p.kind === 'ambient' ? alpha * 0.45 : alpha;
      ctx.fillStyle = p.color;
      ctx.translate(sx, p.y);
      if (p.rotation !== 0) {
        ctx.rotate(p.rotation);
      }

      if (p.kind === 'shard') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        const s = p.size * (0.4 + alpha * 0.6);
        ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
        ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
      } else if (p.kind === 'trail') {
        const s = p.size * alpha;
        ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
