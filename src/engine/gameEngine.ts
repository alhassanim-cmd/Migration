import {
  GameMode, MapId, CharacterId, ChallengeId,
  PlayerStats, WeaponId, UpgradeType, UpgradeCard, UpgradeRarity,
  EnemyType, EnemyDef
} from '../types/game';
import { CHARACTERS } from '../systems/characterData';
import { MAP_CONFIGS } from '../systems/mapData';
import { CHALLENGES } from '../systems/challengeData';
import { WEAPON_DEFINITIONS, EVOLUTION_RECIPES } from '../systems/weaponData';
import { ABILITY_DEFINITIONS } from '../systems/abilityData';
import { saveManager } from '../systems/saveSystem';
import { soundManager } from '../audio/soundManager';
import { ObjectPools, Projectile } from './objectPool';
import { SpatialGrid, SpatialEntity } from './spatialGrid';
import { GameRenderer, RenderContext } from './renderer';
import { dist, distSq, normalize, clamp, randomRange } from './math';

export interface EnemyEntity extends SpatialEntity {
  type: EnemyType;
  name: string;
  maxHealth: number;
  health: number;
  speed: number;
  damage: number;
  color: string;
  xpValue: number;
  coinValue: number;
  isBoss: boolean;
  angle: number;
  hitFlashTimer: number;
  isFrozen: boolean;
  freezeTimer: number;
  // Attack & Telegraphs
  attackCooldown: number;
  attackTimer: number;
  telegraphActive: boolean;
  telegraphType: 'line' | 'circle';
  telegraphTimer: number;
  telegraphMaxTimer: number;
  telegraphRange: number;
  telegraphRadius: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  type: 'cars' | 'barrels' | 'barricades';
  color: string;
  angle: number;
}

export interface GameEngineCallbacks {
  onLevelUp: (cards: UpgradeCard[]) => void;
  onEvolutionUnlocked: (weaponName: string, evolutionName: string) => void;
  onBossChest: (coins: number, upgrades: UpgradeCard[]) => void;
  onGameOver: (victory: boolean, stats: any) => void;
  onBossSpawn: (bossName: string) => void;
  onBossDefeated: (bossName: string) => void;
  onHUDUpdate: (hud: {
    health: number;
    maxHealth: number;
    level: number;
    currentXp: number;
    requiredXp: number;
    timer: number;
    kills: number;
    coinsCollected: number;
    dashCooldownPct: number;
    abilityCooldownPct: number;
    abilityReady: boolean;
    bossActive: boolean;
    bossHealthPct: number;
    bossName: string;
    equippedWeapons: string[];
    isVictory: boolean;
  }) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private pools: ObjectPools;
  private enemyGrid: SpatialGrid<EnemyEntity>;
  private callbacks: GameEngineCallbacks;

  // Running state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  // Game config
  public mode: GameMode = 'survival';
  public mapId: MapId = 'city';
  public characterId: CharacterId = 'raven';
  public challengeId?: ChallengeId;

  // Map & Environment
  private obstacles: Obstacle[] = [];

  // Game Session Stats
  public gameTime: number = 0; // seconds
  public kills: number = 0;
  public bossesKilled: number = 0;
  public coinsEarned: number = 0;
  public totalDamageDealt: number = 0;
  public level: number = 1;
  public currentXp: number = 0;
  public requiredXp: number = 15;

  // Player State
  public player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    color: '#3b82f6',
    aimAngle: 0,
    hitFlashTimer: 0,
    muzzleFlashTimer: 0,
    hasOrbitalBlades: false,
    hasGuardianDrone: false,
    dashTrail: [] as { x: number; y: number; angle: number; alpha: number }[],
  };

  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    baseDamageMult: 1.0,
    fireRateMult: 1.0,
    moveSpeed: 175,
    critChance: 0.05,
    armor: 0,
    xpMagnetRadius: 100,
    healthRegen: 0,
    extraProjectiles: 0,
    projectileSizeMult: 1.0,
    pierceBonus: 0,
    dashCooldownMult: 1.0,
  };

  // Weapons & Abilities
  public weapons: Map<WeaponId, { level: number; fireTimer: number; def: any }> = new Map();
  public passiveUpgrades: Map<UpgradeType, number> = new Map();

  // Active Ability state (e.g. Shockwave)
  public activeAbility: {
    type: 'shockwave';
    cooldown: number; // sec
    timer: number;
    isReady: boolean;
  } = {
    type: 'shockwave',
    cooldown: 8,
    timer: 0,
    isReady: true,
  };

  // Passive Timers for companions & automatic pulses
  private lightningTimer: number = 0;
  private meteorTimer: number = 0;
  private freezeTimer: number = 0;
  private droneFireTimer: number = 0;

  // Dash State
  private isDashing: boolean = false;
  private dashTimeRemaining: number = 0;
  private dashCooldownTimer: number = 0;
  private baseDashCooldown: number = 3.2; // sec
  private dashDirection = { x: 1, y: 0 };

  // Enemies
  public enemies: EnemyEntity[] = [];
  private enemyIdCounter: number = 0;
  private spawnTimer: number = 0;
  private bossActive: boolean = false;
  private currentBoss: EnemyEntity | null = null;
  private spawnedBosses: Set<string> = new Set();

  // Camera & Screen Shake
  private cameraX: number = 0;
  private cameraY: number = 0;
  private screenShake: number = 0;

  // Input states
  public moveInput = { x: 0, y: 0 };
  private keysDown: Set<string> = new Set();
  private hudSyncTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.renderer = new GameRenderer();
    this.pools = new ObjectPools(700, 500, 150, 600);
    this.enemyGrid = new SpatialGrid<EnemyEntity>(120);
    this.callbacks = callbacks;

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.code);
    if (e.code === 'Space') {
      e.preventDefault();
      this.triggerDash();
    }
    if (e.code === 'KeyE' || e.code === 'KeyQ') {
      e.preventDefault();
      this.triggerActiveAbility();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
  };

  public initSession(
    mode: GameMode,
    mapId: MapId,
    characterId: CharacterId,
    challengeId?: ChallengeId
  ) {
    this.mode = mode;
    this.mapId = mapId;
    this.characterId = characterId;
    this.challengeId = challengeId;

    this.gameTime = 0;
    this.kills = 0;
    this.bossesKilled = 0;
    this.coinsEarned = 0;
    this.totalDamageDealt = 0;
    this.level = 1;
    this.currentXp = 0;
    this.requiredXp = 15;
    this.enemyIdCounter = 0;
    this.spawnedBosses.clear();
    this.bossActive = false;
    this.currentBoss = null;

    // Reset Player
    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.aimAngle = 0;
    this.player.hitFlashTimer = 0;
    this.player.muzzleFlashTimer = 0;
    this.player.hasOrbitalBlades = false;
    this.player.hasGuardianDrone = false;
    this.player.dashTrail = [];
    this.cameraX = 0;
    this.cameraY = 0;
    this.screenShake = 0;

    // Clear pools & arrays
    this.pools.clearAll();
    this.enemies = [];
    this.enemyGrid.clear();
    this.weapons.clear();
    this.passiveUpgrades.clear();

    // Base character configuration
    const char = CHARACTERS[characterId];
    this.player.color = char.color;

    // Permanent upgrades from Armory
    const armory = saveManager.getData().permanentUpgrades;
    const hpBonus = armory.maxHealthRank * 10;
    const dmgBonus = 1 + armory.damageRank * 0.05;
    const speedBonus = 1 + armory.moveSpeedRank * 0.04;
    const magnetBonus = 1 + armory.magnetRank * 0.15;
    const critBonus = armory.critChanceRank * 0.02;
    const armorBonus = armory.armorRank * 0.03 + char.armorBonus;
    const regenBonus = armory.healthRegenRank * 0.3;
    const dashCooldownReduction = 1 - armory.dashRecoveryRank * 0.05;

    // Apply stats
    const totalMaxHp = (char.baseHealth + hpBonus);
    this.stats = {
      health: totalMaxHp,
      maxHealth: totalMaxHp,
      baseDamageMult: dmgBonus,
      fireRateMult: 1.0,
      moveSpeed: 180 * char.speedMultiplier * speedBonus,
      critChance: char.critChanceBonus + critBonus,
      armor: armorBonus,
      xpMagnetRadius: 105 * magnetBonus,
      healthRegen: regenBonus,
      extraProjectiles: 0,
      projectileSizeMult: 1.0,
      pierceBonus: 0,
      dashCooldownMult: dashCooldownReduction,
    };

    // Challenge modifiers
    if (this.challengeId) {
      const ch = CHALLENGES[this.challengeId];
      if (ch.speedMultiplier) {
        this.stats.moveSpeed *= ch.speedMultiplier;
      }
    }

    // Equip starting weapon
    const startWeaponId = this.challengeId && CHALLENGES[this.challengeId].lockedWeapon
      ? CHALLENGES[this.challengeId].lockedWeapon!
      : char.startingWeapon;

    this.weapons.set(startWeaponId, {
      level: 1,
      fireTimer: 0,
      def: { ...WEAPON_DEFINITIONS[startWeaponId] },
    });

    // Special starting perks (e.g. Dr. Pyre regen)
    if (char.id === 'pyre') {
      this.stats.healthRegen += 1.5;
    }
    if (char.id === 'ghost') {
      this.stats.dashCooldownMult *= 0.70;
    }

    // Generate Map Obstacles
    this.generateObstacles();
    this.renderer.prepareMap(MAP_CONFIGS[this.mapId]);

    // Start atmospheric music
    soundManager.startMusic('ambient');
  }

  private generateObstacles() {
    this.obstacles = [];
    const mapConfig = MAP_CONFIGS[this.mapId];
    const count = 35;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const d = randomRange(220, 1800);
      const x = Math.cos(angle) * d;
      const y = Math.sin(angle) * d;

      if (mapConfig.obstacleType === 'cars') {
        this.obstacles.push({
          x, y,
          width: 80,
          height: 44,
          radius: 35,
          type: 'cars',
          color: ['#1e293b', '#334155', '#475569', '#0369a1', '#991b1b'][i % 5],
          angle: Math.random() * Math.PI,
        });
      } else if (mapConfig.obstacleType === 'barrels') {
        this.obstacles.push({
          x, y,
          width: 32,
          height: 32,
          radius: 16,
          type: 'barrels',
          color: '#15803d',
          angle: 0,
        });
      } else {
        this.obstacles.push({
          x, y,
          width: 70,
          height: 24,
          radius: 28,
          type: 'barricades',
          color: '#78350f',
          angle: (i % 4) * (Math.PI / 4),
        });
      }
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp dt to avoid physics leaps during tab focus shifts
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // --- Input & Player Actions ---
  public triggerDash() {
    if (this.dashCooldownTimer > 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimeRemaining = 0.22; // 220ms
    this.dashCooldownTimer = this.baseDashCooldown * this.stats.dashCooldownMult;

    // Direction defaults to current movement or aim angle
    if (Math.abs(this.moveInput.x) > 0.1 || Math.abs(this.moveInput.y) > 0.1) {
      this.dashDirection = normalize(this.moveInput.x, this.moveInput.y);
    } else {
      this.dashDirection = {
        x: Math.cos(this.player.aimAngle),
        y: Math.sin(this.player.aimAngle),
      };
    }

    soundManager.playDash();
    this.pools.emitBurst(this.player.x, this.player.y, 10, '#38bdf8', 120, 'smoke');
  }

  public triggerActiveAbility() {
    if (!this.activeAbility.isReady) return;

    this.activeAbility.isReady = false;
    this.activeAbility.timer = this.activeAbility.cooldown;

    // Shockwave implementation
    soundManager.playAbilityShockwave();
    this.addScreenShake(12);

    const radius = 220;
    const damage = 95 * this.stats.baseDamageMult;

    // Spawn visual shockwave particle
    this.pools.spawnParticle(this.player.x, this.player.y, 0, 0, radius, '#06b6d4', 0.35, 'shockwave');

    // Query enemies around player
    const targets = this.enemyGrid.queryRadius(this.player.x, this.player.y, radius);
    for (let i = 0; i < targets.length; i++) {
      const e = targets[i];
      const push = normalize(e.x - this.player.x, e.y - this.player.y);
      e.x += push.x * 65;
      e.y += push.y * 65;
      this.damageEnemy(e, damage, false, 80);
    }
  }

  // --- Update Loop ---
  private update(dt: number) {
    this.gameTime += dt;

    // Health Regeneration
    if (this.stats.healthRegen > 0 && this.stats.health < this.stats.maxHealth) {
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + this.stats.healthRegen * dt);
    }

    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    }

    if (!this.activeAbility.isReady) {
      this.activeAbility.timer -= dt;
      if (this.activeAbility.timer <= 0) {
        this.activeAbility.timer = 0;
        this.activeAbility.isReady = true;
      }
    }

    if (this.player.hitFlashTimer > 0) {
      this.player.hitFlashTimer -= dt;
    }
    if (this.player.muzzleFlashTimer > 0) {
      this.player.muzzleFlashTimer -= dt;
    }

    // Update screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update Player Movement & Dash
    this.updatePlayerMovement(dt);

    // Update Enemies & Spawning
    this.updateEnemySpawning(dt);
    this.updateEnemies(dt);

    // Auto Weapon Targeting & Firing
    this.updateWeapons(dt);

    // Update Abilities (Passives, Companions)
    this.updatePassiveAbilities(dt);

    // Update Pools (Projectiles, Collectibles, Floating Text, Particles)
    this.updateProjectiles(dt);
    this.updateCollectibles(dt);
    this.updateFloatingTexts(dt);
    this.updateParticles(dt);

    // Camera follow player
    this.cameraX = this.player.x;
    this.cameraY = this.player.y;

    // Win condition check
    this.checkWinConditions();

    // Periodic HUD update for React (every 100ms)
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.1) {
      this.hudSyncTimer = 0;
      this.syncHUD();
    }
  }

  private updatePlayerMovement(dt: number) {
    let inputX = this.moveInput.x;
    let inputY = this.moveInput.y;

    // Keyboard fallback
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) inputY -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) inputY += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) inputX -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) inputX += 1;

    // Dash logic
    if (this.isDashing) {
      this.dashTimeRemaining -= dt;
      const dashSpeed = this.stats.moveSpeed * 3.2;
      this.player.x += this.dashDirection.x * dashSpeed * dt;
      this.player.y += this.dashDirection.y * dashSpeed * dt;

      // Add dash shadow ghost
      this.player.dashTrail.push({
        x: this.player.x,
        y: this.player.y,
        angle: this.player.aimAngle,
        alpha: 0.9,
      });

      if (this.dashTimeRemaining <= 0) {
        this.isDashing = false;
      }
    } else {
      const norm = normalize(inputX, inputY);
      const speed = this.stats.moveSpeed;
      this.player.vx = norm.x * speed;
      this.player.vy = norm.y * speed;

      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
    }

    // Decay dash trails
    for (let i = this.player.dashTrail.length - 1; i >= 0; i--) {
      this.player.dashTrail[i].alpha -= dt * 3.5;
      if (this.player.dashTrail[i].alpha <= 0) {
        this.player.dashTrail.splice(i, 1);
      }
    }

    // Resolve Obstacle Collisions
    for (let i = 0; i < this.obstacles.length; i++) {
      const ob = this.obstacles[i];
      const d = dist(this.player.x, this.player.y, ob.x, ob.y);
      const minD = this.player.radius + ob.radius;
      if (d < minD && d > 0) {
        const push = normalize(this.player.x - ob.x, this.player.y - ob.y);
        this.player.x = ob.x + push.x * minD;
        this.player.y = ob.y + push.y * minD;
      }
    }
  }

  private updateEnemySpawning(dt: number) {
    this.spawnTimer += dt;

    // Difficulty escalates with game time
    const minutes = this.gameTime / 60;
    const baseInterval = Math.max(0.18, 1.2 - minutes * 0.08);
    const spawnMultiplier = (this.challengeId && CHALLENGES[this.challengeId].spawnMultiplier) || 1.0;
    const spawnThreshold = baseInterval / spawnMultiplier;

    // Cap active enemies for 60fps mobile stability
    const maxEnemies = 220;

    if (this.spawnTimer >= spawnThreshold && this.enemies.length < maxEnemies) {
      this.spawnTimer = 0;

      // Determine enemy type based on survival time
      const type = this.pickSpawnEnemyType(minutes);
      this.spawnEnemy(type);
    }

    // Check Boss Spawns (Survival mode at 5:00, 10:00, 14:00; or Challenge Boss Rush)
    if (this.mode === 'survival' || (this.challengeId && CHALLENGES[this.challengeId].isBossRush)) {
      const isBossRush = this.challengeId && CHALLENGES[this.challengeId].isBossRush;

      // Boss 1: Juggernaut (5 min or 0:30 in Boss Rush)
      if (!this.spawnedBosses.has('juggernaut') && (this.gameTime >= (isBossRush ? 15 : 300))) {
        this.spawnBoss('juggernaut');
      }
      // Boss 2: Plague Mother (10 min or 2:00 in Boss Rush)
      if (!this.spawnedBosses.has('plague_mother') && (this.gameTime >= (isBossRush ? 120 : 600))) {
        this.spawnBoss('plague_mother');
      }
      // Boss 3: Harvester (14 min or 3:30 in Boss Rush)
      if (!this.spawnedBosses.has('harvester') && (this.gameTime >= (isBossRush ? 210 : 840))) {
        this.spawnBoss('harvester');
      }
    } else if (this.mode === 'endless') {
      // Endless mode spawns recurring bosses every 4 minutes
      const bossInterval = 240;
      const cycle = Math.floor(this.gameTime / bossInterval);
      const bossKey = `endless_boss_${cycle}`;
      if (cycle > 0 && !this.spawnedBosses.has(bossKey) && !this.bossActive) {
        this.spawnedBosses.add(bossKey);
        const bosses: ('juggernaut' | 'plague_mother' | 'harvester')[] = ['juggernaut', 'plague_mother', 'harvester'];
        this.spawnBoss(bosses[(cycle - 1) % bosses.length]);
      }
    }
  }

  private pickSpawnEnemyType(minutes: number): EnemyType {
    const roll = Math.random();

    if (minutes < 1.5) {
      return roll < 0.85 ? 'walker' : 'runner';
    } else if (minutes < 3.5) {
      if (roll < 0.55) return 'walker';
      if (roll < 0.85) return 'runner';
      return 'spitter';
    } else if (minutes < 6.0) {
      if (roll < 0.40) return 'walker';
      if (roll < 0.65) return 'runner';
      if (roll < 0.80) return 'brute';
      if (roll < 0.92) return 'spitter';
      return 'exploder';
    } else if (minutes < 9.0) {
      if (roll < 0.30) return 'runner';
      if (roll < 0.55) return 'brute';
      if (roll < 0.70) return 'armored';
      if (roll < 0.85) return 'exploder';
      if (roll < 0.95) return 'screamer';
      return 'spitter';
    } else {
      // Late game intense swarm
      if (roll < 0.25) return 'runner';
      if (roll < 0.50) return 'armored';
      if (roll < 0.70) return 'brute';
      if (roll < 0.85) return 'exploder';
      return 'screamer';
    }
  }

  private spawnEnemy(type: EnemyType) {
    // Spawn in a ring just offscreen around player
    const angle = Math.random() * Math.PI * 2;
    const distance = randomRange(520, 680);
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    // Enemy base definitions
    const defs: Record<EnemyType, {
      name: string; hp: number; spd: number; dmg: number; rad: number; col: string; xp: number; coin: number;
    }> = {
      walker: { name: 'Walker', hp: 35, spd: 55, dmg: 10, rad: 13, col: '#4b5563', xp: 1, coin: 1 },
      runner: { name: 'Runner', hp: 24, spd: 110, dmg: 8, rad: 11, col: '#dc2626', xp: 2, coin: 1 },
      brute: { name: 'Brute', hp: 160, spd: 45, dmg: 22, rad: 22, col: '#374151', xp: 5, coin: 3 },
      spitter: { name: 'Toxic Spitter', hp: 55, spd: 65, dmg: 14, rad: 14, col: '#16a34a', xp: 4, coin: 2 },
      screamer: { name: 'Screamer', hp: 70, spd: 75, dmg: 12, rad: 14, col: '#9333ea', xp: 6, coin: 4 },
      armored: { name: 'Armored Soldier', hp: 120, spd: 50, dmg: 16, rad: 16, col: '#64748b', xp: 5, coin: 3 },
      exploder: { name: 'Volatile Exploder', hp: 45, spd: 90, dmg: 35, rad: 15, col: '#ea580c', xp: 4, coin: 2 },
      juggernaut: { name: 'The Juggernaut', hp: 2800, spd: 60, dmg: 35, rad: 36, col: '#b91c1c', xp: 35, coin: 40 },
      plague_mother: { name: 'The Plague Mother', hp: 4200, spd: 55, dmg: 30, rad: 40, col: '#15803d', xp: 50, coin: 60 },
      harvester: { name: 'The Harvester', hp: 6500, spd: 80, dmg: 45, rad: 42, col: '#991b1b', xp: 100, coin: 100 },
    };

    const d = defs[type];
    // Scale enemy HP slightly with elapsed minutes
    const hpScale = 1 + (this.gameTime / 60) * 0.12;
    const finalHp = Math.round(d.hp * hpScale);

    const enemy: EnemyEntity = {
      id: ++this.enemyIdCounter,
      type,
      name: d.name,
      x,
      y,
      radius: d.rad,
      maxHealth: finalHp,
      health: finalHp,
      speed: d.spd,
      damage: d.dmg,
      color: d.col,
      xpValue: d.xp,
      coinValue: d.coin,
      isBoss: false,
      isDead: false,
      angle: 0,
      hitFlashTimer: 0,
      isFrozen: false,
      freezeTimer: 0,
      attackCooldown: type === 'spitter' ? 3.0 : 0,
      attackTimer: Math.random() * 2,
      telegraphActive: false,
      telegraphType: 'line',
      telegraphTimer: 0,
      telegraphMaxTimer: 1.0,
      telegraphRange: 200,
      telegraphRadius: 50,
    };

    this.enemies.push(enemy);
  }

  private spawnBoss(type: 'juggernaut' | 'plague_mother' | 'harvester') {
    this.spawnedBosses.add(type);
    this.bossActive = true;

    // Clear existing boss reference
    const angle = Math.random() * Math.PI * 2;
    const distance = 580;
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const bossDefs = {
      juggernaut: { name: 'The Juggernaut', hp: 3200, spd: 65, dmg: 35, rad: 36, col: '#991b1b' },
      plague_mother: { name: 'The Plague Mother', hp: 4800, spd: 55, dmg: 30, rad: 40, col: '#15803d' },
      harvester: { name: 'The Harvester', hp: 7500, spd: 85, dmg: 45, rad: 42, col: '#7f1d1d' },
    };

    const d = bossDefs[type];
    const boss: EnemyEntity = {
      id: ++this.enemyIdCounter,
      type,
      name: d.name,
      x,
      y,
      radius: d.rad,
      maxHealth: d.hp,
      health: d.hp,
      speed: d.spd,
      damage: d.dmg,
      color: d.col,
      xpValue: 80,
      coinValue: 75,
      isBoss: true,
      isDead: false,
      angle: 0,
      hitFlashTimer: 0,
      isFrozen: false,
      freezeTimer: 0,
      attackCooldown: 4.0,
      attackTimer: 2.0,
      telegraphActive: false,
      telegraphType: type === 'juggernaut' ? 'line' : 'circle',
      telegraphTimer: 0,
      telegraphMaxTimer: 1.2,
      telegraphRange: 320,
      telegraphRadius: 140,
    };

    this.enemies.push(boss);
    this.currentBoss = boss;

    soundManager.playBossWarning();
    soundManager.startMusic('boss');
    this.addScreenShake(18);
    this.callbacks.onBossSpawn(d.name);
  }

  private updateEnemies(dt: number) {
    // Populate spatial grid
    this.enemyGrid.insertAll(this.enemies);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Hit flash decay
      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;

      // Freeze logic
      if (e.isFrozen) {
        e.freezeTimer -= dt;
        if (e.freezeTimer <= 0) {
          e.isFrozen = false;
        } else {
          continue; // skip movement while frozen
        }
      }

      // Steer toward player
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      e.angle = Math.atan2(dy, dx);

      // Boss telegraph & special attacks
      if (e.isBoss) {
        this.updateBossAI(e, dt, d);
      } else if (e.type === 'spitter') {
        // Spitter keeps range around 260px and shoots acid projectile
        e.attackTimer += dt;
        if (e.attackTimer >= e.attackCooldown && d < 380) {
          e.attackTimer = 0;
          this.shootEnemyAcid(e);
        }
      } else if (e.type === 'screamer') {
        // Screamer periodically summons 2 runner minions
        e.attackTimer += dt;
        if (e.attackTimer >= 6.0) {
          e.attackTimer = 0;
          soundManager.playZombieGroan();
          this.spawnEnemy('runner');
          this.spawnEnemy('runner');
          this.pools.spawnParticle(e.x, e.y, 0, 0, 60, '#c084fc', 0.4, 'shockwave');
        }
      }

      // Separation from other enemies (avoid stacking)
      let sepX = 0;
      let sepY = 0;
      const nearby = this.enemyGrid.queryRadius(e.x, e.y, e.radius * 2);
      for (let j = 0; j < nearby.length; j++) {
        const other = nearby[j];
        if (other.id !== e.id) {
          const ndx = e.x - other.x;
          const ndy = e.y - other.y;
          const nd = Math.sqrt(ndx * ndx + ndy * ndy);
          if (nd > 0 && nd < e.radius + other.radius) {
            sepX += (ndx / nd) * 45;
            sepY += (ndy / nd) * 45;
          }
        }
      }

      // Move toward player
      const speed = e.speed;
      const dirX = d > 0 ? (dx / d) * speed : 0;
      const dirY = d > 0 ? (dy / d) * speed : 0;

      e.x += (dirX + sepX) * dt;
      e.y += (dirY + sepY) * dt;

      // Obstacle collision for enemies
      for (let k = 0; k < this.obstacles.length; k++) {
        const ob = this.obstacles[k];
        const od = dist(e.x, e.y, ob.x, ob.y);
        const minOd = e.radius + ob.radius;
        if (od < minOd && od > 0) {
          const push = normalize(e.x - ob.x, e.y - ob.y);
          e.x = ob.x + push.x * minOd;
          e.y = ob.y + push.y * minOd;
        }
      }

      // Player Damage Collision
      const hitDist = e.radius + this.player.radius;
      if (d < hitDist && !this.isDashing) {
        this.damagePlayer(e.damage);
      }
    }
  }

  private updateBossAI(boss: EnemyEntity, dt: number, distToPlayer: number) {
    boss.attackTimer += dt;

    if (boss.telegraphActive) {
      boss.telegraphTimer += dt;
      if (boss.telegraphTimer >= boss.telegraphMaxTimer) {
        boss.telegraphActive = false;
        boss.telegraphTimer = 0;

        // Execute Boss Special Move
        if (boss.type === 'juggernaut') {
          // Charge forward
          const chargeDist = 260;
          boss.x += Math.cos(boss.angle) * chargeDist;
          boss.y += Math.sin(boss.angle) * chargeDist;
          this.addScreenShake(14);
          soundManager.playExplosion();
          this.pools.spawnParticle(boss.x, boss.y, 0, 0, 120, '#ef4444', 0.4, 'shockwave');

          // Hit player if in range
          if (dist(boss.x, boss.y, this.player.x, this.player.y) < 130 && !this.isDashing) {
            this.damagePlayer(45);
          }
        } else if (boss.type === 'plague_mother') {
          // Spray 8 toxic acid bubbles in a 360 circle
          for (let a = 0; a < 8; a++) {
            const rad = (a * Math.PI * 2) / 8;
            this.pools.spawnProjectile(
              boss.x, boss.y,
              Math.cos(rad) * 240, Math.sin(rad) * 240,
              22, 1, 450, '#22c55e', 7, false, 15, true
            );
          }
          soundManager.playZombieGroan();
        } else if (boss.type === 'harvester') {
          // Ethereal scythe blast
          this.pools.emitBurst(boss.x, boss.y, 16, '#991b1b', 180, 'fire');
          for (let a = 0; a < 12; a++) {
            const rad = (a * Math.PI * 2) / 12;
            this.pools.spawnProjectile(
              boss.x, boss.y,
              Math.cos(rad) * 320, Math.sin(rad) * 320,
              28, 1, 600, '#ef4444', 6, false, 20, true
            );
          }
          this.addScreenShake(15);
        }
      }
    } else if (boss.attackTimer >= boss.attackCooldown) {
      boss.attackTimer = 0;
      boss.telegraphActive = true;
      boss.telegraphTimer = 0;
    }
  }

  private shootEnemyAcid(spitter: EnemyEntity) {
    const dir = normalize(this.player.x - spitter.x, this.player.y - spitter.y);
    const speed = 260;
    this.pools.spawnProjectile(
      spitter.x, spitter.y,
      dir.x * speed, dir.y * speed,
      spitter.damage, 1, 420,
      '#4ade80', 5.5, false, 10, true
    );
  }

  // --- Weapon Auto-Targeting & Firing ---
  private updateWeapons(dt: number) {
    // Find closest enemy for auto-aim
    const closestEnemy = this.enemyGrid.findClosest(this.player.x, this.player.y, 700);
    if (closestEnemy) {
      this.player.aimAngle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    // Fire each equipped weapon according to its fire rate
    this.weapons.forEach((entry, weaponId) => {
      const def = entry.def;
      entry.fireTimer += dt * this.stats.fireRateMult;
      const fireInterval = 1 / def.fireRate;

      if (entry.fireTimer >= fireInterval) {
        entry.fireTimer = 0;
        this.fireWeapon(weaponId, def, closestEnemy);
      }
    });
  }

  private fireWeapon(weaponId: WeaponId, def: any, target: EnemyEntity | null) {
    if (!target) return; // No targets in range

    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const projCount = def.projectileCount + this.stats.extraProjectiles;
    const baseDamage = def.damage * this.stats.baseDamageMult;
    const pierce = def.pierce + this.stats.pierceBonus;
    const radius = def.projectileRadius * this.stats.projectileSizeMult;

    // Trigger visual muzzle flash
    this.player.muzzleFlashTimer = 0.08;

    // Play synthesized weapon sound
    this.playWeaponAudio(weaponId);

    // Spread firing
    for (let i = 0; i < projCount; i++) {
      let angle = baseAngle;
      if (projCount > 1) {
        const spreadStep = def.spreadAngle / (projCount - 1);
        angle = baseAngle - def.spreadAngle / 2 + spreadStep * i;
      } else {
        // Minor spread variation for realism
        angle += (Math.random() - 0.5) * def.spreadAngle;
      }

      const vx = Math.cos(angle) * def.projectileSpeed;
      const vy = Math.sin(angle) * def.projectileSpeed;

      // Critical Hit roll
      const isCrit = Math.random() < (def.critChance + this.stats.critChance);
      const finalDmg = isCrit ? baseDamage * 2.2 : baseDamage;

      this.pools.spawnProjectile(
        this.player.x + Math.cos(angle) * 16,
        this.player.y + Math.sin(angle) * 16,
        vx, vy,
        Math.round(finalDmg),
        pierce,
        def.range,
        def.color,
        radius,
        isCrit,
        def.knockback,
        false,
        !!def.isEvolved
      );
    }
  }

  private playWeaponAudio(id: WeaponId) {
    switch (id) {
      case 'pistol':
      case 'phantom_revolver':
        soundManager.playPistol();
        break;
      case 'assault_rifle':
      case 'bullet_storm':
        soundManager.playAssaultRifle();
        break;
      case 'shotgun':
      case 'thunder_barrage':
        soundManager.playShotgun();
        break;
      case 'smg':
      case 'neon_shredder':
        soundManager.playSMG();
        break;
      case 'sniper':
      case 'rail_cannon':
        soundManager.playSniper();
        break;
      case 'flamethrower':
      case 'inferno_wave':
        soundManager.playFlamethrower();
        break;
    }
  }

  // --- Passive & Companion Abilities ---
  private updatePassiveAbilities(dt: number) {
    // 1. Orbital Blades Contact Damage
    if (this.player.hasOrbitalBlades) {
      const targets = this.enemyGrid.queryRadius(this.player.x, this.player.y, 110);
      for (let i = 0; i < targets.length; i++) {
        this.damageEnemy(targets[i], 12 * this.stats.baseDamageMult, false, 25);
      }
    }

    // 2. Chain Lightning Trigger
    if (this.passiveUpgrades.has('ability_chain_lightning')) {
      this.lightningTimer += dt;
      if (this.lightningTimer >= 5.0) {
        this.lightningTimer = 0;
        this.triggerChainLightning();
      }
    }

    // 3. Meteor Strike Trigger
    if (this.passiveUpgrades.has('ability_meteor_strike')) {
      this.meteorTimer += dt;
      if (this.meteorTimer >= 8.0) {
        this.meteorTimer = 0;
        this.triggerMeteorStrike();
      }
    }

    // 4. Freeze Pulse Trigger
    if (this.passiveUpgrades.has('ability_freeze_pulse')) {
      this.freezeTimer += dt;
      if (this.freezeTimer >= 10.0) {
        this.freezeTimer = 0;
        this.triggerFreezePulse();
      }
    }

    // 5. Guardian Drone Auto-Laser
    if (this.player.hasGuardianDrone) {
      this.droneFireTimer += dt;
      if (this.droneFireTimer >= 1.2) {
        this.droneFireTimer = 0;
        const target = this.enemyGrid.findClosest(this.player.x, this.player.y, 250);
        if (target) {
          const dir = normalize(target.x - this.player.x, target.y - this.player.y);
          this.pools.spawnProjectile(
            this.player.x, this.player.y,
            dir.x * 700, dir.y * 700,
            45 * this.stats.baseDamageMult, 2, 300,
            '#10b981', 3.5, true, 20
          );
          soundManager.playPistol();
        }
      }
    }
  }

  private triggerChainLightning() {
    const startTarget = this.enemyGrid.findClosest(this.player.x, this.player.y, 350);
    if (!startTarget) return;

    soundManager.playLightning();
    let current: EnemyEntity = startTarget;
    const hitList: EnemyEntity[] = [current];

    for (let chain = 0; chain < 6; chain++) {
      this.damageEnemy(current, 90 * this.stats.baseDamageMult, true, 30);
      this.pools.spawnParticle(current.x, current.y, 0, 0, 30, '#38bdf8', 0.2, 'shockwave');

      // Find next closest not already hit
      const nextCandidates = this.enemyGrid.queryRadius(current.x, current.y, 180);
      let nextTarget: EnemyEntity | null = null;
      for (let i = 0; i < nextCandidates.length; i++) {
        if (!hitList.includes(nextCandidates[i])) {
          nextTarget = nextCandidates[i];
          break;
        }
      }
      if (!nextTarget) break;
      hitList.push(nextTarget);
      current = nextTarget;
    }
  }

  private triggerMeteorStrike() {
    const target = this.enemyGrid.findClosest(this.player.x, this.player.y, 450);
    const mx = target ? target.x : this.player.x + (Math.random() - 0.5) * 300;
    const my = target ? target.y : this.player.y + (Math.random() - 0.5) * 300;

    soundManager.playExplosion();
    this.addScreenShake(20);

    // Visual impact crater particle
    this.pools.spawnParticle(mx, my, 0, 0, 160, '#ef4444', 0.5, 'shockwave');
    this.pools.emitBurst(mx, my, 25, '#f97316', 220, 'fire');
    this.renderer.addDecal(mx, my, 'rgba(120, 53, 15, 0.45)', 45);

    const hit = this.enemyGrid.queryRadius(mx, my, 160);
    for (let i = 0; i < hit.length; i++) {
      this.damageEnemy(hit[i], 220 * this.stats.baseDamageMult, true, 80);
    }
  }

  private triggerFreezePulse() {
    soundManager.playXpPickup();
    this.pools.spawnParticle(this.player.x, this.player.y, 0, 0, 220, '#38bdf8', 0.4, 'shockwave');

    const enemies = this.enemyGrid.queryRadius(this.player.x, this.player.y, 220);
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].isFrozen = true;
      enemies[i].freezeTimer = 3.5;
      this.damageEnemy(enemies[i], 25 * this.stats.baseDamageMult, false, 0);
    }
  }

  // --- Projectile Physics & Collisions ---
  private updateProjectiles(dt: number) {
    for (let i = 0; i < this.pools.projectiles.length; i++) {
      const p = this.pools.projectiles[i];
      if (!p.active) continue;

      const stepX = p.vx * dt;
      const stepY = p.vy * dt;
      p.x += stepX;
      p.y += stepY;
      p.distTraveled += Math.sqrt(stepX * stepX + stepY * stepY);

      if (p.distTraveled >= p.maxRange) {
        p.active = false;
        continue;
      }

      // Check collision
      if (p.isEnemy) {
        // Collide with player
        if (dist(p.x, p.y, this.player.x, this.player.y) < p.radius + this.player.radius) {
          p.active = false;
          if (!this.isDashing) {
            this.damagePlayer(p.damage);
          }
        }
      } else {
        // Collide with enemies using spatial query
        const candidates = this.enemyGrid.queryRadius(p.x, p.y, p.radius + 20);
        for (let j = 0; j < candidates.length; j++) {
          const e = candidates[j];
          if (e.isDead) continue;

          if (distSq(p.x, p.y, e.x, e.y) <= (p.radius + e.radius) * (p.radius + e.radius)) {
            // Damage enemy
            this.damageEnemy(e, p.damage, p.isCrit, p.knockback);

            // Evolved Thunder Barrage chain reaction
            if (p.isEvolved && p.color === '#3b82f6') {
              const chainTarget = this.enemyGrid.findClosest(e.x, e.y, 140);
              if (chainTarget && chainTarget.id !== e.id) {
                this.damageEnemy(chainTarget, p.damage * 0.7, false, 15);
              }
            }

            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              p.active = false;
              break;
            }
          }
        }
      }
    }
  }

  // --- Damage Systems ---
  public damageEnemy(enemy: EnemyEntity, rawDmg: number, isCrit: boolean, knockback = 20) {
    if (enemy.isDead) return;

    // Armored zombie resistance
    let finalDmg = rawDmg;
    if (enemy.type === 'armored' && !isCrit) {
      finalDmg *= 0.45;
    }

    enemy.health -= finalDmg;
    enemy.hitFlashTimer = 0.12;
    this.totalDamageDealt += finalDmg;

    // Knockback
    if (knockback > 0 && !enemy.isBoss) {
      const push = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
      enemy.x += push.x * knockback;
      enemy.y += push.y * knockback;
    }

    // Spawn floating combat text
    if (saveManager.getData().settings.damageNumbers) {
      const text = Math.round(finalDmg).toString();
      const col = isCrit ? '#facc15' : enemy.type === 'armored' ? '#94a3b8' : '#ffffff';
      this.pools.spawnText(enemy.x, enemy.y - enemy.radius, text, col, isCrit);
    }

    // Sparks
    this.pools.emitBurst(enemy.x, enemy.y, isCrit ? 6 : 3, isCrit ? '#facc15' : enemy.color, 90, 'spark');

    // Death check
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: EnemyEntity) {
    enemy.isDead = true;
    this.kills++;

    // Blood decal on the ground
    this.renderer.addDecal(enemy.x, enemy.y, 'rgba(127, 29, 29, 0.35)', enemy.radius * 1.5);

    // Exploder death explosion
    if (enemy.type === 'exploder') {
      soundManager.playExplosion();
      this.pools.spawnParticle(enemy.x, enemy.y, 0, 0, 110, '#f97316', 0.3, 'shockwave');
      this.pools.emitBurst(enemy.x, enemy.y, 16, '#ea580c', 160, 'fire');

      // Explode nearby enemies & player
      const explTargets = this.enemyGrid.queryRadius(enemy.x, enemy.y, 110);
      for (let i = 0; i < explTargets.length; i++) {
        if (explTargets[i].id !== enemy.id) {
          this.damageEnemy(explTargets[i], 90, false, 40);
        }
      }
      if (dist(enemy.x, enemy.y, this.player.x, this.player.y) < 110 && !this.isDashing) {
        this.damagePlayer(25);
      }
    }

    // Drop XP Gems & Coins
    const xp = enemy.xpValue;
    this.pools.spawnXPOrb(enemy.x, enemy.y, xp, false);

    // Chance to drop coin
    if (Math.random() < 0.25 || enemy.isBoss) {
      this.pools.spawnXPOrb(enemy.x + 8, enemy.y + 8, enemy.coinValue, true);
    }

    // Boss Defeated
    if (enemy.isBoss) {
      this.bossesKilled++;
      this.bossActive = false;
      this.currentBoss = null;
      soundManager.playEvolution();
      soundManager.startMusic('ambient');
      this.callbacks.onBossDefeated(enemy.name);

      // Reward Chest with guaranteed upgrades + bonus coins
      const bonusCoins = 150 + Math.floor(this.gameTime * 0.25);
      const rewardCards = this.generateUpgradeCards(3);
      this.callbacks.onBossChest(bonusCoins, rewardCards);
    }
  }

  public damagePlayer(amount: number) {
    if (this.stats.health <= 0) return;

    // Challenge check: Ghost Protocol instant fail
    if (this.challengeId && CHALLENGES[this.challengeId].noDamageRule) {
      this.stats.health = 0;
      this.handlePlayerDeath();
      return;
    }

    // Apply Armor reduction
    const effectiveDamage = Math.max(1, amount * (1 - this.stats.armor));
    this.stats.health = Math.max(0, this.stats.health - effectiveDamage);

    this.player.hitFlashTimer = 0.18;
    this.addScreenShake(8);
    soundManager.playHurt();

    this.pools.emitBurst(this.player.x, this.player.y, 8, '#ef4444', 100, 'blood');

    if (this.stats.health <= 0) {
      this.handlePlayerDeath();
    }
  }

  private handlePlayerDeath() {
    this.stop();
    soundManager.stopMusic();
    soundManager.playExplosion();

    saveManager.recordRun({
      survivedTime: Math.floor(this.gameTime),
      zombiesKilled: this.kills,
      bossesKilled: this.bossesKilled,
      coinsEarned: this.coinsEarned,
      mode: this.mode,
      isVictory: false,
      challengeId: this.challengeId,
    });

    this.callbacks.onGameOver(false, {
      time: Math.floor(this.gameTime),
      kills: this.kills,
      bosses: this.bossesKilled,
      coins: this.coinsEarned,
      damage: Math.round(this.totalDamageDealt),
      level: this.level,
    });
  }

  // --- Collectibles (XP & Coins) ---
  private updateCollectibles(dt: number) {
    const magnetRadius = this.stats.xpMagnetRadius;

    for (let i = 0; i < this.pools.xpOrbs.length; i++) {
      const orb = this.pools.xpOrbs[i];
      if (!orb.active) continue;

      orb.pulseTimer += dt * 4;

      const d = dist(orb.x, orb.y, this.player.x, this.player.y);

      // Magnet suction trigger
      if (d <= magnetRadius || orb.magnetized) {
        orb.magnetized = true;
        const norm = normalize(this.player.x - orb.x, this.player.y - orb.y);
        const pullSpeed = Math.min(850, 280 + (1 - d / magnetRadius) * 450);

        orb.vx = norm.x * pullSpeed;
        orb.vy = norm.y * pullSpeed;
      } else {
        orb.vx *= 0.92;
        orb.vy *= 0.92;
      }

      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;

      // Pickup trigger
      if (d <= this.player.radius + 10) {
        orb.active = false;
        if (orb.isCoin) {
          const armoryBonus = 1 + saveManager.getData().permanentUpgrades.coinBonusRank * 0.1;
          const gained = Math.round(orb.value * armoryBonus);
          this.coinsEarned += gained;
          saveManager.addCoins(gained);
          soundManager.playClick();
        } else {
          this.addXp(orb.value);
        }
      }
    }
  }

  private addXp(amount: number) {
    this.currentXp += amount;
    soundManager.playXpPickup();

    if (this.currentXp >= this.requiredXp) {
      this.currentXp -= this.requiredXp;
      this.level++;
      this.requiredXp = Math.round(this.requiredXp * 1.25);

      soundManager.playLevelUp();
      this.pause();

      const cards = this.generateUpgradeCards(3);
      this.callbacks.onLevelUp(cards);
    }
  }

  // --- Upgrade System & Weapon Evolutions ---
  public generateUpgradeCards(count = 3): UpgradeCard[] {
    const cards: UpgradeCard[] = [];

    // 1. Check for WEAPON EVOLUTION possibilities first
    this.weapons.forEach((entry, weaponId) => {
      const evoRecipe = EVOLUTION_RECIPES[weaponId];
      if (evoRecipe && entry.level >= 5 && !entry.def.isEvolved) {
        const hasReqPassive = (this.passiveUpgrades.get(evoRecipe.requiredUpgrade) || 0) >= 1;
        if (hasReqPassive) {
          const evoDef = WEAPON_DEFINITIONS[evoRecipe.evolutionId];
          cards.push({
            id: `evolution_${evoRecipe.evolutionId}`,
            type: `evolution_${evoRecipe.evolutionId}` as UpgradeType,
            title: `EVOLVE: ${evoDef.name}`,
            description: evoDef.description,
            rarity: 'legendary',
            icon: evoDef.iconName,
            currentLevel: entry.level,
            maxLevel: 5,
            isEvolution: true,
          });
        }
      }
    });

    // 2. Weapon Unlocks (if less than 4 equipped weapons)
    if (this.weapons.size < 4 && (!this.challengeId || !CHALLENGES[this.challengeId].lockedWeapon)) {
      const weaponPool: WeaponId[] = ['assault_rifle', 'shotgun', 'smg', 'sniper', 'flamethrower'];
      for (const wId of weaponPool) {
        if (!this.weapons.has(wId)) {
          const def = WEAPON_DEFINITIONS[wId];
          cards.push({
            id: `unlock_${wId}`,
            type: `weapon_${wId}` as UpgradeType,
            title: `New Weapon: ${def.name}`,
            description: def.description,
            rarity: 'epic',
            icon: def.iconName,
            currentLevel: 0,
            maxLevel: 5,
          });
          break;
        }
      }
    }

    // 3. Passive Stat & Ability Upgrades Pool
    const allPassives: { type: UpgradeType; title: string; desc: string; icon: string; rarity: UpgradeRarity }[] = [
      { type: 'damage', title: 'Hollow-Point Ammo', desc: '+15% Weapon & Ability Damage', icon: 'zap', rarity: 'common' },
      { type: 'attack_speed', title: 'Rapid Chamber', desc: '+12% Weapon Fire Rate', icon: 'wind', rarity: 'common' },
      { type: 'move_speed', title: 'Sprint Hydraulics', desc: '+10% Movement Speed', icon: 'footprints', rarity: 'common' },
      { type: 'max_health', title: 'Tactical Plating', desc: '+25 Maximum Health & Heals 25 HP', icon: 'heart', rarity: 'common' },
      { type: 'crit_chance', title: 'Laser Sights', desc: '+6% Critical Strike Chance', icon: 'crosshair', rarity: 'rare' },
      { type: 'projectile_count', title: 'Split Barrel', desc: '+1 Additional Projectile to all weapons', icon: 'layers', rarity: 'epic' },
      { type: 'projectile_size', title: 'Heavy Warheads', desc: '+20% Projectile Size & Area Effect', icon: 'disc', rarity: 'rare' },
      { type: 'xp_magnet', title: 'Vacuum Core', desc: '+30% XP & Coin Suction Radius', icon: 'magnet', rarity: 'common' },
      { type: 'armor', title: 'Nanoweave Vest', desc: '+10% Damage Resistance', icon: 'shield', rarity: 'rare' },
      { type: 'health_regen', title: 'Bio-Stimulant', desc: '+0.8 Health Regeneration per second', icon: 'activity', rarity: 'epic' },
      { type: 'pierce', title: 'Tungsten Darts', desc: '+1 Bullet Pierce Count', icon: 'target', rarity: 'rare' },
      { type: 'dash_cooldown', title: 'Overdrive Thruster', desc: '-18% Dash Cooldown Delay', icon: 'zap', rarity: 'rare' },
      // Abilities:
      { type: 'ability_orbital_blades', title: 'Orbital Buzzsaws', desc: 'Deploy 3 rotating energy blades slicing nearby zombies', icon: 'shield', rarity: 'epic' },
      { type: 'ability_chain_lightning', title: 'Tesla Coil', desc: 'Periodic lightning arcing between up to 6 zombies', icon: 'zap', rarity: 'epic' },
      { type: 'ability_meteor_strike', title: 'Orbital Strike', desc: 'Calls down explosive artillery on dense hordes every 8s', icon: 'target', rarity: 'legendary' },
      { type: 'ability_freeze_pulse', title: 'Cryo Emitter', desc: 'Freezes all nearby zombies solid every 10s', icon: 'snowflake', rarity: 'rare' },
      { type: 'ability_guardian_drone', title: 'Guardian Drone', desc: 'Combat drone hovers and auto-targets threats with lasers', icon: 'bot', rarity: 'legendary' },
    ];

    // Shuffle and pick until we have required count
    const shuffled = [...allPassives].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length && cards.length < count; i++) {
      const p = shuffled[i];
      const curLvl = this.passiveUpgrades.get(p.type) || 0;
      if (curLvl < 5) {
        cards.push({
          id: p.type,
          type: p.type,
          title: p.title,
          description: p.desc,
          rarity: p.rarity,
          icon: p.icon,
          currentLevel: curLvl,
          maxLevel: 5,
        });
      }
    }

    return cards.slice(0, count);
  }

  public applyUpgrade(card: UpgradeCard) {
    // 1. Weapon Evolution
    if (card.isEvolution) {
      const evoId = card.type.replace('evolution_', '') as WeaponId;
      const evoDef = WEAPON_DEFINITIONS[evoId];
      if (evoDef && evoDef.evolvesFrom) {
        const prevDef = this.weapons.get(evoDef.evolvesFrom);
        const prevName = prevDef ? prevDef.def.name : 'Weapon';
        this.weapons.delete(evoDef.evolvesFrom);
        this.weapons.set(evoId, {
          level: 5,
          fireTimer: 0,
          def: { ...evoDef },
        });

        soundManager.playEvolution();
        this.callbacks.onEvolutionUnlocked(prevName, evoDef.name);
      }
      this.resume();
      return;
    }

    // 2. Weapon Unlocks
    if (card.type.startsWith('weapon_')) {
      const wId = card.type.replace('weapon_', '') as WeaponId;
      if (WEAPON_DEFINITIONS[wId]) {
        this.weapons.set(wId, {
          level: 1,
          fireTimer: 0,
          def: { ...WEAPON_DEFINITIONS[wId] },
        });
      }
      this.resume();
      return;
    }

    // 3. Abilities & Passives
    const curLevel = (this.passiveUpgrades.get(card.type) || 0) + 1;
    this.passiveUpgrades.set(card.type, curLevel);

    switch (card.type) {
      case 'damage':
        this.stats.baseDamageMult += 0.15;
        break;
      case 'attack_speed':
        this.stats.fireRateMult += 0.12;
        break;
      case 'move_speed':
        this.stats.moveSpeed *= 1.10;
        break;
      case 'max_health':
        this.stats.maxHealth += 25;
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 25);
        break;
      case 'crit_chance':
        this.stats.critChance += 0.06;
        break;
      case 'projectile_count':
        this.stats.extraProjectiles += 1;
        break;
      case 'projectile_size':
        this.stats.projectileSizeMult += 0.20;
        break;
      case 'xp_magnet':
        this.stats.xpMagnetRadius *= 1.30;
        break;
      case 'armor':
        this.stats.armor = Math.min(0.65, this.stats.armor + 0.10);
        break;
      case 'health_regen':
        this.stats.healthRegen += 0.8;
        break;
      case 'pierce':
        this.stats.pierceBonus += 1;
        break;
      case 'dash_cooldown':
        this.stats.dashCooldownMult *= 0.82;
        break;
      case 'ability_orbital_blades':
        this.player.hasOrbitalBlades = true;
        break;
      case 'ability_guardian_drone':
        this.player.hasGuardianDrone = true;
        break;
    }

    this.resume();
  }

  // --- Win / Loss Conditions ---
  private checkWinConditions() {
    if (this.mode === 'survival') {
      // 15 minutes (900s) survival goal
      if (this.gameTime >= 900 && !this.bossActive) {
        this.triggerVictory();
      }
    } else if (this.challengeId) {
      const ch = CHALLENGES[this.challengeId];
      if (ch.targetKills && this.kills >= ch.targetKills) {
        this.triggerVictory();
      } else if (ch.targetTime && this.gameTime >= ch.targetTime) {
        this.triggerVictory();
      }
    }
  }

  private triggerVictory() {
    this.stop();
    soundManager.stopMusic();
    soundManager.playEvolution();

    // Reward bonus coins for victory
    const victoryCoins = 300 + (this.challengeId ? CHALLENGES[this.challengeId].rewardCoins : 500);
    this.coinsEarned += victoryCoins;
    saveManager.addCoins(victoryCoins);

    saveManager.recordRun({
      survivedTime: Math.floor(this.gameTime),
      zombiesKilled: this.kills,
      bossesKilled: this.bossesKilled,
      coinsEarned: this.coinsEarned,
      mode: this.mode,
      isVictory: true,
      challengeId: this.challengeId,
    });

    this.callbacks.onGameOver(true, {
      time: Math.floor(this.gameTime),
      kills: this.kills,
      bosses: this.bossesKilled,
      coins: this.coinsEarned,
      damage: Math.round(this.totalDamageDealt),
      level: this.level,
    });
  }

  // --- Particles & Text Updates ---
  private updateFloatingTexts(dt: number) {
    for (let i = 0; i < this.pools.floatingTexts.length; i++) {
      const t = this.pools.floatingTexts[i];
      if (!t.active) continue;

      t.life += dt;
      t.y += t.vy * dt;
      t.alpha = 1 - t.life / t.maxLife;

      if (t.life >= t.maxLife) {
        t.active = false;
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.pools.particles.length; i++) {
      const pt = this.pools.particles[i];
      if (!pt.active) continue;

      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha = 1 - pt.life / pt.maxLife;

      if (pt.type === 'shockwave') {
        pt.size += dt * 320;
      }

      if (pt.life >= pt.maxLife) {
        pt.active = false;
      }
    }
  }

  public addScreenShake(amount: number) {
    if (saveManager.getData().settings.screenShake) {
      this.screenShake = Math.min(25, this.screenShake + amount);
    }
  }

  // --- Render Orchestration ---
  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Apply Screen Shake
    let offsetX = 0;
    let offsetY = 0;
    if (this.screenShake > 0) {
      offsetX = (Math.random() - 0.5) * this.screenShake;
      offsetY = (Math.random() - 0.5) * this.screenShake;
    }

    const rc: RenderContext = {
      ctx,
      width: w,
      height: h,
      cameraX: this.cameraX + offsetX,
      cameraY: this.cameraY + offsetY,
      screenShake: this.screenShake,
    };

    // 1. Background Ground Canvas Tiling
    this.renderer.renderBackground(rc);

    // 2. Obstacles
    this.renderer.renderObstacles(rc, this.obstacles);

    // 3. XP Crystals & Coins
    this.renderer.renderCollectibles(rc, this.pools);

    // 4. Enemies & Boss Telegraphs
    this.renderer.renderEnemies(rc, this.enemies, this.gameTime);

    // 5. Player Survivor
    this.renderer.renderPlayer(rc, this.player, this.gameTime);

    // 6. Projectiles
    this.renderer.renderProjectiles(rc, this.pools);

    // 7. Particles
    this.renderer.renderParticles(rc, this.pools);

    // 8. Darkness & Flashlight Vignette
    if (saveManager.getData().settings.showVignette) {
      this.renderer.renderLighting(rc, this.player, MAP_CONFIGS[this.mapId]);
    }

    // 9. Floating Combat Damage Numbers
    this.renderer.renderFloatingTexts(rc, this.pools);
  }

  // Sync state to React HUD
  private syncHUD() {
    const dashCooldownPct = this.dashCooldownTimer > 0
      ? this.dashCooldownTimer / (this.baseDashCooldown * this.stats.dashCooldownMult)
      : 0;

    const abilityCooldownPct = !this.activeAbility.isReady
      ? this.activeAbility.timer / this.activeAbility.cooldown
      : 0;

    const eqNames: string[] = [];
    this.weapons.forEach(w => eqNames.push(w.def.name));

    this.callbacks.onHUDUpdate({
      health: Math.max(0, this.stats.health),
      maxHealth: this.stats.maxHealth,
      level: this.level,
      currentXp: this.currentXp,
      requiredXp: this.requiredXp,
      timer: Math.floor(this.gameTime),
      kills: this.kills,
      coinsCollected: this.coinsEarned,
      dashCooldownPct,
      abilityCooldownPct,
      abilityReady: this.activeAbility.isReady,
      bossActive: this.bossActive,
      bossHealthPct: this.currentBoss ? Math.max(0, this.currentBoss.health / this.currentBoss.maxHealth) : 0,
      bossName: this.currentBoss ? this.currentBoss.name : '',
      equippedWeapons: eqNames,
      isVictory: false,
    });
  }
}
