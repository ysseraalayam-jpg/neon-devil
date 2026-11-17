import React, { useEffect } from 'react';
import { TOTAL_LEVELS } from '../game/constants';
import type { GameProgress } from '../game/types';

interface TitleScreenProps {
  progress: GameProgress;
  onPlay: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
  modalOpen: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  onPlay,
  onOpenLevels,
  onOpenSettings,
  modalOpen,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, onPlay]);

  const unlockedDisplay = Math.min(progress.unlockedLevel, TOTAL_LEVELS);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 md:p-14 pointer-events-none">
      {/* Top quiet stats row */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300/85">
        <span className="font-medium tracking-wide text-cyan-300/90">
          5 Precision Chambers · Cube & Rocket
        </span>
        <div className="flex items-center gap-3 font-mono-num text-slate-300">
          <span>Unlocked {unlockedDisplay}/{TOTAL_LEVELS}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Total Deaths {progress.totalDeaths}</span>
        </div>
      </div>

      {/* Main Focal Lockup over calm upper-left/center negative space */}
      <div className="max-w-xl my-auto pointer-events-auto">
        <div className="flex items-center gap-4 mb-5">
          {/* Bespoke NEON DEVIL SVG Emblem */}
          <svg
            viewBox="0 0 72 72"
            className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
            aria-hidden="true"
          >
            <defs>
              <filter id="nd-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Devil horns */}
            <path
              d="M16 24 L10 8 L26 18 M56 24 L62 8 L46 18"
              fill="#2E0A38"
              stroke="#E879F9"
              strokeWidth="2.5"
              strokeLinejoin="round"
              filter="url(#nd-glow)"
            />
            {/* Glowing Electric Blue Cube Body */}
            <rect
              x="14"
              y="18"
              width="44"
              height="44"
              rx="3"
              fill="#07122B"
              stroke="#00E5FF"
              strokeWidth="3"
              filter="url(#nd-glow)"
            />
            <rect
              x="20"
              y="24"
              width="32"
              height="32"
              fill="none"
              stroke="rgba(0,229,255,0.28)"
              strokeWidth="1.2"
            />
            {/* Mauve Glowing Eyes */}
            <rect x="24" y="34" width="7" height="10" fill="#E879F9" filter="url(#nd-glow)" />
            <rect x="41" y="34" width="7" height="10" fill="#E879F9" filter="url(#nd-glow)" />
            <rect x="26" y="36" width="3" height="4" fill="#FDF4FF" />
            <rect x="43" y="36" width="3" height="4" fill="#FDF4FF" />
          </svg>

          <div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none [text-shadow:0_0_26px_rgba(0,212,255,0.38)]">
              NEON DEVIL
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md">
              Zero checkpoints. Unforgiving neon traps. Pure precision platforming & flight.
            </p>
          </div>
        </div>

        {/* <= 3 Menu Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-7">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onPlay();
            }}
            className="px-7 py-3.5 text-base font-display font-bold tracking-wide text-slate-950 bg-[#00E5FF] hover:bg-[#5CF0FF] active:translate-y-0.5 rounded-lg transition-colors shadow-[0_0_24px_rgba(0,229,255,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            Play Level {unlockedDisplay}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLevels();
            }}
            className="px-5 py-3.5 text-sm font-semibold text-slate-100 bg-[#0D1633]/90 hover:bg-[#15224A] border border-cyan-400/35 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            Level Select
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
            className="px-5 py-3.5 text-sm font-semibold text-slate-200 bg-[#0D1633]/90 hover:bg-[#15224A] border border-fuchsia-400/35 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Flat borderless single-line control hint */}
      <div className="text-xs sm:text-sm text-slate-400 tracking-wide">
        A/D or Arrows Move · Space/W/Up Jump or Thrust · S/Down Dive · R Restart · Esc Pause
      </div>
    </div>
  );
};
