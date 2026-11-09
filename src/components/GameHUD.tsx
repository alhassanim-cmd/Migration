import React from 'react';
import { Skull, Coins, Pause, Zap, Shield, Heart } from 'lucide-react';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  level: number;
  currentXp: number;
  requiredXp: number;
  timer: number;
  kills: number;
  coinsCollected: number;
  dashCooldownPct: number;
  abilityCooldownPct: number;
  abilityReady: boolean;
  bossActive: boolean;
  bossHealthPct: number;
  bossName: string;
  equippedWeapons: string[];
  onDash: () => void;
  onAbility: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  maxHealth,
  level,
  currentXp,
  requiredXp,
  timer,
  kills,
  coinsCollected,
  dashCooldownPct,
  abilityCooldownPct,
  abilityReady,
  bossActive,
  bossHealthPct,
  bossName,
  equippedWeapons,
  onDash,
  onAbility,
  onPause,
}) => {
  const hpPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const xpPct = Math.max(0, Math.min(100, (currentXp / requiredXp) * 100));
  const isLowHealth = hpPct <= 25;

  // Format timer MM:SS
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4 z-10">
      {/* Top Section */}
      <div className="flex flex-col gap-2 w-full">
        {/* Top XP Bar */}
        <div className="w-full flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-sm shadow-md font-heading tracking-wider flex items-center gap-1">
            <span>LV</span>
            <span className="text-sm font-black">{level}</span>
          </div>
          <div className="flex-1 h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-cyan-500/30 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400 rounded-full transition-all duration-200"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-md border backdrop-blur-md ${isLowHealth ? 'border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-zinc-800'}`}>
              <Heart className={`w-4 h-4 ${isLowHealth ? 'text-red-500 fill-red-500' : 'text-emerald-400'}`} />
              <div className="w-28 sm:w-36 h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/50">
                <div
                  className={`h-full transition-all duration-150 ${isLowHealth ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-green-400'}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-zinc-300 font-mono min-w-10 text-right">
                {Math.round(health)}
              </span>
            </div>
          </div>

          {/* Center Timer & Counters */}
          <div className="flex items-center gap-3 bg-black/75 px-4 py-1.5 rounded-md border border-zinc-800/80 backdrop-blur-md">
            {/* Timer */}
            <div className="font-mono text-base sm:text-lg font-bold tracking-wider text-amber-400">
              {timeFormatted}
            </div>

            <div className="w-px h-4 bg-zinc-700" />

            {/* Kills */}
            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-400">
              <Skull className="w-3.5 h-3.5" />
              <span>{kills}</span>
            </div>

            <div className="w-px h-4 bg-zinc-700" />

            {/* Coins */}
            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-yellow-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{coinsCollected}</span>
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto bg-black/70 hover:bg-zinc-800 text-zinc-200 p-2 rounded-md border border-zinc-700/80 backdrop-blur-md active:scale-95 transition-transform"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Boss Health Bar Display */}
        {bossActive && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-1 animate-fade-in">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-red-400 font-heading">
                {bossName || 'APEX HORDE LEADER'}
              </span>
            </div>
            <div className="w-full h-3.5 bg-black/80 rounded-full border-2 border-red-500/80 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150"
                style={{ width: `${bossHealthPct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex items-end justify-between w-full">
        {/* Loadout Badges (Bottom Left, above joystick zone) */}
        <div className="flex flex-col gap-1 pb-24 sm:pb-28">
          <span className="text-[10px] tracking-wider font-bold text-zinc-400 uppercase">Weapons</span>
          <div className="flex gap-1.5 flex-wrap max-w-48">
            {equippedWeapons.map((name, i) => (
              <div
                key={i}
                className="bg-black/75 px-2 py-0.5 rounded text-[11px] font-semibold text-sky-300 border border-sky-500/30 backdrop-blur-sm"
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls (Bottom Right) */}
        <div className="flex items-center gap-3 pb-2 sm:pb-4 pointer-events-auto">
          {/* Active Ability Button (Shockwave) */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onAbility}
              disabled={!abilityReady}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all active:scale-90 ${
                abilityReady
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-70'
              }`}
            >
              <Zap className="w-6 h-6" />
              {/* Radial cooldown mask */}
              {!abilityReady && (
                <div
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center font-mono text-sm text-cyan-400 font-bold"
                >
                  {Math.ceil(abilityCooldownPct * 8)}s
                </div>
              )}
            </button>
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">ABILITY [E]</span>
          </div>

          {/* Dash Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onDash}
              disabled={dashCooldownPct > 0}
              className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-all active:scale-90 ${
                dashCooldownPct === 0
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-2 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.6)] cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-70'
              }`}
            >
              <Shield className="w-7 h-7" />
              {/* Radial cooldown mask */}
              {dashCooldownPct > 0 && (
                <div
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center font-mono text-sm text-amber-400 font-bold"
                >
                  {Math.ceil(dashCooldownPct * 3.2)}s
                </div>
              )}
            </button>
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">DASH [SPACE]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
