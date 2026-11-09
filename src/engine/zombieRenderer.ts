import { EnemyType } from '../types/game';

export interface ZombieRenderEntity {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  color: string;
  angle: number;
  hitFlashTimer: number;
  isFrozen: boolean;
  isBoss: boolean;
  isDead: boolean;
  // Animation & Telegraph fields
  walkCycle?: number;
  variant?: number;
  attackTimer?: number;
  telegraphActive?: boolean;
  telegraphType?: 'line' | 'circle';
  telegraphTimer?: number;
  telegraphMaxTimer?: number;
  telegraphRange?: number;
  telegraphRadius?: number;
  deathTimer?: number; // 0 to 1 for dissolving
}

export class ZombieRenderer {
  // Render an individual zombie with distinct anatomy, animations and visual variants
  public static renderZombie(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    e: ZombieRenderEntity,
    gameTime: number
  ) {
    const isFlashed = (e.hitFlashTimer || 0) > 0;
    const walk = e.walkCycle || gameTime * (e.speed * 0.12) + e.id;
    const variant = e.variant !== undefined ? e.variant : e.id % 3;

    // 1. Telegraph indicator (Bosses / Special enemies)
    if (e.telegraphActive) {
      this.drawTelegraph(ctx, sx, sy, e);
    }

    // 2. Realistic Directional Drop Shadow
    this.drawShadow(ctx, sx, sy, e.radius, e.isBoss);

    // 3. Zombie Body
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(e.angle || 0);

    if (e.isFrozen) {
      ctx.fillStyle = '#38bdf8';
    }

    // Render based on distinct enemy archetype
    if (e.isBoss) {
      this.drawBoss(ctx, e.type, e.radius, walk, isFlashed, gameTime, e.id);
    } else {
      switch (e.type) {
        case 'runner':
          this.drawRunner(ctx, e.radius, walk, isFlashed, e.id);
          break;
        case 'brute':
          this.drawBrute(ctx, e.radius, walk, isFlashed, e.id);
          break;
        case 'spitter':
          this.drawSpitter(ctx, e.radius, walk, isFlashed, gameTime, e.id);
          break;
        case 'screamer':
          this.drawScreamer(ctx, e.radius, walk, isFlashed, gameTime, e.id);
          break;
        case 'armored':
          this.drawArmored(ctx, e.radius, walk, isFlashed, e.id);
          break;
        case 'exploder':
          this.drawExploder(ctx, e.radius, walk, isFlashed, gameTime, e.id);
          break;
        case 'walker':
        default:
          this.drawWalker(ctx, e.radius, walk, isFlashed, variant, e.id);
          break;
      }
    }

    ctx.restore();

    // 4. Health Bar for Bosses and damaged large enemies
    this.drawHealthBar(ctx, sx, sy, e);
  }

  // Drop Shadow
  private static drawShadow(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    radius: number,
    isBoss: boolean
  ) {
    ctx.fillStyle = isBoss ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy + radius * 0.75, radius * 1.05, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. WALKER: Common civilian infected with 3 visual variants
  private static drawWalker(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    variant: number,
    seed: number
  ) {
    const stride = Math.sin(walk) * 5;
    const armSwing = Math.cos(walk) * 4;

    // Variant Colors:
    // 0: Blue flannel & jeans
    // 1: White bloodied office shirt & dark slacks
    // 2: Yellow/orange construction vest & hardhat
    const shirtColor = isFlashed ? '#fff' : variant === 0 ? '#1e3a8a' : variant === 1 ? '#e2e8f0' : '#d97706';
    const pantsColor = isFlashed ? '#fff' : variant === 0 ? '#1e293b' : variant === 1 ? '#0f172a' : '#334155';
    const skinColor = isFlashed ? '#fff' : ['#475569', '#3f3f46', '#334155'][(seed + variant) % 3];

    // Shambling Shuffling Legs
    ctx.fillStyle = pantsColor;
    ctx.fillRect(-6, -stride - 4, 4, 8);
    ctx.fillRect(2, stride - 4, 4, 8);

    // Torso (Torn Clothes with bloody rips)
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blood stain on shirt
    if (!isFlashed) {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(-1, 1, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outstretched Grasping Arms (lunging forward)
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    // Left arm
    ctx.roundRect(radius * 0.4, -radius * 0.6 + armSwing * 0.5, radius * 0.7, 3.5, 2);
    // Right arm
    ctx.roundRect(radius * 0.3, radius * 0.35 - armSwing * 0.5, radius * 0.75, 3.5, 2);
    ctx.fill();

    // Rotten Claws
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(radius * 1.1, -radius * 0.6 + armSwing * 0.5, 2.5, 3.5);
    ctx.fillRect(radius * 1.05, radius * 0.35 - armSwing * 0.5, 2.5, 3.5);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(radius * 0.1, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Construction Hardhat for variant 2
    if (variant === 2 && !isFlashed) {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(radius * 0.1, 0, radius * 0.58, -Math.PI / 1.5, Math.PI / 1.5);
      ctx.fill();
    }

    // Sunken yellow eyes
    if (!isFlashed) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(radius * 0.45, -2.5, 1.5, 1.5);
      ctx.fillRect(radius * 0.45, 1.5, 1.5, 1.5);
    }
  }

  // 2. RUNNER: Feral, hunched, fast-paced quad/biped infected with bloody claws
  private static drawRunner(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    seed: number
  ) {
    const fastSprint = Math.sin(walk * 1.6) * 7;

    // Lean crimson/flayed body
    const bodyColor = isFlashed ? '#fff' : '#991b1b';
    const muscleColor = isFlashed ? '#fff' : '#dc2626';

    // Digging Legs
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-7, -fastSprint - 3, 3.5, 10);
    ctx.fillRect(3, fastSprint - 3, 3.5, 10);

    // Hunched Aerodynamic Torso
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.15, radius * 0.65, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Exposed red muscle striations
    if (!isFlashed) {
      ctx.strokeStyle = muscleColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -3);
      ctx.lineTo(radius * 0.4, 0);
      ctx.stroke();
    }

    // Predatory Forward Claws
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(radius * 0.5, -radius * 0.55, radius * 0.8, 3.5);
    ctx.fillRect(radius * 0.5, radius * 0.3, radius * 0.8, 3.5);

    // Sharp talons
    ctx.fillStyle = '#000000';
    ctx.fillRect(radius * 1.25, -radius * 0.55, 3, 3.5);
    ctx.fillRect(radius * 1.25, radius * 0.3, 3, 3.5);

    // Feral Snarling Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(radius * 0.4, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Feral Yellow Glowing Eyes
    if (!isFlashed) {
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 6;
      ctx.fillRect(radius * 0.7, -2.5, 2, 2);
      ctx.fillRect(radius * 0.7, 1.5, 2, 2);
      ctx.shadowBlur = 0;
    }
  }

  // 3. BRUTE: Towering muscular giant with protruding bone spurs
  private static drawBrute(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    seed: number
  ) {
    const stomp = Math.sin(walk * 0.7) * 4;

    const stoneColor = isFlashed ? '#fff' : '#27272a';
    const fleshColor = isFlashed ? '#fff' : '#3f3f46';
    const boneColor = isFlashed ? '#fff' : '#e4e4e7';

    // Massive Stomping Legs
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(-9, -stomp - 8, 7, 14, 3);
    ctx.roundRect(4, stomp - 8, 7, 14, 3);
    ctx.fill();

    // Colossal Muscular Torso
    ctx.fillStyle = fleshColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.05, radius * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bulging Shoulder Armor / Neck Mass
    ctx.fillStyle = stoneColor;
    ctx.beginPath();
    ctx.arc(-2, -radius * 0.7, radius * 0.5, 0, Math.PI * 2);
    ctx.arc(-2, radius * 0.7, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Bone Spurs protruding from spine & shoulders
    if (!isFlashed) {
      ctx.fillStyle = boneColor;
      for (let s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.2, s * radius * 0.85);
        ctx.lineTo(-radius * 0.7, s * (radius * 1.15));
        ctx.lineTo(-radius * 0.5, s * radius * 0.65);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Heavy Fists
    ctx.fillStyle = stoneColor;
    ctx.beginPath();
    ctx.arc(radius * 0.7, -radius * 0.65, 6.5, 0, Math.PI * 2);
    ctx.arc(radius * 0.7, radius * 0.65, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Head (Sunken into muscular shoulders)
    ctx.fillStyle = fleshColor;
    ctx.beginPath();
    ctx.arc(radius * 0.25, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Red Glowing Eyes
    if (!isFlashed) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(radius * 0.55, -2.5, 2.5, 2.5);
      ctx.fillRect(radius * 0.55, 1.5, 2.5, 2.5);
    }
  }

  // 4. SPITTER: Mutated bloat with glowing acid sacs and dripping venom
  private static drawSpitter(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number,
    seed: number
  ) {
    const pulse = Math.sin(gameTime * 6 + seed) * 0.15 + 1.0;
    const bodyColor = isFlashed ? '#fff' : '#14532d';

    // Thin Shuffling Legs
    ctx.fillStyle = '#052e16';
    ctx.fillRect(-5, -6, 3.5, 8);
    ctx.fillRect(2, -6, 3.5, 8);

    // Torso
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Toxic Acid Sac on Back
    ctx.save();
    ctx.fillStyle = isFlashed ? '#fff' : '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-radius * 0.35, 0, radius * 0.55 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Smaller side pustules
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.4, radius * 0.3 * pulse, 0, Math.PI * 2);
    ctx.arc(-radius * 0.2, radius * 0.4, radius * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Split Open Acid Maw
    ctx.fillStyle = isFlashed ? '#fff' : '#052e16';
    ctx.beginPath();
    ctx.arc(radius * 0.35, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Dripping glowing green bile
    ctx.fillStyle = '#86efac';
    ctx.fillRect(radius * 0.65, -1.5, 3.5, 3);
  }

  // 5. SCREAMER: Elongated banshee silhouette with ultrasonic distortion rings
  private static drawScreamer(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number,
    seed: number
  ) {
    const bodyColor = isFlashed ? '#fff' : '#581c87';
    const skinColor = isFlashed ? '#fff' : '#7e22ce';

    // Thin wispy shroud
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.85, radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Clenched raised arms in howling pose
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.roundRect(radius * 0.2, -radius * 0.7, radius * 0.8, 3, 2);
    ctx.roundRect(radius * 0.2, radius * 0.5, radius * 0.8, 3, 2);
    ctx.fill();

    // Elongated Shrieking Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(radius * 0.3, 0, radius * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Wide Howling Maw (black void)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(radius * 0.6, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Sonic ripple distortion rings radiating from mouth
    const ringPulse = (gameTime * 3) % 1;
    ctx.strokeStyle = `rgba(192, 132, 252, ${1 - ringPulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(radius * 0.6, 0, radius * (0.4 + ringPulse * 1.2), -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }

  // 6. ARMORED: Tactical Riot Zombie in cracked steel helmet and bulletproof vest
  private static drawArmored(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    seed: number
  ) {
    const march = Math.sin(walk * 0.8) * 4;
    const steelColor = isFlashed ? '#fff' : '#475569';
    const darkArmor = isFlashed ? '#fff' : '#1e293b';

    // Heavy Combat Boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -march - 5, 5, 10);
    ctx.fillRect(2, march - 5, 5, 10);

    // Ballistic Vest Body
    ctx.fillStyle = darkArmor;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.6, -radius * 0.8, radius * 1.2, radius * 1.6, 4);
    ctx.fill();

    // Heavy Steel Chest Plate with rivets
    ctx.fillStyle = steelColor;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.4, -radius * 0.6, radius * 0.9, radius * 1.2, 3);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cracked Riot Helmet with shattered visor
    ctx.fillStyle = steelColor;
    ctx.beginPath();
    ctx.arc(radius * 0.2, 0, radius * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Dark Visor with bullet spider-crack
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(radius * 0.45, -3, 3, 6);
    if (!isFlashed) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(radius * 0.45, 0);
      ctx.lineTo(radius * 0.65, -2);
      ctx.lineTo(radius * 0.65, 2);
      ctx.stroke();
    }
  }

  // 7. EXPLODER: Swollen volatile bloat with pulsing magma blister clusters
  private static drawExploder(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number,
    seed: number
  ) {
    const pulse = Math.sin(gameTime * 8 + seed) * 0.18 + 1.0;
    const bodyColor = isFlashed ? '#fff' : '#7c2d12';

    // Wobbling Staggering Legs
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-5, -5, 4, 8);
    ctx.fillRect(2, -5, 4, 8);

    // Swollen distended Torso
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Clusters of glowing magma blisters & vents
    ctx.save();
    ctx.fillStyle = isFlashed ? '#fff' : '#f97316';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 12;

    // Center magma cyst
    ctx.beginPath();
    ctx.arc(-radius * 0.1, -radius * 0.25, radius * 0.45 * pulse, 0, Math.PI * 2);
    ctx.arc(-radius * 0.1, radius * 0.25, radius * 0.4 * pulse, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, 0, radius * 0.35 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Blister inner core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-radius * 0.1, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(-radius * 0.1, radius * 0.25, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // --- BOSSES ---
  private static drawBoss(
    ctx: CanvasRenderingContext2D,
    type: EnemyType,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number,
    seed: number
  ) {
    switch (type) {
      case 'juggernaut':
        this.drawJuggernaut(ctx, radius, walk, isFlashed, gameTime);
        break;
      case 'plague_mother':
        this.drawPlagueMother(ctx, radius, walk, isFlashed, gameTime);
        break;
      case 'harvester':
        this.drawHarvester(ctx, radius, walk, isFlashed, gameTime);
        break;
      default:
        this.drawJuggernaut(ctx, radius, walk, isFlashed, gameTime);
        break;
    }
  }

  // BOSS 1: The Juggernaut — Iron-plated Behemoth with Glowing Red Visor & Cleaver Arm
  private static drawJuggernaut(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number
  ) {
    const stomp = Math.sin(walk * 0.5) * 5;

    // Heavy Stomping Greaves
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -stomp - 12, 10, 24);
    ctx.fillRect(4, stomp - 12, 10, 24);

    // Massive Welded Steel Carapace
    ctx.fillStyle = isFlashed ? '#fff' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-radius * 0.7, -radius * 0.85, radius * 1.4, radius * 1.7, 8);
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spiked Pauldrons
    ctx.fillStyle = isFlashed ? '#fff' : '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-radius * 0.5, -radius * 1.15, radius * 0.8, radius * 0.45, 4);
    ctx.roundRect(-radius * 0.5, radius * 0.7, radius * 0.8, radius * 0.45, 4);
    ctx.fill();

    // Spikes on Pauldrons
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.3 + i * 8, -radius * 1.15);
      ctx.lineTo(-radius * 0.2 + i * 8, -radius * 1.35);
      ctx.lineTo(-radius * 0.1 + i * 8, -radius * 1.15);
      ctx.fill();
    }

    // Heavy Cleaver Weapon Arm
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(radius * 0.5, -radius * 0.4, radius * 0.9, 10, 2);
    ctx.fill();
    // Cleaver blade
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(radius * 1.3, -radius * 0.6);
    ctx.lineTo(radius * 1.6, -radius * 0.3);
    ctx.lineTo(radius * 1.1, radius * 0.2);
    ctx.closePath();
    ctx.fill();

    // Reinforced Steel Helmet with Glowing Red Sensor
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(radius * 0.2, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Red Optical Slit
    ctx.save();
    ctx.fillStyle = isFlashed ? '#fff' : '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 15;
    ctx.fillRect(radius * 0.4, -4, 5, 8);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // BOSS 2: The Plague Mother — Toxic Hive Queen with undulating tendrils & bio-hazard sacs
  private static drawPlagueMother(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number
  ) {
    const pulse = Math.sin(gameTime * 4) * 0.12 + 1.0;

    // Undulating Tendril Legs
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 4;
    for (let t = 0; t < 6; t++) {
      const ta = (t * Math.PI) / 3;
      const tw = Math.sin(gameTime * 6 + t) * 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * (radius * 0.6), Math.sin(ta) * (radius * 0.6));
      ctx.lineTo(Math.cos(ta) * (radius * 1.15) + tw, Math.sin(ta) * (radius * 1.15) + tw);
      ctx.stroke();
    }

    // Massive Abdomen / Egg Cluster
    ctx.fillStyle = isFlashed ? '#fff' : '#064e3b';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, 0, radius * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Emerald Bio-Sacs
    ctx.save();
    ctx.fillStyle = isFlashed ? '#fff' : '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(-radius * 0.4, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.arc(-radius * 0.4, radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.arc(-radius * 0.1, 0, radius * 0.45 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Queen Head / Maw
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(radius * 0.45, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Acid Mandibles
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(radius * 0.7, 0, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // BOSS 3: The Harvester — Ethereal Shadow Reaper with Crimson Scythe
  private static drawHarvester(
    ctx: CanvasRenderingContext2D,
    radius: number,
    walk: number,
    isFlashed: boolean,
    gameTime: number
  ) {
    const floatWobble = Math.sin(gameTime * 4) * 4;

    // Shadowy Cloak Tendrils Trailing
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -radius * 0.6);
    ctx.lineTo(radius * 0.4, -radius * 0.7);
    ctx.lineTo(radius * 0.2, radius * 0.7);
    ctx.lineTo(-radius * 0.8, radius * 0.6);
    ctx.lineTo(-radius * 1.1 + floatWobble, 0);
    ctx.closePath();
    ctx.fill();

    // Ethereal Reaper Hood & Face Void
    ctx.fillStyle = isFlashed ? '#fff' : '#020617';
    ctx.beginPath();
    ctx.arc(radius * 0.1, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Crimson Eyes
    ctx.save();
    ctx.fillStyle = isFlashed ? '#fff' : '#ef4444';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.fillRect(radius * 0.4, -4, 3, 3);
    ctx.fillRect(radius * 0.4, 1, 3, 3);
    ctx.restore();

    // Large Crimson Energy Scythe
    ctx.save();
    ctx.translate(radius * 0.3, radius * 0.5);
    ctx.rotate(Math.PI / 4 + Math.sin(gameTime * 3) * 0.15);

    // Scythe Shaft
    ctx.fillStyle = '#475569';
    ctx.fillRect(-2, -radius * 0.9, 4, radius * 1.8);

    // Glowing Curved Scythe Blade
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.9);
    ctx.quadraticCurveTo(radius * 0.9, -radius * 1.4, radius * 1.3, -radius * 0.6);
    ctx.quadraticCurveTo(radius * 0.7, -radius * 1.0, 0, -radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Boss Attack Telegraphs
  private static drawTelegraph(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    e: ZombieRenderEntity
  ) {
    ctx.save();
    if (e.telegraphType === 'line') {
      const range = e.telegraphRange || 280;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 16;
      ctx.setLineDash([14, 8]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(e.angle) * range, sy + Math.sin(e.angle) * range);
      ctx.stroke();
    } else {
      const rad = e.telegraphRadius || 120;
      const progress = (e.telegraphTimer || 0) / (e.telegraphMaxTimer || 1);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, rad * Math.min(1, progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Health Bar for Bosses & Damaged Elites
  private static drawHealthBar(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    e: ZombieRenderEntity
  ) {
    if (e.health < e.maxHealth || e.isBoss) {
      const barW = e.isBoss ? e.radius * 2.8 : e.radius * 2.0;
      const barH = e.isBoss ? 7 : 4;
      const barX = sx - barW / 2;
      const barY = sy - e.radius - (e.isBoss ? 22 : 14);

      // Bar BG
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // Bar Fill
      const pct = Math.max(0, e.health / e.maxHealth);
      ctx.fillStyle = e.isBoss ? '#ef4444' : '#22c55e';
      ctx.fillRect(barX, barY, barW * pct, barH);

      // Boss Name Tag
      if (e.isBoss) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.name, sx, barY - 4);
      }
    }
  }
}
