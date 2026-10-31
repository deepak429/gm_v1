import React, { useState } from 'react';
import { soundManager } from '../audio/SoundManager';
import { saveManager } from '../save/SaveManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenCampaign: () => void;
  onOpenShop: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onOpenCampaign, onOpenShop }) => {
  const save = saveManager.getData();
  const [sfxVol, setSfxVol] = useState(save.settings.sfxVolume);
  const [musicVol, setMusicVol] = useState(save.settings.musicVolume);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundManager.setVolumes(val, musicVol, save.settings.muted);
    saveManager.save({ settings: { ...save.settings, sfxVolume: val } });
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundManager.setVolumes(sfxVol, val, save.settings.muted);
    saveManager.save({ settings: { ...save.settings, musicVolume: val } });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card pause-modal">
        <h2>GAME PAUSED</h2>
        <p className="pause-sub">Take a breath, Ranger. Plan your next trajectory.</p>

        {/* Volume Sliders */}
        <div className="settings-panel">
          <div className="setting-slider">
            <label>SFX VOLUME: {Math.round(sfxVol * 100)}%</label>
            <input type="range" min="0" max="1" step="0.05" value={sfxVol} onChange={handleSfxChange} />
          </div>
          <div className="setting-slider">
            <label>BGM MUSIC: {Math.round(musicVol * 100)}%</label>
            <input type="range" min="0" max="1" step="0.05" value={musicVol} onChange={handleMusicChange} />
          </div>
        </div>

        <div className="pause-actions">
          <button className="primary-action-btn" onClick={onResume}>
            RESUME BATTLE ▶
          </button>
          <button className="secondary-action-btn" onClick={onRestart}>
            ↻ RESTART LEVEL
          </button>
          <button
            className="secondary-action-btn"
            onClick={() => {
              onResume();
              onOpenShop();
            }}
          >
            ⚔️ ARMORY UPGRADES
          </button>
          <button
            className="map-action-btn"
            onClick={() => {
              onResume();
              onOpenCampaign();
            }}
          >
            🗺 WAR MAP
          </button>
          <button
            className="secondary-action-btn"
            style={{
              marginTop: 10,
              borderColor: '#ffa33a',
              color: '#ffcc77',
              background: 'rgba(80, 50, 10, 0.3)',
            }}
            onClick={() => {
              if (
                confirm(
                  'Reset campaign progress?\n\n' +
                    'This wipes stage stars, coins, score, mastery, codex, achievements and challenge streaks.\n\n' +
                    'You KEEP every hero, bow and shield you bought, your equipped loadout, your starshards and all permanent prestige bonuses.'
                )
              ) {
                saveManager.resetProgressKeepUnlocks();
                window.location.reload();
              }
            }}
          >
            ↻ RESET PROGRESS (keep heroes & gear)
          </button>
          <button
            className="secondary-action-btn"
            style={{
              marginTop: 4,
              borderColor: '#ff5f6d',
              color: '#ff8c6b',
              background: 'rgba(80, 10, 10, 0.35)',
            }}
            onClick={() => {
              if (
                confirm(
                  '⚠ HARD WIPE?\n\nThis deletes EVERYTHING — including every hero, bow and shield you have unlocked. You will restart as Kaelen with no inventory.\n\nThis cannot be undone.'
                )
              ) {
                saveManager.resetAll();
                window.location.reload();
              }
            }}
          >
            ⚠ HARD WIPE (delete everything)
          </button>
        </div>
      </div>
    </div>
  );
};
