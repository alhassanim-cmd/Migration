export interface Projectile {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierceRemaining: number;
  maxRange: number;
  distTraveled: number;
  color: string;
  radius: number;
  isCrit: boolean;
  isEnemy: boolean;
  knockback: number;
  isEvolved?: boolean;
}

export interface XPOrb {
  active: boolean;
  x: number;
  y: number;
  value: number;
  isCoin: boolean;
  vx: number;
  vy: number;
  magnetized: boolean;
  pulseTimer: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
}

export interface GameParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'fire' | 'blood' | 'shockwave' | 'ice';
}

export class ObjectPools {
  public projectiles: Projectile[] = [];
  public xpOrbs: XPOrb[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: GameParticle[] = [];

  constructor(maxProjectiles = 600, maxXp = 400, maxTexts = 120, maxParticles = 500) {
    for (let i = 0; i < maxProjectiles; i++) {
      this.projectiles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        damage: 0,
        pierceRemaining: 1,
        maxRange: 500,
        distTraveled: 0,
        color: '#fff',
        radius: 3,
        isCrit: false,
        isEnemy: false,
        knockback: 10,
      });
    }

    for (let i = 0; i < maxXp; i++) {
      this.xpOrbs.push({
        active: false,
        x: 0,
        y: 0,
        value: 1,
        isCoin: false,
        vx: 0,
        vy: 0,
        magnetized: false,
        pulseTimer: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < maxTexts; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -30,
        text: '',
        color: '#fff',
        alpha: 1,
        scale: 1,
        life: 0,
        maxLife: 0.8,
      });
    }

    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#fff',
        alpha: 1,
        life: 0,
        maxLife: 0.4,
        type: 'spark',
      });
    }
  }

  public spawnProjectile(
    x: number, y: number, vx: number, vy: number,
    damage: number, pierce: number, range: number,
    color: string, radius: number, isCrit: boolean,
    knockback: number, isEnemy = false, isEvolved = false
  ): Projectile | null {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.damage = damage;
        p.pierceRemaining = pierce;
        p.maxRange = range;
        p.distTraveled = 0;
        p.color = color;
        p.radius = radius;
        p.isCrit = isCrit;
        p.knockback = knockback;
        p.isEnemy = isEnemy;
        p.isEvolved = isEvolved;
        return p;
      }
    }
    return null;
  }

  public spawnXPOrb(x: number, y: number, value: number, isCoin = false): XPOrb | null {
    for (let i = 0; i < this.xpOrbs.length; i++) {
      const o = this.xpOrbs[i];
      if (!o.active) {
        o.active = true;
        o.x = x;
        o.y = y;
        o.value = value;
        o.isCoin = isCoin;
        o.vx = (Math.random() - 0.5) * 50;
        o.vy = (Math.random() - 0.5) * 50;
        o.magnetized = false;
        o.pulseTimer = Math.random() * Math.PI * 2;
        return o;
      }
    }
    return null;
  }

  public spawnText(x: number, y: number, text: string, color: string, isCrit = false): FloatingText | null {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      if (!t.active) {
        t.active = true;
        t.x = x + (Math.random() - 0.5) * 16;
        t.y = y;
        t.vy = isCrit ? -65 : -40;
        t.text = text;
        t.color = color;
        t.alpha = 1;
        t.scale = isCrit ? 1.4 : 1.0;
        t.life = 0;
        t.maxLife = isCrit ? 0.9 : 0.6;
        return t;
      }
    }
    return null;
  }

  public spawnParticle(
    x: number, y: number, vx: number, vy: number,
    size: number, color: string, maxLife: number,
    type: 'spark' | 'smoke' | 'fire' | 'blood' | 'shockwave' | 'ice' = 'spark'
  ): GameParticle | null {
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (!pt.active) {
        pt.active = true;
        pt.x = x;
        pt.y = y;
        pt.vx = vx;
        pt.vy = vy;
        pt.size = size;
        pt.color = color;
        pt.alpha = 1;
        pt.life = 0;
        pt.maxLife = maxLife;
        pt.type = type;
        return pt;
      }
    }
    return null;
  }

  public emitBurst(
    x: number, y: number, count: number, color: string,
    speed: number, type: 'spark' | 'smoke' | 'fire' | 'blood' | 'ice' = 'spark'
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = 2 + Math.random() * 3;
      const life = 0.2 + Math.random() * 0.35;
      this.spawnParticle(x, y, vx, vy, size, color, life, type);
    }
  }

  public clearAll() {
    this.projectiles.forEach(p => p.active = false);
    this.xpOrbs.forEach(o => o.active = false);
    this.floatingTexts.forEach(t => t.active = false);
    this.particles.forEach(pt => pt.active = false);
  }
}
