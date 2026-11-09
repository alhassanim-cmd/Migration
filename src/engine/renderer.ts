import { MapConfig, EnemyType, WeaponId, CharacterId } from '../types/game';
import { ObjectPools } from './objectPool';
import { CharacterRenderer, SurvivorRenderState } from './characterRenderer';
import { ZombieRenderer, ZombieRenderEntity } from './zombieRenderer';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
  screenShake: number;
  graphicsQuality?: 'low' | 'medium' | 'high';
}

export class GameRenderer {
  private groundCanvas: HTMLCanvasElement;
  private groundCtx: CanvasRenderingContext2D;
  private currentMapId: string = '';

  // Environmental atmospheric particles (drifting smoke/fog/ash)
  private ambientParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

  constructor() {
    this.groundCanvas = document.createElement('canvas');
    this.groundCanvas.width = 2048;
    this.groundCanvas.height = 2048;
    this.groundCtx = this.groundCanvas.getContext('2d', { alpha: false })!;

    // Initialize 40 ambient drifting dust / ash particles
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        vx: 10 + Math.random() * 20,
        vy: -5 - Math.random() * 15,
        size: 1.5 + Math.random() * 3,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  }

  // Pre-render rich layered textures for each environment
  public prepareMap(mapConfig: MapConfig) {
    if (this.currentMapId === mapConfig.id) return;
    this.currentMapId = mapConfig.id;

    const ctx = this.groundCtx;
    const w = this.groundCanvas.width;
    const h = this.groundCanvas.height;

    // 1. Base dark pavement / floor
    ctx.fillStyle = mapConfig.floorColor;
    ctx.fillRect(0, 0, w, h);

    // 2. Concrete sidewalk / asphalt tile borders
    ctx.strokeStyle = mapConfig.gridColor;
    ctx.lineWidth = 1.5;
    const step = 64;
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 3. Map-specific high-fidelity details
    if (mapConfig.id === 'city') {
      this.paintCityGround(ctx, w, h);
    } else if (mapConfig.id === 'industrial') {
      this.paintIndustrialGround(ctx, w, h);
    } else if (mapConfig.id === 'quarantine') {
      this.paintQuarantineGround(ctx, w, h);
    }
  }

  private paintCityGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Road asphalt highways with dashed yellow centerlines
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'; // weathered road yellow
    ctx.lineWidth = 6;
    ctx.setLineDash([35, 25]);
    for (let y = 250; y < h; y += 450) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Pedestrian crosswalks with zebra stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = 200; x < w; x += 550) {
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(x + i * 26, 80, 16, 90);
        ctx.fillRect(x + i * 26, 950, 16, 90);
      }
    }

    // Sewer storm grates
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const gx = (i * 223) % (w - 150) + 75;
      const gy = (i * 317) % (h - 150) + 75;
      ctx.fillRect(gx, gy, 44, 28);
      ctx.strokeRect(gx, gy, 44, 28);
      // Grate slits
      ctx.strokeStyle = '#1e293b';
      for (let s = 6; s < 40; s += 6) {
        ctx.beginPath();
        ctx.moveTo(gx + s, gy + 3);
        ctx.lineTo(gx + s, gy + 25);
        ctx.stroke();
      }
    }

    // Asphalt cracks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 25; c++) {
      let cx = (c * 179) % (w - 100) + 50;
      let cy = (c * 283) % (h - 100) + 50;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let seg = 0; seg < 4; seg++) {
        cx += (Math.random() - 0.5) * 30;
        cy += (Math.random() - 0.5) * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Scattered newspapers & urban litter
    ctx.fillStyle = 'rgba(214, 211, 209, 0.18)';
    for (let p = 0; p < 45; p++) {
      const px = (p * 97) % w;
      const py = (p * 149) % h;
      ctx.fillRect(px, py, 9, 6);
    }
  }

  private paintIndustrialGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Metal diamond plates and hazard chevrons
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let y = 100; y < h; y += 300) {
      ctx.fillRect(0, y, w, 40);
    }

    // Industrial warning chevrons
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    for (let i = 0; i < 20; i++) {
      const x = (i * 150) % w;
      const y = (i * 240) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 25, y);
      ctx.lineTo(x + 40, y + 20);
      ctx.lineTo(x + 15, y + 20);
      ctx.closePath();
      ctx.fill();
    }

    // Toxic green slime leaks
    for (let i = 0; i < 18; i++) {
      const px = (i * 137) % (w - 200) + 100;
      const py = (i * 241) % (h - 200) + 100;
      const rad = 40 + (i % 5) * 16;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
      grad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
      grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.12)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Metal pipeline tracks
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 3;
    for (let x = 300; x < w; x += 600) {
      ctx.fillRect(x, 0, 24, h);
      ctx.strokeRect(x, 0, 24, h);
    }
  }

  private paintQuarantineGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Red emergency quarantine grids
    for (let i = 0; i < 16; i++) {
      const x = (i * 179) % (w - 300) + 150;
      const y = (i * 223) % (h - 300) + 150;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(x, y, 160, 160);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.strokeRect(x, y, 160, 160);

      // Biohazard caution marker
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 80, y + 80, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Stamp permanent blood / scorch decal to the ground
  public addDecal(x: number, y: number, color = 'rgba(153, 27, 27, 0.3)', radius = 24) {
    const ctx = this.groundCtx;
    const w = this.groundCanvas.width;
    const h = this.groundCanvas.height;

    const gx = ((x % w) + w) % w;
    const gy = ((y % h) + h) % h;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(gx, gy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Realistic splatter droplets
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const d = radius * (0.8 + Math.random() * 0.8);
      ctx.beginPath();
      ctx.arc(gx + Math.cos(angle) * d, gy + Math.sin(angle) * d, 2.5 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Seamless repeating background tiling
  public renderBackground(rc: RenderContext) {
    const { ctx, width, height, cameraX, cameraY } = rc;
    const gw = this.groundCanvas.width;
    const gh = this.groundCanvas.height;

    const startTileX = Math.floor((cameraX - width / 2) / gw) - 1;
    const endTileX = Math.ceil((cameraX + width / 2) / gw) + 1;
    const startTileY = Math.floor((cameraY - height / 2) / gh) - 1;
    const endTileY = Math.ceil((cameraY + height / 2) / gh) + 1;

    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        const screenX = tx * gw - cameraX + width / 2;
        const screenY = ty * gh - cameraY + height / 2;
        ctx.drawImage(this.groundCanvas, screenX, screenY);
      }
    }
  }

  // Render atmospheric ambient particles (drifting dust/smoke)
  public renderAtmosphere(rc: RenderContext, gameTime: number) {
    if (rc.graphicsQuality === 'low') return;

    const { ctx, width, height, cameraX, cameraY } = rc;
    ctx.save();

    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      // World position to screen position with parallax
      const sx = ((p.x - cameraX * 0.7) % width + width) % width;
      const sy = ((p.y - cameraY * 0.7) % height + height) % height;

      ctx.fillStyle = `rgba(214, 211, 209, ${p.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Render obstacles with 2.5D depth, metallic highlights, and cast shadows
  public renderObstacles(rc: RenderContext, obstacles: any[]) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < obstacles.length; i++) {
      const ob = obstacles[i];
      const sx = ob.x - cameraX + width / 2;
      const sy = ob.y - cameraY + height / 2;

      // Frustum culling
      if (sx < -120 || sx > width + 120 || sy < -120 || sy > height + 120) continue;

      // Realistic directional drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(sx + 8, sy + 14, ob.width * 0.55, ob.height * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ob.angle || 0);

      if (ob.type === 'cars') {
        // Abandoned Police Cruiser / Civilian Vehicle
        const isPolice = ob.color === '#0369a1';
        ctx.fillStyle = ob.color || '#334155';
        ctx.beginPath();
        ctx.roundRect(-ob.width / 2, -ob.height / 2, ob.width, ob.height, 9);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hood & Trunk Panel Lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-ob.width * 0.28, -ob.height / 2);
        ctx.lineTo(-ob.width * 0.28, ob.height / 2);
        ctx.moveTo(ob.width * 0.28, -ob.height / 2);
        ctx.lineTo(ob.width * 0.28, ob.height / 2);
        ctx.stroke();

        // Windshields (Tinted glass with shattered bullet cracks)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-ob.width * 0.35, -ob.height * 0.32, ob.width * 0.7, ob.height * 0.64, 4);
        ctx.fill();

        // Roof
        ctx.fillStyle = isPolice ? '#ffffff' : '#475569';
        ctx.fillRect(-ob.width * 0.2, -ob.height * 0.24, ob.width * 0.4, ob.height * 0.48);

        // Police Emergency Lightbar
        if (isPolice) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-ob.width * 0.05, -ob.height * 0.22, 6, 8);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-ob.width * 0.05, ob.height * 0.06, 6, 8);
        }

        // Tires
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-ob.width * 0.4, -ob.height / 2 - 2, 12, 4);
        ctx.fillRect(ob.width * 0.25, -ob.height / 2 - 2, 12, 4);
        ctx.fillRect(-ob.width * 0.4, ob.height / 2 - 2, 12, 4);
        ctx.fillRect(ob.width * 0.25, ob.height / 2 - 2, 12, 4);
      } else if (ob.type === 'barrels') {
        // Toxic Chemical Drum
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, ob.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Reinforced Metal Rings
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ob.radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing Biohazard Center
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, ob.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Military Barricade with Yellow-Black Hazard Stripes
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-ob.width / 2, -ob.height / 2, ob.width, ob.height);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-ob.width / 2, -ob.height / 2, ob.width, ob.height);

        // Hazard Chevrons
        ctx.fillStyle = '#f59e0b';
        for (let s = -ob.width / 2 + 5; s < ob.width / 2; s += 14) {
          ctx.fillRect(s, -ob.height / 2, 6, ob.height);
        }
      }

      ctx.restore();
    }
  }

  // Render XP Crystals & Coins with 2.5D diamond facets, floating hover, and glow
  public renderCollectibles(rc: RenderContext, pools: ObjectPools) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < pools.xpOrbs.length; i++) {
      const orb = pools.xpOrbs[i];
      if (!orb.active) continue;

      const sx = orb.x - cameraX + width / 2;
      const sy = orb.y - cameraY + height / 2;
      if (sx < -30 || sx > width + 30 || sy < -30 || sy > height + 30) continue;

      ctx.save();
      ctx.translate(sx, sy);

      if (orb.isCoin) {
        // 3D Spinning Gold Coin
        const spin = Math.sin(orb.pulseTimer * 3);
        const cw = Math.max(2, Math.abs(spin) * 7);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(2, 6, cw, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer Rim
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(0, 0, cw, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold Face
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, cw * 0.8, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer Highlight
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(-1, -1, cw * 0.4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Floating Roguelite XP Crystal with Facets & Glow
        const floatBob = Math.sin(orb.pulseTimer * 2) * 2;
        const sz = (orb.value >= 10 ? 8.5 : orb.value >= 5 ? 7 : 5.5);

        // Shadow on ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, sz + 3 - floatBob * 0.5, sz * 0.75, sz * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crystal body floating
        ctx.translate(0, floatBob);

        const glowCol = orb.value >= 10 ? '#c084fc' : orb.value >= 5 ? '#60a5fa' : '#22d3ee';
        const coreCol = orb.value >= 10 ? '#a855f7' : orb.value >= 5 ? '#3b82f6' : '#06b6d4';

        if (rc.graphicsQuality !== 'low') {
          ctx.shadowColor = glowCol;
          ctx.shadowBlur = 10;
        }

        // Left Facet (Darker)
        ctx.fillStyle = coreCol;
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(-sz * 0.85, 0);
        ctx.lineTo(0, sz);
        ctx.closePath();
        ctx.fill();

        // Right Facet (Bright)
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.85, 0);
        ctx.lineTo(0, sz);
        ctx.closePath();
        ctx.fill();

        // Center Brilliant Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -sz * 0.6);
        ctx.lineTo(sz * 0.35, 0);
        ctx.lineTo(0, sz * 0.6);
        ctx.lineTo(-sz * 0.35, 0);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  // Render Enemies via the upgraded 2.5D ZombieRenderer
  public renderEnemies(rc: RenderContext, enemies: any[], gameTime: number) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead) continue;

      const sx = e.x - cameraX + width / 2;
      const sy = e.y - cameraY + height / 2;
      // Frustum culling with generous buffer
      if (sx < -90 || sx > width + 90 || sy < -90 || sy > height + 90) continue;

      ZombieRenderer.renderZombie(ctx, sx, sy, e as ZombieRenderEntity, gameTime);
    }
  }

  // Render Player Survivor via the upgraded 2.5D CharacterRenderer
  public renderPlayer(rc: RenderContext, player: any, gameTime: number, charId: CharacterId, weaponId: WeaponId) {
    const { ctx, width, height, cameraX, cameraY } = rc;
    const sx = player.x - cameraX + width / 2;
    const sy = player.y - cameraY + height / 2;

    const moveSpd = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const moveAngle = moveSpd > 1 ? Math.atan2(player.vy, player.vx) : player.aimAngle;

    const renderState: SurvivorRenderState = {
      x: player.x,
      y: player.y,
      radius: player.radius,
      color: player.color,
      aimAngle: player.aimAngle || 0,
      moveAngle,
      moveSpeed: Math.min(1, moveSpd / 180),
      walkCycle: player.walkCycle || gameTime * 14,
      recoil: player.muzzleFlashTimer > 0 ? 1 : 0,
      hitFlashTimer: player.hitFlashTimer || 0,
      muzzleFlashTimer: player.muzzleFlashTimer || 0,
      characterId: charId,
      equippedWeaponId: weaponId,
      hasOrbitalBlades: !!player.hasOrbitalBlades,
      hasGuardianDrone: !!player.hasGuardianDrone,
      isDashing: !!player.isDashing,
      isDead: !!player.isDead,
      deathProgress: player.deathProgress || 0,
      dashTrail: player.dashTrail || [],
    };

    CharacterRenderer.render(ctx, sx, sy, renderState, gameTime);
  }

  // Render Projectiles with bright tracers, laser beams, and evolved bursts
  public renderProjectiles(rc: RenderContext, pools: ObjectPools) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < pools.projectiles.length; i++) {
      const p = pools.projectiles[i];
      if (!p.active) continue;

      const sx = p.x - cameraX + width / 2;
      const sy = p.y - cameraY + height / 2;
      if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) continue;

      ctx.save();
      ctx.translate(sx, sy);

      if (rc.graphicsQuality !== 'low' && (p.isEvolved || p.isCrit)) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tracer Tail
      const angle = Math.atan2(p.vy, p.vx);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-Math.cos(angle) * (p.radius * 4.2), -Math.sin(angle) * (p.radius * 4.2));
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // Render Game Particles (sparks, blood, smoke, fire, shockwaves)
  public renderParticles(rc: RenderContext, pools: ObjectPools) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < pools.particles.length; i++) {
      const pt = pools.particles[i];
      if (!pt.active) continue;

      const sx = pt.x - cameraX + width / 2;
      const sy = pt.y - cameraY + height / 2;
      if (sx < -30 || sx > width + 30 || sy < -30 || sy > height + 30) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);

      if (pt.type === 'shockwave') {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy, pt.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(sx, sy, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Render Floating Damage Numbers with bold outlines and crit starbursts
  public renderFloatingTexts(rc: RenderContext, pools: ObjectPools) {
    const { ctx, width, height, cameraX, cameraY } = rc;

    for (let i = 0; i < pools.floatingTexts.length; i++) {
      const t = pools.floatingTexts[i];
      if (!t.active) continue;

      const sx = t.x - cameraX + width / 2;
      const sy = t.y - cameraY + height / 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `bold ${Math.round(15 * t.scale)}px Chakra Petch, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.text, sx, sy);
      ctx.fillText(t.text, sx, sy);

      ctx.restore();
    }
  }

  // Cinematic Dynamic Lighting with Soft Ambient Darkness and Flashlight Beam
  public renderLighting(rc: RenderContext, player: any, mapConfig: MapConfig) {
    const { ctx, width, height, cameraX, cameraY } = rc;
    const px = player.x - cameraX + width / 2;
    const py = player.y - cameraY + height / 2;

    ctx.save();
    // Ambient darkness layer (calibrated so zombies are always clearly readable!)
    const darkness = ctx.createRadialGradient(
      px, py, 70,
      px, py, Math.max(width, height) * 0.75
    );
    darkness.addColorStop(0, 'rgba(0, 0, 0, 0)');
    darkness.addColorStop(0.35, 'rgba(6, 8, 14, 0.45)');
    darkness.addColorStop(0.7, 'rgba(4, 5, 10, 0.78)');
    darkness.addColorStop(1, 'rgba(2, 2, 6, 0.92)');

    ctx.fillStyle = darkness;
    ctx.fillRect(0, 0, width, height);

    // Flashlight beam ahead of survivor
    const aim = player.aimAngle || 0;
    const beamLen = 340;
    const beamAngle = 0.58; // ~33 degrees cone

    const lightGrad = ctx.createRadialGradient(px, py, 18, px, py, beamLen);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
    lightGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.09)');
    lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, beamLen, aim - beamAngle / 2, aim + beamAngle / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
