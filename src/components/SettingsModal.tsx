import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { saveManager } from '../systems/saveSystem';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Volume2, Gamepad2, Eye, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(() => saveManager.getData().settings);

  const update = (partial: Partial<GameSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveManager.updateSettings(partial);

    if (partial.masterVolume !== undefined || partial.musicVolume !== undefined || partial.sfxVolume !== undefined) {
      soundManager.setVolumes(
        updated.masterVolume,
        updated.musicVolume,
        updated.sfxVolume
      );
    }
  };

  const handleTestSfx = () => {
    soundManager.playPistol();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-xl w-full max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-heading">
                System Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Audio mix, mobile controls, and combat visual effects
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {/* Audio Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-heading">
              <Volume2 className="w-4 h-4" /> Audio Synthesizer Mix
            </h3>

            <div className="flex flex-col gap-3 bg-zinc-900/70 p-4 rounded-xl border border-zinc-800">
              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                  <span>Sound Effects</span>
                  <span className="font-mono text-zinc-400">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxVolume}
                    onChange={(e) => update({ sfxVolume: parseFloat(e.target.value) })}
                    className="flex-1 accent-cyan-500 cursor-pointer"
                  />
                  <button
                    onClick={handleTestSfx}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 rounded cursor-pointer"
                  >
                    Test
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                  <span>Dynamic Music Soundtrack</span>
                  <span className="font-mono text-zinc-400">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => update({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 font-heading">
              <Gamepad2 className="w-4 h-4" /> Touch & Movement Controls
            </h3>

            <div className="flex flex-col gap-3 bg-zinc-900/70 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Dynamic Floating Joystick</div>
                  <div className="text-[11px] text-zinc-400">Joystick spawns wherever your left thumb touches</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.floatingJoystick}
                  onChange={(e) => update({ floatingJoystick: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                  <span>Joystick Sensitivity</span>
                  <span className="font-mono text-zinc-400">{settings.joystickSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.joystickSensitivity}
                  onChange={(e) => update({ joystickSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Visuals Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 font-heading">
              <Eye className="w-4 h-4" /> Visual FX & Performance
            </h3>

            <div className="flex flex-col gap-3 bg-zinc-900/70 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Screen Shake on Impacts</div>
                  <div className="text-[11px] text-zinc-400">Dynamic trauma camera shake during explosions</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.screenShake}
                  onChange={(e) => update({ screenShake: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Floating Damage Numbers</div>
                  <div className="text-[11px] text-zinc-400">Shows damage dealt above enemies</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.damageNumbers}
                  onChange={(e) => update({ damageNumbers: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Atmospheric Night Darkness & Flashlight</div>
                  <div className="text-[11px] text-zinc-400">Dynamic lighting vignette around survivor</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showVignette}
                  onChange={(e) => update({ showVignette: e.target.checked })}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
