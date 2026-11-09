import { CharacterId, WeaponId } from '../types/game';

export interface SurvivorRenderState {
  x: number;
  y: number;
  radius: number;
  color: string;
  aimAngle: number;
  moveAngle: number;
  moveSpeed: number; // 0 to 1
  walkCycle: number;
  recoil: number; // 0 to 1
  hitFlashTimer: number;
  muzzleFlashTimer: number;
  characterId: CharacterId;
  equippedWeaponId: WeaponId;
  hasOrbitalBlades: boolean;
  hasGuardianDrone: boolean;
  isDashing: boolean;
  isDead: boolean;
  deathProgress: number; // 0 to 1
  dashTrail: { x: number; y: number; angle: number; alpha: number }[];
}

export class CharacterRenderer {
  // Render the player survivor with 2.5D perspective, clothing, weapon, and animations
  public static render(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    state: SurvivorRenderState,
    gameTime: number
  ) {
    // 1. Dash trail ghosts
    if (state.dashTrail && state.dashTrail.length > 0) {
      for (let i = 0; i < state.dashTrail.length; i++) {
        const t = state.dashTrail[i];
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.globalAlpha = t.alpha * 0.45;
        this.drawShadow(ctx, state.characterId, 0.4);
        this.drawSurvivorBody(ctx, state.characterId, state.equippedWeaponId, 0, 0, 0, false, true);
        ctx.restore();
      }
    }

    // 2. Drop shadow under survivor
    ctx.save();
    ctx.translate(sx, sy);
    this.drawShadow(ctx, state.characterId, 0.55);
    ctx.restore();

    // 3. Death animation if dying
    if (state.isDead) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(state.aimAngle + Math.PI / 2);
      ctx.globalAlpha = Math.max(0, 1 - state.deathProgress * 0.8);
      // Fallen survivor body collapsed
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Blood pool
      ctx.fillStyle = 'rgba(185, 28, 28, 0.65)';
      ctx.beginPath();
      ctx.arc(4, 2, 12 * Math.min(1, state.deathProgress * 1.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 4. Companion abilities (Orbital Blades & Guardian Drone)
    if (state.hasOrbitalBlades) {
      this.drawOrbitalBlades(ctx, sx, sy, gameTime);
    }
    if (state.hasGuardianDrone) {
      this.drawGuardianDrone(ctx, sx, sy, gameTime);
    }

    // 5. Survivor Body with independent Leg Movement and Upper-Body Aiming
    ctx.save();
    ctx.translate(sx, sy);

    const isFlashed = state.hitFlashTimer > 0;

    // Draw Legs oriented toward movement angle (strafing support)
    ctx.save();
    const legAngle = state.moveSpeed > 0.05 ? state.moveAngle : state.aimAngle;
    ctx.rotate(legAngle);
    this.drawSurvivorLegs(ctx, state.characterId, state.walkCycle, state.moveSpeed);
    ctx.restore();

    // Draw Torso, Arms, Head, Equipment and Weapon oriented toward Aim Target
    ctx.save();
    ctx.rotate(state.aimAngle);
    this.drawSurvivorBody(
      ctx,
      state.characterId,
      state.equippedWeaponId,
      state.recoil,
      state.walkCycle,
      state.muzzleFlashTimer,
      isFlashed,
      false
    );
    ctx.restore();

    ctx.restore();
  }

  // Realistic directional drop shadow
  private static drawShadow(ctx: CanvasRenderingContext2D, charId: CharacterId, alpha: number) {
    const isHeavy = charId === 'steele';
    const rx = isHeavy ? 20 : 16;
    const ry = isHeavy ? 13 : 10;

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(3, 8, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dynamic animated tactical legs
  private static drawSurvivorLegs(
    ctx: CanvasRenderingContext2D,
    charId: CharacterId,
    walkCycle: number,
    moveSpeed: number
  ) {
    const stride = moveSpeed > 0.05 ? Math.sin(walkCycle) * 9 : 0;
    const isHeavy = charId === 'steele';
    const legSpacing = isHeavy ? 9 : 7;
    const bootWidth = isHeavy ? 8 : 6;
    const bootLength = isHeavy ? 14 : 11;

    // Pants color per survivor
    let pantsColor = '#1e293b'; // Raven dark slate
    if (charId === 'steele') pantsColor = '#27272a'; // Heavy carbon
    if (charId === 'ghost') pantsColor = '#18181b'; // Stealth shadow
    if (charId === 'pyre') pantsColor = '#78350f'; // Heavy hazmat brown

    // Boots color
    const bootColor = '#0f172a';
    const soleColor = '#475569';

    // Left Leg
    ctx.save();
    ctx.translate(-legSpacing, stride);
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-bootWidth / 2, -bootLength / 2, bootWidth, bootLength, 3);
    ctx.fill();
    // Tactical boot toe cap
    ctx.fillStyle = bootColor;
    ctx.fillRect(-bootWidth / 2, bootLength / 2 - 4, bootWidth, 4);
    ctx.fillStyle = soleColor;
    ctx.fillRect(-bootWidth / 2, bootLength / 2 - 1, bootWidth, 1.5);
    ctx.restore();

    // Right Leg
    ctx.save();
    ctx.translate(legSpacing, -stride);
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-bootWidth / 2, -bootLength / 2, bootWidth, bootLength, 3);
    ctx.fill();
    ctx.fillStyle = bootColor;
    ctx.fillRect(-bootWidth / 2, bootLength / 2 - 4, bootWidth, 4);
    ctx.fillStyle = soleColor;
    ctx.fillRect(-bootWidth / 2, bootLength / 2 - 1, bootWidth, 1.5);
    ctx.restore();
  }

  // Detailed 2.5D survivor upper body with custom character uniforms & weapons
  private static drawSurvivorBody(
    ctx: CanvasRenderingContext2D,
    charId: CharacterId,
    weaponId: WeaponId,
    recoil: number,
    walkCycle: number,
    muzzleFlashTimer: number,
    isFlashed: boolean,
    isGhostTrail: boolean
  ) {
    const recoilKick = recoil * 5; // weapon kickback distance
    const bodyBob = Math.cos(walkCycle * 2) * 1.0;

    // --- Character specific color schemes & equipment details ---
    switch (charId) {
      case 'raven':
        this.drawRaven(ctx, weaponId, recoilKick, bodyBob, muzzleFlashTimer, isFlashed, isGhostTrail);
        break;
      case 'steele':
        this.drawSteele(ctx, weaponId, recoilKick, bodyBob, muzzleFlashTimer, isFlashed, isGhostTrail);
        break;
      case 'ghost':
        this.drawGhost(ctx, weaponId, recoilKick, bodyBob, muzzleFlashTimer, isFlashed, isGhostTrail);
        break;
      case 'pyre':
        this.drawPyre(ctx, weaponId, recoilKick, bodyBob, muzzleFlashTimer, isFlashed, isGhostTrail);
        break;
      default:
        this.drawRaven(ctx, weaponId, recoilKick, bodyBob, muzzleFlashTimer, isFlashed, isGhostTrail);
        break;
    }
  }

  // RAVEN: Tactical Scout with dark military jacket, red accents, tactical belt & precision firearm
  private static drawRaven(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    recoil: number,
    bob: number,
    muzzleTimer: number,
    isFlashed: boolean,
    isGhost: boolean
  ) {
    // Torso Base
    ctx.fillStyle = isFlashed ? '#ffffff' : isGhost ? '#38bdf8' : '#1e293b'; // dark tactical navy
    ctx.beginPath();
    ctx.ellipse(0, bob, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Armor Carrier with red tactical accent chevron
    if (!isGhost) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-7, -8 + bob, 14, 16, 4);
      ctx.fill();

      // Red tactical chevron
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-3, -2 + bob);
      ctx.lineTo(0, 2 + bob);
      ctx.lineTo(3, -2 + bob);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      // Ammo pouches & tactical harness
      ctx.fillStyle = '#334155';
      ctx.fillRect(-6, -7 + bob, 3, 4);
      ctx.fillRect(3, -7 + bob, 3, 4);
    }

    // Shoulders
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#38bdf8' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(-2, -10 + bob, 5, 0, Math.PI * 2);
    ctx.arc(-2, 10 + bob, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head: Scout headset, tactical goggles, cropped hair
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#60a5fa' : '#334155'; // dark hair/cap
    ctx.beginPath();
    ctx.arc(-2, bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Visor / Goggles
    ctx.fillStyle = isFlashed ? '#fff' : '#06b6d4'; // bright cyan visor lens
    ctx.fillRect(1, -4 + bob, 3.5, 8);

    // Headset mic
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2, bob, 8.5, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Arms & Weapon Grip
    this.drawWeaponAndHands(ctx, weaponId, recoil, bob, '#e2e8f0', '#1e293b', muzzleTimer, isGhost);
  }

  // MARCUS STEELE: SWAT Juggernaut in heavy ceramic EOD plate armor, wide pauldron shoulders, reinforced shotgun
  private static drawSteele(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    recoil: number,
    bob: number,
    muzzleTimer: number,
    isFlashed: boolean,
    isGhost: boolean
  ) {
    // Heavy wide Torso
    ctx.fillStyle = isFlashed ? '#ffffff' : isGhost ? '#fb923c' : '#18181b'; // heavy ceramic black
    ctx.beginPath();
    ctx.ellipse(0, bob, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Ceramic Blast Plate with Orange Hazard Chevrons
    if (!isGhost) {
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(-9, -10 + bob, 18, 20, 5);
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Steel reinforcement collar
      ctx.fillStyle = '#52525b';
      ctx.fillRect(-6, -11 + bob, 12, 3);
    }

    // Heavy Pauldron Shoulder Guards (Reinforced Spikes)
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#f97316' : '#ea580c';
    ctx.beginPath();
    ctx.roundRect(-5, -15 + bob, 9, 8, 3);
    ctx.roundRect(-5, 7 + bob, 9, 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Heavy Ballistic Helmet with Visor Slit
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#fdba74' : '#27272a';
    ctx.beginPath();
    ctx.arc(-1, bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Orange Optical Slit
    ctx.fillStyle = isFlashed ? '#fff' : '#fb923c';
    ctx.fillRect(3, -3.5 + bob, 3, 7);

    // Arms & Weapon (Heavy steel gauntlets)
    this.drawWeaponAndHands(ctx, weaponId, recoil * 0.7, bob, '#f97316', '#27272a', muzzleTimer, isGhost, true);
  }

  // GHOST: Covert Spec-Ops Infiltrator in matte stealth cloak, cowl hood, glowing purple dual oculars
  private static drawGhost(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    recoil: number,
    bob: number,
    muzzleTimer: number,
    isFlashed: boolean,
    isGhost: boolean
  ) {
    // Sleek aerodynamic Torso
    ctx.fillStyle = isFlashed ? '#ffffff' : isGhost ? '#c084fc' : '#09090b';
    ctx.beginPath();
    ctx.ellipse(-1, bob, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stealth cowl cape edge
    if (!isGhost) {
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(-10, -8 + bob);
      ctx.lineTo(-3, -11 + bob);
      ctx.lineTo(5, -7 + bob);
      ctx.lineTo(2, 7 + bob);
      ctx.lineTo(-6, 9 + bob);
      ctx.closePath();
      ctx.fill();

      // Stealth thruster pack on back
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-10, -5 + bob, 4, 10);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-11, -3 + bob, 2, 6);
    }

    // Spec-Ops Hood
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#c084fc' : '#27272a';
    ctx.beginPath();
    ctx.arc(-2, bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Dual Purple Night-Vision Oculars
    ctx.fillStyle = isFlashed ? '#fff' : '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(3, -2 + bob, 2, 0, Math.PI * 2);
    ctx.arc(3, 2 + bob, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fast hands & weapon
    this.drawWeaponAndHands(ctx, weaponId, recoil, bob, '#d4d4d8', '#18181b', muzzleTimer, isGhost);
  }

  // DR. PYRE: Bio-hazard Specialist in reinforced orange hazmat coat, twin oxygen canisters & respirator
  private static drawPyre(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    recoil: number,
    bob: number,
    muzzleTimer: number,
    isFlashed: boolean,
    isGhost: boolean
  ) {
    // Heavy Hazmat Coat
    ctx.fillStyle = isFlashed ? '#ffffff' : isGhost ? '#f87171' : '#c2410c'; // hazard burnt orange
    ctx.beginPath();
    ctx.ellipse(0, bob, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Twin Fuel / Oxygen tanks on back
    if (!isGhost) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-12, -8 + bob, 5, 6);
      ctx.fillRect(-12, 2 + bob, 5, 6);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-13, -7 + bob, 2, 4);
      ctx.fillRect(-13, 3 + bob, 2, 4);

      // Hazard warning stripes across shoulders
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -10 + bob, 3, 20);
    }

    // Respirator Hood & Gas Mask
    ctx.fillStyle = isFlashed ? '#fff' : isGhost ? '#fca5a5' : '#78350f';
    ctx.beginPath();
    ctx.arc(-1, bob, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Twin filtration canisters
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(2, -4 + bob, 3, 0, Math.PI * 2);
    ctx.arc(2, 4 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Amber Gas Mask Visor
    ctx.fillStyle = isFlashed ? '#fff' : '#f59e0b';
    ctx.fillRect(2, -2 + bob, 3.5, 4);

    // Heavy rubberized gloves & weapon
    this.drawWeaponAndHands(ctx, weaponId, recoil * 0.8, bob, '#fbbf24', '#78350f', muzzleTimer, isGhost);
  }

  // Renders hands, weapon silhouette, recoil kickback and dynamic muzzle flash
  private static drawWeaponAndHands(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    recoil: number,
    bob: number,
    skinColor: string,
    sleeveColor: string,
    muzzleTimer: number,
    isGhost: boolean,
    isHeavy = false
  ) {
    ctx.save();
    // Offset weapon by recoil kick
    ctx.translate(-recoil, bob);

    // Determine weapon dimensions and colors
    let barrelLength = 16;
    let barrelWidth = 4;
    let weaponColor = '#475569';
    let stockColor = '#1e293b';
    let isDual = false;
    let isHeavyBeam = false;
    let isFlame = false;

    switch (weaponId) {
      case 'pistol':
      case 'phantom_revolver':
        barrelLength = 14;
        barrelWidth = 3.5;
        weaponColor = weaponId === 'phantom_revolver' ? '#38bdf8' : '#64748b';
        stockColor = '#0f172a';
        isDual = weaponId === 'phantom_revolver';
        break;
      case 'assault_rifle':
      case 'bullet_storm':
        barrelLength = 22;
        barrelWidth = 5;
        weaponColor = weaponId === 'bullet_storm' ? '#eab308' : '#334155';
        stockColor = '#1e293b';
        break;
      case 'shotgun':
      case 'thunder_barrage':
        barrelLength = 19;
        barrelWidth = 6;
        weaponColor = weaponId === 'thunder_barrage' ? '#3b82f6' : '#52525b';
        stockColor = '#78350f';
        break;
      case 'smg':
      case 'neon_shredder':
        barrelLength = 13;
        barrelWidth = 4;
        weaponColor = weaponId === 'neon_shredder' ? '#ec4899' : '#475569';
        stockColor = '#18181b';
        break;
      case 'sniper':
      case 'rail_cannon':
        barrelLength = 28;
        barrelWidth = 5.5;
        weaponColor = weaponId === 'rail_cannon' ? '#f43f5e' : '#334155';
        stockColor = '#0f172a';
        isHeavyBeam = true;
        break;
      case 'flamethrower':
      case 'inferno_wave':
        barrelLength = 20;
        barrelWidth = 7;
        weaponColor = weaponId === 'inferno_wave' ? '#ff4400' : '#ea580c';
        stockColor = '#451a03';
        isFlame = true;
        break;
    }

    if (isGhost) {
      weaponColor = '#60a5fa';
    }

    // Right Arm (Holding Grip)
    const armWidth = isHeavy ? 5 : 4;
    ctx.fillStyle = sleeveColor;
    ctx.beginPath();
    ctx.roundRect(2, 4, 10, armWidth, 2);
    ctx.fill();

    // Left Arm (Supporting Barrel / Handguard)
    if (!isDual) {
      ctx.fillStyle = sleeveColor;
      ctx.beginPath();
      ctx.roundRect(0, -9, 12, armWidth, 2);
      ctx.fill();
    }

    // Weapon Receiver & Body
    ctx.fillStyle = stockColor;
    ctx.fillRect(6, -1, 7, 5);

    // Weapon Barrel
    ctx.fillStyle = weaponColor;
    ctx.fillRect(8, 0, barrelLength, barrelWidth);

    // Heavy Rail optics / Scope
    if (isHeavyBeam) {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(9, -3, 8, 2);
    }
    // Flame nozzle
    if (isFlame) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8 + barrelLength - 3, -1, 4, barrelWidth + 2);
    }

    // Hands gripping weapon
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(8, 3, 3, 0, Math.PI * 2); // right hand
    if (!isDual) {
      ctx.arc(14, -2, 2.5, 0, Math.PI * 2); // left hand on barrel
    } else {
      // Dual second pistol
      ctx.fillStyle = weaponColor;
      ctx.fillRect(8, -7, barrelLength, barrelWidth);
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(8, -5, 3, 0, Math.PI * 2);
    }
    ctx.fill();

    // Muzzle Flash
    if (muzzleTimer > 0 && !isGhost) {
      const flashX = 8 + barrelLength + 4;
      const flashY = 2;
      const flashColor = isHeavyBeam ? '#38bdf8' : isFlame ? '#f97316' : '#fef08a';

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = flashColor;
      ctx.shadowBlur = 16;

      // Dynamic spiked muzzle star
      ctx.beginPath();
      ctx.arc(flashX, flashY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle prongs
      ctx.fillStyle = flashColor;
      ctx.beginPath();
      ctx.moveTo(flashX + 10, flashY);
      ctx.lineTo(flashX - 2, flashY - 4);
      ctx.lineTo(flashX - 2, flashY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Orbital Buzzsaw Blades
  private static drawOrbitalBlades(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    gameTime: number
  ) {
    const bladeCount = 3;
    const orbitRad = 92;
    const angleOffset = gameTime * 5.5;

    for (let b = 0; b < bladeCount; b++) {
      const bAngle = angleOffset + (b * (Math.PI * 2)) / bladeCount;
      const bx = sx + Math.cos(bAngle) * orbitRad;
      const by = sy + Math.sin(bAngle) * orbitRad;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(gameTime * 24);

      // Energy buzzsaw teeth
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      for (let t = 0; t < 8; t++) {
        const ta = (t * Math.PI * 2) / 8;
        const outerR = 15;
        const innerR = 9;
        ctx.lineTo(Math.cos(ta) * outerR, Math.sin(ta) * outerR);
        ctx.lineTo(Math.cos(ta + 0.3) * innerR, Math.sin(ta + 0.3) * innerR);
      }
      ctx.closePath();
      ctx.fill();

      // Blade Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  // Draw Guardian Drone Companion
  private static drawGuardianDrone(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    gameTime: number
  ) {
    const droneDist = 48;
    const droneAngle = gameTime * 2.2;
    const dx = sx + Math.cos(droneAngle) * droneDist;
    const dy = sy + Math.sin(droneAngle) * droneDist - 16;

    ctx.save();
    ctx.translate(dx, dy);

    // Drone shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 18, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drone Quad Thruster Rotors
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) {
      const ra = (r * Math.PI) / 2 + gameTime * 30;
      ctx.beginPath();
      ctx.arc(Math.cos(ra) * 9, Math.sin(ra) * 9, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Drone Chassis
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(-7, -7, 14, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Optical Eye
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(1, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
