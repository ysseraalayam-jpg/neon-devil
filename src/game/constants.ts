export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.05;

export const PLAYER_SIZE = 28;
export const ROCKET_WIDTH = 34;
export const ROCKET_HEIGHT = 22;

export const CUBE_PHYSICS = {
  gravity: 2100,
  terminalVelocity: 980,
  maxSpeed: 360,
  groundAccel: 2900,
  groundDecel: 3200,
  airAccel: 2150,
  airDecel: 1350,
  jumpVelocity: -720,
  jumpCutMultiplier: 0.45,
  coyoteTime: 0.105,
  jumpBufferTime: 0.12,
} as const;

export const ROCKET_PHYSICS = {
  gravity: 420,
  thrustAccel: 1320,
  diveAccel: 860,
  verticalDamping: 2.6,
  maxUpSpeed: -390,
  maxDownSpeed: 430,
  horizontalAccel: 1950,
  horizontalDrag: 1300,
  maxHorizontalSpeed: 375,
} as const;

export const DEATH_ANIM_DURATION = 0.46;
export const AUTO_RETRY_DELAY = 0.65;
export const TOTAL_LEVELS = 5;

export const STORAGE_KEYS = {
  progress: 'neon_devil_progress_v1',
  settings: 'neon_devil_settings_v1',
} as const;
