import { STORAGE_KEYS, TOTAL_LEVELS } from './constants';
import type { GameProgress, GameSettings } from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export const DEFAULT_PROGRESS: GameProgress = {
  unlockedLevel: 1,
  totalDeaths: 0,
  levelDeaths: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  bestTimes: {},
  completedLevels: [],
};

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.7,
  muted: false,
  musicEnabled: true,
  sfxEnabled: true,
  autoRetry: false,
};

export function loadProgress(storage: StorageLike | null = getBrowserStorage()): GameProgress {
  if (!storage) return { ...DEFAULT_PROGRESS, levelDeaths: { ...DEFAULT_PROGRESS.levelDeaths }, bestTimes: {}, completedLevels: [] };
  try {
    const raw = storage.getItem(STORAGE_KEYS.progress);
    if (!raw) return { ...DEFAULT_PROGRESS, levelDeaths: { ...DEFAULT_PROGRESS.levelDeaths }, bestTimes: {}, completedLevels: [] };
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    const unlockedLevel = Math.max(
      1,
      Math.min(TOTAL_LEVELS, typeof parsed.unlockedLevel === 'number' ? parsed.unlockedLevel : 1),
    );
    const mergedDeaths: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (typeof parsed.levelDeaths === 'object' && parsed.levelDeaths) {
      for (const [k, v] of Object.entries(parsed.levelDeaths)) {
        if (typeof v === 'number' && v >= 0) mergedDeaths[Number(k)] = v;
      }
    }
    return {
      unlockedLevel,
      totalDeaths: typeof parsed.totalDeaths === 'number' && parsed.totalDeaths >= 0 ? parsed.totalDeaths : 0,
      levelDeaths: mergedDeaths,
      bestTimes: typeof parsed.bestTimes === 'object' && parsed.bestTimes ? { ...parsed.bestTimes } : {},
      completedLevels: Array.isArray(parsed.completedLevels) ? [...parsed.completedLevels] : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS, levelDeaths: { ...DEFAULT_PROGRESS.levelDeaths }, bestTimes: {}, completedLevels: [] };
  }
}

export function saveProgress(progress: GameProgress, storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function recordDeath(progress: GameProgress, levelId: number): GameProgress {
  const nextDeaths = { ...progress.levelDeaths };
  nextDeaths[levelId] = (nextDeaths[levelId] ?? 0) + 1;
  return {
    ...progress,
    totalDeaths: progress.totalDeaths + 1,
    levelDeaths: nextDeaths,
  };
}

export function recordLevelCompletion(
  progress: GameProgress,
  levelId: number,
  clearTime: number,
  maxLevels: number = TOTAL_LEVELS,
): GameProgress {
  const nextUnlocked = Math.min(maxLevels, Math.max(progress.unlockedLevel, levelId + 1));
  const prevBest = progress.bestTimes[levelId];
  const nextBestTimes = { ...progress.bestTimes };
  if (prevBest === undefined || clearTime < prevBest) {
    nextBestTimes[levelId] = Number(clearTime.toFixed(2));
  }
  const completedSet = new Set(progress.completedLevels);
  completedSet.add(levelId);
  return {
    ...progress,
    unlockedLevel: nextUnlocked,
    bestTimes: nextBestTimes,
    completedLevels: Array.from(completedSet).sort((a, b) => a - b),
  };
}

export function loadSettings(storage: StorageLike | null = getBrowserStorage()): GameSettings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      masterVolume:
        typeof parsed.masterVolume === 'number' ? Math.max(0, Math.min(1, parsed.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted,
      musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : DEFAULT_SETTINGS.musicEnabled,
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : DEFAULT_SETTINGS.sfxEnabled,
      autoRetry: typeof parsed.autoRetry === 'boolean' ? parsed.autoRetry : DEFAULT_SETTINGS.autoRetry,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings, storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // Ignore storage errors cleanly
  }
}
