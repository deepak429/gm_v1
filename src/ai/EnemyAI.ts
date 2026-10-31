import Phaser from 'phaser';
import { ArcherCharacter } from '../entities/ArcherCharacter';
import { StageConfig } from '../types';

export interface IncomingArrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
}

export class EnemyAI {
  public character: ArcherCharacter;
  public config: StageConfig;
  public isAiming = false;
  public aimProgress = 0; // 0 to 1
  public targetAngle = 0;
  public targetPower = 0.7;
  public shootTimer = 0;
  public turnCooldown = 1.6;
  public isBossEnraged = false;

  constructor(character: ArcherCharacter, config: StageConfig) {
    this.character = character;
    this.config = config;
  }

  public setConfig(config: StageConfig) {
    this.config = config;
    this.isBossEnraged = false;
  }

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    wind: number,
    isFrozen: boolean,
    onShoot: (angle: number, power: number, isMultiShot: boolean) => void
  ) {
    if (this.character.animState === 'dead' || isFrozen) {
      this.isAiming = false;
      this.aimProgress = 0;
      return;
    }

    if (!this.isAiming) {
      this.shootTimer += dt;
      if (this.shootTimer >= this.turnCooldown) {
        this.startAiming(playerX, playerY, wind);
      }
      return;
    }

    // Aiming phase (draw bow smoothly)
    const aimDuration = (this.config.enemyReactionSpeed / 1000) * (this.isBossEnraged ? 0.65 : 1.0);
    this.aimProgress += dt / Math.max(0.4, aimDuration);
    this.character.aim(this.targetAngle, this.aimProgress * this.targetPower);

    if (this.aimProgress >= 1.0) {
      this.isAiming = false;
      this.aimProgress = 0;
      this.shootTimer = 0;
      this.character.shootRecoil();

      const isHighLevel = this.config.id >= 6;
      const isMulti =
        (this.config.isBoss && (this.isBossEnraged || Math.random() < 0.65)) ||
        (isHighLevel && Math.random() < 0.35);
      onShoot(this.targetAngle, this.targetPower, isMulti);
    }
  }

  private startAiming(playerX: number, playerY: number, wind: number) {
    this.isAiming = true;
    this.aimProgress = 0;

    // Calculate ballistic trajectory:
    // Enemy is on the right, Player is on the left
    const dx = this.character.x - playerX; // positive distance to left
    const dy = playerY - this.character.y; // positive if player is below

    const g = 460;
    const v = 560; // Base projectile speed

    // Ballistic formula approximation: theta = 0.5 * asin((g * dx) / v^2)
    const arg = (g * dx) / (v * v);
    let baseAngle = 0.35;
    if (arg > -1 && arg < 1) {
      baseAngle = 0.5 * Math.asin(Phaser.Math.Clamp(arg, 0.1, 0.95)) + 0.1;
    }

    // Adjust for wind
    const windCompensation = wind * 0.45;
    let computedAngle = baseAngle - windCompensation;

    // Apply accuracy inaccuracy based on difficulty
    const errorScale = (1 - this.config.enemyAccuracy) * 0.4;
    const errorAngle = Phaser.Math.FloatBetween(-errorScale, errorScale);

    this.targetAngle = Phaser.Math.Clamp(computedAngle + errorAngle, 0.05, 1.15);
    this.targetPower = Phaser.Math.FloatBetween(0.68, 0.95);
  }

  // React to incoming player arrows
  public inspectIncomingArrow(arrow: IncomingArrow, isFrozen: boolean) {
    if (this.character.animState === 'dead' || isFrozen) return;

    // Check if arrow is heading towards enemy
    const dist = this.character.x - arrow.x;
    if (dist < 0 || dist > 260) return; // Only react when close

    // If arrow is an Arcane arrow, blocking is futile, so AI attempts to dodge instead!
    const isArcane = arrow.type === 'arcane';

    if (this.config.canBlock && !isArcane && Math.random() < 0.75) {
      this.character.triggerBlock();
    } else if (this.config.canDodge && Math.random() < 0.65) {
      this.character.triggerDodge(55, this.character.scene.scale.width);
    }
  }

  public checkEnrage(currentHp: number, maxHp: number) {
    if (this.config.isBoss && currentHp < maxHp * 0.5 && !this.isBossEnraged) {
      this.isBossEnraged = true;
    }
  }
}
