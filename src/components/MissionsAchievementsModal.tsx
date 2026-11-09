import React, { useState } from 'react';
import { saveManager } from '../systems/saveSystem';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Calendar, Trophy, Coins, CheckCircle, Skull, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MissionsAchievementsModalProps {
  onClose: () => void;
}

export const MissionsAchievementsModal: React.FC<MissionsAchievementsModalProps> = ({ onClose }) => {
  const [data, setData] = useState(() => saveManager.getData());
  const [activeTab, setActiveTab] = useState<'daily' | 'stats'>('daily');

  const handleClaimMission = (id: string, reward: number) => {
    soundManager.playEvolution();
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    setData({ ...saveManager.getData() });
  };

  const highScores = data.highScores;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="max-w-3xl w-full h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
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
                Operational Records & Bounties
              </h2>
              <p className="text-xs text-zinc-400">
                Track daily bounty missions, career milestones and lifetime combat stats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono font-bold text-xs text-yellow-400">{data.coins}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border-b border-zinc-800 px-4 sm:px-6">
          <button
            onClick={() => { soundManager.playClick(); setActiveTab('daily'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Bounties</span>
          </button>

          <button
            onClick={() => { soundManager.playClick(); setActiveTab('stats'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-heading uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Lifetime Records</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'daily' ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                <span>Refreshes every 24 hours at midnight</span>
                <span className="font-mono text-amber-400">Date: {data.missionDay}</span>
              </div>

              {data.dailyMissions.map((m) => {
                const pct = Math.min(100, (m.progress / m.target) * 100);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white font-heading">
                          {m.title}
                        </h4>
                        <p className="text-xs text-zinc-300">
                          {m.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/30">
                        <Coins className="w-3.5 h-3.5" />
                        <span>+{m.rewardCoins}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            m.completed ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 min-w-16 text-right">
                        {m.progress}/{m.target}
                      </span>
                    </div>

                    {m.completed && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed & Bounty Rewarded!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <Skull className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block">Total Zombies Exterminated</span>
                  <span className="text-2xl font-bold font-mono text-white">{highScores.totalZombiesKilled.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block">Apex Bosses Slain</span>
                  <span className="text-2xl font-bold font-mono text-white">{highScores.totalBossesKilled}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block">Survival Best Time</span>
                  <span className="text-2xl font-bold font-mono text-white">
                    {Math.floor(highScores.survivalBestTime / 60)}m {highScores.survivalBestTime % 60}s
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-semibold block">Total Missions Deployed</span>
                  <span className="text-2xl font-bold font-mono text-white">{highScores.totalRuns}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
