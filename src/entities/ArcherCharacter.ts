import Phaser from 'phaser';
import { RagdollPhysics } from '../physics/Ragdoll';
import { BodyPartHit, EnemyArchetype } from '../types';
import { saveManager } from '../save/SaveManager';

export type AnimState = 'idle' | 'aiming' | 'recoil' | 'hit' | 'block' | 'dodge' | 'dead';

export class ArcherCharacter {
  public scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public ragdoll: RagdollPhysics;
  public ragdollGraphics: Phaser.GameObjects.Graphics;
  public isEnemy: boolean;
  public archetype: EnemyArchetype | 'player';

  public x: number;
  public y: number;
  public baseScale: number = 1.0;
  public facingRight: boolean;

  // Animation states
  public animState: AnimState = 'idle';
  public aimAngle: number = 0; // In radians
  public drawPower: number = 0; // 0 to 1
  public idleTimer: number = 0;
  public hitTimer: number = 0;
  public recoilTimer: number = 0;
  public blockProgress: number = 0; // 0 to 1
  public dodgeProgress: number = 0;

  // In-world health bar values
  public currentHp: number = 100;
  public maxHp: number = 100;
  public enemyDisplayName: string = 'Enemy';
  public stageLevel: number = 1;

  // Visual sub-objects
  private shadow: Phaser.GameObjects.Graphics;
  private cape: Phaser.GameObjects.Graphics;
  private legs: Phaser.GameObjects.Graphics;
  private torso: Phaser.GameObjects.Graphics;
  private head: Phaser.GameObjects.Graphics;
  private quiverGfx: Phaser.GameObjects.Graphics;
  private bowArm: Phaser.GameObjects.Graphics;
  private stringArm: Phaser.GameObjects.Graphics;
  private bow: Phaser.GameObjects.Graphics;
  private shieldGfx: Phaser.GameObjects.Graphics;
  private shieldBarrierGfx: Phaser.GameObjects.Graphics;
  private inWorldHpBar: Phaser.GameObjects.Graphics;
  // Enemies only — menacing aura, floating glyphs & backup silhouette.
  private dangerAura: Phaser.GameObjects.Graphics;
  private backupSilhouette: Phaser.GameObjects.Graphics;
  // Hero color used to drive "counter-element" visuals on enemies.
  // Updated by scene via refreshDangerTheme(heroEyeColor).
  private counterEyeColor: number = 0xff4522;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    isEnemy: boolean,
    archetype: EnemyArchetype | 'player' = isEnemy ? 'skeleton_scout' : 'player'
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isEnemy = isEnemy;
    this.archetype = archetype;
    this.facingRight = !isEnemy;

    if (archetype === 'player') {
      this.baseScale = 1.35; // Zoomed-in heroic player archer
    } else if (archetype === 'fortress_champion' || archetype === 'frost_overlord' || archetype === 'infernal_warlord') {
      this.baseScale = 1.72;
    } else if (archetype === 'void_harbinger' || archetype === 'phantom_duelist') {
      this.baseScale = 1.95;
    } else if (archetype === 'storm_warden' || archetype === 'iron_golem') {
      this.baseScale = 1.80;
    } else if (archetype === 'crimson_berserker') {
      this.baseScale = 1.62;
    } else if (archetype === 'jade_sentinel') {
      this.baseScale = 1.65;
    } else {
      this.baseScale = 1.32; // Normal enemies zoomed in and detailed
    }

    this.container = scene.add.container(x, y).setScale(this.baseScale);
    this.container.setDepth(15);

    // Ragdoll setup
    this.ragdoll = new RagdollPhysics();
    this.ragdollGraphics = scene.add.graphics().setDepth(14);

    // Create layered visual components
    this.shadow = scene.add.graphics();
    this.dangerAura = scene.add.graphics();
    this.backupSilhouette = scene.add.graphics();
    this.cape = scene.add.graphics();
    this.quiverGfx = scene.add.graphics();
    this.legs = scene.add.graphics();
    this.torso = scene.add.graphics();
    this.head = scene.add.graphics();
    this.bowArm = scene.add.graphics();
    this.stringArm = scene.add.graphics();
    this.bow = scene.add.graphics();
    this.shieldGfx = scene.add.graphics();
    this.shieldBarrierGfx = scene.add.graphics();
    this.inWorldHpBar = scene.add.graphics();

    // Order matters: aura & backup render BEHIND the character body.
    this.container.add([
      this.shadow,
      this.dangerAura,
      this.backupSilhouette,
      this.cape,
      this.quiverGfx,
      this.legs,
      this.torso,
      this.bowArm,
      this.head,
      this.stringArm,
      this.bow,
      this.shieldGfx,
      this.shieldBarrierGfx,
      this.inWorldHpBar,
    ]);

    this.renderEquipment();
  }

  /**
   * Scene calls this with the player's hero eye color so enemies can glow
   * in a counter-element palette (fire hero → ice-blue enemy aura, etc.).
   */
  public refreshDangerTheme(playerEyeColor: number) {
    // Simple inversion: shift hue by ~180° via XOR for a readable contrast.
    this.counterEyeColor = (playerEyeColor ^ 0x7f7f7f) & 0xffffff;
  }

  public setArchetype(
    type: EnemyArchetype,
    hp: number = 100,
    maxHp: number = 100,
    name: string = 'Enemy',
    stageLevel: number = 1
  ) {
    this.archetype = type;
    this.currentHp = hp;
    this.maxHp = maxHp;
    this.enemyDisplayName = name;
    this.stageLevel = stageLevel;

    if (type === 'fortress_champion' || type === 'frost_overlord' || type === 'infernal_warlord') {
      this.baseScale = 1.72;
    } else if (type === 'void_harbinger' || type === 'phantom_duelist') {
      this.baseScale = 1.95;
    } else if (type === 'storm_warden' || type === 'iron_golem') {
      this.baseScale = 1.80;
    } else if (type === 'crimson_berserker') {
      this.baseScale = 1.62;
    } else if (type === 'jade_sentinel') {
      this.baseScale = 1.65;
    } else if (stageLevel >= 8) {
      this.baseScale = 1.45;
    } else {
      this.baseScale = 1.32;
    }
    this.container.setScale(this.baseScale);
    this.renderEquipment();
  }

  public setHealth(hp: number, maxHp: number) {
    this.currentHp = hp;
    this.maxHp = maxHp;
    this.drawInWorldHealthBar();
  }

  // Pulsing dark halo + floating menace glyphs that read as "this one is dangerous".
  private drawDangerAura(t: number) {
    this.dangerAura.clear();
    if (!this.isEnemy) return;

    const isBoss =
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'infernal_warlord' ||
      this.archetype === 'void_harbinger' ||
      this.archetype === 'iron_golem' ||
      this.archetype === 'phantom_duelist';
    const intenseStage = this.stageLevel >= 6 || isBoss;
    if (!intenseStage) return;

    const pulse = 0.5 + Math.sin(t * 3.1) * 0.5;
    const auraR = 46 + (isBoss ? 24 : 6) + pulse * 6;

    // Dark heat shimmer underneath
    this.dangerAura.fillStyle(0x060608, 0.55);
    this.dangerAura.fillEllipse(0, -24, auraR * 1.3, auraR * 0.8);

    // Colored menacing halo — uses the counter-color so it POPS against the hero.
    const halo = isBoss ? 0xff2222 : this.counterEyeColor;
    this.dangerAura.lineStyle(2.2, halo, 0.35 + pulse * 0.25);
    this.dangerAura.strokeCircle(0, -22, auraR);
    this.dangerAura.lineStyle(1.2, halo, 0.15 + pulse * 0.1);
    this.dangerAura.strokeCircle(0, -22, auraR + 10);
    this.dangerAura.fillStyle(halo, 0.08 + pulse * 0.08);
    this.dangerAura.fillCircle(0, -22, auraR);

    // Floating menacing glyphs orbiting the enemy — reads as hostile energy.
    const particleCount = isBoss ? 7 : this.stageLevel >= 10 ? 5 : 3;
    for (let i = 0; i < particleCount; i++) {
      const ang = (t * 0.9 + (i / particleCount) * Math.PI * 2) % (Math.PI * 2);
      const r = auraR * 0.75 + Math.sin(t * 2 + i) * 4;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r * 0.5 - 22;
      const size = 2 + Math.sin(t * 3 + i * 1.3) * 1.2;
      this.dangerAura.fillStyle(halo, 0.75);
      this.dangerAura.fillCircle(px, py, size);
      // Trailing glow
      this.dangerAura.fillStyle(halo, 0.25);
      this.dangerAura.fillCircle(px, py, size * 2);
    }

    // Danger spikes at the base for bosses (horn-like aura shards).
    if (isBoss) {
      const spikes = 6;
      for (let i = 0; i < spikes; i++) {
        const ang = (i / spikes) * Math.PI * 2 + t * 0.4;
        const sx = Math.cos(ang) * auraR;
        const sy = Math.sin(ang) * auraR * 0.5 - 22;
        this.dangerAura.fillStyle(halo, 0.6);
        this.dangerAura.fillTriangle(
          sx,
          sy,
          sx + Math.cos(ang + 0.1) * 10,
          sy + Math.sin(ang + 0.1) * 10,
          sx + Math.cos(ang - 0.1) * 10,
          sy + Math.sin(ang - 0.1) * 10
        );
      }
    }
  }

  // Boss-stage visual deception: a second shadow archer stands behind,
  // making the fight read as 2-on-1 even when only one combatant acts.
  private drawBackupSilhouette(t: number) {
    this.backupSilhouette.clear();
    if (!this.isEnemy) return;
    const isBoss =
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'infernal_warlord' ||
      this.archetype === 'void_harbinger' ||
      this.archetype === 'iron_golem' ||
      this.archetype === 'phantom_duelist';
    if (!isBoss && this.stageLevel < 8) return;

    const dir = this.facingRight ? 1 : -1;
    const offset = 28 + Math.sin(t * 1.4) * 3; // Slight sway for breathing
    const bob = Math.sin(t * 2.2) * 2;

    // Shadowy body silhouette — same proportions as the hero, drawn in near-black.
    const inkColor = 0x05080c;
    const rimColor = isBoss ? 0xff2222 : this.counterEyeColor;

    this.backupSilhouette.fillStyle(inkColor, 0.75);
    // Legs
    this.backupSilhouette.fillRoundedRect(offset * dir - 6, -4 + bob, 12, 44, 3);
    // Torso
    this.backupSilhouette.fillRoundedRect(offset * dir - 13, -38 + bob, 26, 34, 4);
    // Head
    this.backupSilhouette.fillCircle(offset * dir, -48 + bob, 11);
    // Cowl shape
    this.backupSilhouette.fillTriangle(
      offset * dir - 14,
      -46 + bob,
      offset * dir,
      -62 + bob,
      offset * dir + 14,
      -46 + bob
    );
    // Rim glow outline
    this.backupSilhouette.lineStyle(1.5, rimColor, 0.4 + Math.sin(t * 3) * 0.15);
    this.backupSilhouette.strokeCircle(offset * dir, -48 + bob, 12);
    // Dual red/glowing eyes to signal threat
    this.backupSilhouette.fillStyle(rimColor, 0.95);
    this.backupSilhouette.fillCircle(offset * dir - 3 * dir, -48 + bob, 1.5);
    this.backupSilhouette.fillCircle(offset * dir + 2 * dir, -48 + bob, 1.2);
    // Bow silhouette hinted
    this.backupSilhouette.lineStyle(2, inkColor, 0.9);
    this.backupSilhouette.beginPath();
    this.backupSilhouette.arc(offset * dir - 14 * dir, -24 + bob, 20, -Math.PI / 2, Math.PI / 2, dir < 0);
    this.backupSilhouette.strokePath();
  }

  public renderEquipment() {
    this.drawShadow(1.0);
    this.drawLegs(0, 0);
    this.drawTorso(0);
    this.drawQuiver();
    this.drawHead(0);
    this.drawBow(0, 0);
    this.drawCape(0);
    if (
      !this.isEnemy ||
      this.archetype === 'fortress_guard' ||
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'storm_warden' ||
      this.archetype === 'void_harbinger'
    ) {
      this.drawShield(0);
    } else {
      this.shieldGfx.clear();
      this.shieldBarrierGfx.clear();
    }
    this.drawInWorldHealthBar();
  }

  // Realistic feathered soft shadow beneath character
  private drawShadow(scaleFactor: number) {
    this.shadow.clear();
    const w = 46 * scaleFactor;
    const h = 13 * scaleFactor;
    // Layer 1: Soft outer blur
    this.shadow.fillStyle(0x02070e, 0.28);
    this.shadow.fillEllipse(0, 43, w * 1.25, h * 1.25);
    // Layer 2: Core contact shadow
    this.shadow.fillStyle(0x010408, 0.6);
    this.shadow.fillEllipse(0, 43, w * 0.8, h * 0.75);
  }

  private drawLegs(walkOffset: number, crouch: number) {
    this.legs.clear();
    const isSkeleton = this.archetype === 'skeleton_scout';
    const isPlayer = !this.isEnemy;

    if (isSkeleton) {
      this.legs.lineStyle(4, 0xd0d2be, 1);
      // Left leg femur & tibia
      this.legs.lineBetween(-7, -4 + crouch, -9 + walkOffset, 18 + crouch);
      this.legs.lineBetween(-9 + walkOffset, 18 + crouch, -11 + walkOffset, 42);
      // Right leg
      this.legs.lineBetween(7, -4 + crouch, 9 - walkOffset, 18 + crouch);
      this.legs.lineBetween(9 - walkOffset, 18 + crouch, 11 - walkOffset, 42);

      // Skeletal feet
      this.legs.fillStyle(0xb5b79e, 1);
      this.legs.fillCircle(-11 + walkOffset, 42, 3);
      this.legs.fillCircle(11 - walkOffset, 42, 3);
      return;
    }

    // Realistic Archery Stance & Proportions:
    // Lead leg (front) braced firmly, rear leg providing kinetic spring
    const hero = isPlayer ? saveManager.getEquippedHero() : null;
    const breechesBase = isPlayer && hero ? hero.capeColor : (isPlayer ? 0x162635 : 0x222e38);
    const breechesLight = isPlayer && hero ? hero.armorColor : (isPlayer ? 0x233a4f : 0x314250);
    const bootDark = isPlayer ? 0x0c131a : 0x131a20;
    const bootMid = isPlayer && hero ? hero.cowlColor : (isPlayer ? 0x1c2b38 : 0x24323d);
    const leatherBrown = 0x4d3423;
    const metalTrim = isPlayer && hero ? hero.trimColor : (isPlayer ? 0x5a92b8 : 0x6e8494);

    // --- REAR LEG (Behind) ---
    // Thigh
    this.legs.lineStyle(9, breechesBase, 1);
    this.legs.lineBetween(6, -4 + crouch, 9 - walkOffset, 16 + crouch);
    // Shin & Boot
    this.legs.lineStyle(8, bootMid, 1);
    this.legs.lineBetween(9 - walkOffset, 16 + crouch, 13 - walkOffset, 41);
    // Boot sole & heel
    this.legs.fillStyle(bootDark, 1);
    this.legs.fillRoundedRect(7 - walkOffset, 38, 15, 6, 2);

    // --- LEAD LEG (Front Braced Stance) ---
    // Muscular thigh contour with shading highlight
    this.legs.lineStyle(9, breechesBase, 1);
    this.legs.lineBetween(-6, -4 + crouch, -9 + walkOffset, 17 + crouch);
    this.legs.lineStyle(3, breechesLight, 0.85);
    this.legs.lineBetween(-6, -4 + crouch, -8 + walkOffset, 15 + crouch);

    // Knee Poleyn (Articulated Armor Guard)
    this.legs.fillStyle(leatherBrown, 1);
    this.legs.fillRoundedRect(-14 + walkOffset, 13 + crouch, 9, 9, 3);
    this.legs.fillStyle(metalTrim, 1);
    this.legs.fillCircle(-9.5 + walkOffset, 17.5 + crouch, 2.5);

    // Front Shin Guard & Laced Archer's Boot
    this.legs.lineStyle(8, bootMid, 1);
    this.legs.lineBetween(-9 + walkOffset, 17 + crouch, -13 + walkOffset, 41);
    // Boot turnover cuff
    this.legs.fillStyle(leatherBrown, 1);
    this.legs.fillRoundedRect(-14 + walkOffset, 24 + crouch, 10, 5, 2);

    // Boot foot, heel spur & sole grip
    this.legs.fillStyle(bootDark, 1);
    this.legs.fillRoundedRect(-18 + walkOffset, 37, 16, 7, 2.5);
    this.legs.fillStyle(metalTrim, 0.7);
    this.legs.fillRect(-17 + walkOffset, 42, 14, 2); // Sole rim
  }

  private drawTorso(breath: number) {
    this.torso.clear();
    const isSkeleton = this.archetype === 'skeleton_scout';
    const isPlayer = !this.isEnemy;
    const isBoss =
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'infernal_warlord';

    if (isSkeleton) {
      // Ribcage & spine
      this.torso.lineStyle(4, 0xd0d2be, 1);
      this.torso.lineBetween(0, -32 + breath, 0, -4);
      for (let i = 0; i < 4; i++) {
        this.torso.lineBetween(-10 + i * 2, -26 + i * 6 + breath, 10 - i * 2, -26 + i * 6 + breath);
      }
      return;
    }

    if (isPlayer) {
      // --- REALISTIC LAYERED ARCHER'S ARMOR (Themed by equipped Hero) ---
      const hero = saveManager.getEquippedHero();

      // 1. Dark linen undershirt & gambeson base
      this.torso.fillStyle(0x0e1b27, 1);
      this.torso.fillRoundedRect(-14, -36 + breath, 28, 35, 5);

      // 2. Form-fitting leather cuirass with shaded abdominal segmentation (Hero's Armor Color)
      this.torso.fillStyle(hero.armorColor, 1);
      this.torso.fillRoundedRect(-12, -34 + breath, 24, 24, 4);

      // Chest plate bevel highlight & trim (Hero's Trim Color)
      this.torso.lineStyle(1.8, hero.trimColor, 0.95);
      this.torso.strokeRoundedRect(-12, -34 + breath, 24, 24, 4);

      // Abdominal articulation plate grooves (flexes with breathing)
      this.torso.lineStyle(1.2, 0x0c1722, 0.85);
      this.torso.lineBetween(-9, -24 + breath, 9, -24 + breath);
      this.torso.lineBetween(-8, -18 + breath, 8, -18 + breath);

      // 3. Oiled Leather Cross-Body Baldric (Quiver harness)
      this.torso.lineStyle(4, 0x4a321e, 1);
      this.torso.lineBetween(-13, -35 + breath, 11, -7 + breath);
      // Harness stitching detail
      this.torso.lineStyle(1.2, hero.trimColor, 0.85);
      this.torso.lineBetween(-12, -34 + breath, 10, -8 + breath);
      // Ornate brass harness buckle at mid-chest
      this.torso.fillStyle(hero.trimColor, 1);
      this.torso.fillRoundedRect(-3, -24 + breath, 6, 7, 1.5);
      this.torso.fillStyle(0x382312, 1);
      this.torso.fillRect(-1.5, -22 + breath, 3, 3);

      // 4. Waist Belt with Heavy Iron Buckle & Side Dagger
      this.torso.fillStyle(0x101a24, 1);
      this.torso.fillRect(-14, -6 + breath, 28, 7);
      this.torso.fillStyle(0x567b96, 1);
      this.torso.fillRoundedRect(-4, -7 + breath, 8, 9, 2); // Buckle frame
      this.torso.fillStyle(hero.trimColor, 1);
      this.torso.fillRect(-1, -6 + breath, 2, 7); // Buckle prong

      // Side leather pouch (right hip)
      this.torso.fillStyle(0x422c1b, 1);
      this.torso.fillRoundedRect(7, -7 + breath, 9, 10, 2.5);
      this.torso.fillStyle(hero.trimColor, 1);
      this.torso.fillCircle(11.5, -2 + breath, 1.5); // Stud

      // Hunting Dagger sheathed on left hip
      this.torso.lineStyle(2.5, 0x1f2d3a, 1);
      this.torso.lineBetween(-12, -4 + breath, -16, 7 + breath); // Sheath
      this.torso.fillStyle(hero.trimColor, 1);
      this.torso.fillRect(-14, -6 + breath, 4, 2.5); // Guard
      this.torso.fillCircle(-13, -8 + breath, 2); // Pommel

      // 5. Layered Leather Pauldrons (Shoulder Guards) with Metallic Rivets
      this.torso.fillStyle(hero.armorColor, 1);
      this.torso.fillRoundedRect(-18, -37 + breath, 10, 11, 3);
      this.torso.fillRoundedRect(8, -37 + breath, 10, 11, 3);
      // Rivets
      this.torso.fillStyle(hero.trimColor, 1);
      this.torso.fillCircle(-13, -32 + breath, 2);
      this.torso.fillCircle(13, -32 + breath, 2);
      return;
    }

    // Enemy Torso (Varies by archetype)
    const armorColor =
      this.archetype === 'frost_overlord'
        ? 0x3d6b8c
        : this.archetype === 'infernal_warlord'
        ? 0x3d1717
        : this.archetype === 'desert_marauder'
        ? 0x7a5020
        : this.archetype === 'forest_wraith'
        ? 0x1a3a1a
        : this.archetype === 'storm_warden'
        ? 0x1a2d4a
        : this.archetype === 'void_harbinger'
        ? 0x1a001a
        : isBoss
        ? 0x6e5b38
        : 0x2e3d49;

    const trimColor =
      this.archetype === 'frost_overlord'
        ? 0x7be2ff
        : this.archetype === 'infernal_warlord'
        ? 0xff5329
        : this.archetype === 'desert_marauder'
        ? 0xffd060
        : this.archetype === 'forest_wraith'
        ? 0x55ff33
        : this.archetype === 'storm_warden'
        ? 0x55aaff
        : this.archetype === 'void_harbinger'
        ? 0xff00ff
        : isBoss
        ? 0xffc444
        : 0x5f8096;

    this.torso.fillStyle(armorColor, 1);
    this.torso.fillRoundedRect(-15, -36 + breath, 30, 34, 4);
    this.torso.lineStyle(2, trimColor, 1);
    this.torso.strokeRoundedRect(-15, -36 + breath, 30, 34, 4);

    // Hardening Visual Tier Overlays based on Level
    if (this.stageLevel >= 3) {
      this.torso.fillStyle(0x8da1b0, 1);
      this.torso.fillCircle(-8, -28 + breath, 2.5);
      this.torso.fillCircle(8, -28 + breath, 2.5);
      this.torso.fillCircle(0, -18 + breath, 3);
    }
    if (this.stageLevel >= 8) {
      this.torso.lineStyle(1.5, trimColor, 0.9);
      this.torso.strokeCircle(0, -20 + breath, 6);
      this.torso.fillStyle(trimColor, 1);
      this.torso.fillCircle(0, -20 + breath, 2.5);
    }
    if (this.stageLevel >= 12) {
      this.torso.lineStyle(2, 0xff4d29, 0.95);
      this.torso.beginPath();
      this.torso.moveTo(-10, -30 + breath);
      this.torso.lineTo(-2, -22 + breath);
      this.torso.lineTo(6, -26 + breath);
      this.torso.lineTo(10, -14 + breath);
      this.torso.strokePath();
    }

    // Pauldrons (Spiked for higher levels)
    this.torso.fillStyle(trimColor, 1);
    this.torso.fillCircle(-17, -34 + breath, isBoss ? 9 : this.stageLevel >= 6 ? 7 : 5);
    this.torso.fillCircle(17, -34 + breath, isBoss ? 9 : this.stageLevel >= 6 ? 7 : 5);
    if (this.stageLevel >= 7 || isBoss) {
      this.torso.fillTriangle(-22, -38 + breath, -17, -46 + breath, -14, -38 + breath);
      this.torso.fillTriangle(22, -38 + breath, 17, -46 + breath, 14, -38 + breath);
    }
  }

  private drawQuiver() {
    this.quiverGfx.clear();
    if (this.archetype === 'skeleton_scout') return;

    const dir = this.facingRight ? -1 : 1;
    const qx = dir * 10;
    const qy = -22;

    // 3D-shaded embossed leather quiver
    this.quiverGfx.fillStyle(0x382213, 1);
    this.quiverGfx.fillRoundedRect(qx - 5, qy - 18, 10, 37, 3);
    this.quiverGfx.lineStyle(1.5, 0x6e492b, 1);
    this.quiverGfx.strokeRoundedRect(qx - 5, qy - 18, 10, 37, 3);

    // Decorative brass banding straps around quiver
    this.quiverGfx.fillStyle(0xc29547, 1);
    this.quiverGfx.fillRect(qx - 5, qy - 12, 10, 3);
    this.quiverGfx.fillRect(qx - 5, qy + 6, 10, 3);

    // Realistic bundled arrows with striped feather fletchings & nock notches
    // Arrow 1 (Left feather)
    this.quiverGfx.fillStyle(0xecdcb5, 1); // Shaft
    this.quiverGfx.fillRect(qx - 4, qy - 28, 2, 10);
    this.quiverGfx.fillStyle(0xffffff, 0.95); // White feather
    this.quiverGfx.fillTriangle(qx - 5, qy - 20, qx - 2, qy - 30, qx - 1, qy - 20);
    this.quiverGfx.fillStyle(0xc93626, 0.9); // Red cresting wrap
    this.quiverGfx.fillRect(qx - 4.5, qy - 23, 3, 2);

    // Arrow 2 (Center feather)
    this.quiverGfx.fillStyle(0xecdcb5, 1);
    this.quiverGfx.fillRect(qx - 1, qy - 32, 2, 14);
    this.quiverGfx.fillStyle(0x4aa6de, 0.95); // Azure feather
    this.quiverGfx.fillTriangle(qx - 2, qy - 22, qx + 1, qy - 34, qx + 3, qy - 22);

    // Arrow 3 (Right feather)
    this.quiverGfx.fillStyle(0xecdcb5, 1);
    this.quiverGfx.fillRect(qx + 2, qy - 29, 2, 11);
    this.quiverGfx.fillStyle(0xffffff, 0.95);
    this.quiverGfx.fillTriangle(qx + 1, qy - 20, qx + 4, qy - 31, qx + 5, qy - 20);
  }

  private drawHead(breath: number) {
    this.head.clear();
    const isSkeleton = this.archetype === 'skeleton_scout';
    const isPlayer = !this.isEnemy;
    const isBoss =
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'infernal_warlord';

    if (isSkeleton) {
      // Skull
      this.head.fillStyle(0xdcdfc9, 1);
      this.head.fillCircle(0, -48 + breath, 12);
      this.head.fillRect(-6, -40 + breath, 12, 8);
      // Red glowing eye sockets
      this.head.fillStyle(0xff2b2b, 1);
      this.head.fillCircle(this.facingRight ? 4 : -4, -48 + breath, 2.5);
      this.head.fillCircle(this.facingRight ? -2 : 2, -48 + breath, 2);
      return;
    }

    if (isPlayer) {
      // --- REALISTIC HEROIC ARCHER HEAD & FACE (Themed by equipped Hero) ---
      const hero = saveManager.getEquippedHero();
      const skinTone = 0xf5caa2;
      const shadowSkin = 0xdb9f76;
      const hairDark = hero.hairColor;
      const hairMid = Phaser.Display.Color.IntegerToColor(hero.hairColor).brighten(18).color;
      const hairLight = Phaser.Display.Color.IntegerToColor(hero.hairColor).brighten(35).color;

      // 1. Muscular neck with shaded throat & leather collar gorget
      this.head.fillStyle(shadowSkin, 1);
      this.head.fillRect(-4.5, -42 + breath, 9, 8);
      this.head.fillStyle(hero.cowlColor, 1); // Gorget
      this.head.fillRoundedRect(-6, -39 + breath, 12, 5, 2);

      // 2. Sculpted Head & Jawline
      this.head.fillStyle(skinTone, 1);
      this.head.fillCircle(0, -49 + breath, 11.5);

      // Chiseled jaw contour in profile
      this.head.beginPath();
      this.head.moveTo(-8, -48 + breath);
      this.head.lineTo(this.facingRight ? 6 : -6, -40 + breath); // Chin
      this.head.lineTo(this.facingRight ? 9 : -9, -46 + breath); // Jaw angle
      this.head.fillPath();

      // Subtle cheekbone & nose contour
      const noseX = this.facingRight ? 8.5 : -8.5;
      this.head.fillStyle(skinTone, 1);
      this.head.fillTriangle(
        this.facingRight ? 6 : -6,
        -51 + breath,
        noseX,
        -48 + breath,
        this.facingRight ? 6 : -6,
        -47 + breath
      );

      // Determined archer lips
      this.head.lineStyle(1.4, shadowSkin, 1);
      this.head.lineBetween(
        this.facingRight ? 4 : -4,
        -44 + breath,
        this.facingRight ? 7 : -7,
        -44 + breath
      );

      // 3. Realistic Aiming Eye (Eagle-eyed focus with Hero's custom eye glow)
      const eyeX = this.facingRight ? 4.5 : -4.5;
      const eyeY = -49.5 + breath;

      // Sclera (White)
      this.head.fillStyle(0xf7f9fb, 1);
      this.head.fillEllipse(eyeX, eyeY, 4.5, 2.8);
      // Iris (Hero's unique elemental eye color)
      this.head.fillStyle(hero.eyeColor, 1);
      this.head.fillCircle(this.facingRight ? eyeX + 0.8 : eyeX - 0.8, eyeY, 1.6);
      // Pupil (Deep black)
      this.head.fillStyle(0x040b12, 1);
      this.head.fillCircle(this.facingRight ? eyeX + 0.8 : eyeX - 0.8, eyeY, 0.9);
      // Specular highlight glint
      this.head.fillStyle(0xffffff, 1);
      this.head.fillCircle(this.facingRight ? eyeX + 1.2 : eyeX - 1.2, eyeY - 0.7, 0.6);

      // Sharp aiming eyebrow
      this.head.lineStyle(2, hairDark, 1);
      this.head.lineBetween(eyeX - 3.5, eyeY - 3.5, eyeX + 3.5, eyeY - 2.8);

      // 4. Layered Ranger Cowl / Hood (Hero's unique cowl & trim colors)
      this.head.fillStyle(hero.cowlColor, 1); // Deep cowl base
      this.head.beginPath();
      this.head.arc(0, -51 + breath, 14.5, Math.PI, 0, false);
      this.head.lineTo(this.facingRight ? -11 : 11, -38 + breath);
      this.head.lineTo(this.facingRight ? -16 : 16, -44 + breath);
      this.head.fillPath();

      // Cowl fold trim
      this.head.lineStyle(1.8, hero.trimColor, 0.9);
      this.head.strokePath();

      // Leather Ranger Headband / Circlet with hero's crest
      this.head.lineStyle(2.5, 0x472f1c, 1);
      this.head.lineBetween(this.facingRight ? -9 : 9, -54 + breath, this.facingRight ? 8 : -8, -52 + breath);
      this.head.fillStyle(hero.trimColor, 1);
      this.head.fillCircle(this.facingRight ? 0 : 0, -53 + breath, 2);

      // 5. Windswept Hair Strands Framing Face
      this.head.fillStyle(hairDark, 1);
      this.head.fillTriangle(
        this.facingRight ? 1 : -1,
        -56 + breath,
        this.facingRight ? 10 : -10,
        -51 + breath,
        this.facingRight ? 2 : -2,
        -48 + breath
      );
      this.head.fillStyle(hairMid, 1);
      this.head.fillTriangle(
        this.facingRight ? -2 : 2,
        -55 + breath,
        this.facingRight ? 7 : -7,
        -49 + breath,
        this.facingRight ? 1 : -1,
        -46 + breath
      );
      this.head.fillStyle(hairLight, 0.85);
      this.head.lineStyle(1.2, hairLight, 0.9);
      this.head.lineBetween(
        this.facingRight ? -3 : 3,
        -54 + breath,
        this.facingRight ? 4 : -4,
        -50 + breath
      );
      return;
    }

    // Enemy Head (Armored Guard / Frost / Bosses)
    const skinColor = 0xbda995;
    const helmColor =
      this.archetype === 'infernal_warlord'
        ? 0x241111
        : this.archetype === 'frost_overlord'
        ? 0x2b5472
        : isBoss
        ? 0x54472c
        : 0x2d3a44;

    this.head.fillStyle(skinColor, 1);
    this.head.fillCircle(0, -48 + breath, 11);

    // Greathelm / Visor
    this.head.fillStyle(helmColor, 1);
    this.head.beginPath();
    this.head.arc(0, -50 + breath, 14, Math.PI, 0, false);
    this.head.lineTo(this.facingRight ? 8 : -8, -42 + breath);
    this.head.lineTo(this.facingRight ? -8 : 8, -42 + breath);
    this.head.closePath();
    this.head.fillPath();

    // Glowing Eyes / Visor Slit
    const eyeGlow = this.isEnemy ? (isBoss ? 0xff4d29 : 0x76deff) : 0x69dbff;
    this.head.fillStyle(eyeGlow, 1);
    const eyeX = this.facingRight ? 3 : -3;
    this.head.fillRoundedRect(eyeX - 4, -49 + breath, 8, 3, 1);

    // Horns / Crown for Bosses
    if (isBoss) {
      this.head.fillStyle(0xffbf47, 1);
      this.head.fillTriangle(-15, -60 + breath, -6, -50 + breath, -18, -43 + breath);
      this.head.fillTriangle(15, -60 + breath, 6, -50 + breath, 18, -43 + breath);
    }
  }

  private drawCape(flutter: number) {
    this.cape.clear();
    if (this.archetype === 'skeleton_scout') return;

    const hero = !this.isEnemy ? saveManager.getEquippedHero() : null;
    const capeColor = !this.isEnemy
      ? (hero ? hero.capeColor : 0x0c1b28)
      : this.archetype === 'infernal_warlord'
      ? 0x821616
      : this.archetype === 'frost_overlord'
      ? 0x1d4665
      : 0x3d1c1c;

    const trimColor = !this.isEnemy && hero ? hero.trimColor : 0x5a7a8a;
    const dir = this.facingRight ? -1 : 1;

    // Layer 1: Dark inner lining shadow (slightly narrower, offset inward)
    this.cape.fillStyle(0x030a10, 0.55);
    this.cape.fillPoints(
      [
        { x: -5, y: -32 },
        { x: 5, y: -32 },
        { x: dir * 18 + flutter * 0.5, y: 14 },
        { x: dir * 24 + flutter * 1.1, y: 34 },
        { x: dir * 10 + flutter * 0.6, y: 37 },
        { x: 0, y: 2 },
      ],
      true
    );

    // Layer 2: Main cape body with cloth ripple segmentation
    this.cape.fillStyle(capeColor, 0.92);
    this.cape.fillPoints(
      [
        { x: -7, y: -34 },
        { x: 7, y: -34 },
        { x: dir * 11 + flutter * 0.3, y: -8 },      // Upper shoulder flare
        { x: dir * 28 + flutter, y: 10 },              // Mid upper
        { x: dir * 32 + flutter * 1.4, y: 26 },        // Mid lower
        { x: dir * 36 + flutter * 1.65, y: 36 },       // Hem corner
        { x: dir * 18 + flutter * 0.95, y: 40 },       // Hem center
        { x: dir * 5 + flutter * 0.3, y: 37 },         // Hem inner
        { x: 0, y: 0 },
      ],
      true
    );

    // Layer 3: Cloth fold highlight seam (bright rim along leading edge)
    this.cape.lineStyle(1.4, trimColor, 0.55);
    this.cape.beginPath();
    this.cape.moveTo(dir * 11 + flutter * 0.3, -8);
    this.cape.lineTo(dir * 28 + flutter, 10);
    this.cape.lineTo(dir * 36 + flutter * 1.65, 36);
    this.cape.strokePath();

    // Layer 4: Subtle mid-crease shadow fold for cloth depth
    this.cape.lineStyle(1.0, 0x010608, 0.4);
    this.cape.beginPath();
    this.cape.moveTo(dir * 8 + flutter * 0.15, -20);
    this.cape.lineTo(dir * 20 + flutter * 0.8, 15);
    this.cape.lineTo(dir * 22 + flutter * 1.1, 33);
    this.cape.strokePath();
  }

  private drawBow(aimAngle: number, power: number) {
    this.bow.clear();
    this.bowArm.clear();
    this.stringArm.clear();

    const equippedSkin = saveManager.getEquippedBow();
    const bowColor = !this.isEnemy ? equippedSkin.color : this.isEnemy ? 0x6e4c34 : 0x9c653a;
    const trimColor = !this.isEnemy ? equippedSkin.trimColor : 0xdfcead;
    const stringColor = 0xfaf4e8;
    const dir = this.facingRight ? 1 : -1;

    // Shoulder anchor (pivot for archery biomechanics)
    const shoulderX = dir * 10;
    const shoulderY = -30;
    const angle = this.facingRight ? -aimAngle : Math.PI + aimAngle;
    const perpAngle = angle + Math.PI / 2;

    // Grip Position (where the bow hand holds the riser)
    const gripDist = 30;
    const gripX = shoulderX + Math.cos(angle) * gripDist;
    const gripY = shoulderY + Math.sin(angle) * gripDist;

    // --- 1. EXTENDED BOW ARM & LEATHER BRACER ---
    // Bow arm reaching forward to grip the riser
    this.bowArm.lineStyle(6.5, !this.isEnemy ? 0x182c3f : 0x273540, 1);
    this.bowArm.lineBetween(shoulderX, shoulderY, gripX, gripY);

    // Leather archer's bracer / vambrace (guards forearm from bowstring slap)
    const bracerStartX = shoulderX + (gripX - shoulderX) * 0.35;
    const bracerStartY = shoulderY + (gripY - shoulderY) * 0.35;
    const bracerEndX = shoulderX + (gripX - shoulderX) * 0.8;
    const bracerEndY = shoulderY + (gripY - shoulderY) * 0.8;
    this.bowArm.lineStyle(8.5, 0x472e1c, 1);
    this.bowArm.lineBetween(bracerStartX, bracerStartY, bracerEndX, bracerEndY);
    // Bracer buckle straps
    this.bowArm.lineStyle(2, 0xdba43b, 0.9);
    this.bowArm.lineBetween(bracerStartX, bracerStartY, bracerStartX, bracerStartY);
    this.bowArm.lineBetween(bracerEndX, bracerEndY, bracerEndX, bracerEndY);

    // Bow hand (left hand) gripping riser: fingers wrapped around handle
    this.bowArm.fillStyle(0x382214, 1); // Leather shooting glove
    this.bowArm.fillCircle(gripX, gripY, 5);
    this.bowArm.fillStyle(0xf5caa2, 1); // Finger knuckles
    this.bowArm.fillCircle(gripX + Math.cos(perpAngle) * 2, gripY + Math.sin(perpAngle) * 2, 2.2);

    // --- 2. AUTHENTIC LAMINATED RECURVE BOW ---
    const bowHalfLen = 42;
    // Limb flexion under draw tension: tips bend backward as power increases
    const limbFlex = power * 14;
    const recurveCurve = 11 - power * 6; // Recurve tips straighten under high draw tension

    // Upper limb points: Riser -> Mid Working Limb -> Recurve Curve -> Nock Tip
    const upperMidX = gripX + Math.cos(perpAngle) * (bowHalfLen * 0.55) - Math.cos(angle) * (4 + limbFlex * 0.5);
    const upperMidY = gripY + Math.sin(perpAngle) * (bowHalfLen * 0.55) - Math.sin(angle) * (4 + limbFlex * 0.5);

    const upperTipX = gripX + Math.cos(perpAngle) * bowHalfLen + Math.cos(angle) * (recurveCurve - limbFlex);
    const upperTipY = gripY + Math.sin(perpAngle) * bowHalfLen + Math.sin(angle) * (recurveCurve - limbFlex);

    // Lower limb points
    const lowerMidX = gripX - Math.cos(perpAngle) * (bowHalfLen * 0.55) - Math.cos(angle) * (4 + limbFlex * 0.5);
    const lowerMidY = gripY - Math.sin(perpAngle) * (bowHalfLen * 0.55) - Math.sin(angle) * (4 + limbFlex * 0.5);

    const lowerTipX = gripX - Math.cos(perpAngle) * bowHalfLen + Math.cos(angle) * (recurveCurve - limbFlex);
    const lowerTipY = gripY - Math.sin(perpAngle) * bowHalfLen + Math.sin(angle) * (recurveCurve - limbFlex);

    // Stave belly (Primary Wood / Carbon Laminate)
    this.bow.lineStyle(5.2, bowColor, 1);
    this.bow.lineBetween(gripX, gripY, upperMidX, upperMidY);
    this.bow.lineBetween(upperMidX, upperMidY, upperTipX, upperTipY);
    this.bow.lineBetween(gripX, gripY, lowerMidX, lowerMidY);
    this.bow.lineBetween(lowerMidX, lowerMidY, lowerTipX, lowerTipY);

    // Stave back highlight (Laminated belly lining)
    this.bow.lineStyle(1.6, trimColor, 0.85);
    this.bow.lineBetween(upperMidX, upperMidY, upperTipX, upperTipY);
    this.bow.lineBetween(lowerMidX, lowerMidY, lowerTipX, lowerTipY);

    // Sculpted Central Riser (Wooden handle + Leather wrap)
    this.bow.lineStyle(7, 0x2b190f, 1);
    this.bow.lineBetween(
      gripX - Math.cos(perpAngle) * 7,
      gripY - Math.sin(perpAngle) * 7,
      gripX + Math.cos(perpAngle) * 7,
      gripY + Math.sin(perpAngle) * 7
    );
    // Arrow Shelf Notch on Riser
    this.bow.fillStyle(0xdba43b, 1);
    this.bow.fillCircle(gripX + Math.cos(angle) * 3, gripY + Math.sin(angle) * 3, 2);

    // Horn nock tips for bowstring loops
    this.bow.fillStyle(0x1a232c, 1);
    this.bow.fillCircle(upperTipX, upperTipY, 3.2);
    this.bow.fillCircle(lowerTipX, lowerTipY, 3.2);
    this.bow.fillStyle(trimColor, 1);
    this.bow.fillCircle(upperTipX, upperTipY, 1.8);
    this.bow.fillCircle(lowerTipX, lowerTipY, 1.8);

    // --- 3. DYNAMIC BOWSTRING & ANCHOR POINT ---
    // Nock distance pulled back along aim angle
    const nockDist = 6 + power * 26;
    const nockX = gripX - Math.cos(angle) * nockDist;
    const nockY = gripY - Math.sin(angle) * nockDist;

    // Braided bowstring forming authentic acute V-shape under draw
    this.bow.lineStyle(1.8, stringColor, 0.95);
    this.bow.lineBetween(upperTipX, upperTipY, nockX, nockY);
    this.bow.lineBetween(nockX, nockY, lowerTipX, lowerTipY);

    // Center bowstring serving thread (protective wrap around nock point)
    this.bow.lineStyle(3, 0x1f1f1f, 1);
    this.bow.lineBetween(
      nockX - Math.cos(perpAngle) * 3,
      nockY - Math.sin(perpAngle) * 3,
      nockX + Math.cos(perpAngle) * 3,
      nockY + Math.sin(perpAngle) * 3
    );

    // --- 4. DRAW ARM & MEDITERRANEAN 3-FINGER HOOK ---
    // Draw elbow elevated in correct archery posture
    const elbowX = shoulderX - dir * (8 + power * 14);
    const elbowY = shoulderY - 4 - power * 5;

    this.stringArm.lineStyle(6, !this.isEnemy ? 0x16293a : 0x22303c, 1);
    this.stringArm.lineBetween(shoulderX, shoulderY, elbowX, elbowY); // Upper arm
    this.stringArm.lineBetween(elbowX, elbowY, nockX, nockY); // Forearm

    // Draw hand: 3-finger shooting tab hooked around string
    this.stringArm.fillStyle(0x382214, 1);
    this.stringArm.fillCircle(nockX, nockY, 4.5);
    // Index finger above nock, middle & ring below nock
    this.stringArm.fillStyle(0xf5caa2, 1);
    this.stringArm.fillCircle(nockX + Math.cos(perpAngle) * 2.5, nockY + Math.sin(perpAngle) * 2.5, 1.8);
    this.stringArm.fillCircle(nockX - Math.cos(perpAngle) * 1.5, nockY - Math.sin(perpAngle) * 1.5, 1.8);
    this.stringArm.fillCircle(nockX - Math.cos(perpAngle) * 3.5, nockY - Math.sin(perpAngle) * 3.5, 1.8);

    // --- 5. NOCKED ARROW SEATED ON THE BOW SHELF ---
    if (power > 0.03) {
      const arrowLen = 38;
      const arrowTipX = nockX + Math.cos(angle) * arrowLen;
      const arrowTipY = nockY + Math.sin(angle) * arrowLen;

      // Cedar wood shaft
      this.bow.lineStyle(2.8, 0xd4bc89, 1);
      this.bow.lineBetween(nockX, nockY, arrowTipX, arrowTipY);
      // Fine woodgrain highlight line
      this.bow.lineStyle(1.1, 0xf6edd7, 0.9);
      this.bow.lineBetween(nockX, nockY, arrowTipX, arrowTipY);

      // Steel broadhead hunting tip
      this.bow.fillStyle(0xd5e2ea, 1);
      const tipPerpX = Math.cos(perpAngle) * 3.5;
      const tipPerpY = Math.sin(perpAngle) * 3.5;
      this.bow.fillTriangle(
        arrowTipX + Math.cos(angle) * 7,
        arrowTipY + Math.sin(angle) * 7,
        arrowTipX - Math.cos(angle) * 2 + tipPerpX,
        arrowTipY - Math.sin(angle) * 2 + tipPerpY,
        arrowTipX - Math.cos(angle) * 2 - tipPerpX,
        arrowTipY - Math.sin(angle) * 2 - tipPerpY
      );

      // Feather fletchings at nock (between drawing fingers)
      this.bow.fillStyle(0xffffff, 0.95);
      this.bow.fillTriangle(
        nockX,
        nockY,
        nockX - Math.cos(angle) * 6 + tipPerpX * 1.5,
        nockY - Math.sin(angle) * 6 + tipPerpY * 1.5,
        nockX - Math.cos(angle) * 6,
        nockY - Math.sin(angle) * 6
      );
    }
  }

  public drawShield(blockState: number) {
    this.shieldGfx.clear();
    this.shieldBarrierGfx.clear();

    const dir = this.facingRight ? 1 : -1;
    const isPlayer = !this.isEnemy;

    // Determine colors and style based on player's equipped shield or enemy archetype
    let mainColor = 0x273642;
    let rimColor = 0x698ba2;
    let bossColor = 0xffbf47;
    let barrierColor = 0x5cd5ff;
    let shieldType = 'kite';

    if (isPlayer) {
      const eq = saveManager.getEquippedShield();
      if (eq.id === 'wooden_buckler') {
        mainColor = 0x6e4321;
        rimColor = 0xb08850;
        bossColor = 0xd9b36c;
        barrierColor = 0xffc466;
        shieldType = 'buckler';
      } else if (eq.id === 'iron_kite') {
        mainColor = 0x334454;
        rimColor = 0x7a9bb8;
        bossColor = 0xf5cf47;
        barrierColor = 0x5cd5ff;
        shieldType = 'kite';
      } else if (eq.id === 'frost_barrier') {
        mainColor = 0x246282;
        rimColor = 0x9be8ff;
        bossColor = 0xdbf7ff;
        barrierColor = 0x69ddff;
        shieldType = 'frost';
      } else if (eq.id === 'caldera_bulwark') {
        mainColor = 0x261212;
        rimColor = 0xff5329;
        bossColor = 0xffaa26;
        barrierColor = 0xff481f;
        shieldType = 'caldera';
      } else if (eq.id === 'desert_scarab') {
        mainColor = 0x634b17;
        rimColor = 0xffd54f;
        bossColor = 0x1dd3b0;
        barrierColor = 0xffdf78;
        shieldType = 'scarab';
      } else if (eq.id === 'void_ward') {
        mainColor = 0x1a0026;
        rimColor = 0xca47ff;
        bossColor = 0xff54d9;
        barrierColor = 0xff00ff;
        shieldType = 'void';
      }
    } else {
      if (this.archetype === 'frost_overlord') {
        mainColor = 0x246282;
        rimColor = 0x9be8ff;
        bossColor = 0xdbf7ff;
        barrierColor = 0x69ddff;
        shieldType = 'frost';
      } else if (this.archetype === 'storm_warden') {
        mainColor = 0x1d3652;
        rimColor = 0xffea38;
        bossColor = 0xffea38;
        barrierColor = 0xffe533;
        shieldType = 'kite';
      } else if (this.archetype === 'void_harbinger') {
        mainColor = 0x1a0026;
        rimColor = 0xff00ff;
        bossColor = 0xff88ff;
        barrierColor = 0xff00ff;
        shieldType = 'void';
      }
    }

    // Position of shield (slung at side when idle, raised forward when blocking)
    const isRaised = blockState > 0.05;
    const shieldX = dir * (isRaised ? 18 + blockState * 10 : (isPlayer ? -14 : 15));
    const shieldY = isRaised ? -24 : (isPlayer ? -18 : -22);

    if (shieldType === 'buckler') {
      // Round buckler
      this.shieldGfx.fillStyle(mainColor, 1);
      this.shieldGfx.lineStyle(2.5, rimColor, 1);
      this.shieldGfx.fillCircle(shieldX, shieldY, 15);
      this.shieldGfx.strokeCircle(shieldX, shieldY, 15);
      this.shieldGfx.fillStyle(bossColor, 1);
      this.shieldGfx.fillCircle(shieldX, shieldY, 5);
    } else if (shieldType === 'scarab') {
      // Oval gilded scarab
      this.shieldGfx.fillStyle(mainColor, 1);
      this.shieldGfx.lineStyle(2.5, rimColor, 1);
      this.shieldGfx.fillEllipse(shieldX, shieldY, 20, 36);
      this.shieldGfx.strokeEllipse(shieldX, shieldY, 20, 36);
      this.shieldGfx.fillStyle(bossColor, 1);
      this.shieldGfx.fillCircle(shieldX, shieldY, 6);
    } else {
      // Heavy embossed kite / tower
      this.shieldGfx.fillStyle(mainColor, 1);
      this.shieldGfx.lineStyle(2, rimColor, 1);
      this.shieldGfx.fillRoundedRect(shieldX - 8, shieldY - 26, 16, 52, 4);
      this.shieldGfx.strokeRoundedRect(shieldX - 8, shieldY - 26, 16, 52, 4);
      this.shieldGfx.fillStyle(bossColor, 1);
      this.shieldGfx.fillCircle(shieldX, shieldY, 5.5);
    }

    // Runic Forcefield Barrier when blocking
    if (blockState > 0.1) {
      this.shieldBarrierGfx.lineStyle(3, barrierColor, blockState * 0.9);
      this.shieldBarrierGfx.fillStyle(barrierColor, blockState * 0.25);

      const barrierX = shieldX + dir * 8;
      const r = 42;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const rad = (i * 60 * Math.PI) / 180;
        points.push({ x: barrierX + Math.cos(rad) * r, y: shieldY + Math.sin(rad) * r });
      }
      this.shieldBarrierGfx.fillPoints(points, true);
      this.shieldBarrierGfx.strokePoints(points, true);
    }
  }

  // In-World Floating Health Bar with Hardening Level Badge
  private drawInWorldHealthBar() {
    this.inWorldHpBar.clear();
    if (!this.isEnemy || this.animState === 'dead') return;

    const isBoss =
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'infernal_warlord';

    const barW = isBoss ? 74 : 60;
    const barH = isBoss ? 7 : 5.5;
    const barX = -barW / 2;
    const barY = -74;

    const hpRatio = Math.max(0, Math.min(1, this.currentHp / this.maxHp));

    // Level & Hardening Pill above Health Bar
    const badgeW = isBoss ? 48 : 34;
    const badgeH = 8;
    const badgeX = -badgeW / 2;
    const badgeY = barY - 11;

    const badgeBg = isBoss
      ? 0x593d0c
      : this.stageLevel >= 8
      ? 0x3d174e
      : this.stageLevel >= 4
      ? 0x1f3445
      : 0x0f212f;
    const badgeBorder = isBoss
      ? 0xffbd3d
      : this.stageLevel >= 8
      ? 0xb76ef5
      : this.stageLevel >= 4
      ? 0x56a6d6
      : 0x3b6685;

    this.inWorldHpBar.fillStyle(badgeBg, 0.95);
    this.inWorldHpBar.lineStyle(1, badgeBorder, 0.95);
    this.inWorldHpBar.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 2);
    this.inWorldHpBar.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 2);

    // Dark border & backing
    this.inWorldHpBar.fillStyle(0x060f17, 0.9);
    this.inWorldHpBar.lineStyle(1.5, 0x2f4c62, 0.9);
    this.inWorldHpBar.fillRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
    this.inWorldHpBar.strokeRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);

    // Red / Gold Fill
    const fillColor = isBoss
      ? 0xffaa2b
      : this.stageLevel >= 8
      ? 0xdf38b7
      : 0xed3d46;
    this.inWorldHpBar.fillStyle(fillColor, 1);
    this.inWorldHpBar.fillRoundedRect(barX, barY, barW * hpRatio, barH, 2);
  }

  // --- ACTIONS & ANIMATIONS ---

  public aim(angle: number, power: number) {
    if (this.animState === 'dead') return;
    this.animState = 'aiming';
    this.aimAngle = angle;
    this.drawPower = Phaser.Math.Clamp(power, 0, 1);
  }

  public shootRecoil() {
    if (this.animState === 'dead') return;
    this.animState = 'recoil';
    this.recoilTimer = 0.2;
    this.drawPower = 0;
  }

  public triggerHit(part: BodyPartHit, isCritical: boolean) {
    if (this.animState === 'dead') return;
    this.animState = 'hit';
    this.hitTimer = 0.25;

    // Flinch flash & twitch
    const flinchDir = this.facingRight ? -1 : 1;
    this.container.setAlpha(0.65);
    this.scene.tweens.add({
      targets: this.container,
      x: this.x + flinchDir * (isCritical ? 18 : 8),
      angle: flinchDir * (part === 'head' ? 14 : 6),
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.container.setAlpha(1.0);
        this.container.setAngle(0);
        this.container.setPosition(this.x, this.y);
      },
    });
  }

  public triggerBlock() {
    if (this.animState === 'dead') return;
    this.animState = 'block';
    this.blockProgress = 1.0;
    this.scene.tweens.add({
      targets: this,
      blockProgress: 0,
      duration: 650,
      ease: 'Power2',
    });
  }

  public triggerDodge(distance: number = 70, arenaWidth?: number) {
    if (this.animState === 'dead') return;
    this.animState = 'dodge';
    let dodgeDir = this.facingRight ? -1 : 1;

    // Keep dodges inside the arena. If the preferred direction would push the
    // character past a wall, dodge the OTHER way (toward the opponent) instead.
    const bounds = arenaWidth ?? this.scene.scale.width;
    const margin = 48 * this.baseScale;
    const target = this.container.x + dodgeDir * distance;
    if (target < margin || target > bounds - margin) {
      dodgeDir *= -1;
    }

    // Ghost trail
    const ghost = this.scene.add.container(this.container.x, this.container.y).setScale(this.baseScale).setAlpha(0.6);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: this.baseScale * 1.2,
      duration: 250,
      onComplete: () => ghost.destroy(),
    });

    const clampedTargetX = Phaser.Math.Clamp(
      this.container.x + dodgeDir * distance,
      margin,
      bounds - margin
    );
    this.scene.tweens.add({
      targets: this.container,
      x: clampedTargetX,
      duration: 180,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.container.setPosition(this.x, this.y);
        this.animState = 'idle';
      },
    });
  }

  public triggerRagdollDeath(impulseX: number, impulseY: number, hitPart: BodyPartHit) {
    this.animState = 'dead';
    this.container.setVisible(false);

    this.ragdoll.setScale(this.baseScale);
    this.ragdoll.setPose(this.container.x, this.container.y, this.facingRight);

    let targetNode = 'torso';
    if (hitPart === 'head') targetNode = 'head';
    if (hitPart === 'legs') targetNode = 'leftFoot';

    this.ragdoll.activate(impulseX, impulseY, targetNode);
  }

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y).setVisible(true).setAlpha(1).setAngle(0);
    this.animState = 'idle';
    this.drawPower = 0;
    this.aimAngle = 0;
    this.ragdoll.isActive = false;
    this.ragdollGraphics.clear();
    this.renderEquipment();
  }

  public update(dt: number, groundY: number, arenaWidth: number) {
    if (this.animState === 'dead') {
      this.ragdoll.update(dt, arenaWidth, groundY);
      const isSkeleton = this.archetype === 'skeleton_scout';
      this.ragdoll.render(this.ragdollGraphics, {
        body: isSkeleton ? 0xdadcc5 : this.isEnemy ? 0x334450 : 0x1b354d,
        limb: isSkeleton ? 0xb5b79e : this.isEnemy ? 0x283640 : 0x162c3e,
        head: isSkeleton ? 0xe5e7d2 : this.isEnemy ? 0xbda995 : 0xf2c49e,
      });
      return;
    }

    // Safety clamp: if a tween, hit flinch, or dodge ever leaves the character
    // outside the arena, snap them back in before the frame renders.
    const margin = 36 * this.baseScale;
    if (this.container.x < margin) this.container.x = margin;
    else if (this.container.x > arenaWidth - margin) this.container.x = arenaWidth - margin;

    this.idleTimer += dt;

    if (this.animState === 'recoil') {
      this.recoilTimer -= dt;
      if (this.recoilTimer <= 0) {
        this.animState = 'idle';
      }
    } else if (this.animState === 'hit') {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) {
        this.animState = 'idle';
      }
    }

    // Multi-frequency organic breathing (primary chest + secondary shoulder micro-tremor)
    const t = this.idleTimer;
    const breath = Math.sin(t * 3.2) * 1.6 + Math.sin(t * 7.1) * 0.35;

    // Weight shift idle bob — heels rise/fall slightly in archery stance
    const walkOffset = Math.sin(t * 2.8) * 1.2;
    const crouch = Math.sin(t * 2.8) * 0.8;

    // Cape multi-frequency wind flutter (primary sway + high-freq ripple edge)
    const capeFlutter = Math.sin(t * 4.2) * 3.2 + Math.sin(t * 9.1) * 0.9;

    // Shadow pulses subtly with breath expansion
    this.drawShadow(1.0 + Math.sin(t * 3.2) * 0.04);
    this.drawDangerAura(t);
    this.drawBackupSilhouette(t);
    this.drawLegs(walkOffset, crouch);
    this.drawTorso(breath);
    this.drawHead(breath);
    this.drawCape(capeFlutter);
    this.drawBow(this.aimAngle, this.drawPower);
    this.drawInWorldHealthBar();

    if (
      !this.isEnemy ||
      this.archetype === 'fortress_guard' ||
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'storm_warden' ||
      this.archetype === 'void_harbinger'
    ) {
      this.drawShield(this.blockProgress);
    }
  }

  public getArrowLaunchPosition(aimAngle: number, power: number): { x: number; y: number } {
    const dir = this.facingRight ? 1 : -1;
    const shoulderX = this.container.x + dir * 10 * this.baseScale;
    const shoulderY = this.container.y - 30 * this.baseScale;
    const angle = this.facingRight ? -aimAngle : Math.PI + aimAngle;

    const gripDist = 30 * this.baseScale;
    const gripX = shoulderX + Math.cos(angle) * gripDist;
    const gripY = shoulderY + Math.sin(angle) * gripDist;

    const nockDist = (6 + power * 26) * this.baseScale;
    const nockX = gripX - Math.cos(angle) * nockDist;
    const nockY = gripY - Math.sin(angle) * nockDist;

    const arrowLen = 38 * this.baseScale;
    const tipX = nockX + Math.cos(angle) * arrowLen;
    const tipY = nockY + Math.sin(angle) * arrowLen;

    return { x: tipX, y: tipY };
  }

  public checkBodyPartHit(x1: number, y1: number, x2?: number, y2?: number): BodyPartHit | null {
    if (this.animState === 'dead') return null;

    const px = x2 ?? x1;
    const py = y2 ?? y1;
    const oldX = x1;
    const oldY = y1;

    const s = this.baseScale;
    const cx = this.container.x;
    const cy = this.container.y;

    const hasShield =
      this.blockProgress > 0.2 ||
      this.archetype === 'fortress_guard' ||
      this.archetype === 'fortress_champion' ||
      this.archetype === 'frost_overlord' ||
      this.archetype === 'storm_warden' ||
      this.archetype === 'void_harbinger';

    const dir = this.facingRight ? 1 : -1;

    // 1. Check Shield
    if (hasShield) {
      const shieldLeft = cx + (dir > 0 ? 4 : -28) * s;
      const shieldTop = cy - 48 * s;
      const shieldW = 24 * s;
      const shieldH = 60 * s;

      if (this.segmentIntersectsRect(oldX, oldY, px, py, shieldLeft, shieldTop, shieldW, shieldH)) {
        return 'shield';
      }
    }

    // 2. Check Head (Circle)
    const headX = cx;
    const headY = cy - 48 * s;
    const headRadius = 18 * s;
    if (this.segmentIntersectsCircle(oldX, oldY, px, py, headX, headY, headRadius)) {
      return 'head';
    }

    // 3. Check Torso (Rect)
    const torsoLeft = cx - 18 * s;
    const torsoTop = cy - 38 * s;
    const torsoW = 36 * s;
    const torsoH = 40 * s;
    if (this.segmentIntersectsRect(oldX, oldY, px, py, torsoLeft, torsoTop, torsoW, torsoH)) {
      return 'torso';
    }

    // 4. Check Legs (Rect)
    const legsLeft = cx - 16 * s;
    const legsTop = cy + 2 * s;
    const legsW = 32 * s;
    const legsH = 42 * s;
    if (this.segmentIntersectsRect(oldX, oldY, px, py, legsLeft, legsTop, legsW, legsH)) {
      return 'legs';
    }

    return null;
  }

  private segmentIntersectsCircle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    r: number
  ): boolean {
    const d1 = Math.hypot(x1 - cx, y1 - cy);
    const d2 = Math.hypot(x2 - cx, y2 - cy);
    if (d1 <= r || d2 <= r) return true;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return d1 <= r;

    const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(projX - cx, projY - cy) <= r;
  }

  private segmentIntersectsRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): boolean {
    if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;
    if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;

    const rRight = rx + rw;
    const rBottom = ry + rh;

    return (
      this.linesIntersect(x1, y1, x2, y2, rx, ry, rRight, ry) ||
      this.linesIntersect(x1, y1, x2, y2, rRight, ry, rRight, rBottom) ||
      this.linesIntersect(x1, y1, x2, y2, rRight, rBottom, rx, rBottom) ||
      this.linesIntersect(x1, y1, x2, y2, rx, rBottom, rx, ry)
    );
  }

  private linesIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
}
