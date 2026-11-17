import React from 'react';
import type { TouchControl } from '../game/engine';
import type { GameSettings, HudSnapshot, ThemeId } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  settings: GameSettings;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
  onTouchInput: (control: TouchControl, pressed: boolean) => void;
}

const HUD_THEMES: Record<
  ThemeId,
  { text: string; border: string; bar: string }
> = {
  'blue-mauve': {
    text: 'text-cyan-300',
    border: 'border-cyan-400/40',
    bar: 'bg-[#00E5FF]',
  },
  'neon-green': {
    text: 'text-emerald-300',
    border: 'border-emerald-400/40',
    bar: 'bg-[#22FF66]',
  },
  'cyan-rocket': {
    text: 'text-sky-300',
    border: 'border-sky-400/45',
    bar: 'bg-[#00E5FF]',
  },
  'red-rocket': {
    text: 'text-orange-300',
    border: 'border-red-400/45',
    bar: 'bg-[#FF453A]',
  },
  'gold-black': {
    text: 'text-amber-300',
    border: 'border-amber-400/45',
    bar: 'bg-[#FFD147]',
  },
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  settings,
  onToggleMute,
  onRestart,
  onPause,
  onTouchInput,
}) => {
  const accent = HUD_THEMES[hud.themeId] ?? HUD_THEMES['blue-mauve'];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Row: <= 2 compact corner clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Level, Mode, Deaths, Progress */}
        <div
          className={`px-3.5 py-2 rounded-lg bg-[#050A18]/85 border ${accent.border} shadow-[0_4px_20px_rgba(0,0,0,0.45)]`}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
            <span className={`font-display font-bold ${accent.text}`}>
              Level {hud.levelId} · {hud.levelName}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              {hud.mode === 'rocket' ? 'Rocket' : 'Cube'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-4 font-mono-num text-sm sm:text-base text-white">
            <span data-testid="hud-deaths">
              Deaths <strong className="font-bold">{hud.deathsInLevel}</strong>
            </span>
            <span className="text-slate-400 text-xs sm:text-sm">
              {Math.floor(hud.runTime)}s
            </span>
            <span className="text-slate-300 text-xs sm:text-sm">
              {hud.progressPct}%
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full bg-slate-800/90 rounded-full overflow-hidden">
            <div
              className={`h-full ${accent.bar} origin-left`}
              style={{ transform: `scaleX(${Math.max(0.02, hud.progressPct / 100)})` }}
            />
          </div>
        </div>

        {/* Top-Right: Compact Square SVG Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={settings.muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
            title={settings.muted ? 'Unmute (M)' : 'Mute (M)'}
            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-[#050A18]/85 border ${accent.border} text-slate-200 hover:text-white hover:bg-[#0E1938] transition-colors cursor-pointer`}
          >
            {settings.muted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            aria-label="Restart level (R)"
            title="Restart Level (R)"
            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-[#050A18]/85 border ${accent.border} text-slate-200 hover:text-white hover:bg-[#0E1938] transition-colors cursor-pointer`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause game (Escape)"
            title="Pause (Esc)"
            className={`w-10 h-10 flex items-center justify-center rounded-lg bg-[#050A18]/85 border ${accent.border} text-slate-200 hover:text-white hover:bg-[#0E1938] transition-colors cursor-pointer`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Touch Controls (visible below lg breakpoint) */}
      <div
        data-testid="touch-controls"
        className="lg:hidden flex items-end justify-between pb-2 px-1 pointer-events-none"
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            aria-label="Move Left"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('left', true);
            }}
            onPointerUp={() => onTouchInput('left', false)}
            onPointerCancel={() => onTouchInput('left', false)}
            onPointerLeave={() => onTouchInput('left', false)}
            className={`w-14 h-14 rounded-xl bg-[#071026]/85 border ${accent.border} text-white flex items-center justify-center active:scale-95 transition-transform touch-none`}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Move Right"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('right', true);
            }}
            onPointerUp={() => onTouchInput('right', false)}
            onPointerCancel={() => onTouchInput('right', false)}
            onPointerLeave={() => onTouchInput('right', false)}
            className={`w-14 h-14 rounded-xl bg-[#071026]/85 border ${accent.border} text-white flex items-center justify-center active:scale-95 transition-transform touch-none`}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {hud.mode === 'rocket' ? (
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              type="button"
              aria-label="Dive Down"
              onPointerDown={(e) => {
                e.preventDefault();
                onTouchInput('down', true);
              }}
              onPointerUp={() => onTouchInput('down', false)}
              onPointerCancel={() => onTouchInput('down', false)}
              onPointerLeave={() => onTouchInput('down', false)}
              className={`w-14 h-14 rounded-xl bg-[#071026]/85 border ${accent.border} text-white font-display font-bold text-[11px] tracking-wider flex flex-col items-center justify-center active:scale-95 transition-transform touch-none`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span>DIVE</span>
            </button>

            <button
              type="button"
              aria-label="Thrust Up"
              onPointerDown={(e) => {
                e.preventDefault();
                onTouchInput('up', true);
              }}
              onPointerUp={() => onTouchInput('up', false)}
              onPointerCancel={() => onTouchInput('up', false)}
              onPointerLeave={() => onTouchInput('up', false)}
              className={`w-16 h-16 rounded-xl bg-[#071026]/85 border-2 ${accent.border} text-white font-display font-bold text-[11px] tracking-wider flex flex-col items-center justify-center active:scale-95 transition-transform touch-none`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span>THRUST</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Jump"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInput('jump', true);
            }}
            onPointerUp={() => onTouchInput('jump', false)}
            onPointerCancel={() => onTouchInput('jump', false)}
            onPointerLeave={() => onTouchInput('jump', false)}
            className={`pointer-events-auto w-16 h-16 rounded-xl bg-[#071026]/85 border-2 ${accent.border} text-white font-display font-bold text-xs tracking-wider flex items-center justify-center active:scale-95 transition-transform touch-none`}
          >
            JUMP
          </button>
        )}
      </div>
    </div>
  );
};
