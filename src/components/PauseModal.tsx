import React from 'react';
import { Play, RotateCcw, Home, Volume2 } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { saveManager } from '../systems/saveSystem';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExit,
}) => {
  const [sfxVol, setSfxVol] = React.useState(saveManager.getData().settings.sfxVolume);
  const [musicVol, setMusicVol] = React.useState(saveManager.getData().settings.musicVolume);

  const handleSfxChange = (v: number) => {
    setSfxVol(v);
    soundManager.setVolumes(1, musicVol, v);
    saveManager.updateSettings({ sfxVolume: v });
  };

  const handleMusicChange = (v: number) => {
    setMusicVol(v);
    soundManager.setVolumes(1, v, sfxVol);
    saveManager.updateSettings({ musicVolume: v });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-sm w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest font-heading">
            Tactical Pause
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Combat simulation halted</p>
        </div>

        {/* Quick Audio Sliders */}
        <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> Sound Effects
            </span>
            <span className="font-mono text-zinc-400">{Math.round(sfxVol * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVol}
            onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mt-1">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> Music Volume
            </span>
            <span className="font-mono text-zinc-400">{Math.round(musicVol * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVol}
            onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider font-heading shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Mission</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Run</span>
          </button>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-rose-900/40 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Abort to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
