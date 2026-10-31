import React, { useEffect, useMemo, useState } from 'react';
import { PlayerUpgrades } from '../types';
import {
  saveManager,
  PLAYABLE_HEROES,
  BOW_SKINS,
  SHIELD_SKINS,
  ARROW_PACKS,
  UPGRADE_COSTS,
  UPGRADE_DESCRIPTIONS,
} from '../save/SaveManager';
import { soundManager } from '../audio/SoundManager';
import { HeroPortrait } from './HeroPortrait';

interface InventoryModalProps {
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

export const InventoryModal: React.FC<InventoryModalProps> = ({ coins: _propCoins, onCoinsChange, onClose }) => {
  const [tab, setTab] = useState<'heroes' | 'bows' | 'shields' | 'arrows' | 'upgrades'>('heroes');
  const [saveData, setSaveData] = useState(saveManager.getData());
  const [purchaseNote, setPurchaseNote] = useState<string | null>(null);
  const [focusedHeroId, setFocusedHeroId] = useState<string>(saveManager.getData().equippedHero);

  // Single canonical source of truth for coins inside Arsenal & Vault
  const coins = saveData.coins;

  const showNotification = (msg: string) => {
    setPurchaseNote(msg);
    setTimeout(() => setPurchaseNote(null), 2400);
  };

  const handleBuyHero = (heroId: string) => {
    const success = saveManager.buyHero(heroId);
    if (success) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      onCoinsChange(updated.coins);
      showNotification('Hero unlocked & selected!');
    } else {
      showNotification('Not enough coins to unlock this Hero!');
    }
  };

  const handleEquipHero = (heroId: string) => {
    const success = saveManager.equipHero(heroId);
    if (success) {
      soundManager.playBowRelease();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      showNotification('Hero selected!');
    }
  };

  const handleBuyBow = (bowId: string) => {
    const success = saveManager.buyBow(bowId);
    if (success) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      onCoinsChange(updated.coins);
      showNotification('Bow unlocked & equipped!');
    } else {
      showNotification('Not enough coins for this bow!');
    }
  };

  const handleEquipBow = (bowId: string) => {
    const success = saveManager.equipBow(bowId);
    if (success) {
      soundManager.playBowRelease();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      showNotification('Bow equipped!');
    }
  };

  const handleBuyShield = (shieldId: string) => {
    const success = saveManager.buyShield(shieldId);
    if (success) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      onCoinsChange(updated.coins);
      showNotification('Shield unlocked & equipped!');
    } else {
      showNotification('Not enough coins for this shield!');
    }
  };

  const handleEquipShield = (shieldId: string) => {
    const success = saveManager.equipShield(shieldId);
    if (success) {
      soundManager.playShieldBlock();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      showNotification('Shield equipped!');
    }
  };

  const handleBuyArrowPack = (packId: string) => {
    const pack = ARROW_PACKS.find((p) => p.id === packId);
    const success = saveManager.buyArrowPack(packId);
    if (success && pack) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      onCoinsChange(updated.coins);
      showNotification(`+${pack.amount} ${pack.name} added to Quiver!`);
    } else {
      showNotification('Not enough coins for this arrow pack!');
    }
  };

  const handleBuyUpgrade = (key: keyof PlayerUpgrades) => {
    const success = saveManager.buyUpgrade(key);
    if (success) {
      soundManager.playCoin();
      const updated = saveManager.getData();
      setSaveData({ ...updated });
      onCoinsChange(updated.coins);
      showNotification('Warrior upgraded!');
    } else {
      showNotification('Not enough coins for upgrade!');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card inventory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">ROYAL ARSENAL & VAULT</div>
            <h2>WEAPONS, SHIELDS & ARROW MARKET</h2>
          </div>
          <div className="wallet-badge">
            <span>🪙</span>
            <b>{coins} COINS</b>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {purchaseNote && (
          <div className="inventory-notification">
            <span>✨ {purchaseNote}</span>
          </div>
        )}

        {/* Modal Tab Buttons */}
        <div className="inventory-tabs">
          <button
            className={`inv-tab ${tab === 'heroes' ? 'active' : ''}`}
            onClick={() => setTab('heroes')}
          >
            <span>👑</span>
            <b>HEROES</b>
          </button>
          <button
            className={`inv-tab ${tab === 'bows' ? 'active' : ''}`}
            onClick={() => setTab('bows')}
          >
            <span>🏹</span>
            <b>BOWS</b>
          </button>
          <button
            className={`inv-tab ${tab === 'shields' ? 'active' : ''}`}
            onClick={() => setTab('shields')}
          >
            <span>🛡️</span>
            <b>SHIELDS</b>
          </button>
          <button
            className={`inv-tab ${tab === 'arrows' ? 'active' : ''}`}
            onClick={() => setTab('arrows')}
          >
            <span>➶</span>
            <b>ARROWS</b>
          </button>
          <button
            className={`inv-tab ${tab === 'upgrades' ? 'active' : ''}`}
            onClick={() => setTab('upgrades')}
          >
            <span>⚔️</span>
            <b>UPGRADES</b>
          </button>
        </div>

        {/* TAB 0: HEROES — split layout with large focused portrait + list */}
        {tab === 'heroes' && (
          <HeroesTab
            saveData={saveData}
            focusedHeroId={focusedHeroId}
            setFocusedHeroId={setFocusedHeroId}
            onBuyHero={handleBuyHero}
            onEquipHero={handleEquipHero}
            coins={coins}
          />
        )}

        {/* TAB 1: BOW SKINS */}
        {tab === 'bows' && (
          <div className="bows-grid">
            {BOW_SKINS.map((bow) => {
              const isUnlocked = saveData.unlockedBows.includes(bow.id);
              const isEquipped = saveData.equippedBow === bow.id;
              const canAfford = coins >= bow.cost;

              return (
                <div
                  key={bow.id}
                  className={`bow-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`}
                >
                  <div className="bow-top">
                    <span className="bow-badge">
                      {isEquipped ? 'EQUIPPED ✓' : isUnlocked ? 'UNLOCKED' : 'LOCKED 🔒'}
                    </span>
                    <span className="bow-icon-display">🏹</span>
                  </div>

                  <h3 className="bow-name">{bow.name}</h3>
                  <p className="bow-desc">{bow.desc}</p>

                  <div className="bow-stats">
                    {bow.bonusSpeed > 0 && <span>⚡ +{Math.round(bow.bonusSpeed * 100)}% Speed</span>}
                    {bow.bonusDmg > 0 && <span>⚔️ +{bow.bonusDmg} Damage</span>}
                    {bow.bonusSpeed === 0 && bow.bonusDmg === 0 && <span>⚖️ Balanced Trajectory</span>}
                  </div>

                  <div className="bow-actions">
                    {isEquipped ? (
                      <span className="equipped-tag">IN USE</span>
                    ) : isUnlocked ? (
                      <button className="equip-btn" onClick={() => handleEquipBow(bow.id)}>
                        EQUIP BOW
                      </button>
                    ) : (
                      <button
                        className={`buy-btn ${canAfford ? 'can-buy' : 'cant-afford'}`}
                        disabled={!canAfford}
                        onClick={() => handleBuyBow(bow.id)}
                      >
                        <span>🪙 {bow.cost}</span>
                        <b>UNLOCK</b>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: SHIELDS */}
        {tab === 'shields' && (
          <div className="bows-grid shields-grid">
            {SHIELD_SKINS.map((shield) => {
              const isUnlocked = saveData.unlockedShields.includes(shield.id);
              const isEquipped = saveData.equippedShield === shield.id;
              const canAfford = coins >= shield.cost;

              return (
                <div
                  key={shield.id}
                  className={`bow-card shield-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`}
                >
                  <div className="bow-top">
                    <span className="bow-badge">
                      {isEquipped ? 'EQUIPPED ✓' : isUnlocked ? 'UNLOCKED' : 'LOCKED 🔒'}
                    </span>
                    <span className="bow-icon-display">{shield.icon}</span>
                  </div>

                  <h3 className="bow-name">{shield.name}</h3>
                  <p className="bow-desc">{shield.desc}</p>

                  <div className="bow-stats">
                    <span>🛡️ {shield.blockCharges} Block Charges</span>
                    {shield.reflectDmg > 0 && <span>↩ {shield.reflectDmg} Reflect Dmg</span>}
                    {shield.cooldownMult < 1.0 && (
                      <span>⏱ -{Math.round((1 - shield.cooldownMult) * 100)}% Cooldown</span>
                    )}
                  </div>

                  <div className="bow-actions">
                    {isEquipped ? (
                      <span className="equipped-tag">IN USE</span>
                    ) : isUnlocked ? (
                      <button className="equip-btn" onClick={() => handleEquipShield(shield.id)}>
                        EQUIP SHIELD
                      </button>
                    ) : (
                      <button
                        className={`buy-btn ${canAfford ? 'can-buy' : 'cant-afford'}`}
                        disabled={!canAfford}
                        onClick={() => handleBuyShield(shield.id)}
                      >
                        <span>🪙 {shield.cost}</span>
                        <b>UNLOCK</b>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: ARROW MARKET */}
        {tab === 'arrows' && (
          <div className="arrows-market-grid">
            {ARROW_PACKS.map((pack) => {
              const canAfford = coins >= pack.cost;
              const bonusCount = saveData.bonusArrows[pack.type] || 0;

              return (
                <div key={pack.id} className="arrow-pack-card" style={{ borderColor: pack.theme + '66' }}>
                  <div className="pack-header">
                    <span className="pack-icon" style={{ background: pack.theme + '26', color: pack.theme }}>
                      {pack.icon}
                    </span>
                    <div className="pack-title-box">
                      <h4 className="pack-name">{pack.name}</h4>
                      <span className="pack-amount">+{pack.amount} Arrows</span>
                    </div>
                  </div>

                  <div className="pack-status">
                    <span>Quiver Cache:</span>
                    <b style={{ color: pack.theme }}>+{bonusCount} Ready</b>
                  </div>

                  <button
                    className={`buy-btn pack-buy-btn ${canAfford ? 'can-buy' : 'cant-afford'}`}
                    disabled={!canAfford}
                    onClick={() => handleBuyArrowPack(pack.id)}
                  >
                    <span>🪙 {pack.cost}</span>
                    <b>GRAB PACK</b>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: WARRIOR UPGRADES */}
        {tab === 'upgrades' && (
          <div className="upgrades-list">
            {UPGRADE_KEYS.map((key) => {
              const level = saveData.upgrades[key];
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
                        onClick={() => handleBuyUpgrade(key)}
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
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// HeroesTab — premium split layout: left list of portrait chips, right showcase
// ─────────────────────────────────────────────────────────────────────────

interface HeroesTabProps {
  saveData: ReturnType<typeof saveManager.getData>;
  focusedHeroId: string;
  setFocusedHeroId: (id: string) => void;
  coins: number;
  onBuyHero: (id: string) => void;
  onEquipHero: (id: string) => void;
}

const HeroesTab: React.FC<HeroesTabProps> = ({
  saveData,
  focusedHeroId,
  setFocusedHeroId,
  coins,
  onBuyHero,
  onEquipHero,
}) => {
  // Responsive breakpoint — stacks on narrow screens so nothing overlaps.
  const [vw, setVw] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  const isNarrow = vw < 820;
  const isTiny = vw < 520;

  const focused = useMemo(
    () => PLAYABLE_HEROES.find((h) => h.id === focusedHeroId) || PLAYABLE_HEROES[0],
    [focusedHeroId]
  );
  const isUnlocked = saveData.unlockedHeroes.includes(focused.id);
  const isEquipped = saveData.equippedHero === focused.id;
  const canAfford = coins >= focused.cost;

  const mastery = saveData.mastery[focused.id] || { xp: 0, level: 1, kills: 0 };
  const nextXp = Math.round(Math.pow(mastery.level, 1.4) * 50);
  const xpProgress = Math.min(1, mastery.xp / nextXp);

  const trimHex = '#' + focused.trimColor.toString(16).padStart(6, '0');
  const eyeHex = '#' + focused.eyeColor.toString(16).padStart(6, '0');
  const capeHex = '#' + focused.capeColor.toString(16).padStart(6, '0');

  const perkChips: Array<{ icon: string; label: string; color: string }> = [];
  if (focused.perks.hpBonus) perkChips.push({ icon: '❤', label: `+${focused.perks.hpBonus} Max HP`, color: '#ff5f6d' });
  if (focused.perks.staminaBonus) perkChips.push({ icon: '⚡', label: `+${focused.perks.staminaBonus} Stamina`, color: '#ffdd55' });
  if (focused.perks.speedBonus) perkChips.push({ icon: '💨', label: `+${Math.round(focused.perks.speedBonus * 100)}% Draw Speed`, color: '#7fffd4' });
  if (focused.perks.critBonus) perkChips.push({ icon: '🎯', label: `+${Math.round(focused.perks.critBonus * 100)}% Crit`, color: '#ff9933' });
  if (focused.perks.fireBonus) perkChips.push({ icon: '🔥', label: `+${Math.round(focused.perks.fireBonus * 100)}% Fire`, color: '#ff5329' });
  if (focused.perks.freezeBonus) perkChips.push({ icon: '❄', label: `+${Math.round(focused.perks.freezeBonus * 100)}% Freeze`, color: '#6be5ff' });
  if (focused.perks.holyBonus) perkChips.push({ icon: '✨', label: `+${Math.round(focused.perks.holyBonus * 100)}% Holy`, color: '#fff5a0' });
  if (perkChips.length === 0) perkChips.push({ icon: '⚖', label: 'Balanced Loadout', color: trimHex });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '220px 1fr',
        gap: isNarrow ? 10 : 14,
        padding: 10,
      }}
    >
      {/* ── LEFT: scrollable hero portrait list ──────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'row' : 'column',
          gap: isNarrow ? 10 : 8,
          maxHeight: isNarrow ? 128 : '68vh',
          overflowX: isNarrow ? 'auto' : 'hidden',
          overflowY: isNarrow ? 'hidden' : 'auto',
          paddingRight: isNarrow ? 2 : 4,
          paddingBottom: isNarrow ? 10 : 0,
          // Mobile tap reliability: disable scroll-snap (traps taps on iOS),
          // give the browser clear hints about one-axis scrolling and no
          // double-tap zoom.
          WebkitOverflowScrolling: 'touch' as 'touch',
          touchAction: isNarrow ? 'pan-x' : 'pan-y',
        }}
      >
        {PLAYABLE_HEROES.map((hero) => {
          const owned = saveData.unlockedHeroes.includes(hero.id);
          const active = focusedHeroId === hero.id;
          const current = saveData.equippedHero === hero.id;
          const heroTrim = '#' + hero.trimColor.toString(16).padStart(6, '0');
          const m = saveData.mastery[hero.id];
          return (
            <button
              key={hero.id}
              type="button"
              onClick={() => setFocusedHeroId(hero.id)}
              style={{
                display: 'flex',
                flexDirection: isNarrow ? 'column' : 'row',
                alignItems: 'center',
                gap: isNarrow ? 4 : 10,
                padding: isNarrow ? '8px 6px' : '8px 10px',
                background: active
                  ? `linear-gradient(180deg, ${heroTrim}22, transparent)`
                  : 'linear-gradient(180deg, #0f1b26, #091319)',
                border: `2px solid ${active ? heroTrim : current ? '#ffbf47' : '#1a2a37'}`,
                borderRadius: 10,
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                flexShrink: 0,
                // Give each chip a comfortable mobile tap target (≥ 44×44).
                minWidth: isNarrow ? 108 : undefined,
                minHeight: isNarrow ? 112 : undefined,
                // Prevents iOS double-tap zoom when selecting chips quickly.
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                transition: 'transform 0.15s',
                boxShadow: active ? `0 0 14px ${heroTrim}66` : 'none',
              }}
            >
              <div
                style={{
                  width: isNarrow ? 60 : 44,
                  height: isNarrow ? 76 : 56,
                  overflow: 'hidden',
                  borderRadius: 6,
                  border: `1px solid ${heroTrim}66`,
                  background: '#040a10',
                  flexShrink: 0,
                  // Make the portrait purely decorative so the tap always hits the button.
                  pointerEvents: 'none',
                }}
              >
                <HeroPortrait hero={hero} size={isNarrow ? 60 : 44} locked={!owned} showBow={false} />
              </div>
              <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>{hero.icon}</span>
                  <b style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hero.name.split(' ')[0]}
                  </b>
                </div>
                <div style={{ fontSize: 10, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {owned ? (m ? `L${m.level}` : 'L1') : `✦ ${hero.cost}`}
                </div>
              </div>
              {current && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    fontSize: 11,
                    color: '#ffbf47',
                    fontWeight: 800,
                    pointerEvents: 'none',
                  }}
                >
                  ★
                </span>
              )}
              {!owned && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 6,
                    fontSize: 11,
                    opacity: 0.75,
                    pointerEvents: 'none',
                  }}
                >
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: focused hero showcase ─────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '280px 1fr',
          gap: isNarrow ? 12 : 18,
          background: `radial-gradient(circle at 20% 15%, ${eyeHex}22, transparent 55%), linear-gradient(180deg, #0f1b26, #050a10)`,
          border: `1px solid ${trimHex}66`,
          borderRadius: 12,
          padding: isTiny ? 10 : isNarrow ? 14 : 18,
          position: 'relative',
          overflow: 'hidden',
          maxHeight: isNarrow ? 'calc(100vh - 240px)' : '68vh',
        }}
      >
        {/* Rim glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 60px ${capeHex}66`,
            pointerEvents: 'none',
          }}
        />

        {/* Portrait column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: `2px solid ${trimHex}`,
              boxShadow: `0 0 36px ${eyeHex}66`,
              background: '#02060a',
            }}
          >
            <HeroPortrait
              hero={focused}
              size={isTiny ? 170 : isNarrow ? 210 : 260}
              locked={!isUnlocked}
              pose={isEquipped ? 'aim' : 'idle'}
            />
          </div>
          <div
            style={{
              padding: '4px 10px',
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              background: isEquipped
                ? 'linear-gradient(90deg, #ffbf47, #ff8f33)'
                : isUnlocked
                ? '#1a2a37'
                : '#260c0c',
              color: isEquipped ? '#1a0f00' : isUnlocked ? '#9fcfff' : '#ff8c6b',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            {isEquipped ? '★ IN USE' : isUnlocked ? 'READY' : 'LOCKED'}
          </div>
        </div>

        {/* Info column */}
        <div style={{ position: 'relative', zIndex: 1, color: '#fff', overflow: 'auto' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: trimHex,
              textTransform: 'uppercase',
            }}
          >
            {focused.title}
          </div>
          <h2
            style={{
              margin: '2px 0 8px',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 0.5,
              background: `linear-gradient(90deg, #fff, ${trimHex})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {focused.name}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.88, lineHeight: 1.5, marginTop: 0 }}>{focused.desc}</p>

          {/* Mastery bar */}
          <div
            style={{
              background: '#0a141c',
              border: `1px solid ${trimHex}44`,
              borderRadius: 8,
              padding: '10px 12px',
              marginTop: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              <span style={{ color: trimHex }}>Mastery L{mastery.level}</span>
              <span style={{ opacity: 0.7 }}>{mastery.xp} / {nextXp} XP · {mastery.kills} kills</span>
            </div>
            <div style={{ marginTop: 6, height: 8, background: '#1a2a37', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${xpProgress * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${trimHex}, ${eyeHex})`,
                  boxShadow: `0 0 8px ${eyeHex}99`,
                }}
              />
            </div>
          </div>

          {/* Perk chips */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#8fd1ff', textTransform: 'uppercase', marginBottom: 6 }}>
              Innate Perks
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {perkChips.map((chip, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: '#0a141c',
                    border: `1px solid ${chip.color}66`,
                    color: chip.color,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span>{chip.icon}</span>
                  <span style={{ color: '#fff', opacity: 0.9 }}>{chip.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Palette swatches */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#8fd1ff', textTransform: 'uppercase', marginBottom: 6 }}>
              Signature Palette
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                ['Cowl', focused.cowlColor],
                ['Armor', focused.armorColor],
                ['Trim', focused.trimColor],
                ['Cape', focused.capeColor],
                ['Eye', focused.eyeColor],
                ['Hair', focused.hairColor],
              ] as const).map(([label, color]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#' + color.toString(16).padStart(6, '0'),
                      border: '1px solid #000',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  />
                  <div style={{ fontSize: 9, opacity: 0.7, marginTop: 3, letterSpacing: 1 }}>{label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
            {isEquipped ? (
              <button
                className="primary-action-btn"
                disabled
                style={{
                  opacity: 0.6,
                  background: 'linear-gradient(90deg, #ffbf47, #ff8f33)',
                  color: '#1a0f00',
                  minWidth: 220,
                }}
              >
                ★ CURRENTLY SELECTED
              </button>
            ) : isUnlocked ? (
              <button
                className="primary-action-btn"
                onClick={() => onEquipHero(focused.id)}
                style={{
                  background: `linear-gradient(90deg, ${trimHex}, ${eyeHex})`,
                  color: '#02060a',
                  minWidth: 220,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                SELECT HERO ▶
              </button>
            ) : (
              <button
                className="primary-action-btn"
                disabled={!canAfford}
                onClick={() => onBuyHero(focused.id)}
                style={{
                  background: canAfford
                    ? `linear-gradient(90deg, ${trimHex}, ${eyeHex})`
                    : '#1a2a37',
                  opacity: canAfford ? 1 : 0.5,
                  color: canAfford ? '#02060a' : '#9fb2c4',
                  minWidth: 220,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                🪙 UNLOCK FOR {focused.cost}
              </button>
            )}
            {!isUnlocked && !canAfford && (
              <span style={{ fontSize: 12, color: '#ff8c6b' }}>
                Need {focused.cost - coins} more coins
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
