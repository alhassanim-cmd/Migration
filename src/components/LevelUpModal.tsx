import React from 'react';
import { UpgradeCard } from '../types/game';
import { Sparkles, Zap, Shield, Heart, Crosshair, Magnet, Layers, Disc, Flame, Snowflake, Bot, Swords, Wind } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  cards: UpgradeCard[];
  onSelect: (card: UpgradeCard) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ cards, onSelect }) => {
  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles': return <Sparkles className="w-8 h-8 text-amber-300" />;
      case 'zap': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'shield': return <Shield className="w-8 h-8 text-purple-400" />;
      case 'heart': return <Heart className="w-8 h-8 text-rose-500" />;
      case 'crosshair': return <Crosshair className="w-8 h-8 text-red-400" />;
      case 'magnet': return <Magnet className="w-8 h-8 text-sky-400" />;
      case 'layers': return <Layers className="w-8 h-8 text-emerald-400" />;
      case 'disc': return <Disc className="w-8 h-8 text-orange-400" />;
      case 'flame': return <Flame className="w-8 h-8 text-orange-500" />;
      case 'snowflake': return <Snowflake className="w-8 h-8 text-cyan-400" />;
      case 'bot': return <Bot className="w-8 h-8 text-emerald-300" />;
      case 'swords': return <Swords className="w-8 h-8 text-red-500" />;
      case 'wind': return <Wind className="w-8 h-8 text-sky-300" />;
      default: return <Zap className="w-8 h-8 text-amber-400" />;
    }
  };

  const getRarityStyle = (rarity: string, isEvolution?: boolean) => {
    if (isEvolution) {
      return {
        border: 'border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]',
        badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black',
        bg: 'bg-gradient-to-b from-amber-950/70 via-zinc-900 to-black',
        glow: 'text-amber-300',
      };
    }
    switch (rarity) {
      case 'legendary':
        return {
          border: 'border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          badge: 'bg-amber-500 text-black font-black',
          bg: 'bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950',
          glow: 'text-amber-300',
        };
      case 'epic':
        return {
          border: 'border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)]',
          badge: 'bg-purple-600 text-white font-bold',
          bg: 'bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-950',
          glow: 'text-purple-300',
        };
      case 'rare':
        return {
          border: 'border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          badge: 'bg-cyan-600 text-white font-bold',
          bg: 'bg-gradient-to-b from-cyan-950/40 via-zinc-900 to-zinc-950',
          glow: 'text-cyan-300',
        };
      default:
        return {
          border: 'border border-zinc-700 hover:border-zinc-500',
          badge: 'bg-zinc-700 text-zinc-200 font-semibold',
          bg: 'bg-gradient-to-b from-zinc-800/40 via-zinc-900 to-zinc-950',
          glow: 'text-zinc-200',
        };
    }
  };

  const handlePick = (card: UpgradeCard) => {
    if (card.isEvolution || card.rarity === 'legendary') {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // fallback safe
      }
    }
    onSelect(card);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-3xl w-full flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black uppercase px-3 py-1 rounded-sm tracking-widest font-heading mb-1 shadow-md">
            Level Up!
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-heading">
            Choose Your Upgrade
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Select one enhancement to integrate into your survivor suit
          </p>
        </div>

        {/* 3 Upgrade Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {cards.map((card) => {
            const style = getRarityStyle(card.rarity, card.isEvolution);
            return (
              <button
                key={card.id}
                onClick={() => handlePick(card)}
                className={`relative group flex flex-col items-center text-center p-5 rounded-xl ${style.bg} ${style.border} transition-all duration-200 hover:-translate-y-1 active:scale-95 cursor-pointer`}
              >
                {/* Rarity Tag */}
                <div className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${style.badge}`}>
                  {card.isEvolution ? '★ WEAPON EVOLUTION ★' : card.rarity}
                </div>

                {/* Icon Container */}
                <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform">
                  {getCardIcon(card.icon)}
                </div>

                {/* Title */}
                <h3 className={`text-base font-bold uppercase tracking-wide font-heading mb-2 ${style.glow}`}>
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed mb-4 flex-1">
                  {card.description}
                </p>

                {/* Level indicators */}
                {!card.isEvolution && (
                  <div className="flex items-center gap-1 mt-auto pt-2 border-t border-white/10 w-full justify-center">
                    <span className="text-[10px] text-zinc-400 font-semibold mr-1">Rank:</span>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`w-3 h-1.5 rounded-xs ${
                          lvl <= card.currentLevel + 1
                            ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
