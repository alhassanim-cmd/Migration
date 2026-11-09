import { SaveData, PermanentUpgrades, GameSettings, CharacterId, MapId, ChallengeId, DailyMissionItem } from '../types/game';

const SAVE_KEY = 'DEADZONE_LAST_STAND_SAVE_V1';

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  floatingJoystick: true,
  joystickSensitivity: 1.0,
  damageNumbers: true,
  screenShake: true,
  reducedParticles: false,
  showVignette: true,
};

const DEFAULT_PERMANENT_UPGRADES: PermanentUpgrades = {
  maxHealthRank: 0,
  damageRank: 0,
  moveSpeedRank: 0,
  magnetRank: 0,
  critChanceRank: 0,
  armorRank: 0,
  healthRegenRank: 0,
  dashRecoveryRank: 0,
  coinBonusRank: 0,
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateDailyMissions(): DailyMissionItem[] {
  return [
    {
      id: 'daily_kill_300',
      title: 'Horde Exterminator',
      description: 'Eliminate 300 zombies across any game mode.',
      target: 300,
      progress: 0,
      completed: false,
      rewardCoins: 500,
    },
    {
      id: 'daily_survive_8m',
      title: 'Endurance Protocol',
      description: 'Survive at least 8 minutes in a single run.',
      target: 480, // seconds
      progress: 0,
      completed: false,
      rewardCoins: 650,
    },
    {
      id: 'daily_collect_1000xp',
      title: 'Resource Scavenger',
      description: 'Harvest 1,000 XP crystals.',
      target: 1000,
      progress: 0,
      completed: false,
      rewardCoins: 400,
    },
    {
      id: 'daily_kill_boss',
      title: 'Titan Cleanser',
      description: 'Defeat 1 boss encounter.',
      target: 1,
      progress: 0,
      completed: false,
      rewardCoins: 800,
    },
  ];
}

const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  coins: 350, // generous starting cash to test Armory right away
  permanentUpgrades: DEFAULT_PERMANENT_UPGRADES,
  unlockedCharacters: ['raven'],
  unlockedMaps: ['city', 'industrial', 'quarantine'],
  unlockedChallenges: ['pistol_only', 'swarm_cleansing', 'ghost_protocol', 'speed_blitz', 'boss_rush'],
  completedChallenges: [],
  settings: DEFAULT_SETTINGS,
  achievements: {},
  missionDay: getTodayString(),
  dailyMissions: generateDailyMissions(),
  highScores: {
    survivalBestTime: 0,
    survivalBestKills: 0,
    endlessBestTime: 0,
    endlessBestKills: 0,
    totalZombiesKilled: 0,
    totalRuns: 0,
    totalBossesKilled: 0,
  },
};

export const ARMORY_UPGRADE_CONFIGS: Record<keyof PermanentUpgrades, {
  name: string;
  description: string;
  icon: string;
  maxRank: number;
  baseCost: number;
  costMultiplier: number;
  perRankValue: number;
  unit: string;
}> = {
  maxHealthRank: {
    name: 'Reinforced Plating',
    description: 'Increases base hit points.',
    icon: 'heart',
    maxRank: 10,
    baseCost: 100,
    costMultiplier: 1.35,
    perRankValue: 10,
    unit: 'HP',
  },
  damageRank: {
    name: 'Hollow-Point Munitions',
    description: 'Boosts all weapon and ability damage.',
    icon: 'swords',
    maxRank: 10,
    baseCost: 150,
    costMultiplier: 1.4,
    perRankValue: 5,
    unit: '%',
  },
  moveSpeedRank: {
    name: 'Agility Conditioning',
    description: 'Increases survivor movement velocity.',
    icon: 'wind',
    maxRank: 10,
    baseCost: 120,
    costMultiplier: 1.35,
    perRankValue: 4,
    unit: '%',
  },
  magnetRank: {
    name: 'Magnetic Harvester',
    description: 'Expands the suction radius for XP crystals & coins.',
    icon: 'magnet',
    maxRank: 10,
    baseCost: 80,
    costMultiplier: 1.3,
    perRankValue: 15,
    unit: '%',
  },
  critChanceRank: {
    name: 'Precision Targeting',
    description: 'Raises critical strike probability on all hits.',
    icon: 'target',
    maxRank: 10,
    baseCost: 200,
    costMultiplier: 1.45,
    perRankValue: 2,
    unit: '%',
  },
  armorRank: {
    name: 'Ballistic Weave',
    description: 'Reduces damage taken from physical and toxic attacks.',
    icon: 'shield',
    maxRank: 10,
    baseCost: 140,
    costMultiplier: 1.4,
    perRankValue: 3,
    unit: '%',
  },
  healthRegenRank: {
    name: 'Nano-Stimulator',
    description: 'Continuously restores health every second.',
    icon: 'activity',
    maxRank: 10,
    baseCost: 180,
    costMultiplier: 1.45,
    perRankValue: 0.3,
    unit: 'HP/s',
  },
  dashRecoveryRank: {
    name: 'Rapid Thrusters',
    description: 'Decreases the cooldown delay between combat dashes.',
    icon: 'zap',
    maxRank: 10,
    baseCost: 130,
    costMultiplier: 1.35,
    perRankValue: 5,
    unit: '%',
  },
  coinBonusRank: {
    name: 'Bounty Scavenger',
    description: 'Increases gold coins found during runs and rewards.',
    icon: 'coins',
    maxRank: 10,
    baseCost: 100,
    costMultiplier: 1.3,
    perRankValue: 10,
    unit: '%',
  },
};

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  public getData(): SaveData {
    return this.data;
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE_DATA };

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SAVE_DATA };

      // Migrate / merge with defaults to avoid missing keys
      const data: SaveData = {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        permanentUpgrades: {
          ...DEFAULT_PERMANENT_UPGRADES,
          ...(parsed.permanentUpgrades || {}),
        },
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
        highScores: {
          ...DEFAULT_SAVE_DATA.highScores,
          ...(parsed.highScores || {}),
        },
      };

      // Check daily mission reset
      const today = getTodayString();
      if (data.missionDay !== today) {
        data.missionDay = today;
        data.dailyMissions = generateDailyMissions();
      }

      return data;
    } catch (e) {
      console.error('Error loading save data, reverting to defaults:', e);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public addCoins(amount: number): number {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.save();
    return this.data.coins;
  }

  public getUpgradeCost(key: keyof PermanentUpgrades): number {
    const currentRank = this.data.permanentUpgrades[key];
    const config = ARMORY_UPGRADE_CONFIGS[key];
    if (currentRank >= config.maxRank) return Infinity;
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentRank));
  }

  public purchaseUpgrade(key: keyof PermanentUpgrades): boolean {
    const cost = this.getUpgradeCost(key);
    if (this.data.coins < cost) return false;

    const config = ARMORY_UPGRADE_CONFIGS[key];
    if (this.data.permanentUpgrades[key] >= config.maxRank) return false;

    this.data.coins -= cost;
    this.data.permanentUpgrades[key] += 1;
    this.save();
    return true;
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  public unlockCharacter(id: CharacterId): void {
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.save();
    }
  }

  public recordRun(results: {
    survivedTime: number;
    zombiesKilled: number;
    bossesKilled: number;
    coinsEarned: number;
    mode: string;
    isVictory: boolean;
    challengeId?: ChallengeId;
  }): void {
    this.data.highScores.totalRuns += 1;
    this.data.highScores.totalZombiesKilled += results.zombiesKilled;
    this.data.highScores.totalBossesKilled += results.bossesKilled;

    if (results.mode === 'survival') {
      if (results.survivedTime > this.data.highScores.survivalBestTime) {
        this.data.highScores.survivalBestTime = results.survivedTime;
      }
      if (results.zombiesKilled > this.data.highScores.survivalBestKills) {
        this.data.highScores.survivalBestKills = results.zombiesKilled;
      }
    } else if (results.mode === 'endless') {
      if (results.survivedTime > this.data.highScores.endlessBestTime) {
        this.data.highScores.endlessBestTime = results.survivedTime;
      }
      if (results.zombiesKilled > this.data.highScores.endlessBestKills) {
        this.data.highScores.endlessBestKills = results.zombiesKilled;
      }
    }

    if (results.challengeId && results.isVictory) {
      if (!this.data.completedChallenges.includes(results.challengeId)) {
        this.data.completedChallenges.push(results.challengeId);
      }
    }

    // Check unlocks
    // Steele: survive 5 minutes (300 sec)
    if (results.survivedTime >= 300) {
      this.unlockCharacter('steele');
    }
    // Ghost: 1000 total kills
    if (this.data.highScores.totalZombiesKilled >= 1000) {
      this.unlockCharacter('ghost');
    }
    // Pyre: killed boss
    if (this.data.highScores.totalBossesKilled >= 1) {
      this.unlockCharacter('pyre');
    }

    // Update Daily Missions
    this.data.dailyMissions.forEach((m) => {
      if (m.id === 'daily_kill_300' && !m.completed) {
        m.progress += results.zombiesKilled;
        if (m.progress >= m.target) {
          m.progress = m.target;
          m.completed = true;
          this.data.coins += m.rewardCoins;
        }
      }
      if (m.id === 'daily_survive_8m' && !m.completed) {
        m.progress = Math.max(m.progress, results.survivedTime);
        if (m.progress >= m.target) {
          m.progress = m.target;
          m.completed = true;
          this.data.coins += m.rewardCoins;
        }
      }
      if (m.id === 'daily_kill_boss' && !m.completed) {
        m.progress += results.bossesKilled;
        if (m.progress >= m.target) {
          m.progress = m.target;
          m.completed = true;
          this.data.coins += m.rewardCoins;
        }
      }
    });

    this.save();
  }
}

export const saveManager = new SaveManager();
