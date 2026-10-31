import React from 'react';

interface AbilityBarProps {
  shieldCooldown: number;
  shieldActive: boolean;
  dashCooldown: number;
  slowCooldown: number;
  slowActive: boolean;
  onActivateShield: () => void;
  onActivateDash: () => void;
  onActivateSlow: () => void;
}

export const AbilityBar: React.FC<AbilityBarProps> = ({
  shieldCooldown,
  shieldActive,
  dashCooldown,
  slowCooldown,
  slowActive,
  onActivateShield,
  onActivateDash,
  onActivateSlow,
}) => {
  return (
    <nav className="ability-bar">
      {/* Shield (Q) */}
      <button
        className={`ability-btn ${shieldActive ? 'active' : ''} ${shieldCooldown > 0 ? 'on-cooldown' : ''}`}
        onClick={onActivateShield}
        disabled={shieldCooldown > 0}
        title="Runic Shield (Q) - Blocks incoming enemy attacks"
      >
        <div className="ability-icon-wrapper">
          <span className="ability-icon">⬡</span>
          {shieldCooldown > 0 && (
            <div className="cooldown-overlay" style={{ height: `${shieldCooldown * 100}%` }} />
          )}
        </div>
        <div className="ability-text">
          <b>Shield</b>
          <kbd>Q</kbd>
        </div>
      </button>

      {/* Dash (E) */}
      <button
        className={`ability-btn ${dashCooldown > 0 ? 'on-cooldown' : ''}`}
        onClick={onActivateDash}
        disabled={dashCooldown > 0}
        title="Shadow Dash (E) - Quick dodge and evade attack"
      >
        <div className="ability-icon-wrapper">
          <span className="ability-icon">➤</span>
          {dashCooldown > 0 && (
            <div className="cooldown-overlay" style={{ height: `${dashCooldown * 100}%` }} />
          )}
        </div>
        <div className="ability-text">
          <b>Dash</b>
          <kbd>E</kbd>
        </div>
      </button>

      {/* Slow Motion (F) */}
      <button
        className={`ability-btn ${slowActive ? 'active' : ''} ${slowCooldown > 0 ? 'on-cooldown' : ''}`}
        onClick={onActivateSlow}
        disabled={slowCooldown > 0}
        title="Slow Motion (F) - Enter bullet time to aim perfectly"
      >
        <div className="ability-icon-wrapper">
          <span className="ability-icon">◷</span>
          {slowCooldown > 0 && (
            <div className="cooldown-overlay" style={{ height: `${slowCooldown * 100}%` }} />
          )}
        </div>
        <div className="ability-text">
          <b>Bullet Time</b>
          <kbd>F</kbd>
        </div>
      </button>
    </nav>
  );
};
