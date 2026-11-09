import { CharacterConfig, CharacterId } from '../types/game';

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  raven: {
    id: 'raven',
    name: 'Raven',
    title: 'Lone Survivor',
    bio: 'Ex-military scout skilled in urban evasion and precision fire. Fast instincts and adaptable under heavy siege.',
    startingWeapon: 'pistol',
    baseHealth: 100,
    speedMultiplier: 1.0,
    critChanceBonus: 0.05,
    armorBonus: 0,
    perkDescription: 'Standard tactical issue. Balanced speed and +5% critical hit rate.',
    unlockedByDefault: true,
    unlockCondition: 'Unlocked by default',
    color: '#3b82f6', // tactical blue
  },
  steele: {
    id: 'steele',
    name: 'Marcus Steele',
    title: 'The Juggernaut',
    bio: 'Former SWAT heavy breacher in reinforced body armor. Absorbs brutal blows and obliterates crowds with buckshot.',
    startingWeapon: 'shotgun',
    baseHealth: 150,
    speedMultiplier: 0.90,
    critChanceBonus: 0.03,
    armorBonus: 0.20,
    perkDescription: '+50 Max HP and +20% Armor damage reduction. -10% movement speed.',
    unlockedByDefault: false,
    unlockCondition: 'Survive at least 5 minutes in any run',
    color: '#f97316', // heavy orange
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    title: 'Spec-Ops Infiltrator',
    bio: 'Covert operative equipped with stealth thrusters and high-rate SMG weaponry. Moves like a phantom.',
    startingWeapon: 'smg',
    baseHealth: 80,
    speedMultiplier: 1.20,
    critChanceBonus: 0.15,
    armorBonus: 0,
    perkDescription: '+20% Speed, +15% Critical Chance, and 30% faster Dash recovery. -20 Max HP.',
    unlockedByDefault: false,
    unlockCondition: 'Eliminate 1,000 total zombies',
    color: '#a855f7', // stealth purple
  },
  pyre: {
    id: 'pyre',
    name: 'Dr. Pyre',
    title: 'Hazard Specialist',
    bio: 'Bio-containment doctor turned horde cleanser. Employs pressurized napalm and self-regenerating stims.',
    startingWeapon: 'flamethrower',
    baseHealth: 110,
    speedMultiplier: 0.95,
    critChanceBonus: 0.02,
    armorBonus: 0.05,
    perkDescription: 'Starts with Flamethrower and innate +1.5 HP/sec cellular regeneration.',
    unlockedByDefault: false,
    unlockCondition: 'Defeat The Plague Mother boss',
    color: '#ef4444', // hazard red
  },
};
