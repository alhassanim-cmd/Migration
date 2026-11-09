import React from 'react';
import { Skull, Clock, Coins, Trophy, RotateCcw, Wrench, Home } from 'lucide-react';
import { saveManager } from '../systems/saveSystem';

interface GameOverModalProps {
  stats: {
    time: number;
    kills: number;
    bosses: number;
    coins: number;
    damage: number;
    level: number;
  };
  onRetry: () => void;
  onOpenArmory: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onOpenArmory,
  onMainMenu,
}) => {
  const mins = Math.floor(stats.time / 60);
  const secs = stats.time % 60;
  const timeFormatted = `${mins}m ${secs}s`;

  const bestTime = saveManager.getData().highScores.survivalBestTime;
  const bestMins = Math.floor(bestTime / 60);
  const bestSecs = bestTime % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-zinc-950 border border-red-900/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-center">
        {/* Header */}
        <div>
          <div className="inline-block bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase px-3 py-1 rounded-sm tracking-widest font-heading mb-2">
            Vital Signs Flatlined
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider font-heading">
            Survivor Defeated
          </h2>
          <p className="text-xs text-zinc-400 mt-1">The horde overwhelmed your defenses</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div className="flex flex-col items-center p-2 rounded-lg bg-black/40">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Time Survived</span>
            <span className="text-base font-bold text-white font-mono">{timeFormatted}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-lg bg-black/40">
            <Skull className="w-4 h-4 text-rose-500 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Zombies Slain</span>
            <span className="text-base font-bold text-white font-mono">{stats.kills}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-lg bg-black/40">
            <Trophy className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Bosses Killed</span>
            <span className="text-base font-bold text-white font-mono">{stats.bosses}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-lg bg-black/40">
            <Coins className="w-4 h-4 text-yellow-400 mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Gold Secured</span>
            <span className="text-base font-bold text-yellow-400 font-mono">+{stats.coins}</span>
          </div>
        </div>

        {/* Best Record */}
        <div className="text-xs text-zinc-400 font-mono">
          Personal Best Survival: <span className="text-amber-400 font-bold">{bestMins}m {bestSecs}s</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm uppercase tracking-wider font-heading shadow-lg shadow-red-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Redeploy (Try Again)</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/20 to-yellow-600/20 hover:bg-amber-600/30 text-yellow-400 border border-amber-500/40 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Upgrade Stats in The Armory</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
