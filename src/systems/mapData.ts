import { MapConfig, MapId } from '../types/game';

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  city: {
    id: 'city',
    name: 'Sector 4: Dead City',
    subtitle: 'Crumbling asphalt, deserted police cruisers, and shattered storefronts.',
    themeColor: '#3b82f6',
    ambientLight: 'rgba(10, 14, 26, 0.88)',
    floorColor: '#12141c',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    accentColor: '#38bdf8',
    obstacleType: 'cars',
  },
  industrial: {
    id: 'industrial',
    name: 'Chemical Plant 09',
    subtitle: 'Corroded pipes, toxic waste barrels, and sparking electrical panels.',
    themeColor: '#10b981',
    ambientLight: 'rgba(9, 20, 16, 0.88)',
    floorColor: '#0f1715',
    gridColor: 'rgba(16, 185, 129, 0.05)',
    accentColor: '#22c55e',
    obstacleType: 'barrels',
  },
  quarantine: {
    id: 'quarantine',
    name: 'Outpost Quarantine',
    subtitle: 'Overrun military perimeter, razor wire, and red emergency floodlights.',
    themeColor: '#ef4444',
    ambientLight: 'rgba(22, 10, 12, 0.90)',
    floorColor: '#191113',
    gridColor: 'rgba(239, 68, 68, 0.05)',
    accentColor: '#f43f5e',
    obstacleType: 'barricades',
  },
};
