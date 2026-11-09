import React from 'react';
import { CharacterId } from '../types/game';
import { CHARACTERS } from '../systems/characterData';
import { saveManager } from '../systems/saveSystem';
import { ArrowLeft, Lock, Check, Shield, Zap, Heart, Wind } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface CharacterSelectModalProps {
  selectedId: CharacterId;
  onSelect: (id: CharacterId) => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  selectedId,
  onSelect,
  onClose,
}) => {
  const unlocked = saveManager.getData().unlockedCharacters;

  const handlePick = (id: CharacterId) => {
    if (unlocked.includes(id)) {
      soundManager.playClick();
      onSelect(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-4xl w-full h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
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
                Survivor Roster
              </h2>
              <p className="text-xs text-zinc-400">
                Choose your operative and inspect starting weapons and innate perks
              </p>
            </div>
          </div>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => {
            const char = CHARACTERS[id];
            const isUnlocked = unlocked.includes(id);
            const isSelected = selectedId === id;

            return (
              <div
                key={id}
                onClick={() => handlePick(id)}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : isUnlocked
                    ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    : 'bg-zinc-950/60 border-zinc-800/40 opacity-70 cursor-not-allowed'
                }`}
              >
                <div>
                  {/* Top: Avatar & Name */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Stylized Silhouette Avatar */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-md"
                        style={{
                          backgroundColor: `${char.color}22`,
                          borderColor: char.color,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: char.color }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white font-heading">
                            {char.name}
                          </h3>
                          {isSelected && (
                            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-zinc-400">
                          {char.title}
                        </span>
                      </div>
                    </div>

                    {!isUnlocked && (
                      <div className="bg-zinc-800 text-zinc-400 p-1.5 rounded-lg border border-zinc-700">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                    {char.bio}
                  </p>

                  {/* Perk Banner */}
                  <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg text-xs text-amber-300/90 font-medium mb-4">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] block mb-0.5">Tactical Perk:</span>
                    {char.perkDescription}
                  </div>

                  {/* Stat badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2.5 py-1.5 rounded-md">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Base HP: <strong className="text-white font-mono">{char.baseHealth}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2.5 py-1.5 rounded-md">
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                      <span>Speed: <strong className="text-white font-mono">{Math.round(char.speedMultiplier * 100)}%</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2.5 py-1.5 rounded-md">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Weapon: <strong className="text-white capitalize">{char.startingWeapon}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2.5 py-1.5 rounded-md">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Armor: <strong className="text-white font-mono">+{Math.round(char.armorBonus * 100)}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Unlock condition or Select button */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  {!isUnlocked ? (
                    <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock: {char.unlockCondition}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePick(id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-black'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isSelected ? 'OPERATIVE SELECTED' : 'DEPLOY WITH THIS SURVIVOR'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
