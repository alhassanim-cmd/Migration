import React, { useState } from 'react';
import { GameMode, MapId, ChallengeId } from '../types/game';
import { MAP_CONFIGS } from '../systems/mapData';
import { CHALLENGES } from '../systems/challengeData';
import { saveManager } from '../systems/saveSystem';
import { ArrowLeft, Clock, Infinity, ShieldAlert, Check, Coins } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameModesModalProps {
  currentMode: GameMode;
  currentMap: MapId;
  currentChallenge?: ChallengeId;
  onSelectConfig: (mode: GameMode, map: MapId, challenge?: ChallengeId) => void;
  onClose: () => void;
}

export const GameModesModal: React.FC<GameModesModalProps> = ({
  currentMode,
  currentMap,
  currentChallenge,
  onSelectConfig,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'modes' | 'challenges' | 'maps'>('modes');
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentMode);
  const [selectedMap, setSelectedMap] = useState<MapId>(currentMap);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | undefined>(currentChallenge);

  const completedChallenges = saveManager.getData().completedChallenges;

  const handleConfirm = () => {
    soundManager.playClick();
    onSelectConfig(selectedMode, selectedMap, selectedMode === 'challenge' ? selectedChallenge : undefined);
    onClose();
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
                Mission Deployment Setup
              </h2>
              <p className="text-xs text-zinc-400">
                Configure your combat protocol, operational theater, or trial challenges
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border-b border-zinc-800 px-4 sm:px-6">
          <button
            onClick={() => { soundManager.playClick(); setActiveTab('modes'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'modes'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Game Modes
          </button>

          <button
            onClick={() => { soundManager.playClick(); setActiveTab('challenges'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Special Challenges
          </button>

          <button
            onClick={() => { soundManager.playClick(); setActiveTab('maps'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'maps'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Theaters of War (Maps)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: MODES */}
          {activeTab === 'modes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Survival */}
              <div
                onClick={() => { setSelectedMode('survival'); setSelectedChallenge(undefined); soundManager.playClick(); }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === 'survival'
                    ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading mb-1">
                    Standard Survival Protocol
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                    Survive for 15 intense minutes, battle escalating horde waves, defeat apex bosses at 5m, 10m, and eliminate The Harvester at 14m to call for extraction.
                  </p>
                </div>

                <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 pt-3 border-t border-zinc-800">
                  {selectedMode === 'survival' ? <Check className="w-4 h-4" /> : null}
                  <span>Target: 15:00 Minutes</span>
                </div>
              </div>

              {/* Endless */}
              <div
                onClick={() => { setSelectedMode('endless'); setSelectedChallenge(undefined); soundManager.playClick(); }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === 'endless'
                    ? 'bg-zinc-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                    <Infinity className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading mb-1">
                    Endless Onslaught
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                    No extraction timer. Difficulty continuously escalates with no ceiling. How long can your optimized build survive against thousands of undead?
                  </p>
                </div>

                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 pt-3 border-t border-zinc-800">
                  {selectedMode === 'endless' ? <Check className="w-4 h-4" /> : null}
                  <span>Target: Infinite Record</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(Object.keys(CHALLENGES) as ChallengeId[]).map((cId) => {
                const ch = CHALLENGES[cId];
                const isSelected = selectedMode === 'challenge' && selectedChallenge === cId;
                const isCompleted = completedChallenges.includes(cId);

                return (
                  <div
                    key={cId}
                    onClick={() => {
                      setSelectedMode('challenge');
                      setSelectedChallenge(cId);
                      soundManager.playClick();
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <h4 className="text-sm font-bold text-white font-heading">
                            {ch.name}
                          </h4>
                        </div>
                        {isCompleted && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> CLEARED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                      <span className="text-zinc-400 font-mono">
                        {ch.targetTime ? `Timer: ${Math.floor(ch.targetTime / 60)}m` : 'Horde Target'}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-400 font-bold font-mono">
                        <Coins className="w-3.5 h-3.5" /> +{ch.rewardCoins}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: MAPS */}
          {activeTab === 'maps' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(MAP_CONFIGS) as MapId[]).map((mId) => {
                const map = MAP_CONFIGS[mId];
                const isSelected = selectedMap === mId;

                return (
                  <div
                    key={mId}
                    onClick={() => { setSelectedMap(mId); soundManager.playClick(); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-900 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div
                        className="w-full h-24 rounded-xl mb-4 border flex items-center justify-center"
                        style={{
                          backgroundColor: map.floorColor,
                          borderColor: map.accentColor,
                        }}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: map.accentColor }}>
                          {map.obstacleType}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white font-heading mb-1">
                        {map.name}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        {map.subtitle}
                      </p>
                    </div>

                    <div className="text-xs font-bold pt-3 border-t border-zinc-800" style={{ color: map.accentColor }}>
                      {isSelected ? 'SELECTED THEATER' : 'SELECT MAP'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Confirm */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-xs text-zinc-300">
            Selected: <strong className="text-white uppercase font-heading">{selectedMode}</strong> on <strong className="text-cyan-400 font-heading">{MAP_CONFIGS[selectedMap].name}</strong>
          </div>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider font-heading shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Confirm Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
