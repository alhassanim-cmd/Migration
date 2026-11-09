import React from 'react';
import { Trophy, Clock, Skull, Coins, Home, RotateCcw, Wrench } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VictoryModalProps {
  stats: {
    time: number;
    kills: number;
    bosses: number;
    coins: number;
    damage: number;
    level: number;
  };
  onPlayAgain: () => void;
  onOpenArmory: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onPlayAgain,
  onOpenArmory,
  onMainMenu,
}) => {
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const mins = Math.floor(stats.time / 60);
  const secs = stats.time % 60;
  const timeFormatted = `${mins}m ${secs}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-zinc-950 border-2 border-amber-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col gap-6 text-center">
        {/* Header */}
        <div>
          <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black uppercase px-3 py-1 rounded-sm tracking-widest font-heading mb-2 shadow-md">
            Extraction Successful!
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider font-heading">
            Zone Cleansed
          </h2>
          <p className="text-xs text-zinc-300 mt-1">
            You survived the night and eliminated all apex threats!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-4 rounded-xl border border-amber-500/30">
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
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Gold Bounty</span>
            <span className="text-base font-bold text-yellow-400 font-mono">+{stats.coins}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm uppercase tracking-wider font-heading shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Next Run</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-amber-500/40 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Spend Bounty in The Armory</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
