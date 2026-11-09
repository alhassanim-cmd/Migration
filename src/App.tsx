import React, { useState } from 'react';
import { GameMode, MapId, CharacterId, ChallengeId } from './types/game';
import { MainMenu } from './components/MainMenu';
import { GameView } from './components/GameView';
import { ArmoryModal } from './components/ArmoryModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameModesModal } from './components/GameModesModal';
import { MissionsAchievementsModal } from './components/MissionsAchievementsModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');

  // Selected game run setup
  const [mode, setMode] = useState<GameMode>('survival');
  const [mapId, setMapId] = useState<MapId>('city');
  const [characterId, setCharacterId] = useState<CharacterId>('raven');
  const [challengeId, setChallengeId] = useState<ChallengeId | undefined>(undefined);

  // Active Menu Modals
  const [activeModal, setActiveModal] = useState<
    'none' | 'armory' | 'characters' | 'modes' | 'missions' | 'settings'
  >('none');

  const handleStartDeploy = () => {
    setScreen('game');
  };

  const handleExitToMenu = () => {
    setScreen('menu');
  };

  const handleOpenArmoryFromGame = () => {
    setScreen('menu');
    setActiveModal('armory');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none text-zinc-100">
      {screen === 'menu' && (
        <>
          <MainMenu
            mode={mode}
            mapId={mapId}
            characterId={characterId}
            challengeId={challengeId}
            onDeploy={handleStartDeploy}
            onOpenModes={() => setActiveModal('modes')}
            onOpenArmory={() => setActiveModal('armory')}
            onOpenCharacters={() => setActiveModal('characters')}
            onOpenMissions={() => setActiveModal('missions')}
            onOpenSettings={() => setActiveModal('settings')}
          />

          {/* Sub Modals */}
          {activeModal === 'armory' && (
            <ArmoryModal onClose={() => setActiveModal('none')} />
          )}

          {activeModal === 'characters' && (
            <CharacterSelectModal
              selectedId={characterId}
              onSelect={(id) => {
                setCharacterId(id);
                setActiveModal('none');
              }}
              onClose={() => setActiveModal('none')}
            />
          )}

          {activeModal === 'modes' && (
            <GameModesModal
              currentMode={mode}
              currentMap={mapId}
              currentChallenge={challengeId}
              onSelectConfig={(newMode, newMap, newCh) => {
                setMode(newMode);
                setMapId(newMap);
                setChallengeId(newCh);
              }}
              onClose={() => setActiveModal('none')}
            />
          )}

          {activeModal === 'missions' && (
            <MissionsAchievementsModal onClose={() => setActiveModal('none')} />
          )}

          {activeModal === 'settings' && (
            <SettingsModal onClose={() => setActiveModal('none')} />
          )}
        </>
      )}

      {screen === 'game' && (
        <GameView
          mode={mode}
          mapId={mapId}
          characterId={characterId}
          challengeId={challengeId}
          onExitToMenu={handleExitToMenu}
          onOpenArmory={handleOpenArmoryFromGame}
        />
      )}
    </div>
  );
}
