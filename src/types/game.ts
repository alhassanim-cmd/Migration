export type GameMode = 'survival' | 'endless' | 'challenge';

export type ChallengeId = 
  | 'pistol_only'
  | 'swarm_cleansing'
  | 'ghost_protocol'
  | 'speed_blitz'
  | 'boss_rush';

export interface ChallengeConfig {
  id: ChallengeId;
  name: string;
  description: string;
  targetTime?: number; // in seconds
  targetKills?: number;
  lockedWeapon?: WeaponId;
  noDamageRule?: boolean;
  speedMultiplier?: number;
  spawnMultiplier?: number;
  isBossRush?: boolean;
  rewardCoins: number;
}

export type MapId = 'city' | 'industrial' | 'quarantine';

export interface MapConfig {
  id: MapId;
  name: string;
  subtitle: string;
  themeColor: string;
  ambientLight: string;
  floorColor: string;
  gridColor: string;
  accentColor: string;
  obstacleType: 'cars' | 'barrels' | 'barricades';
}

export type CharacterId = 'raven' | 'steele' | 'ghost' | 'pyre';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  title: string;
  bio: string;
  startingWeapon: WeaponId;
  baseHealth: number;
  speedMultiplier: number;
  critChanceBonus: number;
  armorBonus: number;
  perkDescription: string;
  unlockedByDefault: boolean;
  unlockCondition: string;
  color: string;
}

export type WeaponId = 
  | 'pistol'
  | 'assault_rifle'
  | 'shotgun'
  | 'smg'
  | 'sniper'
  | 'flamethrower'
  // Evolutions:
  | 'phantom_revolver'
  | 'bullet_storm'
  | 'thunder_barrage'
  | 'neon_shredder'
  | 'rail_cannon'
  | 'inferno_wave';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  description: string;
  iconName: string;
  damage: number;
  fireRate: number; // shots per second
  range: number;
  projectileSpeed: number;
  projectileCount: number;
  spreadAngle: number; // in radians
  pierce: number;
  critChance: number;
  knockback: number;
  color: string;
  projectileRadius: number;
  isEvolved?: boolean;
  requiredUpgradeForEvolution?: UpgradeType;
  evolvesFrom?: WeaponId;
}

export type UpgradeType =
  | 'damage'
  | 'attack_speed'
  | 'move_speed'
  | 'max_health'
  | 'crit_chance'
  | 'projectile_count'
  | 'projectile_size'
  | 'xp_magnet'
  | 'armor'
  | 'health_regen'
  | 'pierce'
  | 'dash_cooldown'
  // Abilities:
  | 'ability_shockwave'
  | 'ability_orbital_blades'
  | 'ability_chain_lightning'
  | 'ability_meteor_strike'
  | 'ability_freeze_pulse'
  | 'ability_guardian_drone'
  // Weapon Unlocks:
  | 'weapon_assault_rifle'
  | 'weapon_shotgun'
  | 'weapon_smg'
  | 'weapon_sniper'
  | 'weapon_flamethrower'
  // Evolution cards:
  | 'evolution_phantom_revolver'
  | 'evolution_bullet_storm'
  | 'evolution_thunder_barrage'
  | 'evolution_neon_shredder'
  | 'evolution_rail_cannon'
  | 'evolution_inferno_wave';

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface UpgradeCard {
  id: string;
  type: UpgradeType;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  isEvolution?: boolean;
}

export type EnemyType = 
  | 'walker'
  | 'runner'
  | 'brute'
  | 'spitter'
  | 'screamer'
  | 'armored'
  | 'exploder'
  // Bosses:
  | 'juggernaut'
  | 'plague_mother'
  | 'harvester';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  xpValue: number;
  coinValue: number;
  isBoss?: boolean;
  armor?: number;
  rangedAttack?: boolean;
  attackCooldown?: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  baseDamageMult: number;
  fireRateMult: number;
  moveSpeed: number;
  critChance: number;
  armor: number; // percentage reduction (e.g. 0.15 = 15%)
  xpMagnetRadius: number;
  healthRegen: number; // HP per sec
  extraProjectiles: number;
  projectileSizeMult: number;
  pierceBonus: number;
  dashCooldownMult: number;
}

export interface ActiveAbilityState {
  type: 'shockwave' | 'orbital_blades' | 'chain_lightning' | 'meteor_strike' | 'freeze_pulse' | 'guardian_drone';
  name: string;
  level: number;
  cooldown: number; // total cooldown in ms
  timer: number;    // remaining cooldown in ms
  isReady: boolean;
}

export interface PermanentUpgrades {
  maxHealthRank: number;      // +10 HP per rank (max 10)
  damageRank: number;         // +5% damage per rank (max 10)
  moveSpeedRank: number;      // +4% speed per rank (max 10)
  magnetRank: number;         // +15% radius per rank (max 10)
  critChanceRank: number;     // +2% crit per rank (max 10)
  armorRank: number;          // +3% armor per rank (max 10)
  healthRegenRank: number;    // +0.3 HP/s per rank (max 10)
  dashRecoveryRank: number;   // +5% faster dash cooldown per rank (max 10)
  coinBonusRank: number;      // +10% coin rewards per rank (max 10)
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  floatingJoystick: boolean;
  joystickSensitivity: number; // 0.5 to 2.0
  damageNumbers: boolean;
  screenShake: boolean;
  reducedParticles: boolean;
  showVignette: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unlocked: boolean;
  rewardCoins: number;
}

export interface DailyMissionItem {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardCoins: number;
}

export interface SaveData {
  version: number;
  coins: number;
  permanentUpgrades: PermanentUpgrades;
  unlockedCharacters: CharacterId[];
  unlockedMaps: MapId[];
  unlockedChallenges: ChallengeId[];
  completedChallenges: ChallengeId[];
  settings: GameSettings;
  achievements: Record<string, boolean>;
  missionDay: string; // YYYY-MM-DD
  dailyMissions: DailyMissionItem[];
  highScores: {
    survivalBestTime: number; // seconds
    survivalBestKills: number;
    endlessBestTime: number;
    endlessBestKills: number;
    totalZombiesKilled: number;
    totalRuns: number;
    totalBossesKilled: number;
  };
}

export interface RunResults {
  survivedTime: number; // seconds
  zombiesKilled: number;
  bossesKilled: number;
  levelReached: number;
  coinsEarned: number;
  xpEarned: number;
  damageDealt: number;
  isVictory: boolean;
  mapId: MapId;
  characterId: CharacterId;
  mode: GameMode;
  challengeId?: ChallengeId;
}
