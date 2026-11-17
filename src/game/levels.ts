import type { LevelDef, LevelTheme } from './types';

export const THEME_BLUE_MAUVE: LevelTheme = {
  id: 'blue-mauve',
  bgTop: '#040714',
  bgBottom: '#0B1330',
  gridColor: 'rgba(0, 212, 255, 0.075)',
  ambientGlow: 'rgba(186, 85, 255, 0.14)',
  platformFill: '#0A1A3A',
  platformStroke: '#00D4FF',
  platformGlow: 'rgba(0, 212, 255, 0.55)',
  platformSubtle: '#123060',
  hazardFill: '#2E0A38',
  hazardStroke: '#E879F9',
  hazardGlow: 'rgba(232, 121, 249, 0.72)',
  decorColor: 'rgba(200, 100, 255, 0.28)',
  portalPrimary: '#00E5FF',
  portalSecondary: '#E879F9',
  particlePrimary: '#00D4FF',
  particleSecondary: '#E879F9',
};

export const THEME_NEON_GREEN: LevelTheme = {
  id: 'neon-green',
  bgTop: '#020703',
  bgBottom: '#07170B',
  gridColor: 'rgba(34, 255, 102, 0.07)',
  ambientGlow: 'rgba(16, 230, 105, 0.12)',
  platformFill: '#071F0E',
  platformStroke: '#22FF66',
  platformGlow: 'rgba(34, 255, 102, 0.55)',
  platformSubtle: '#0D381B',
  hazardFill: '#2D0712',
  hazardStroke: '#FF3864',
  hazardGlow: 'rgba(255, 56, 100, 0.75)',
  decorColor: 'rgba(34, 255, 102, 0.24)',
  portalPrimary: '#22FF66',
  portalSecondary: '#B8FF38',
  particlePrimary: '#22FF66',
  particleSecondary: '#9EFF00',
};

/**
 * LEVEL 1 — BLUE MAUVE
 * Hard but fair introduction to precision jumping, visible spikes,
 * disappearing platforms, hidden pop-up spikes, falling spike ambush,
 * and a surprising collapsing threshold right before the exit portal.
 */
export const LEVEL_1: LevelDef = {
  id: 1,
  code: '01',
  name: 'Blue Mauve',
  subtitle: 'Chamber of Fractured Bridges',
  mode: 'cube',
  width: 3420,
  height: 720,
  deathY: 770,
  spawn: { x: 110, y: 500 },
  portal: { x: 3220, y: 340, w: 52, h: 74 },
  theme: THEME_BLUE_MAUVE,
  platforms: [
    // Zone 1: Safe opening chamber (wide landing, zero input survival guaranteed)
    { id: 'l1-p1', x: 40, y: 540, w: 380, h: 180, kind: 'solid' },
    // Clean 120px gap -> Visible spike introduction
    { id: 'l1-p2', x: 540, y: 540, w: 360, h: 180, kind: 'solid' },
    // Step up 80px -> Hidden pop-up spike near right edge
    { id: 'l1-p3', x: 960, y: 460, w: 230, h: 28, kind: 'solid' },
    // Zone 3: Three disappearing neon bridges (130-145px horizontal hops)
    { id: 'l1-d1', x: 1290, y: 440, w: 115, h: 22, kind: 'disappearing', triggerDelay: 0.44, respawnDelay: 2.2 },
    { id: 'l1-d2', x: 1525, y: 395, w: 115, h: 22, kind: 'disappearing', triggerDelay: 0.44, respawnDelay: 2.2 },
    { id: 'l1-d3', x: 1760, y: 440, w: 115, h: 22, kind: 'disappearing', triggerDelay: 0.44, respawnDelay: 2.2 },
    // Zone 4: Solid recovery island -> Fake collapsing center tile + falling ceiling spike
    { id: 'l1-p4', x: 1975, y: 480, w: 240, h: 240, kind: 'solid' },
    { id: 'l1-p5a', x: 2310, y: 480, w: 115, h: 240, kind: 'solid' },
    { id: 'l1-c1', x: 2425, y: 480, w: 95, h: 24, kind: 'collapsing', triggerDelay: 0.3 },
    { id: 'l1-p5b', x: 2520, y: 480, w: 180, h: 240, kind: 'solid' },
    // Overhead rail visual for falling trap
    { id: 'l1-rail', x: 2550, y: 210, w: 90, h: 24, kind: 'solid' },
    // Zone 5: Surprising final runway — middle tile retracts right before portal!
    { id: 'l1-p6a', x: 2790, y: 420, w: 210, h: 300, kind: 'solid' },
    {
      id: 'l1-trap-floor',
      x: 3000,
      y: 420,
      w: 115,
      h: 300,
      kind: 'retracting',
      triggerX: 2925,
      triggerDelay: 0.22,
      retractOffsetY: 260,
    },
    { id: 'l1-p6b', x: 3115, y: 420, w: 220, h: 300, kind: 'solid' },
  ],
  hazards: [
    // Visible spike pair on Zone 2
    { id: 'l1-h1', x: 695, y: 516, w: 52, h: 24, kind: 'spike', direction: 'up' },
    // Hidden pop-up spike on p3 (triggers when entering p3)
    {
      id: 'l1-h2',
      x: 1105,
      y: 436,
      w: 44,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 1005,
      telegraphDuration: 0.22,
    },
    // Visible floor spike guard before final jump
    { id: 'l1-h3', x: 2135, y: 456, w: 36, h: 24, kind: 'spike', direction: 'up' },
    // Falling spike trap above p5b
    {
      id: 'l1-h4',
      x: 2575,
      y: 234,
      w: 44,
      h: 32,
      kind: 'falling_spike',
      direction: 'down',
      triggerX: 2475,
      telegraphDuration: 0.28,
      fallDistance: 214,
      fallSpeed: 760,
    },
    // Surprise ceiling spike just past the retracting gap edge
    {
      id: 'l1-h5',
      x: 3132,
      y: 396,
      w: 28,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 3040,
      telegraphDuration: 0.24,
    },
  ],
  decorations: [
    { x: 220, y: 260, size: 70, kind: 'diamond', phase: 0.2 },
    { x: 640, y: 210, size: 90, kind: 'ring', phase: 1.1 },
    { x: 1050, y: 180, size: 55, kind: 'chevron', phase: 2.0 },
    { x: 1560, y: 170, size: 110, kind: 'diamond', phase: 0.8 },
    { x: 2090, y: 210, size: 80, kind: 'ring', phase: 1.6 },
    { x: 2520, y: 140, size: 60, kind: 'chevron', phase: 2.5 },
    { x: 3050, y: 180, size: 105, kind: 'ring', phase: 0.4 },
    { x: 3246, y: 250, size: 65, kind: 'diamond', phase: 1.9 },
  ],
};

/**
 * LEVEL 2 — NEON GREEN
 * Completely distinct vertical-and-horizontal gauntlet:
 * Precision staircase ascent, moving horizontal & vertical platforms,
 * collapsing floor cascade, low-ceiling short-hop tunnel,
 * moving platform beneath falling spike ambushes, and a treacherous final altar.
 */
export const LEVEL_2: LevelDef = {
  id: 2,
  code: '02',
  name: 'Neon Green',
  subtitle: 'Velocity Gauntlet',
  mode: 'cube',
  width: 3920,
  height: 720,
  deathY: 770,
  spawn: { x: 100, y: 530 },
  portal: { x: 3785, y: 230, w: 52, h: 74 },
  theme: THEME_NEON_GREEN,
  platforms: [
    // Zone 1: Vertical ascent staircase
    { id: 'l2-p1', x: 40, y: 580, w: 250, h: 140, kind: 'solid' },
    { id: 'l2-p2', x: 345, y: 495, w: 110, h: 24, kind: 'solid' },
    { id: 'l2-p3', x: 500, y: 410, w: 110, h: 24, kind: 'collapsing', triggerDelay: 0.34 },
    // Zone 2: Horizontal moving carrier + spiked mid-pillar + vertical lift
    {
      id: 'l2-m1',
      x: 685,
      y: 380,
      w: 115,
      h: 22,
      kind: 'moving',
      moveAxis: 'x',
      moveRange: 195,
      moveSpeed: 135,
      movePhase: 0,
    },
    { id: 'l2-p4', x: 1045, y: 390, w: 110, h: 330, kind: 'solid' },
    {
      id: 'l2-m2',
      x: 1235,
      y: 255,
      w: 110,
      h: 22,
      kind: 'moving',
      moveAxis: 'y',
      moveRange: 185,
      moveSpeed: 125,
      movePhase: 0.6,
    },
    // Tall obstacle wall between vertical lift and upper landing
    { id: 'l2-wall', x: 1415, y: 355, w: 38, h: 365, kind: 'solid' },
    { id: 'l2-p5', x: 1453, y: 310, w: 180, h: 28, kind: 'solid' },
    // Zone 3: Collapsing cascade -> Low-ceiling precision short-hop runway
    { id: 'l2-c1', x: 1715, y: 355, w: 105, h: 22, kind: 'collapsing', triggerDelay: 0.28 },
    { id: 'l2-c2', x: 1900, y: 415, w: 105, h: 22, kind: 'collapsing', triggerDelay: 0.28 },
    { id: 'l2-c3', x: 2085, y: 475, w: 105, h: 22, kind: 'collapsing', triggerDelay: 0.28 },
    { id: 'l2-p6', x: 2265, y: 505, w: 310, h: 215, kind: 'solid' },
    // Overhead low-ceiling beam forcing controlled short-hops
    { id: 'l2-ceil', x: 2315, y: 365, w: 220, h: 34, kind: 'solid' },
    // Zone 4: Fast moving platform underneath double falling spike ambushes
    {
      id: 'l2-m3',
      x: 2635,
      y: 470,
      w: 120,
      h: 22,
      kind: 'moving',
      moveAxis: 'x',
      moveRange: 230,
      moveSpeed: 155,
      movePhase: 0,
    },
    { id: 'l2-ambush-rail', x: 2740, y: 190, w: 240, h: 22, kind: 'solid' },
    { id: 'l2-p7', x: 3045, y: 440, w: 115, h: 280, kind: 'solid' },
    // Zone 5: Challenging exit sequence (disappearing stone -> vertical elevator -> rigged final altar)
    { id: 'l2-d1', x: 3235, y: 385, w: 96, h: 22, kind: 'disappearing', triggerDelay: 0.36, respawnDelay: 2.0 },
    {
      id: 'l2-m4',
      x: 3410,
      y: 270,
      w: 100,
      h: 22,
      kind: 'moving',
      moveAxis: 'y',
      moveRange: 145,
      moveSpeed: 120,
      movePhase: 1.2,
    },
    { id: 'l2-p8a', x: 3585, y: 305, w: 105, h: 415, kind: 'solid' },
    { id: 'l2-c4', x: 3690, y: 305, w: 72, h: 24, kind: 'collapsing', triggerDelay: 0.24 },
    { id: 'l2-p8b', x: 3762, y: 305, w: 115, h: 415, kind: 'solid' },
  ],
  hazards: [
    // Hidden spike on mid-station pillar p4
    {
      id: 'l2-h1',
      x: 1105,
      y: 366,
      w: 40,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 1040,
      telegraphDuration: 0.23,
    },
    // Top spikes on the divider wall
    { id: 'l2-h2', x: 1417, y: 331, w: 34, h: 24, kind: 'spike', direction: 'up' },
    // Two floor spikes inside low-ceiling tunnel
    { id: 'l2-h3', x: 2345, y: 481, w: 34, h: 24, kind: 'spike', direction: 'up' },
    { id: 'l2-h4', x: 2475, y: 481, w: 34, h: 24, kind: 'spike', direction: 'up' },
    // Underside spikes on low ceiling to punish full-height jumps
    { id: 'l2-h5', x: 2405, y: 399, w: 46, h: 20, kind: 'spike', direction: 'down' },
    // Double falling spike ambushes above Zone 4 moving platform
    {
      id: 'l2-h6',
      x: 2770,
      y: 212,
      w: 38,
      h: 32,
      kind: 'falling_spike',
      direction: 'down',
      triggerX: 2685,
      telegraphDuration: 0.26,
      fallDistance: 226,
      fallSpeed: 760,
    },
    {
      id: 'l2-h7',
      x: 2910,
      y: 212,
      w: 38,
      h: 32,
      kind: 'falling_spike',
      direction: 'down',
      triggerX: 2825,
      telegraphDuration: 0.26,
      fallDistance: 226,
      fallSpeed: 760,
    },
    // Final altar hidden pop-up spike
    {
      id: 'l2-h8',
      x: 3648,
      y: 281,
      w: 34,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 3580,
      telegraphDuration: 0.23,
    },
  ],
  decorations: [
    { x: 180, y: 240, size: 75, kind: 'pillar', phase: 0.3 },
    { x: 540, y: 180, size: 60, kind: 'diamond', phase: 1.0 },
    { x: 900, y: 150, size: 95, kind: 'chevron', phase: 1.7 },
    { x: 1320, y: 130, size: 70, kind: 'diamond', phase: 2.2 },
    { x: 1840, y: 170, size: 88, kind: 'pillar', phase: 0.6 },
    { x: 2410, y: 185, size: 95, kind: 'chevron', phase: 1.4 },
    { x: 2860, y: 120, size: 85, kind: 'diamond', phase: 2.8 },
    { x: 3450, y: 150, size: 90, kind: 'ring', phase: 0.9 },
    { x: 3810, y: 165, size: 64, kind: 'diamond', phase: 1.8 },
  ],
};

export const THEME_CYAN_ROCKET: LevelTheme = {
  id: 'cyan-rocket',
  bgTop: '#020714',
  bgBottom: '#06152B',
  gridColor: 'rgba(0, 229, 255, 0.08)',
  ambientGlow: 'rgba(0, 174, 255, 0.16)',
  platformFill: '#071B36',
  platformStroke: '#00E5FF',
  platformGlow: 'rgba(0, 229, 255, 0.6)',
  platformSubtle: '#0D3561',
  hazardFill: '#1B0D38',
  hazardStroke: '#FF38A8',
  hazardGlow: 'rgba(255, 56, 168, 0.75)',
  decorColor: 'rgba(0, 229, 255, 0.25)',
  portalPrimary: '#00E5FF',
  portalSecondary: '#60A5FA',
  particlePrimary: '#00E5FF',
  particleSecondary: '#38BDF8',
};

export const THEME_RED_ROCKET: LevelTheme = {
  id: 'red-rocket',
  bgTop: '#0B0204',
  bgBottom: '#1C0508',
  gridColor: 'rgba(255, 59, 48, 0.085)',
  ambientGlow: 'rgba(255, 90, 30, 0.17)',
  platformFill: '#24070B',
  platformStroke: '#FF453A',
  platformGlow: 'rgba(255, 69, 58, 0.65)',
  platformSubtle: '#470E14',
  hazardFill: '#330A02',
  hazardStroke: '#FF9500',
  hazardGlow: 'rgba(255, 149, 0, 0.8)',
  decorColor: 'rgba(255, 107, 43, 0.26)',
  portalPrimary: '#FF453A',
  portalSecondary: '#FFB340',
  particlePrimary: '#FF6B2B',
  particleSecondary: '#FFD60A',
};

export const THEME_GOLD_BLACK: LevelTheme = {
  id: 'gold-black',
  bgTop: '#050402',
  bgBottom: '#120D04',
  gridColor: 'rgba(255, 209, 71, 0.075)',
  ambientGlow: 'rgba(245, 158, 11, 0.15)',
  platformFill: '#181205',
  platformStroke: '#FFD147',
  platformGlow: 'rgba(255, 209, 71, 0.6)',
  platformSubtle: '#362708',
  hazardFill: '#2E0905',
  hazardStroke: '#FF5722',
  hazardGlow: 'rgba(255, 87, 34, 0.78)',
  decorColor: 'rgba(255, 209, 71, 0.24)',
  portalPrimary: '#FFD147',
  portalSecondary: '#FFF3B0',
  particlePrimary: '#FFD147',
  particleSecondary: '#F59E0B',
};

/**
 * LEVEL 3 — CYAN SURGE (Rocket Mode)
 * Vertical flight corridors, moving laser barriers, rotating blades,
 * unexpected triggered laser gate, and final escape climb.
 */
export const LEVEL_3: LevelDef = {
  id: 3,
  code: '03',
  name: 'Cyan Surge',
  subtitle: 'Orbital Flight Corridor',
  mode: 'rocket',
  width: 4400,
  height: 720,
  deathY: 770,
  spawn: { x: 110, y: 474 },
  portal: { x: 4230, y: 310, w: 56, h: 82 },
  theme: THEME_CYAN_ROCKET,
  platforms: [
    // Launchpad & boundary frame
    { id: 'l3-pad', x: 40, y: 500, w: 320, h: 220, kind: 'solid' },
    { id: 'l3-ceil0', x: 40, y: 0, w: 4320, h: 64, kind: 'solid' },
    { id: 'l3-floor0', x: 360, y: 656, w: 4000, h: 64, kind: 'solid' },
    // Zone 2: S-curve corridor blocks (wide 210px+ lanes)
    { id: 'l3-b1', x: 640, y: 64, w: 120, h: 270, kind: 'solid' },
    { id: 'l3-b2', x: 980, y: 390, w: 130, h: 266, kind: 'solid' },
    { id: 'l3-b3', x: 1320, y: 64, w: 120, h: 280, kind: 'solid' },
    // Zone 3: Mid-corridor horizontal divider between moving lasers
    { id: 'l3-div1', x: 1850, y: 335, w: 220, h: 36, kind: 'solid' },
    // Zone 4: Rotor chamber frame pillars
    { id: 'l3-p4', x: 2340, y: 64, w: 54, h: 120, kind: 'solid' },
    { id: 'l3-p5', x: 2340, y: 536, w: 54, h: 120, kind: 'solid' },
    // Zone 5: Final escape slalom + triggered trap chamber
    { id: 'l3-trap-wall', x: 3490, y: 340, w: 180, h: 28, kind: 'solid' },
    { id: 'l3-end1', x: 3860, y: 64, w: 80, h: 240, kind: 'solid' },
    { id: 'l3-end2', x: 4030, y: 430, w: 80, h: 226, kind: 'solid' },
  ],
  hazards: [
    // Corridor wall spikes
    { id: 'l3-h1', x: 655, y: 334, w: 90, h: 22, kind: 'spike', direction: 'down' },
    { id: 'l3-h2', x: 1000, y: 368, w: 90, h: 22, kind: 'spike', direction: 'up' },
    // Moving laser barriers (Zone 3)
    {
      id: 'l3-ml1',
      x: 1620,
      y: 110,
      w: 16,
      h: 175,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: 310,
      moveSpeed: 165,
    },
    {
      id: 'l3-ml2',
      x: 2150,
      y: 360,
      w: 16,
      h: 185,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: -240,
      moveSpeed: 185,
    },
    // Rotating cyber blades (Zone 4)
    {
      id: 'l3-r1',
      x: 2620,
      y: 360,
      w: 184,
      h: 184,
      kind: 'rotor',
      direction: 'up',
      radius: 92,
      angularSpeed: 1.85,
      bladeCount: 2,
    },
    {
      id: 'l3-r2',
      x: 3060,
      y: 355,
      w: 210,
      h: 210,
      kind: 'rotor',
      direction: 'up',
      radius: 105,
      angularSpeed: -2.05,
      bladeCount: 4,
    },
    // Unexpected triggered upper laser gate (forces low dive below l3-trap-wall)
    {
      id: 'l3-pl1',
      x: 3570,
      y: 66,
      w: 16,
      h: 274,
      kind: 'pulse_laser',
      direction: 'down',
      triggerX: 3390,
      telegraphDuration: 0.48,
    },
    // Final fast vertical laser sweep before portal
    {
      id: 'l3-ml3',
      x: 3965,
      y: 115,
      w: 16,
      h: 165,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: 320,
      moveSpeed: 205,
    },
  ],
  decorations: [
    { x: 240, y: 240, size: 80, kind: 'chevron', phase: 0.2 },
    { x: 860, y: 220, size: 95, kind: 'ring', phase: 1.1 },
    { x: 1520, y: 260, size: 70, kind: 'diamond', phase: 0.5 },
    { x: 2050, y: 180, size: 85, kind: 'chevron', phase: 1.7 },
    { x: 2820, y: 190, size: 110, kind: 'ring', phase: 2.3 },
    { x: 3420, y: 210, size: 75, kind: 'diamond', phase: 0.9 },
    { x: 4160, y: 220, size: 95, kind: 'ring', phase: 1.4 },
  ],
};

/**
 * LEVEL 4 — CRIMSON CORE (Rocket Mode: Extreme)
 * Narrow high-speed corridors, moving laser walls, counter-rotating rotors,
 * pulsing laser gates, sudden environmental trap, and extreme finale.
 */
export const LEVEL_4: LevelDef = {
  id: 4,
  code: '04',
  name: 'Crimson Core',
  subtitle: 'Reactor Overdrive',
  mode: 'rocket',
  width: 4800,
  height: 720,
  deathY: 770,
  spawn: { x: 100, y: 434 },
  portal: { x: 4620, y: 290, w: 56, h: 82 },
  theme: THEME_RED_ROCKET,
  platforms: [
    // Launchpad & tight reactor frame
    { id: 'l4-pad', x: 40, y: 460, w: 260, h: 260, kind: 'solid' },
    { id: 'l4-ceil0', x: 40, y: 0, w: 4720, h: 58, kind: 'solid' },
    { id: 'l4-floor0', x: 300, y: 662, w: 4460, h: 58, kind: 'solid' },
    // Zone 1-2: Narrow stepped tunnel (170px lanes)
    { id: 'l4-t1', x: 520, y: 58, w: 140, h: 260, kind: 'solid' },
    { id: 'l4-t2', x: 520, y: 495, w: 140, h: 167, kind: 'solid' },
    { id: 'l4-t3', x: 860, y: 58, w: 140, h: 150, kind: 'solid' },
    { id: 'l4-t4', x: 860, y: 380, w: 140, h: 282, kind: 'solid' },
    { id: 'l4-t5', x: 1210, y: 255, w: 150, h: 180, kind: 'solid' },
    // Zone 4: Sudden trap choke + slalom blocks
    { id: 'l4-c1', x: 2700, y: 58, w: 60, h: 210, kind: 'solid' },
    { id: 'l4-c2', x: 2700, y: 445, w: 60, h: 217, kind: 'solid' },
    { id: 'l4-s1', x: 3160, y: 58, w: 90, h: 280, kind: 'solid' },
    { id: 'l4-s2', x: 3460, y: 370, w: 90, h: 292, kind: 'solid' },
    // Zone 5: Extreme final chicane
    { id: 'l4-f1', x: 4160, y: 58, w: 80, h: 270, kind: 'solid' },
    { id: 'l4-f2', x: 4370, y: 390, w: 80, h: 272, kind: 'solid' },
  ],
  hazards: [
    // Narrow tunnel spikes
    { id: 'l4-h1', x: 540, y: 318, w: 100, h: 20, kind: 'spike', direction: 'down' },
    { id: 'l4-h2', x: 880, y: 360, w: 100, h: 20, kind: 'spike', direction: 'up' },
    // Moving laser wall in Zone 2
    {
      id: 'l4-ml1',
      x: 1100,
      y: 95,
      w: 16,
      h: 220,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: 300,
      moveSpeed: 215,
    },
    // Twin counter-rotating 4-blade rotors + central pulsing laser (Zone 3)
    {
      id: 'l4-r1',
      x: 1700,
      y: 350,
      w: 204,
      h: 204,
      kind: 'rotor',
      direction: 'up',
      radius: 102,
      angularSpeed: 2.35,
      bladeCount: 4,
    },
    {
      id: 'l4-pl1',
      x: 2030,
      y: 60,
      w: 16,
      h: 600,
      kind: 'pulse_laser',
      direction: 'down',
      cycleOffDuration: 1.05,
      cycleOnDuration: 0.8,
      cyclePhase: 0.2,
    },
    {
      id: 'l4-r2',
      x: 2340,
      y: 360,
      w: 208,
      h: 208,
      kind: 'rotor',
      direction: 'up',
      radius: 104,
      angularSpeed: -2.6,
      bladeCount: 4,
    },
    // Sudden triggered laser barrier right after choke c1/c2
    {
      id: 'l4-pl2',
      x: 2950,
      y: 260,
      w: 16,
      h: 400,
      kind: 'pulse_laser',
      direction: 'down',
      triggerX: 2720,
      telegraphDuration: 0.36,
    },
    // Oscillating horizontal + vertical lasers in final stretch
    {
      id: 'l4-ml2',
      x: 3660,
      y: 80,
      w: 16,
      h: 215,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: 330,
      moveSpeed: 230,
    },
    {
      id: 'l4-r3',
      x: 3940,
      y: 360,
      w: 196,
      h: 196,
      kind: 'rotor',
      direction: 'up',
      radius: 98,
      angularSpeed: 2.75,
      bladeCount: 4,
    },
    // Final fast gate before portal
    {
      id: 'l4-ml3',
      x: 4510,
      y: 95,
      w: 16,
      h: 185,
      kind: 'moving_laser',
      direction: 'down',
      moveAxis: 'y',
      moveRange: 320,
      moveSpeed: 245,
    },
  ],
  decorations: [
    { x: 240, y: 210, size: 75, kind: 'pillar', phase: 0.1 },
    { x: 740, y: 200, size: 80, kind: 'diamond', phase: 0.7 },
    { x: 1460, y: 180, size: 105, kind: 'ring', phase: 1.5 },
    { x: 2030, y: 220, size: 95, kind: 'chevron', phase: 2.1 },
    { x: 2920, y: 165, size: 85, kind: 'diamond', phase: 0.4 },
    { x: 3640, y: 200, size: 100, kind: 'pillar', phase: 1.9 },
    { x: 4520, y: 190, size: 85, kind: 'ring', phase: 2.6 },
  ],
};

/**
 * LEVEL 5 — GOLDEN TRIAL (Cube Mode)
 * Glowing gold and obsidian chamber combining precision jumps,
 * fake safe floors, disappearing stones, moving platforms, hidden spikes,
 * falling ambush, and a retracting threshold finale.
 */
export const LEVEL_5: LevelDef = {
  id: 5,
  code: '05',
  name: 'Golden Trial',
  subtitle: 'Sanctum of Illusion',
  mode: 'cube',
  width: 4320,
  height: 720,
  deathY: 770,
  spawn: { x: 110, y: 500 },
  portal: { x: 4165, y: 266, w: 52, h: 74 },
  theme: THEME_GOLD_BLACK,
  platforms: [
    // Zone 1: Obsidian & gold threshold
    { id: 'l5-p1', x: 40, y: 540, w: 300, h: 180, kind: 'solid' },
    { id: 'l5-p2', x: 455, y: 510, w: 130, h: 24, kind: 'solid' },
    // Zone 2: Fake safe golden platform -> Solid landing with hidden spike
    { id: 'l5-fake1', x: 685, y: 470, w: 120, h: 24, kind: 'fake', triggerDelay: 0.16 },
    { id: 'l5-p3', x: 895, y: 460, w: 230, h: 260, kind: 'solid' },
    // Zone 3: Disappearing stone -> Horizontal mover -> Vertical lift -> Low-ceiling perch
    { id: 'l5-d1', x: 1220, y: 410, w: 100, h: 22, kind: 'disappearing', triggerDelay: 0.36, respawnDelay: 2.0 },
    {
      id: 'l5-m1',
      x: 1415,
      y: 390,
      w: 105,
      h: 22,
      kind: 'moving',
      moveAxis: 'x',
      moveRange: 210,
      moveSpeed: 150,
    },
    {
      id: 'l5-m2',
      x: 1810,
      y: 265,
      w: 96,
      h: 22,
      kind: 'moving',
      moveAxis: 'y',
      moveRange: 175,
      moveSpeed: 135,
    },
    { id: 'l5-p4', x: 1995, y: 295, w: 180, h: 28, kind: 'solid' },
    { id: 'l5-ceil1', x: 2045, y: 180, w: 100, h: 28, kind: 'solid' },
    // Zone 4: Collapsing cascade -> Runway with falling spike + fake edge extension
    { id: 'l5-c1', x: 2265, y: 345, w: 100, h: 22, kind: 'collapsing', triggerDelay: 0.24 },
    { id: 'l5-c2', x: 2460, y: 405, w: 100, h: 22, kind: 'collapsing', triggerDelay: 0.24 },
    { id: 'l5-c3', x: 2655, y: 465, w: 100, h: 22, kind: 'collapsing', triggerDelay: 0.24 },
    { id: 'l5-p5', x: 2845, y: 495, w: 300, h: 225, kind: 'solid' },
    { id: 'l5-rail', x: 2945, y: 173, w: 90, h: 22, kind: 'solid' },
    { id: 'l5-fake2', x: 3145, y: 495, w: 95, h: 24, kind: 'fake', triggerDelay: 0.15 },
    // Zone 5: Fast mover -> Disappearing stone -> Golden Altar retracting finale
    {
      id: 'l5-m3',
      x: 3325,
      y: 455,
      w: 100,
      h: 22,
      kind: 'moving',
      moveAxis: 'x',
      moveRange: 195,
      moveSpeed: 165,
    },
    { id: 'l5-d2', x: 3710, y: 390, w: 92, h: 22, kind: 'disappearing', triggerDelay: 0.32, respawnDelay: 1.9 },
    { id: 'l5-p6a', x: 3890, y: 340, w: 105, h: 380, kind: 'solid' },
    {
      id: 'l5-trap-floor',
      x: 3995,
      y: 340,
      w: 95,
      h: 380,
      kind: 'retracting',
      triggerX: 3935,
      triggerDelay: 0.2,
      retractOffsetY: 260,
    },
    { id: 'l5-p6b', x: 4090, y: 340, w: 175, h: 380, kind: 'solid' },
  ],
  hazards: [
    // Hidden spike on p3
    {
      id: 'l5-h1',
      x: 990,
      y: 436,
      w: 42,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 915,
      telegraphDuration: 0.22,
    },
    // Falling golden spike above p5
    {
      id: 'l5-h2',
      x: 2970,
      y: 195,
      w: 42,
      h: 32,
      kind: 'falling_spike',
      direction: 'down',
      triggerX: 2880,
      telegraphDuration: 0.25,
      fallDistance: 268,
      fallSpeed: 790,
    },
    // Final altar hidden spike just past retracting gap
    {
      id: 'l5-h3',
      x: 4106,
      y: 316,
      w: 28,
      h: 24,
      kind: 'hidden_spike',
      direction: 'up',
      triggerX: 4010,
      telegraphDuration: 0.22,
    },
  ],
  decorations: [
    { x: 200, y: 260, size: 75, kind: 'diamond', phase: 0.2 },
    { x: 640, y: 200, size: 90, kind: 'ring', phase: 1.0 },
    { x: 1080, y: 170, size: 65, kind: 'chevron', phase: 1.8 },
    { x: 1620, y: 155, size: 105, kind: 'diamond', phase: 0.7 },
    { x: 2150, y: 120, size: 85, kind: 'ring', phase: 2.1 },
    { x: 2740, y: 185, size: 70, kind: 'pillar', phase: 1.2 },
    { x: 3340, y: 190, size: 95, kind: 'chevron', phase: 2.6 },
    { x: 4050, y: 175, size: 100, kind: 'diamond', phase: 0.5 },
  ],
};

export const LEVELS: LevelDef[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5];

export function getLevelById(id: number): LevelDef {
  return LEVELS.find((lvl) => lvl.id === id) ?? LEVEL_1;
}
