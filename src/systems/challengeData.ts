import { ChallengeConfig, ChallengeId } from '../types/game';

export const CHALLENGES: Record<ChallengeId, ChallengeConfig> = {
  pistol_only: {
    id: 'pistol_only',
    name: 'Gunslinger Trial',
    description: 'Survive 5 intense minutes using ONLY your sidearm. Weapon drops and upgrades are restricted to passives.',
    targetTime: 300, // 5 min
    lockedWeapon: 'pistol',
    rewardCoins: 1200,
  },
  swarm_cleansing: {
    id: 'swarm_cleansing',
    name: 'Swarm Cleansing',
    description: 'Massive horde influx! Eliminate 500 zombies before the 6-minute extraction timer runs out.',
    targetTime: 360,
    targetKills: 500,
    spawnMultiplier: 1.6,
    rewardCoins: 1500,
  },
  ghost_protocol: {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    description: 'Survive for 3 minutes without taking a SINGLE hit of damage. Any hit means instant mission failure!',
    targetTime: 180,
    noDamageRule: true,
    rewardCoins: 2000,
  },
  speed_blitz: {
    id: 'speed_blitz',
    name: 'Heavy Mud',
    description: 'Survivor movement speed is lowered by 30%, but zombies spawn 50% faster. Test your positioning!',
    targetTime: 300,
    speedMultiplier: 0.70,
    spawnMultiplier: 1.5,
    rewardCoins: 1600,
  },
  boss_rush: {
    id: 'boss_rush',
    name: 'Apex Triad',
    description: 'Face The Juggernaut, Plague Mother, and The Harvester in brutal consecutive waves!',
    targetTime: 480,
    isBossRush: true,
    rewardCoins: 3000,
  },
};
