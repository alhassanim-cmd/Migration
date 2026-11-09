import React, { useEffect, useRef } from 'react';
import { GameMode, MapId, CharacterId, ChallengeId } from '../types/game';
import { CHARACTERS } from '../systems/characterData';
import { MAP_CONFIGS } from '../systems/mapData';
import { CHALLENGES } from '../systems/challengeData';
import { saveManager } from '../systems/saveSystem';
import { soundManager } from '../audio/soundManager';
import { Play, Wrench, Users, Layers, Trophy, Settings, Coins, ShieldAlert, Crosshair } from 'lucide-react';

interface MainMenuProps {
  mode: GameMode;
  mapId: MapId;
  characterId: CharacterId;
  challengeId?: ChallengeId;
  onDeploy: () => void;
  onOpenModes: () => void;
  onOpenArmory: () => void;
  onOpenCharacters: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  mode,
  mapId,
  characterId,
  challengeId,
  onDeploy,
  onOpenModes,
  onOpenArmory,
  onOpenCharacters,
  onOpenMissions,
  onOpenSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coins = saveManager.getData().coins;
  const char = CHARACTERS[characterId];
  const map = MAP_CONFIGS[mapId];

  // Background animated embers canvas
  useEffect(() => {
    soundManager.startMusic('menu');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vy: number; vx: number; size: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 20,
        vy: -20 - Math.random() * 40,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }

    let lastT = performance.now();
    const render = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark radial atmosphere
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0, '#10121d');
      grad.addColorStop(1, '#050609');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render floating fiery embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha * 0.7})`;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleStart = () => {
    soundManager.playEvolution();
    onDeploy();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-4 sm:p-8 overflow-hidden select-none">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 -z-10 pointer-events-none" />

      {/* Subtle CRT Scanline overlay */}
      <div className="absolute inset-0 scanlines -z-5 pointer-events-none opacity-40" />

      {/* Top Status Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-zinc-800 px-3.5 py-1.5 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">ONLINE // SYSTEM READY</span>
        </div>

        {/* Currency Pill */}
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 rounded-full backdrop-blur-md">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-mono font-bold text-sm text-yellow-400">{coins}</span>
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Gold</span>
        </div>
      </div>

      {/* Center Hero Branding */}
      <div className="flex flex-col items-center text-center my-auto z-10 animate-fade-in max-w-xl">
        {/* Warning Hazard Ribbon */}
        <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-600/40 px-3.5 py-1 rounded-sm mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-red-400 font-heading">
            Biohazard Quarantine Protocol Active
          </span>
        </div>

        {/* Logo Title */}
        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter font-heading text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          DEAD<span className="text-red-500">ZONE</span>
        </h1>
        <div className="text-xl sm:text-2xl font-black uppercase tracking-[0.3em] font-heading text-amber-400 mt-1 drop-shadow-md">
          Last Stand
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-zinc-400 mt-3">
          Survive the Night. Defy the Dead.
        </p>

        {/* Deployment Summary Badge */}
        <div className="flex items-center gap-2 sm:gap-4 mt-6 bg-black/60 border border-zinc-800/80 px-4 py-2 rounded-xl backdrop-blur-md text-xs">
          <div>
            <span className="text-zinc-500 text-[10px] font-bold block uppercase">Operative</span>
            <span className="font-bold text-white">{char.name}</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <span className="text-zinc-500 text-[10px] font-bold block uppercase">Protocol</span>
            <span className="font-bold text-amber-400 uppercase">{challengeId ? CHALLENGES[challengeId].name : mode}</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <span className="text-zinc-500 text-[10px] font-bold block uppercase">Zone</span>
            <span className="font-bold text-sky-400">{map.name}</span>
          </div>
        </div>

        {/* Big DEPLOY Button */}
        <button
          onClick={handleStart}
          className="mt-6 group relative px-10 py-4 sm:px-14 sm:py-4.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-lg sm:text-xl uppercase tracking-widest font-heading shadow-[0_0_35px_rgba(239,68,68,0.4)] hover:shadow-[0_0_45px_rgba(239,68,68,0.7)] transition-all active:scale-95 cursor-pointer flex items-center gap-3 border border-red-400/40"
        >
          <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
          <span>DEPLOY MISSION</span>
        </button>
      </div>

      {/* Bottom Menu Navigation Bar */}
      <div className="w-full max-w-3xl grid grid-cols-5 gap-2 sm:gap-3 z-10 pt-4">
        {/* Modes */}
        <button
          onClick={() => { soundManager.playClick(); onOpenModes(); }}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold font-heading uppercase tracking-wider">Modes</span>
        </button>

        {/* Armory */}
        <button
          onClick={() => { soundManager.playClick(); onOpenArmory(); }}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md relative"
        >
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold font-heading uppercase tracking-wider">Armory</span>
          {coins >= 100 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Survivors */}
        <button
          onClick={() => { soundManager.playClick(); onOpenCharacters(); }}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold font-heading uppercase tracking-wider">Survivors</span>
        </button>

        {/* Bounties & Records */}
        <button
          onClick={() => { soundManager.playClick(); onOpenMissions(); }}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold font-heading uppercase tracking-wider">Bounties</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => { soundManager.playClick(); onOpenSettings(); }}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 mb-1" />
          <span className="text-[10px] sm:text-xs font-bold font-heading uppercase tracking-wider">Settings</span>
        </button>
      </div>

      {/* Tactical Desktop Controls Hint */}
      <div className="text-[11px] text-zinc-500 font-mono text-center pt-2 hidden sm:block">
        Controls: [WASD / Thumbstick] Move • [SPACE] Dash • [E] Shockwave Ability • Auto-Aims Nearest Zombie
      </div>
    </div>
  );
};
