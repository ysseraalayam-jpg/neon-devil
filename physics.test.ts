import test from 'node:test';
import assert from 'node:assert/strict';
import { CUBE_PHYSICS, FIXED_DT, TOTAL_LEVELS } from './constants';
import { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVELS } from './levels';
import {
  createInitialLevelRuntime,
  stepSimulation,
} from './physics';
import {
  loadProgress,
  loadSettings,
  recordDeath,
  recordLevelCompletion,
  saveProgress,
  saveSettings,
  type StorageLike,
} from './storage';
import type { InputState } from './types';

const NO_INPUT: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jumpHeld: false,
  jumpJustPressed: false,
  jumpJustReleased: false,
};

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

test('player survives idle at spawn across all 5 levels', () => {
  for (const level of LEVELS) {
    const rt = createInitialLevelRuntime(level);
    for (let i = 0; i < 120; i++) {
      stepSimulation(rt, NO_INPUT, FIXED_DT);
    }
    assert.equal(rt.player.alive, true, `Level ${level.id} player should survive idle`);
    assert.equal(rt.player.grounded, true, `Level ${level.id} player should rest grounded`);
  }
});

test('variable jump height yields higher apex when held than when released early', () => {
  const rtFull = createInitialLevelRuntime(LEVEL_1);
  for (let i = 0; i < 10; i++) stepSimulation(rtFull, NO_INPUT, FIXED_DT);
  const startY = rtFull.player.y;
  let minYFull = startY;
  stepSimulation(rtFull, { ...NO_INPUT, up: true, jumpHeld: true, jumpJustPressed: true }, FIXED_DT);
  for (let i = 0; i < 40; i++) {
    stepSimulation(rtFull, { ...NO_INPUT, up: true, jumpHeld: true }, FIXED_DT);
    if (rtFull.player.y < minYFull) minYFull = rtFull.player.y;
  }

  const rtShort = createInitialLevelRuntime(LEVEL_1);
  for (let i = 0; i < 10; i++) stepSimulation(rtShort, NO_INPUT, FIXED_DT);
  let minYShort = startY;
  stepSimulation(rtShort, { ...NO_INPUT, up: true, jumpHeld: true, jumpJustPressed: true }, FIXED_DT);
  for (let i = 0; i < 3; i++) {
    stepSimulation(rtShort, { ...NO_INPUT, up: true, jumpHeld: true }, FIXED_DT);
    if (rtShort.player.y < minYShort) minYShort = rtShort.player.y;
  }
  stepSimulation(rtShort, { ...NO_INPUT, jumpJustReleased: true }, FIXED_DT);
  for (let i = 0; i < 35; i++) {
    stepSimulation(rtShort, NO_INPUT, FIXED_DT);
    if (rtShort.player.y < minYShort) minYShort = rtShort.player.y;
  }

  const fullHeight = startY - minYFull;
  const shortHeight = startY - minYShort;
  assert.ok(fullHeight > 110, `Expected full jump > 110px, got ${fullHeight}`);
  assert.ok(shortHeight < fullHeight - 35, `Expected short hop (${shortHeight}) well below full (${fullHeight})`);
});

test('coyote time allows jumping briefly after walking off a ledge', () => {
  const rt = createInitialLevelRuntime(LEVEL_1);
  for (let i = 0; i < 10; i++) stepSimulation(rt, NO_INPUT, FIXED_DT);
  while (rt.player.x <= 421) {
    stepSimulation(rt, { ...NO_INPUT, right: true }, FIXED_DT);
  }
  for (let i = 0; i < 3; i++) {
    stepSimulation(rt, { ...NO_INPUT, right: true }, FIXED_DT);
  }
  assert.equal(rt.player.grounded, false);
  const events = stepSimulation(
    rt,
    { ...NO_INPUT, right: true, up: true, jumpHeld: true, jumpJustPressed: true },
    FIXED_DT,
  );
  assert.ok(events.some((e) => e.type === 'jump'), 'Jump should fire inside coyote window');
  assert.ok(rt.player.vy < 0);
});

test('jump buffering triggers jump immediately upon landing', () => {
  const rt = createInitialLevelRuntime(LEVEL_1);
  rt.player.y = 540 - rt.player.h - 14;
  rt.player.vy = 240;
  rt.player.grounded = false;

  stepSimulation(rt, { ...NO_INPUT, up: true, jumpHeld: true, jumpJustPressed: true }, FIXED_DT);
  let jumped = false;
  for (let i = 0; i < 8; i++) {
    const events = stepSimulation(rt, { ...NO_INPUT, up: true, jumpHeld: true }, FIXED_DT);
    if (events.some((e) => e.type === 'jump')) jumped = true;
  }
  assert.equal(jumped, true, 'Buffered jump should trigger on landing');
});

test('traps trigger and full level reset restores every platform, hazard, and spawn position with zero checkpoints', () => {
  const rt = createInitialLevelRuntime(LEVEL_1);
  rt.player.x = 1010;
  rt.player.y = 460 - rt.player.h;
  rt.player.grounded = true;

  for (let i = 0; i < 20; i++) {
    stepSimulation(rt, NO_INPUT, FIXED_DT);
  }
  const hiddenSpike = rt.hazards.find((h) => h.id === 'l1-h2');
  assert.ok(hiddenSpike?.triggered, 'Hidden spike should trigger');
  assert.ok(hiddenSpike?.deployed, 'Hidden spike should deploy after telegraph');

  rt.player.x = 1320;
  rt.player.y = 440 - rt.player.h - 2;
  rt.player.vy = 100;
  for (let i = 0; i < 35; i++) {
    stepSimulation(rt, NO_INPUT, FIXED_DT);
  }
  const disp = rt.platforms.find((p) => p.id === 'l1-d1');
  assert.equal(disp?.triggered, true);
  assert.equal(disp?.active, false, 'Disappearing platform should deactivate after delay');

  const fresh = createInitialLevelRuntime(LEVEL_1);
  assert.equal(fresh.player.x, LEVEL_1.spawn.x);
  assert.equal(fresh.player.y, LEVEL_1.spawn.y);
  assert.equal(fresh.hazards.find((h) => h.id === 'l1-h2')?.triggered, false);
  assert.equal(fresh.hazards.find((h) => h.id === 'l1-h2')?.deployed, false);
  assert.equal(fresh.platforms.find((p) => p.id === 'l1-d1')?.active, true);
  assert.equal(fresh.platforms.find((p) => p.id === 'l1-d1')?.triggered, false);
});

test('Level 2 moving platforms carry the grounded player horizontally', () => {
  const rt = createInitialLevelRuntime(LEVEL_2);
  const m1 = rt.platforms.find((p) => p.id === 'l2-m1')!;
  rt.player.x = m1.x + 20;
  rt.player.y = m1.y - rt.player.h;
  rt.player.grounded = true;
  rt.player.onPlatformId = m1.id;

  const initialX = rt.player.x;
  for (let i = 0; i < 20; i++) {
    stepSimulation(rt, NO_INPUT, FIXED_DT);
  }
  assert.ok(rt.player.x > initialX + 20, 'Player standing on moving platform should be carried horizontally');
  assert.equal(rt.player.alive, true);
});

test('dedicated Rocket mode supports smooth vertical thrust, dive, and horizontal flight without crashing on corridor walls', () => {
  const rt = createInitialLevelRuntime(LEVEL_3);
  assert.equal(rt.player.mode, 'rocket');
  const startY = rt.player.y;
  const startX = rt.player.x;

  // Thrust up & steer right
  for (let i = 0; i < 30; i++) {
    stepSimulation(rt, { ...NO_INPUT, up: true, right: true, jumpHeld: true }, FIXED_DT);
  }
  assert.equal(rt.player.alive, true);
  assert.equal(rt.player.thrusting, true);
  assert.ok(rt.player.vy < 0, 'Rocket should ascend with negative vy when thrusting');
  assert.ok(rt.player.y < startY - 40, 'Rocket should climb significantly');
  assert.ok(rt.player.x > startX + 35, 'Rocket should steer right');

  const highY = rt.player.y;
  // Dive downward (reverses upward momentum then descends cleanly)
  for (let i = 0; i < 42; i++) {
    stepSimulation(rt, { ...NO_INPUT, down: true, right: true }, FIXED_DT);
  }
  assert.equal(rt.player.thrusting, false);
  assert.ok(rt.player.vy > 0, 'Rocket should dive with positive vy');
  assert.ok(rt.player.y > highY + 20, 'Rocket should descend smoothly');

  // Touch ceiling smoothly without dying
  for (let i = 0; i < 90; i++) {
    stepSimulation(rt, { ...NO_INPUT, up: true, jumpHeld: true }, FIXED_DT);
  }
  assert.equal(rt.player.alive, true, 'Touching corridor ceiling should slide, not kill');
  assert.ok(rt.player.y >= 64, 'Rocket should stay below ceiling l3-ceil0 (y=0..64)');
});

test('Rocket hazards (moving_laser, pulse_laser, rotor) oscillate, rotate, telegraph, and kill on contact', () => {
  const rt3 = createInitialLevelRuntime(LEVEL_3);
  const ml = rt3.hazards.find((h) => h.id === 'l3-ml1')!;
  const rotor = rt3.hazards.find((h) => h.id === 'l3-r1')!;
  const pl = rt3.hazards.find((h) => h.id === 'l3-pl1')!;
  const initialLaserY = ml.currentY;
  const initialRotorAngle = rotor.angle;

  for (let i = 0; i < 25; i++) {
    stepSimulation(rt3, NO_INPUT, FIXED_DT);
  }
  assert.notEqual(ml.currentY, initialLaserY, 'Moving laser should oscillate vertically');
  assert.notEqual(rotor.angle, initialRotorAngle, 'Rotor should spin continuously');
  assert.equal(pl.laserActive, false, 'Triggered pulse laser should stay inactive until player approaches');

  // Trigger pulse laser gate l3-pl1 (triggerX: 3390)
  rt3.player.x = 3420;
  rt3.player.y = 420; // Safe below l3-trap-wall
  stepSimulation(rt3, NO_INPUT, FIXED_DT);
  assert.equal(pl.triggered, true);
  assert.equal(pl.laserTelegraph, true);

  for (let i = 0; i < 35; i++) {
    stepSimulation(rt3, NO_INPUT, FIXED_DT);
  }
  assert.equal(pl.laserActive, true, 'Pulse laser should activate after telegraph window');

  // Move rocket into active moving laser l3-ml1
  rt3.player.x = ml.currentX - 4;
  rt3.player.y = ml.currentY + 20;
  const events = stepSimulation(rt3, NO_INPUT, FIXED_DT);
  assert.equal(rt3.player.alive, false);
  assert.ok(events.some((e) => e.type === 'death' && e.cause?.includes('laser')));

  // Verify Level 4 rotor collision
  const rt4 = createInitialLevelRuntime(LEVEL_4);
  const r4 = rt4.hazards.find((h) => h.id === 'l4-r1')!;
  rt4.player.x = r4.currentX - rt4.player.w * 0.5;
  rt4.player.y = r4.currentY - rt4.player.h * 0.5;
  const events4 = stepSimulation(rt4, NO_INPUT, FIXED_DT);
  assert.equal(rt4.player.alive, false);
  assert.ok(events4.some((e) => e.type === 'death' && e.cause?.includes('rotating blade')));
});

test('Level 5 fake safe platforms collapse on touch and reset cleanly on death', () => {
  const rt = createInitialLevelRuntime(LEVEL_5);
  const fake = rt.platforms.find((p) => p.id === 'l5-fake1')!;
  rt.player.x = fake.x + 20;
  rt.player.y = fake.y - rt.player.h - 2;
  rt.player.vy = 120;

  for (let i = 0; i < 28; i++) {
    stepSimulation(rt, NO_INPUT, FIXED_DT);
  }
  assert.equal(fake.triggered, true, 'Fake safe platform should trigger upon landing');
  assert.equal(fake.active, false, 'Fake safe platform should collapse quickly');

  const fresh = createInitialLevelRuntime(LEVEL_5);
  const freshFake = fresh.platforms.find((p) => p.id === 'l5-fake1')!;
  assert.equal(freshFake.active, true);
  assert.equal(freshFake.triggered, false);
  assert.equal(freshFake.currentY, fake.y);
});

test('progression persistence unlocks Levels 1 through 5 sequentially and preserves Phase 1 saves', () => {
  const storage = createMemoryStorage();
  // Simulate an existing Phase 1 save with Level 2 unlocked
  storage.setItem(
    'neon_devil_progress_v1',
    JSON.stringify({
      unlockedLevel: 2,
      totalDeaths: 5,
      levelDeaths: { 1: 4, 2: 1 },
      bestTimes: { 1: 14.32 },
      completedLevels: [1],
    }),
  );

  let prog = loadProgress(storage);
  assert.equal(prog.unlockedLevel, 2);
  assert.equal(prog.totalDeaths, 5);
  assert.equal(prog.levelDeaths[3], 0);
  assert.equal(prog.levelDeaths[5], 0);

  prog = recordDeath(prog, 2);
  prog = recordLevelCompletion(prog, 2, 18.5);
  assert.equal(prog.unlockedLevel, 3);
  prog = recordLevelCompletion(prog, 3, 21.1);
  assert.equal(prog.unlockedLevel, 4);
  prog = recordLevelCompletion(prog, 4, 24.4);
  assert.equal(prog.unlockedLevel, 5);
  prog = recordLevelCompletion(prog, 5, 29.8);
  assert.equal(prog.unlockedLevel, TOTAL_LEVELS);
  saveProgress(prog, storage);

  const reloaded = loadProgress(storage);
  assert.equal(reloaded.unlockedLevel, 5);
  assert.equal(reloaded.totalDeaths, 6);
  assert.deepEqual(reloaded.completedLevels, [1, 2, 3, 4, 5]);

  const settings = loadSettings(storage);
  settings.muted = true;
  settings.masterVolume = 0.45;
  saveSettings(settings, storage);
  const reloadedSettings = loadSettings(storage);
  assert.equal(reloadedSettings.muted, true);
  assert.equal(reloadedSettings.masterVolume, 0.45);
});

test('all 5 levels have distinct themes and valid spawn-to-portal spans', () => {
  const maxApex = (CUBE_PHYSICS.jumpVelocity * CUBE_PHYSICS.jumpVelocity) / (2 * CUBE_PHYSICS.gravity);
  assert.ok(maxApex > 120, `Jump apex ${maxApex} must exceed 120px`);

  const themeIds = new Set(LEVELS.map((l) => l.theme.id));
  assert.equal(themeIds.size, 5, 'All 5 levels should have distinct themes');
  assert.equal(LEVEL_3.mode, 'rocket');
  assert.equal(LEVEL_4.mode, 'rocket');
  assert.equal(LEVEL_5.mode, 'cube');

  for (const lvl of LEVELS) {
    assert.ok(lvl.portal.x > lvl.spawn.x + 2500, `Level ${lvl.id} should have full course length`);
  }
});
