import {
  CUBE_PHYSICS,
  DEATH_ANIM_DURATION,
  LOGICAL_WIDTH,
  PLAYER_SIZE,
  ROCKET_HEIGHT,
  ROCKET_PHYSICS,
  ROCKET_WIDTH,
} from './constants';
import type {
  GameMode,
  HazardRuntime,
  InputState,
  LevelDef,
  LevelRuntime,
  PlatformRuntime,
  PlayerState,
  SimulationEvent,
} from './types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function checkAABB(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Forgiving inner hitbox for spikes so outer 4px edges feel fair.
 */
export function getHazardHitbox(h: HazardRuntime): Rect | null {
  if (!h.deployed && h.kind === 'hidden_spike') return null;
  const insetX = Math.min(5, Math.floor(h.w * 0.16));
  const insetY = Math.min(4, Math.floor(h.h * 0.2));
  if (h.direction === 'up') {
    const visibleFactor = h.kind === 'hidden_spike' ? h.deployProgress : 1;
    if (visibleFactor < 0.35) return null;
    const activeH = h.h * visibleFactor;
    return {
      x: h.currentX + insetX,
      y: h.currentY + (h.h - activeH) + insetY,
      w: Math.max(4, h.w - insetX * 2),
      h: Math.max(4, activeH - insetY),
    };
  }
  return {
    x: h.currentX + insetX,
    y: h.currentY + (h.direction === 'down' ? 0 : insetY),
    w: Math.max(4, h.w - insetX * 2),
    h: Math.max(4, h.h - insetY),
  };
}

export function pointToSegmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 0.0001) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

export function checkHazardCollision(player: PlayerState, h: HazardRuntime): string | null {
  if (h.kind === 'moving_laser' || h.kind === 'pulse_laser') {
    if (!h.laserActive) return null;
    const laserRect: Rect = {
      x: h.currentX + 2,
      y: h.currentY + 2,
      w: Math.max(4, h.w - 4),
      h: Math.max(4, h.h - 4),
    };
    return checkAABB(player, laserRect) ? 'Vaporized by laser barrier' : null;
  }

  if (h.kind === 'rotor') {
    const cx = h.currentX;
    const cy = h.currentY;
    const radius = h.radius ?? 90;
    const bladeCount = h.bladeCount ?? 2;
    const playerCx = player.x + player.w * 0.5;
    const playerCy = player.y + player.h * 0.5;
    const playerRadius = Math.min(player.w, player.h) * 0.42;
    const bladeHalfThick = 5;
    const hitRadiusSq = (playerRadius + bladeHalfThick) * (playerRadius + bladeHalfThick);

    // Quick bounding circle rejection
    const dx = playerCx - cx;
    const dy = playerCy - cy;
    const maxReach = radius + playerRadius + bladeHalfThick;
    if (dx * dx + dy * dy > maxReach * maxReach) return null;

    // Hub check
    if (dx * dx + dy * dy <= (12 + playerRadius) * (12 + playerRadius)) {
      return 'Sliced by rotating blade';
    }

    for (let i = 0; i < bladeCount; i++) {
      const a = h.angle + (i * Math.PI * 2) / bladeCount;
      const bx = cx + Math.cos(a) * radius;
      const by = cy + Math.sin(a) * radius;
      if (pointToSegmentDistSq(playerCx, playerCy, cx, cy, bx, by) <= hitRadiusSq) {
        return 'Sliced by rotating blade';
      }
    }
    return null;
  }

  const hitbox = getHazardHitbox(h);
  if (hitbox && checkAABB(player, hitbox)) {
    return h.kind === 'falling_spike'
      ? 'Crushed by falling spike'
      : h.kind === 'hidden_spike'
        ? 'Ambushed by hidden spike'
        : 'Impaled on neon spike';
  }
  return null;
}

export function createInitialPlayer(level: LevelDef): PlayerState {
  const isRocket = level.mode === 'rocket';
  return {
    mode: level.mode,
    x: level.spawn.x,
    y: level.spawn.y,
    w: isRocket ? ROCKET_WIDTH : PLAYER_SIZE,
    h: isRocket ? ROCKET_HEIGHT : PLAYER_SIZE,
    vx: 0,
    vy: 0,
    grounded: false,
    onPlatformId: null,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    facing: 1,
    lookX: 1,
    lookY: 0,
    scaleX: 1,
    scaleY: 1,
    trailTimer: 0,
    alive: true,
    thrusting: false,
    pitchAngle: 0,
  };
}

export function createInitialLevelRuntime(level: LevelDef): LevelRuntime {
  const platforms: PlatformRuntime[] = level.platforms.map((p) => ({
    ...p,
    currentX: p.x,
    currentY: p.y,
    prevX: p.x,
    prevY: p.y,
    active: true,
    triggered: false,
    timer: 0,
    respawnTimer: 0,
    alpha: 1,
    shakeOffset: 0,
    moveDir: 1,
  }));

  const hazards: HazardRuntime[] = level.hazards.map((h) => ({
    ...h,
    currentX: h.x,
    currentY: h.y,
    triggered: false,
    telegraphTimer: 0,
    deployed: h.kind === 'spike' || h.kind === 'moving_laser' || h.kind === 'rotor',
    deployProgress: h.kind === 'spike' ? 1 : 0,
    settled: false,
    moveDir: (h.moveRange ?? 0) < 0 ? -1 : 1,
    angle: 0,
    cycleTimer: h.cyclePhase ?? 0,
    laserActive: h.kind === 'moving_laser',
    laserTelegraph: false,
  }));

  const player = createInitialPlayer(level);
  const initialCam = clampCameraX(player.x + player.w * 0.5 - LOGICAL_WIDTH * 0.34, level.width);

  return {
    level,
    player,
    platforms,
    hazards,
    elapsed: 0,
    hitstopTimer: 0,
    deathTimer: 0,
    deathCause: '',
    cameraX: initialCam,
    trauma: 0,
    trailSpawnAccumulator: 0,
    won: false,
  };
}

export function clampCameraX(targetX: number, levelWidth: number): number {
  return Math.max(0, Math.min(Math.max(0, levelWidth - LOGICAL_WIDTH), targetX));
}

function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

/**
 * Step platforms: moving, disappearing, collapsing, and retracting traps.
 */
export function stepPlatforms(runtime: LevelRuntime, dt: number, events: SimulationEvent[]): void {
  const playerCenterX = runtime.player.x + runtime.player.w * 0.5;

  for (const p of runtime.platforms) {
    p.prevX = p.currentX;
    p.prevY = p.currentY;

    if (p.kind === 'moving') {
      const range = p.moveRange ?? 140;
      const speed = p.moveSpeed ?? 120;
      const axis = p.moveAxis ?? 'x';
      const base = axis === 'x' ? p.x : p.y;
      const pos = axis === 'x' ? p.currentX : p.currentY;
      let nextPos = pos + p.moveDir * speed * dt;
      if (nextPos >= base + range) {
        nextPos = base + range;
        p.moveDir = -1;
      } else if (nextPos <= base) {
        nextPos = base;
        p.moveDir = 1;
      }
      if (axis === 'x') {
        p.currentX = nextPos;
      } else {
        p.currentY = nextPos;
      }
    } else if (p.kind === 'disappearing') {
      if (p.triggered && p.active) {
        p.timer += dt;
        const delay = p.triggerDelay ?? 0.42;
        p.shakeOffset = Math.sin(p.timer * 55) * 2.2;
        p.alpha = Math.max(0.25, 1 - (p.timer / delay) * 0.72);
        if (p.timer >= delay) {
          p.active = false;
          p.alpha = 0;
          p.shakeOffset = 0;
          p.respawnTimer = 0;
          events.push({ type: 'trap_activate', x: p.currentX + p.w * 0.5, y: p.currentY });
        }
      } else if (!p.active && (p.respawnDelay ?? 0) > 0) {
        p.respawnTimer += dt;
        if (p.respawnTimer >= (p.respawnDelay ?? 2.2)) {
          p.active = true;
          p.triggered = false;
          p.timer = 0;
          p.alpha = 1;
        }
      }
    } else if (p.kind === 'collapsing' || p.kind === 'fake') {
      if (p.triggered && p.active) {
        p.timer += dt;
        const delay = p.triggerDelay ?? (p.kind === 'fake' ? 0.16 : 0.3);
        if (p.timer < delay) {
          p.shakeOffset = Math.sin(p.timer * 75) * 3.0;
        } else {
          p.shakeOffset = 0;
          p.currentY += (p.kind === 'fake' ? 780 : 640) * dt;
          p.alpha = Math.max(0, 1 - (p.timer - delay) / 0.22);
          if (p.timer >= delay + 0.16) {
            p.active = false;
          }
        }
      }
    } else if (p.kind === 'retracting') {
      if (!p.triggered && p.triggerX !== undefined && playerCenterX >= p.triggerX) {
        p.triggered = true;
        p.timer = 0;
        events.push({ type: 'trap_telegraph', x: p.currentX + p.w * 0.5, y: p.currentY });
      }
      if (p.triggered) {
        p.timer += dt;
        const delay = p.triggerDelay ?? 0.22;
        if (p.timer < delay) {
          p.shakeOffset = Math.sin(p.timer * 70) * 3.0;
        } else {
          p.shakeOffset = 0;
          const targetY = p.y + (p.retractOffsetY ?? 260);
          p.currentY = Math.min(targetY, p.currentY + 950 * dt);
          if (p.currentY >= p.y + 45) {
            p.active = false;
          }
        }
      }
    }
  }
}

/**
 * Step hazards: hidden spikes & falling spikes.
 */
export function stepHazards(runtime: LevelRuntime, dt: number, events: SimulationEvent[]): void {
  const playerCenterX = runtime.player.x + runtime.player.w * 0.5;

  for (const h of runtime.hazards) {
    if (h.kind === 'hidden_spike') {
      if (!h.triggered && h.triggerX !== undefined && playerCenterX >= h.triggerX) {
        h.triggered = true;
        h.telegraphTimer = 0;
        events.push({ type: 'trap_telegraph', x: h.currentX + h.w * 0.5, y: h.currentY });
      }
      if (h.triggered && !h.deployed) {
        h.telegraphTimer += dt;
        const duration = h.telegraphDuration ?? 0.22;
        if (h.telegraphTimer >= duration) {
          h.deployed = true;
          events.push({ type: 'trap_activate', x: h.currentX + h.w * 0.5, y: h.currentY });
        }
      }
      if (h.deployed && h.deployProgress < 1) {
        h.deployProgress = Math.min(1, h.deployProgress + dt * 11);
      }
    } else if (h.kind === 'falling_spike') {
      if (!h.triggered && h.triggerX !== undefined && playerCenterX >= h.triggerX) {
        h.triggered = true;
        h.telegraphTimer = 0;
        events.push({ type: 'trap_telegraph', x: h.currentX + h.w * 0.5, y: h.currentY });
      }
      if (h.triggered && !h.deployed) {
        h.telegraphTimer += dt;
        const duration = h.telegraphDuration ?? 0.26;
        if (h.telegraphTimer >= duration) {
          h.deployed = true;
          events.push({ type: 'trap_activate', x: h.currentX + h.w * 0.5, y: h.currentY });
        }
      }
      if (h.deployed && !h.settled) {
        const speed = h.fallSpeed ?? 740;
        const maxY = h.y + (h.fallDistance ?? 200);
        h.currentY = Math.min(maxY, h.currentY + speed * dt);
        if (h.currentY >= maxY) {
          h.settled = true;
        }
      }
    } else if (h.kind === 'moving_laser') {
      h.laserActive = true;
      const rawRange = h.moveRange ?? 180;
      const minBound = rawRange >= 0 ? (h.moveAxis === 'x' ? h.x : h.y) : (h.moveAxis === 'x' ? h.x : h.y) + rawRange;
      const maxBound = rawRange >= 0 ? (h.moveAxis === 'x' ? h.x : h.y) + rawRange : (h.moveAxis === 'x' ? h.x : h.y);
      const speed = h.moveSpeed ?? 160;
      const axis = h.moveAxis ?? 'y';
      const pos = axis === 'x' ? h.currentX : h.currentY;
      let nextPos = pos + h.moveDir * speed * dt;
      if (nextPos >= maxBound) {
        nextPos = maxBound;
        h.moveDir = -1;
      } else if (nextPos <= minBound) {
        nextPos = minBound;
        h.moveDir = 1;
      }
      if (axis === 'x') h.currentX = nextPos;
      else h.currentY = nextPos;
    } else if (h.kind === 'pulse_laser') {
      if (h.triggerX !== undefined) {
        // Triggered ambush laser gate
        if (!h.triggered && playerCenterX >= h.triggerX) {
          h.triggered = true;
          h.telegraphTimer = 0;
          h.laserTelegraph = true;
          events.push({ type: 'trap_telegraph', x: h.currentX + h.w * 0.5, y: h.currentY + h.h * 0.5 });
        }
        if (h.triggered && !h.deployed) {
          h.telegraphTimer += dt;
          const dur = h.telegraphDuration ?? 0.42;
          if (h.telegraphTimer >= dur) {
            h.deployed = true;
            h.laserTelegraph = false;
            h.laserActive = true;
            events.push({ type: 'trap_activate', x: h.currentX + h.w * 0.5, y: h.currentY + h.h * 0.5 });
          }
        }
      } else {
        // Periodic cycling laser gate
        const offDur = h.cycleOffDuration ?? 1.1;
        const onDur = h.cycleOnDuration ?? 0.8;
        const warnDur = 0.28;
        const totalCycle = offDur + onDur;
        h.cycleTimer = (h.cycleTimer + dt) % totalCycle;
        if (h.cycleTimer < offDur - warnDur) {
          h.laserActive = false;
          h.laserTelegraph = false;
        } else if (h.cycleTimer < offDur) {
          h.laserActive = false;
          h.laserTelegraph = true;
        } else {
          if (!h.laserActive) {
            events.push({ type: 'trap_activate', x: h.currentX + h.w * 0.5, y: h.currentY + h.h * 0.5 });
          }
          h.laserActive = true;
          h.laserTelegraph = false;
        }
      }
    } else if (h.kind === 'rotor') {
      const angSpeed = h.angularSpeed ?? 2.0;
      h.angle += angSpeed * dt;
    }
  }
}

export type ModePhysicsHandler = (
  runtime: LevelRuntime,
  input: InputState,
  dt: number,
  events: SimulationEvent[],
) => void;

/**
 * Modular Cube Player Physics (Phase 1)
 */
export const stepCubePlayer: ModePhysicsHandler = (runtime, input, dt, events) => {
  const player = runtime.player;
  const wasGrounded = player.grounded;

  // Carry player with moving platform stood on during previous frame
  if (player.grounded && player.onPlatformId) {
    const plat = runtime.platforms.find((p) => p.id === player.onPlatformId && p.active);
    if (plat) {
      player.x += plat.currentX - plat.prevX;
      player.y += plat.currentY - plat.prevY;
    }
  }

  // Horizontal input & acceleration/deceleration
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0) {
    player.facing = moveDir as 1 | -1;
    const accel = player.grounded ? CUBE_PHYSICS.groundAccel : CUBE_PHYSICS.airAccel;
    player.vx = moveTowards(player.vx, moveDir * CUBE_PHYSICS.maxSpeed, accel * dt);
  } else {
    const decel = player.grounded ? CUBE_PHYSICS.groundDecel : CUBE_PHYSICS.airDecel;
    player.vx = moveTowards(player.vx, 0, decel * dt);
  }

  // Coyote time & jump buffering
  if (player.grounded) {
    player.coyoteTimer = CUBE_PHYSICS.coyoteTime;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    player.jumpBufferTimer = CUBE_PHYSICS.jumpBufferTime;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  // Execute buffered jump if grounded or within coyote window
  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = CUBE_PHYSICS.jumpVelocity;
    player.grounded = false;
    player.onPlatformId = null;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.scaleX = 0.78;
    player.scaleY = 1.24;
    events.push({ type: 'jump', x: player.x + player.w * 0.5, y: player.y + player.h });
  }

  // Variable jump height cut
  if (input.jumpJustReleased && player.vy < 0) {
    player.vy *= CUBE_PHYSICS.jumpCutMultiplier;
  }

  // Gravity
  player.vy = Math.min(CUBE_PHYSICS.terminalVelocity, player.vy + CUBE_PHYSICS.gravity * dt);

  // Horizontal integration & AABB resolution
  player.x += player.vx * dt;
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.w > runtime.level.width) {
    player.x = runtime.level.width - player.w;
    player.vx = 0;
  }

  for (const plat of runtime.platforms) {
    if (!plat.active) continue;
    const platRect: Rect = { x: plat.currentX, y: plat.currentY, w: plat.w, h: plat.h };
    if (checkAABB(player, platRect)) {
      if (player.vx > 0) {
        player.x = plat.currentX - player.w;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = plat.currentX + plat.w;
        player.vx = 0;
      }
    }
  }

  // Vertical integration & AABB resolution
  player.y += player.vy * dt;
  player.grounded = false;
  player.onPlatformId = null;

  for (const plat of runtime.platforms) {
    if (!plat.active) continue;
    const platRect: Rect = { x: plat.currentX, y: plat.currentY, w: plat.w, h: plat.h };
    if (checkAABB(player, platRect)) {
      if (player.vy >= 0) {
        player.y = plat.currentY - player.h;
        if (!wasGrounded && player.vy > 180) {
          player.scaleX = 1.24;
          player.scaleY = 0.76;
          events.push({ type: 'land', x: player.x + player.w * 0.5, y: player.y + player.h });
        }
        player.vy = 0;
        player.grounded = true;
        player.onPlatformId = plat.id;

        if ((plat.kind === 'disappearing' || plat.kind === 'collapsing' || plat.kind === 'fake') && !plat.triggered) {
          plat.triggered = true;
          plat.timer = 0;
          events.push({ type: 'trap_telegraph', x: plat.currentX + plat.w * 0.5, y: plat.currentY });
        }
      } else if (player.vy < 0) {
        player.y = plat.currentY + plat.h;
        player.vy = 0;
      }
    }
  }

  // Smoothly damp squash/stretch & eye look vector
  const damp = 1 - Math.exp(-16 * dt);
  player.scaleX += (1 - player.scaleX) * damp;
  player.scaleY += (1 - player.scaleY) * damp;
  const targetLookX = Math.abs(player.vx) > 20 ? Math.sign(player.vx) : player.facing;
  const targetLookY = Math.max(-1, Math.min(1, player.vy / 550));
  player.lookX += (targetLookX - player.lookX) * Math.min(1, 14 * dt);
  player.lookY += (targetLookY - player.lookY) * Math.min(1, 14 * dt);
};

/**
 * Dedicated Rocket Mode Player Physics (Phase 2)
 * Independent vertical thrust/dive flight + horizontal steering.
 */
export const stepRocketPlayer: ModePhysicsHandler = (runtime, input, dt) => {
  const player = runtime.player;

  // Horizontal steering
  const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveX !== 0) {
    player.facing = moveX as 1 | -1;
    player.vx = moveTowards(player.vx, moveX * ROCKET_PHYSICS.maxHorizontalSpeed, ROCKET_PHYSICS.horizontalAccel * dt);
  } else {
    player.vx = moveTowards(player.vx, 0, ROCKET_PHYSICS.horizontalDrag * dt);
  }

  // Vertical thrust / dive flight control
  const thrustUp = input.up || input.jumpHeld;
  const diveDown = input.down && !thrustUp;
  player.thrusting = thrustUp;

  if (thrustUp) {
    player.vy += (ROCKET_PHYSICS.gravity - ROCKET_PHYSICS.thrustAccel) * dt;
  } else if (diveDown) {
    player.vy += (ROCKET_PHYSICS.gravity + ROCKET_PHYSICS.diveAccel) * dt;
  } else {
    player.vy += ROCKET_PHYSICS.gravity * dt;
    player.vy *= Math.exp(-ROCKET_PHYSICS.verticalDamping * dt);
  }

  player.vy = Math.max(ROCKET_PHYSICS.maxUpSpeed, Math.min(ROCKET_PHYSICS.maxDownSpeed, player.vy));

  // Horizontal integration & wall collision
  player.x += player.vx * dt;
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.w > runtime.level.width) {
    player.x = runtime.level.width - player.w;
    player.vx = 0;
  }

  for (const plat of runtime.platforms) {
    if (!plat.active) continue;
    const platRect: Rect = { x: plat.currentX, y: plat.currentY, w: plat.w, h: plat.h };
    if (checkAABB(player, platRect)) {
      if (player.vx > 0) {
        player.x = plat.currentX - player.w;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = plat.currentX + plat.w;
        player.vx = 0;
      }
    }
  }

  // Vertical integration & corridor wall collision
  player.y += player.vy * dt;
  player.grounded = false;
  player.onPlatformId = null;

  for (const plat of runtime.platforms) {
    if (!plat.active) continue;
    const platRect: Rect = { x: plat.currentX, y: plat.currentY, w: plat.w, h: plat.h };
    if (checkAABB(player, platRect)) {
      if (player.vy >= 0) {
        player.y = plat.currentY - player.h;
        player.vy = 0;
        player.grounded = true;
        player.onPlatformId = plat.id;
      } else {
        player.y = plat.currentY + plat.h;
        player.vy = 0;
      }
    }
  }

  // Smooth aerodynamic nose pitch angle
  const targetPitch = Math.max(-0.42, Math.min(0.42, player.vy / 780));
  const currentPitch = player.pitchAngle ?? 0;
  player.pitchAngle = currentPitch + (targetPitch - currentPitch) * Math.min(1, 14 * dt);
};

/**
 * Mode registry dispatching independent Cube (Phase 1) and Rocket (Phase 2) controllers.
 */
const MODE_CONTROLLERS: Record<GameMode, ModePhysicsHandler> = {
  cube: stepCubePlayer,
  rocket: stepRocketPlayer,
};

export function stepSimulation(runtime: LevelRuntime, input: InputState, dt: number): SimulationEvent[] {
  const events: SimulationEvent[] = [];

  if (runtime.hitstopTimer > 0) {
    runtime.hitstopTimer = Math.max(0, runtime.hitstopTimer - dt);
    runtime.trauma = Math.max(0, runtime.trauma - dt * 1.9);
    return events;
  }

  if (!runtime.player.alive) {
    runtime.deathTimer += dt;
    runtime.trauma = Math.max(0, runtime.trauma - dt * 2.1);
    return events;
  }

  if (runtime.won) {
    return events;
  }

  runtime.elapsed += dt;
  runtime.trauma = Math.max(0, runtime.trauma - dt * 2.4);

  stepPlatforms(runtime, dt, events);
  stepHazards(runtime, dt, events);

  const handler = MODE_CONTROLLERS[runtime.player.mode];
  handler(runtime, input, dt, events);

  // Check lethal hazards (spikes, hidden traps, moving/pulsing lasers, rotating blades)
  for (const h of runtime.hazards) {
    const cause = checkHazardCollision(runtime.player, h);
    if (cause) {
      triggerPlayerDeath(runtime, events, cause);
      return events;
    }
  }

  // Check abyss fall
  if (runtime.player.y > runtime.level.deathY) {
    triggerPlayerDeath(runtime, events, 'Fell into the abyss');
    return events;
  }

  // Check exit portal
  if (checkAABB(runtime.player, runtime.level.portal)) {
    runtime.won = true;
    events.push({
      type: 'victory',
      x: runtime.level.portal.x + runtime.level.portal.w * 0.5,
      y: runtime.level.portal.y + runtime.level.portal.h * 0.5,
    });
  }

  // Smooth horizontal camera follow with subtle look-ahead
  const targetCamX = clampCameraX(
    runtime.player.x + runtime.player.w * 0.5 - LOGICAL_WIDTH * 0.36 + runtime.player.facing * 55,
    runtime.level.width,
  );
  runtime.cameraX += (targetCamX - runtime.cameraX) * Math.min(1, 9 * dt);

  return events;
}

function triggerPlayerDeath(runtime: LevelRuntime, events: SimulationEvent[], cause: string): void {
  runtime.player.alive = false;
  runtime.deathTimer = 0;
  runtime.deathCause = cause;
  runtime.hitstopTimer = 0.055;
  runtime.trauma = 0.85;
  events.push({
    type: 'death',
    x: runtime.player.x + runtime.player.w * 0.5,
    y: runtime.player.y + runtime.player.h * 0.5,
    cause,
  });
}

export function isDeathAnimComplete(runtime: LevelRuntime): boolean {
  return !runtime.player.alive && runtime.deathTimer >= DEATH_ANIM_DURATION;
}
