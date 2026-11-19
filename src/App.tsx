
import { useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { LandingPage } from './components/LandingPage';
import {
  DeathModal,
  LevelSelectModal,
  PauseModal,
  SettingsModal,
  VictoryModal,
} from './components/Overlays';
import { TitleScreen } from './components/TitleScreen';
import { TOTAL_LEVELS } from './game/constants';
import { NeonDevilEngine } from './game/engine';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from './game/storage';
import type { GameProgress, GameSettings, HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  status: 'title',
  mode: 'cube',
  levelId: 1,
  levelName: 'Blue Mauve',
  levelSubtitle: 'Chamber of Fractured Bridges',
  themeId: 'blue-mauve',
  deathsInLevel: 0,
  totalDeaths: 0,
  runTime: 0,
  progressPct: 0,
  deathCause: '',
  unlockedLevel: 1,
  bestTime: null,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NeonDevilEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const [showLanding, setShowLanding] = useState(true);
  const [showLevels, setShowLevels] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new NeonDevilEngine(canvas, {
      onHudChange: (snapshot) => setHud(snapshot),
      onProgressChange: (nextProgress) => setProgress(nextProgress),
      onSettingsChange: (nextSettings) => setSettings(nextSettings),
    });

    engineRef.current = engine;
    engine.startLoop();

    const params = new URLSearchParams(window.location.search);

    if (params.get('autostart') === '1') {
      const requestedLevel = Number(params.get('level') || '1');
      const targetLevel =
        Number.isFinite(requestedLevel) && requestedLevel >= 1
          ? requestedLevel
          : 1;

      setShowLanding(false);
      engine.startLevel(targetLevel);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (showLevels || showSettings)) {
        setShowLevels(false);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLevels, showSettings]);

  const handleStartPlay = () => {
    setShowLanding(false);
    setShowLevels(false);
    setShowSettings(false);

    const targetLevel = Math.min(progress.unlockedLevel, TOTAL_LEVELS);
    engineRef.current?.startLevel(targetLevel);
    canvasRef.current?.focus();
  };

  const handleSelectLevel = (levelId: number) => {
    setShowLanding(false);
    setShowLevels(false);
    setShowSettings(false);

    engineRef.current?.startLevel(levelId);
    canvasRef.current?.focus();
  };

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#040714]">
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          tabIndex={0}
          className="block w-full h-full outline-none"
        />
      </div>

      {showLanding && (
        <div className="absolute inset-0 z-30">
          <LandingPage onPlay={handleStartPlay} />
        </div>
      )}

      {!showLanding && hud.status === 'title' && (
        <TitleScreen
          progress={progress}
          onPlay={handleStartPlay}
          onOpenLevels={() => setShowLevels(true)}
          onOpenSettings={() => setShowSettings(true)}
          modalOpen={showLevels || showSettings}
        />
      )}

      {(hud.status === 'playing' || hud.status === 'dying') && (
        <GameHud
          hud={hud}
          settings={settings}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onRestart={() => engineRef.current?.restartLevel()}
          onPause={() => engineRef.current?.pause()}
          onTouchInput={(control, pressed) =>
            engineRef.current?.setTouchInput(control, pressed)
          }
        />
      )}

      {hud.status === 'paused' && (
        <PauseModal
          hud={hud}
          onResume={() => {
            setShowSettings(false);
            engineRef.current?.resume();
            canvasRef.current?.focus();
          }}
          onRestart={() => {
            setShowSettings(false);
            engineRef.current?.restartLevel();
            canvasRef.current?.focus();
          }}
          onOpenSettings={() => setShowSettings(true)}
          onMainMenu={() => {
            setShowSettings(false);
            engineRef.current?.goToTitle();
          }}
        />
      )}

      {hud.status === 'dead' && (
        <DeathModal
          hud={hud}
          onRetry={() => {
            engineRef.current?.restartLevel();
            canvasRef.current?.focus();
          }}
          onOpenLevels={() => setShowLevels(true)}
          onMainMenu={() => engineRef.current?.goToTitle()}
        />
      )}

      {hud.status === 'victory' && (
        <VictoryModal
          hud={hud}
          hasNextLevel={hud.levelId < TOTAL_LEVELS}
          onNextLevel={() => {
            engineRef.current?.startLevel(hud.levelId + 1);
            canvasRef.current?.focus();
          }}
          onReplay={() => {
            engineRef.current?.restartLevel();
            canvasRef.current?.focus();
          }}
          onOpenLevels={() => setShowLevels(true)}
          onMainMenu={() => engineRef.current?.goToTitle()}
        />
      )}

      {showLevels && (
        <LevelSelectModal
          progress={progress}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevels(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={(partial) =>
            engineRef.current?.updateSettings(partial)
          }
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

