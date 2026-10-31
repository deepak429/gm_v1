import Phaser from 'phaser';
import { ArcherCharacter } from '../entities/ArcherCharacter';
import { EnemyAI } from '../ai/EnemyAI';
import { soundManager, MusicThemeCategory } from '../audio/SoundManager';
import { saveManager } from '../save/SaveManager';
import { CAMPAIGN_STAGES, getStageConfig } from '../campaign/CampaignData';
import { ArrowType, BodyPartHit, HudCombatState, LevelIntroState, StageConfig } from '../types';
import { sweepAchievements } from '../meta/Achievements';
import { findMutator } from '../meta/Mutators';

interface EnvironmentPalette {
  skyTop: number;
  skyBottom: number;
  mountainColor: number;
  fortressColor: number;
  groundColor: number;
  pavementColor: number;
  torchColor: number;
  particleColor: number;
  name: string;
}

const SESSION_PALETTES: EnvironmentPalette[] = [
  {
    skyTop: 0x18344e,
    skyBottom: 0x3d7093,
    mountainColor: 0x243e52,
    fortressColor: 0x1b2e3d,
    groundColor: 0x12212d,
    pavementColor: 0x274152,
    torchColor: 0xffa433,
    particleColor: 0xa6c9df,
    name: 'Twilight Citadel',
  },
  {
    skyTop: 0x3c244c,
    skyBottom: 0xc4695b,
    mountainColor: 0x482a47,
    fortressColor: 0x291830,
    groundColor: 0x1b1020,
    pavementColor: 0x3d2745,
    torchColor: 0xffb547,
    particleColor: 0xffdcb8,
    name: 'Crimson Dusk',
  },
  {
    skyTop: 0x091421,
    skyBottom: 0x183754,
    mountainColor: 0x102538,
    fortressColor: 0x0c1b28,
    groundColor: 0x08131d,
    pavementColor: 0x1b3b59,
    torchColor: 0x59d5ff,
    particleColor: 0x96e5ff,
    name: 'Midnight Watch',
  },
  {
    skyTop: 0x213e54,
    skyBottom: 0x5c8ba8,
    mountainColor: 0x2f5470,
    fortressColor: 0x162c3d,
    groundColor: 0x10212e,
    pavementColor: 0x234763,
    torchColor: 0x75ebff,
    particleColor: 0xffffff,
    name: 'Frostfang Glacier',
  },
  {
    skyTop: 0x381212,
    skyBottom: 0x782718,
    mountainColor: 0x2b1111,
    fortressColor: 0x1e0b0b,
    groundColor: 0x140707,
    pavementColor: 0x361616,
    torchColor: 0xff481f,
    particleColor: 0xff6b30,
    name: 'Molten Abyss',
  },
  // Chapter 4 themes
  {
    skyTop: 0x3d2e00,
    skyBottom: 0xc8a24c,
    mountainColor: 0x5c3f00,
    fortressColor: 0x3b2600,
    groundColor: 0x6b4e1a,
    pavementColor: 0x8c6d30,
    torchColor: 0xffd060,
    particleColor: 0xe8c870,
    name: 'Shattered Dunes',
  },
  {
    skyTop: 0x071a07,
    skyBottom: 0x1a3d1a,
    mountainColor: 0x0d260d,
    fortressColor: 0x071507,
    groundColor: 0x0a1a0a,
    pavementColor: 0x143314,
    torchColor: 0x55ff33,
    particleColor: 0x88ff44,
    name: 'Cursed Forest',
  },
];

export class ArenaScene extends Phaser.Scene {
  private player!: ArcherCharacter;
  private enemy!: ArcherCharacter;
  private enemyAI!: EnemyAI;
  private currentStageConfig!: StageConfig;

  // Background environment containers & graphics
  private envContainer!: Phaser.GameObjects.Container;
  private weatherParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sessionIndex = 0;

  // Trajectory graphics & Impact Prediction
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private impactMarkerGraphics!: Phaser.GameObjects.Graphics;
  private bloodStainsGfx!: Phaser.GameObjects.Graphics;
  private groundEffectsContainer!: Phaser.GameObjects.Container;

  // Visible on-screen aim controller overlay
  private aimControllerGfx!: Phaser.GameObjects.Graphics;
  private aimBadgeText!: Phaser.GameObjects.Text;

  // Aiming state
  private isDragging = false;
  private aimAngle = 0.35;
  private power = 0.75;
  private selectedArrow: ArrowType = 'normal';

  // --- DYNAMIC CAMERA & CINEMATIC ZOOM SYSTEM ---
  private baseZoom = 1.06;
  private currentZoom = 1.06;
  private targetZoom = 1.06;
  private zoomPunch = 0;
  private aimZoomProgress = 0;    // Smooth 0→1 ramp as player draws bow
  private aimReleaseDecay = 0;    // Smooth 1→0 decay after releasing arrow (cinematic trail)

  // Combat status
  private playerHp = 100;
  private playerMaxHp = 100;
  private stamina = 100;
  private maxStamina = 100;
  private enemyHp = 80;
  private enemyMaxHp = 80;
  private wind = 0.15;
  private combo = 0;
  private score = 0;
  private coins = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private headshotCount = 0;
  private arrowCounts: Record<ArrowType, number> = {
    normal: 12,
    fire: 4,
    ice: 3,
    poison: 3,
    arcane: 2,
    thunder: 2,
    shadow: 2,
    holy: 2,
    wind: 2,
    void: 1,
  };

  // Level intro banner
  private levelIntro: LevelIntroState = {
    stageNumber: 1,
    stageName: 'Training Courtyard',
    isBoss: false,
    show: true,
  };

  // Abilities
  private shieldActive = false;
  private shieldCharges = 1;
  private shieldCooldown = 0;
  private dashCooldown = 0;
  private slowCooldown = 0;
  private slowActive = false;

  // Status effects on enemy
  private enemyFrozen = false;
  private freezeTimer = 0;
  private poisonStacks = 0;
  private poisonTickTimer = 0;
  private burning = false;
  private burnTimer = 0;

  // New status effects (Chapter 4 arrows)
  private enemyShadowBlind = false;
  private shadowBlindTimer = 0;
  private enemyWindKnocked = false;
  private windKnockTimer = 0;

  // Game loop state
  private gameOver = false;
  // These mirror gameOver/victory but are delayed so React doesn't pop the
  // result modal until the ragdoll + blood cinematic has had time to play.
  private hudGameOver = false;
  private hudVictory = false;
  // Timer handle for the delayed result-modal flip — cancelled on restart
  // so a victory/defeat screen can't re-appear after the player retried.
  private resultDelayTimer?: Phaser.Time.TimerEvent;
  private victory = false;
  private groundY = 540;
  private onHudUpdate?: (s: HudCombatState) => void;

  constructor(onHudUpdate?: (s: HudCombatState) => void) {
    super('ArenaScene');
    this.onHudUpdate = onHudUpdate;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.groundY = h * 0.77;

    const saved = saveManager.getData();
    this.coins = saved.coins;
    this.score = saved.score;
    this.currentStageConfig = getStageConfig(saved.unlockedStage);

    this.applyPlayerUpgrades();

    // Environment root container
    this.envContainer = this.add.container(0, 0).setDepth(0);
    this.drawSessionEnvironment(w, h);

    // Blood stains & elemental hazard zones persistent on the ground
    this.bloodStainsGfx = this.add.graphics().setDepth(4);
    this.groundEffectsContainer = this.add.container(0, 0).setDepth(5);

    // Create Characters (positioned across full width)
    const playerX = w * 0.14;
    const enemyX = w * 0.86;
    this.player = new ArcherCharacter(this, playerX, this.groundY - 10, false, 'player');
    this.enemy = new ArcherCharacter(
      this,
      enemyX,
      this.groundY - 10,
      true,
      this.currentStageConfig.enemyType
    );
    this.enemy.setArchetype(
      this.currentStageConfig.enemyType,
      this.enemyHp,
      this.enemyMaxHp,
      this.currentStageConfig.enemyName,
      this.currentStageConfig.id
    );
    this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
    // Enemy aura reacts to the player's hero (counter-element coloring).
    this.enemy.refreshDangerTheme(saveManager.getEquippedHero().eyeColor);
    this.enemyAI = new EnemyAI(this.enemy, this.currentStageConfig);

    // Trajectory & Impact Marker Graphics
    this.trajectoryGraphics = this.add.graphics().setDepth(20);
    this.impactMarkerGraphics = this.add.graphics().setDepth(22);

    // Aim controller overlay (renders on top of trajectory)
    this.aimControllerGfx = this.add.graphics().setDepth(24);
    this.aimBadgeText = this.add
      .text(0, 0, '', {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#00000099',
        padding: { x: 7, y: 4 },
      })
      .setDepth(25)
      .setVisible(false);

    this.setupInputs();
    soundManager.startMusic();

    // Cinematic framing zoom: responsive full width and closer action
    this.baseZoom = w < 850 ? 1.10 : 1.06;
    this.currentZoom = this.baseZoom;
    this.targetZoom = this.baseZoom;
    this.cameras.main.setZoom(this.baseZoom);

    this.triggerLevelIntro();
    this.drawTrajectory();
    this.syncHud('Drag or use Space to aim & shoot. Defeat the enemy!');
  }

  public handleWindowResize(w: number, h: number) {
    this.groundY = h * 0.77;
    this.baseZoom = w < 850 ? 1.10 : 1.06;
    this.drawSessionEnvironment(w, h);
    if (this.player && this.player.container) {
      this.player.container.setPosition(w * 0.14, this.groundY - 10);
    }
    if (this.enemy && this.enemy.container) {
      this.enemy.container.setPosition(w * 0.86, this.groundY - 10);
    }
    this.drawTrajectory();
  }

  // --- CAMERA ZOOM CONTROLLERS ---
  public triggerDamageZoom(amount = 0.08) {
    this.zoomPunch = Math.min(0.25, this.zoomPunch + amount);
  }

  public triggerImpactZoom(amount = 0.12) {
    this.zoomPunch = Math.min(0.30, this.zoomPunch + amount);
  }

  public getThemeCategory(): MusicThemeCategory {
    const hero = saveManager.getEquippedHero();
    if (hero?.id === 'ignis') return 'fire';
    if (hero?.id === 'elysia') return 'frost';
    if (hero?.id === 'malakor') return 'shadow';
    if (hero?.id === 'lyra') return 'wind';
    if (hero?.id === 'aurelius') return 'holy';
    if (hero?.id === 'thorin') return 'fortress';

    // Fallback to active arrow type
    if (this.selectedArrow === 'fire') return 'fire';
    if (this.selectedArrow === 'ice') return 'frost';
    if (this.selectedArrow === 'shadow' || this.selectedArrow === 'void') return 'shadow';
    if (this.selectedArrow === 'wind') return 'wind';
    if (this.selectedArrow === 'holy') return 'holy';

    // Fallback to stage theme
    if (this.currentStageConfig.theme === 'caldera') return 'fire';
    if (this.currentStageConfig.theme === 'frost') return 'frost';
    if (this.currentStageConfig.theme === 'desert') return 'desert';

    return 'fortress';
  }

  public setStage(stageId: number) {
    this.currentStageConfig = getStageConfig(stageId);
    this.sessionIndex++;
    this.restartBattle();
  }

  private triggerLevelIntro() {
    this.levelIntro = {
      stageNumber: this.currentStageConfig.stageNumber,
      stageName: this.currentStageConfig.name,
      isBoss: this.currentStageConfig.isBoss,
      bossTitle: this.currentStageConfig.isBoss ? this.currentStageConfig.enemyName : undefined,
      show: true,
    };

    this.time.delayedCall(2800, () => {
      this.levelIntro.show = false;
      this.syncHud();
    });
  }

  private applyPlayerUpgrades() {
    const up = saveManager.getData().upgrades;
    const hero = saveManager.getEquippedHero();
    this.maxStamina = 100 + (hero.perks.staminaBonus || 0);
    this.playerMaxHp = 100 + up.maxHealth * 25 + (hero.perks.hpBonus || 0);
    this.playerHp = this.playerMaxHp;
    this.stamina = this.maxStamina;

    const bonusArrows = up.quiverCapacity * 2;
    const purchasedBonus = saveManager.consumeBonusArrows();
    this.arrowCounts = {
      normal: this.currentStageConfig.arrowCounts.normal + bonusArrows + (purchasedBonus.normal || 0),
      fire: this.currentStageConfig.arrowCounts.fire + bonusArrows + (purchasedBonus.fire || 0),
      ice: this.currentStageConfig.arrowCounts.ice + bonusArrows + (purchasedBonus.ice || 0),
      poison: this.currentStageConfig.arrowCounts.poison + bonusArrows + (purchasedBonus.poison || 0),
      arcane: this.currentStageConfig.arrowCounts.arcane + Math.floor(bonusArrows / 2) + (purchasedBonus.arcane || 0),
      thunder: this.currentStageConfig.arrowCounts.thunder + bonusArrows + (purchasedBonus.thunder || 0),
      shadow: this.currentStageConfig.arrowCounts.shadow + bonusArrows + (purchasedBonus.shadow || 0),
      holy: this.currentStageConfig.arrowCounts.holy + bonusArrows + (purchasedBonus.holy || 0),
      wind: this.currentStageConfig.arrowCounts.wind + bonusArrows + (purchasedBonus.wind || 0),
      void: this.currentStageConfig.arrowCounts.void + Math.floor(bonusArrows / 2) + (purchasedBonus.void || 0),
    };
  }

  // Dynamic Background: Regenerates with unique lighting, colors, and atmosphere every session!
  private drawSessionEnvironment(w: number, h: number) {
    this.envContainer.removeAll(true);
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
      this.weatherParticles = undefined;
    }

    // Pick palette matching theme + session iteration
    let paletteIdx = this.sessionIndex % SESSION_PALETTES.length;
    if (this.currentStageConfig.theme === 'frost') {
      paletteIdx = 3; // Frostfang
    } else if (this.currentStageConfig.theme === 'caldera') {
      paletteIdx = 4; // Molten Caldera
    } else if (this.currentStageConfig.theme === 'desert') {
      paletteIdx = 5; // Shattered Dunes
    } else if (this.currentStageConfig.theme === 'forest') {
      paletteIdx = 6; // Cursed Forest
    }
    const pal = SESSION_PALETTES[paletteIdx % SESSION_PALETTES.length];

    // 1. Sky Gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(pal.skyTop, pal.skyBottom, pal.skyTop, pal.skyBottom, 1);
    sky.fillRect(0, 0, w, h);
    this.envContainer.add(sky);

    // 2. Parallax Mountain Silhouettes (Zoomed in grander scale)
    const mountains = this.add.graphics();
    mountains.fillStyle(pal.mountainColor, 0.55);
    mountains.fillPoints(
      [
        { x: 0, y: h * 0.58 },
        { x: w * 0.14, y: h * 0.18 },
        { x: w * 0.28, y: h * 0.46 },
        { x: w * 0.48, y: h * 0.15 },
        { x: w * 0.68, y: h * 0.48 },
        { x: w * 0.86, y: h * 0.2 },
        { x: w, y: h * 0.48 },
        { x: w, y: h },
        { x: 0, y: h },
      ],
      true
    );

    // Near mountain ridge
    mountains.fillStyle(pal.mountainColor, 0.85);
    mountains.fillPoints(
      [
        { x: 0, y: h * 0.68 },
        { x: w * 0.22, y: h * 0.38 },
        { x: w * 0.42, y: h * 0.55 },
        { x: w * 0.62, y: h * 0.35 },
        { x: w * 0.82, y: h * 0.58 },
        { x: w, y: h * 0.42 },
        { x: w, y: h },
        { x: 0, y: h },
      ],
      true
    );
    this.envContainer.add(mountains);

    // 3. Midground Fortress / Ruins (Zoomed in grander scale)
    const midground = this.add.graphics();
    midground.fillStyle(pal.fortressColor, 0.95);
    // Right stronghold
    midground.fillRect(w * 0.6, h * 0.16, 260, h * 0.7);
    midground.fillRect(w * 0.76, h * 0.08, 150, h * 0.8);
    for (let i = 0; i < 8; i++) {
      midground.fillRect(w * 0.6 + i * 32, h * 0.13, 20, 24);
    }
    // Left bastion tower
    midground.fillRect(-20, h * 0.24, w * 0.12, h * 0.6);
    for (let i = 0; i < 3; i++) {
      midground.fillRect(i * 32, h * 0.21, 18, 20);
    }
    this.envContainer.add(midground);

    // 4. Battlements Arena Floor
    const ground = this.add.graphics();
    ground.fillStyle(pal.groundColor, 1);
    ground.fillRect(0, this.groundY, w, h - this.groundY);

    // Stone pavement grid
    ground.lineStyle(1.5, pal.pavementColor, 0.65);
    for (let x = 0; x < w; x += 55) {
      ground.lineBetween(x, this.groundY, x, h);
    }
    for (let y = this.groundY; y < h; y += 26) {
      ground.lineBetween(0, y, w, y);
    }
    this.envContainer.add(ground);

    // 5. Torches (positioned on arena perimeter across full width)
    this.createTorch(w * 0.05, this.groundY - 32, pal.torchColor);
    this.createTorch(w * 0.95, this.groundY - 32, pal.torchColor);

    // 6. Weather / Ambient Particles
    this.createWeatherFX(w, h, pal.particleColor);
    // 7. Random ambient life — birds, bats, embers, leaves, lightning.
    this.setupAmbientLife(w, h, pal);
  }

  private ambientTimers: Phaser.Time.TimerEvent[] = [];

  private setupAmbientLife(w: number, h: number, pal: EnvironmentPalette) {
    // Clear any previous timers so stage changes don't accumulate.
    this.ambientTimers.forEach((t) => t.remove(false));
    this.ambientTimers = [];

    const theme = this.currentStageConfig.theme;

    // Pick wildlife tint per theme — bats in dark places, crows on fortress, hawks in desert.
    const birdColor = theme === 'caldera'
      ? 0x1a0808
      : theme === 'frost'
      ? 0x9fcfe8
      : theme === 'forest'
      ? 0x080810
      : theme === 'desert'
      ? 0x3a2314
      : 0x121a24;

    // Spawn 1–3 birds flying across at random intervals.
    const spawnBird = () => {
      if (!this.scene.isActive()) return;
      const flock = 1 + Math.floor(Math.random() * 3);
      const goingRight = Math.random() < 0.5;
      const startX = goingRight ? -40 : w + 40;
      const endX = goingRight ? w + 40 : -40;
      const baseY = 60 + Math.random() * (this.groundY - 160);
      for (let i = 0; i < flock; i++) {
        const b = this.add.graphics();
        b.setDepth(5);
        const y0 = baseY + i * 14;
        const scale = 0.75 + Math.random() * 0.5;
        b.setPosition(startX, y0);
        // Simple V-shape bird that will be "animated" by redrawing on tween repeat.
        let flap = 0;
        const draw = () => {
          b.clear();
          const dir = goingRight ? 1 : -1;
          const open = Math.sin(flap) * 0.4 + 0.3;
          b.lineStyle(2, birdColor, 0.9);
          b.beginPath();
          b.moveTo(-7 * dir, -open * 7);
          b.lineTo(0, 0);
          b.lineTo(7 * dir, -open * 7);
          b.strokePath();
          flap += 0.6;
        };
        draw();
        const flapEvent = this.time.addEvent({ delay: 110, loop: true, callback: () => { draw(); b.scale = scale; } });
        this.ambientTimers.push(flapEvent);
        this.tweens.add({
          targets: b,
          x: endX,
          y: y0 + (Math.random() - 0.5) * 60,
          duration: 7000 + Math.random() * 5000,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            flapEvent.remove(false);
            b.destroy();
          },
        });
      }
      // Schedule next flock.
      const t = this.time.delayedCall(5000 + Math.random() * 11000, spawnBird);
      this.ambientTimers.push(t);
    };
    // Kick off birds after a short delay.
    this.ambientTimers.push(this.time.delayedCall(1500 + Math.random() * 2500, spawnBird));

    // Floating drift motes (leaves / embers / ash) themed per environment.
    const spawnMote = () => {
      if (!this.scene.isActive()) return;
      const mote = this.add.graphics();
      mote.setDepth(6);
      const mx = Math.random() * w;
      const my = this.groundY * (0.3 + Math.random() * 0.5);
      const moteColor =
        theme === 'caldera'
          ? 0xff6a24
          : theme === 'frost'
          ? 0xd0e8ff
          : theme === 'forest'
          ? 0x7fff6a
          : theme === 'desert'
          ? 0xe9c66a
          : pal.particleColor;
      mote.fillStyle(moteColor, 0.9);
      // Shape: ember = circle, leaf = tiny triangle, ash = circle
      if (theme === 'forest') {
        mote.fillTriangle(0, -3, 3, 3, -3, 3);
      } else {
        mote.fillCircle(0, 0, 2 + Math.random() * 1.5);
      }
      mote.setPosition(mx, my).setAlpha(0.8);
      const driftX = (Math.random() - 0.5) * 160;
      this.tweens.add({
        targets: mote,
        x: mx + driftX,
        y: my + (theme === 'caldera' ? -200 : 180),
        alpha: 0,
        angle: 360,
        duration: 3800 + Math.random() * 2600,
        ease: 'Sine.easeInOut',
        onComplete: () => mote.destroy(),
      });
      const t = this.time.delayedCall(240 + Math.random() * 420, spawnMote);
      this.ambientTimers.push(t);
    };
    this.ambientTimers.push(this.time.delayedCall(500, spawnMote));

    // Occasional lightning flash in forest/frost themes.
    if (theme === 'forest' || theme === 'frost') {
      const spawnLightning = () => {
        if (!this.scene.isActive()) return;
        if (Math.random() < 0.35) {
          const flash = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0.6).setDepth(50);
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 180,
            onComplete: () => flash.destroy(),
          });
        }
        const t = this.time.delayedCall(14000 + Math.random() * 22000, spawnLightning);
        this.ambientTimers.push(t);
      };
      this.ambientTimers.push(this.time.delayedCall(6000 + Math.random() * 8000, spawnLightning));
    }

    // Shooting star / meteor on night-themed stages.
    if (theme === 'forest' || theme === 'fortress' || theme === 'frost') {
      const spawnStar = () => {
        if (!this.scene.isActive()) return;
        const sx = Math.random() * w;
        const sy = 10 + Math.random() * 80;
        const star = this.add.graphics();
        star.setDepth(5);
        star.lineStyle(2, 0xffffff, 0.9);
        star.lineBetween(0, 0, -24, 10);
        star.fillStyle(0xffffff, 1);
        star.fillCircle(0, 0, 1.6);
        star.setPosition(sx, sy);
        this.tweens.add({
          targets: star,
          x: sx + 180,
          y: sy + 60,
          alpha: 0,
          duration: 900,
          onComplete: () => star.destroy(),
        });
        const t = this.time.delayedCall(18000 + Math.random() * 28000, spawnStar);
        this.ambientTimers.push(t);
      };
      this.ambientTimers.push(this.time.delayedCall(5000 + Math.random() * 15000, spawnStar));
    }
  }

  private createTorch(x: number, y: number, flameColor: number) {
    const post = this.add.rectangle(x, y + 25, 8, 48, 0x221a14);
    const flame = this.add.ellipse(x, y, 16, 26, flameColor).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flame,
      scaleX: 0.8,
      scaleY: 1.25,
      alpha: 0.85,
      duration: 160 + Math.random() * 60,
      yoyo: true,
      repeat: -1,
    });
    this.envContainer.add([post, flame]);
  }

  private createWeatherFX(w: number, h: number, particleColor: number) {
    const canvas = this.textures.createCanvas('weatherParticle', 6, 6);
    if (canvas) {
      const ctx = canvas.getContext();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      canvas.refresh();
    }

    this.weatherParticles = this.add
      .particles(0, 0, 'weatherParticle', {
        x: { min: 0, max: w },
        y: { min: -20, max: 20 },
        speedY: { min: 20, max: 70 },
        speedX: { min: -20, max: 35 },
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.7, end: 0 },
        tint: particleColor,
        lifespan: 5500,
        frequency: 180,
      })
      .setDepth(6);
  }

  private setupInputs() {
    // ── Rock-solid unified input: seamless click-to-shoot & drag-to-aim for Desktop & Mobile ──
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.gameOver) return;

      if (p.rightButtonDown()) {
        // Desktop right-click: cycle arrow type
        const types: ArrowType[] = ['normal', 'fire', 'ice', 'poison', 'arcane', 'thunder', 'shadow', 'holy', 'wind', 'void'];
        const idx = types.indexOf(this.selectedArrow);
        const next = types[(idx + 1) % types.length];
        this.selectArrowType(next);
        return;
      }

      this.isDragging = true;
      this.updateAim(p.x, p.y);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.gameOver) return;
      const isTouch = p.wasTouch || (p.event as PointerEvent)?.pointerType === 'touch';

      if (isTouch) {
        if (this.isDragging) {
          this.updateAim(p.x, p.y);
        }
      } else {
        // Desktop mouse: moving cursor continuously aims towards mouse
        this.updateAim(p.x, p.y);
      }
    });

    this.input.on('pointerup', () => {
      soundManager.stopBowDraw();
      if (this.gameOver) return;
      if (this.isDragging) {
        this.isDragging = false;
        this.shootPlayerArrow();
      }
    });

    this.input.on('gameout', () => {
      soundManager.stopBowDraw();
      this.isDragging = false;
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.shootPlayerArrow());
    this.input.keyboard?.on('keydown-ONE', () => this.selectArrowType('normal'));
    this.input.keyboard?.on('keydown-TWO', () => this.selectArrowType('fire'));
    this.input.keyboard?.on('keydown-THREE', () => this.selectArrowType('ice'));
    this.input.keyboard?.on('keydown-FOUR', () => this.selectArrowType('poison'));
    this.input.keyboard?.on('keydown-FIVE', () => this.selectArrowType('arcane'));
    this.input.keyboard?.on('keydown-SIX', () => this.selectArrowType('thunder'));
    this.input.keyboard?.on('keydown-SEVEN', () => this.selectArrowType('shadow'));
    this.input.keyboard?.on('keydown-EIGHT', () => this.selectArrowType('holy'));
    this.input.keyboard?.on('keydown-NINE', () => this.selectArrowType('wind'));
    this.input.keyboard?.on('keydown-ZERO', () => this.selectArrowType('void'));
    this.input.keyboard?.on('keydown-Q', () => this.activateShield());
    this.input.keyboard?.on('keydown-E', () => this.activateDash());
    this.input.keyboard?.on('keydown-F', () => this.activateSlowMo());
    this.input.keyboard?.on('keydown-R', () => this.restartBattle());
  }

  private updateAim(px: number, py: number) {
    // Stable pivot anchor at the archer's shoulder (never jitters or feedbacks)
    const pivotX = this.player.container.x + 10;
    const pivotY = this.player.container.y - 30;

    let targetAngle = this.aimAngle;
    let targetPower = this.power;

    if (px >= pivotX - 25) {
      // 1. DIRECT AIMING (Pointing toward the enemy on the right)
      const dx = Math.max(15, px - pivotX);
      const dy = pivotY - py; // Screen Y is inverted: higher py is lower
      targetAngle = Math.atan2(dy, dx);
      targetPower = Phaser.Math.Clamp(Math.hypot(dx, dy) / 260, 0.35, 1.0);
    } else {
      // 2. SLINGSHOT PULL-BACK (Pulling backward to the left of the archer)
      const pullDx = Math.max(15, pivotX - px);
      const pullDy = py - pivotY; // Pulling down angles the shot upward
      targetAngle = Math.atan2(pullDy, pullDx);
      targetPower = Phaser.Math.Clamp(Math.hypot(pullDx, pullDy) / 180, 0.35, 1.0);
    }

    // Clamped within clean, realistic archery ballistic trajectory angles
    this.aimAngle = Phaser.Math.Clamp(targetAngle, -0.12, 1.32);
    this.power = Phaser.Math.Clamp(targetPower, 0.3, 1.0);

    this.player.aim(this.aimAngle, this.power);
    if (this.isDragging) {
      soundManager.playBowDraw(this.power);
    }
    this.drawTrajectory();
  }

  // Trajectory & Impact Prediction Crosshair Marker
  private drawTrajectory() {
    if (!this.trajectoryGraphics || !this.impactMarkerGraphics) return;
    this.trajectoryGraphics.clear();
    this.impactMarkerGraphics.clear();

    const origin = this.player.getArrowLaunchPosition(this.aimAngle, this.power);
    const ox = origin.x;
    const oy = origin.y;
    const w = this.scale.width;

    const colors: Record<ArrowType, number> = {
      normal: 0xffffff,
      fire: 0xff7e26,
      ice: 0x69ddff,
      poison: 0x76ea48,
      arcane: 0xc986ff,
      thunder: 0xffe533,
      shadow: 0x9c61ff,
      holy: 0xfff5a0,
      wind: 0x7fffd4,
      void: 0xff4dff,
    };

    const color = colors[this.selectedArrow];
    this.trajectoryGraphics.lineStyle(2.5, color, 0.7);
    this.trajectoryGraphics.beginPath();

    const up = saveManager.getData().upgrades;
    const equippedBow = saveManager.getEquippedBow();
    const equippedHero = saveManager.getEquippedHero();
    const heroSpeed = equippedHero?.perks?.speedBonus || 0;
    const speedMultiplier = 1.0 + up.bowPower * 0.12 + equippedBow.bonusSpeed + heroSpeed;
    const v = this.power * 680 * speedMultiplier;
    const g = 460;

    let impactX = 0;
    let impactY = 0;
    let hitFound = false;
    let hitPartTarget: BodyPartHit | null = null;

    let prevX = ox;
    let prevY = oy;

    for (let t = 0; t <= 1.25; t += 0.035) {
      const x = ox + Math.cos(this.aimAngle) * v * t + this.wind * t * t * 26;
      const y = oy - Math.sin(this.aimAngle) * v * t + 0.5 * g * t * t;

      if (t === 0) {
        this.trajectoryGraphics.moveTo(x, y);
      } else {
        this.trajectoryGraphics.lineTo(x, y);
      }

      // Continuous collision check with enemy
      if (!hitFound && this.enemy && this.enemy.animState !== 'dead') {
        const hit = this.enemy.checkBodyPartHit(prevX, prevY, x, y);
        if (hit) {
          impactX = x;
          impactY = y;
          hitPartTarget = hit;
          hitFound = true;
        }
      }

      if (!hitFound && y >= this.groundY) {
        impactX = x;
        impactY = this.groundY;
        hitFound = true;
      }

      prevX = x;
      prevY = y;
      if (x > w || y > this.groundY) break;
    }
    this.trajectoryGraphics.strokePath();

    // Dotted trajectory preview
    this.trajectoryGraphics.fillStyle(color, 0.95);
    for (let t = 0.12; t < 1.0; t += 0.14) {
      const x = ox + Math.cos(this.aimAngle) * v * t + this.wind * t * t * 26;
      const y = oy - Math.sin(this.aimAngle) * v * t + 0.5 * g * t * t;
      if (x < w && y < this.groundY) {
        this.trajectoryGraphics.fillCircle(x, y, 3);
      }
    }

    // Impact Prediction Marker & Dynamic Target Lock Crosshair
    if (hitFound && impactX < w) {
      let reticleColor = color;
      let reticleRadius = 9;

      if (hitPartTarget === 'head') {
        reticleColor = 0xff2a2a; // Critical Headshot Red!
        reticleRadius = 14;
        // Outer pulsing lock ring
        this.impactMarkerGraphics.lineStyle(1.5, 0xffe63b, 0.85);
        this.impactMarkerGraphics.strokeCircle(impactX, impactY, 20);
      } else if (hitPartTarget === 'shield') {
        reticleColor = 0x47a8ff; // Shield Blue
        reticleRadius = 11;
      } else if (hitPartTarget === 'torso') {
        reticleColor = 0xffaa2b; // Torso Gold
        reticleRadius = 10;
      }

      this.impactMarkerGraphics.lineStyle(2.5, reticleColor, 0.95);
      this.impactMarkerGraphics.strokeCircle(impactX, impactY, reticleRadius);
      this.impactMarkerGraphics.fillStyle(reticleColor, 0.4);
      this.impactMarkerGraphics.fillCircle(impactX, impactY, 4.5);

      // Tactical Crosshairs
      this.impactMarkerGraphics.lineBetween(impactX - 16, impactY, impactX - 5, impactY);
      this.impactMarkerGraphics.lineBetween(impactX + 5, impactY, impactX + 16, impactY);
      this.impactMarkerGraphics.lineBetween(impactX, impactY - 16, impactX, impactY - 5);
      this.impactMarkerGraphics.lineBetween(impactX, impactY + 5, impactX, impactY + 16);
    }

    // Draw the visible aim controller overlay (protractor + needle + badge)
    this.drawAimController(color);
  }

  // ── Visible On-Screen Aim Controller ──────────────────────────────────────
  private drawAimController(color: number) {
    const g = this.aimControllerGfx;
    g.clear();

    const cx = this.player.container.x + 10;
    const cy = this.player.container.y - 32;
    const R = 52; // protractor radius

    // Power-based accent colour transitions: cyan→gold→red
    let accentColor: number;
    if (this.power < 0.5) {
      accentColor = 0x00e8ff; // cyan
    } else if (this.power < 0.8) {
      accentColor = 0xffd000; // gold
    } else {
      accentColor = 0xff3c2a; // blazing red
    }

    // --- Outer guide ring (always visible, low opacity) ---
    g.lineStyle(1.2, accentColor, 0.28);
    g.strokeCircle(cx, cy, R + 8);

    if (!this.isDragging) {
      // Idle: draw a soft pulsing hint ring only
      return;
    }

    // --- Protractor arc (0° to 90° fan) ---
    g.lineStyle(1.0, 0xffffff, 0.18);
    g.beginPath();
    const arcSteps = 18;
    for (let i = 0; i <= arcSteps; i++) {
      const a = (i / arcSteps) * (Math.PI / 2); // 0 → 90°
      const ax = cx + Math.cos(a) * R;
      const ay = cy - Math.sin(a) * R;
      if (i === 0) g.moveTo(ax, ay);
      else g.lineTo(ax, ay);
    }
    g.strokePath();

    // Angle tick marks every 15°
    for (let deg = 0; deg <= 75; deg += 15) {
      const rad = Phaser.Math.DegToRad(deg);
      const inner = R - 7;
      const outer = R;
      g.lineStyle(1.0, 0xffffff, 0.45);
      g.lineBetween(
        cx + Math.cos(rad) * inner,
        cy - Math.sin(rad) * inner,
        cx + Math.cos(rad) * outer,
        cy - Math.sin(rad) * outer
      );
    }

    // --- Power arc fill (arc segment filling up with power) ---
    const powerArcR = R - 13;
    g.lineStyle(4, accentColor, 0.55);
    g.beginPath();
    const pSteps = Math.round(this.power * 14);
    for (let i = 0; i <= pSteps; i++) {
      const a = (i / 14) * (Math.PI / 2);
      const ax = cx + Math.cos(a) * powerArcR;
      const ay = cy - Math.sin(a) * powerArcR;
      if (i === 0) g.moveTo(ax, ay);
      else g.lineTo(ax, ay);
    }
    g.strokePath();

    // --- Direction needle ---
    const needleLen = R - 4;
    const nx = cx + Math.cos(this.aimAngle) * needleLen;
    const ny = cy - Math.sin(this.aimAngle) * needleLen;

    // Needle shaft
    g.lineStyle(2.5, accentColor, 0.92);
    g.lineBetween(cx, cy, nx, ny);

    // Arrowhead on needle tip
    const headLen = 10;
    const headW = 0.45;
    const perpAngle = this.aimAngle + Math.PI / 2;
    g.fillStyle(accentColor, 0.92);
    g.fillTriangle(
      nx, ny,
      nx - Math.cos(this.aimAngle) * headLen + Math.cos(perpAngle) * headW * headLen,
      ny + Math.sin(this.aimAngle) * headLen - Math.sin(perpAngle) * headW * headLen,
      nx - Math.cos(this.aimAngle) * headLen - Math.cos(perpAngle) * headW * headLen,
      ny + Math.sin(this.aimAngle) * headLen + Math.sin(perpAngle) * headW * headLen
    );

    // Pivot dot
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(accentColor, 1.0);
    g.fillCircle(cx, cy, 2.5);

    // --- Elastic bowstring pull bead ---
    // Bead along pull-back direction (opposite to needle)
    const pullRatio = (this.power - 0.3) / 0.7; // 0..1
    const beadDist = pullRatio * 22;
    const beadX = cx - Math.cos(this.aimAngle) * beadDist;
    const beadY = cy + Math.sin(this.aimAngle) * beadDist;
    g.lineStyle(1.5, color, 0.55);
    g.lineBetween(cx - 8, cy, beadX, beadY);
    g.lineBetween(cx + 8, cy, beadX, beadY);
    g.fillStyle(0xffffff, 0.88);
    g.fillCircle(beadX, beadY, 4);
    g.fillStyle(accentColor, 1.0);
    g.fillCircle(beadX, beadY, 2.5);

    // --- Floating angle & power badge above the archer ---
    const angleDeg = Math.round(Phaser.Math.RadToDeg(this.aimAngle));
    const powerPct = Math.round(this.power * 100);
    const badge = `🎯 ${angleDeg}° · ${powerPct}% PWR`;
    this.aimBadgeText
      .setText(badge)
      .setPosition(cx - 46, cy - R - 30)
      .setVisible(true);
  }

  private clearAimController() {
    this.aimControllerGfx?.clear();
    this.aimBadgeText?.setVisible(false);
  }

  public selectArrowType(type: ArrowType) {
    if (this.arrowCounts[type] <= 0) {
      this.syncHud(`No ${type.toUpperCase()} arrows remaining!`);
      return;
    }
    this.selectedArrow = type;
    this.drawTrajectory();
    this.syncHud(`Selected ${type.toUpperCase()} arrow.`);
  }

  // Exact Arrow Firing from Player Character Model
  public shootPlayerArrow() {
    if (this.gameOver) return;

    // Auto-fallback if selected arrow type is out of ammo so bow NEVER jams
    if (this.arrowCounts[this.selectedArrow] <= 0) {
      if (this.selectedArrow !== 'normal' && this.arrowCounts['normal'] > 0) {
        this.selectedArrow = 'normal';
        this.syncHud('Special arrows empty, switched to Steel arrows.');
      } else {
        this.arrowCounts['normal'] = Math.max(1, this.arrowCounts['normal']);
        this.selectedArrow = 'normal';
      }
    }

    this.arrowCounts[this.selectedArrow]--;
    this.shotsFired++;
    this.stamina = Math.max(0, this.stamina - 10);
    this.player.shootRecoil();
    soundManager.playBowRelease();
    soundManager.playArrowWhistle();
    this.trajectoryGraphics.clear();
    this.impactMarkerGraphics.clear();
    this.clearAimController();

    // Cinematic recoil: only a gentle push — aimReleaseDecay handles the zoom-out gracefully
    this.zoomPunch = Math.max(this.zoomPunch, 0.035);

    // Haptic feedback on shoot (mobile)
    navigator.vibrate?.(16);

    // Exact World Coordinate of Bow & Arrow Tip
    const launchPos = this.player.getArrowLaunchPosition(this.aimAngle, this.power);
    const ox = launchPos.x;
    const oy = launchPos.y;

    const up = saveManager.getData().upgrades;
    const equippedBow = saveManager.getEquippedBow();
    const equippedHero = saveManager.getEquippedHero();
    const heroSpeed = equippedHero?.perks?.speedBonus || 0;
    const speedMultiplier = 1.0 + up.bowPower * 0.12 + equippedBow.bonusSpeed + heroSpeed;
    const initialV = this.power * 680 * speedMultiplier;
    let vx = Math.cos(this.aimAngle) * initialV;
    let vy = -Math.sin(this.aimAngle) * initialV;
    let x = ox;
    let y = oy;

    const arrowTint: Record<ArrowType, number> = {
      normal: 0xf5eedb,
      fire: 0xff6622,
      ice: 0x76ecff,
      poison: 0x72eb3e,
      arcane: 0xb977ff,
      thunder: 0xffe533,
      shadow: 0x7a3fcf,
      holy: 0xfffbe0,
      wind: 0x7fffcf,
      void: 0xff00ff,
    };
    const arrowShaft: Record<ArrowType, number> = {
      normal: 0xc8a96e,
      fire: 0xcc3300,
      ice: 0x2299cc,
      poison: 0x2a9a10,
      arcane: 0x7733cc,
      thunder: 0xb8a000,
      shadow: 0x2d0066,
      holy: 0xf5e87a,
      wind: 0x3abf8c,
      void: 0x5c005c,
    };
    const arrowGlow: Record<ArrowType, number | null> = {
      normal: null,
      fire: 0xff4400,
      ice: 0x44ddff,
      poison: 0x44ff00,
      arcane: 0xcc55ff,
      thunder: 0xffee00,
      shadow: 0x8833ff,
      holy: 0xffffaa,
      wind: 0x55ffcc,
      void: 0xff00ff,
    };

    /** Realistic Medieval Archery Projectile: steel broadhead razor, cedar wood shaft, silk cresting & triple feather fletchings */
    const buildArrowGraphics = (tipColor: number, shaftColor: number, glowColor: number | null): Phaser.GameObjects.Graphics => {
      const g = this.add.graphics().setDepth(25);

      // Optional atmospheric elemental halo around arrow tip
      if (glowColor !== null) {
        g.fillStyle(glowColor, 0.35);
        g.fillCircle(20, 0, 9);
      }

      // 1. Cedar / Carbon Shaft (36px long, 2.5px wide)
      g.fillStyle(shaftColor, 1);
      g.fillRect(-18, -1.3, 30, 2.6);
      // Woodgrain specular highlight streak along the shaft
      g.fillStyle(0xf7edd5, 0.75);
      g.fillRect(-18, -0.6, 28, 1);

      // 2. Steel Broadhead Hunting Razor Tip
      // Dark carbon bevel core
      g.fillStyle(0x3d4f5c, 1);
      g.fillTriangle(26, 0, 11, -4.5, 11, 4.5);
      // Silver razor cutting-edge highlight
      g.fillStyle(tipColor, 1);
      g.fillTriangle(26, 0, 12, -3, 12, 3);

      // Black sinew ferrule thread binding broadhead to shaft
      g.fillStyle(0x19140e, 1);
      g.fillRect(8, -1.6, 3.5, 3.2);

      // 3. Silk Cresting Wraps (Authentic traditional arrow banding)
      g.fillStyle(0xdba43b, 1);
      g.fillRect(-9, -1.6, 1.8, 3.2);
      g.fillStyle(0xc93626, 1);
      g.fillRect(-11, -1.6, 1.8, 3.2);

      // 4. Parabolic Feather Fletchings (Upper & Lower Barbed Vanes)
      g.fillStyle(tipColor, 0.95);
      g.fillTriangle(-19, 0, -11, -6, -9, 0); // Upper vane
      g.fillTriangle(-19, 0, -11, 6, -9, 0);  // Lower vane
      // Feather barb inner shadow
      g.fillStyle(0x1a242f, 0.3);
      g.fillTriangle(-17, 0, -12, -4, -10, 0);
      g.fillTriangle(-17, 0, -12, 4, -10, 0);

      // 5. Rear Horn Nock with string groove
      g.fillStyle(0x2b1c11, 1);
      g.fillCircle(-19, 0, 1.6);

      return g;
    };

    const arrowGfx = buildArrowGraphics(arrowTint[this.selectedArrow], arrowShaft[this.selectedArrow], arrowGlow[this.selectedArrow]);
    arrowGfx.setPosition(ox, oy);
    const trail = this.add.graphics().setDepth(24);

    const type = this.selectedArrow;
    const timer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = this.slowActive ? 0.007 : 0.016;
        const oldX = x;
        const oldY = y;

        if (type === 'arcane' && this.enemy.animState !== 'dead') {
          const targetY = this.enemy.container.y - 35;
          const dy = targetY - y;
          vy += dy * dt * 3.5;
        }

        x += vx * dt + this.wind * dt * dt * 26;
        vy += 460 * dt;
        y += vy * dt;

        arrowGfx.setPosition(x, y).setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));

        trail.lineStyle(2.5, arrowTint[type], 0.65);
        trail.lineBetween(oldX, oldY, x, y);

        this.enemyAI.inspectIncomingArrow({ x, y, vx, vy, type }, this.enemyFrozen);

        // Continuous Collision Detection against Enemy (segment oldX,oldY to x,y)
        const hitPart = this.enemy.checkBodyPartHit(oldX, oldY, x, y);
        if (hitPart) {
          timer.remove();
          arrowGfx.destroy();
          trail.destroy();
          this.handleArrowHitEnemy(hitPart, type, vx, vy, x, y);
          return;
        }

        // Ground / Arena Bounds
        if (y >= this.groundY || x > this.scale.width + 30 || y < -100) {
          timer.remove();
          arrowGfx.destroy();
          trail.destroy();
          if (y >= this.groundY && x <= this.scale.width + 25) {
            this.handleArrowGroundImpact(x, this.groundY, type, vx, vy, false);
          } else {
            this.combo = 0;
            this.syncHud('Missed target!');
          }
        }
      },
    });
  }

  // --- GROUND IMPACT & ELEMENTAL HAZARDS SYSTEM ---
  private handleArrowGroundImpact(
    x: number,
    y: number,
    type: ArrowType,
    vx: number,
    vy: number,
    isEnemy = false
  ) {
    if (!isEnemy) {
      this.combo = 0;
    }
    soundManager.playGroundElementalImpact(type);
    this.cameras.main.shake(100, 0.003);

    if (type === 'fire') {
      // 1. Scorch mark on the pavement
      if (this.bloodStainsGfx) {
        this.bloodStainsGfx.fillStyle(0x130a05, 0.88);
        this.bloodStainsGfx.fillEllipse(x, y + 2, 48, 13);
        this.bloodStainsGfx.fillStyle(0x351206, 0.65);
        this.bloodStainsGfx.fillEllipse(x, y + 2, 28, 8);
      }

      // 2. Burst of bright fire sparks
      for (let i = 0; i < 22; i++) {
        const p = this.add.circle(x, y, Phaser.Math.Between(2, 4.5), Math.random() < 0.5 ? 0xff5511 : 0xffaa22).setDepth(26);
        this.tweens.add({
          targets: p,
          x: x + Phaser.Math.Between(-50, 50),
          y: y - Phaser.Math.Between(15, 65),
          alpha: 0,
          scale: 0.1,
          duration: 350 + Math.random() * 300,
          onComplete: () => p.destroy(),
        });
      }

      // 3. Lingering ground fire patch: 8 animated flame tongues dancing for 3.5s
      for (let i = 0; i < 8; i++) {
        const fx = x + (i - 3.5) * 6 + Phaser.Math.Between(-3, 3);
        const flame = this.add.ellipse(fx, y - 5, Phaser.Math.Between(9, 14), Phaser.Math.Between(16, 26), 0xff4411).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
        const core = this.add.ellipse(fx, y - 3, 5, 12, 0xffe63b).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
        this.groundEffectsContainer.add([flame, core]);

        this.tweens.add({
          targets: [flame, core],
          scaleY: { from: 0.7, to: 1.3 },
          scaleX: { from: 1.2, to: 0.8 },
          y: y - Phaser.Math.Between(7, 13),
          alpha: { from: 0.95, to: 0.55 },
          duration: 110 + Math.random() * 70,
          yoyo: true,
          repeat: 24, // ~3.5s
          onComplete: () => {
            flame.destroy();
            core.destroy();
          },
        });
      }

      // 4. Proximity Hazard: if enemy is near the ground fire, ignite them!
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 65) {
          this.burning = true;
          this.burnTimer = 3.5;
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, 'GROUND FIRE! BURN', '#ff6622', true);
        }
      }

      if (!isEnemy) this.syncHud('Fire arrow ignited a blaze on the ground!');
    } else if (type === 'ice') {
      // 1. Shards of sharp frost ice exploding outward
      for (let i = 0; i < 18; i++) {
        const shard = this.add.polygon(x, y, [0, -3.5, 3, 0, 0, 3.5, -3, 0], 0xc7f6ff).setDepth(26);
        this.tweens.add({
          targets: shard,
          x: x + Phaser.Math.Between(-55, 55),
          y: y - Phaser.Math.Between(12, 55),
          angle: Phaser.Math.Between(-180, 180),
          alpha: 0,
          duration: 400 + Math.random() * 250,
          onComplete: () => shard.destroy(),
        });
      }

      // 2. Spreading frozen ice sheet with icicles
      const frostGfx = this.add.graphics().setDepth(5);
      frostGfx.fillStyle(0x69ddff, 0.65);
      frostGfx.fillEllipse(x, y + 2, 56, 14);
      frostGfx.fillStyle(0xd6f7ff, 0.85);
      frostGfx.fillEllipse(x, y + 1, 38, 8);
      // Icicle spikes
      for (let i = 0; i < 5; i++) {
        const spX = x + (i - 2) * 10;
        const spH = Phaser.Math.Between(10, 18);
        frostGfx.fillStyle(0x9ee7ff, 0.9);
        frostGfx.fillTriangle(spX - 3.5, y, spX, y - spH, spX + 3.5, y);
      }
      this.groundEffectsContainer.add(frostGfx);

      this.tweens.add({
        targets: frostGfx,
        alpha: 0,
        delay: 2800,
        duration: 1000,
        onComplete: () => frostGfx.destroy(),
      });

      // 3. Proximity Hazard: if enemy near frozen ground, freeze them!
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 65) {
          this.enemyFrozen = true;
          this.freezeTimer = 2.6;
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, 'GROUND FROST! FROZEN', '#69ddff', true);
        }
      }

      if (!isEnemy) this.syncHud('Ice arrow froze the ground into a glacial hazard!');
    } else if (type === 'poison') {
      // 1. Splatter of acid droplets
      for (let i = 0; i < 20; i++) {
        const drop = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0x5aff33).setDepth(26);
        this.tweens.add({
          targets: drop,
          x: x + Phaser.Math.Between(-48, 48),
          y: y - Phaser.Math.Between(10, 42),
          alpha: 0,
          duration: 350 + Math.random() * 250,
          onComplete: () => drop.destroy(),
        });
      }

      // 2. Corrosive bubbling slime puddle
      const pool = this.add.graphics().setDepth(5);
      pool.fillStyle(0x277a16, 0.78);
      pool.fillEllipse(x, y + 2, 52, 14);
      pool.fillStyle(0x4ee82c, 0.65);
      pool.fillEllipse(x, y + 1, 34, 8);
      this.groundEffectsContainer.add(pool);

      // Rising bubbling acid
      for (let b = 0; b < 6; b++) {
        const bx = x + Phaser.Math.Between(-18, 18);
        const bubble = this.add.circle(bx, y, 2.2, 0x76ea48).setDepth(6);
        this.groundEffectsContainer.add(bubble);
        this.tweens.add({
          targets: bubble,
          scale: { from: 0.5, to: 2.2 },
          y: y - Phaser.Math.Between(4, 13),
          alpha: { from: 1, to: 0 },
          duration: 320 + Math.random() * 250,
          repeat: 8,
          onComplete: () => bubble.destroy(),
        });
      }

      this.tweens.add({
        targets: pool,
        alpha: 0,
        delay: 2600,
        duration: 900,
        onComplete: () => pool.destroy(),
      });

      // 3. Proximity Hazard: poison stacks
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 65) {
          this.poisonStacks = Math.min(3, this.poisonStacks + 1);
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, 'VENOM POOL! POISON', '#5aff33', true);
        }
      }

      if (!isEnemy) this.syncHud('Poison arrow created a corrosive acid pool on the floor!');
    } else if (type === 'arcane') {
      // 1. Astral shockwave expansion
      const wave = this.add.circle(x, y, 10, 0xcb80ff, 0.65).setDepth(25);
      this.tweens.add({
        targets: wave,
        scaleX: 5.5,
        scaleY: 1.8,
        alpha: 0,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => wave.destroy(),
      });

      // 2. Runic star glyph
      const rune = this.add.graphics().setDepth(5);
      rune.lineStyle(2, 0xde99ff, 0.9);
      rune.strokeEllipse(x, y + 2, 56, 16);
      rune.lineStyle(1.4, 0xffffff, 0.8);
      rune.strokeCircle(x, y + 2, 10);
      this.groundEffectsContainer.add(rune);

      this.tweens.add({
        targets: rune,
        alpha: 0,
        delay: 2500,
        duration: 800,
        onComplete: () => rune.destroy(),
      });

      // 3. Proximity Hazard: Arcane shockwave blast
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 65) {
          const blastDmg = 16;
          this.enemyHp = Math.max(0, this.enemyHp - blastDmg);
          this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
          this.showFloatingText(x, y - 35, `ASTRAL NOVA! ${blastDmg}`, '#de99ff', true);
          if (this.enemyHp <= 0) this.handleEnemyDefeat(vx * 0.3, vy * 0.3, 'legs');
        }
      }

      if (!isEnemy) this.syncHud('Arcane arrow ruptured reality with an astral nova!');
    } else if (type === 'thunder') {
      // Lightning bolt strike: bright white/yellow flash + shockwave ring
      for (let i = 0; i < 3; i++) {
        const bolt = this.add.graphics().setDepth(26);
        bolt.lineStyle(3 - i, i === 0 ? 0xffffff : 0xffe533, 0.95 - i * 0.2);
        const bx = x + Phaser.Math.Between(-10, 10);
        bolt.lineBetween(bx, y - 80, bx + Phaser.Math.Between(-8, 8), y);
        this.tweens.add({ targets: bolt, alpha: 0, duration: 280, onComplete: () => bolt.destroy() });
      }
      const ring = this.add.circle(x, y, 8, 0xffe533, 0.7).setDepth(25);
      this.tweens.add({ targets: ring, scaleX: 6, scaleY: 2, alpha: 0, duration: 400, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      this.cameras.main.shake(180, 0.008);
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 75) {
          this.enemyFrozen = true; this.freezeTimer = 1.4;
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, '⚡ GROUNDED!', '#ffe533', true);
        }
      }
      if (!isEnemy) this.syncHud('Thunder arrow struck the ground with a lightning bolt!');
    } else if (type === 'shadow') {
      // Spreading dark mist cloud on ground
      for (let i = 0; i < 16; i++) {
        const mist = this.add.circle(x + Phaser.Math.Between(-30, 30), y, Phaser.Math.Between(4, 10), 0x220044, 0.7).setDepth(6);
        this.groundEffectsContainer.add(mist);
        this.tweens.add({ targets: mist, x: mist.x + Phaser.Math.Between(-20, 20), y: mist.y - Phaser.Math.Between(4, 18), alpha: 0, scale: 2.5, duration: 500 + Math.random() * 400, onComplete: () => mist.destroy() });
      }
      const shadowPatch = this.add.graphics().setDepth(5);
      shadowPatch.fillStyle(0x1a0033, 0.72);
      shadowPatch.fillEllipse(x, y + 2, 60, 16);
      this.groundEffectsContainer.add(shadowPatch);
      this.tweens.add({ targets: shadowPatch, alpha: 0, delay: 2200, duration: 900, onComplete: () => shadowPatch.destroy() });
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 65) {
          this.enemyShadowBlind = true; this.shadowBlindTimer = 3.0;
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, '🌑 SHADOW BLIND', '#9c61ff', true);
        }
      }
      if (!isEnemy) this.syncHud('Shadow arrow left a blinding dark mist on the ground!');
    } else if (type === 'holy') {
      // Sacred light pillar on ground
      const pillar = this.add.graphics().setDepth(25);
      pillar.fillStyle(0xfffbe0, 0.55);
      pillar.fillRect(x - 10, y - 90, 20, 90);
      this.tweens.add({ targets: pillar, alpha: 0, scaleY: 0.3, duration: 600, ease: 'Cubic.easeOut', onComplete: () => pillar.destroy() });
      const haloRing = this.add.circle(x, y, 12, 0xfffbe0, 0.8).setDepth(25);
      this.tweens.add({ targets: haloRing, scaleX: 5.5, scaleY: 1.5, alpha: 0, duration: 450, onComplete: () => haloRing.destroy() });
      // Holy ground heals the player slightly
      if (!isEnemy) {
        const hGain = 8;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + hGain);
        this.showFloatingText(this.player.container.x, this.player.container.y - 55, `✨ +${hGain} BLESSED`, '#fff5a0', false);
        this.syncHud('Holy arrow consecrated the ground — you feel restored!');
      }
    } else if (type === 'wind') {
      // Swirling gust tornado on impact
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const r = 20 + i * 1.5;
        const wx = x + Math.cos(angle) * r * 0.3;
        const wy = y - i * 2.5;
        const leaf = this.add.circle(wx, wy, 2.5, 0x7fffd4, 0.8).setDepth(26);
        this.tweens.add({ targets: leaf, x: wx + Phaser.Math.Between(-35, 35), y: wy - Phaser.Math.Between(10, 40), alpha: 0, duration: 380 + Math.random() * 200, onComplete: () => leaf.destroy() });
      }
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 70) {
          this.enemyWindKnocked = true; this.windKnockTimer = 2.0;
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 45, '💨 WIND KNOCKED', '#7fffd4', true);
        }
      }
      if (!isEnemy) this.syncHud('Wind arrow unleashed a swirling gust tornado!');
    } else if (type === 'void') {
      // Void singularity implosion: sucks particles inward
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const r = Phaser.Math.Between(40, 80);
        const px2 = x + Math.cos(angle) * r;
        const py2 = y + Math.sin(angle) * r * 0.4;
        const vp = this.add.circle(px2, py2, 2.5, Math.random() < 0.5 ? 0xff00ff : 0xcc00cc, 0.85).setDepth(26);
        this.tweens.add({ targets: vp, x, y, alpha: 0, duration: 350 + Math.random() * 150, ease: 'Cubic.easeIn', onComplete: () => vp.destroy() });
      }
      const voidRift = this.add.graphics().setDepth(6);
      voidRift.fillStyle(0x1a001a, 0.9);
      voidRift.fillEllipse(x, y + 2, 44, 12);
      voidRift.lineStyle(2, 0xff00ff, 0.85);
      voidRift.strokeEllipse(x, y + 2, 52, 16);
      this.groundEffectsContainer.add(voidRift);
      this.cameras.main.shake(250, 0.01);
      this.tweens.add({ targets: voidRift, alpha: 0, delay: 2000, duration: 700, onComplete: () => voidRift.destroy() });
      if (!isEnemy && this.enemy && this.enemy.animState !== 'dead') {
        if (Math.abs(this.enemy.container.x - x) < 60) {
          const voidSuctionDmg = 24;
          this.enemyHp = Math.max(0, this.enemyHp - voidSuctionDmg);
          this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
          this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 50, `✦ VOID PULL ${voidSuctionDmg}`, '#ff4dff', true);
          if (this.enemyHp <= 0) this.handleEnemyDefeat(vx * 0.3, vy * 0.3, 'legs');
        }
      }
      if (!isEnemy) this.syncHud('Void arrow tore open a singularity on the ground!');
    } else {
      // Normal Arrow: sticks into the ground at the impact angle and vibrates!
      const impactAngle = Phaser.Math.RadToDeg(Math.atan2(vy, vx));

      // Dirt specks & stone sparks
      for (let i = 0; i < 9; i++) {
        const p = this.add.circle(x, y, Phaser.Math.Between(1.5, 3), Math.random() < 0.6 ? 0x8a6e54 : 0xdad5c4).setDepth(26);
        this.tweens.add({
          targets: p,
          x: x + Phaser.Math.Between(-25, 25),
          y: y - Phaser.Math.Between(8, 28),
          alpha: 0,
          duration: 250 + Math.random() * 150,
          onComplete: () => p.destroy(),
        });
      }

      const stuck = this.add.graphics().setDepth(5);
      stuck.fillStyle(isEnemy ? 0x3a281c : 0xc8a96e, 1);
      stuck.fillRect(-16, -1.3, 24, 2.6); // Shaft
      stuck.fillStyle(0x3d4f5c, 1);
      stuck.fillTriangle(10, 0, 0, -3.5, 0, 3.5); // Broadhead in ground
      stuck.fillStyle(isEnemy ? 0xff4433 : 0xf5eedb, 0.9);
      stuck.fillTriangle(-16, 0, -10, -4, -8, 0); // Fletchings
      stuck.fillTriangle(-16, 0, -10, 4, -8, 0);
      stuck.setPosition(x, y).setAngle(impactAngle);
      this.groundEffectsContainer.add(stuck);

      // Quiver vibration
      this.tweens.add({
        targets: stuck,
        angle: { from: impactAngle - 4, to: impactAngle + 4 },
        duration: 40,
        yoyo: true,
        repeat: 4,
        ease: 'Sine.easeInOut',
      });

      this.tweens.add({
        targets: stuck,
        alpha: 0,
        delay: 3200,
        duration: 800,
        onComplete: () => stuck.destroy(),
      });

      if (!isEnemy) this.syncHud('Arrow struck and stuck into the ground!');
    }
  }

  // Arrow Hit Resolution with Visceral Finisher Kill & Blood Spray
  private handleArrowHitEnemy(
    part: BodyPartHit,
    type: ArrowType,
    vx: number,
    vy: number,
    hitX: number,
    hitY: number
  ) {
    this.shotsHit++;
    const up = saveManager.getData().upgrades;
    const equippedBow = saveManager.getEquippedBow();
    const equippedHero = saveManager.getEquippedHero();

    const baseDamageMap: Record<ArrowType, number> = {
      normal:  30,
      fire:    38,
      ice:     26,
      poison:  28,
      arcane:  46,
      thunder: 42,  // Stun + chain
      shadow:  35,  // Blind debuff
      holy:    40,  // +heal on hit
      wind:    32,  // Knockback disarm
      void:    50,  // Doubled by void rift
    };

    let damage = (baseDamageMap[type] + equippedBow.bonusDmg) * (1.0 + up.bowPower * 0.15);
    if (type === 'fire' && equippedHero?.perks?.fireBonus) {
      damage *= (1.0 + equippedHero.perks.fireBonus);
    }
    const isHeadshot = part === 'head';
    const isShield = part === 'shield';

    if (isShield && type !== 'arcane' && type !== 'void' && type !== 'wind') {
      soundManager.playShieldBlock();
      this.enemy.triggerBlock();
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 20, 'BLOCKED!', '#66ddff', false);
      this.syncHud('Enemy blocked with shield!');
      return;
    }

    if (isHeadshot) {
      const critMult = 2.5 + (equippedHero?.perks?.critBonus || 0);
      damage *= critMult;
      this.headshotCount++;
      this.cameras.main.shake(160, 0.006);
      this.triggerImpactZoom(0.12);
      this.showFloatingText(
        this.enemy.container.x,
        this.enemy.container.y - 50,
        'HEADSHOT! ' + Math.round(damage),
        '#ffdf52',
        true
      );
    } else if (part === 'legs') {
      damage *= 0.75;
      this.showFloatingText(
        this.enemy.container.x,
        this.enemy.container.y + 10,
        'LEG HIT ' + Math.round(damage),
        '#ffd3c7',
        false
      );
    } else {
      this.showFloatingText(
        this.enemy.container.x,
        this.enemy.container.y - 25,
        Math.round(damage).toString(),
        '#ffffff',
        false
      );
    }

    const nextEnemyHp = Math.max(0, this.enemyHp - Math.round(damage));
    const isKill = nextEnemyHp <= 0;
    this.enemyHp = nextEnemyHp;
    this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);

    // Visceral Blood Spray & Splatter System!
    this.createBloodSpray(hitX, hitY, vx, vy, isHeadshot, isKill);

    // Haptic feedback on enemy hit (mobile)
    navigator.vibrate?.(isHeadshot ? [40, 20, 80] : isKill ? [25, 20, 50] : [20, 10, 25]);

    // If Kill: play visceral bone-crunch & blood squelch finisher sound
    if (isKill) {
      this.triggerImpactZoom(0.16);
      soundManager.playFinisherKill(isHeadshot);
    } else {
      soundManager.playImpact(type, isHeadshot);
    }

    this.enemy.triggerHit(part, isHeadshot);

    this.combo++;
    if (this.combo === 3) {
      this.showFloatingText(this.player.container.x, this.player.container.y - 60, 'COMBO ×3!', '#ffd043', true);
    } else if (this.combo === 5) {
      this.showFloatingText(this.player.container.x, this.player.container.y - 60, 'SUPER COMBO ×5!', '#ff833b', true);
      this.cameras.main.shake(130, 0.005);
    } else if (this.combo >= 8) {
      this.showFloatingText(this.player.container.x, this.player.container.y - 60, 'UNSTOPPABLE ×8!', '#ff3b3b', true);
      this.cameras.main.shake(190, 0.007);
    }

    const comboBonus = this.combo > 1 ? this.combo * 15 : 0;
    this.score += Math.round(damage * 10) + comboBonus;
    const coinGain = Math.max(3, Math.round(damage / 7));
    this.coins += coinGain;
    saveManager.addCoins(coinGain);

    // Elemental Status Effects
    const elemBonus = 1.0 + up.elementalMastery * 0.3;
    if (type === 'fire') {
      this.burning = true;
      this.burnTimer = 3.5 * elemBonus;
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0xff5511);
    } else if (type === 'ice') {
      this.enemyFrozen = true;
      const freezeBonus = 1.0 + (equippedHero?.perks?.freezeBonus || 0);
      this.freezeTimer = 2.8 * elemBonus * freezeBonus;
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0x6be5ff);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 70, 'FROZEN!', '#6be5ff', true);
    } else if (type === 'poison') {
      this.poisonStacks = Math.min(3, this.poisonStacks + 1);
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0x5aff33);
    } else if (type === 'arcane') {
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0xcb80ff);
    } else if (type === 'thunder') {
      // Thunder: stuns + chain lightning burst
      this.enemyFrozen = true;
      this.freezeTimer = 1.6 * elemBonus;
      this.cameras.main.shake(220, 0.009);
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0xffe533);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 70, '⚡ STUNNED!', '#ffe533', true);
      // Chain lightning deals 18 bonus damage
      const chainDmg = Math.round(18 * elemBonus);
      this.enemyHp = Math.max(0, this.enemyHp - chainDmg);
      this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
      this.showFloatingText(this.enemy.container.x + 20, this.enemy.container.y - 50, `+${chainDmg} CHAIN`, '#ffee00', false);
    } else if (type === 'shadow') {
      // Shadow: applies blind (debuff — reduces enemy accuracy for 4s)
      this.enemyShadowBlind = true;
      this.shadowBlindTimer = 4.0 * elemBonus;
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0x8833ff);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 70, '🌑 BLINDED!', '#9c61ff', true);
    } else if (type === 'holy') {
      // Holy: heals player + purges status effects from player, +bonus damage
      const holyBonus = 1.0 + (equippedHero?.perks?.holyBonus || 0);
      const healAmt = Math.round(22 * elemBonus * holyBonus);
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healAmt);
      this.burning = false; // clear any self-burn
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0xfffbe0);
      this.showFloatingText(this.player.container.x, this.player.container.y - 60, `✨ +${healAmt} HEAL`, '#fff5a0', true);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 40, 'HOLY SMITE!', '#ffffcc', false);
    } else if (type === 'wind') {
      // Wind: knocks enemy back (visual stagger) + disarms block for 2.5s
      this.enemyWindKnocked = true;
      this.windKnockTimer = 2.5 * elemBonus;
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0x7fffd4);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 70, '💨 BLOWN BACK!', '#7fffd4', true);
    } else if (type === 'void') {
      // Void: deals massive 2× bonus damage + creates mini void rift at enemy
      const voidBonusDmg = Math.round(damage * 1.0 * elemBonus);
      this.enemyHp = Math.max(0, this.enemyHp - voidBonusDmg);
      this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
      this.cameras.main.shake(300, 0.012);
      this.createElementalBurst(this.enemy.container.x, this.enemy.container.y - 25, 0xff00ff);
      this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 80, `✦ VOID RIFT! +${voidBonusDmg}`, '#ff4dff', true);
    }

    this.enemyAI.checkEnrage(this.enemyHp, this.enemyMaxHp);

    if (this.enemyHp <= 0) {
      this.handleEnemyDefeat(vx, vy, part);
    } else {
      this.syncHud(`Hit ${part.toUpperCase()} for ${Math.round(damage)} dmg! Combo x${this.combo}`);
    }
  }

  // Realistic Blood Spray, Droplet Physics & Persistent Arena Ground Splatters
  private createBloodSpray(
    x: number,
    y: number,
    vx: number,
    vy: number,
    isHeadshot: boolean,
    isKill: boolean
  ) {
    const isSkeleton = this.currentStageConfig.enemyType === 'skeleton_scout';
    const count = isKill ? (isHeadshot ? 55 : 38) : isHeadshot ? 26 : 14;

    const normalSpeed = Math.hypot(vx, vy) || 1;
    const dirX = vx / normalSpeed;
    const dirY = vy / normalSpeed;

    for (let i = 0; i < count; i++) {
      let color = 0x9b1212;
      if (isSkeleton) {
        color = Math.random() < 0.65 ? 0xd8dac5 : 0x7a1616; // Bone splinters & marrow
      } else if (this.currentStageConfig.theme === 'caldera') {
        color = Math.random() < 0.4 ? 0xff481f : 0x750c0c;
      } else if (this.currentStageConfig.theme === 'desert') {
        color = Math.random() < 0.5 ? 0xc26a1a : 0x7a1212; // Sandy-orange blood
      } else if (this.currentStageConfig.theme === 'forest') {
        color = Math.random() < 0.45 ? 0x1a7a1a : 0x700707; // Dark green/spectral
      } else {
        color = Math.random() < 0.5 ? 0xba1616 : 0x700707;
      }

      const size = Phaser.Math.Between(2, isHeadshot ? 6 : 4);
      const drop = this.add.circle(x, y, size, color).setDepth(26);

      const spread = Phaser.Math.FloatBetween(-0.7, 0.7);
      const speed = Phaser.Math.Between(130, isKill ? 440 : 280);
      const dropVx = (dirX + spread) * speed;
      let dropVy = (dirY - Phaser.Math.FloatBetween(0.25, 0.85)) * speed;
      let dropX = x;
      let dropY = y;

      const dropTimer = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          dropX += dropVx * 0.016;
          dropVy += 620 * 0.016;
          dropY += dropVy * 0.016;

          drop.setPosition(dropX, dropY);

          // Hits ground -> leave realistic blood stain decal!
          if (dropY >= this.groundY) {
            dropTimer.remove();
            drop.destroy();

            if (this.bloodStainsGfx) {
              this.bloodStainsGfx.fillStyle(color, 0.68);
              this.bloodStainsGfx.fillEllipse(
                dropX,
                this.groundY + Phaser.Math.Between(0, 4),
                Phaser.Math.Between(8, 18),
                Phaser.Math.Between(3, 7)
              );
            }
          }
        },
      });

      this.time.delayedCall(1500, () => {
        dropTimer.remove();
        if (drop.active) drop.destroy();
      });
    }

    // Extra explosive fountain on Headshot Kill
    if (isKill && isHeadshot) {
      this.cameras.main.shake(200, 0.008);
      for (let i = 0; i < 22; i++) {
        const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), 0xb81414).setDepth(27);
        this.tweens.add({
          targets: p,
          x: x + Phaser.Math.Between(-50, 50),
          y: y - Phaser.Math.Between(35, 95),
          alpha: 0,
          scale: 0.2,
          duration: 520 + Math.random() * 300,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  private handleEnemyDefeat(vx: number, vy: number, part: BodyPartHit) {
    this.gameOver = true;
    this.victory = true;
    this.enemy.triggerRagdollDeath(vx * 0.35, vy * 0.35 - 120, part);
    soundManager.playVictory();

    let stars = 1;
    const hpRatio = this.playerHp / this.playerMaxHp;
    if (hpRatio > 0.75 && this.shotsHit / Math.max(1, this.shotsFired) > 0.6) {
      stars = 3;
    } else if (hpRatio > 0.45) {
      stars = 2;
    }

    // FIRST-CLEAR GATING — the full reward only drops once per stage.
    // Replays yield a token consolation so farming the same board can't flood
    // the player with coins or XP. Boss stages still pay a small retry bonus.
    const data = saveManager.getData();
    const stageId = this.currentStageConfig.id;
    const prevStars = data.stageStars[stageId] || 0;
    const isFirstClear = prevStars === 0;
    const starsImproved = stars > prevStars;

    const mutator = findMutator(data.activeMutator);
    const coinMult = 1 + (mutator?.bonusCoins || 0) + data.globalBonus.coins;
    const xpMult = 1 + (mutator?.bonusXp || 0);

    let bonusReward: number;
    let xp: number;
    let rewardNote: string;

    if (isFirstClear) {
      bonusReward = Math.round((60 + stars * 30) * coinMult);
      xp = Math.round((40 + stars * 25 + this.score * 0.05) * xpMult);
      rewardNote = `First clear! +${bonusReward} Coins · +${xp} XP`;
    } else if (starsImproved) {
      // Beating the stage with more stars gives a smaller "improvement" bonus.
      bonusReward = Math.round((20 + stars * 10) * coinMult);
      xp = Math.round((15 + stars * 10) * xpMult);
      rewardNote = `Star improved to ${stars}★! +${bonusReward} Coins · +${xp} XP`;
    } else {
      // Pure replay — token drip only.
      bonusReward = Math.round(8 * coinMult);
      xp = Math.round(5 * xpMult);
      rewardNote = `Replay complete · +${bonusReward} Coins`;
    }

    saveManager.completeStage(stageId, stars, bonusReward);
    this.coins = saveManager.getData().coins;
    saveManager.recordScore(this.score);

    // Codex, mastery, achievements
    saveManager.recordKill(this.currentStageConfig.enemyType, part === 'head');
    saveManager.addMasteryKill(data.equippedHero);
    if (xp > 0) saveManager.addHeroXp(data.equippedHero, xp);
    sweepAchievements();

    // Hold the victory banner for a cinematic beat so the player sees the
    // ragdoll crumple, blood pool and arrows settle before results take over.
    this.syncHud(`KILLING BLOW! Hold for the fallout…`);
    // Cancel any prior timer so stacked delayedCalls can't pop the modal twice.
    if (this.resultDelayTimer) {
      this.resultDelayTimer.remove(false);
      this.resultDelayTimer = undefined;
    }
    this.resultDelayTimer = this.time.delayedCall(3500, () => {
      // Guard: if the player restarted during the delay, drop the modal flip.
      if (!this.gameOver || !this.victory) return;
      this.hudGameOver = true;
      this.hudVictory = true;
      this.syncHud(rewardNote);
      this.resultDelayTimer = undefined;
    });
  }

  private shootEnemyArrow(angle: number, power: number, isMulti: boolean) {
    if (this.gameOver) return;

    const count = isMulti ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const spreadAngle = angle + (i - (count - 1) / 2) * 0.12;
      this.launchSingleEnemyArrow(spreadAngle, power);
    }
  }

  private launchSingleEnemyArrow(angle: number, power: number) {
    // Launch from exact position on enemy model
    const launchPos = this.enemy.getArrowLaunchPosition(angle, power);
    const ox = launchPos.x;
    const oy = launchPos.y;

    const speed = power * 640;
    let vx = -Math.cos(angle) * speed;
    let vy = -Math.sin(angle) * speed;
    let x = ox;
    let y = oy;

    const arrow = this.add.graphics().setDepth(25);
    // Dark Ashwood Shaft
    arrow.fillStyle(0x3a281c, 1);
    arrow.fillRect(-16, -1.3, 26, 2.6);
    // Heavy Barbed Iron Bodkin Head
    arrow.fillStyle(0x1a2128, 1);
    arrow.fillTriangle(22, 0, 8, -4, 8, 4);
    arrow.fillStyle(0xd9442e, 1); // Glowing crimson core
    arrow.fillTriangle(21, 0, 9, -2.5, 9, 2.5);
    // Raven Feather Fletchings
    arrow.fillStyle(0x1b1f24, 0.95);
    arrow.fillTriangle(-17, 0, -10, -5, -8, 0);
    arrow.fillTriangle(-17, 0, -10, 5, -8, 0);
    arrow.fillStyle(0xff4433, 0.7);
    arrow.fillRect(-8, -1.5, 2, 3); // Red binding thread
    arrow.setPosition(ox, oy);
    const trail = this.add.graphics().setDepth(24);

    const timer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const dt = this.slowActive ? 0.007 : 0.016;
        const oldX = x;
        const oldY = y;

        x += vx * dt + this.wind * dt * dt * 26;
        vy += 460 * dt;
        y += vy * dt;

        arrow.setPosition(x, y).setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
        trail.lineStyle(2, 0xff5544, 0.55);
        trail.lineBetween(oldX, oldY, x, y);

        // Continuous Collision Detection against Player (segment oldX,oldY to x,y)
        const hit = this.player.checkBodyPartHit(oldX, oldY, x, y);
        if (hit) {
          timer.remove();
          arrow.destroy();
          trail.destroy();
          this.handleArrowHitPlayer(x, y, vx, vy);
          return;
        }

        if (y >= this.groundY || x < -30 || y < -100) {
          timer.remove();
          arrow.destroy();
          trail.destroy();
          if (y >= this.groundY && x >= -25) {
            this.handleArrowGroundImpact(x, this.groundY, 'normal', vx, vy, true);
          }
        }
      },
    });
  }

  private handleArrowHitPlayer(hitX: number, hitY: number, vx: number, vy: number) {
    if (this.shieldActive && this.shieldCharges > 0) {
      this.shieldCharges--;
      if (this.shieldCharges <= 0) {
        this.shieldActive = false;
      }
      soundManager.playShieldBlock();
      this.player.triggerBlock();

      // Reflect damage from equipped shield skin
      const equippedShield = saveManager.getEquippedShield();
      if (equippedShield.reflectDmg > 0 && this.enemy && this.enemy.animState !== 'dead') {
        this.enemyHp = Math.max(0, this.enemyHp - equippedShield.reflectDmg);
        this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
        this.showFloatingText(
          this.enemy.container.x,
          this.enemy.container.y - 35,
          `↩ REFLECT ${equippedShield.reflectDmg}`,
          '#ffdd55',
          false
        );
        if (this.enemyHp <= 0) this.handleEnemyDefeat(-vx * 0.4, vy * 0.4, 'torso');
      }

      this.showFloatingText(this.player.container.x, this.player.container.y - 30, `${equippedShield.icon} BLOCKED!`, '#66ddff', false);
      this.syncHud(`${equippedShield.name} blocked the enemy shot!`);
      return;
    }

    const dmg = this.currentStageConfig.enemyDmg + Phaser.Math.Between(-3, 4);
    this.playerHp = Math.max(0, this.playerHp - dmg);
    this.combo = 0;
    saveManager.breakKillStreak();
    soundManager.playHit();
    this.cameras.main.shake(160, 0.006);
    this.triggerDamageZoom(0.09);
    this.player.triggerHit('torso', false);
    this.showFloatingText(this.player.container.x, this.player.container.y - 30, `-${dmg}`, '#ff4444', false);

    // Player blood spray
    this.createBloodSpray(hitX, hitY, vx, vy, false, false);

    if (this.playerHp <= 0) {
      this.gameOver = true;
      this.victory = false;
      this.player.triggerRagdollDeath(-120, -100, 'torso');
      soundManager.playDefeat();
      // Hold the defeat screen so the player sees their own body fall.
      this.syncHud('Fallen in battle…');
      if (this.resultDelayTimer) {
        this.resultDelayTimer.remove(false);
        this.resultDelayTimer = undefined;
      }
      this.resultDelayTimer = this.time.delayedCall(2800, () => {
        if (!this.gameOver || this.victory) return;
        this.hudGameOver = true;
        this.hudVictory = false;
        this.syncHud('Defeated in battle! Press R to retry.');
        this.resultDelayTimer = undefined;
      });
    } else {
      this.wind = Phaser.Math.FloatBetween(
        -this.currentStageConfig.windVariance,
        this.currentStageConfig.windVariance
      );
      this.syncHud('Enemy hit you! Wind has shifted.');
    }
  }

  // --- STAMINA & ABILITIES ---

  public activateShield() {
    if (this.shieldCooldown > 0 || this.gameOver) return;
    if (this.stamina < 30) {
      this.syncHud('Not enough Stamina for Shield!');
      return;
    }
    this.stamina -= 30;
    const up = saveManager.getData().upgrades;
    const equippedShield = saveManager.getEquippedShield();
    this.shieldActive = true;
    // Shield charges = base from equipped shield skin + upgrade bonus
    this.shieldCharges = equippedShield.blockCharges + up.shieldEfficiency;
    // Cooldown is modified by shield skin's cooldownMult
    this.shieldCooldown = 1.0 * equippedShield.cooldownMult;
    this.player.triggerBlock();
    soundManager.playShieldBlock();
    this.syncHud(`${equippedShield.name}: ${this.shieldCharges} blocks ready!`);
  }

  public activateDash() {
    if (this.dashCooldown > 0 || this.gameOver) return;
    if (this.stamina < 35) {
      this.syncHud('Not enough Stamina for Dash!');
      return;
    }
    this.stamina -= 35;
    this.dashCooldown = 1.0;
    this.player.triggerDodge(65, this.scale.width);
    soundManager.playDash();
    this.shieldActive = true;
    this.shieldCharges = 1;
    this.syncHud('Quick Dash executed! Evading attack.');
  }

  public activateSlowMo() {
    if (this.slowCooldown > 0 || this.gameOver) return;
    if (this.stamina < 45) {
      this.syncHud('Not enough Stamina for Bullet Time!');
      return;
    }
    this.stamina -= 45;
    this.slowActive = true;
    this.slowCooldown = 1.0;
    soundManager.playSlowMo(true);
    this.syncHud('Slow motion bullet-time activated.');

    this.time.delayedCall(2400, () => {
      this.slowActive = false;
      soundManager.playSlowMo(false);
      this.syncHud('Time returned to normal.');
    });
  }

  private createElementalBurst(x: number, y: number, color: number) {
    for (let i = 0; i < 14; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 5), color).setDepth(26);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-35, 35),
        y: y + Phaser.Math.Between(-35, 35),
        alpha: 0,
        scale: 0.1,
        duration: 350 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: isCrit ? '24px' : '18px',
        fontStyle: 'bold',
        color: color,
        stroke: '#06101c',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(35);

    this.tweens.add({
      targets: t,
      y: y - 45,
      alpha: 0,
      scale: isCrit ? 1.3 : 1.0,
      duration: 850,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  public restartBattle() {
    // Kill any pending result-modal timer from the previous round so it can't
    // re-pop the Victory/Defeat screen after the player hit Retry.
    if (this.resultDelayTimer) {
      this.resultDelayTimer.remove(false);
      this.resultDelayTimer = undefined;
    }
    this.gameOver = false;
    this.victory = false;
    this.hudGameOver = false;
    this.hudVictory = false;
    this.coins = saveManager.getData().coins;
    this.combo = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.headshotCount = 0;
    this.shieldActive = false;
    this.shieldCooldown = 0;
    this.dashCooldown = 0;
    this.slowCooldown = 0;
    this.slowActive = false;
    this.enemyFrozen = false;
    this.burning = false;
    this.poisonStacks = 0;
    this.enemyShadowBlind = false;
    this.shadowBlindTimer = 0;
    this.enemyWindKnocked = false;
    this.windKnockTimer = 0;

    // Clear previous blood stains & ground elemental effects on restart
    if (this.bloodStainsGfx) {
      this.bloodStainsGfx.clear();
    }
    if (this.groundEffectsContainer) {
      this.groundEffectsContainer.removeAll(true);
    }
    this.clearAimController();

    // Redraw environment with next session atmosphere!
    this.sessionIndex++;
    this.drawSessionEnvironment(this.scale.width, this.scale.height);

    this.applyPlayerUpgrades();
    this.enemyMaxHp = this.currentStageConfig.enemyHp;
    this.enemyHp = this.enemyMaxHp;

    const w = this.scale.width;
    this.player.reset(w * 0.14, this.groundY - 10);
    this.enemy.setArchetype(
      this.currentStageConfig.enemyType,
      this.enemyHp,
      this.enemyMaxHp,
      this.currentStageConfig.enemyName,
      this.currentStageConfig.id
    );
    this.enemy.reset(w * 0.86, this.groundY - 10);
    this.enemyAI.setConfig(this.currentStageConfig);

    this.wind = Phaser.Math.FloatBetween(
      -this.currentStageConfig.windVariance,
      this.currentStageConfig.windVariance
    );

    this.triggerLevelIntro();
    this.drawTrajectory();
    this.syncHud(`Stage ${this.currentStageConfig.stageNumber}: ${this.currentStageConfig.name} started.`);
  }

  // Real-time synchronization when player equips a hero, bow, shield, buys arrow packs, or buys upgrades
  public onEquipmentChanged() {
    const saved = saveManager.getData();
    this.coins = saved.coins;

    // Add any newly purchased bonus arrows directly to active quiver
    const purchasedBonus = saveManager.consumeBonusArrows();
    for (const key of Object.keys(purchasedBonus) as ArrowType[]) {
      if (purchasedBonus[key]) {
        this.arrowCounts[key] = (this.arrowCounts[key] || 0) + (purchasedBonus[key] || 0);
      }
    }

    const up = saved.upgrades;
    const hero = saveManager.getEquippedHero();
    this.maxStamina = 100 + (hero.perks.staminaBonus || 0);
    const newMaxHp = 100 + up.maxHealth * 25 + (hero.perks.hpBonus || 0);
    const hpDiff = newMaxHp - this.playerMaxHp;
    this.playerMaxHp = newMaxHp;
    if (hpDiff > 0) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + hpDiff);
    }

    this.player.renderEquipment();
    this.enemy.refreshDangerTheme(hero.eyeColor);
    this.drawTrajectory();
    this.syncHud('Equipment updated and battle-ready!');
  }

  public nextStage() {
    const nextId = this.currentStageConfig.id + 1;
    if (nextId <= CAMPAIGN_STAGES.length) {
      this.currentStageConfig = getStageConfig(nextId);
      this.sessionIndex++;
      this.restartBattle();
    } else {
      this.syncHud('Campaign Completed! You are the legendary Shadow Archer.');
    }
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const w = this.scale.width;

    // Stamina Regeneration (+26 per second)
    if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 26);
    }

    // Cooldown decays
    if (this.shieldCooldown > 0) this.shieldCooldown = Math.max(0, this.shieldCooldown - dt * 0.18);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt * 0.25);
    if (this.slowCooldown > 0) this.slowCooldown = Math.max(0, this.slowCooldown - dt * 0.12);

    // Freeze decay
    if (this.enemyFrozen) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.enemyFrozen = false;
      }
    }

    // Burning DoT
    if (this.burning && !this.gameOver) {
      this.burnTimer -= dt;
      this.enemyHp = Math.max(0, this.enemyHp - dt * 6);
      this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
      if (this.burnTimer <= 0) this.burning = false;
      if (this.enemyHp <= 0) this.handleEnemyDefeat(50, -50, 'torso');
    }

    // Poison DoT
    if (this.poisonStacks > 0 && !this.gameOver) {
      this.poisonTickTimer += dt;
      if (this.poisonTickTimer >= 1.0) {
        this.poisonTickTimer = 0;
        const pDmg = this.poisonStacks * 7;
        this.enemyHp = Math.max(0, this.enemyHp - pDmg);
        this.enemy.setHealth(this.enemyHp, this.enemyMaxHp);
        this.showFloatingText(this.enemy.container.x, this.enemy.container.y - 20, `${pDmg} POISON`, '#63ea38', false);
        if (this.enemyHp <= 0) this.handleEnemyDefeat(30, -30, 'torso');
      }
    }

    // Shadow Blind decay
    if (this.enemyShadowBlind) {
      this.shadowBlindTimer -= dt;
      if (this.shadowBlindTimer <= 0) this.enemyShadowBlind = false;
    }

    // Wind Knock decay
    if (this.enemyWindKnocked) {
      this.windKnockTimer -= dt;
      if (this.windKnockTimer <= 0) this.enemyWindKnocked = false;
    }

    // Update characters
    this.player.update(dt, this.groundY, w);
    this.enemy.update(dt, this.groundY, w);

    // Update Enemy AI
    if (!this.gameOver) {
      this.enemyAI.update(
        dt,
        this.player.container.x,
        this.player.container.y,
        this.wind,
        this.enemyFrozen || this.enemyWindKnocked,
        (angle, power, isMulti) => {
          // Shadow blind halves enemy accuracy by adding random angle spread
          const blindSpread = this.enemyShadowBlind ? (Math.random() - 0.5) * 0.6 : 0;
          this.shootEnemyArrow(angle + blindSpread, power, isMulti);
        }
      );
    }

    // --- Dynamic Camera Zoom System (Aiming, Impact, Heartbeat) ---
    // Smooth aim zoom: ramp up while dragging, ease out with cinematic curve after release
    if (this.isDragging) {
      this.aimZoomProgress = Phaser.Math.Linear(this.aimZoomProgress, this.power, dt * 5.5);
      this.aimReleaseDecay = this.aimZoomProgress; // Latch current value for release ease
    } else {
      // Cubic ease-out over ~500ms so camera glides out smoothly, never snaps
      this.aimReleaseDecay = Phaser.Math.Linear(this.aimReleaseDecay, 0, dt * 2.2);
      this.aimZoomProgress = this.aimReleaseDecay;
    }
    const aimZoom = this.aimZoomProgress * 0.11;

    const isLowHp = this.playerHp / this.playerMaxHp < 0.35;
    const heartbeatZoom = isLowHp
      ? Math.sin(this.time.now * 0.007) * 0.018 * (1 - this.playerHp / this.playerMaxHp)
      : 0;

    // ZoomPunch decays faster for snappier impact feedback
    this.zoomPunch = Math.max(0, this.zoomPunch - dt * 2.4);
    this.targetZoom = this.baseZoom + aimZoom + heartbeatZoom + this.zoomPunch;
    // Silky smooth lerp — never jitters
    this.currentZoom = Phaser.Math.Linear(this.currentZoom, this.targetZoom, dt * 5.0);
    this.cameras.main.setZoom(this.currentZoom);

    // --- Real-time Adaptive Sound & Category Music Sync ---
    soundManager.setCombatMusicState({
      themeCategory: this.getThemeCategory(),
      playerHpRatio: Math.max(0, Math.min(1, this.playerHp / this.playerMaxHp)),
      enemyHpRatio: Math.max(0, Math.min(1, this.enemyHp / this.enemyMaxHp)),
      combo: this.combo,
      isAiming: this.isDragging,
    });

    this.syncHud();
  }

  private lastHudMessage = 'Drag left to aim, release to shoot.';
  private syncHud(newMessage?: string) {
    if (newMessage) this.lastHudMessage = newMessage;
    if (!this.onHudUpdate) return;

    this.onHudUpdate({
      playerHp: Math.round(this.playerHp),
      playerMaxHp: this.playerMaxHp,
      stamina: Math.round(this.stamina),
      maxStamina: this.maxStamina,
      enemyHp: Math.round(this.enemyHp),
      enemyMaxHp: this.enemyMaxHp,
      enemyName: this.currentStageConfig.enemyName,
      enemyArchetype: this.currentStageConfig.enemyType,
      isBoss: this.currentStageConfig.isBoss,
      arrowCounts: { ...this.arrowCounts },
      selectedArrow: this.selectedArrow,
      message: this.lastHudMessage,
      wind: this.wind,
      combo: this.combo,
      score: this.score,
      coins: this.coins,
      shieldActive: this.shieldActive,
      shieldCooldown: this.shieldCooldown,
      dashCooldown: this.dashCooldown,
      slowCooldown: this.slowCooldown,
      slowActive: this.slowActive,
      enemyAimingProgress: this.enemyAI.aimProgress,
      enemyStatus: {
        frozen: this.enemyFrozen,
        freezeTimeRemaining: this.freezeTimer,
        poisonStacks: this.poisonStacks,
        burning: this.burning,
      },
      levelIntro: { ...this.levelIntro },
      gameOver: this.hudGameOver,
      victory: this.hudVictory,
      starsEarned: this.calculateCurrentStars(),
      headshots: this.headshotCount,
      accuracy: this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100,
    });
  }

  private calculateCurrentStars(): number {
    const hpRatio = this.playerHp / this.playerMaxHp;
    if (hpRatio > 0.75) return 3;
    if (hpRatio > 0.45) return 2;
    return 1;
  }
}
