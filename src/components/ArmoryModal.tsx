import React, { useState } from 'react';
import { PermanentUpgrades } from '../types/game';
import { ARMORY_UPGRADE_CONFIGS, saveManager } from '../systems/saveSystem';
import { soundManager } from '../audio/soundManager';
import { Coins, Heart, Swords, Wind, Magnet, Target, Shield, Activity, Zap, ArrowLeft } from 'lucide-react';

interface ArmoryModalProps {
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({ onClose }) => {
  const [data, setData] = useState(() => saveManager.getData());

  const handleBuy = (key: keyof PermanentUpgrades) => {
    const success = saveManager.purchaseUpgrade(key);
    if (success) {
      soundManager.playEvolution();
      setData({ ...saveManager.getData() });
    } else {
      soundManager.playClick();
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="w-5 h-5 text-rose-500" />;
      case 'swords': return <Swords className="w-5 h-5 text-red-400" />;
      case 'wind': return <Wind className="w-5 h-5 text-sky-400" />;
      case 'magnet': return <Magnet className="w-5 h-5 text-blue-400" />;
      case 'target': return <Target className="w-5 h-5 text-amber-400" />;
      case 'shield': return <Shield className="w-5 h-5 text-purple-400" />;
      case 'activity': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'coins': return <Coins className="w-5 h-5 text-yellow-500" />;
      default: return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-4xl w-full h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Armory Header */}
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
                The Armory
              </h2>
              <p className="text-xs text-zinc-400">
                Purchase permanent combat enhancements that persist across all runs
              </p>
            </div>
          </div>

          {/* Player Coins Display */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-1.5 rounded-full">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono font-bold text-sm text-yellow-400">{data.coins}</span>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(Object.keys(ARMORY_UPGRADE_CONFIGS) as (keyof PermanentUpgrades)[]).map((key) => {
            const config = ARMORY_UPGRADE_CONFIGS[key];
            const currentRank = data.permanentUpgrades[key];
            const isMax = currentRank >= config.maxRank;
            const cost = saveManager.getUpgradeCost(key);
            const canAfford = data.coins >= cost && !isMax;

            return (
              <div
                key={key}
                className="flex flex-col justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div>
                  {/* Top Row: Icon + Name */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                        {getIcon(config.icon)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-heading">
                          {config.name}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          +{config.perRankValue}{config.unit} per rank
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {currentRank}/{config.maxRank}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 mb-3">
                    {config.description}
                  </p>

                  {/* Rank Pips */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: config.maxRank }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-1.5 rounded-xs ${
                          idx < currentRank
                            ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  disabled={!canAfford || isMax}
                  onClick={() => handleBuy(key)}
                  className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold font-heading uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                    isMax
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isMax ? (
                    <span>MAX RANK</span>
                  ) : (
                    <>
                      <span>UPGRADE</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Coins className="w-3.5 h-3.5" />
                        {cost}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
