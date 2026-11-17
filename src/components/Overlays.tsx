import React from 'react';
import { TOTAL_LEVELS } from '../game/constants';
import { LEVELS } from '../game/levels';
import type { GameProgress, GameSettings, HudSnapshot, ThemeId } from '../game/types';

const MODAL_THEME_STYLES: Record<
  ThemeId,
  { card: string; label: string; button: string }
> = {
  'blue-mauve': {
    card: 'bg-[#0B1738] border-cyan-400/50 hover:border-cyan-300',
    label: 'text-cyan-300',
    button: 'bg-[#00E5FF] hover:bg-[#5CF0FF] text-slate-950',
  },
  'neon-green': {
    card: 'bg-[#071B0E] border-emerald-400/50 hover:border-emerald-300',
    label: 'text-emerald-300',
    button: 'bg-[#22FF66] hover:bg-[#5CFF90] text-slate-950',
  },
  'cyan-rocket': {
    card: 'bg-[#061830] border-sky-400/55 hover:border-sky-300',
    label: 'text-sky-300',
    button: 'bg-[#00E5FF] hover:bg-[#66F2FF] text-slate-950',
  },
  'red-rocket': {
    card: 'bg-[#22070B] border-red-400/55 hover:border-orange-300',
    label: 'text-orange-300',
    button: 'bg-[#FF453A] hover:bg-[#FF6961] text-white',
  },
  'gold-black': {
    card: 'bg-[#171104] border-amber-400/55 hover:border-amber-300',
    label: 'text-amber-300',
    button: 'bg-[#FFD147] hover:bg-[#FFE07D] text-slate-950',
  },
};

interface LevelSelectModalProps {
  progress: GameProgress;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-select-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#030612]/80"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#091128] border border-cyan-400/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="level-select-title" className="font-display text-2xl font-bold text-white">
              Select Level
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Complete each chamber to unlock the next. Progress is saved automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level select"
            className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 flex items-center justify-center cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.id <= progress.unlockedLevel;
            const completed = progress.completedLevels.includes(lvl.id);
            const best = progress.bestTimes[lvl.id];
            const deaths = progress.levelDeaths[lvl.id] ?? 0;
            const themeStyle = MODAL_THEME_STYLES[lvl.theme.id];

            return (
              <button
                key={lvl.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectLevel(lvl.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  unlocked
                    ? `${themeStyle.card} cursor-pointer`
                    : 'bg-slate-900/60 border-slate-800 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-display text-xs font-bold tracking-wider uppercase ${
                      unlocked ? themeStyle.label : 'text-slate-500'
                    }`}
                  >
                    Level {lvl.code} · {lvl.mode === 'rocket' ? 'Rocket' : 'Cube'}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {!unlocked ? 'Locked' : completed ? 'Cleared' : 'Unlocked'}
                  </span>
                </div>

                <div className="mt-2 font-display text-xl font-bold text-white">
                  {lvl.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{lvl.subtitle}</div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono-num text-slate-300">
                  <span>Best: {best !== undefined ? `${best.toFixed(2)}s` : '—'}</span>
                  <span>Deaths: {deaths}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#030612]/80"
    >
      <div className="w-full max-w-md rounded-xl bg-[#091128] border border-fuchsia-400/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between mb-5">
          <h2 id="settings-title" className="font-display text-2xl font-bold text-white">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <label htmlFor="master-volume" className="font-medium text-slate-200">
                Master Volume
              </label>
              <span className="font-mono-num text-cyan-300">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              id="master-volume"
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.masterVolume * 100)}
              onChange={(e) => onUpdate({ masterVolume: Number(e.target.value) / 100 })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <div>
              <div className="text-sm font-medium text-slate-200">Mute All Audio</div>
              <div className="text-xs text-slate-400">Keyboard shortcut: M</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.muted}
              aria-label="Mute All Audio"
              onClick={() => onUpdate({ muted: !settings.muted })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                settings.muted
                  ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-200'
                  : 'bg-slate-800 border-slate-600 text-slate-200'
              }`}
            >
              {settings.muted ? 'Muted' : 'Active'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <div>
              <div className="text-sm font-medium text-slate-200">Arcade Music</div>
              <div className="text-xs text-slate-400">Procedural synth soundtrack</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.musicEnabled}
              aria-label="Arcade Music"
              onClick={() => onUpdate({ musicEnabled: !settings.musicEnabled })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-800 border-slate-600 text-slate-400'
              }`}
            >
              {settings.musicEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <div>
              <div className="text-sm font-medium text-slate-200">Sound Effects</div>
              <div className="text-xs text-slate-400">Jump, trap, death & portal chimes</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.sfxEnabled}
              aria-label="Sound Effects"
              onClick={() => onUpdate({ sfxEnabled: !settings.sfxEnabled })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                settings.sfxEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-800 border-slate-600 text-slate-400'
              }`}
            >
              {settings.sfxEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <div>
              <div className="text-sm font-medium text-slate-200">Auto-Retry on Death</div>
              <div className="text-xs text-slate-400">Restart level automatically after 0.65s</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoRetry}
              aria-label="Auto-Retry on Death"
              onClick={() => onUpdate({ autoRetry: !settings.autoRetry })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                settings.autoRetry
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-800 border-slate-600 text-slate-400'
              }`}
            >
              {settings.autoRetry ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  const accent = MODAL_THEME_STYLES[hud.themeId] ?? MODAL_THEME_STYLES['blue-mauve'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#030612]/78"
    >
      <div className="w-full max-w-sm rounded-xl bg-[#091128] border border-cyan-400/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <div className={`text-xs uppercase tracking-wider font-semibold ${accent.label}`}>
          Level {hud.levelId} · {hud.levelName}
        </div>
        <h2 id="pause-title" className="font-display text-3xl font-bold text-white mt-1">
          Paused
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-white/10 font-mono-num text-sm">
          <div>
            <div className="text-xs text-slate-400">Progress</div>
            <div className="text-white font-bold mt-0.5">{hud.progressPct}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Deaths</div>
            <div className="text-white font-bold mt-0.5">{hud.deathsInLevel}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className={`w-full py-3 rounded-lg font-display font-bold text-base cursor-pointer ${accent.button}`}
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 rounded-lg bg-[#101C40] hover:bg-[#182857] border border-cyan-400/30 text-white font-semibold text-sm cursor-pointer"
          >
            Restart Level
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 rounded-lg bg-[#101C40] hover:bg-[#182857] border border-slate-700 text-slate-200 font-semibold text-sm cursor-pointer"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-lg bg-transparent hover:bg-white/5 border border-slate-700/80 text-slate-300 font-medium text-sm cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeathModalProps {
  hud: HudSnapshot;
  onRetry: () => void;
  onOpenLevels: () => void;
  onMainMenu: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  hud,
  onRetry,
  onOpenLevels,
  onMainMenu,
}) => {
  const isRocket = hud.mode === 'rocket';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="death-title"
      data-testid="death-screen"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080312]/78"
    >
      <div className="w-full max-w-sm rounded-xl bg-[#120922] border border-fuchsia-400/45 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
        <div className="text-xs uppercase tracking-wider text-fuchsia-300 font-semibold">
          No Checkpoints · Full Level Reset
        </div>
        <h2 id="death-title" className="font-display text-3xl font-bold text-white mt-1">
          {isRocket ? 'Rocket Destroyed' : 'Cube Shattered'}
        </h2>
        <p className="text-sm text-slate-300 mt-1">{hud.deathCause}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-white/10 font-mono-num text-sm">
          <div>
            <div className="text-xs text-slate-400">Progress Reached</div>
            <div className="text-white font-bold mt-0.5">{hud.progressPct}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Level Deaths</div>
            <div className="text-fuchsia-300 font-bold mt-0.5">{hud.deathsInLevel}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRetry}
            className="w-full py-3 rounded-lg bg-[#E879F9] hover:bg-[#F0ABFC] text-slate-950 font-display font-bold text-base cursor-pointer"
          >
            Try Again (Space / R)
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLevels}
              className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold text-sm cursor-pointer"
            >
              Levels
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-medium text-sm cursor-pointer"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  hud: HudSnapshot;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevels: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  hud,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenLevels,
  onMainMenu,
}) => {
  const themeStyle = MODAL_THEME_STYLES[hud.themeId] ?? MODAL_THEME_STYLES['blue-mauve'];
  const nextLevel = LEVELS.find((l) => l.id === hud.levelId + 1);
  const nextStyle = nextLevel
    ? MODAL_THEME_STYLES[nextLevel.theme.id]
    : MODAL_THEME_STYLES['gold-black'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      data-testid="victory-screen"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#030714]/80"
    >
      <div
        className={`w-full max-w-md rounded-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] border ${themeStyle.card}`}
      >
        <div className={`text-xs uppercase tracking-wider font-semibold ${themeStyle.label}`}>
          Level {hud.levelId} Complete
        </div>
        <h2 id="victory-title" className="font-display text-3xl font-bold text-white mt-1">
          {hud.levelName} Cleared
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          {hasNextLevel && nextLevel
            ? `Level ${nextLevel.id} (${nextLevel.name} · ${nextLevel.mode === 'rocket' ? 'Rocket Mode' : 'Cube Mode'}) is now unlocked.`
            : `All ${TOTAL_LEVELS} Chambers Conquered — Golden Trial mastered.`}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 py-3 border-y border-white/10 font-mono-num text-sm">
          <div>
            <div className="text-xs text-slate-400">Clear Time</div>
            <div className="text-white font-bold mt-0.5">{hud.runTime.toFixed(2)}s</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Best Time</div>
            <div className="text-white font-bold mt-0.5">
              {hud.bestTime !== null ? `${hud.bestTime.toFixed(2)}s` : `${hud.runTime.toFixed(2)}s`}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Deaths</div>
            <div className="text-white font-bold mt-0.5">{hud.deathsInLevel}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {hasNextLevel && nextLevel ? (
            <button
              type="button"
              data-start="true"
              onClick={onNextLevel}
              className={`w-full py-3 rounded-lg font-display font-bold text-base cursor-pointer ${nextStyle.button}`}
            >
              Next Level: {nextLevel.name}
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onReplay}
              className={`w-full py-3 rounded-lg font-display font-bold text-base cursor-pointer ${themeStyle.button}`}
            >
              Replay Level {hud.levelId}
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Replay
            </button>
            <button
              type="button"
              onClick={onOpenLevels}
              className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Levels
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-medium text-xs sm:text-sm cursor-pointer"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
