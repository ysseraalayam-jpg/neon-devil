export type GameMode = 'cube' | 'rocket';

export type GameStatus = 'title' | 'playing' | 'paused' | 'dying' | 'dead' | 'victory';

export type ThemeId = 'blue-mauve' | 'neon-green' | 'cyan-rocket' | 'red-rocket' | 'gold-black';

export interface LevelTheme {
  id: ThemeId;
  bgTop: string;
  bgBottom: string;
  gridColor: string;
  ambientGlow: string;
  platformFill: string;
  platformStroke: string;
  platformGlow: string;
  platformSubtle: string;
  hazardFill: string;
  hazardStroke: string;
  hazardGlow: string;
  decorColor: string;
  portalPrimary: string;
  portalSecondary: string;
  particlePrimary: string;
  particleSecondary: string;
}

export type PlatformKind = 'solid' | 'disappearing' | 'moving' | 'collapsing' | 'retracting' | 'fake';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  /** Disappearing / collapsing delay in seconds after player touches it */
  triggerDelay?: number;
  /** Time before disappearing platform respawns (if applicable) */
  respawnDelay?: number;
  /** Moving platform endpoints & speed */
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
  /** Retracting trap platform triggered when player x >= triggerX */
  triggerX?: number;
  retractOffsetY?: number;
}

export interface PlatformRuntime extends PlatformDef {
  currentX: number;
  currentY: number;
  prevX: number;
  prevY: number;
  active: boolean;
  triggered: boolean;
  timer: number;
  respawnTimer: number;
  alpha: number;
  shakeOffset: number;
  moveDir: 1 | -1;
}

export type HazardKind =
  | 'spike'
  | 'hidden_spike'
  | 'falling_spike'
  | 'moving_laser'
  | 'pulse_laser'
  | 'rotor';

export type SpikeDirection = 'up' | 'down' | 'left' | 'right';

export interface HazardDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: HazardKind;
  direction: SpikeDirection;
  /** Proximity / X-coordinate trigger for hidden, falling, or triggered laser traps */
  triggerX?: number;
  triggerRadius?: number;
  /** Telegraph duration before hazard becomes lethal/active */
  telegraphDuration?: number;
  /** Falling spike travel parameters */
  fallDistance?: number;
  fallSpeed?: number;
  /** Moving laser / oscillating rotor parameters */
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
  /** Pulse laser cycle parameters */
  cycleOffDuration?: number;
  cycleOnDuration?: number;
  cyclePhase?: number;
  /** Rotating hazard parameters */
  radius?: number;
  angularSpeed?: number;
  bladeCount?: number;
}

export interface HazardRuntime extends HazardDef {
  currentX: number;
  currentY: number;
  triggered: boolean;
  telegraphTimer: number;
  deployed: boolean;
  deployProgress: number; // 0 to 1 for pop-up spikes / laser charge
  settled: boolean;
  moveDir: 1 | -1;
  angle: number;
  cycleTimer: number;
  laserActive: boolean;
  laserTelegraph: boolean;
}

export interface DecorationDef {
  x: number;
  y: number;
  size: number;
  kind: 'diamond' | 'ring' | 'chevron' | 'pillar';
  phase: number;
}

export interface PortalDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelDef {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  mode: GameMode;
  width: number;
  height: number;
  deathY: number;
  spawn: { x: number; y: number };
  portal: PortalDef;
  theme: LevelTheme;
  platforms: PlatformDef[];
  hazards: HazardDef[];
  decorations: DecorationDef[];
}

export interface PlayerState {
  mode: GameMode;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
  onPlatformId: string | null;
  coyoteTimer: number;
  jumpBufferTimer: number;
  facing: 1 | -1;
  lookX: number;
  lookY: number;
  scaleX: number;
  scaleY: number;
  trailTimer: number;
  alive: boolean;
  /** Phase 2 rocket compatibility fields */
  thrusting?: boolean;
  pitchAngle?: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  jumpJustReleased: boolean;
}

export interface LevelRuntime {
  level: LevelDef;
  player: PlayerState;
  platforms: PlatformRuntime[];
  hazards: HazardRuntime[];
  elapsed: number;
  hitstopTimer: number;
  deathTimer: number;
  deathCause: string;
  cameraX: number;
  trauma: number;
  trailSpawnAccumulator: number;
  won: boolean;
}

export interface SimulationEvent {
  type: 'jump' | 'land' | 'trap_telegraph' | 'trap_activate' | 'death' | 'victory';
  x: number;
  y: number;
  cause?: string;
}

export interface GameProgress {
  unlockedLevel: number;
  totalDeaths: number;
  levelDeaths: Record<number, number>;
  bestTimes: Record<number, number>;
  completedLevels: number[];
}

export interface GameSettings {
  masterVolume: number; // 0..1
  muted: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  autoRetry: boolean;
}

export interface HudSnapshot {
  status: GameStatus;
  mode: GameMode;
  levelId: number;
  levelName: string;
  levelSubtitle: string;
  themeId: ThemeId;
  deathsInLevel: number;
  totalDeaths: number;
  runTime: number;
  progressPct: number;
  deathCause: string;
  unlockedLevel: number;
  bestTime: number | null;
}
