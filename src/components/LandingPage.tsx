
import React from 'react';

interface LandingPageProps {
  onPlay: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPlay }) => {
  return (
    <div className="landing-page relative min-h-screen overflow-y-auto bg-[#040714] text-white">

      <header className="flex items-center justify-between px-6 py-6 sm:px-12 border-b border-cyan-400/10">
        <h2 className="font-display text-2xl font-extrabold tracking-wider text-cyan-300">
          NEON DEVIL
        </h2>
        <span className="text-xs tracking-widest text-slate-400">
          OFFICIAL GAME
        </span>
      </header>

      <main className="min-h-[75vh] flex flex-col items-center justify-center text-center px-5 py-16">

        <div className="mb-6 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-2 text-xs tracking-[0.3em] text-fuchsia-300">
          THE ULTIMATE CHALLENGE
        </div>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-tight">
          <span className="block text-white">NEON</span>
          <span className="block text-cyan-300 [text-shadow:0_0_35px_rgba(0,229,255,0.7)]">
            DEVIL
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base sm:text-lg leading-8 text-slate-400">
          Zero checkpoints. Deadly traps. Impossible precision.
          Do you have what it takes to survive?
        </p>

        <button
          onClick={onPlay}
          className="mt-10 rounded-xl bg-cyan-400 px-12 py-5 font-display text-xl font-black tracking-widest text-slate-950 shadow-[0_0_35px_rgba(0,229,255,0.45)] transition-all hover:scale-105 hover:bg-cyan-300 active:scale-95"
        >
          PLAY NOW →
        </button>

        <p className="mt-5 text-xs tracking-widest text-slate-500">
          5 CHAMBERS · CUBE & ROCKET · NO MERCY
        </p>
      </main>

      <footer className="border-t border-cyan-400/10 px-6 py-7 text-center text-xs text-slate-600">
        © 2026 NEON DEVIL. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
};
