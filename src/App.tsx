import { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';
import { Topbar } from './components/Topbar';
import { HealthCard } from './components/HealthCard';
import { ArrowRack } from './components/ArrowRack';
import { AbilityBar } from './components/AbilityBar';
import { CampaignModal } from './components/CampaignModal';
import { InventoryModal } from './components/InventoryModal';
import { ResultModal } from './components/ResultModal';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';
import { LevelIntroBanner } from './components/LevelIntroBanner';
import { RotatePrompt } from './components/RotatePrompt';
import { MetaMenuBar } from './components/MetaMenuBar';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { EndlessStartModal } from './components/EndlessStartModal';
import { CodexModal } from './components/CodexModal';
import { AchievementsModal } from './components/AchievementsModal';
import { PrestigeModal } from './components/PrestigeModal';
import { PerkSelectModal } from './components/PerkSelectModal';
import { MutatorSelectModal } from './components/MutatorSelectModal';
import { ArrowType, HudCombatState, RunMutator } from './types';
import { CAMPAIGN_CHAPTERS, getStageConfig } from './campaign/CampaignData';
import { soundManager } from './audio/SoundManager';
import { saveManager } from './save/SaveManager';
import { sweepAchievements } from './meta/Achievements';
import { PerkDef } from './meta/Perks';
import { crazy } from './platform/CrazyGames';

const DEFAULT_HUD: HudCombatState = {
  playerHp: 100,
  playerMaxHp: 100,
  stamina: 100,
  maxStamina: 100,
  enemyHp: 80,
  enemyMaxHp: 80,
  enemyName: 'Skeleton Scout',
  enemyArchetype: 'skeleton_scout',
  isBoss: false,
  arrowCounts: { normal: 12, fire: 4, ice: 3, poison: 3, arcane: 2, thunder: 2, shadow: 2, holy: 2, wind: 2, void: 1 },
  selectedArrow: 'normal',
  message: 'Drag left to set angle and power. Release to shoot!',
  wind: 0.15,
  combo: 0,
  score: 0,
  coins: saveManager.getData().coins,
  shieldActive: false,
  shieldCooldown: 0,
  dashCooldown: 0,
  slowCooldown: 0,
  slowActive: false,
  enemyAimingProgress: 0,
  enemyStatus: {
    frozen: false,
    freezeTimeRemaining: 0,
    poisonStacks: 0,
    burning: false,
  },
  levelIntro: {
    stageNumber: 1,
    stageName: 'Training Courtyard',
    isBoss: false,
    show: true,
  },
  gameOver: false,
  victory: false,
  starsEarned: 1,
  headshots: 0,
  accuracy: 100,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);

  const [hud, setHud] = useState<HudCombatState>(DEFAULT_HUD);
  const [currentStageId, setCurrentStageId] = useState(saveManager.getData().unlockedStage || 1);
  const [paused, setPaused] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showEndless, setShowEndless] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [showPerkPick, setShowPerkPick] = useState(false);
  const [showMutatorPick, setShowMutatorPick] = useState(false);
  const [perkLevel, setPerkLevel] = useState(1);
  const [metaBump, setMetaBump] = useState(0); // force meta-bar re-render
  const [muted, setMuted] = useState(saveManager.getData().settings.muted);

  const bumpMeta = () => setMetaBump((v) => v + 1);

  const stageConfig = getStageConfig(currentStageId);
  const chapterConfig = CAMPAIGN_CHAPTERS.find((c) => c.chapter === stageConfig.chapter)!;

  // Track mastery level to pop a perk pick on level-up (after a stage ends in victory).
  const lastMasteryLevel = useRef<number>(
    saveManager.getData().mastery[saveManager.getData().equippedHero]?.level || 1
  );
  const perkSeed = useMemo(
    () => `${saveManager.getData().equippedHero}-${perkLevel}-${metaBump}`,
    [perkLevel, metaBump]
  );
  const mutatorSeed = useMemo(() => `${currentStageId}-${Date.now() >>> 10}`, [currentStageId]);

  // Track whether the SDK's "active round" state is on so we don't double-call.
  const gameplayActive = useRef(false);
  const startGameplay = () => {
    if (gameplayActive.current) return;
    gameplayActive.current = true;
    crazy.gameplayStart();
  };
  const stopGameplay = () => {
    if (!gameplayActive.current) return;
    gameplayActive.current = false;
    crazy.gameplayStop();
  };

  // CrazyGames wants gameplayStart on round begin, gameplayStop on end,
  // happytime at successful milestones. The HUD flags are the authoritative
  // source of round state as seen by the player.
  useEffect(() => {
    if (hud.gameOver) {
      stopGameplay();
    } else if (!paused) {
      startGameplay();
    }
  }, [hud.gameOver, paused]);

  useEffect(() => {
    if (hud.gameOver && hud.victory) {
      // Signal a positive beat so the SDK can time an unobtrusive ad later.
      crazy.happytime();
      const data = saveManager.getData();
      const m = data.mastery[data.equippedHero];
      // Perk gifts no longer rain every level. Gate on mastery level ≥ 5,
      // then once every 3 levels after (5, 8, 11, 14…), so each gift feels earned.
      const isGiftLevel = (lvl: number) => lvl >= 5 && (lvl - 5) % 3 === 0;
      if (m && m.level > lastMasteryLevel.current) {
        const crossedGift =
          Array.from(
            { length: m.level - lastMasteryLevel.current },
            (_, i) => lastMasteryLevel.current + 1 + i
          ).some(isGiftLevel);
        lastMasteryLevel.current = m.level;
        if (crossedGift) {
          setPerkLevel(m.level);
          setShowPerkPick(true);
        }
      }
      sweepAchievements();
      bumpMeta();
    }
  }, [hud.gameOver, hud.victory]);

  // Count completed stages so we only run an interstitial ad every N stages.
  const stagesSinceAd = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new ArenaScene((updatedHud) => {
      setHud({ ...updatedHud });
    });
    sceneRef.current = scene;

    const computeResolution = () => {
      const container = mountRef.current;
      const clientW = container?.clientWidth || window.innerWidth || 1280;
      const clientH = container?.clientHeight || window.innerHeight || 720;
      const aspect = Math.max(1.33, Math.min(2.4, clientW / (clientH || 1)));
      const baseH = 720;
      const baseW = Math.round(baseH * aspect);
      return { width: baseW, height: baseH };
    };

    const initialRes = computeResolution();

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mountRef.current,
      width: initialRes.width,
      height: initialRes.height,
      backgroundColor: '#0a1724',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: [scene],
    });

    gameRef.current = game;

    const onResize = () => {
      if (!gameRef.current) return;
      const res = computeResolution();
      gameRef.current.scale.resize(res.width, res.height);
      sceneRef.current?.handleWindowResize(res.width, res.height);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const togglePause = () => {
    const g = gameRef.current;
    if (!g) return;
    if (paused) {
      g.scene.resume('ArenaScene');
    } else {
      g.scene.pause('ArenaScene');
    }
    setPaused(!paused);
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    const save = saveManager.getData();
    soundManager.setVolumes(save.settings.sfxVolume, save.settings.musicVolume, nextMuted);
    saveManager.save({ settings: { ...save.settings, muted: nextMuted } });
  };

  const handleSelectStage = (stageId: number) => {
    setCurrentStageId(stageId);
    sceneRef.current?.setStage(stageId);
    // Clear any lingering run perks/mutator when jumping stages manually.
    saveManager.clearRunPerks();
    saveManager.setActiveMutator(null);
    bumpMeta();
  };

  const handleNextStage = async () => {
    stopGameplay();
    stagesSinceAd.current += 1;
    // Interstitial ad every 3 stage transitions. Non-blocking locally.
    if (stagesSinceAd.current >= 3 && crazy.isAvailable()) {
      stagesSinceAd.current = 0;
      await crazy.requestMidgameAd();
    }
    const nextId = currentStageId + 1;
    setCurrentStageId(nextId);
    sceneRef.current?.nextStage();
    setShowMutatorPick(true);
  };

  const handleRetry = () => {
    sceneRef.current?.restartBattle();
    saveManager.setActiveMutator(null);
    bumpMeta();
  };

  const selectArrow = (type: ArrowType) => {
    sceneRef.current?.selectArrowType(type);
  };

  return (
    <main className="app-shell">
      {/* Mobile Landscape Orientation Lock Reminder */}
      <RotatePrompt />

      {/* Top Header */}
      <Topbar
        score={hud.score}
        coins={hud.coins}
        chapterTitle={chapterConfig.title}
        stageName={stageConfig.name}
        stageNumber={stageConfig.stageNumber}
        isPaused={paused}
        onTogglePause={togglePause}
        onOpenShop={() => setShowInventory(true)}
        onOpenCampaign={() => setShowCampaign(true)}
        muted={muted}
        onToggleMute={toggleMute}
      />

      {/* Meta menu — Daily / Endless / Codex / Awards / Ascend / Mastery / Streak */}
      <MetaMenuBar
        key={metaBump}
        onOpenDaily={() => setShowDaily(true)}
        onOpenEndless={() => setShowEndless(true)}
        onOpenCodex={() => setShowCodex(true)}
        onOpenAchievements={() => setShowAchievements(true)}
        onOpenPrestige={() => setShowPrestige(true)}
      />

      {/* Main Game Stage */}
      <section className="game-frame">
        {/* Animated Level Intro / Boss Announcement Banner */}
        <LevelIntroBanner intro={hud.levelIntro} />

        {/* Health & Stamina HUD Cards */}
        <HealthCard hud={hud} />

        {/* Phaser Canvas */}
        <div ref={mountRef} className="game-canvas" />

        {/* Left Arrow Rack */}
        <ArrowRack
          selectedArrow={hud.selectedArrow}
          arrowCounts={hud.arrowCounts}
          onSelectArrow={selectArrow}
        />

        {/* Aim & Wind Battle Banner */}
        <div className="battle-message">
          <span>{hud.message}</span>
          <span className="wind-badge">
            WIND {hud.wind >= 0 ? '↗' : '↙'} {Math.abs(hud.wind).toFixed(2)}
          </span>
        </div>

        {/* Center Bottom Ability Bar */}
        <AbilityBar
          shieldCooldown={hud.shieldCooldown}
          shieldActive={hud.shieldActive}
          dashCooldown={hud.dashCooldown}
          slowCooldown={hud.slowCooldown}
          slowActive={hud.slowActive}
          onActivateShield={() => sceneRef.current?.activateShield()}
          onActivateDash={() => sceneRef.current?.activateDash()}
          onActivateSlow={() => sceneRef.current?.activateSlowMo()}
        />

        {/* Mobile / Touch Friendly Quick Bar */}
        <TouchControls
          onQuickFire={() => sceneRef.current?.shootPlayerArrow()}
          onActivateShield={() => sceneRef.current?.activateShield()}
          onActivateDash={() => sceneRef.current?.activateDash()}
          onActivateSlow={() => sceneRef.current?.activateSlowMo()}
        />

        {/* Modals & Overlays */}
        {paused && (
          <PauseModal
            onResume={togglePause}
            onRestart={() => {
              togglePause();
              handleRetry();
            }}
            onOpenCampaign={() => setShowCampaign(true)}
            onOpenShop={() => setShowInventory(true)}
          />
        )}

        {hud.gameOver && (
          <ResultModal
            hud={hud}
            onNextStage={handleNextStage}
            onRetry={handleRetry}
            onOpenCampaign={() => setShowCampaign(true)}
          />
        )}

        {showCampaign && (
          <CampaignModal
            currentStageId={currentStageId}
            onSelectStage={handleSelectStage}
            onClose={() => setShowCampaign(false)}
          />
        )}

        {showInventory && (
          <InventoryModal
            coins={hud.coins}
            onCoinsChange={(newCoins) => setHud((prev) => ({ ...prev, coins: newCoins }))}
            onClose={() => {
              setShowInventory(false);
              // Refresh equipped hero, bow, shield, perks and coins in real-time
              sceneRef.current?.onEquipmentChanged();
            }}
          />
        )}

        {showDaily && (
          <DailyChallengeModal
            onClose={() => {
              setShowDaily(false);
              bumpMeta();
            }}
            onStart={() => {
              setShowDaily(false);
              bumpMeta();
              // Daily/weekly reuse campaign stage 1 for now — the seed configures variance.
              sceneRef.current?.restartBattle();
            }}
          />
        )}

        {showEndless && (
          <EndlessStartModal
            onClose={() => setShowEndless(false)}
            onStart={() => {
              setShowEndless(false);
              bumpMeta();
              sceneRef.current?.restartBattle();
            }}
          />
        )}

        {showCodex && <CodexModal onClose={() => { setShowCodex(false); bumpMeta(); }} />}

        {showAchievements && (
          <AchievementsModal onClose={() => { setShowAchievements(false); bumpMeta(); }} />
        )}

        {showPrestige && (
          <PrestigeModal
            onClose={() => { setShowPrestige(false); bumpMeta(); }}
            onCoinsChange={(c) => setHud((p) => ({ ...p, coins: c }))}
          />
        )}

        {showPerkPick && (
          <PerkSelectModal
            seed={perkSeed}
            level={perkLevel}
            onPick={(_p: PerkDef) => {
              setShowPerkPick(false);
              bumpMeta();
            }}
            onClose={() => setShowPerkPick(false)}
          />
        )}

        {showMutatorPick && (
          <MutatorSelectModal
            seed={mutatorSeed}
            stageName={stageConfig.name}
            onConfirm={(_m: RunMutator | null) => {
              setShowMutatorPick(false);
              bumpMeta();
            }}
          />
        )}
      </section>

      {/* Combat Metrics Strip */}
      <section className="stats-strip">
        <div>
          <span>COMBO</span>
          <b>×{hud.combo}</b>
        </div>
        <div>
          <span>STAMINA</span>
          <b>
            {hud.stamina} / {hud.maxStamina}
          </b>
        </div>
        <div>
          <span>ACCURACY</span>
          <b>{hud.accuracy}%</b>
        </div>
        <div>
          <span>HEADSHOTS</span>
          <b>{hud.headshots}</b>
        </div>
        <div>
          <span>WIND INFLUENCE</span>
          <b>
            {hud.wind >= 0 ? 'EAST ↗' : 'WEST ↙'} {Math.abs(hud.wind).toFixed(2)}
          </b>
        </div>
        <div>
          <span>PROGRESS</span>
          <b>
            STAGE {currentStageId} / 15 ({chapterConfig.title})
          </b>
        </div>
      </section>

      {/* Footer Controls Cheatsheet */}
      <footer>
        <span>
          <i className="live-dot" /> SHADOW ARCHER 2.5D REMASTERED
        </span>
        <span className="key-guides">
          SHORTCUTS: <b>1–5 ARROWS</b> · <b>SPACE / DRAG SHOOT</b> · <b>Q SHIELD</b> · <b>E DASH</b> ·{' '}
          <b>F SLOW-MO</b> · <b>R RETRY</b>
        </span>
        <span className="footer-right">Ragdoll Physics · Smart AI · Web Audio · React + Phaser 3</span>
      </footer>
    </main>
  );
}
