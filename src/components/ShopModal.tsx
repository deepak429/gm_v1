import React, { useState } from 'react';
import { PlayerUpgrades } from '../types';
import { saveManager, UPGRADE_COSTS, UPGRADE_DESCRIPTIONS } from '../save/SaveManager';
import { soundManager } from '../audio/SoundManager';

interface ShopModalProps {
  coins: number;
  onCoinsChange: (newCoins: number) => void;
  onClose: () => void;
}

const UPGRADE_KEYS: (keyof PlayerUpgrades)[] = [
  'bowPower',
  'quiverCapacity',
  'maxHealth',
  'shieldEfficiency',
  'elementalMastery',
];

export const ShopModal: React.FC<ShopModalProps> = ({ coins, onCoinsChange, onClose }) => {
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({ ...saveManager.getData().upgrades });

  const handleBuy = (key: keyof PlayerUpgrades) => {
    const success = saveManager.buyUpgrade(key);
    if (success) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setUpgrades({ ...updated.upgrades });
      onCoinsChange(updated.coins);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card shop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">ROYAL FORGE & ARMORY</div>
            <h2>WARRIOR UPGRADES</h2>
          </div>
          <div className="wallet-badge">
            <span>🪙</span>
            <b>{coins} COINS</b>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="shop-subtext">Enhance your archery arsenal with spoils of battle.</p>

        <div className="upgrades-list">
          {UPGRADE_KEYS.map((key) => {
            const level = upgrades[key];
            const costArray = UPGRADE_COSTS[key];
            const isMax = level >= costArray.length;
            const nextCost = isMax ? 0 : costArray[level];
            const canAfford = coins >= nextCost && !isMax;
            const meta = UPGRADE_DESCRIPTIONS[key];

            return (
              <div key={key} className={`upgrade-row ${isMax ? 'maxed' : ''}`}>
                <div className="upgrade-main">
                  <div className="upgrade-title-line">
                    <h4>{meta.name}</h4>
                    <span className="tier-label">
                      TIER {level} / {costArray.length}
                    </span>
                  </div>
                  <p className="upgrade-desc">{meta.desc}</p>

                  {/* Level pip bar */}
                  <div className="pips-bar">
                    {costArray.map((_, idx) => (
                      <div key={idx} className={`pip ${idx < level ? 'filled' : ''}`} />
                    ))}
                  </div>
                </div>

                <div className="upgrade-action">
                  {isMax ? (
                    <span className="max-tag">MAXED OUT</span>
                  ) : (
                    <button
                      className={`buy-btn ${canAfford ? 'can-buy' : 'cant-afford'}`}
                      disabled={!canAfford}
                      onClick={() => handleBuy(key)}
                    >
                      <span>🪙 {nextCost}</span>
                      <b>UPGRADE</b>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
