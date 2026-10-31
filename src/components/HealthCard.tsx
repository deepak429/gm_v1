import React from 'react';
import { HudCombatState } from '../types';

interface HealthCardProps {
  hud: HudCombatState;
}

export const HealthCard: React.FC<HealthCardProps> = ({ hud }) => {
  const playerPercent = Math.max(0, Math.min(100, (hud.playerHp / hud.playerMaxHp) * 100));
  const enemyPercent = Math.max(0, Math.min(100, (hud.enemyHp / hud.enemyMaxHp) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));

  return (
    <div className="health-hud-bar">
      {/* Player Card */}
      <div className="player-card">
        <div className="avatar player-avatar">🏹</div>
        <div className="card-info">
          <div className="card-header-row">
            <b>Shadow Ranger</b>
            {hud.shieldActive && <span className="shield-badge">SHIELDED ⬡</span>}
          </div>
          <small>RANGER · ARMORED</small>

          {/* Animated Player Health Bar with Damage Feedback */}
          <div className="health-bar-container">
            <div className="health-chip-fill" style={{ width: `${playerPercent}%` }} />
            <div className="health-fill player-fill" style={{ width: `${playerPercent}%` }} />
          </div>
          <div className="stat-text-row">
            <strong>
              {hud.playerHp} <small>/ {hud.playerMaxHp} HP</small>
            </strong>
          </div>

          {/* Stamina / Energy Bar */}
          <div className="stamina-wrapper">
            <div className="stamina-label-row">
              <span className="stamina-title">STAMINA ⚡</span>
              <span className="stamina-nums">
                {hud.stamina} / {hud.maxStamina}
              </span>
            </div>
            <div className="stamina-bar-container">
              <div
                className={`stamina-fill ${hud.stamina < 30 ? 'stamina-low' : ''}`}
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enemy Card */}
      <div className="enemy-card">
        <div className="card-info">
          <div className="card-header-row enemy-header">
            {hud.isBoss && <span className="boss-badge">BOSS 👑</span>}
            <b>{hud.enemyName}</b>
          </div>
          <div className="status-badges">
            {hud.enemyStatus.frozen && <span className="status-pill frost-pill">❄️ FROZEN</span>}
            {hud.enemyStatus.burning && <span className="status-pill fire-pill">🔥 BURN</span>}
            {hud.enemyStatus.poisonStacks > 0 && (
              <span className="status-pill poison-pill">☣️ POISON ×{hud.enemyStatus.poisonStacks}</span>
            )}
          </div>

          {/* Animated Enemy Health Bar */}
          <div className="health-bar-container">
            <div className="health-chip-fill" style={{ width: `${enemyPercent}%` }} />
            <div
              className={`health-fill ${hud.isBoss ? 'boss-fill' : 'enemy-fill'}`}
              style={{ width: `${enemyPercent}%` }}
            />
          </div>
          <div className="stat-text-row enemy-stat-row">
            <strong>
              {hud.enemyHp} <small>/ {hud.enemyMaxHp} HP</small>
            </strong>
          </div>

          {/* Enemy Aiming Warning Bar */}
          {hud.enemyAimingProgress > 0 && (
            <div className="enemy-aim-telegraph" title="Enemy is aiming!">
              <div className="aim-charge-fill" style={{ width: `${hud.enemyAimingProgress * 100}%` }} />
            </div>
          )}
        </div>
        <div className={`avatar enemy-avatar ${hud.isBoss ? 'boss-avatar' : ''}`}>
          {hud.isBoss ? '👑' : '☠'}
        </div>
      </div>
    </div>
  );
};
