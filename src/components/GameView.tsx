import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameMode, MapId, CharacterId, ChallengeId, UpgradeCard } from '../types/game';
import { GameEngine } from '../engine/gameEngine';
import { VirtualJoystick } from './VirtualJoystick';
import { GameHUD } from './GameHUD';
import { LevelUpModal } from './LevelUpModal';
import { RewardChestModal } from './RewardChestModal';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';
import { saveManager } from '../systems/saveSystem';
import { Sparkles } from 'lucide-react';

interface GameViewProps {
  mode: GameMode;
  mapId: MapId;
  characterId: CharacterId;
  challengeId?: ChallengeId;
  onExitToMenu: () => void;
  onOpenArmory: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  mode,
  mapId,
  characterId,
  challengeId,
  onExitToMenu,
  onOpenArmory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD State (synced from engine)
  const [hud, setHud] = useState({
    health: 100,
    maxHealth: 100,
    level: 1,
    currentXp: 0,
    requiredXp: 15,
    timer: 0,
    kills: 0,
    coinsCollected: 0,
    dashCooldownPct: 0,
    abilityCooldownPct: 0,
    abilityReady: true,
    bossActive: false,
    bossHealthPct: 1,
    bossName: '',
    equippedWeapons: [] as string[],
    isVictory: false,
  });

  // Modals
  const [levelUpCards, setLevelUpCards] = useState<UpgradeCard[] | null>(null);
  const [chestReward, setChestReward] = useState<{ coins: number; upgrades: UpgradeCard[] } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverStats, setGameOverStats] = useState<any | null>(null);
  const [isVictory, setIsVictory] = useState(false);

  // Evolution Toast Announcement
  const [evolutionBanner, setEvolutionBanner] = useState<{ weapon: string; evo: string } | null>(null);

  // Initialize and run engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI resolution
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const engine = new GameEngine(canvas, {
      onLevelUp: (cards) => {
        setLevelUpCards(cards);
      },
      onEvolutionUnlocked: (weapon, evo) => {
        setEvolutionBanner({ weapon, evo });
        setTimeout(() => setEvolutionBanner(null), 4000);
      },
      onBossChest: (coins, upgrades) => {
        setChestReward({ coins, upgrades });
      },
      onGameOver: (victory, stats) => {
        if (victory) {
          setIsVictory(true);
        }
        setGameOverStats(stats);
      },
      onBossSpawn: () => {},
      onBossDefeated: () => {},
      onHUDUpdate: (newHud) => {
        setHud(newHud);
      },
    });

    engine.initSession(mode, mapId, characterId, challengeId);
    engine.start();
    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.destroy();
      engineRef.current = null;
    };
  }, [mode, mapId, characterId, challengeId]);

  // Handle Joystick Input
  const handleJoystickMove = useCallback((input: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.moveInput = input;
    }
  }, []);

  // Handle Actions
  const handleDash = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDash();
    }
  }, []);

  const handleAbility = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerActiveAbility();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current && !levelUpCards && !chestReward && !gameOverStats) {
      engineRef.current.pause();
      setIsPaused(true);
    }
  }, [levelUpCards, chestReward, gameOverStats]);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const handleRestart = useCallback(() => {
    setIsPaused(false);
    setGameOverStats(null);
    setIsVictory(false);
    setLevelUpCards(null);
    setChestReward(null);
    if (engineRef.current) {
      engineRef.current.initSession(mode, mapId, characterId, challengeId);
      engineRef.current.resume();
    }
  }, [mode, mapId, characterId, challengeId]);

  const handleSelectUpgrade = useCallback((card: UpgradeCard) => {
    setLevelUpCards(null);
    if (engineRef.current) {
      engineRef.current.applyUpgrade(card);
    }
  }, []);

  const handleChestUpgrade = useCallback((card: UpgradeCard) => {
    setChestReward(null);
    if (engineRef.current) {
      engineRef.current.applyUpgrade(card);
    }
  }, []);

  const handleClaimChestCoins = useCallback(() => {
    setChestReward(null);
    if (engineRef.current) {
      engineRef.current.resume();
    }
  }, []);

  const settings = saveManager.getData().settings;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      {/* 60 FPS HTML5 Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
      />

      {/* Virtual Touch Joystick for Mobile (Left Bottom) */}
      <VirtualJoystick
        onMove={handleJoystickMove}
        sensitivity={settings.joystickSensitivity}
        isFloating={settings.floatingJoystick}
      />

      {/* Tactical Combat HUD */}
      <GameHUD
        health={hud.health}
        maxHealth={hud.maxHealth}
        level={hud.level}
        currentXp={hud.currentXp}
        requiredXp={hud.requiredXp}
        timer={hud.timer}
        kills={hud.kills}
        coinsCollected={hud.coinsCollected}
        dashCooldownPct={hud.dashCooldownPct}
        abilityCooldownPct={hud.abilityCooldownPct}
        abilityReady={hud.abilityReady}
        bossActive={hud.bossActive}
        bossHealthPct={hud.bossHealthPct}
        bossName={hud.bossName}
        equippedWeapons={hud.equippedWeapons}
        onDash={handleDash}
        onAbility={handleAbility}
        onPause={handlePause}
      />

      {/* Evolution Celebration Banner */}
      {evolutionBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-yellow-300 px-6 py-2.5 rounded-xl shadow-[0_0_35px_rgba(245,158,11,0.8)] text-black font-black uppercase tracking-wider font-heading flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-white animate-spin" />
          <span>EVOLUTION UNLOCKED: {evolutionBanner.evo}!</span>
        </div>
      )}

      {/* Level Up Draft Modal */}
      {levelUpCards && (
        <LevelUpModal
          cards={levelUpCards}
          onSelect={handleSelectUpgrade}
        />
      )}

      {/* Boss Supply Chest Modal */}
      {chestReward && (
        <RewardChestModal
          coins={chestReward.coins}
          upgrades={chestReward.upgrades}
          onSelectUpgrade={handleChestUpgrade}
          onClaimCoinsOnly={handleClaimChestCoins}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExit={onExitToMenu}
        />
      )}

      {/* Game Over Modal */}
      {gameOverStats && !isVictory && (
        <GameOverModal
          stats={gameOverStats}
          onRetry={handleRestart}
          onOpenArmory={onOpenArmory}
          onMainMenu={onExitToMenu}
        />
      )}

      {/* Victory Modal */}
      {gameOverStats && isVictory && (
        <VictoryModal
          stats={gameOverStats}
          onPlayAgain={handleRestart}
          onOpenArmory={onOpenArmory}
          onMainMenu={onExitToMenu}
        />
      )}
    </div>
  );
};
