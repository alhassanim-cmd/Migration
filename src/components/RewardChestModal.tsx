import React from 'react';
import { UpgradeCard } from '../types/game';
import { Gift, Coins, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RewardChestModalProps {
  coins: number;
  upgrades: UpgradeCard[];
  onSelectUpgrade: (card: UpgradeCard) => void;
  onClaimCoinsOnly: () => void;
}

export const RewardChestModal: React.FC<RewardChestModalProps> = ({
  coins,
  upgrades,
  onSelectUpgrade,
  onClaimCoinsOnly,
}) => {
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-2xl w-full flex flex-col items-center gap-6 text-center">
        {/* Chest Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-bounce">
            <Gift className="w-12 h-12 text-black" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-spin" />
        </div>

        {/* Title */}
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold font-heading">
            Apex Entity Eliminated
          </span>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider font-heading mt-1">
            Boss Supply Cache
          </h2>
          <div className="inline-flex items-center gap-2 mt-3 bg-yellow-500/20 border border-yellow-500/40 px-4 py-1.5 rounded-full text-yellow-300 font-bold text-sm">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>+{coins} Gold Coins Secured!</span>
          </div>
        </div>

        {/* Upgrade choices from chest */}
        <div className="w-full">
          <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-bold">
            Select a free tactical enhancement:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {upgrades.map((card) => (
              <button
                key={card.id}
                onClick={() => onSelectUpgrade(card)}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-zinc-900 border border-amber-500/40 hover:border-amber-400 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer shadow-lg group"
              >
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                  {card.rarity}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors font-heading mb-1">
                  {card.title}
                </div>
                <p className="text-xs text-zinc-300 leading-tight">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Or take coins and continue */}
        <button
          onClick={onClaimCoinsOnly}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer pt-2"
        >
          <span>Claim Cache & Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
