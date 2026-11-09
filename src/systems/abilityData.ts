export interface AbilityDef {
  id: 'shockwave' | 'orbital_blades' | 'chain_lightning' | 'meteor_strike' | 'freeze_pulse' | 'guardian_drone';
  name: string;
  description: string;
  iconName: string;
  baseCooldown: number; // in seconds
  baseDamage: number;
  radius: number;
  color: string;
}

export const ABILITY_DEFINITIONS: Record<string, AbilityDef> = {
  shockwave: {
    id: 'shockwave',
    name: 'Kinetic Shockwave',
    description: 'Discharges high-impact blast pushing all surrounding zombies back and dealing heavy force damage.',
    iconName: 'radio',
    baseCooldown: 8,
    baseDamage: 75,
    radius: 180,
    color: '#06b6d4', // cyan
  },
  orbital_blades: {
    id: 'orbital_blades',
    name: 'Orbital Blades',
    description: 'Deploys 3 high-speed energy buzzsaws orbiting around the player continuously shredding nearby threats.',
    iconName: 'shield',
    baseCooldown: 0, // continuous passive aura
    baseDamage: 30,
    radius: 90,
    color: '#a855f7', // purple
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'Discharges high-voltage electric arc jumping across up to 7 zombies with high stun probability.',
    iconName: 'zap',
    baseCooldown: 6,
    baseDamage: 85,
    radius: 260,
    color: '#3b82f6', // electric blue
  },
  meteor_strike: {
    id: 'meteor_strike',
    name: 'Meteor Strike',
    description: 'Calls down an orbital artillery shell onto the largest enemy cluster, creating a massive fire crater.',
    iconName: 'target',
    baseCooldown: 10,
    baseDamage: 220,
    radius: 160,
    color: '#ef4444', // crimson explosion
  },
  freeze_pulse: {
    id: 'freeze_pulse',
    name: 'Cryo Pulse',
    description: 'Emits a zero-kelvin freeze pulse locking all nearby enemies solid in place for 3.5 seconds.',
    iconName: 'snowflake',
    baseCooldown: 12,
    baseDamage: 35,
    radius: 210,
    color: '#38bdf8', // ice cyan
  },
  guardian_drone: {
    id: 'guardian_drone',
    name: 'Guardian Drone',
    description: 'Tactical combat drone hovers above you, automatically lasering nearby approaching zombies.',
    iconName: 'bot',
    baseCooldown: 0, // continuous companion
    baseDamage: 40,
    radius: 240,
    color: '#10b981', // emerald
  },
};
